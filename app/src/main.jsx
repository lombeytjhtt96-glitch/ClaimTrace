import React from 'react'
import ReactDOM from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import { injectSpeedInsights } from '@vercel/speed-insights'
import App from './App.jsx'
import './index.css'

// Initialize Vercel Speed Insights
injectSpeedInsights()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </React.StrictMode>,
)
