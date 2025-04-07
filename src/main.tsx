
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeApplication } from './lib/appInitializer';
import { Toaster } from 'sonner';

// Initialize the application before rendering
document.addEventListener('DOMContentLoaded', () => {
  initializeApplication();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>
);
