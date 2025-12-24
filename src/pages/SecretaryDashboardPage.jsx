// src/pages/SecretaryDashboardPage.jsx
// (ATUALIZADO: Com busca de Farmácias para Filtros e Gráficos)

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; 

// --- Serviços ---
import api from '../services/api'; // <--- Necessário para buscar farmácias

// --- Imports de Componentes (Views) ---
import { DashboardView } from '../components/views/secretary/DashboardView';
import { PatientHistoryView } from '../components/views/secretary/PatientHistoryView';
import { GeneralReportView } from '../components/views/secretary/GeneralReportView';
import { RecentDeliveriesView } from '../components/views/secretary/RecentDeliveriesView';

// --- Modais e Utils ---
import { ViewReasonModal } from '../components/common/ViewReasonModal';
import { getMedicationName } from '../utils/helpers';
import { icons } from '../utils/icons';

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
  const navigate = useNavigate();

  // --- Estados do Controlador ---
  const [currentView, setCurrentView] = useState('dashboard');
  const [filterStatus, setFilterStatus] = useState('all');
  const [initialPatientForHistory, setInitialPatientForHistory] = useState(null);
  const [viewingReasonRecord, setViewingReasonRecord] = useState(null);

  // --- (NOVO) Estado para Farmácias (Distribuidores) ---
  const [distributors, setDistributors] = useState([]);

  // --- (NOVO) Busca Farmácias ao Iniciar ---
  useEffect(() => {
    const fetchDistributors = async () => {
      try {
        const response = await api.get('/distributors');
        setDistributors(response.data || []);
      } catch (error) {
        console.error("Erro ao carregar farmácias:", error);
      }
    };
    fetchDistributors();
  }, []); // Executa apenas uma vez na montagem

  // --- Wrapper de Navegação ---
  const navigateToView = useCallback((view) => {
    if (view !== 'records') setInitialPatientForHistory(null);
    if (view !== 'all_history') setFilterStatus('all');
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []); 

  // --- Sincroniza URL com Estado ---
  useEffect(() => {
    let targetView = activeTabForced || 'dashboard';
    if (targetView === 'reports' || targetView === 'reports-general') targetView = 'all_history';
    if (targetView === 'patient-history') targetView = 'records';
    if (!['dashboard', 'records', 'deliveries', 'all_history'].includes(targetView)) targetView = 'dashboard';
    navigateToView(targetView); 
  }, [activeTabForced, navigateToView]);

  // --- Helpers ---
  const patientMap = useMemo(() => {
    if (!Array.isArray(patients)) return {};
    return patients.reduce((acc, patient) => {
      acc[patient._id || patient.id] = patient.name || 'Desconhecido';
      return acc;
    }, {});
  }, [patients]);

  const getPatientNameById = useCallback((id) => patientMap[id] || 'Desconhecido', [patientMap]);
  
  // --- Callbacks ---
  const handleNavigateWithFilter = (viewUrl, status) => {
    if (viewUrl === '/reports-general') {
        setFilterStatus(status);
        setCurrentView('all_history'); // Força a troca de view internamente se necessário
        navigate('/reports-general');
    } else {
        navigate(viewUrl);
    }
  };
  
  const handleNavigateToPatientHistory = (patientId) => {
    const patient = patients.find(p => (p._id || p.id) === patientId); 
    if (patient) {
      setInitialPatientForHistory(patient); 
      navigate('/patient-history');          
    } else {
      if(addToast) addToast('Erro: Paciente não encontrado.', 'error');
    }
  };

  // --- Renderização ---
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            user={user}
            annualBudget={annualBudget || user?.budget}
            distributors={distributors} // <--- Passando para o gráfico
            patients={patients}
            records={records}
            medications={medications}
            users={users}
            filterYear={filterYear}
            getPatientNameById={getPatientNameById}
            getMedicationName={getMedicationName}
            icons={icons} 
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
            onViewReason={setViewingReasonRecord}
            onBack={() => navigate('/dashboard')}
          />
        );

      case 'all_history':
        return (
          <GeneralReportView
            user={user}
            records={records}
            medications={medications}
            distributors={distributors} // <--- Passando para o filtro do relatório
            addToast={addToast}
            getPatientNameById={getPatientNameById}
            getMedicationName={getMedicationName}
            initialFilterStatus={filterStatus}
            onReportViewed={() => {}} 
            onViewReason={setViewingReasonRecord}
            onBack={() => navigate('/dashboard')}
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
            onBack={() => navigate('/dashboard')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {renderCurrentView()}
      
      {viewingReasonRecord && (
        <ViewReasonModal
          isOpen={true}
          reason={viewingReasonRecord.cancelReason}
          record={viewingReasonRecord}
          onClose={() => setViewingReasonRecord(null)}
          getPatientNameById={getPatientNameById}
        />
      )}
    </>
  );
}