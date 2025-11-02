// src/App.jsx
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

// --- URL BASE DA API (USANDO LOCALHOST APÓS CORREÇÕES) ---
const API_BASE_URL = 'http://localhost:5000/api';
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

  // ESTADOS DE DADOS
  const [patients, setPatients] = useState([]);
  const [records, setRecords] = useState([]);
  const [medications, setMedications] = useState([]);
  const [users, setUsers] = useState([]); 
  
  const [annualBudget, setAnnualBudget] = useState(5000.0); 
  
  const [activityLog, setActivityLog] = useState([]); // <-- Este estado agora será preenchido pela API

  const navigate = useNavigate();

  // --- FUNÇÕES HELPER E TOAST (CORRIGIDAS COM useCallback) ---
  const addToast = useCallback((message, type = 'success') => {
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'error') {
      toast.error(message);
    } else {
      toast(message);
    }
  }, []); // <-- Dependência vazia, esta função nunca muda

  const addLog = useCallback(async (userName, action) => {
    const logData = {
      user: userName || 'Sistema',
      action,
    };

    // --- (INÍCIO DA CORREÇÃO) ---
    // O objeto temporário (tempLog) agora usa 'timestamp'
    // em vez de 'createdAt', para bater com o 'normalizeData'.
    const tempLog = { ...logData, id: Date.now(), timestamp: new Date().toISOString() };
    // --- (FIM DA CORREÇÃO) ---

    setActivityLog((prev) => [tempLog, ...prev].slice(0, 100));

    // 2. Salva no backend (Fire-and-Forget)
    try {
      await axios.post(`${API_BASE_URL}/logs`, logData);
    } catch (error) {
      console.error("Erro ao salvar log:", error);
      // Não mostramos um toast para falha de log, pois não é crítico para o usuário.
    }
  }, []); // <-- Dependência vazia, esta função nunca muda


  // Função que transforma _id do Mongoose em id para o React
  const normalizeData = useCallback((dataArray) => {
    if (!Array.isArray(dataArray)) return [];
    return dataArray.map((item) => ({
      ...item,
      id: item._id || item.id, // Usa o _id do Mongoose
      // Converte 'createdAt' (do MongoDB) para 'timestamp' (que o frontend usa)
      timestamp: item.createdAt || item.timestamp, 
    }));
  }, []); // <-- Dependência vazia, esta função nunca muda

  // --- FUNÇÕES DE RECARGA DE DADOS DA API (MEMORIZADAS) ---
  // (Toasts de erro removidos daqui para evitar duplicatas)
  const refetchPatients = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/patients`);
      setPatients(normalizeData(response.data));
    } catch (error) {
      console.error('Falha ao recarregar pacientes:', error);
      throw error; 
    }
  }, [normalizeData]); // <-- Depende de normalizeData

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

  // FUNÇÃO CENTRAL DE CARREGAMENTO INICIAL (MEMORIZADA)
  const fetchInitialData = useCallback(async () => {
    try {
      // Chama todas as refetchs simultaneamente
      await Promise.all([
        refetchPatients(),
        refetchRecords(),
        refetchMedications(),
        refetchUsers(),
        refetchBudget(), 
        refetchLogs(),
      ]);

      addToast('Dados carregados do servidor!', 'info');
    } catch (error) {
      console.error('Falha Crítica no Promise.all:', error);
      addToast('Erro ao iniciar dados. Verifique o console.', 'error');
    } finally {
      setIsInitializing(false); // Garante que o preloader saia
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
  
  // (Função 'handleUpdateBudget' corrigida e com useCallback)
  const handleUpdateBudget = useCallback((newBudgetValue) => {
    const numericBudget = parseFloat(newBudgetValue);
    if (!isNaN(numericBudget) && numericBudget >= 0) {
      setAnnualBudget(numericBudget);
      // (O Toast de sucesso é mostrado pelo AdminSettingsPage)
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
  }, [user, addLog, addToast]); // <-- Depende de user, addLog, addToast

  const handleLogin = useCallback((userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    addLog(userData.name, 'fez login.');
    navigate('/dashboard', { replace: true });
  }, [navigate, addLog]); // <-- Depende de navigate, addLog

  const handleLogout = useCallback(() => {
    setIsLoggingOut(true);
    addLog(user?.name, 'fez logout.');
    setTimeout(() => {
      localStorage.removeItem('user');
      setUser(null);
      setIsLoggingOut(false);
      navigate('/login', { replace: true });
    }, 500);
  }, [user, navigate, addLog]); // <-- Depende de user, navigate, addLog

  // --- EFEITOS E CHECAGEM DE INICIALIZAÇÃO (CORRIGIDO O LOOP) ---
  useEffect(() => {
    if (user && isInitializing) {
      fetchInitialData();
    }

    if (!user) {
      const initTimer = setTimeout(() => setIsInitializing(false), 1000);
      return () => clearTimeout(initTimer);
    }

    // Lógica para o banner de cookies (mantida)
    const consent = localStorage.getItem('cookieConsent');
    if (consent !== 'true') {
      const bannerTimer = setTimeout(() => setShowCookieBanner(true), 1500);
      return () => clearTimeout(bannerTimer);
    }
  }, [user, isInitializing, fetchInitialData]);

  const handleAcceptCookies = useCallback(() => {
    localStorage.setItem('cookieConsent', 'true');
    setShowCookieBanner(false);
  }, []); // <-- Envolvido em useCallback

  if (isInitializing || isLoggingOut) {
    return <FullScreenPreloader />;
  }

  // O commonPageProps está configurado para passar as funções de recarga corretas
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
    addLog, // <-- A função 'addLog' agora é estável
    annualBudget,
    handleUpdateBudget, // <-- A função 'handleUpdateBudget' agora é estável
    activityLog, // <-- Este estado agora vem da API
    getMedicationName,
  };

  return (
    <>
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
                {...commonPageProps}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

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

          {(user?.role === 'admin' || user?.role === 'secretario') && (
            <Route
              path="reports"
              element={<AdminReportsPage {...commonPageProps} />}
            />
          )}

          <Route
            path="*"
            element={
              <div className="text-center p-6 bg-white rounded shadow">
                <h2>Página não encontrada</h2>
                <Link to="/dashboard" className="text-blue-600">
                  Voltar ao Dashboard
                </Link>
              </div>
            }
          />
        </Route>
      </Routes>

      {/* Banner de Cookies (Lógica mantida) */}
      {showCookieBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 shadow-lg animate-fade-in-up z-[9990]">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-sm text-center md:text-left">
              🍪 Usamos cookies para garantir que você tenha a melhor
              experiência em nosso site.
            </p>
            <button
              onClick={handleAcceptCookies} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg text-sm flex-shrink-0"
            >
              Entendi e Aceitar
            </button>
          </div>
        </div>
      )}
    </>
  );
}