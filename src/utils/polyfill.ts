// Import required polyfills for browser compatibility
import { Buffer } from 'buffer';

// Make Buffer available globally
window.Buffer = Buffer;

// Set up a global variable for Node.js compatibility
if (typeof window !== 'undefined' && !window.global) {
  (window as any).global = window;
}

export default {}; 