// src/App.jsx (VERSÃO REFEITA E SIMPLIFICADA)
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';

// --- Imports das Páginas e Layouts ---
// Certifique-se que os exports/imports estão corretos (default ou named {})
import LoginPage from './pages/LoginPage';
import MainLayout from './layouts/MainLayout';
import ProfessionalDashboardPage from './pages/ProfessionalDashboardPage';
import SecretaryDashboardPage from './pages/SecretaryDashboardPage';
import {MedicationsPage} from './pages/MedicationsPage'; 
import AdminSettingsPage from './pages/AdminSettingsPage'
import {AdminReportsPage} from './pages/AdminReportsPage'


// --- Imports de Componentes Comuns e Utils ---
import ToastContainer  from './components/common/ToastContainer';
import { FullScreenPreloader } from './components/common/FullScreenPreloader';
import { getMedicationName } from './utils/helpers'; // Função helper

// --- Dados Mock (Temporariamente aqui) ---
let MOCK_USERS = [
    { id: 1, name: 'Dr. João Silva', email: 'profissional@email.com', password: '123', role: 'profissional', status: 'active' },
    { id: 2, name: 'Ana Costa (Secretária)', email: 'secretario@email.com', password: '123', role: 'secretario', status: 'active' },
    { id: 3, name: 'Maria Souza (Admin)', email: 'admin@email.com', password: '123', role: 'admin', status: 'active' },
];
let MOCK_PATIENTS = [
    { id: 1, name: 'Jaeffson Sabino', cpf: '123.456.789-00', susCard: '', observations: 'Hipertenso', generalNotes: 'Monitorar pressão arterial semanalmente.', createdAt: '2025-10-18', status: 'Ativo' },
    { id: 2, name: 'Maria Oliveira', cpf: '', susCard: '898001020304050', observations: 'Diabética tipo 2', generalNotes: 'Alergia a penicilina.', createdAt: '2025-09-01', status: 'Ativo' },
    { id: 3, name: 'Carlos Pereira', cpf: '111.222.333-44', susCard: '', observations: 'Asmático', generalNotes: '', createdAt: '2025-10-20', status: 'Pendente' },
];
let MOCK_MEDICATIONS = [
    { id: 1, name: 'Losartana', createdAt: '2025-01-10' }, { id: 2, name: 'AAS', createdAt: '2025-01-10' }, { id: 3, name: 'Metformina', createdAt: '2025-02-15' }, { id: 4, name: 'Salbutamol', createdAt: '2025-03-20' }, { id: 5, name: 'Glibenclamida', createdAt: '2025-04-05' },
];
let MOCK_RECORDS = [
    { id: 1, patientId: 1, professionalId: 1, medications: [{ recordMedId: `rec-med-1-1`, medicationId: 1, quantity: '1 cx', value: 15.00 }, { recordMedId: `rec-med-1-2`, medicationId: 2, quantity: '1 cx', value: 8.50 }], referenceDate: '2025-10-18', observation: 'Pressão controlada', totalValue: 23.50, status: 'Atendido', entryDate: '2025-10-18T10:00:00Z', deliveryDate: '2025-10-18T14:30:00Z' }, { id: 2, patientId: 1, professionalId: 1, medications: [{ recordMedId: `rec-med-2-1`, medicationId: 1, quantity: '1 cx', value: 15.00 }], referenceDate: '2025-09-15', observation: 'Início do tratamento', totalValue: 80.00, status: 'Atendido', entryDate: '2025-09-15T11:00:00Z', deliveryDate: '2025-09-16T09:00:00Z' }, { id: 3, patientId: 2, professionalId: 1, medications: [{ recordMedId: `rec-med-3-1`, medicationId: 3, quantity: '3 cxs', value: 22.00 }], referenceDate: '2025-10-10', observation: 'Glicemia estável', totalValue: 130.00, status: 'Atendido', entryDate: '2025-10-10T08:00:00Z', deliveryDate: '2025-10-10T08:30:00Z' }, { id: 4, patientId: 3, professionalId: 1, medications: [{ recordMedId: `rec-med-4-1`, medicationId: 4, quantity: '1 tubo', value: 25.00 }], referenceDate: '2025-10-18', observation: 'Uso em caso de crise', totalValue: 25.00, status: 'Pendente', entryDate: '2025-10-18T15:00:00Z', deliveryDate: null }, { id: 5, patientId: 2, professionalId: 1, medications: [{ recordMedId: `rec-med-5-1`, medicationId: 5, quantity: '1 cx', value: 12.00 }], referenceDate: '2025-10-17', observation: 'Ajuste de dose', totalValue: 12.00, status: 'Atendido', entryDate: '2025-10-17T09:30:00Z', deliveryDate: '2025-10-17T11:00:00Z' }, { id: 6, patientId: 1, professionalId: 1, medications: [{ recordMedId: `rec-med-6-1`, medicationId: 5, quantity: '1 cx', value: 18.00 }], referenceDate: '2025-08-20', observation: 'Tratamento interrompido', totalValue: 18.00, status: 'Cancelado', entryDate: '2025-08-20T09:00:00Z', deliveryDate: null },
];
// --- Fim dos Dados Mock ---

// --- Componente Raiz da Aplicação ---
export default function App() {
  // --- Estados ---
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [toasts, setToasts] = useState([]);
  // Estados dos dados (serão gerenciados globalmente ou via API depois)
  const [patients, setPatients] = useState(MOCK_PATIENTS);
  const [records, setRecords] = useState(MOCK_RECORDS);
  const [medications, setMedications] = useState(MOCK_MEDICATIONS);
  const [users, setUsers] = useState(MOCK_USERS);
  const [annualBudget, setAnnualBudget] = useState(5000.00);
  const [activityLog, setActivityLog] = useState([]);

  // --- Hooks ---
  const navigate = useNavigate(); // Hook do React Router

  // --- Funções ---
  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }].slice(-5)); // Limita a 5 toasts
  };
  const removeToast = (id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };
   const addLog = (userName, action) => {
    const newLog = { id: Date.now(), timestamp: new Date().toISOString(), user: userName || 'Sistema', action };
    setActivityLog(prev => [newLog, ...prev].slice(0, 100)); // Limita a 100 logs
  };
   const handleUpdateBudget = (newBudget) => { /* ... sua função ... */ }; // Implemente se necessário

  // --- Efeito de Inicialização ---
  useEffect(() => {
    // Simula carregamento ou verificação de token
    const timer = setTimeout(() => setIsInitializing(false), 1000); // 1 segundo de preloader
    return () => clearTimeout(timer); // Limpa o timer
  }, []);

  // --- Funções de Autenticação ---
  const handleLogin = (userData) => {
    setUser(userData);
    addLog(userData.name, 'fez login.');
    // Decide para onde ir após login baseado na role (opcional)
    const landingPage = '/dashboard'; // Ou '/admin-dashboard' etc.
    navigate(landingPage, { replace: true }); // replace: true evita voltar para o login
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    addLog(user?.name, 'fez logout.');
    setTimeout(() => {
      setUser(null);
      setIsLoggingOut(false);
      navigate('/login', { replace: true });
    }, 500); // Meio segundo para logout visual
  };

  // --- Renderização do Preloader ---
  if (isInitializing || isLoggingOut) {
    return <FullScreenPreloader />;
  }

  // --- Props compartilhadas com as páginas dentro do Layout ---
  const commonPageProps = {
    user, patients, setPatients, records, setRecords, medications, setMedications,
    users, setUsers, addToast, addLog, annualBudget, handleUpdateBudget, activityLog, getMedicationName,
  };

  // --- Renderização Principal com Rotas ---
  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <Routes>
        {/* Rota de Login */}
        <Route
          path="/login"
          element={
            !user
              ? <LoginPage onLogin={handleLogin} setUsers={setUsers} addToast={addToast} addLog={addLog} MOCK_USERS={users} />
              : <Navigate to="/dashboard" replace />
          }
        />

        {/* Rota Raiz (Protegida) - Renderiza o Layout que contém o Outlet */}
        <Route
          path="/"
          element={
            user
              ? <MainLayout user={user} handleLogout={handleLogout} {...commonPageProps} /> // Passa props para o Layout
              : <Navigate to="/login" replace />
          }
        >
          {/* Rotas Filhas (serão renderizadas pelo <Outlet> dentro do MainLayout) */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Dashboard Condicional */}
          <Route path="dashboard" element={
              user?.role === 'secretario'
                ? <SecretaryDashboardPage {...commonPageProps} /> // Secretária tem seu dashboard
                : <ProfessionalDashboardPage {...commonPageProps} /> // Pro e Admin usam o mesmo por enquanto
            }
          />

          {}
          {(user?.role === 'profissional' || user?.role === 'admin') && (
            <>
              {/* Usando a prop activeTabForced para reutilizar o componente */}
              <Route path="patients" element={<ProfessionalDashboardPage {...commonPageProps} activeTabForced="patients" />} />
              <Route path="history" element={<ProfessionalDashboardPage {...commonPageProps} activeTabForced="historico" />} />
              <Route path="deliveries" element={<ProfessionalDashboardPage {...commonPageProps} activeTabForced="deliveries" />} />
            <Route path="medications" element={<MedicationsPage {...commonPageProps} />} />
            <Route path="dashboard" element={<ProfessionalDashboardPage {...commonPageProps} />} />  
            </>
          )}

          {/* Rotas Secretário */}
          {user?.role === 'secretario' && (
            <>
              {/* Dashboard já definido */}
              <Route path="deliveries" element={<SecretaryDashboardPage {...commonPageProps} activeTabForced="deliveries" />} />
              <Route path="reports-general" element={<SecretaryDashboardPage {...commonPageProps} activeTabForced="all_history" />} />
              <Route path="patient-history" element={<SecretaryDashboardPage {...commonPageProps} activeTabForced="records" />} />
            </>
          )}

          {/* Rotas Admin */}
          {user?.role === 'admin' && (
            <>
               {/* As rotas patients, history, deliveries já estão cobertas acima */}

               {/* Rota CORRIGIDA para Medicações */}
               <Route path="medications" element={<MedicationsPage {...commonPageProps} />} />

               {/* Rota para Relatórios (Ainda placeholder, faremos depois) */}
               <Route path="reports" element={<AdminReportsPage {...commonPageProps} />} />

               {/* Rota CORRIGIDA para Configurações */}
               <Route path="settings" element={<AdminSettingsPage {...commonPageProps} />} />

               {/* A rota para gerenciar usuários agora está DENTRO de /settings */}
            </>
          )}

          {/* Rota 'Não Encontrado' DENTRO do layout */}
          <Route path="*" element={<div className="text-center p-6 bg-white rounded shadow"><h2>Página não encontrada</h2><Link to="/dashboard" className="text-blue-600">Voltar ao Dashboard</Link></div>} />

        </Route> { /* Fim das rotas protegidas */ }

      </Routes>

      {/* Banner de Cookies (se usar) */}
      {/* {showCookieBanner && (...)} */}
    </>
  );
}