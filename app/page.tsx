"use client";

import { useEffect, useState } from 'react';

type OrderItem = { 
  item_id: number; 
  size?: string; 
  quantity?: number; 
  status?: string;
};

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

type EnrichedItem = OrderItem & {
  menuItem?: MenuItem;
  total?: number;
};

export default function Home() {
  const [items, setItems] = useState<EnrichedItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Load menu.json
    fetch('/menu.json')
      .then(res => res.json())
      .then(menu => setMenuItems(menu))
      .catch(err => console.error('Failed to load menu:', err));

    const es = new EventSource('/api/events');

    es.addEventListener('open', () => setConnected(true));
    es.addEventListener('error', () => setConnected(false));

    es.addEventListener('order-items', (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed?.items && Array.isArray(parsed.items)) {
          setItems((prev) => {
            // Track new items for animation
            const newItems = parsed.items.filter(
              (newItem: EnrichedItem) => !prev.some(old => old.item_id === newItem.item_id)
            );
            
            // Merge unique by item_id
            const map = new Map(prev.map((i) => [i.item_id, i]));
            for (const it of parsed.items) {
              map.set(it.item_id, { ...it, isNew: newItems.some(n => n.item_id === it.item_id) });
            }
            return Array.from(map.values());
          });
          console.log('items', items);
          
        }
      } catch (err) {
        console.error('failed to parse event data', err);
      }
    });

    // fallback: listen to default message event
    es.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed?.items) setItems(parsed.items);
      } catch (_) {}
    };

    return () => {
      es.close();
    };
  }, []);

  // Enrich items with menu data and calculate totals
  useEffect(() => {
    setItems(prev => prev.map(item => {
      const menuItem = menuItems.find(m => m.item === item.item_id);
      const price = menuItem?.sizes[item.size?.toLowerCase() || ''];
      const total = price ? (price * (item.quantity || 1)) : item.total;
      
      return {
        ...item,
        menuItem,
        total
      };
    }));
  }, [menuItems]);

  // Calculate grand total
  const grandTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);

  return (
    <main className="w-full flex bg-[#FDFDFD] justify-center p-6 min-h-screen">
      <div className="items-center justify-center flex flex-col h-[90vh] w-full max-w-6xl">
        {items.length === 0 ? (
          <video
            src='/anm/coffee-caribou-logo.mp4'
            className="w-auto h-1/2 max-w-full animate-bounce-slow"
            autoPlay
            loop
            muted
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-8">
              {items.map((it, index) => (
                <li 
                  key={it.item_id} 
                  className={`
                    relative bg-gray-50 rounded-xl overflow-hidden shadow-md transform transition-all duration-500 ease-out
                    ${it.isNew ? 'animate-bounceIn scale-105' : 'opacity-100'}
                    hover:shadow-lg hover:scale-[1.02] transition-transform
                  `}
                  style={{ 
                    animationDelay: `${index * 0.1}s`,
                    '--animate-bounceIn': 'scale(0.3) 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards'
                  }}
                >
                  {/* Quantity Badge */}
                  {it.quantity && (
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold z-10 shadow-lg">
                      {it.quantity}
                    </div>
                  )}
                  
                  {/* New Item Badge */}
                  {it.isNew && (
                    <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg animate-pulse">
                      New!
                    </div>
                  )}
                  
                  {/* Image Section */}
                  <div className="relative h-48 bg-gray-100">
                    {it.menuItem?.image ? (
                      <img 
                        src={it.menuItem.image} 
                        alt={it.menuItem.name_en}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
                        <span className="text-lg">📷</span>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="p-4">
                    {it.menuItem ? (
                      <>
                        <h3 className="font-bold text-lg mb-2 text-gray-900">{it.menuItem.name_en}</h3>
                        <p className="text-gray-600 text-sm mb-1">{it.menuItem.category}</p>
                        <p className="text-gray-600 text-sm mb-3">{it.menuItem.subsection}</p>
                      </>
                    ) : (
                      <p className="text-red-500 font-medium">Item #{it.item_id} not found</p>
                    )}

                    <div className="space-y-2 text-sm bg-white rounded-lg p-3 mt-2">
                      <div className="flex justify-between text-gray-700">
                        <span className="font-medium">Size:</span>
                        <span className="text-gray-900 font-semibold">{it.size || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span className="font-medium">Price:</span>
                        <span className="text-gray-900 font-semibold">
                          {it.menuItem && it.size 
                            ? `${it.menuItem.currency} ${it.menuItem.sizes[it.size.toLowerCase()].toFixed(3)}`
                            : 'N/A'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span className="font-medium">Status:</span>
                        <span className={`font-semibold px-2 py-1 rounded-full text-xs ${
                          it.status === 'ready' ? 'bg-green-100 text-green-800' :
                          it.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {it.status || 'Pending'}
                        </span>
                      </div>
                      {it.total && (
                        <div className="flex justify-between font-bold pt-2 border-t border-gray-200 mt-2 text-gray-900">
                          <span>Total:</span>
                          <span className="text-lg">{it.menuItem?.currency} {it.total.toFixed(3)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </div>

            {/* Vertical Grand Total */}
            <div className="w-full max-w-sm self-start bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-lg p-6">
              <div className="flex flex-col space-y-4">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Summary</h2>
                  <p className="text-gray-600 text-sm">Total Items: {items.length}</p>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-inner">
                  <div className="flex justify-between items-center text-xl">
                    <span className="text-gray-700 font-semibold">Grand Total:</span>
                    <span className="text-3xl font-bold text-blue-600">
                      {items[0]?.menuItem?.currency || 'KWD'} {grandTotal.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
      @keyframes bounce-slow {
    0%, 100% {
      transform: scale(1) translateY(0);
    }
    35% {
      transform: scale(1.1) translateY(-5px);
    }
  45% {
      transform: scale(0.95) translateY(2px);
    }
    75% {
      transform: scale(1.05) translateY(-2px);
    }
  }
  
  .animate-bounce-slow {
    animation: bounce-slow 4s ease-in-out infinite;
  }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3) rotate(-12deg);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05) rotate(2deg);
          }
          70% {
            transform: scale(0.98) rotate(-1deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        .animate-bounceIn {
          animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }
      `}</style>
    </main>
  );
}