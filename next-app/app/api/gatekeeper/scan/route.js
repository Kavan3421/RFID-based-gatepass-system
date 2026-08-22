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
    const { passCode } = body;

    if (!passCode) {
      return NextResponse.json(
        { success: false, statusCode: 'INVALID', message: 'QR Pass Code is required.' },
        { status: 400 }
      );
    }

    // 1. Fetch pass by code within authenticated organization
    const { data: pass, error: passError } = await supabaseServer
      .from('guest_passes')
      .select('*, destinations(full_name)')
      .eq('organization_id', authUser.organizationId)
      .eq('pass_code', passCode.trim())
      .single();

    if (passError || !pass) {
      return NextResponse.json(
        { success: false, statusCode: 'INVALID', message: 'INVALID: Unknown QR Pass Code.' },
        { status: 404 }
      );
    }

    // 2. Expiration and Status Checks
    const now = new Date();
    const validFrom = new Date(pass.valid_from);
    const validUntil = new Date(pass.valid_until);

    if (pass.status === 'USED') {
      return NextResponse.json(
        {
          success: false,
          statusCode: 'ALREADY_USED',
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
          guestName: pass.guest_name,
          validUntilIso: pass.valid_until,
          message: `EXPIRED: Pass for ${pass.guest_name} expired on ${formattedUntil}!`,
        },
        { status: 400 }
      );
    }

    // 3. Mark Pass as USED
    await supabaseServer
      .from('guest_passes')
      .update({ status: 'USED' })
      .eq('id', pass.id);

    // 4. Record Entry Log automatically
    const destName = pass.destinations ? pass.destinations.full_name : 'General Entry';
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
      message: `VERIFIED: Entry Approved for ${pass.guest_name} (${destName})`,
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
