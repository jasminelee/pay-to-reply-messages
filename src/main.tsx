
// Import polyfill first
import './utils/polyfill.ts';

// Regular imports
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { Toaster } from '@/components/ui/toaster';
import './index.css';

// Log environment information
console.log('Environment:', {
  mode: import.meta.env.MODE,
  origin: window.location.origin,
  hostname: window.location.hostname
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster />
    </BrowserRouter>
  </React.StrictMode>,
);
