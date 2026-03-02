import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { apiConfig, isDevelopment } from '../../../../lib/config';
import { logger } from '../../../../lib/logger';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');
    const event = request.headers.get('x-github-event');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    const secret =
      process.env['GITHUB_WEBHOOK_SECRET'] ||
      (isDevelopment ? 'dev_secret' : '');
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(rawBody).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
      return NextResponse.json(
        { error: 'Signatures do not match' },
        { status: 401 }
      );
    }

    if (event === 'ping') {
      logger.info(`[Webhook] Received GitHub ping event. Webhook is active.`);
      return NextResponse.json(
        { message: 'pong', active: true },
        { status: 200 }
      );
    }

    logger.info(
      `[Webhook] Received GitHub event: ${event}. Forwarding to backend...`
    );

    if (!apiConfig.secret) {
      logger.error('NEXT_PUBLIC_API_SECRET is missing');
      return NextResponse.json(
        { error: 'Server misconfiguration' },
        { status: 500 }
      );
    }

    const timestamp = Date.now().toString();
    const nonce = crypto.randomUUID();
    const parsedBody = JSON.parse(rawBody);
    const signaturePayload = JSON.stringify({
      timestamp,
      nonce,
      body: parsedBody,
    });

    const backendSignature = crypto
      .createHmac('sha256', apiConfig.secret)
      .update(signaturePayload)
      .digest('hex'    );

    const backendUrl = apiConfig.baseUrl || 'http://localhost:3003/api';
    const backendResponse = await fetch(`${backendUrl}/webhook/github`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': signature,
        'x-github-event': event || '',
        'x-forwarded-by': 'docscrive-nextjs',
        'x-timestamp': timestamp,
        'x-nonce': nonce,
        'x-signature': backendSignature,
      },
      body: rawBody,
    });

    if (!backendResponse.ok) {
      logger.error(
        `[Webhook] Backend relay failed with status ${backendResponse.status}`
      );
      return NextResponse.json(
        { error: 'Backend relay failed' },
        { status: 502 }
      );
    }

    return NextResponse.json({ received: true }, { status: 202 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`GitHub Webhook relay error: ${message}`);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
