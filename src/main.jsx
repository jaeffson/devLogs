// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
// NOVO: Importações do React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; 
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // Para debugar
import App from './App.jsx';
import './index.css';
import { Toaster } from 'react-hot-toast'; 

// 1. Cria uma instância do Query Client
// Configuração padrão para o cliente
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000, // Dados só são recarregados após 5 segundos, otimizando performance
      refetchOnWindowFocus: true, 
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. Envolve toda a aplicação no QueryClientProvider */}
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" /> 
      </BrowserRouter>
      {/* 3. Ferramenta de Desenvolvimento (DevTools) */}
      <ReactQueryDevtools initialIsOpen={false} /> 
    </QueryClientProvider>
  </React.StrictMode>,
);
