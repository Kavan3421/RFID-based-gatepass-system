import nodemailer from 'nodemailer';

export async function sendPasswordResetEmail({ toEmail, username, resetToken }) {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `Gatify <${user || 'teamastrasoft@gmail.com'}>`;

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
    subject: 'Gatify — Admin Password Reset Security Code',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #050811; color: #ffffff; padding: 32px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1); max-width: 500px; margin: 0 auto;">
        <h2 style="color: #06b6d4; margin-top: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Gatify Security</h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Hello <strong>${username}</strong>,</p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">You requested a password reset for your Gatify admin account. Your security 6-digit OTP code is:</p>
        <div style="background: rgba(15, 23, 42, 0.9); border: 1px solid #06b6d4; font-size: 28px; font-weight: 900; letter-spacing: 6px; color: #22d3ee; padding: 18px; border-radius: 16px; text-align: center; margin: 24px 0; font-family: monospace;">
          ${resetToken}
        </div>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Or click the button below to reset your password directly:</p>
        <a href="${resetUrl}" style="background: linear-gradient(135deg, #06b6d4 0%, #2563eb 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 14px; font-weight: bold; font-size: 14px; display: inline-block; margin-top: 10px;">Reset Password Now</a>
        <p style="font-size: 12px; color: #64748b; margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.08); pt: 16px;">If you did not request this, please ignore this email. Gatify Spatial Access Platform.</p>
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
