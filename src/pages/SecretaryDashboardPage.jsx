// src/pages/SecretaryDashboardPage.jsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';

// --- Imports de Componentes (Views) ---
// Certifique-se de que estes caminhos estão corretos na sua estrutura de pastas
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
  users = [], // Mantido, mas não usado diretamente nas views
  filterYear = new Date().getFullYear(),
  activeTabForced,
  addToast,
}) {
  // --- Estados do Controlador ---
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Estado para passar filtro (ex: 'Pendente') do Dashboard para o Relatório Geral
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Estado para passar o objeto do paciente (vindo das Entregas Recentes) para o Histórico
  const [initialPatientForHistory, setInitialPatientForHistory] = useState(null);

  // --- Efeitos (Lógica de sincronização de aba) ---
  useEffect(() => {
    if (activeTabForced) {
      if (activeTabForced === 'reports') {
        setCurrentView('dashboard');
      } else {
        setCurrentView(activeTabForced);
      }
    } else if (currentView === 'reports') {
      setCurrentView('dashboard');
    } else {
      if (
        !['dashboard', 'records', 'deliveries', 'all_history'].includes(
          currentView
        )
      ) {
        setCurrentView('dashboard');
      }
    }
  }, [activeTabForced, currentView]);

  // --- Helpers Globais (Otimização O(1) do Passo 1) ---
  const patientMap = useMemo(() => {
    if (!Array.isArray(patients)) return {};
    return patients.reduce((acc, patient) => {
      acc[patient.id] = patient.name || 'Desconhecido';
      return acc;
    }, {});
  }, [patients]);

  const getPatientNameById = useCallback(
    (patientId) => {
      return patientMap[patientId] || 'Desconhecido';
    },
    [patientMap]
  );
  
  // --- Funções de Callback para os Filhos ---
  
  // Navegação do Card "Ver Pendências"
  const handleNavigateWithFilter = (view, status) => {
    setFilterStatus(status); // Define o filtro
    setCurrentView(view);     // Muda a view
  };
  
  // Navegação da view "Entregas Recentes" para "Histórico" (CORREÇÃO APLICADA)
  const handleNavigateToPatientHistory = (patientId) => {
    // Busca o objeto paciente completo no array global
    const patient = patients.find(p => p.id === patientId); 
    if (patient) {
      setInitialPatientForHistory(patient); 
      setCurrentView('records');            
    } else {
      addToast?.('Erro: Paciente não encontrado para navegação.', 'error');
    }
  };

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
            filterYear={filterYear}
            getPatientNameById={getPatientNameById}
            getMedicationName={getMedicationName}
            onNavigate={setCurrentView} // Navegação simples
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
            // Limpa o paciente inicial para que a busca funcione normalmente
            onHistoryViewed={() => setInitialPatientForHistory(null)}
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
            initialFilterStatus={filterStatus}
            // Limpa o filtro após a view ter lido (se ele veio do dashboard)
            onReportViewed={() => setFilterStatus('all')} 
          />
        );

      case 'deliveries':
        return (
          <RecentDeliveriesView
            records={records}
            medications={medications}
            getPatientNameById={getPatientNameById}
            getMedicationName={getMedicationName}
            onPatientClick={handleNavigateToPatientHistory}
          />
        );

      default:
        // Fallback
        return (
          <div className="text-center p-10">
            <h2 className="text-xl font-semibold text-gray-700">Visão Inválida</h2>
            <p className="text-gray-500">A visualização solicitada não foi encontrada.</p>
            <button onClick={() => setCurrentView('dashboard')} className="mt-4 text-blue-600 hover:underline">
              Voltar ao Dashboard
            </button>
          </div>
        );
    }
  };

  return <>{renderCurrentView()}</>;
}