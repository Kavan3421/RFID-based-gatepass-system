import nodemailer from 'nodemailer';

export async function sendPasswordResetEmail({ toEmail, username, resetToken }) {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `QR Gate Pass <${user || 'teamastrasoft@gmail.com'}>`;

  if (!user || !pass || user === 'YOUR_SMTP_EMAIL_HERE') {
    console.warn('[SMTP Warning] SMTP credentials not configured in .env.local. Email sending simulated.');
    return { success: true, simulated: true };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false
    }
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(toEmail)}`;

  const mailOptions = {
    from,
    to: toEmail,
    subject: 'QR GATE PASS — Admin Password Reset Code',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #070B14; color: #ffffff; padding: 30px; border-radius: 16px; border: 1px solid #1e293b;">
        <h2 style="color: #06b6d4; margin-top: 0;">QR GATE PASS Security</h2>
        <p style="color: #cbd5e1;">Hello <strong>${username}</strong>,</p>
        <p style="color: #cbd5e1;">You requested a password reset for your admin account. Your security 6-digit OTP code is:</p>
        <div style="background-color: #0f172a; border: 1px solid #06b6d4; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #38bdf8; padding: 18px; border-radius: 12px; text-align: center; margin: 20px 0;">
          ${resetToken}
        </div>
        <p style="color: #cbd5e1;">Or click the button below to reset your password directly:</p>
        <a href="${resetUrl}" style="background-color: #0891b2; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; margin-top: 10px;">Reset Password Now</a>
        <p style="font-size: 12px; color: #64748b; margin-top: 30px;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[SMTP Success] Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[SMTP Error] Failed to send email via Nodemailer:', error);
    throw error;
  }
}
