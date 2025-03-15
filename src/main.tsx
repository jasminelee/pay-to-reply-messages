
import './utils/polyfill.ts'; // Must be first import
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Prevent "Buffer is not defined" errors in console
if (typeof window !== 'undefined' && !window.Buffer) {
  console.log('Initializing Buffer polyfill');
  // Using the buffer module properly
  const buffer = require('buffer');
  window.Buffer = buffer.Buffer;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
