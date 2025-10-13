"use client";
import { useEffect } from 'react';

declare global {
  interface Window {
    DqVoiceWidget?: any;
  }
  namespace JSX {
    interface IntrinsicElements {
      'dq-voice': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'agent-id': string;
        'api-key': string;
      }, HTMLElement>;
    }
  }
}

export default function VoiceHubWidget() {
  useEffect(() => {
    // Add the VoiceHub script if it's not already loaded
    if (!document.querySelector('script[src="https://voicehub.dataqueue.ai/DqVoiceWidget.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://voicehub.dataqueue.ai/DqVoiceWidget.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div 
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      dangerouslySetInnerHTML={{
        __html: `<dq-voice
          agent-id="68e59a67ebf131f13030265b"
          api-key="dqKey_891f22908457d4ec3fa25de1cad472fa59a940ffa8d5ec52fdd0196604980670ure6wzs3zu"
        ></dq-voice>`
      }}
    />
  );
}