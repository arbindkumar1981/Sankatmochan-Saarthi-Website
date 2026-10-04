// Local browser test harness only. No real Firebase or backend calls are made.
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../../src/App';
import '../../src/index.css';
createRoot(document.getElementById('root')!).render(<App />);
