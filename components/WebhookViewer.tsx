"use client";
import { Check, CheckCheckIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';

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
      `}</style>
      {/* <h2 className="text-lg font-semibold mb-4">Received Webhooks</h2> */}
      {loading && <div>Loading…</div>}
     
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

  {loading && <div className="text-center text-sm text-gray-400">Listening for orders…</div>}

  {!loading && items.length === 0 && (
    <div className="text-center text-gray-500">
      speak
    </div>
  )}

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


// "use client";
// import React, { useEffect, useState } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Mic, ShoppingBag, Clock } from 'lucide-react';

// // Define types for better type safety
// type Stored = {
//   id: string;
//   receivedAt: string;
//   url: string;
//   headers: Record<string, string>;
//   bodyText: string | null;
//   jsonBody?: any;
// };

// type MenuItem = {
//   item: string | number;
//   name_en: string;
//   name_ar: string;
//   category: string;
//   subsection: string;
//   sizes: Record<string, number>;
//   currency: string;
// };

// // Typing animation component for a friendly effect
// function TypedPreview({ text }: { text: string }) {
//   const [display, setDisplay] = useState('');

//   useEffect(() => {
//     let i = 0;
//     setDisplay('');
//     if (!text) return;
//     const t = setInterval(() => {
//       i += 1;
//       setDisplay(text.slice(0, i));
//       if (i >= text.length) clearInterval(t);
//     }, 50);
//     return () => clearInterval(t);
//   }, [text]);

//   return (
//     <div className="font-mono text-sm text-gray-200 whitespace-pre-wrap break-words">
//       {display}
//       {display.length < text.length && <span className="animate-pulse text-teal-400">▌</span>}
//     </div>
//   );
// }

// // Order preview renderer with enhanced styling
// function renderOrderPreview(json: any, menu: MenuItem[] | null = null) {
//   let obj = json;
//   if (!obj) return null;

//   // Normalize JSON if nested
//   if (typeof obj === 'object') {
//     for (const key of Object.keys(obj)) {
//       const v = obj[key];
//       if (typeof v === 'string') {
//         try {
//           const parsed = JSON.parse(v);
//           if (parsed && typeof parsed === 'object') {
//             obj = parsed;
//             break;
//           }
//         } catch {
//           // ignore
//         }
//       }
//     }
//   }

//   // Detect order shape
//   const order = obj?.order ?? obj;
//   if (!order || (!Array.isArray(order.items) && !Array.isArray(order?.items))) return null;

//   const items = order.items || [];

//   // Enrich items with menu data
//   const enriched = items.map((it: any) => {
//     const id = it.item_id ?? it.item ?? it.id;
//     let menuItem = null;
//     if (menu && id != null) {
//       menuItem = menu.find((m) => m.item === Number(id) || m.item === id);
//     }
//     return { original: it, menuItem };
//   });

//   const matchedCount = enriched.filter((e: any) => !!e.menuItem).length;
//   const totalCount = enriched.length;

//   // Group items by ID for same-item multiple sizes
//   const groups = new Map<string | number, Array<{ original: any; menuItem: any | null }>>();
//   for (const e of enriched) {
//     const id = e.original.item_id ?? e.original.item ?? e.original.id ?? '__unknown__';
//     const key = typeof id === 'number' ? id : String(id);
//     if (!groups.has(key)) groups.set(key, []);
//     groups.get(key)!.push(e);
//   }

//   // Single item with multiple sizes — card view
//   if (groups.size === 1 && Array.from(groups.values())[0].length > 1) {
//     const [key, groupItems] = Array.from(groups.entries())[0];
//     const menuItem = groupItems[0].menuItem;

//     return (
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5, ease: 'easeOut' }}
//         className="p-6 bg-gradient-to-br from-teal-600 to-blue-600 rounded-2xl shadow-lg"
//       >
//         <div className="flex items-start gap-4">
//           <ShoppingBag className="w-8 h-8 text-white" />
//           <div className="flex-1">
//             <h3 className="text-xl font-bold text-white">{menuItem?.name_en ?? groupItems[0].original.name_en ?? 'Your Item'}</h3>
//             <p className="text-sm text-white/80" dir="rtl">{menuItem?.name_ar ?? groupItems[0].original.name_ar ?? ''}</p>
//             <p className="text-xs text-white/60 mt-1">{menuItem?.category ?? ''} • {menuItem?.subsection ?? ''}</p>
//             <div className="mt-4 space-y-3">
//               {groupItems.map((g, i) => {
//                 const it = g.original;
//                 let priceVal: number | null = null;
//                 if (typeof it.price === 'number') priceVal = it.price;
//                 else if (g.menuItem && it.size && g.menuItem.sizes && g.menuItem.sizes[it.size] != null) priceVal = Number(g.menuItem.sizes[it.size]);
//                 else if (g.menuItem && g.menuItem.sizes) priceVal = Number(Object.values(g.menuItem.sizes)[0]);
//                 const qty = Number(it.quantity ?? it.qty ?? 1) || 1;
//                 const priceLabel = priceVal != null ? `${priceVal.toFixed(2)} ${it.currency ?? g.menuItem?.currency ?? 'USD'}` : '-';

//                 return (
//                   <motion.div
//                     key={i}
//                     initial={{ opacity: 0, x: -20 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ delay: i * 0.1, duration: 0.3 }}
//                     className="flex items-center justify-between p-4 bg-white/10 rounded-xl"
//                   >
//                     <div>
//                       <p className="font-medium text-white">{it.size ?? 'Standard'}</p>
//                       <p className="text-xs text-white/70">Quantity: {qty}</p>
//                     </div>
//                     <p className="font-mono text-white">{priceLabel}</p>
//                   </motion.div>
//                 );
//               })}
//             </div>
//             <div className="mt-6 text-right">
//               <p className="text-lg font-bold text-white">
//                 Total: {(() => {
//                   const total = groupItems.reduce((sum, g) => {
//                     const it = g.original;
//                     const qty = Number(it.quantity ?? it.qty ?? 1) || 1;
//                     let p: number | null = null;
//                     if (typeof it.price === 'number') p = it.price;
//                     else if (g.menuItem && it.size && g.menuItem.sizes && g.menuItem.sizes[it.size] != null) p = Number(g.menuItem.sizes[it.size]);
//                     else if (g.menuItem && g.menuItem.sizes) p = Number(Object.values(g.menuItem.sizes)[0]);
//                     return sum + (p != null ? p * qty : 0);
//                   }, 0);
//                   const currency = (groupItems[0].original.currency ?? groupItems[0].menuItem?.currency ?? 'USD');
//                   return total > 0 ? `${total.toFixed(2)} ${currency}` : '-';
//                 })()}
//               </p>
//             </div>
//           </div>
//         </div>
//       </motion.div>
//     );
//   }

//   // Compute order total
//   let orderTotal = 0;
//   let currency: string | null = null;
//   for (const { original: it, menuItem } of enriched) {
//     const qty = Number(it.quantity ?? it.qty ?? 1) || 1;
//     let price: number | null = null;
//     if (typeof it.price === 'number') price = it.price;
//     else if (menuItem && it.size && menuItem.sizes && menuItem.sizes[it.size] != null) price = Number(menuItem.sizes[it.size]);
//     else if (menuItem && menuItem.sizes) price = Number(Object.values(menuItem.sizes)[0]);
//     if (price != null) {
//       orderTotal += price * qty;
//       currency = currency ?? (it.currency ?? menuItem?.currency ?? 'USD');
//     }
//   }

//   // Table view for multiple items
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5 }}
//       className="p-6 bg-gradient-to-br from-teal-600 to-blue-600 rounded-2xl shadow-lg"
//     >
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="text-lg font-bold text-white flex items-center gap-2">
//           <ShoppingBag className="w-6 h-6" /> Your Order
//         </h3>
//         <p className="text-xs text-white/80">
//           Matched {matchedCount}/{totalCount}
//         </p>
//       </div>
//       <div className="overflow-auto">
//         <table className="w-full text-sm text-white">
//           <thead>
//             <tr className="text-left text-xs text-white/60">
//               <th className="pb-3">Item</th>
//               <th className="pb-3">Name</th>
//               <th className="pb-3">Size</th>
//               <th className="pb-3">Qty</th>
//               <th className="pb-3">Price</th>
//             </tr>
//           </thead>
//           <tbody>
//             {enriched.map(({ original: it, menuItem }: any, idx: number) => {
//               const qty = Number(it.quantity ?? it.qty ?? 1) || 1;
//               let priceDisplay = '-';
//               let priceVal: number | null = null;
//               if (typeof it.price === 'number') {
//                 priceVal = it.price;
//                 priceDisplay = `${it.price.toFixed(2)} ${it.currency ?? menuItem?.currency ?? 'USD'}`;
//               } else if (menuItem && it.size && menuItem.sizes && menuItem.sizes[it.size] != null) {
//                 priceVal = Number(menuItem.sizes[it.size]);
//                 priceDisplay = `${priceVal.toFixed(2)} ${it.currency ?? menuItem?.currency ?? 'USD'}`;
//               } else if (menuItem && menuItem.sizes) {
//                 const first = Object.values(menuItem.sizes)[0];
//                 if (first != null) {
//                   priceVal = Number(first);
//                   priceDisplay = `${priceVal.toFixed(2)} ${it.currency ?? menuItem?.currency ?? 'USD'}`;
//                 }
//               }

//               return (
//                 <motion.tr
//                   key={idx}
//                   initial={{ opacity: 0, x: -20 }}
//                   animate={{ opacity: 1, x: 0 }}
//                   transition={{ delay: idx * 0.1 }}
//                   className="border-t border-white/10"
//                 >
//                   <td className="py-3 font-mono">{it.item_id ?? it.item ?? it.id ?? '-'}</td>
//                   <td className="py-3">{menuItem?.name_en ?? it.name_en ?? it.name ?? '-'}</td>
//                   <td className="py-3">{it.size ?? '-'}</td>
//                   <td className="py-3">{qty}</td>
//                   <td className="py-3 font-mono">{priceDisplay}</td>
//                 </motion.tr>
//               );
//             })}
//             <tr className="border-t border-white/20">
//               <td colSpan={4} className="py-3 text-right font-bold">Total</td>
//               <td className="py-3 font-mono">{orderTotal > 0 ? `${orderTotal.toFixed(2)} ${currency ?? 'USD'}` : '-'}</td>
//             </tr>
//           </tbody>
//         </table>
//       </div>
//     </motion.div>
//   );
// }

// export default function VoiceOrderViewer() {
//   const [items, setItems] = useState<Stored[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [menu, setMenu] = useState<MenuItem[] | null>(null);

//   const fetchItems = async () => {
//     try {
//       const res = await fetch('/api/receive-order');
//       const data = await res.json();
//       if (data?.items) setItems(data.items);
//       if (data?.ok === false && data?.error?.toLowerCase().includes('storage disabled')) {
//         setItems([]);
//         setLoading(false);
//         throw new Error('STORAGE_DISABLED');
//       }
//     } catch (err) {
//       if ((err as any).message === 'STORAGE_DISABLED') {
//         console.warn('Server-side storage disabled, stopping poll.');
//         return;
//       }
//       console.error('Failed to fetch webhooks:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchItems();
//     const t = setInterval(fetchItems, 2000);
//     // Fetch menu for enrichment
//     (async () => {
//       try {
//         const res = await fetch('/menu.json');
//         if (res.ok) {
//           const data = await res.json();
//           setMenu(data);
//         }
//       } catch (err) {
//         console.warn('Failed to load menu.json', err);
//       }
//     })();
//     return () => clearInterval(t);
//   }, []);

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
//       <div className="w-full max-w-3xl">
//         <motion.div
//           initial={{ opacity: 0, scale: 0.95 }}
//           animate={{ opacity: 1, scale: 1 }}
//           transition={{ duration: 0.6, ease: 'easeOut' }}
//           className="text-center mb-8"
//         >
//           <h1 className="text-4xl font-extrabold text-white flex items-center justify-center gap-3">
//             <Mic className="w-8 h-8 text-teal-400 animate-pulse" /> Voice Order
//           </h1>
//           <p className="text-lg text-white/70 mt-2">Place your order with ease using your voice!</p>
//         </motion.div>

//         {loading && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             className="text-center text-white/80 flex items-center justify-center gap-2"
//           >
//             <Clock className="w-5 h-5 animate-spin" /> Loading your orders...
//           </motion.div>
//         )}

//         {!loading && items.length === 0 && (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="text-center text-white/80 bg-white/5 p-6 rounded-2xl"
//           >
//             <p>No orders received yet. Speak to place your first order!</p>
//           </motion.div>
//         )}

//         <div className="space-y-6">
//           <AnimatePresence>
//             {items.map((it) => (
//               <motion.div
//                 key={it.id}
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -20 }}
//                 transition={{ duration: 0.4 }}
//                 className="p-6 bg-white/5 rounded-2xl shadow-lg"
//               >
//                 <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
//                   <Clock className="w-4 h-4" /> {it.receivedAt}
//                 </div>
//                 <div className="text-sm text-white/80 mb-3">
//                   Source: <span className="font-mono">{it.url}</span>
//                 </div>
//                 <AnimatePresence>
//                   {it.jsonBody && (
//                     <motion.div
//                       initial={{ opacity: 0, scale: 0.98 }}
//                       animate={{ opacity: 1, scale: 1 }}
//                       exit={{ opacity: 0 }}
//                       transition={{ duration: 0.3 }}
//                       className="mt-4 p-4 bg-gradient-to-r from-teal-700 to-blue-700 rounded-xl"
//                     >
//                       <div className="text-xs text-white/60 mb-2">Order Details</div>
//                       {renderOrderPreview(it.jsonBody, menu) || (
//                         <TypedPreview text={JSON.stringify(it.jsonBody, null, 2)} />
//                       )}
//                     </motion.div>
//                   )}
//                 </AnimatePresence>
//               </motion.div>
//             ))}
//           </AnimatePresence>
//         </div>
//       </div>
//     </div>
//   );
// }