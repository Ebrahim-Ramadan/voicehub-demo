import { NextResponse } from 'next/server';
import { addSubscriber, removeSubscriber, currentSubscribersCount } from '../_sse/broadcast';

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      // simple id
      const id = String(Date.now()) + Math.random().toString(36).slice(2, 8);
      console.log(`New SSE connection established. ID: ${id}`);
      
      // Add subscriber and send initial connection message
      addSubscriber(id, controller);
      console.log(`Added subscriber ${id}. Current subscriber count: ${currentSubscribersCount()}`);

      // send a comment to keep connection alive and initial connection status
      controller.enqueue(': connected\n\n');
      controller.enqueue(`data: {"status":"connected","id":"${id}"}\n\n`);

      // Send periodic keep-alive comments
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(': ping\n\n');
        } catch (e) {
          console.error('Failed to send keep-alive:', e);
          clearInterval(keepAliveInterval);
        }
      }, 30000); // Send ping every 30 seconds

      // On cancel, remove subscriber
      // Note: `pull`/`start` cannot return an abort handler; we rely on close to remove
      (controller as any).id = id;
      (controller as any).keepAliveInterval = keepAliveInterval;
    },
    cancel() {
      try {
        const id = (this as any).id;
        const keepAliveInterval = (this as any).keepAliveInterval;
        
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
        }
        
        if (id) {
          console.log(`SSE connection closed. ID: ${id}`);
          removeSubscriber(id);
          console.log(`Removed subscriber ${id}. Current subscriber count: ${currentSubscribersCount()}`);
        }
      } catch (e) {
        console.error('Error during SSE cleanup:', e);
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}
