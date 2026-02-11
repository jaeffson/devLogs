import axios from 'axios';
import toast from 'react-hot-toast';

// Define a URL base
const apiUrl = import.meta.env.VITE_API_URL || 'https://backendmedlog-4.onrender.com/api';

const api = axios.create({
  baseURL: apiUrl,
});

// Interceptor para adicionar o Token automaticamente
api.interceptors.request.use((config) => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser);
      const token = parsedUser.token || parsedUser;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error('Erro token:', error);
    }
  }
  return config;
});
export const getDistributors = async () => {
    const response = await api.get('/distributors');
    return response.data;
};

export const saveDistributor = async (data) => {
    const response = await api.post('/distributors', data);
    return response.data;
};

export const updateDistributor = async (id, data) => {
    const response = await api.put(`/distributors/${id}`, data);
    return response.data;
};

export const deleteDistributor = async (id) => {
    const response = await api.delete(`/distributors/${id}`);
    return response.data;
};

export const changeUserPassword = async (data) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
};

export const requestPasswordReset = async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
};

export const getFornecedores = async () => {
    const response = await api.get('/distributors'); 
    return response.data;
};

// 2. Buscar Pacientes
export const getPacientes = async () => {
    const response = await api.get('/patients');
    return response.data;
};

// 3. Buscar Medicamentos
export const getMedicamentos = async () => {
    const response = await api.get('/medications');
    return response.data;
};

// 4. Listar Remessas
export const getRemessas = async () => {
    const response = await api.get('/remessas');
    return response.data;
};

// 5. Criar Remessa
export const createRemessa = async (data) => {
    const response = await api.post('/remessas', data);
    return response.data;
};

// 6. Adicionar Receita
export const addReceitaToRemessa = async (remessaId, data) => {
    const response = await api.post(`/remessas/${remessaId}/receitas`, data);
    return response.data;
};

// 7. Fechar Remessa
export const fecharRemessa = async (remessaId) => {
    const response = await api.put(`/remessas/${remessaId}/fechar`);
    return response.data;
};

export const shipmentService = {
  // Buscar remessas
  getOpen: () => api.get('/shipments/open'),
  getHistory: () => api.get('/shipments/history'),
  
  // A FUNÇÃO QUE ESTAVA FALTANDO (CRIAR):
  create: (data) => api.post('/shipments/create', data),
  
  // Adicionar/Editar itens
  addItem: (data) => api.post('/shipments/items', data),
  
  // Remover item específico (Lixeira do card)
  removeItem: (itemId) => api.delete(`/shipments/items/${itemId}`),

  close: (data) => api.put('/shipments/close', data),
  
  // Cancelar lote inteiro (delete com body precisa desta sintaxe)
  cancel: (data) => api.delete('/shipments/cancel', { data }),
};

export default api;





