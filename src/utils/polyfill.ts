
// Import the crypto module for use in the browser
import { Buffer } from 'buffer';
import crypto from 'crypto-browserify';

// Make crypto available globally
window.Buffer = Buffer;
window.crypto = window.crypto || crypto;

// Polyfill for createHash in the browser
export const createHash = (algorithm: string) => {
  // Use SubtleCrypto API for browser environments
  return {
    update: (data: string) => {
      return {
        digest: (encoding: string) => {
          // Simple implementation for SHA-256 using browser's crypto
          const msgUint8 = new TextEncoder().encode(data);
          const hashBuffer = window.crypto.subtle.digest('SHA-256', msgUint8);
          
          // Convert to hex string
          return hashBuffer.then(buffer => {
            const hashArray = Array.from(new Uint8Array(buffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            if (encoding === 'hex') {
              return hashHex;
            }
            return hashHex;
          });
        }
      };
    }
  };
};
