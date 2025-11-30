// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
// AS IMPORTAÇÕES ABAIXO FORAM REMOVIDAS:
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; 
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App.jsx';
import './index.css';
import { Toaster } from 'react-hot-toast'; 

// A inicialização do QueryClient TAMBÉM FOI REMOVIDA:
// const queryClient = new QueryClient({...}); 

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