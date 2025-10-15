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
  const failedIds: string[] = [];
  
  for (const { id, controller } of subscribers.values()) {
    try {
      // Enhanced controller validation
      if (!controller || 
          controller.desiredSize === null || 
          typeof controller.enqueue !== 'function') {
        throw new Error('Invalid or closed controller');
      }

      // Test the controller with a comment before sending actual data
      controller.enqueue(': ping\n\n');
      // If we got here, the controller is still valid
      controller.enqueue(`event: ${event}\ndata: ${data}\n\n`);
      successCount++;
    } catch (e) {
      console.error(`Error broadcasting to subscriber ${id}:`, e);
      failedIds.push(id);
    }
  }
  
  // Clean up failed subscribers after iteration
  failedIds.forEach(id => {
    console.log(`Removing stale connection for subscriber ${id}`);
    removeSubscriber(id);
  });
  
  console.log(`Successfully broadcast to ${successCount}/${count} subscribers`);
  if (failedIds.length > 0) {
    console.log(`Removed ${failedIds.length} stale connections`);
  }
}

export function currentSubscribersCount() {
  return subscribers.size;
}