// src/App.jsx (VERSÃO COM ROTA DE RELATÓRIOS COMPARTILHADA E LOGIN PERSISTENTE)
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';

// --- Imports das Páginas e Layouts ---
import LoginPage from './pages/LoginPage';
import MainLayout from './layouts/MainLayout';
import ProfessionalDashboardPage from './pages/ProfessionalDashboardPage';
import SecretaryDashboardPage from './pages/SecretaryDashboardPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import MedicationsPage from './pages/MedicationsPage';
import AdminReportsPage from './pages/AdminReportsPage';
import SecretarySettingsPage from './pages/SecretarySettingsPage';

// --- Imports de Componentes Comuns e Utils ---
import { ToastContainer } from './components/common/ToastContainer';
import { FullScreenPreloader } from './components/common/FullScreenPreloader';
import { getMedicationName } from './utils/helpers';

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
    {id:4, name:'Jaeffson Sabino', cpf:'', susCard:'',observations:'', generalNotes:'', createdAt:'', status:'Ativo'}
];
let MOCK_MEDICATIONS = [
   
  { id: 20250311115147, name: 'BRITENS  COLIRIO', createdAt: '' },
  { id: 20250311115713, name: 'RETIMIC 5MG', createdAt: '' },
  { id: 20250311115641, name: 'BACLOFENO 10 MG', createdAt: '' },
  { id: 20250311115517, name: 'PREGABALINA 75 MG', createdAt: '' },
  { id: 20250311132207, name: 'COMBODART 0,6, 0,4', createdAt: '' },
  { id: 20250311132124, name: 'COMBODART', createdAt: '' },
  { id: 20250311132741, name: 'GROW FERRO 100MG /ML', createdAt: '' },
  { id: 20250311134006, name: 'VALSARTANA 320 MG', createdAt: '' },
  { id: 20250311133240, name: 'SUCCINATO DE METOPROLOL 50MG', createdAt: '' },
  { id: 20250311134407, name: 'DEPAKENE 50MG/ML', createdAt: '' },
  { id: 20250311134324, name: 'CANABIDIOL 20MG/ML', createdAt: '' },
  { id: 20250311134850, name: 'CLORIDRATO DE SERTRALINA 25 MG', createdAt: '' },
  { id: 20250311134739, name: 'PROLOPA BD 100/25 MG', createdAt: '' },
  { id: 20250311134649, name: 'MANTIDAN 100MG', createdAt: '' },
  { id: 20250311135320, name: 'MELOXICAM 15 MG', createdAt: '' },
  { id: 20250311135224, name: 'CLORIDRATO DE NARATRIPTANA 2,5MG', createdAt: '' },
  { id: 20250311135520, name: 'MALEATO DE ENALAPRIL 10 MG', createdAt: '' },
  { id: 20250311143837, name: 'PANTOPRAZOL SODICO 40MG', createdAt: '' },
  { id: 20250311144923, name: 'TAMISA 75MCG+20MCG', createdAt: '' },
  { id: 20250311145133, name: 'DUTAM 0,5MG+0,4MG', createdAt: '' },
  { id: 20250311145527, name: 'MECLIM  50MG', createdAt: '' },
  { id: 20250311145832, name: 'ARTRODAR 50 MG', createdAt: '' },
  { id: 20250311150025, name: 'CETOPROFENO 20MG/ML', createdAt: '' },
  { id: 20250311150354, name: 'LEVOTIROXINA 150 MCG', createdAt: '' },
  { id: 20250311150620, name: 'CLORIDRATO DE CICLOBENZAPINA 10MG', createdAt: '' },
  { id: 20250311150801, name: 'DOMPERIDONA 10 MG', createdAt: '' },
  { id: 20250311150959, name: 'HEMIFUMARATO DE BISOPROLOL 5 MG', createdAt: '' },
  { id: 20250311150924, name: 'ARADOIS 50 MG', createdAt: '' },
  { id: 20250311151626, name: 'BASILATO DE ANLODIPINO 10MG', createdAt: '' },
  { id: 20250311152512, name: 'CLORIDRATO DE MEMANTINA 10 MG', createdAt: '' },
  { id: 20250311153035, name: 'MELATONINA GTS', createdAt: '' },
  { id: 20250311152956, name: 'BIFILAC', createdAt: '' },
  { id: 20250311154043, name: 'METROPOLOL 25 MG', createdAt: '' },
  { id: 20250313095124, name: 'PROTOPIC 0,1% POMADA', createdAt: '' },
  { id: 20250313103400, name: 'MATERNA SUPLEMENTO ALIMENTAR', createdAt: '' },
  { id: 20250317111631, name: 'TORAGESIC 10MG', createdAt: '' },
  { id: 20250317112434, name: 'VALERATO DE BETAMETASONA 1MG', createdAt: '' },
  
];
let MOCK_RECORDS = [
    { id: 1, patientId: 1, professionalId: 1, medications: [{ recordMedId: `rec-med-1-1`, medicationId: 1, quantity: '1 cx', value: 15.00 }, { recordMedId: `rec-med-1-2`, medicationId: 2, quantity: '1 cx', value: 8.50 }], referenceDate: '2025-10-18', observation: 'Pressão controlada', totalValue: 23.50, status: 'Atendido', entryDate: '2025-10-18T10:00:00Z', deliveryDate: '2025-10-18T14:30:00Z' }, { id: 2, patientId: 1, professionalId: 1, medications: [{ recordMedId: `rec-med-2-1`, medicationId: 1, quantity: '1 cx', value: 15.00 }], referenceDate: '2025-09-15', observation: 'Início do tratamento', totalValue: 80.00, status: 'Atendido', entryDate: '2025-09-15T11:00:00Z', deliveryDate: '2025-09-16T09:00:00Z' }, { id: 3, patientId: 2, professionalId: 1, medications: [{ recordMedId: `rec-med-3-1`, medicationId: 3, quantity: '3 cxs', value: 22.00 }], referenceDate: '2025-10-10', observation: 'Glicemia estável', totalValue: 130.00, status: 'Atendido', entryDate: '2025-10-10T08:00:00Z', deliveryDate: '2025-10-10T08:30:00Z' }, { id: 4, patientId: 3, professionalId: 1, medications: [{ recordMedId: `rec-med-4-1`, medicationId: 4, quantity: '1 tubo', value: 25.00 }], referenceDate: '2025-10-18', observation: 'Uso em caso de crise', totalValue: 25.00, status: 'Pendente', entryDate: '2025-10-18T15:00:00Z', deliveryDate: null }, { id: 5, patientId: 2, professionalId: 1, medications: [{ recordMedId: `rec-med-5-1`, medicationId: 5, quantity: '1 cx', value: 12.00 }], referenceDate: '2025-10-17', observation: 'Ajuste de dose', totalValue: 12.00, status: 'Atendido', entryDate: '2025-10-17T09:30:00Z', deliveryDate: '2025-10-17T11:00:00Z' }, { id: 6, patientId: 1, professionalId: 1, medications: [{ recordMedId: `rec-med-6-1`, medicationId: 5, quantity: '1 cx', value: 18.00 }], referenceDate: '2025-08-20', observation: 'Tratamento interrompido', totalValue: 18.00, status: 'Cancelado', entryDate: '2025-08-20T09:00:00Z', deliveryDate: null },
];
// --- Fim dos Dados Mock ---

export default function App() {

  // --- PASSO 1: LER DO LOCALSTORAGE AO INICIAR ---
  // Trocamos 'useState(null)' por uma função que roda SÓ UMA VEZ.
  // Ela tenta ler o 'user' do localStorage. Se achar, o usuário já começa logado.
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null; // Se não tem nada, começa nulo

    try {
      // Converte a string guardada de volta para um objeto
      return JSON.parse(storedUser);
    } catch (error) {
      console.error("Falha ao analisar usuário do localStorage:", error);
      // Se os dados estiverem corrompidos, limpa e começa nulo
      localStorage.removeItem('user');
      return null;
    }
  });

  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [patients, setPatients] = useState(MOCK_PATIENTS);
  const [records, setRecords] = useState(MOCK_RECORDS);
  const [medications, setMedications] = useState(MOCK_MEDICATIONS);
  const [users, setUsers] = useState(MOCK_USERS);
  const [annualBudget, setAnnualBudget] = useState(5000.00);
  const [activityLog, setActivityLog] = useState([]);

  const navigate = useNavigate();

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }].slice(-5));
  };
  const removeToast = (id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };
  const addLog = (userName, action) => {
    const newLog = { id: Date.now(), timestamp: new Date().toISOString(), user: userName || 'Sistema', action };
    setActivityLog(prev => [newLog, ...prev].slice(0, 100));
  };
  
  const handleUpdateBudget = (newBudget) => {
      const numericBudget = parseFloat(newBudget);
      if (!isNaN(numericBudget) && numericBudget >= 0) {
        setAnnualBudget(numericBudget);
        addToast('Orçamento atualizado com sucesso!', 'success');
        addLog(user?.name, `atualizou o orçamento para R$ ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericBudget)}.`);
      } else {
        addToast('Valor de orçamento inválido recebido.', 'error');
      }
  };

  const handleAcceptCookies = () => {
      localStorage.setItem('cookieConsent', 'true');
      setShowCookieBanner(false);
  };

  useEffect(() => {
    // Esta lógica de preloader continua a mesma
    const initTimer = setTimeout(() => setIsInitializing(false), 1000);
    const consent = localStorage.getItem('cookieConsent');
    if (consent !== 'true') {
        const bannerTimer = setTimeout(() => setShowCookieBanner(true), 1500);
        return () => clearTimeout(bannerTimer);
    }
    return () => clearTimeout(initTimer);
  }, []);


  // --- PASSO 2: SALVAR NO LOCALSTORAGE AO FAZER LOGIN ---
  const handleLogin = (userData) => {
    // 1. Salva o usuário no localStorage (convertido para string)
    localStorage.setItem('user', JSON.stringify(userData));
    // 2. Atualiza o estado do React (como antes)
    setUser(userData);
    addLog(userData.name, 'fez login.');
    navigate('/dashboard', { replace: true });
  };

  // --- PASSO 3: REMOVER DO LOCALSTORAGE AO FAZER LOGOUT ---
  const handleLogout = () => {
    setIsLoggingOut(true);
    addLog(user?.name, 'fez logout.');
    setTimeout(() => {
      // 1. Remove o usuário do localStorage
      localStorage.removeItem('user');
      // 2. Atualiza o estado do React para null (como antes)
      setUser(null);
      setIsLoggingOut(false);
      navigate('/login', { replace: true });
    }, 500);
  };

  if (isInitializing || isLoggingOut) {
    return <FullScreenPreloader />;
  }

  const commonPageProps = {
    user, patients, setPatients, records, setRecords, medications, setMedications,
    users, setUsers, addToast, addLog, annualBudget, handleUpdateBudget, activityLog, getMedicationName,
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <Routes>
        <Route
          path="/login"
          element={
            !user
              ? <LoginPage onLogin={handleLogin} setUsers={setUsers} addToast={addToast} addLog={addLog} MOCK_USERS={users} />
              : <Navigate to="/dashboard" replace />
          }
        />

        <Route
          path="/"
          element={
            user
              ? <MainLayout user={user} handleLogout={handleLogout} {...commonPageProps} />
              : <Navigate to="/login" replace />
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="dashboard" element={
              user?.role === 'secretario'
                ? <SecretaryDashboardPage {...commonPageProps} />
                : <ProfessionalDashboardPage {...commonPageProps} />
            }
          />

          {(user?.role === 'profissional' || user?.role === 'admin') && (
            <>
              <Route path="patients" element={<ProfessionalDashboardPage {...commonPageProps} activeTabForced="patients" />} />
              <Route path="history" element={<ProfessionalDashboardPage {...commonPageProps} activeTabForced="historico" />} />
              <Route path="deliveries" element={<ProfessionalDashboardPage {...commonPageProps} activeTabForced="deliveries" />} />
            </>
          )}

          {user?.role === 'secretario' && (
            <>
              <Route path="deliveries" element={<SecretaryDashboardPage {...commonPageProps} activeTabForced="deliveries" />} />
              <Route path="reports-general" element={<SecretaryDashboardPage {...commonPageProps} activeTabForced="all_history" />} />
              <Route path="patient-history" element={<SecretaryDashboardPage {...commonPageProps} activeTabForced="records" />} />
              <Route path="settings" element={<SecretarySettingsPage {...commonPageProps} />} />
            </>
          )}

          {/* --- ALTERAÇÃO AQUI --- */}
          {/* Rotas SOMENTE Admin */}
          {user?.role === 'admin' && (
            <>
              <Route path="medications" element={<MedicationsPage {...commonPageProps} />} />
              {/* A rota 'settings' do admin é diferente da do secretário */}
              <Route path="settings" element={<AdminSettingsPage {...commonPageProps} />} /> 
            </>
          )}
          
          {/* Rota de Relatórios (AGORA COMPARTILHADA entre Admin e Secretário) */}
          {(user?.role === 'admin' || user?.role === 'secretario') && (
              <Route path="reports" element={<AdminReportsPage {...commonPageProps} />} />
          )}
          {/* --- FIM DA ALTERAÇÃO --- */}


          <Route path="*" element={<div className="text-center p-6 bg-white rounded shadow"><h2>Página não encontrada</h2><Link to="/dashboard" className="text-blue-600">Voltar ao Dashboard</Link></div>} />
        </Route>
      </Routes>

      {showCookieBanner && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 shadow-lg animate-fade-in-up z-[9990]">
              <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
                  <p className="text-sm text-center md:text-left">
                      🍪 Usamos cookies para garantir que você tenha a melhor experiência em nosso site.
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