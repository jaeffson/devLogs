// src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast'; 
// Tenta pegar a variável do Vercel. Se falhar (ex: rodando local), usa o link do Render.
const apiUrl = import.meta.env.VITE_API_URL || 'https://backendmedlog-4.onrender.com/api';


const api = axios.create({
  baseURL: apiUrl,
});

// --- 2. INTERCEPTOR DE REQUISIÇÃO (Adiciona o Token) ---
api.interceptors.request.use((config) => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser);
      const token = parsedUser.token || parsedUser;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Erro ao ler token do localStorage", error);
    }
  }
  return config;
});

// --- 3. NOVO: INTERCEPTOR DE RESPOSTA (Tratamento Global de Erros) ---
api.interceptors.response.use(
  (response) => response, // Se for sucesso, apenas retorna a resposta
  (error) => {
    // A. Captura o objeto de resposta de erro, se existir
    const { response } = error;
    
    
    if (!response) {
        toast.error('Erro de rede. Verifique a conexão do servidor.');
        return Promise.reject(error);
    }

    const status = response.status;
    const serverMessage = response.data?.message;

 
    
    // 401: Não Autorizado (Token Expirado ou Inválido)
    if (status === 401) {
      localStorage.removeItem('user');
     toast.error('Sessão expirada ou não autorizada. Faça login novamente.', { duration: 5000 });
 
    }
    
    // 400, 403, 404, 409 e outros erros do cliente
    else if (status >= 400 && status < 500) {
      const msg = Array.isArray(serverMessage) ? serverMessage[0] : serverMessage || `Erro ${status}. Dados inválidos.`;
      toast.error(msg);
    } 
    
    // 500+: Erros de Servidor
    else if (status >= 500) {
      toast.error('Erro interno do servidor. Tente novamente mais tarde.');
    }

    // Retorna a promessa rejeitada para que o 'catch' original ainda possa ser usado
    return Promise.reject(error);
  }
);

export default api;