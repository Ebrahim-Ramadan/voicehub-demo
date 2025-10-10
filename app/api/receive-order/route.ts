import { NextRequest, NextResponse } from 'next/server';
import { addWebhook, getAllWebhooks } from '../../../lib/webhookStore';

export async function POST(req: NextRequest) {
  try {
    const headers: Record<string, string> = {};
    for (const [k, v] of req.headers) headers[k] = v;

    let textBody: string | null = null;
    let jsonBody: any = undefined;
    try {
      textBody = await req.text();
      try {
        jsonBody = JSON.parse(textBody);
      } catch (_) {
        jsonBody = undefined;
      }
    } catch (readErr) {
      console.error('Failed to read request body:', readErr);
    }

    addWebhook({
      url: req.url,
      headers,
      bodyText: textBody,
      jsonBody,
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error('Unexpected error in webhook handler:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Return stored webhooks
export async function GET() {
  try {
    const items = getAllWebhooks();
    return NextResponse.json({ ok: true, items }, { status: 200 });
  } catch (err) {
    console.error('Error reading stored webhooks:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
