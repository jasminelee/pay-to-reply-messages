
import './utils/polyfill.ts'; // Must be first import
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Catch-all Buffer initialization if polyfill.ts didn't work
if (typeof window !== 'undefined' && !window.Buffer) {
  console.warn('Fallback Buffer initialization required');
  // Simply importing the buffer package and using it directly
  window.Buffer = require('buffer').Buffer;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
