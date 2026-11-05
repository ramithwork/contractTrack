import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker immediately for offline caching and background notifications
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New content available, reloading...');
  },
  onOfflineReady() {
    console.log('contractTrack is ready for offline operation.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
