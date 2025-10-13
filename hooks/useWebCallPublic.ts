import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export function useWebCallPublic() {
  const socket = useRef<Socket | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const startCall = async () => {
    if (isConnecting || isConnected) return;
    
    try {
      setIsConnecting(true);
      
      // Connect to VoiceHub websocket (using their public API endpoint)
      socket.current = io('wss://voice-api.voicehub.ai', {
        transports: ['websocket'],
        path: '/socket.io',
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000
      });

      socket.current.on('connect', () => {
        console.log('Socket connected successfully');
        setIsConnected(true);
        setIsConnecting(false);

        // Join call channel
        socket.current?.emit('join', { 
          channel: 'call',
          // Add any necessary auth or metadata
          metadata: {
            client: 'web',
            timestamp: Date.now()
          }
        });
      });

      socket.current.on('connect_error', (error) => {
        console.warn('Socket connection error:', error.message);
        setIsConnecting(false);
        // The socket.io-client will automatically try to reconnect
      });

      socket.current.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        setIsConnecting(false);
      });

      socket.current.on('error', (err: Error) => {
        console.error('Socket error:', err.message);
        setIsConnecting(false);
      });

      // Handle reconnection attempts
      socket.current.on('reconnect_attempt', (attempt) => {
        console.log(`Socket reconnection attempt ${attempt}`);
        setIsConnecting(true);
      });

      socket.current.on('reconnect_failed', () => {
        console.error('Socket reconnection failed after max attempts');
        setIsConnecting(false);
        socket.current?.close();
      });

    } catch (err) {
      console.error('Failed to start call:', err);
      setIsConnecting(false);
    }
  };

  const endCall = () => {
    if (!socket.current) return;
    socket.current.disconnect();
    socket.current = null;
    setIsConnected(false);
    setIsConnecting(false);
  };

  useEffect(() => {
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  return {
    startCall,
    endCall,
    isConnecting,
    isConnected
  };
}