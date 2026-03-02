import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // TODO: Verify Strike webhook signature using stripe.webhooks.constructEvent
    const sig = request.headers.get('stripe-signature');

    if (!sig) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Placeholder for structural handling
    const eventType = payload.type;

    switch (eventType) {
      case 'checkout.session.completed':
        // Handle successful subscription payment
        console.log('Payment successful, upgrade organization tier.');
        break;
      case 'customer.subscription.deleted':
        // Handle cancellation
        console.log('Subscription canceled, downgrade organization to HOBBY.');
        break;
      default:
        console.log(`Unhandled event type ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
