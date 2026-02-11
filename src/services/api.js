// src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

// 1. Definição da URL Base
// Tenta pegar do ambiente, senão usa a sua URL de produção do Render
const apiUrl = import.meta.env.VITE_API_URL || 'https://backendmedlog-4.onrender.com/api';

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// 2. INTERCEPTORS (O GUARDA-COSTAS)
// ============================================================================

// A) REQUEST: Anexa o Token automaticamente em TODA requisição
api.interceptors.request.use(
  (config) => {
    let token = null;

    // TENTATIVA 1: Buscar token direto (se salvo isoladamente)
    const rawToken = localStorage.getItem('token');
    if (rawToken) {
      token = rawToken;
    } else {
      // TENTATIVA 2: Buscar dentro do objeto 'user'
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // Tenta pegar .token, .accessToken ou o próprio objeto se for string
          token = parsedUser.token || parsedUser.accessToken || (typeof parsedUser === 'string' ? parsedUser : null);
        } catch (error) {
          console.error('Erro ao processar token do usuário:', error);
        }
      }
    }

    // Se achou o token, cola no cabeçalho
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// B) RESPONSE: Trata erros globais (Ex: Token expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Se o erro for 401 (Não Autorizado), significa que o token venceu ou é inválido
    if (error.response && error.response.status === 401) {
      console.warn('Sessão expirada ou token inválido. Realizando logout...');
      
      // Limpa dados locais para evitar loops
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      // Opcional: Forçar recarregamento para cair na tela de login
      // Apenas se não estivermos já na tela de login para não dar loop
      if (!window.location.pathname.includes('/login')) {
         window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// 3. SERVIÇOS E FUNÇÕES EXPORTADAS
// ============================================================================

// --- Distribuidores ---
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

// --- Autenticação ---
export const changeUserPassword = async (data) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
};

export const requestPasswordReset = async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
};

// --- Alias para Distribuidores (Legado) ---
export const getFornecedores = async () => {
    const response = await api.get('/distributors'); 
    return response.data;
};

// --- Pacientes ---
export const getPacientes = async () => {
    const response = await api.get('/patients');
    return response.data;
};

// --- Medicamentos ---
export const getMedicamentos = async () => {
    const response = await api.get('/medications');
    return response.data;
};

// --- Remessas (Antigo / Legado) ---
export const getRemessas = async () => {
    const response = await api.get('/remessas');
    return response.data;
};

export const createRemessa = async (data) => {
    const response = await api.post('/remessas', data);
    return response.data;
};

export const addReceitaToRemessa = async (remessaId, data) => {
    const response = await api.post(`/remessas/${remessaId}/receitas`, data);
    return response.data;
};

export const fecharRemessa = async (remessaId) => {
    const response = await api.put(`/remessas/${remessaId}/fechar`);
    return response.data;
};

// --- SHIPMENT SERVICE (Novo Sistema de Remessas) ---
// Este é o que estava dando erro 401. Agora vai funcionar.
export const shipmentService = {
  // Buscar remessas abertas
  getOpen: () => api.get('/shipments/open'),
  
  // Buscar histórico
  getHistory: () => api.get('/shipments/history'),
  
  // Criar nova remessa (O erro estava aqui)
  create: (data) => api.post('/shipments/create', data),
  
  // Adicionar/Editar itens na remessa
  addItem: (data) => api.post('/shipments/items', data),
  
  // Remover item específico
  removeItem: (itemId) => api.delete(`/shipments/items/${itemId}`),

  // Fechar lote
  close: (data) => api.put('/shipments/close', data),
  
  // Cancelar lote inteiro
  cancel: (data) => api.delete('/shipments/cancel', { data }),
};

export default api;