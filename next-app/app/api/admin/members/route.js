import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyTenantAuth, hashPassword } from '@/lib/auth';

export async function GET(req) {
  try {
    const authUser = await verifyTenantAuth(req, ['ADMIN']);

    const { data: users, error } = await supabaseServer
      .from('users')
      .select('id, username, email, phone, role, created_at')
      .eq('organization_id', authUser.organizationId)
      .order('role', { ascending: true })
      .order('username', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, message: 'Failed to fetch user list.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, users: users || [] });
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
    const { username, email, phone, password, role = 'MEMBER' } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Username and password are required.' }, { status: 400 });
    }

    if (!['MEMBER', 'GATEKEEPER', 'ADMIN'].includes(role)) {
      return NextResponse.json({ success: false, message: 'Invalid role specified.' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const { data: newUser, error } = await supabaseServer
      .from('users')
      .insert({
        organization_id: authUser.organizationId,
        username: username.trim(),
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        password_hash: passwordHash,
        role: role,
      })
      .select('id, username, email, phone, role, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: false, message: 'A user with this username already exists in your organization.' }, { status: 400 });
      }
      return NextResponse.json({ success: false, message: 'Failed to create user.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `User ${newUser.username} (${newUser.role}) created successfully!`, user: newUser });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create user.' },
      { status: error.status || 500 }
    );
  }
}

/**
 * PUT: Admin update member details or change member password directly
 */
export async function PUT(req) {
  try {
    const authUser = await verifyTenantAuth(req, ['ADMIN']);
    const body = await req.json();
    const { userId, username, email, phone, role, newPassword } = body;

    // Prevent admin from overwriting another admin password or self via member API
    const { data: targetUser } = await supabaseServer
      .from('users')
      .select('role')
      .eq('id', userId)
      .eq('organization_id', authUser.organizationId)
      .single();

    if (targetUser && targetUser.role === 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Admin passwords cannot be overwritten here. Main Admin must use Old Password or SMTP Email Reset.' },
        { status: 400 }
      );
    }

    const updateFields = {};
    if (username) updateFields.username = username.trim();
    if (email !== undefined) updateFields.email = email ? email.trim() : null;
    if (phone !== undefined) updateFields.phone = phone ? phone.trim() : null;
    if (role && ['MEMBER', 'GATEKEEPER'].includes(role)) updateFields.role = role;
    if (newPassword) {
      updateFields.password_hash = await hashPassword(newPassword);
    }
    updateFields.updated_at = new Date().toISOString();

    const { data: updatedUser, error } = await supabaseServer
      .from('users')
      .update(updateFields)
      .eq('id', userId)
      .eq('organization_id', authUser.organizationId)
      .select('id, username, email, phone, role, updated_at')
      .single();

    if (error || !updatedUser) {
      return NextResponse.json({ success: false, message: 'Failed to update user details.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `User ${updatedUser.username} updated successfully!`,
      user: updatedUser,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update user.' },
      { status: error.status || 500 }
    );
  }
}

/**
 * DELETE: Admin remove member account
 */
export async function DELETE(req) {
  try {
    const authUser = await verifyTenantAuth(req, ['ADMIN']);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID is required.' }, { status: 400 });
    }

    // Prevent admin from deleting self via member delete API
    if (userId === authUser.userId) {
      return NextResponse.json({ success: false, message: 'You cannot remove your own admin account.' }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('users')
      .delete()
      .eq('id', userId)
      .eq('organization_id', authUser.organizationId);

    if (error) {
      return NextResponse.json({ success: false, message: 'Failed to delete user.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'User removed successfully.' });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete user.' },
      { status: error.status || 500 }
    );
  }
}
