import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyTenantAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const authUser = await verifyTenantAuth(req, ['ADMIN', 'GATEKEEPER', 'MEMBER']);

    const { data: destinations, error } = await supabaseServer
      .from('destinations')
      .select('*')
      .eq('organization_id', authUser.organizationId)
      .order('group_label', { ascending: true })
      .order('unit_number', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, message: 'Failed to fetch destinations.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, destinations: destinations || [] });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Authentication error.' },
      { status: error.status || 500 }
    );
  }
}

export async function POST(req) {
  try {
    const authUser = await verifyTenantAuth(req, ['ADMIN']);
    const body = await req.json();
    const { groupLabel, unitNumber, customFullName } = body;

    if (!unitNumber && !customFullName) {
      return NextResponse.json({ success: false, message: 'Unit number or destination name is required.' }, { status: 400 });
    }

    const fullName = customFullName
      ? customFullName.trim()
      : groupLabel
      ? `${groupLabel.trim()}-${unitNumber.trim()}`
      : unitNumber.trim();

    const { data: destination, error } = await supabaseServer
      .from('destinations')
      .insert({
        organization_id: authUser.organizationId,
        group_label: groupLabel ? groupLabel.trim() : null,
        unit_number: unitNumber ? unitNumber.trim() : fullName,
        full_name: fullName,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: false, message: 'This destination already exists in your organization.' }, { status: 400 });
      }
      return NextResponse.json({ success: false, message: 'Failed to add destination.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Destination added successfully!', destination });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to process request.' },
      { status: error.status || 500 }
    );
  }
}
