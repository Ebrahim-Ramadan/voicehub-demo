import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest) {
  try {
    // Log request metadata
    console.log('--- /api/receive-order webhook received ---');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:');
    for (const [k, v] of req.headers) {
      console.log(`${k}: ${v}`);
    }

    // Attempt to parse JSON body; log raw text if parse fails
    let textBody: string | null = null;
    try {
      textBody = await req.text();
      console.log('Raw body:', textBody);
      try {
        const json = JSON.parse(textBody);
        console.log('Parsed JSON body:', JSON.stringify(json));
      } catch (jsonErr) {
        console.log('Body is not valid JSON');
      }
    } catch (readErr) {
      console.error('Failed to read request body:', readErr);
    }

    console.log('--- end webhook log ---');

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error('Unexpected error in webhook handler:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Simple health check for GET
export async function GET() {
  console.log('GET /api/receive-order health check');
  return NextResponse.json({ ok: true });
}
