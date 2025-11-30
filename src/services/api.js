import axios from 'axios';

// --- DEBUG: Isso vai mostrar no console do navegador qual URL ele pegou ---
const apiUrl = import.meta.env.VITE_API_URL;
console.log('⚠️ DEBUG API URL:', apiUrl);
console.log('⚠️ MODO:', import.meta.env.MODE);

const api = axios.create({
  baseURL: apiUrl,
});

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
      console.error("Erro token", error);
    }
  }
  return config;
});

export default api;