declare global {
  namespace JSX {
    interface IntrinsicElements {
      // allow <dq-voice agent-id="..." api-key="..." /> in JSX
      'dq-voice': {
        'agent-id'?: string;
        'api-key'?: string;
        // allow any other attributes (class, id, style, etc.)
        [key: string]: any;
      };
    }
  }
}

export {};
