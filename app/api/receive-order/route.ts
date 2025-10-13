import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log(`\n=== Webhook Received [${timestamp}] ===`);

  try {
    // Log request object type info
    console.log('\n1. Request Object Type Info:');
    console.log('req type:', typeof req);
    console.log('req constructor:', req.constructor.name);
    console.log('req prototype chain:', Object.prototype.toString.call(req));
    
    // Log basic request info with types
    console.log('\n2. Request Details (with types):');
    console.log('Method:', req.method, `(type: ${typeof req.method})`);
    console.log('URL:', req.url, `(type: ${typeof req.url})`);
    
    // Log headers with types
    console.log('\n3. Headers (with types):');
    const headers: Record<string, string> = {};
    console.log('headers type:', typeof req.headers);
    console.log('headers prototype:', Object.prototype.toString.call(req.headers));
    for (const [k, v] of req.headers) {
      headers[k] = v;
      console.log(`${k}: ${v} (key type: ${typeof k}, value type: ${typeof v})`);
    }

    // Log query parameters with types
    const url = new URL(req.url);
    if (url.search) {
      console.log('\n4. Query Parameters (with types):');
      console.log('searchParams type:', typeof url.searchParams);
      console.log('searchParams prototype:', Object.prototype.toString.call(url.searchParams));
      for (const [key, value] of url.searchParams) {
        console.log(`${key}: ${value} (key type: ${typeof key}, value type: ${typeof value})`);
      }
    }

    // Attempt to read and parse body with type info
    console.log('\n5. Body Type Analysis:');
    let textBody: string | null = null;
    let jsonBody: any = undefined;
    try {
      textBody = await req.text();
      console.log('Raw body type:', typeof textBody);
      console.log('Raw body length:', textBody?.length ?? 0);
      console.log('Raw body content:', textBody || '(empty)');
      
      try {
        jsonBody = JSON.parse(textBody);
        console.log('\nParsed JSON:');
        console.log('Type:', typeof jsonBody);
        console.log('Constructor:', jsonBody?.constructor?.name);
        console.log('Prototype chain:', Object.prototype.toString.call(jsonBody));
        console.log('Content:', JSON.stringify(jsonBody, null, 2));
        
        if (typeof jsonBody === 'object' && jsonBody !== null) {
          console.log('\nJSON Properties:');
          for (const [key, value] of Object.entries(jsonBody)) {
            console.log(`${key}: ${typeof value} = ${JSON.stringify(value)}`);
          }
        }
      } catch (err) {
        const jsonErr = err as Error;
        console.log('\nJSON Parse Error:');
        console.log('Error type:', typeof jsonErr);
        console.log('Error name:', jsonErr.name);
        console.log('Error message:', jsonErr.message);
      }
    } catch (readErr) {
      console.error('\nBody Read Error:', typeof readErr, String(readErr));
    }

    console.log('\n=== End Webhook Log ===\n');
    return NextResponse.json({ received: true, timestamp }, { status: 200 });
  } catch (err) {
    console.error('Unexpected error in webhook handler:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Return last received order for testing
export async function GET() {
  return NextResponse.json({
    items: [{
      id: 'test-1',
      receivedAt: new Date().toISOString(),
      url: 'test',
      headers: {},
      bodyText: null,
      jsonBody: {
        ass: '{"order":{"items":[{"item_id":13,"size":"medium","quantity":2}]}}'
      }
    }]
  }, { status: 200 });
}
