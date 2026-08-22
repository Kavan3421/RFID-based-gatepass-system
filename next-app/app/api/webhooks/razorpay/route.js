import { NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret || secret === 'YOUR_RAZORPAY_WEBHOOK_SECRET') {
      console.warn('[Razorpay Webhook Warning] Webhook secret not configured in env.');
    } else {
      const isValid = verifyRazorpayWebhookSignature(rawBody, signature, secret);
      if (!isValid) {
        return NextResponse.json({ success: false, message: 'Invalid webhook signature.' }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    if (event === 'payment.captured' || event === 'subscription.charged') {
      const paymentEntity = payload.payload.payment.entity;
      const notes = paymentEntity.notes || {};
      const organizationId = notes.organization_id;

      if (organizationId) {
        // Record payment in subscriptions table
        await supabaseServer.from('subscriptions').insert({
          organization_id: organizationId,
          razorpay_order_id: paymentEntity.order_id,
          razorpay_payment_id: paymentEntity.id,
          amount_paid: paymentEntity.amount / 100,
          currency: paymentEntity.currency || 'INR',
          tier_name: notes.tier_name || 'STANDARD',
          status: 'SUCCESS',
        });

        // Activate organization subscription
        await supabaseServer
          .from('organizations')
          .update({ subscription_status: 'ACTIVE' })
          .eq('id', organizationId);
      }
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error('Razorpay Webhook Error:', error);
    return NextResponse.json({ success: false, message: 'Webhook processing failed.' }, { status: 500 });
  }
}
