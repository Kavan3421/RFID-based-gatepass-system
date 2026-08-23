import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyTenantAuth } from '@/lib/auth';

function formatPassDateLocal(isoStr) {
  if (!isoStr) return "";
  const datePart = isoStr.split("T")[0];
  if (datePart && datePart.includes("-")) {
    const [y, m, d] = datePart.split("-").map(Number);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (isoStr.includes("T00:00") || isoStr.includes("T05:30") || isoStr.includes("T18:30")) {
      return `${d} ${months[m - 1]} ${y}, 00:00`;
    }
  }
  const dt = new Date(isoStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hrs = dt.getHours().toString().padStart(2, "0");
  const mins = dt.getMinutes().toString().padStart(2, "0");
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}, ${hrs}:${mins}`;
}

export async function POST(req) {
  try {
    const authUser = await verifyTenantAuth(req, ['GATEKEEPER', 'ADMIN']);
    const body = await req.json();
    const rawCode = body.passCode || body.qr_token;
    const rawScanType = (body.scanType || body.scan_type || 'ENTRY').toUpperCase();

    if (!rawCode) {
      return NextResponse.json(
        { success: false, statusCode: 'INVALID', message: 'QR Pass Code is required.' },
        { status: 400 }
      );
    }

    const passCode = rawCode.trim();

    // 1. Fetch pass by code within authenticated organization
    const { data: pass, error: passError } = await supabaseServer
      .from('guest_passes')
      .select('*, destinations(full_name)')
      .eq('organization_id', authUser.organizationId)
      .eq('pass_code', passCode)
      .single();

    if (passError || !pass) {
      return NextResponse.json(
        { success: false, statusCode: 'INVALID', message: 'INVALID: Unknown QR Pass Code.' },
        { status: 404 }
      );
    }

    const destName = pass.destinations ? pass.destinations.full_name : 'General Entry';

    // ==========================================
    // WORKFLOW 1: EXIT SCAN (scanType === 'EXIT')
    // ==========================================
    if (rawScanType === 'EXIT') {
      // Find active entry log currently INSIDE
      const { data: activeEntryLog } = await supabaseServer
        .from('entry_logs')
        .select('*')
        .eq('organization_id', authUser.organizationId)
        .eq('pass_id', pass.id)
        .eq('status', 'INSIDE')
        .order('entry_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeEntryLog) {
        // Record exit on active log
        const { data: updatedLog, error: updateErr } = await supabaseServer
          .from('entry_logs')
          .update({
            status: 'EXITED',
            exit_time: new Date().toISOString(),
          })
          .eq('id', activeEntryLog.id)
          .select()
          .single();

        if (updateErr || !updatedLog) {
          return NextResponse.json(
            { success: false, statusCode: 'ERROR', message: 'Failed to record exit in database.' },
            { status: 500 }
          );
        }

        // Ensure pass is marked USED
        await supabaseServer
          .from('guest_passes')
          .update({ status: 'USED' })
          .eq('id', pass.id);

        return NextResponse.json({
          success: true,
          statusCode: 'EXIT_RECORDED',
          scanType: 'EXIT',
          message: `EXIT LOGGED: Guest ${pass.guest_name} Checked Out`,
          pass: {
            guestName: pass.guest_name,
            guestPhone: pass.guest_phone,
            destination: destName,
            status: 'EXITED',
          },
          entryLog: updatedLog,
        });
      }

      // If no active INSIDE log, check if they already exited
      const { data: exitedLog } = await supabaseServer
        .from('entry_logs')
        .select('*')
        .eq('organization_id', authUser.organizationId)
        .eq('pass_id', pass.id)
        .eq('status', 'EXITED')
        .order('exit_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (exitedLog) {
        return NextResponse.json(
          {
            success: false,
            statusCode: 'ALREADY_EXITED',
            scanType: 'EXIT',
            guestName: pass.guest_name,
            message: `ALREADY EXITED: Guest ${pass.guest_name} has already checked out / exited campus.`,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          statusCode: 'NO_ENTRY_FOUND',
          scanType: 'EXIT',
          guestName: pass.guest_name,
          message: `NO ENTRY FOUND: Guest ${pass.guest_name} has not checked in or entered campus yet.`,
        },
        { status: 400 }
      );
    }

    // ============================================
    // WORKFLOW 2: ENTRY SCAN (scanType === 'ENTRY')
    // ============================================
    const now = new Date();
    const validFrom = new Date(pass.valid_from);
    const validUntil = new Date(pass.valid_until);

    // Check if guest is already currently inside
    const { data: alreadyInside } = await supabaseServer
      .from('entry_logs')
      .select('id')
      .eq('organization_id', authUser.organizationId)
      .eq('pass_id', pass.id)
      .eq('status', 'INSIDE')
      .limit(1)
      .maybeSingle();

    if (alreadyInside) {
      return NextResponse.json(
        {
          success: false,
          statusCode: 'ALREADY_INSIDE',
          scanType: 'ENTRY',
          guestName: pass.guest_name,
          message: `ALREADY INSIDE: Guest ${pass.guest_name} is already checked in and inside campus!`,
        },
        { status: 400 }
      );
    }

    if (pass.status === 'USED') {
      return NextResponse.json(
        {
          success: false,
          statusCode: 'ALREADY_USED',
          scanType: 'ENTRY',
          guestName: pass.guest_name,
          message: `ALREADY USED: Pass for ${pass.guest_name} was already used!`,
        },
        { status: 400 }
      );
    }

    if (pass.status === 'REVOKED') {
      return NextResponse.json(
        {
          success: false,
          statusCode: 'REVOKED',
          scanType: 'ENTRY',
          guestName: pass.guest_name,
          message: `REVOKED: Pass for ${pass.guest_name} was revoked by resident!`,
        },
        { status: 400 }
      );
    }

    // Pass valid starting in the future
    if (now < validFrom) {
      const formattedFrom = formatPassDateLocal(pass.valid_from);
      return NextResponse.json(
        {
          success: false,
          statusCode: 'NOT_YET_VALID',
          scanType: 'ENTRY',
          guestName: pass.guest_name,
          validFromIso: pass.valid_from,
          validUntilIso: pass.valid_until,
          message: `NOT YET VALID: Pass for ${pass.guest_name} is valid starting ${formattedFrom}!`,
        },
        { status: 400 }
      );
    }

    // Pass expired in the past
    if (now > validUntil) {
      await supabaseServer
        .from('guest_passes')
        .update({ status: 'EXPIRED' })
        .eq('id', pass.id);

      const formattedUntil = formatPassDateLocal(pass.valid_until);
      return NextResponse.json(
        {
          success: false,
          statusCode: 'EXPIRED',
          scanType: 'ENTRY',
          guestName: pass.guest_name,
          validUntilIso: pass.valid_until,
          message: `EXPIRED: Pass for ${pass.guest_name} expired on ${formattedUntil}!`,
        },
        { status: 400 }
      );
    }

    // Mark Pass as USED
    await supabaseServer
      .from('guest_passes')
      .update({ status: 'USED' })
      .eq('id', pass.id);

    // Record Entry Log
    const { data: entryLog } = await supabaseServer
      .from('entry_logs')
      .insert({
        organization_id: authUser.organizationId,
        entry_type: 'GUEST',
        person_name: pass.guest_name,
        phone: pass.guest_phone,
        destinations: [destName],
        gatekeeper_id: authUser.userId,
        pass_id: pass.id,
        status: 'INSIDE',
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      statusCode: 'VERIFIED',
      scanType: 'ENTRY',
      message: `ENTRY APPROVED: Access granted for ${pass.guest_name} (${destName})`,
      pass: {
        guestName: pass.guest_name,
        guestPhone: pass.guest_phone,
        destination: destName,
        status: 'VERIFIED',
      },
      entryLog,
    });
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json(
      { success: false, statusCode: 'ERROR', message: error.message || 'Failed to scan QR pass.' },
      { status }
    );
  }
}
