import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyTenantAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const authUser = await verifyTenantAuth(req, ['ADMIN']);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 1. Fetch Today's Counts
    const { count: guestsToday } = await supabaseServer
      .from('entry_logs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', authUser.organizationId)
      .eq('entry_type', 'GUEST')
      .gte('entry_time', todayStart.toISOString());

    const { count: deliveriesToday } = await supabaseServer
      .from('entry_logs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', authUser.organizationId)
      .eq('entry_type', 'DELIVERY')
      .gte('entry_time', todayStart.toISOString());

    const { count: currentlyInside } = await supabaseServer
      .from('entry_logs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', authUser.organizationId)
      .eq('status', 'INSIDE');

    const { count: exitedToday } = await supabaseServer
      .from('entry_logs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', authUser.organizationId)
      .eq('status', 'EXITED')
      .gte('entry_time', todayStart.toISOString());

    // 2. Fetch Live Digital Register (Latest 50 entries)
    const { data: liveRegister } = await supabaseServer
      .from('entry_logs')
      .select('id, entry_type, person_name, phone, company_name, destinations, status, entry_time, exit_time')
      .eq('organization_id', authUser.organizationId)
      .order('entry_time', { ascending: false })
      .limit(50);

    // 3. Organization Info
    const { data: org } = await supabaseServer
      .from('organizations')
      .select('name, organization_code, type, destination_type')
      .eq('id', authUser.organizationId)
      .single();

    return NextResponse.json({
      success: true,
      stats: {
        guestsToday: guestsToday || 0,
        deliveriesToday: deliveriesToday || 0,
        currentlyInside: currentlyInside || 0,
        people_currently_inside: currentlyInside || 0,
        exitedToday: exitedToday || 0,
      },
      organization: org || {},
      liveRegister: liveRegister || [],
    });
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch admin dashboard overview.' },
      { status }
    );
  }
}
