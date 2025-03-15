
// Import required polyfills for browser compatibility
import { Buffer } from 'buffer';

// Make Buffer available globally
window.Buffer = window.Buffer || Buffer;

// Set up global variables for Node.js compatibility
if (typeof window !== 'undefined') {
  if (!window.global) {
    (window as any).global = window;
  }
  
  // Ensure process is defined for libraries that expect it
  if (!window.process) {
    (window as any).process = { env: {} };
  }
}

export default {};
