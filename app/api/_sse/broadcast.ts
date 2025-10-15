type Subscriber = {
  id: string;
  controller: ReadableStreamDefaultController<any>;
};

const subscribers = new Map<string, Subscriber>();

export function addSubscriber(id: string, controller: ReadableStreamDefaultController<any>) {
  subscribers.set(id, { id, controller });
}

export function removeSubscriber(id: string) {
  subscribers.delete(id);
}

export function sendEvent(event: string, payload: any) {
  const data = JSON.stringify(payload);
  for (const { controller } of subscribers.values()) {
    try {
      controller.enqueue(`event: ${event}\ndata: ${data}\n\n`);
    } catch (e) {
      // ignore individual subscriber errors
    }
  }
}

export function currentSubscribersCount() {
  return subscribers.size;
}
