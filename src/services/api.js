import axios from 'axios';
import toast from 'react-hot-toast';

// Define a URL base (conecta com seu backend)
const apiUrl = import.meta.env.VITE_API_URL || 'https://backendmedlog-4.onrender.com/api';

const api = axios.create({
  baseURL: apiUrl,
});

// Adiciona o Token de segurança em cada pedido
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

// --- AQUI ESTÃO AS FUNÇÕES QUE FALTAVAM ---
// Elas são criadas AQUI no Front para poderem chamar o Back

export const getDistributors = async () => {
    // O front pede ao back: "Me dê a lista"
    const response = await api.get('/distributors');
    return response.data;
};

export const saveDistributor = async (data) => {
    // O front envia ao back: "Salve isso"
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
    // Envia { currentPassword, newPassword } para o backend
    // NOTA: Confirme se a rota '/auth/change-password' é a correta no seu backend.
    // Pode ser '/users/change-password' ou apenas '/change-password' dependendo da sua API.
    const response = await api.post('/auth/change-password', data);
    return response.data;
};

export default api;