import { NextRequest, NextResponse } from 'next/server';

// Webhook handler for nTZS events
export async function POST(request: NextRequest) {
  try {
    const event = await request.json();
    
    console.log('[nTZS Webhook] Received event:', event);

    switch (event.type) {
      case 'deposit.completed':
        console.log('[nTZS Webhook] Deposit completed:', {
          userId: event.data.userId,
          amountTzs: event.data.amountTzs,
          txHash: event.data.txHash,
        });
        // TODO: Update user balance in database
        // TODO: Send notification to user
        break;

      case 'transfer.completed':
        console.log('[nTZS Webhook] Transfer completed:', {
          fromUserId: event.data.fromUserId,
          toUserId: event.data.toUserId,
          amountTzs: event.data.amountTzs,
          txHash: event.data.txHash,
        });
        // TODO: Update balances in database
        // TODO: Send notifications
        break;

      case 'withdrawal.completed':
        console.log('[nTZS Webhook] Withdrawal completed:', {
          userId: event.data.userId,
          amountTzs: event.data.amountTzs,
          phone: event.data.phone,
        });
        // TODO: Update user balance in database
        // TODO: Send notification to user
        break;

      case 'deposit.failed':
      case 'transfer.failed':
      case 'withdrawal.failed':
        console.error('[nTZS Webhook] Transaction failed:', event);
        // TODO: Handle failed transactions
        // TODO: Notify user of failure
        break;

      default:
        console.log('[nTZS Webhook] Unknown event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[nTZS Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
