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
          agent-id="68ec1761b02d839a10379f06"
          api-key="dqKey_cf07b45b16a07fd296923c9bb328046e3ed53ed0a640f82d8a1f2caaef21bca37wygd2eeufc"
        ></dq-voice>`
      }}
    />
  );
}