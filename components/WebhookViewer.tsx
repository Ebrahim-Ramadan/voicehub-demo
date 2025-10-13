"use client";
import { Check, CheckCheckIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import FloatingMic from './FloatingMic';
import VoiceHubWidget from './VoiceHubWidget';

// We'll attempt to lazily load framer-motion. If it's not available, the component
// falls back to simpler CSS animations.
let motion: any = null;
let AnimatePresence: any = ({ children }: any) => <>{children}</>;

async function loadMotion() {
  if (motion) return;
  try {
    const fm = await import('framer-motion');
    motion = fm.motion;
    AnimatePresence = fm.AnimatePresence;
  } catch (err) {
    // framer-motion not installed — continue with CSS-only fallback
    motion = null;
    AnimatePresence = ({ children }: any) => <>{children}</>;
  }
}

type Stored = {
  id: string;
  receivedAt: string;
  url: string;
  headers: Record<string, string>;
  bodyText: string | null;
  jsonBody?: any;
};

function TypedPreview({ text }: { text: string }) {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    let i = 0;
    setDisplay('');
    if (!text) return;
    const t = setInterval(() => {
      i += 1;
      setDisplay(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, 8);
    return () => clearInterval(t);
  }, [text]);

  return (
    <div className="font-mono text-sm whitespace-pre-wrap break-words">
      {display}
      {display.length < text.length && <span className="animate-pulse">▌</span>}
    </div>
  );
}

function renderOrderPreview(json: any, menu: any[] | null = null) {
  // Some webhooks contain a stringified JSON inside a field like `ass`.
  // Normalize into an object if possible.
  let obj = json;
  if (!obj) return null;

  // If top-level has a single key whose value is a JSON string, attempt to parse it
  if (typeof obj === 'object') {
    // check common fields
    for (const key of Object.keys(obj)) {
      const v = (obj as any)[key];
      if (typeof v === 'string') {
        try {
          const parsed = JSON.parse(v);
          // If parsed looks like order, use it
          if (parsed && typeof parsed === 'object') {
            obj = parsed;
            break;
          }
        } catch {
          // ignore
        }
      }
    }
  }

  // Now detect order shape
  const order = obj?.order ?? obj;
  if (!order || !Array.isArray(order.items) && !Array.isArray(order?.items)) return null;

  const items = order.items || [];

  // Enrich items with menu data if available
  const enriched: Array<{ original: any; menuItem: any | null }> = items.map((it: any) => {
    const id = it.item_id ?? it.item ?? it.id;
    let menuItem = null;
    if (menu && id != null) {
      menuItem = menu.find((m: any) => m.item === Number(id) || m.item === id);
    }
    return { original: it, menuItem };
  });

  const matchedCount = enriched.filter((e) => !!e.menuItem).length;
  const totalCount = enriched.length;

  // Group by item id to detect same-item multiple sizes
  const groups = new Map<string | number, Array<{ original: any; menuItem: any | null }>>();
  for (const e of enriched) {
    const id = e.original.item_id ?? e.original.item ?? e.original.id ?? '__unknown__';
    const key = typeof id === 'number' ? id : String(id);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }

  // If there's a single group and it has more than one entry (same item different sizes)
  // render a friendly card view instead of the table
  if (groups.size === 1) {
    const [key, groupItems] = Array.from(groups.entries())[0];
    if (groupItems.length > 1) {
      const menuItem = groupItems[0].menuItem;
  const Wrapper: any = motion ? motion.div : 'div';
  const ChildMotion: any = motion ? motion.div : 'div';
      return (
        <div className="mt-2">
          <Wrapper className="p-4 bg-slate-900 rounded" {...(motion ? { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25 } } : {})}>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="text-lg font-semibold">{menuItem?.name_en ?? groupItems[0].original.name_en ?? 'Item'}</div>
                <div className="text-sm text-gray-300" dir="rtl" style={{ direction: 'rtl' }}>{menuItem?.name_ar ?? groupItems[0].original.name_ar ?? ''}</div>
                <div className="text-xs text-gray-400 mt-2">{menuItem?.category ?? ''} • {menuItem?.subsection ?? ''}</div>
                <div className="mt-3 space-y-2">
                  {(groupItems as any[]).map((g, i) => {
                    const it = g.original;
                    // select price
                    let priceVal: number | null = null;
                    if (typeof it.price === 'number') priceVal = it.price;
                    else if (g.menuItem && it.size && g.menuItem.sizes && g.menuItem.sizes[it.size] != null) priceVal = Number(g.menuItem.sizes[it.size]);
                    else if (g.menuItem && g.menuItem.sizes) priceVal = Number(Object.values(g.menuItem.sizes)[0]);
                    const qty = Number(it.quantity ?? it.qty ?? 1) || 1;
                    const priceLabel = priceVal != null ? `${priceVal} ${it.currency ?? g.menuItem?.currency ?? ''}` : '-';

                    return (
                      <ChildMotion key={i} {...(motion ? { initial: { opacity: 0, x: -8 }, animate: { opacity: 1, x: 0 }, transition: { delay: i * 0.05 } } : {})}>
                        <div className="flex items-center justify-between p-3 bg-slate-800 rounded">
                          <div>
                            <div className="font-medium">{it.size ?? 'size'}</div>
                            <div className="text-xs text-gray-400">Qty: {qty}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono">{priceLabel}</div>
                          </div>
                        </div>
                      </ChildMotion>
                    );
                  })}
                </div>
                <div className="mt-4 text-right font-semibold">Total: {(() => {
                  const total = groupItems.reduce((sum, g) => {
                    const it = g.original;
                    const qty = Number(it.quantity ?? it.qty ?? 1) || 1;
                    let p: number | null = null;
                    if (typeof it.price === 'number') p = it.price;
                    else if (g.menuItem && it.size && g.menuItem.sizes && g.menuItem.sizes[it.size] != null) p = Number(g.menuItem.sizes[it.size]);
                    else if (g.menuItem && g.menuItem.sizes) p = Number(Object.values(g.menuItem.sizes)[0]);
                    return sum + (p != null ? p * qty : 0);
                  }, 0);
                  const currency = (groupItems[0].original.currency ?? groupItems[0].menuItem?.currency ?? '');
                  return total > 0 ? `${total.toFixed(3)} ${currency}` : '-';
                })()}</div>
              </div>
            </div>
          </Wrapper>
        </div>
      );
    }
  }

  // Helper: simple token-overlap fuzzy scorer to suggest candidates when no match
  function getCandidates(it: any, max = 3) {
    if (!menu) return [];
    const normalize = (s: string) => (s || '').toString().toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ');
    const target = normalize(it.name_en ?? it.name ?? it.ass ?? '');
    if (!target.trim()) return [];
    const targetTokens = new Set(target.split(/\s+/).filter(Boolean));

    const scores = menu.map((m: any) => {
      const en = normalize(m.name_en || '');
      const ar = normalize(m.name_ar || '');
      const text = `${en} ${ar}`.trim();
      const tokens = new Set(text.split(/\s+/).filter(Boolean));
      let common = 0;
      for (const t of targetTokens) if (tokens.has(t)) common += 1;
      const score = common / Math.max(targetTokens.size, tokens.size, 1);
      return { menu: m, score };
    });

    scores.sort((a, b) => b.score - a.score);
    return scores.filter(s => s.score > 0).slice(0, max);
  }

  // Compute order total using either payload price or menu price for size
  let orderTotal = 0;
  let currency: string | null = null;
  for (const { original: it, menuItem } of enriched) {
    const qty = Number(it.quantity ?? it.qty ?? 1) || 1;
    let price: number | null = null;
    if (typeof it.price === 'number') price = it.price;
    else if (menuItem && it.size && menuItem.sizes && menuItem.sizes[it.size] != null) price = Number(menuItem.sizes[it.size]);
    else if (menuItem && menuItem.sizes) {
      // fallback: take first available size price
      const first = Object.values(menuItem.sizes)[0];
      price = first != null ? Number(first) : null;
    }
    if (price != null) {
      orderTotal += price * qty;
      currency = currency ?? (it.currency ?? menuItem?.currency ?? null);
    }
  }

  const ItemCard: any = motion ? motion.div : 'div';

  return (
    <div className="mt-2  p-4 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium">Order Preview</div>
        <div className="text-xs">
          <span className="px-2 py-1 rounded-full bg-green-700/20 text-green-200">
            {matchedCount}/{totalCount} Items
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {enriched.map(({ original: it, menuItem }: any, idx: number) => {
          const matched = !!menuItem;
          const qty = Number(it.quantity ?? it.qty ?? 1) || 1;
          let priceVal: number | null = null;
          
          // Compute price display
          if (typeof it.price === 'number') {
            priceVal = it.price;
          } else if (menuItem && it.size && menuItem.sizes && menuItem.sizes[it.size] != null) {
            priceVal = Number(menuItem.sizes[it.size]);
          } else if (menuItem && menuItem.sizes) {
            const first = Object.values(menuItem.sizes)[0];
            if (first != null) priceVal = Number(first);
          }
          
          const currency = it.currency ?? menuItem?.currency ?? '';
          const priceDisplay = priceVal != null ? `${priceVal.toFixed(3)} ${currency}` : '-';
          const imagePath = menuItem?.image || '/items-images/default-item.jpg';
          const sizeMismatch = !!(menuItem && it.size && (!menuItem.sizes || !(it.size in menuItem.sizes)));

          return (
            <ItemCard
              key={idx}
              className="relative bg-slate-800 rounded-lg overflow-hidden"
              {...(motion ? {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.3, delay: idx * 0.1 }
              } : {})}
            >
              {/* Quantity Badge */}
              <div className="absolute top-2 left-2 z-10">
                <div className="bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {qty}
                </div>
              </div>

              {/* Check Icon for Matched */}
              {matched && (
                <div className="absolute top-2 right-2 z-10">
                 <CheckCheckIcon className='text-green-500 w-4'/>
                </div>
              )}

              {/* Image */}
              <div className="relative pb-[100%] bg-slate-700">
                <img
                  src={imagePath}
                  alt={menuItem?.name_en ?? 'Item'}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e: any) => {
                    e.target.src = '/items-images/default-item.jpg';
                  }}
                />
              </div>

              {/* Content */}
              <div className="p-3">
                <div className="font-medium text-sm mb-1 line-clamp-1">
                  {menuItem?.name_en ?? it.name_en ?? it.name ?? 'Unknown Item'}
                </div>
                <div className="text-xs text-gray-400 mb-2 line-clamp-1" dir="rtl">
                  {menuItem?.name_ar ?? it.name_ar ?? ''}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs">
                    <span className={`${sizeMismatch ? 'text-yellow-300' : 'text-gray-400'}`}>
                      {it.size ?? 'Regular'}
                    </span>
                  </div>
                  <div className="text-sm font-medium">{priceDisplay}</div>
                </div>
              </div>
            </ItemCard>
          );
        })}
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
        <div className="text-sm text-gray-400">Total Amount</div>
        <div className="text-lg font-semibold">
          {orderTotal > 0 ? `${orderTotal.toFixed(3)} ${currency ?? ''}` : '-'}
        </div>
      </div>
    </div>
  );
}

export default function WebhookViewer() {
  const [items, setItems] = useState<Stored[]>([]);
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<any[] | null>(null);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/receive-order');
      const data = await res.json();
      if (data?.items) setItems(data.items);
      if (data?.ok === false && data?.error && data.error.toLowerCase().includes('storage disabled')) {
        // server-side storage disabled — show a notice and stop polling
        setItems([]);
        setLoading(false);
        // throw a special error to stop interval
        throw new Error('STORAGE_DISABLED');
      }
    } catch (err) {
      if ((err as any).message === 'STORAGE_DISABLED') {
        console.warn('Server-side storage disabled, stopping poll.');
        return;
      }
      console.error('Failed to fetch webhooks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    const t = setInterval(fetchItems, 2000);
    loadMotion().catch(() => {});
    // fetch menu for enrichment
    (async () => {
      try {
        const res = await fetch('/menu.json');
        if (res.ok) {
          const data = await res.json();
          setMenu(data);
        }
      } catch (err) {
        console.warn('Failed to load menu.json', err);
      }
    })();
    return () => clearInterval(t);
  }, []);

  return (
    <div className="w-full max-w-4xl">
      <style>{`
        @keyframes wh-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: wh-fade-in 220ms ease both; }
        .animate-pulse { opacity: 0.6; animation: wh-blink 700ms steps(1,end) infinite; }
        @keyframes wh-blink { 50% { opacity: 0; } }
        @keyframes ripple { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
        .animate-ripple { animation: ripple 1s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
      `}</style>
      <VoiceHubWidget />
      {/* <h2 className="text-lg font-semibold mb-4">Received Webhooks</h2> */}
      {/* {loading && <div>Loading…</div>} */}
     
     <div className="w-full max-w-2xl mx-auto p-4 sm:p-6">
  <style>{`
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .fadeInUp { animation: fadeInUp 0.4s ease both; }
    @keyframes blink { 50% { opacity: 0; } }
    .cursor-blink { opacity: 0.6; animation: blink 1s steps(1,end) infinite; }
  `}</style>

  <div className="text-center mb-6">
    <h1 className="text-2xl font-bold text-white">🎙️ Voice Order Assistant</h1>
    <p className="text-sm text-gray-400 mt-1">Review your voice-based order in real-time</p>
  </div>

  {/* {loading && (
    <div className="text-center text-sm text-gray-400">
      <div className="inline-block px-4 py-2 rounded-lg bg-slate-800/50">
        Checking webhook service...
      </div>
    </div>
  )} */}

  {/* {!loading && items.length === 0 && (
    <div className="text-center">
      <div className="inline-block px-6 py-3 rounded-xl bg-amber-500/10 text-amber-200 border border-amber-500/20">
        <p className="font-medium">Server-side Storage Disabled</p>
        <p className="text-sm mt-1 text-amber-200/70">
          Webhooks are being logged but not stored for display.
          Check server logs for details.
        </p>
      </div>
    </div>
  )} */}

  <AnimatePresence>
    {items.map((it) => {
      const Wrapper: any = motion ? motion.div : 'div';
      const wrapperProps = motion
        ? { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.3 } }
        : { className: 'fadeInUp' };

      return (
        <Wrapper key={it.id} {...wrapperProps} className="p-4 border-b-2 border-neutral-500">
          <div className="text-xs text-gray-400">
            Order received at <span className="font-mono">{new Date(it.receivedAt).toLocaleTimeString()}</span>
          </div>

          {/* <div className="text-sm font-medium text-gray-300">
            Source: <span className="font-mono text-blue-300">{it.url}</span>
          </div> */}

          {/* {it.bodyText && (
            <div className="bg-slate-900 rounded p-3">
              <div className="text-xs text-gray-400 mb-1">🎧 You said:</div>
              <TypedPreview text={it.bodyText} />
            </div>
          )} */}

          {it.jsonBody && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="mt-2"
            >
              {renderOrderPreview(it.jsonBody, menu) || (
                <pre className="text-xs overflow-auto max-h-56  p-3 rounded text-gray-300">{JSON.stringify(it.jsonBody, null, 2)}</pre>
              )}
            </motion.div>
          )}
        </Wrapper>
      );
    })}
  </AnimatePresence>
</div>

    </div>
  );
}
