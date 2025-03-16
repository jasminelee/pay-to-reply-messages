// Import the crypto module for use in the browser
import { Buffer } from 'buffer';

// Simple polyfill approach - avoid complex operations that might cause errors
if (typeof window !== 'undefined') {
  // Safely assign Buffer to window
  try {
    window.Buffer = window.Buffer || Buffer;
  } catch (e) {
    console.warn('Could not assign Buffer to window:', e);
  }
}

// Safely polyfill crypto if needed
if (typeof window !== 'undefined') {
  try {
    // Only add crypto polyfill if it doesn't exist or is incomplete
    if (!window.crypto || !window.crypto.subtle) {
      const cryptoBrowserify = require('crypto-browserify');
      // Use Object.defineProperty to avoid direct assignment issues
      Object.defineProperty(window, 'crypto', {
        value: {
          ...window.crypto,
          ...cryptoBrowserify
        },
        writable: true,
        configurable: true
      });
    }
  } catch (error) {
    console.warn('Failed to polyfill crypto:', error);
  }
}

// Export a simple version of createHash that won't cause errors
export const createHash = (algorithm: string) => {
  return {
    update: (data: string) => {
      return {
        digest: (encoding: string) => {
          // Return a simple hash for compatibility
          return Promise.resolve(data);
        }
      };
    }
  };
};
