// src/App.jsx
// (CORRIGIDO: Liberação das rotas para todas as variações de 'Profissional')

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from './services/api'; // Instância configurada

// --- Imports das Páginas e Layouts ---
import LoginPage from './pages/LoginPage';
import MainLayout from './layouts/MainLayout';
import ProfessionalDashboardPage from './pages/ProfessionalDashboardPage';
import SecretaryDashboardPage from './pages/SecretaryDashboardPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import MedicationsPage from './pages/MedicationsPage';
import SecretarySettingsPage from './pages/SecretarySettingsPage';
import AdminReportsPage from '../src/pages/AdminReportsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import { FullScreenPreloader } from './components/common/FullScreenPreloader';
import { getMedicationName } from './utils/helpers';
import WelcomeModal from './components/WelcomeModal/WelcomeModal.jsx';

export default function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // ESTADOS DE DADOS
  const [patients, setPatients] = useState([]);
  const [records, setRecords] = useState([]);
  const [medications, setMedications] = useState([]);
  const [users, setUsers] = useState([]);

  const [annualBudget, setAnnualBudget] = useState(5000.0);
  const [activityLog, setActivityLog] = useState([]);

  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const navigate = useNavigate();

  // --- Helpers ---
  const addToast = useCallback((message, type = 'success') => {
    if (type === 'success') toast.success(message);
    else if (type === 'error') toast.error(message);
    else toast(message);
  }, []);

  const addLog = useCallback(async (userName, action) => {
    const logData = { user: userName || 'Sistema', action };
    const tempLog = {
      ...logData,
      id: Date.now(),
      timestamp: new Date().toISOString(),
    };
    setActivityLog((prev) => [tempLog, ...prev].slice(0, 100));
    try {
      await api.post('/logs', logData);
    } catch (error) {
      console.error('Erro ao salvar log:', error);
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

  // --- Recargas de Dados ---
  const refetchPatients = useCallback(async () => {
    try {
      const response = await api.get('/patients');
      setPatients(normalizeData(response.data));
    } catch (error) {
      console.error('Falha ao recarregar pacientes:', error);
    }
  }, [normalizeData]);

  const refetchRecords = useCallback(async () => {
    try {
      const response = await api.get('/records');
      setRecords(normalizeData(response.data));
    } catch (error) {
      console.error('Falha ao recarregar registros:', error);
    }
  }, [normalizeData]);

  const refetchMedications = useCallback(async () => {
    try {
      const response = await api.get('/medications/all');
      setMedications(normalizeData(response.data));
    } catch (error) {
      console.error('Falha ao recarregar medicações:', error);
    }
  }, [normalizeData]);

  const refetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/users');
      setUsers(normalizeData(response.data));
    } catch (error) {
      console.error('Falha ao recarregar usuários:', error);
    }
  }, [normalizeData]);

  const refetchBudget = useCallback(async () => {
    try {
      const response = await api.get('/settings/budget');
      if (response.data && response.data.annualBudget != null) {
        setAnnualBudget(parseFloat(response.data.annualBudget));
      }
    } catch (error) {
      console.error('Falha ao carregar orçamento:', error);
    }
  }, []);

  const refetchLogs = useCallback(async () => {
    try {
      const response = await api.get('/logs');
      setActivityLog(normalizeData(response.data));
    } catch (error) {
      console.error('Falha ao carregar logs:', error);
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
      addToast(
        'Erro ao carregar dados iniciais. Verifique se o backend local está rodando.',
        'error'
      );
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
    addToast,
  ]);

  const handleUpdateBudget = useCallback(
    (newBudgetValue) => {
      const numericBudget = parseFloat(newBudgetValue);
      if (!isNaN(numericBudget) && numericBudget >= 0) {
        setAnnualBudget(numericBudget);
        addLog(user?.name, `atualizou o orçamento.`);
      } else {
        addToast('Valor de orçamento inválido recebido.', 'error');
      }
    },
    [user, addLog, addToast]
  );

  const handleLogin = useCallback(
    (userData) => {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      addLog(userData.name, 'fez login.');
      setIsInitializing(true);
      navigate('/dashboard', { replace: true });
    },
    [navigate, addLog]
  );

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

  useEffect(() => {
    if (user && isInitializing) fetchInitialData();
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

  useEffect(() => {
    if (user) {
      const hasSeenModal = localStorage.getItem('hasSeenWelcomeModal');
      if (!hasSeenModal) {
        const modalTimer = setTimeout(() => setShowWelcomeModal(true), 800);
        return () => clearTimeout(modalTimer);
      }
    }
  }, [user]);

  const handleAcceptCookies = useCallback(() => {
    localStorage.setItem('cookieConsent', 'true');
    setShowCookieBanner(false);
  }, []);

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
    localStorage.setItem('hasSeenWelcomeModal', 'true');
  };

  if (isInitializing || isLoggingOut) {
    return <FullScreenPreloader />;
  }

  // Helper para verificar se é profissional (aceitando várias escritas)
  const isProfessionalUser =
    user &&
    (user.role === 'profissional' ||
      user.role === 'Profissional' ||
      user.role === 'admin' ||
      user.role === 'Professional');

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
    filterYear,
    setFilterYear,
  };

  return (
    <>
      {showWelcomeModal && <WelcomeModal onClose={handleCloseWelcomeModal} />}

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

          {/* Rota do Dashboard Geral */}
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
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        
          {isProfessionalUser && (
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
            <Route
              path="settings"
              element={<AdminSettingsPage {...commonPageProps} />}
            />
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
                <Link to="/dashboard" className="text-emerald-600">
                  Voltar ao Dashboard
                </Link>
              </div>
            }
          />
        </Route>
      </Routes>
    </>
  );
}
