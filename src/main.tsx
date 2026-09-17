import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// Cast the root element as HTMLElement to satisfy strict null checks
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);