import React from 'react'
import ReactDOM from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import { injectSpeedInsights } from '@vercel/speed-insights'
import App from './App.jsx'
import './index.css'

// Initialize Vercel Speed Insights
injectSpeedInsights()

// Register Service Worker for offline Wasrik hospital field audit resilience
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[SW Registration Error]:', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </React.StrictMode>,
)
