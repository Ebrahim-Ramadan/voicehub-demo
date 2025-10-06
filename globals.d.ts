import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'dq-voice': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'agent-id'?: string;
        'api-key'?: string;
      };
    }
  }
}

export {};
