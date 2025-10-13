"use client";
import { useCallback, useState } from 'react';
import { useWebCallPublic } from '../hooks/useWebCallPublic';

export default function FloatingMic() {
  const { startCall, endCall, isConnecting, isConnected } = useWebCallPublic();
  const [showRipple, setShowRipple] = useState(false);

  const handleClick = useCallback(async () => {
    if (isConnected) {
      endCall();
    } else {
      await startCall();
    }
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 1000);
  }, [isConnected, startCall, endCall]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <button
        onClick={handleClick}
        className={`
          relative flex items-center justify-center
          w-14 h-14 rounded-full shadow-lg
          transition-all duration-300 transform
          ${isConnected 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-blue-500 hover:bg-blue-600'
          }
          ${isConnecting ? 'animate-pulse' : ''}
          hover:scale-105 active:scale-95
        `}
      >
        {/* Ripple Effect */}
        {showRipple && (
          <div className="absolute inset-0 rounded-full animate-ripple">
            <div className="absolute inset-0 rounded-full border-2 border-white/30"></div>
          </div>
        )}

        {/* Mic Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-6 h-6 text-white transition-transform duration-300
            ${isConnected ? 'rotate-45' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={isConnected
              ? "M6 18L18 6M6 6l12 12" // X icon when connected
              : "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"} // Mic icon when disconnected
          />
        </svg>

        {/* Connection Status Dot */}
        <div className={`
          absolute top-1 right-1 w-3 h-3 rounded-full
          transition-colors duration-300
          ${isConnecting ? 'bg-yellow-400 animate-pulse' :
            isConnected ? 'bg-red-400' : 'bg-green-400'}
        `} />
      </button>

      {/* Status Label */}
      <div className={`
        absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap
        text-sm font-medium transition-opacity duration-300
        ${isConnecting || isConnected ? 'opacity-100' : 'opacity-0'}
      `}>
        <span className={`
          px-2 py-1 rounded-full
          ${isConnecting ? 'bg-yellow-500/20 text-yellow-200' :
            isConnected ? 'bg-red-500/20 text-red-200' : ''}
        `}>
          {isConnecting ? 'Connecting...' : isConnected ? 'In Call' : ''}
        </span>
      </div>
    </div>
  );
}