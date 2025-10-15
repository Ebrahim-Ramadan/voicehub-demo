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
  const count = subscribers.size;
  console.log(`Broadcasting event ${event} to ${count} subscribers:`, data);
  
  if (count === 0) {
    console.warn('No subscribers available to receive the event');
    return;
  }

  let successCount = 0;
  for (const { id, controller } of subscribers.values()) {
    try {
      controller.enqueue(`event: ${event}\ndata: ${data}\n\n`);
      successCount++;
    } catch (e) {
      console.error(`Error broadcasting to subscriber ${id}:`, e);
      // Remove failed subscriber
      removeSubscriber(id);
    }
  }
  
  console.log(`Successfully broadcast to ${successCount}/${count} subscribers`);
}

export function currentSubscribersCount() {
  return subscribers.size;
}
