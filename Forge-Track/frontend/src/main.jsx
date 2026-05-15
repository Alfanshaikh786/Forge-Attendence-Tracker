import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initCursor, initScrollAnimations } from './utils/cursorAnimation.js'

// Initialize animations
initCursor();
initScrollAnimations();

// Re-initialize scroll animations after route changes
const observer = new MutationObserver(() => {
  initScrollAnimations();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
