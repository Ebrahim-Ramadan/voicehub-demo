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
            let matchedMenuItem: MenuItem | undefined;
            if (typeof item.item_id === 'string') {
              const searchTerm = item.item_id.trim();
              // Determine content type and search in the most appropriate field first
              const containsArabic = /[\u0600-\u06FF]/.test(searchTerm);
              const isNumeric = /^\d+$/.test(searchTerm);
              
              if (isNumeric) {
                // Direct numeric search - most efficient if it's a number
                const numericId = Number(searchTerm);
                matchedMenuItem = menuItems.find((m: MenuItem) => m.item === numericId);
                console.log(`Matched numeric ID ${numericId} to menu item:`, matchedMenuItem?.name_en);
              } else if (containsArabic) {
                // Arabic content - search in name_ar field
                matchedMenuItem = menuItems.find((m: MenuItem) => m.name_ar === searchTerm);
                // Try with normalized whitespace if exact match fails
                if (!matchedMenuItem) {
                  matchedMenuItem = menuItems.find((m: MenuItem) => 
                    m.name_ar.trim() === searchTerm || 
                    m.name_ar.replace(/\s+/g, '') === searchTerm.replace(/\s+/g, '')
                  );
                }
                console.log(`Matched Arabic text "${searchTerm}" to menu item:`, matchedMenuItem?.name_en);
              } else {
                // English content - search in name_en field (case-insensitive)
                const englishSearchTerm = searchTerm.toLowerCase();
                matchedMenuItem = menuItems.find((m: MenuItem) => 
                  m.name_en.toLowerCase().trim() === englishSearchTerm
                );
                console.log(`Matched English text "${searchTerm}" to menu item:`, matchedMenuItem?.name_en);
              }
              if (matchedMenuItem) {
                actualItemId = matchedMenuItem.item;
              }
            }
            // Handle Arabic size names and always send English size
            let normalizedSize = (item.size || 'medium').trim();
            let normalizedSizeEn = normalizedSize;
            if (["وسط","ستة","مواسطة","واسبتة","وصط","متوسط"].includes(normalizedSize)) normalizedSizeEn = 'medium';
            else if (["كبير","كبيره","كبيرة"].includes(normalizedSize)) normalizedSizeEn = 'large';
            else if (["صغير","صغيره","صغيرة"].includes(normalizedSize)) normalizedSizeEn = 'small';
            console.log(`Normalized size from "${item.size}" to "${normalizedSizeEn}"`);
            return {
              item_id: actualItemId, // Always use numeric ID after matching
              size: normalizedSizeEn,
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