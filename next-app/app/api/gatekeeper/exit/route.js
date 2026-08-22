import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyTenantAuth } from '@/lib/auth';

export async function POST(req) {
  try {
    const authUser = await verifyTenantAuth(req, ['GATEKEEPER', 'ADMIN']);
    const body = await req.json();
    const { logId } = body;

    if (!logId) {
      return NextResponse.json(
        { success: false, message: 'Entry Log ID is required.' },
        { status: 400 }
      );
    }

    const { data: updatedLog, error } = await supabaseServer
      .from('entry_logs')
      .update({
        status: 'EXITED',
        exit_time: new Date().toISOString(),
      })
      .eq('id', logId)
      .eq('organization_id', authUser.organizationId)
      .select()
      .single();

    if (error || !updatedLog) {
      return NextResponse.json(
        { success: false, message: 'Failed to record exit. Entry log not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Exit recorded successfully.',
      entryLog: updatedLog,
    });
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json(
      { success: false, message: error.message || 'Error logging exit.' },
      { status }
    );
  }
}
