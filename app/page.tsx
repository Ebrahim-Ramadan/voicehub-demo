"use client";

import { useEffect, useState } from 'react';

type OrderItem = { 
  item_id: number | string; 
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
  isNew?: boolean;
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

  let es: EventSource | null = null;
  let reconnectTimer: NodeJS.Timeout | undefined;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_INTERVAL = 3000;

  const setupEventSource = () => {
    try {
      if (es instanceof EventSource) {
        console.log('Closing existing EventSource connection');
        es.close();
        es = null;
      }
      
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('Max reconnection attempts reached');
        setConnected(false);
        return;
      }

      console.log('Creating new EventSource connection');
      es = new EventSource('/api/events');
      console.log('Setting up new SSE connection, attempt:', reconnectAttempts + 1);

      es.addEventListener('open', () => {
        console.log('SSE connection opened successfully');
        setConnected(true);
        reconnectAttempts = 0; // Reset attempts on successful connection
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = undefined;
        }
      });

      es.addEventListener('error', (e) => {
        console.log('SSE connection error:', e);
        setConnected(false);
        if (es) {
          es.close();
          es = null;
        }
        
        // Attempt to reconnect after RECONNECT_INTERVAL
        reconnectAttempts++;
        if (!reconnectTimer && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectTimer = setTimeout(() => {
            console.log('Attempting to reconnect SSE...');
            setupEventSource();
          }, RECONNECT_INTERVAL);
        }
      });

      es.addEventListener('order-items', (e: MessageEvent) => {
        try {
          console.log('Received SSE event:', e.data);
          const parsed = JSON.parse(e.data);
          console.log('Parsed event data:', parsed);
          if (parsed?.items && Array.isArray(parsed.items)) {
            setItems((prev) => {
              console.log('Previous items:', prev);
              // Track new items for animation
              const newItems = parsed.items.filter(
                (newItem: EnrichedItem) => !prev.some((old: EnrichedItem) => old.item_id === newItem.item_id)
              );
              console.log('New items:', newItems);
              
              // Merge unique by item_id
              const map = new Map(prev.map((i) => [i.item_id, i]));
              for (const it of parsed.items) {
                map.set(it.item_id, { ...it, isNew: newItems.some((n: EnrichedItem) => n.item_id === it.item_id) });
              }
              const result = Array.from(map.values());
              console.log('Updated items:', result);
              return result;
            });
          }
        } catch (err) {
          console.error('failed to parse event data', err);
        }
      });
    } catch (error) {
      console.error('Error setting up EventSource:', error);
      setConnected(false);
      // Schedule a retry
      if (!reconnectTimer && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectTimer = setTimeout(() => {
          reconnectAttempts++;
          setupEventSource();
        }, RECONNECT_INTERVAL);
      }
    }

    // Remove all old event listeners if any exist
    es.removeEventListener('open', () => {});
    es.removeEventListener('error', () => {});
    es.removeEventListener('order-items', () => {});
  };

  // Initial connection setup
  setupEventSource();

  // Cleanup function
  const cleanup = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = undefined;
    }
    if (es instanceof EventSource) {
      console.log('Cleaning up SSE connection');
      // Send a custom close event to the server before closing
      try {
        fetch('/api/events', { 
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        }).catch(err => console.error('Error sending close event:', err));
      } catch (err) {
        console.error('Error during cleanup:', err);
      }
      es.close();
      es = null;
    }
    setConnected(false);
  };

  window.addEventListener('beforeunload', cleanup);

  return () => {
    window.removeEventListener('beforeunload', cleanup);
    cleanup();
  };
}, []);

  // Enrich items with menu data and calculate totals
  useEffect(() => {
    setItems(prev => prev.map(item => {
      let menuItem: MenuItem | undefined = undefined;
      // Try to match by numeric ID
      if (typeof item.item_id === 'number') {
        menuItem = menuItems.find(m => m.item === item.item_id);
      }
      // Try to match by English name (case-insensitive)
      if (!menuItem && typeof item.item_id === 'string') {
        const searchTerm = item.item_id.toLowerCase().trim();
        menuItem = menuItems.find(m => m.name_en.toLowerCase().trim() === searchTerm);
      }
      // Try to match by Arabic name (exact)
      if (!menuItem && typeof item.item_id === 'string') {
        menuItem = menuItems.find(m => m.name_ar === item.item_id);
      }
      // Try to match by numeric string (sometimes backend sends stringified numbers)
      if (!menuItem && typeof item.item_id === 'string' && !isNaN(Number(item.item_id))) {
        menuItem = menuItems.find(m => m.item === Number(item.item_id));
      }
      console.log('Enrichment match result:', menuItem, 'for item_id:', item.item_id);
      if (menuItem) {
        console.log('Retrieved menu item from menu.json:', JSON.stringify(menuItem));
      }

      // Handle Arabic size names
      let normalizedSize = item.size?.toLowerCase() || '';
      if (["وسط","ستة","مواسطة","واسبتة","وصط","متوسط"].includes(normalizedSize)) normalizedSize = 'medium';
      else if (["كبير","كبيره","كبيرة"].includes(normalizedSize)) normalizedSize = 'large';
      else if (["صغير","صغيره","صغيرة"].includes(normalizedSize)) normalizedSize = 'small';

      const price = menuItem?.sizes[normalizedSize];
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
      {/* Connection Status Indicator */}
      <div className="fixed top-4 right-4 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-xs text-gray-600">{connected ? 'Connected' : 'Disconnected'}</span>
      </div>
      <div className={`items-center flex flex-col h-[90vh] w-full max-w-6xl ${items.length === 0 ? "justify-center" : "justify-start"}`}>
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
              {items.map((it, index) => {
                console.log('it', it);
                return (
                <li 
                  key={it.item_id} 
                  className={`
                    relative bg-gray-50 rounded-xl overflow-hidden shadow-md transform transition-all duration-500 ease-out
                    ${it.isNew ? 'animate-bounceIn scale-105' : 'opacity-100'}
                    hover:shadow-lg hover:scale-[1.02] transition-transform
                  `}
                  style={{ 
                    animationDelay: `${index * 0.1}s`,
                    ['--animate-bounceIn' as string]: 'scale(0.3) 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards'
                  } as React.CSSProperties}
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
              )
              }
              
              
              
              
              )}
            </div>

            {/* Bottom Center Total with Breakdown */}
            <div className="w-full max-w-2xl mx-auto mt-8 border-t-4 border-blue-500 absolute bottom-6 left-0 right-0 bg-white ">
              {/* Price Breakdown */}
              <div className="">
                {items.map((it) => (
                  <div key={it.item_id} className="flex items-center justify-between text-gray-600 px-4 hover:bg-gray-50 py-2 rounded">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{it.menuItem?.name_en || `Item #${it.item_id}`}</span>
                      <span className="text-xs text-gray-500">({it.size})</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm">
                        {it.menuItem?.currency} {it.menuItem?.sizes[it.size?.toLowerCase() || '']?.toFixed(3) || '0.000'}
                      </span>
                      <span className="text-sm font-medium">×</span>
                      <span className="text-sm w-8 text-center">{it.quantity}</span>
                      <span className="text-sm font-semibold w-24 text-right">
                        {it.menuItem?.currency || "KWD"} {it.total?.toFixed(3)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Grand Total */}
              <div className="border-t border-gray-200 ">
                <div className="flex justify-between items-center px-4">
                  <span className="text-xl font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {items[0]?.menuItem?.currency || 'KWD'} {grandTotal.toFixed(3)}
                  </span>
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