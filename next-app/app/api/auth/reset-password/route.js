import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { hashPassword } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/smtp';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, organizationCode, email, usernameOrEmail, resetToken, newPassword } = body;

    if (!organizationCode) {
      return NextResponse.json({ success: false, message: 'Organization Code is required.' }, { status: 400 });
    }

    // 1. Fetch organization
    const { data: org } = await supabaseServer
      .from('organizations')
      .select('id, organization_code')
      .eq('organization_code', organizationCode.trim().toUpperCase())
      .single();

    if (!org) {
      return NextResponse.json({ success: false, message: 'Invalid Organization Code.' }, { status: 404 });
    }

    // ACTION 1: REQUEST SMTP PASSWORD RESET EMAIL
    if (action === 'REQUEST') {
      const identifier = (usernameOrEmail || email || '').trim();
      if (!identifier) {
        return NextResponse.json({ success: false, message: 'Admin username or email is required.' }, { status: 400 });
      }

      // Query admin user by email or username
      const { data: adminUser } = await supabaseServer
        .from('users')
        .select('id, username, email, role')
        .eq('organization_id', org.id)
        .eq('role', 'ADMIN')
        .or(`email.eq.${identifier},username.eq.${identifier}`)
        .single();

      if (!adminUser || !adminUser.email) {
        return NextResponse.json(
          { success: false, message: 'Admin account with a valid email was not found. Email is required for password reset.' },
          { status: 404 }
        );
      }

      // Generate 6-digit OTP code
      const generatedToken = crypto.randomInt(100000, 999999).toString();

      // Log reset request token in audit_logs
      await supabaseServer.from('audit_logs').insert({
        organization_id: org.id,
        user_id: adminUser.id,
        action: 'PASSWORD_RESET_REQUESTED',
        details: { token: generatedToken, email: adminUser.email, expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() },
      });

      // Send email via SMTP
      await sendPasswordResetEmail({
        toEmail: adminUser.email,
        username: adminUser.username,
        resetToken: generatedToken,
      });

      return NextResponse.json({
        success: true,
        message: `Password reset email sent to ${adminUser.email}. Please check your inbox for the OTP code.`,
        email: adminUser.email,
      });
    }

    // ACTION 2: CONFIRM RESET CODE & UPDATE PASSWORD
    if (action === 'CONFIRM') {
      if (!email || !resetToken || !newPassword) {
        return NextResponse.json({ success: false, message: 'Email, Reset Code Token, and New Password are required.' }, { status: 400 });
      }

      // Fetch user
      const { data: adminUser } = await supabaseServer
        .from('users')
        .select('id, username')
        .eq('organization_id', org.id)
        .eq('email', email.trim())
        .eq('role', 'ADMIN')
        .single();

      if (!adminUser) {
        return NextResponse.json({ success: false, message: 'Admin user not found.' }, { status: 404 });
      }

      // Verify token from recent audit_logs
      const { data: resetLog } = await supabaseServer
        .from('audit_logs')
        .select('*')
        .eq('organization_id', org.id)
        .eq('user_id', adminUser.id)
        .eq('action', 'PASSWORD_RESET_REQUESTED')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!resetLog || !resetLog.details || resetLog.details.token !== resetToken.trim()) {
        return NextResponse.json({ success: false, message: 'Invalid or expired reset code token.' }, { status: 400 });
      }

      // Check expiration
      if (new Date(resetLog.details.expires_at) < new Date()) {
        return NextResponse.json({ success: false, message: 'Reset code token has expired. Please request a new code.' }, { status: 400 });
      }

      // Hash and update password
      const newHash = await hashPassword(newPassword);
      await supabaseServer
        .from('users')
        .update({ password_hash: newHash, updated_at: new Date().toISOString() })
        .eq('id', adminUser.id);

      // Log successful reset
      await supabaseServer.from('audit_logs').insert({
        organization_id: org.id,
        user_id: adminUser.id,
        action: 'PASSWORD_RESET_COMPLETED',
      });

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully! You can now sign in with your new password.',
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid reset action.' }, { status: 400 });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ success: false, message: 'An error occurred during password reset.' }, { status: 500 });
  }
}
