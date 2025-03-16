
import './utils/polyfill.ts'; // Must be first import
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Additional Buffer initialization (fallback)
if (typeof window !== 'undefined' && !window.Buffer) {
  console.log('Fallback Buffer initialization required');
  try {
    // Using a safer approach
    import('buffer').then(bufferModule => {
      window.Buffer = bufferModule.Buffer;
      console.log('Buffer successfully initialized');
    });
  } catch (error) {
    console.error('Failed to initialize Buffer:', error);
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
