"use client";
import { CheckCheckIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import VoiceHubWidget from './VoiceHubWidget';

// Lazy load framer-motion with CSS fallback
let motion: any = null;
let AnimatePresence: any = ({ children }: any) => <>{children}</>;

async function loadMotion() {
  if (motion) return;
  try {
    const fm = await import('framer-motion');
    motion = fm.motion;
    AnimatePresence = fm.AnimatePresence;
  } catch {
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
  let obj = json;
  if (!obj) return null;

  // Normalize JSON if stringified in a field like `ass`
  if (typeof obj === 'object') {
    if (typeof obj.ass === 'string') {
      try {
        const parsed = JSON.parse(obj.ass);
        if (parsed && typeof parsed === 'object') {
          obj = parsed;
        }
      } catch {
        // Ignore parse errors
      }
    }

    if (!obj.order) {
      for (const key of Object.keys(obj)) {
        const v = obj[key];
        if (typeof v === 'string') {
          try {
            const parsed = JSON.parse(v);
            if (parsed && typeof parsed === 'object') {
              if (parsed.order) {
                obj = parsed;
                break;
              }
              if (!obj.order) {
                obj = parsed;
              }
            }
          } catch {
            // Ignore non-JSON strings
          }
        }
      }
    }
  }

  const order = obj?.order ?? obj;
  if (!order || !Array.isArray(order.items)) {
    return null;
  }

  const items = order.items;
  const enriched = items.map((it: any) => {
    const id = it.item_id ?? it.item ?? it.id;
    let menuItem = null;
    if (menu && id != null) {
      menuItem = menu.find((m: any) => m.item === Number(id) || m.item === id);
    }
    return { original: it, menuItem };
  });

  const matchedCount = enriched.filter((e) => !!e.menuItem).length;
  const totalCount = enriched.length;

  const groups = new Map<string | number, Array<{ original: any; menuItem: any | null }>>();
  for (const e of enriched) {
    const id = e.original.item_id ?? e.original.item ?? e.original.id ?? '__unknown__';
    const key = typeof id === 'number' ? id : String(id);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }

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
                <div className="text-sm text-gray-300" dir="rtl">{menuItem?.name_ar ?? groupItems[0].original.name_ar ?? ''}</div>
                <div className="text-xs text-gray-400 mt-2">{menuItem?.category ?? ''} • {menuItem?.subsection ?? ''}</div>
                <div className="mt-3 space-y-2">
                  {groupItems.map((g, i) => {
                    const it = g.original;
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

  let orderTotal = 0;
  let currency: string | null = null;
  for (const { original: it, menuItem } of enriched) {
    const qty = Number(it.quantity ?? it.qty ?? 1) || 1;
    let price: number | null = null;
    if (typeof it.price === 'number') price = it.price;
    else if (menuItem && it.size && menuItem.sizes && menuItem.sizes[it.size] != null) price = Number(menuItem.sizes[it.size]);
    else if (menuItem && menuItem.sizes) price = Number(Object.values(menuItem.sizes)[0]);
    if (price != null) {
      orderTotal += price * qty;
      currency = currency ?? (it.currency ?? menuItem?.currency ?? null);
    }
  }

  const ItemCard: any = motion ? motion.div : 'div';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-medium text-white">Your Order</div>
        <div className="text-sm">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
            {matchedCount} items
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {enriched.map(({ original: it, menuItem }: any, idx: number) => {
          const matched = !!menuItem;
          const qty = Number(it.quantity ?? it.qty ?? 1) || 1;
          let priceVal: number | null = null;

          if (typeof it.price === 'number') {
            priceVal = it.price;
          } else if (menuItem && it.size && menuItem.sizes && menuItem.sizes[it.size] != null) {
            priceVal = Number(menuItem.sizes[it.size]);
          } else if (menuItem && menuItem.sizes) {
            priceVal = Number(Object.values(menuItem.sizes)[0]);
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
              <div className="absolute top-2 left-2 z-10">
                <div className="bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {qty}
                </div>
              </div>
              {/* {matched && (
                <div className="absolute top-2 right-2 z-10">
                  <CheckCheckIcon className="text-green-500 w-4" />
                </div>
              )} */}
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
      if (data?.ok === false && data?.error?.toLowerCase().includes('storage disabled')) {
        setItems([]);
        setLoading(false);
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
    loadMotion().catch(() => {});
    fetchItems();
    const t = setInterval(fetchItems, 2000);
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
const categories = React.useMemo(() => {
  const cats = new Set<string>();
  items.forEach(it => {
    try {
      const order = JSON.parse(it.jsonBody?.ass)?.order;
      if (order?.items) {
        order.items.forEach((item: any) => {
          const menuItem = menu?.find(m => m.item === item.item_id);
          if (menuItem) {
            cats.add(menuItem.category);
            cats.add(menuItem.subsection);
          }
        });
      }
    } catch (e) {
      console.error('Error parsing categories:', e);
    }
  });
  return Array.from(cats).filter(Boolean);
}, [items, menu]);
  return (
    <div className="fixed inset-0 bg-[#1a1a1a] text-white overflow-auto">
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .slide-in { animation: slideIn 0.4s ease-out forwards; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
        .float { animation: float 3s ease-in-out infinite; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
        .pulse-slow { animation: pulse 2s ease-in-out infinite; }
      `}</style>

      <div className="sticky top-0 z-50 backdrop-blur-md bg-black/30 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <span className="text-xl font-bold">☕</span>
              <h1 className="text-xl font-semibold">Voice Coffee Order</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm">
                Order Active
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10 min-h-[600px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🛒</span>
              <h2 className="text-xl font-semibold">Current Order</h2>
            </div>
            {/* <VoiceHubWidget /> */}
          </div>

          {loading && (
            <div className="text-center text-sm text-gray-400">
              <div className="inline-block px-4 py-2 rounded-lg bg-slate-800/50">
                Checking webhook service...
              </div>
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="text-center text-sm text-gray-400">
              <div className="inline-block px-4 py-2 rounded-lg bg-slate-800/50">
                No orders received yet
              </div>
            </div>
          )}

          <AnimatePresence>
            {items.map((it) => {
              const Wrapper: any = motion ? motion.div : 'div';
              const wrapperProps = motion
                ? { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.3 } }
                : { className: 'slide-in' };

              return (
                <Wrapper key={it.id} {...wrapperProps} className="mb-6">
                  <div className="text-xs text-gray-400 mb-2">
                    Order received at <span className="font-mono">{new Date(it.receivedAt).toLocaleTimeString()}</span>
                  </div>
                  {it.jsonBody && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
                      {(() => {
                        // Parse and enrich items
                        let obj = it.jsonBody;
                        if (typeof obj === 'object' && typeof obj.ass === 'string') {
                          try { obj = JSON.parse(obj.ass); } catch {}
                        }
                        const order = obj?.order ?? obj;
                        if (!order || !Array.isArray(order.items)) return null;
                        return order.items.map((item: any, idx: number) => {
                          const menuItem = menu?.find(m => m.item === item.item_id);
                          const qty = Number(item.quantity ?? item.qty ?? 1) || 1;
                          let priceVal: number | null = null;
                          if (typeof item.price === 'number') priceVal = item.price;
                          else if (menuItem && item.size && menuItem.sizes && menuItem.sizes[item.size] != null) priceVal = Number(menuItem.sizes[item.size]);
                          else if (menuItem && menuItem.sizes) priceVal = Number(Object.values(menuItem.sizes)[0]);
                          const priceDisplay = priceVal != null ? `KWD ${priceVal.toFixed(3)}` : '-';
                          const imagePath = menuItem?.image || '/items-images/default-item.jpg';
                          return (
                            <div key={idx} className="bg-[#2A2A2A] rounded-xl p-4 flex flex-col items-center shadow-md">
                              <div className="w-20 h-20 rounded-lg overflow-hidden mb-3">
                                <img src={imagePath} alt={menuItem?.name_en ?? 'Item'} className="w-full h-full object-cover" />
                              </div>
                              <div className="w-full flex-1 flex flex-col items-center">
                                <div className="flex items-center justify-between w-full mb-1">
                                  <h3 className="font-semibold text-white text-base truncate">{menuItem?.name_en ?? item.name_en ?? item.name ?? 'Unknown Item'}</h3>
                                  <div className="flex items-center gap-1">
                                    <span className="text-yellow-400">★</span>
                                    <span className="text-xs text-gray-300">4.8</span>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-400 mb-2 w-full text-center">{item.size} · {menuItem?.subsection ?? menuItem?.category ?? ''}</div>
                                <div className="flex items-center justify-between w-full mt-2">
                                  <span className="text-emerald-400 font-bold text-base">{priceDisplay}</span>
                                  <span className="text-gray-500">×</span>
                                  <span className="text-gray-300 font-semibold">{qty}</span>
                                  <button className="ml-2 w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-lg font-bold">+</button>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </Wrapper>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}