import { NextRequest, NextResponse } from 'next/server';
import { sendEvent } from '../_sse/broadcast';
import { promises as fs } from 'fs';
import path from 'path';

type MenuItem = {
  item: number;
  name_en: string;
  name_ar: string;
  category: string;
  subsection: string;
  image?: string;
  currency: string;
  sizes: {
    [key: string]: number;
  };
};

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

    // Load menu.json to handle Arabic item names
    const menuJsonPath = path.join(process.cwd(), 'public', 'menu.json');
    const menuItems: MenuItem[] = JSON.parse(await fs.readFile(menuJsonPath, 'utf-8'));

    // Check all possible keys that might contain the stringified order
    const possibleKeys = ['Item', 'Final_order', 'final_order', 'order', 'Order'];
    for (const key of possibleKeys) {
      if (body?.[key]) {
        const parsed = tryParseString(body[key]);
        // First try to find items directly, then try under order object
        items = parsed?.items ?? parsed?.order?.items ?? null;
        // Ensure items have the correct structure
        if (items && Array.isArray(items)) {
          // Format items to match expected structure
          items = items.map(item => {
            let actualItemId = item.item_id;
            
            // If item_id is a string, try to find matching menu item by Arabic or English name
            if (typeof item.item_id === 'string') {
              let menuItem: MenuItem | undefined;
              
              // Check for Arabic name match
              if (/[\u0600-\u06FF]/.test(item.item_id)) {
                menuItem = menuItems.find((m: MenuItem) => m.name_ar === item.item_id);
              } 
              // Check for English name match (case insensitive)
              if (!menuItem) {
                menuItem = menuItems.find((m: MenuItem) => 
                  m.name_en.toLowerCase() === item.item_id.toLowerCase()
                );
              }

              if (menuItem) {
                actualItemId = menuItem.item;
              }
            }

            // Handle Arabic size names
            let normalizedSize = item.size || 'medium';
            if (normalizedSize === 'وسط' || normalizedSize === 'ستة') normalizedSize = 'medium';
            else if (normalizedSize === 'كبير') normalizedSize = 'large';
            else if (normalizedSize === 'صغير') normalizedSize = 'small';

            return {
              item_id: item.item_id, // Keep original item_id to match with menu items
              size: normalizedSize,
              quantity: item.quantity || 1,
              status: item.status || 'pending'
            };
          });
          break;
        }
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
