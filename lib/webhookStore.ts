export type StoredWebhook = {
  id: string;
  receivedAt: string;
  url: string;
  headers: Record<string, string>;
  bodyText: string | null;
  jsonBody?: any;
};

const MAX_ITEMS = 200;
const store: StoredWebhook[] = [];

export function addWebhook(item: Omit<StoredWebhook, 'id' | 'receivedAt'>) {
  const id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const entry: StoredWebhook = {
    id,
    receivedAt: new Date().toISOString(),
    ...item,
  };
  store.unshift(entry);
  if (store.length > MAX_ITEMS) store.length = MAX_ITEMS;
  return entry;
}

export function getAllWebhooks() {
  return store.slice();
}

export function clearWebhooks() {
  store.length = 0;
}
