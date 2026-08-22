import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyTenantAuth, comparePassword, hashPassword } from '@/lib/auth';

export async function POST(req) {
  try {
    const authUser = await verifyTenantAuth(req, ['ADMIN']);
    const body = await req.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Current password and new password are required.' },
        { status: 400 }
      );
    }

    // Fetch admin user
    const { data: adminUser } = await supabaseServer
      .from('users')
      .select('id, password_hash, username')
      .eq('id', authUser.userId)
      .eq('organization_id', authUser.organizationId)
      .single();

    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Admin account not found.' }, { status: 404 });
    }

    // Verify old password
    const isOldValid = await comparePassword(oldPassword, adminUser.password_hash);
    if (!isOldValid) {
      return NextResponse.json(
        { success: false, message: 'Incorrect current password. If you forgot your password, use Email verification.' },
        { status: 401 }
      );
    }

    // Update with new password hash
    const newHash = await hashPassword(newPassword);
    const { error } = await supabaseServer
      .from('users')
      .update({ password_hash: newHash, updated_at: new Date().toISOString() })
      .eq('id', adminUser.id);

    if (error) {
      return NextResponse.json({ success: false, message: 'Failed to update admin password.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin password updated successfully using current password!',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error updating password.' },
      { status: error.status || 500 }
    );
  }
}
