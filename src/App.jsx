// src/App.jsx
// (CORRIGIDO: 'filterYear' movido para cá como fonte da verdade)
// (ADICIONADO: Lógica do Modal de Boas-Vindas)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

// --- Imports das Páginas e Layouts ---
import LoginPage from './pages/LoginPage';
import MainLayout from './layouts/MainLayout';
import ProfessionalDashboardPage from './pages/ProfessionalDashboardPage';
import SecretaryDashboardPage from './pages/SecretaryDashboardPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import MedicationsPage from './pages/MedicationsPage';
import SecretarySettingsPage from './pages/SecretarySettingsPage';
import AdminReportsPage from '../src/pages/AdminReportsPage';

// --- Imports de Componentes Comuns e Utils ---
import { FullScreenPreloader } from './components/common/FullScreenPreloader';
import { getMedicationName } from './utils/helpers'; // Funções de utilidade

// --- (NOVO) IMPORT DO MODAL DE BOAS-VINDAS ---
// Certifique-se que o caminho está correto
import WelcomeModal from './components/WelcomeModal/WelcomeModal.jsx'; 

const API_BASE_URL = 'https://backendmedlog-4.onrender.com/api';
// -----------------------

export default function App() {
  // --- ESTADOS PRINCIPAIS ---
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [showCookieBanner, setShowCookieBanner] = useState(false);

  // --- (NOVO) ESTADO DO MODAL DE BOAS-VINDAS ---
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  // ---

  // ESTADOS DE DADOS
  const [patients, setPatients] = useState([]);
  const [records, setRecords] = useState([]);
  const [medications, setMedications] = useState([]);
  const [users, setUsers] = useState([]); 
  
  const [annualBudget, setAnnualBudget] = useState(5000.0); 
  
  const [activityLog, setActivityLog] = useState([]); 

  // --- (INÍCIO DA MUDANÇA 1) ---
  // filterYear agora vive aqui, como fonte única da verdade
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  // --- (FIM DA MUDANÇA 1) ---

  const navigate = useNavigate();

  // --- FUNÇÕES HELPER E TOAST (Sem mudança) ---
  const addToast = useCallback((message, type = 'success') => {
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'error') {
      toast.error(message);
    } else {
      toast(message);
    }
  }, []); 

  const addLog = useCallback(async (userName, action) => {
    const logData = {
      user: userName || 'Sistema',
      action,
    };
    const tempLog = { ...logData, id: Date.now(), timestamp: new Date().toISOString() };
    setActivityLog((prev) => [tempLog, ...prev].slice(0, 100));
    try {
      await axios.post(`${API_BASE_URL}/logs`, logData);
    } catch (error) {
      console.error("Erro ao salvar log:", error);
    }
  }, []); 

  const normalizeData = useCallback((dataArray) => {
    if (!Array.isArray(dataArray)) return [];
    return dataArray.map((item) => ({
      ...item,
      id: item._id || item.id, 
      timestamp: item.createdAt || item.timestamp, 
    }));
  }, []); 

  // --- FUNÇÕES DE RECARGA DE DADOS (Sem mudança) ---
  const refetchPatients = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/patients`);
      setPatients(normalizeData(response.data));
    } catch (error) {
      console.error('Falha ao recarregar pacientes:', error);
      throw error; 
    }
  }, [normalizeData]); 

  const refetchRecords = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/records`);
      setRecords(normalizeData(response.data));
    } catch (error) {
      console.error('Falha ao recarregar registros:', error);
      throw error;
    }
  }, [normalizeData]);

  const refetchMedications = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/medications`);
      setMedications(normalizeData(response.data));
    } catch (error) {
      console.error('Falha ao recarregar medicações:', error);
      throw error;
    }
  }, [normalizeData]);

  const refetchUsers = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users`);
      setUsers(normalizeData(response.data));
    } catch (error) {
      console.error('Falha ao recarregar usuários:', error);
      throw error;
    }
  }, [normalizeData]);

  const refetchBudget = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings/budget`);
      if (response.data && response.data.annualBudget != null) {
        setAnnualBudget(parseFloat(response.data.annualBudget));
      }
    } catch (error) {
      console.error('Falha ao carregar orçamento:', error);
      throw error;
    }
  }, []); 

  const refetchLogs = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/logs`);
      setActivityLog(normalizeData(response.data)); 
    } catch (error) {
      console.error('Falha ao carregar logs:', error);
      throw error;
    }
  }, [normalizeData]);

  const fetchInitialData = useCallback(async () => {
    try {
      await Promise.all([
        refetchPatients(),
        refetchRecords(),
        refetchMedications(),
        refetchUsers(),
        refetchBudget(), 
        refetchLogs(),
      ]);
    } catch (error) {
      console.error('Falha Crítica no Promise.all:', error);
      addToast('Erro ao carregar dados iniciais. Tente atualizar a página.', 'error');
    } finally {
      setIsInitializing(false); 
    }
  }, [
      refetchPatients, 
      refetchRecords, 
      refetchMedications, 
      refetchUsers, 
      refetchBudget,
      refetchLogs,
      addToast
    ]); 

  // --- Lógica de Login/Logout/Config ---
  
  const handleUpdateBudget = useCallback((newBudgetValue) => {
    const numericBudget = parseFloat(newBudgetValue);
    if (!isNaN(numericBudget) && numericBudget >= 0) {
      setAnnualBudget(numericBudget);
      addLog(
        user?.name,
        `atualizou o orçamento para R$ ${new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(numericBudget)}.`
      );
    } else {
      addToast('Valor de orçamento inválido recebido.', 'error');
    }
  }, [user, addLog, addToast]); 

  const handleLogin = useCallback((userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    addLog(userData.name, 'fez login.');
    setIsInitializing(true); // Correção do bug de login
    navigate('/dashboard', { replace: true });
  }, [navigate, addLog]); 

  const handleLogout = useCallback(() => {
    setIsLoggingOut(true);
    addLog(user?.name, 'fez logout.');
    setTimeout(() => {
      localStorage.removeItem('user');
      setUser(null);
      setIsLoggingOut(false);
      navigate('/login', { replace: true });
    }, 500);
  }, [user, navigate, addLog]); 

  // --- EFEITOS E CHECAGEM DE INICIALIZAÇÃO (Sem mudança) ---
  useEffect(() => {
    if (user && isInitializing) {
      fetchInitialData();
    }
    if (!user) {
      const initTimer = setTimeout(() => setIsInitializing(false), 1000);
      return () => clearTimeout(initTimer);
    }
    const consent = localStorage.getItem('cookieConsent');
    if (consent !== 'true') {
      const bannerTimer = setTimeout(() => setShowCookieBanner(true), 1500);
      return () => clearTimeout(bannerTimer);
    }
  }, [user, isInitializing, fetchInitialData]);

  // --- (NOVO) USEEFFECT PARA O MODAL DE BOAS-VINDAS ---
  // Este useEffect roda separado, apenas quando 'user' muda
  useEffect(() => {
    // Só checa se o usuário ESTÁ logado
    if (user) {
      const hasSeenModal = localStorage.getItem('hasSeenWelcomeModal');
      
      // Se ele nunca viu (!hasSeenModal)
      if (!hasSeenModal) {
        // Mostra o modal (com um pequeno delay para não sobrepor a UI)
        const modalTimer = setTimeout(() => {
          setShowWelcomeModal(true);
        }, 800); // 800ms de delay
        
        return () => clearTimeout(modalTimer);
      }
    }
  }, [user]); // Depende apenas do 'user'
  // ---

  const handleAcceptCookies = useCallback(() => {
    localStorage.setItem('cookieConsent', 'true');
    setShowCookieBanner(false);
  }, []); 

  // --- (NOVO) HANDLER PARA FECHAR O MODAL ---
  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
    // Grava no LocalStorage que o usuário já viu o modal
    localStorage.setItem('hasSeenWelcomeModal', 'true');
  };
  // ---

  if (isInitializing || isLoggingOut) {
    return <FullScreenPreloader />;
  }

  // --- (INÍCIO DA MUDANÇA 2) ---
  // Adicionado filterYear e setFilterYear ao commonPageProps
  const commonPageProps = {
    user,
    patients,
    setPatients: refetchPatients,
    records,
    setRecords: refetchRecords,
    medications,
    setMedications: refetchMedications,
    users,
    setUsers: refetchUsers,
    addToast,
    addLog, 
    annualBudget,
    handleUpdateBudget, 
    activityLog, 
    getMedicationName,
    filterYear,       // <-- PROP ADICIONADA
    setFilterYear,    // <-- PROP ADICIONADA
  };
  // --- (FIM DA MUDANÇA 2) ---

  return (
    <>
      {/* --- (NOVO) RENDERIZAÇÃO CONDICIONAL DO MODAL --- */}
      {/* Ele fica aqui no topo para sobrepor todo o resto */}
      {showWelcomeModal && <WelcomeModal onClose={handleCloseWelcomeModal} />}
      {/* --- */}

      <Routes>
        <Route
          path="/login"
          element={
            !user ? (
              <LoginPage
                onLogin={handleLogin}
                setUsers={setUsers} 
                addToast={addToast}
                addLog={addLog}
                MOCK_USERS={users} 
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        <Route
          path="/"
          element={
            user ? (
              <MainLayout
                user={user}
                handleLogout={handleLogout}
                {...commonPageProps} // <-- filterYear e setFilterYear são passados aqui
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Rota do Dashboard (agora recebe filterYear) */}
          <Route
            path="dashboard"
            element={
              user?.role === 'secretario' ? (
                <SecretaryDashboardPage {...commonPageProps} />
              ) : (
                <ProfessionalDashboardPage {...commonPageProps} />
              )
            }
          />

          {(user?.role === 'professional' || user?.role === 'admin' || user?.role === 'Professional') && (
            <>
              <Route
                path="patients"
                element={
                  <ProfessionalDashboardPage
                    {...commonPageProps}
                    activeTabForced="patients"
                  />
                }
              />
              <Route
                path="history" 
                element={
                  <ProfessionalDashboardPage
                    {...commonPageProps}
                    activeTabForced="historico"
                  />
                }
              />
              <Route
                path="deliveries"
                element={
                  <ProfessionalDashboardPage
                    {...commonPageProps}
                    activeTabForced="deliveries"
                  />
                }
              />
              <Route
                path="medications"
                element={<MedicationsPage {...commonPageProps} />}
              />
            </>
          )}

          {user?.role === 'secretario' && (
            <>
              <Route
                path="deliveries"
                element={
                  <SecretaryDashboardPage
                    {...commonPageProps}
                    activeTabForced="deliveries"
                  />
                }
              />
              <Route
                path="reports-general"
                element={
                  <SecretaryDashboardPage
                    {...commonPageProps}
                    activeTabForced="all_history"
                  />
                }
              />
              <Route
                path="patient-history"
                element={
                  <SecretaryDashboardPage
                    {...commonPageProps}
                    activeTabForced="records"
                  />
                }
              />
              <Route
                path="settings"
                element={<SecretarySettingsPage {...commonPageProps} />}
              />
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <Route
                path="settings"
                element={<AdminSettingsPage {...commonPageProps} />}
              />
            </>
          )}

          {/* Rota de Relatórios (agora recebe filterYear) */}
          {(user?.role === 'admin' || user?.role === 'secretario') && (
            <Route
              path="reports"
              element={<AdminReportsPage {...commonPageProps} />} // <-- filterYear é passado aqui
            />
          )}

          <Route
            path="*"
            element={
              <div className="text-center p-6 bg-white rounded shadow">
                <h2>Página não encontrada</h2>
                <Link to="/dashboard" className="text-emerald-600">
                  Voltar ao Dashboard
                </Link>
              </div>
            }
          />
        </Route>
      </Routes>

      {/* Banner de Cookies (Cor atualizada) */}
      {showCookieBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 shadow-lg animate-fade-in-up z-[9990]">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-sm text-center md:text-left">
              🍪 Usamos cookies para garantir que você tenha a melhor
              experiência em nosso site.
            </p>
            <button
              onClick={handleAcceptCookies} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded-lg text-sm flex-shrink-0"
            >
              Entendi e Aceitar
            </button>
          </div>
        </div>
      )}
    </>
  );
}


