import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyTenantAuth } from '@/lib/auth';

export async function POST(req) {
  try {
    const authUser = await verifyTenantAuth(req, ['GATEKEEPER', 'ADMIN']);
    const body = await req.json();
    const { entryType, personName, phone, companyName, destinations, passId } = body;

    if (!personName || !destinations || !Array.isArray(destinations) || destinations.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Person name and at least one destination are required.' },
        { status: 400 }
      );
    }

    const { data: entryLog, error } = await supabaseServer
      .from('entry_logs')
      .insert({
        organization_id: authUser.organizationId,
        entry_type: entryType === 'DELIVERY' ? 'DELIVERY' : 'GUEST',
        person_name: personName.trim(),
        phone: phone ? phone.trim() : null,
        company_name: companyName ? companyName.trim() : null,
        destinations: destinations, // JSONB array of destination names
        gatekeeper_id: authUser.userId,
        pass_id: passId || null,
        status: 'INSIDE',
      })
      .select()
      .single();

    if (error) {
      console.error('Entry log insert error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to record entry log.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${entryType === 'DELIVERY' ? 'Delivery' : 'Guest'} entry logged successfully!`,
      entryLog,
    });
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json(
      { success: false, message: error.message || 'Error processing entry.' },
      { status }
    );
  }
}
