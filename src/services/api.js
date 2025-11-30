// src/services/api.js
import axios from 'axios';

const api = axios.create({
  // COMENTE A LINHA DO ENV e coloque a URL fixa do seu localhost:
  // baseURL: import.meta.env.VITE_API_URL, 
  baseURL: 'http://localhost:5000/api', 
});

// ... resto do código igual ...

// Interceptador: Adiciona o Token em toda requisição automaticamente
api.interceptors.request.use((config) => {
  const storedUser = localStorage.getItem('user');
  
  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser);
      // Pega o token se estiver salvo como objeto ou string
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

export default api;