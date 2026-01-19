import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Hardcoded Railway URLs (environment variables not working)
console.log('=== Using Hardcoded Railway URLs ===');
console.log('API URL: https://backend-production-1710.up.railway.app/api');
console.log('WebSocket URL: wss://backend-production-1710.up.railway.app');

// Build timestamp: 2026-01-19 05:44:00 - FORCE NEW BUILD
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
