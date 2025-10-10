"use client";
import React, { useEffect, useState } from 'react';

type Stored = {
  id: string;
  receivedAt: string;
  url: string;
  headers: Record<string, string>;
  bodyText: string | null;
  jsonBody?: any;
};

export default function WebhookViewer() {
  const [items, setItems] = useState<Stored[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/receive-order');
      const data = await res.json();
      if (data?.items) setItems(data.items);
    } catch (err) {
      console.error('Failed to fetch webhooks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    const t = setInterval(fetchItems, 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="w-full max-w-4xl">
      <h2 className="text-lg font-semibold mb-4">Received Webhooks</h2>
      {loading && <div>Loading…</div>}
      {!loading && items.length === 0 && <div>No webhooks received yet.</div>}
      <div className="space-y-4 mt-4">
        {items.map((it) => (
          <div key={it.id} className="p-3 border rounded">
            <div className="text-xs text-gray-500">{it.receivedAt}</div>
            <div className="font-mono text-sm break-all">{it.url}</div>
            <details className="mt-2">
              <summary className="cursor-pointer">Headers ({Object.keys(it.headers).length})</summary>
              <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(it.headers, null, 2)}</pre>
            </details>
            <details className="mt-2">
              <summary className="cursor-pointer">Body</summary>
              <pre className="text-sm whitespace-pre-wrap">{it.bodyText ?? '(empty)'}</pre>
            </details>
            {it.jsonBody && (
              <details className="mt-2">
                <summary className="cursor-pointer">Parsed JSON</summary>
                <pre className="text-xs overflow-auto max-h-56">{JSON.stringify(it.jsonBody, null, 2)}</pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
