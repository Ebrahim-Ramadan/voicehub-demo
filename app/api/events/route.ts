import { NextResponse } from 'next/server';
import { addSubscriber, removeSubscriber } from '../_sse/broadcast';

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      // simple id
      const id = String(Date.now()) + Math.random().toString(36).slice(2, 8);
      addSubscriber(id, controller);

      // send a comment to keep connection alive
      controller.enqueue(': connected\n\n');

      // On cancel, remove subscriber
      // Note: `pull`/`start` cannot return an abort handler; we rely on close to remove
      (controller as any).id = id;
    },
    cancel() {
      try {
        const id = (this as any).id;
        if (id) removeSubscriber(id);
      } catch (e) {
        // ignore
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
