
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeApplication } from './lib/appInitializer';
import { Toaster } from 'sonner';

// Initialize the application before rendering
// Make sure to initialize before React renders
initializeApplication();

// Then proceed with normal React rendering
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);

// Add Toaster at the application root level
ReactDOM.createRoot(document.getElementById('toaster-root') || document.createElement('div')).render(
  <Toaster />
);
