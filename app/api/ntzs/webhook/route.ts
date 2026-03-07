import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.NTZS_WEBHOOK_SECRET || '';

/**
 * POST /api/ntzs/webhook
 * Handles nTZS event webhooks, verified with HMAC-SHA256.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody   = await req.text();
    const signature = req.headers.get('x-ntzs-signature') || '';

    // Verify HMAC-SHA256 if secret is configured
    if (WEBHOOK_SECRET) {
      const expected = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      if (signature !== expected) {
        console.warn('[nTZS webhook] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);
    console.log('[nTZS webhook] Event received:', event.type, event);

    switch (event.type) {
      case 'deposit.completed':
        console.log('[nTZS] Deposit completed:', event.data?.depositId, '— TZS:', event.data?.amountTzs);
        // TODO: Notify frontend via Supabase realtime or Server-Sent Events
        break;

      case 'withdrawal.completed':
        console.log('[nTZS] Withdrawal completed:', event.data?.withdrawalId, '— TZS:', event.data?.amountTzs);
        break;

      case 'transfer.completed':
        console.log('[nTZS] Transfer completed:', event.data?.transferId);
        break;

      default:
        console.log('[nTZS webhook] Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[nTZS webhook] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
