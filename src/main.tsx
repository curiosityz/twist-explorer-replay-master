
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { initializeApplication } from './lib/appInitializer';
import { Toaster } from './components/ui/toaster';

// Initialize the application before rendering
document.addEventListener('DOMContentLoaded', () => {
  initializeApplication();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster />
    </BrowserRouter>
  </React.StrictMode>
);
