import { Server } from 'socket.io';
import { NextRequest } from 'next/server';
import { createServer } from 'http';
import { headers } from 'next/headers';

const httpServer = createServer();

const io = new Server(httpServer, {
  path: '/api/ws',
  addTrailingSlash: false,
  transports: ['websocket', 'polling'],
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

export async function GET(req: NextRequest) {
  const headersList = await headers();
  const upgradeHeader = await headersList.get('upgrade');
  const isUpgrade = upgradeHeader === 'websocket';
  
  if (!isUpgrade) {
    return new Response(null, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST',
      }
    });
  }

  try {
    // Start the server if not already running
    if (!httpServer.listening) {
      httpServer.listen(3001);
    }
    
    return new Response(null, {
      status: 101,
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade'
      }
    });
  } catch (err) {
    console.error('WebSocket setup error:', err);
    return new Response(null, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Export io instance so it can be used in other routes
export { io };