// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from './services/api';
import { useSyncManager } from './hooks/useSyncManager';

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
import Profile from './pages/Profile.jsx';
import { FullScreenPreloader } from './components/common/FullScreenPreloader';
import { getMedicationName } from './utils/helpers';
import WelcomeModal from './components/WelcomeModal/WelcomeModal.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ShipmentsPage from './pages/ShipmentsPage';
import PublicShipmentView from './pages/PublicShipmentView';
import ShipmentConferencePage from './pages/ShipmentConferencePage.jsx';

export default function App() {
  useSyncManager();
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
  const [shipments, setShipments] = useState([]); 
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
    setActivityLog((prev) => [logData, ...prev].slice(0, 100)); // Otimista
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

 
  const refetchShipments = useCallback(async () => {
    try {
      // Tenta buscar nas rotas (trata plural e singular automaticamente)
      const [historyRes, openRes] = await Promise.allSettled([
        api.get('/shipments/history').catch(() => api.get('/shipment/history')),
        api.get('/shipments/open').catch(() => api.get('/shipment/open'))
      ]);

      let combined = [];
      
      if (historyRes.status === 'fulfilled' && historyRes.value?.data) {
        combined = [...combined, ...historyRes.value.data];
      }
      if (openRes.status === 'fulfilled' && openRes.value?.data) {
        combined = [...combined, ...openRes.value.data];
      }
      const uniqueShipments = Array.from(new Map(combined.map(item => [item._id || item.id, item])).values());
      
      setShipments(normalizeData(uniqueShipments));
    } catch (error) {
      console.error('Falha ao recarregar remessas:', error);
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
        refetchShipments(),
        refetchMedications(),
        refetchUsers(),
        refetchBudget(),
        refetchLogs(),
      ]);
    } catch (error) {
      console.error('Falha Crítica no Promise.all:', error);
      addToast('Erro ao carregar dados iniciais.', 'error');
    } finally {
      setIsInitializing(false);
    }
  }, [
    refetchPatients,
    refetchRecords,
    refetchShipments,
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

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
    localStorage.setItem('hasSeenWelcomeModal', 'true');
  };

  if (isInitializing || isLoggingOut) return <FullScreenPreloader />;

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
    shipments, // <--- ADICIONADO AQUI: Passa as remessas para o Layout e para as páginas
    setShipments: refetchShipments, // <--- ADICIONADO AQUI
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
    {showWelcomeModal && <WelcomeModal onClose={handleCloseWelcomeModal} user={user} />}
      <Routes>
        <Route path="/pedidos/ver/:token" element={<PublicShipmentView />} />

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

        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

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
          <Route path="profile" element={<Profile />} />

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

          {/* Rotas de Profissional */}
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
              <Route path="/conferencia" element={<ShipmentConferencePage />} />
            </>
          )}

          {/* Rotas de Secretário */}
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

          {/* Rotas Comuns (Admin + Secretário) */}
          {(user?.role === 'admin' || user?.role === 'secretario') && (
            <>
              <Route
                path="medications"
                element={<MedicationsPage {...commonPageProps} />}
              />
              <Route
                path="shipments"
                element={<ShipmentsPage {...commonPageProps} />}
              />
              <Route
                path="history"
                element={
                  <SecretaryDashboardPage
                    {...commonPageProps}
                    activeTabForced="history"
                  />
                }
              />
              <Route
                path="reports"
                element={<AdminReportsPage {...commonPageProps} />}
              />
            </>
          )}

          {/* Rotas Exclusivas Admin */}
          {user?.role === 'admin' && (
            <Route
              path="settings"
              element={<AdminSettingsPage {...commonPageProps} />}
            />
          )}

          {/* Rota 404 */}
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
