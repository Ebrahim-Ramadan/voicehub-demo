declare global {
  namespace JSX {
    interface IntrinsicElements {
      'dq-voice': {
        'agent-id'?: string;
        'api-key'?: string;
        [key: string]: any;
      };
    }
  }
}

export {};
