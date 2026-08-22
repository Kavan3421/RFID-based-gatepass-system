import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyTenantAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const authUser = await verifyTenantAuth(req, ['ADMIN']);
    const { searchParams } = new URL(req.url);

    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const entryType = searchParams.get('entryType'); // GUEST, DELIVERY, or ALL
    const status = searchParams.get('status'); // INSIDE, EXITED, or ALL
    const search = searchParams.get('search'); // Person name or phone search
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);

    const fromIndex = (page - 1) * limit;
    const toIndex = fromIndex + limit - 1;

    let query = supabaseServer
      .from('entry_logs')
      .select('*', { count: 'exact' })
      .eq('organization_id', authUser.organizationId);

    if (fromDate) {
      query = query.gte('entry_time', new Date(fromDate).toISOString());
    }
    if (toDate) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.lte('entry_time', endOfDay.toISOString());
    }
    if (entryType && entryType !== 'ALL') {
      query = query.eq('entry_type', entryType);
    }
    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.ilike('person_name', `%${search.trim()}%`);
    }

    query = query.order('entry_time', { ascending: false }).range(fromIndex, toIndex);

    const { data: logs, count, error } = await query;

    if (error) {
      console.error('Reports fetch error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to query reports.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json(
      { success: false, message: error.message || 'Error fetching report logs.' },
      { status }
    );
  }
}
