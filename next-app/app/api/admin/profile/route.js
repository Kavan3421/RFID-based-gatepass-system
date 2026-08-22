import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyTenantAuth } from '@/lib/auth';

export async function PUT(req) {
  try {
    const authUser = await verifyTenantAuth(req, ['ADMIN']);
    const body = await req.json();
    const { username, flatUnit, phone } = body;

    const updateFields = {};
    if (username) updateFields.username = username.trim();
    if (flatUnit !== undefined || phone !== undefined) {
      updateFields.phone = (phone || flatUnit || '').trim();
    }
    updateFields.updated_at = new Date().toISOString();

    const { data: updatedAdmin, error } = await supabaseServer
      .from('users')
      .update(updateFields)
      .eq('id', authUser.userId)
      .eq('organization_id', authUser.organizationId)
      .select('id, username, email, phone, role')
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: 'Failed to update admin profile.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin profile details updated successfully!',
      user: updatedAdmin,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error updating profile.' },
      { status: error.status || 500 }
    );
  }
}
