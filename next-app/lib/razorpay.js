import crypto from 'crypto';

/**
 * Verify Razorpay Webhook Signature using HMAC-SHA256
 */
export function verifyRazorpayWebhookSignature(rawBody, signature, secret) {
  if (!rawBody || !signature || !secret) return false;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
}
