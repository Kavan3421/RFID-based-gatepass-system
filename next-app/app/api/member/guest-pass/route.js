import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyTenantAuth } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const authUser = await verifyTenantAuth(req, ['MEMBER', 'ADMIN']);
    const body = await req.json();
    const { guestName, guestPhone, destinationId, validDate, validFromIso, durationHours = 12 } = body;

    if (!guestName) {
      return NextResponse.json(
        { success: false, message: 'Guest Name is required.' },
        { status: 400 }
      );
    }

    // Generate secure random pass code
    const passCode = `QGP-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    
    const now = new Date();
    let validFrom = now;
    let isToday = true;

    if (validFromIso) {
      const parsed = new Date(validFromIso);
      if (!isNaN(parsed.getTime())) {
        if (parsed.toDateString() === now.toDateString()) {
          validFrom = now;
          isToday = true;
        } else if (parsed > now) {
          validFrom = parsed;
          isToday = false;
        }
      }
    } else if (validDate) {
      const parts = validDate.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const targetDate = new Date(y, m, d, 0, 0, 0);
        if (targetDate.toDateString() === now.toDateString()) {
          validFrom = now;
          isToday = true;
        } else if (targetDate > now) {
          validFrom = targetDate;
          isToday = false;
        }
      }
    }

    // For passes generated for today: valid for durationHours from current moment (now + durationHours)
    // For future dates: valid from midnight through durationHours or end of that day
    let validUntil;
    if (isToday) {
      validUntil = new Date(now.getTime() + durationHours * 60 * 60 * 1000);
    } else {
      validUntil = new Date(validFrom.getTime() + Math.max(durationHours, 24) * 60 * 60 * 1000);
    }

    const { data: pass, error } = await supabaseServer
      .from('guest_passes')
      .insert({
        organization_id: authUser.organizationId,
        created_by: authUser.userId,
        guest_name: guestName.trim(),
        guest_phone: guestPhone ? guestPhone.trim() : null,
        pass_code: passCode,
        valid_from: validFrom.toISOString(),
        valid_until: validUntil.toISOString(),
        status: 'ACTIVE',
        destination_id: destinationId || null,
      })
      .select('*, destinations(full_name)')
      .single();

    if (error) {
      console.error('Guest pass generation error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to generate guest pass.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Guest pass created successfully!',
      pass,
    });
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json(
      { success: false, message: error.message || 'Error generating pass.' },
      { status }
    );
  }
}

export async function GET(req) {
  try {
    const authUser = await verifyTenantAuth(req, ['MEMBER', 'ADMIN']);

    const { data: passes, error } = await supabaseServer
      .from('guest_passes')
      .select('*, destinations(full_name)')
      .eq('organization_id', authUser.organizationId)
      .eq('created_by', authUser.userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch guest passes.' },
        { status: 500 }
      );
    }

    const now = new Date();
    // Auto-heal any passes where status was incorrectly marked as EXPIRED but valid_until is still in the future
    const processedPasses = (passes || []).map((pass) => {
      const validUntil = new Date(pass.valid_until);
      if (pass.status === 'EXPIRED' && now < validUntil) {
        pass.status = 'ACTIVE';
        supabaseServer.from('guest_passes').update({ status: 'ACTIVE' }).eq('id', pass.id).then();
      }
      return pass;
    });

    return NextResponse.json({
      success: true,
      passes: processedPasses,
    });
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json(
      { success: false, message: error.message || 'Error fetching passes.' },
      { status }
    );
  }
}
