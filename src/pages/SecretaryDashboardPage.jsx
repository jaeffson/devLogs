// src/pages/SecretaryDashboardPage.jsx
// (ATUALIZADO: Adicionado estado para o Modal de Motivo de Cancelamento)

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; 

// --- Imports de Componentes (Views) ---
import { DashboardView } from '../components/views/secretary/DashboardView';
import { PatientHistoryView } from '../components/views/secretary/PatientHistoryView';
import { GeneralReportView } from '../components/views/secretary/GeneralReportView';
import { RecentDeliveriesView } from '../components/views/secretary/RecentDeliveriesView';

// --- (NOVO) Import do Modal de Motivo ---
import { ViewReasonModal } from '../components/common/ViewReasonModal';

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
  users = [],
  filterYear = new Date().getFullYear(),
  activeTabForced,
  addToast,
}) {
  const navigate = useNavigate(); // Hook para o 'default' case

  // --- Estados do Controlador ---
  const [currentView, setCurrentView] = useState('dashboard');
  const [filterStatus, setFilterStatus] = useState('all');
  const [initialPatientForHistory, setInitialPatientForHistory] = useState(null);
  
  // --- (NOVO) Estado para o Modal de Motivo ---
  const [viewingReasonRecord, setViewingReasonRecord] = useState(null);
  
  
  // --- Wrapper de Navegação (Usado apenas para limpar estados) ---
  const navigateToView = useCallback((view) => {
    if (view !== 'records') {
        setInitialPatientForHistory(null);
    }
    if (view !== 'all_history') {
        setFilterStatus('all');
    }
    setCurrentView(view);
  }, []); 


  // --- useEffect (Sincroniza URL com o Estado Interno) ---
  useEffect(() => {
    let targetView = activeTabForced || 'dashboard';
    
    if (targetView === 'reports' || targetView === 'reports-general') {
      targetView = 'all_history';
    }
    if (targetView === 'patient-history') {
      targetView = 'records';
    }
    
    if (!['dashboard', 'records', 'deliveries', 'all_history'].includes(targetView)) {
      targetView = 'dashboard';
    }
    
    navigateToView(targetView); 

  }, [activeTabForced, navigateToView]);
  

  // --- Helpers Globais (Corrigido para _id) ---
  const patientMap = useMemo(() => {
    if (!Array.isArray(patients)) return {};
    return patients.reduce((acc, patient) => {
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
  
  // --- Funções de Callback para os Filhos ---
  
  const handleNavigateWithFilter = (viewUrl, status) => {
    setFilterStatus(status);
    navigate(viewUrl);
  };
  
  const handleNavigateToPatientHistory = (patientId) => {
    const patient = patients.find(p => p._id === patientId); 
    if (patient) {
      setInitialPatientForHistory(patient); 
      navigate('/patient-history');          
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
            users={users}
            filterYear={filterYear}
            getPatientNameById={getPatientNameById} // (Mantido)
            getMedicationName={getMedicationName}
            icons={icons} 
            onNavigateWithFilter={handleNavigateWithFilter}
          />
        );

      case 'records': // Rota /patient-history
        return (
          <PatientHistoryView
            patients={patients}
            records={records}
            medications={medications}
            getMedicationName={getMedicationName}
            initialPatient={initialPatientForHistory}
            onHistoryViewed={() => {}} // (Mantido)
            onViewReason={setViewingReasonRecord} // <-- (NOVO) Passa o handler
          />
        );

      case 'all_history': // Rota /reports-general
        return (
          <GeneralReportView
            user={user}
            records={records}
            medications={medications}
            addToast={addToast}
            getPatientNameById={getPatientNameById}
            getMedicationName={getMedicationName}
            initialFilterStatus={filterStatus}
            onReportViewed={() => {}} // (Mantido)
            onViewReason={setViewingReasonRecord} // <-- (NOVO) Passa o handler
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

  return (
    <>
      {renderCurrentView()}
      
      {/* --- (NOVO) Renderiza o Modal de Motivo --- */}
      {viewingReasonRecord && (
        <ViewReasonModal
          record={viewingReasonRecord}
          onClose={() => setViewingReasonRecord(null)}
          getPatientNameById={getPatientNameById}
        />
      )}
    </>
  );
}