// src/services/api.js
import axios from 'axios';

// 1. Definição da URL Base
const apiUrl =
  import.meta.env.VITE_API_URL || 'https://backendmedlog-4.onrender.com/api';

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use(
  (config) => {
    let token = null;

    // Tenta pegar o token de todas as formas possíveis que seu login pode ter salvo
    const rawToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (rawToken) {
      token = rawToken;
    } else if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Pega o token dentro do objeto do usuário
        token = parsedUser.token || parsedUser.accessToken || parsedUser;
      } catch (error) {
        console.error('Erro ao ler token:', error);
      }
    }

    // SE TEM TOKEN, ENVIA! (Isso corrige o erro 401)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {

      localStorage.removeItem('user');
      localStorage.removeItem('token');

      // Redireciona para login se não estiver lá
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getDistributors = async () =>
  (await api.get('/distributors')).data;
export const saveDistributor = async (data) =>
  (await api.post('/distributors', data)).data;
export const updateDistributor = async (id, data) =>
  (await api.put(`/distributors/${id}`, data)).data;
export const deleteDistributor = async (id) =>
  (await api.delete(`/distributors/${id}`)).data;

// Autenticação
export const changeUserPassword = async (data) =>
  (await api.post('/auth/change-password', data)).data;
export const requestPasswordReset = async (email) =>
  (await api.post('/auth/forgot-password', { email })).data;

// Alias
export const getFornecedores = async () =>
  (await api.get('/distributors')).data;

// Dados Gerais
export const getPacientes = async () => (await api.get('/patients')).data;
export const getMedicamentos = async () => (await api.get('/medications')).data;

// Remessas Antigas (Legado)
export const getRemessas = async () => (await api.get('/remessas')).data;
export const createRemessa = async (data) =>
  (await api.post('/remessas', data)).data;
export const addReceitaToRemessa = async (remessaId, data) =>
  (await api.post(`/remessas/${remessaId}/receitas`, data)).data;
export const fecharRemessa = async (remessaId) =>
  (await api.put(`/remessas/${remessaId}/fechar`)).data;

export const shipmentService = {
  getOpen: () => api.get('/shipments/open'),
  getHistory: () => api.get('/shipments/history'),
  create: (data) => api.post('/shipments/create', data),
  addItem: (data) => api.post('/shipments/items', data),
  removeItem: (itemId) => api.delete(`/shipments/items/${itemId}`),
  close: (data) => api.put('/shipments/close', data),
  cancel: (data) => api.delete('/shipments/cancel', { data }),
};

export default api;
