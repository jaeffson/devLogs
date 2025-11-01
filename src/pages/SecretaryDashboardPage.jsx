// src/pages/SecretaryDashboardPage.jsx
// (CORREÇÃO: Reintroduzido 'handleNavigateWithFilter' para setar o estado E navegar)

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; 

// --- Imports de Componentes (Views) ---
import { DashboardView } from '../components/views/secretary/DashboardView';
import { PatientHistoryView } from '../components/views/secretary/PatientHistoryView';
import { GeneralReportView } from '../components/views/secretary/GeneralReportView';
import { RecentDeliveriesView } from '../components/views/secretary/RecentDeliveriesView';

// --- Imports de Utils e Ícones ---
import { getMedicationName } from '../utils/helpers';
import { icons } from '../utils/icons';

// --- Componente da Página ---
export default function SecretaryDashboardPage({
  user,
  annualBudget,
  patients = [],
  records = [],
  medications = [],
  users = [], // <-- A prop 'users' é recebida aqui
  filterYear = new Date().getFullYear(),
  activeTabForced,
  addToast,
}) {
  const navigate = useNavigate(); // Hook para o 'default' case

  // --- Estados do Controlador ---
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Estado para passar filtro (ex: 'Pendente') do Dashboard para o Relatório Geral
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Estado para passar o objeto do paciente (vindo das Entregas Recentes) para o Histórico
  const [initialPatientForHistory, setInitialPatientForHistory] = useState(null);
  
  
  // --- Wrapper de Navegação (Usado apenas para limpar estados) ---
  const navigateToView = useCallback((view) => {
    // Se a nova view NÃO for a de histórico, limpa o paciente inicial.
    if (view !== 'records') {
        setInitialPatientForHistory(null);
    }
    // Se a nova view NÃO for a de relatório, limpa o filtro de status.
    if (view !== 'all_history') {
        setFilterStatus('all');
    }
    // Define a nova view
    setCurrentView(view);
  }, []); 


  // --- useEffect (Sincroniza URL com o Estado Interno) ---
  useEffect(() => {
    
    let targetView = activeTabForced || 'dashboard'; // O default é dashboard
    
    // Mapeia rotas do App.jsx para os nomes das views internas
    if (targetView === 'reports' || targetView === 'reports-general') {
      targetView = 'all_history';
    }
    
    // Se a rota for desconhecida, vá para o dashboard
    if (!['dashboard', 'records', 'deliveries', 'all_history'].includes(targetView)) {
      targetView = 'dashboard';
    }
    
    // Chama a função que limpa estados e define a view interna
    navigateToView(targetView); 

  }, [activeTabForced, navigateToView]); // Depende APENAS da URL
  

  // --- Helpers Globais (Corrigido para _id) ---
  const patientMap = useMemo(() => {
    if (!Array.isArray(patients)) return {};
    return patients.reduce((acc, patient) => {
      // CORRIGIDO: para usar _id (MongoDB)
      acc[patient._id] = patient.name || 'Desconhecido';
      return acc;
    }, {});
  }, [patients]);

  const getPatientNameById = useCallback(
    (patientId) => {
      return patientMap[patientId] || 'Desconhecido';
    },
    [patientMap]
  );
  
  // --- (INÍCIO DA CORREÇÃO) Funções de Callback para os Filhos ---
  
  /**
   * Esta função é usada pelos botões "Pendentes" no DashboardView.
   * Ela define o filtro ANTES de navegar, garantindo que a página
   * de relatórios abra com o filtro correto.
   */
  const handleNavigateWithFilter = (viewUrl, status) => {
    setFilterStatus(status); // 1. Define o filtro
    navigate(viewUrl);       // 2. Navega para a URL
  };
  
  // Navegação da view "Entregas Recentes" para "Histórico"
  const handleNavigateToPatientHistory = (patientId) => {
    // CORRIGIDO: para usar p._id (MongoDB)
    const patient = patients.find(p => p._id === patientId); 
    if (patient) {
      setInitialPatientForHistory(patient); 
      // Navega para a URL correta, o 'useEffect' fará o resto
      navigate('/patient-history');          
    } else {
      addToast?.('Erro: Paciente não encontrado para navegação.', 'error');
    }
  };
  // --- (FIM DA CORREÇÃO) ---

  // --- Renderização Condicional (O Corpo Principal) ---
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            user={user}
            annualBudget={annualBudget}
            patients={patients}
            records={records}
            medications={medications}
            users={users} // Prop 'users' mantida
            filterYear={filterYear}
            getPatientNameById={getPatientNameById}
            getMedicationName={getMedicationName}
            icons={icons} 
            // --- (CORREÇÃO) Passando a função de filtro ---
            onNavigateWithFilter={handleNavigateWithFilter}
          />
        );

      case 'records':
        return (
          <PatientHistoryView
            patients={patients}
            records={records}
            medications={medications}
            getMedicationName={getMedicationName}
            initialPatient={initialPatientForHistory}
          />
        );

      case 'all_history':
        return (
          <GeneralReportView
            user={user}
            records={records}
            medications={medications}
            addToast={addToast}
            getPatientNameById={getPatientNameById}
            getMedicationName={getMedicationName}
            initialFilterStatus={filterStatus} // <-- O filtro é lido aqui
            onReportViewed={() => {}} // Correção do crash
          />
        );

      case 'deliveries':
        return (
          <RecentDeliveriesView
            records={records}
            medications={medications}
            getPatientNameById={getPatientNameById}
            getMedicationName={getMedicationName}
            onPatientClick={handleNavigateToPatientHistory} // Este clique é interno (Pai -> Filho -> Pai)
          />
        );

      default:
        // Fallback
        return (
          <div className="text-center p-10">
            <h2 className="text-xl font-semibold text-gray-700">Visão Inválida</h2>
            <p className="text-gray-500">A visualização solicitada não foi encontrada.</p>
            <button onClick={() => navigate('/dashboard')} className="mt-4 text-blue-600 hover:underline">
              Voltar ao Dashboard
            </button>
          </div>
        );
    }
  };

  return <>{renderCurrentView()}</>;
}