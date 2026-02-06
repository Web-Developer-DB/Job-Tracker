import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Einstiegspunkt: Root-Element aus der HTML-Datei holen.
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

// React-App in das Root-Element rendern.
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service Worker nur in Production registrieren (PWA).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed.', err);
    });
  });
}
