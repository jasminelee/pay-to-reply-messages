
// Import required polyfills for browser compatibility
import { Buffer as BufferFromPackage } from 'buffer';

// Make Buffer available globally
if (typeof window !== 'undefined') {
  // Ensure Buffer is defined properly
  window.Buffer = window.Buffer || BufferFromPackage;
  
  // Set up global variables for Node.js compatibility
  if (!window.global) {
    (window as any).global = window;
  }
  
  // Ensure process is defined for libraries that expect it
  if (!window.process) {
    (window as any).process = { env: {} };
  }
}

export default {};
