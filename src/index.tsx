import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(() => {
      // ServiceWorker registered successfully
    }).catch(error => {
      console.error('Registrazione ServiceWorker fallita:', error);
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Elemento root non trovato per il mount");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
