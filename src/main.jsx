// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { Toaster } from 'react-hot-toast'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* O QueryClientProvider TAMBÉM FOI REMOVIDO, deixando apenas os wrappers necessários: */}
    <BrowserRouter>
      <App />
      <Toaster position="top-right" /> 
    </BrowserRouter>
    {/* O ReactQueryDevtools TAMBÉM FOI REMOVIDO */}
  </React.StrictMode>,
);