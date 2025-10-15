import { NextRequest, NextResponse } from 'next/server';
import { sendEvent } from '../_sse/broadcast';

function tryParseString(value: any) {
  if (typeof value !== 'string') return value;
  try {
    const parsed = JSON.parse(value);
    // handle nested stringified JSON
    return tryParseString(parsed);
  } catch (e) {
    return value;
  }
}

export async function POST(req: NextRequest) {
  try {
      const contentType = req.headers.get('content-type') || '';
    let body: any;

    // Only proceed with parsing based on content type
    if (contentType.includes('application/json')) {
      body = await req.json();
      console.log('received JSON webhook:', body);
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      body = Object.fromEntries(formData);
      console.log('received form data webhook:', body);
    } else {
      return NextResponse.json(
        { error: 'Unsupported content type. Send as application/json' },
        { status: 415 }
      );
    }
    // The external service sends JSON as a string under various keys like `Item` or `Final_order`
    // Example: { Final_order: '{"order":{"items":[{"item_id":13,...}]}}' }
    let items: any = null;

    // Check all possible keys that might contain the stringified order
    const possibleKeys = ['Item', 'Final_order', 'final_order', 'order', 'Order'];
    for (const key of possibleKeys) {
      if (body?.[key]) {
        const parsed = tryParseString(body[key]);
        items = parsed?.order?.items ?? parsed?.items ?? null;
        if (items && Array.isArray(items)) break;
      }
    }

    // If no items found in known keys, try parsing any string values at the top level
    if (!items) {
      for (const [key, value] of Object.entries(body)) {
        if (typeof value === 'string') {
          const parsed = tryParseString(value);
          items = parsed?.order?.items ?? parsed?.items ?? null;
          if (items && Array.isArray(items)) break;
        }
      }
    }

    // Last fallback: check if the body itself has items
    if (!items) {
      items = body?.order?.items ?? body?.items ?? null;
    }

    if (items && Array.isArray(items)) {
      // broadcast to connected clients
      sendEvent('order-items', { items });
      console.log('broadcasted items count:', items.length);
    } else {
      console.log('no items found in webhook payload');
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Unexpected error in webhook handler:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
