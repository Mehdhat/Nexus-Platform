import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { TourProvider } from './context/TourContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TourProvider>
      <App />
    </TourProvider>
  </StrictMode>
);
