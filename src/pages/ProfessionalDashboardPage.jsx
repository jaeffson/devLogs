// src/pages/ProfessionalDashboardPage.jsx
// (Botões "Excluir Paciente" e "Excluir Registro" agora ocultos para a role 'profissional')

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 

// --- Imports (Corrigidos) ---
import { Modal, ConfirmModal } from '../components/common/Modal';
import PatientForm from '../components/forms/PatientForm';
import RecordForm from '../components/forms/RecordForm';
import { StatusBadge } from '../components/common/StatusBadge';
import { AttendRecordModal } from '../components/common/AttendRecordModal';
// Importando o seu novo modal de cancelamento
import { CancelRecordModal } from '../components/common/CancelRecordModal';
import { PatientRecordsTable } from '../components/common/PatientRecordsTable';
import MedicationForm from '../components/forms/MedicationForm';
import { icons } from '../utils/icons';
import { getMedicationName } from '../utils/helpers';
import { useDebounce } from '../hooks/useDebounce';

// --- URL BASE DA API ---
const API_BASE_URL = 'http://localhost:5000/api'; 
// -----------------------

// --- Componente da Página Principal ---
export default function ProfessionalDashboardPage({
  user,
  patients = [],
  setPatients, 
  records = [],
  setRecords, 
  medications = [],
  setMedications, 
  addToast,
  addLog,
  activeTabForced, // Esta prop vem da URL (via MainLayout)
}) {
  const navigate = useNavigate(); // Hook para mudar a URL
  
  // O currentView agora é um "espelho" do activeTabForced (URL)
  const [currentView, setCurrentView] = useState('dashboard');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    message: '',
    data: null,
    onConfirm: null,
  });
  const [attendingRecord, setAttendingRecord] = useState(null);

  // Novo estado para controlar o modal de cancelamento
  const [cancelingRecord, setCancelingRecord] = useState(null);

  // --- Estados do 'Select com Busca' (Histórico) ---
  const [quickAddPatientId, setQuickAddPatientId] = useState('');
  const [quickSearchTerm, setQuickSearchTerm] = useState('');
  const [isQuickSelectOpen, setIsQuickSelectOpen] = useState(false);
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const quickSelectRef = useRef(null);

  // --- (NOVO) Estados do 'Select com Busca' (Dashboard) ---
  const [dashQuickPatientId, setDashQuickPatientId] = useState('');
  const [dashQuickSearch, setDashQuickSearch] = useState('');
  const [isDashQuickOpen, setIsDashQuickOpen] = useState(false);
  const [dashQuickPatientName, setDashQuickPatientName] = useState('');
  const dashQuickRef = useRef(null);

  // --- Estado do Filtro de Histórico ---
  const [statusFilter, setStatusFilter] = useState('Todos'); 

  // --- Estados de Paginação ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); 

  // --- Debounce ---
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedQuickSearchTerm = useDebounce(quickSearchTerm, 300);
  const debouncedDashQuickSearch = useDebounce(dashQuickSearch, 300);

  // --- (CORREÇÃO) useEffect agora é a ÚNICA fonte da verdade para 'currentView' ---
  useEffect(() => {
    // Sincroniza o estado interno com a URL
    // As rotas do MainLayout (ex: /patients) definem o 'activeTabForced'
    setCurrentView(activeTabForced || 'dashboard');
  }, [activeTabForced]);

  // Effect para fechar o select customizado (Histórico)
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        quickSelectRef.current &&
        !quickSelectRef.current.contains(event.target)
      ) {
        setIsQuickSelectOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [quickSelectRef]);

  // (NOVO) Effect para fechar o select customizado (Dashboard)
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dashQuickRef.current &&
        !dashQuickRef.current.contains(event.target)
      ) {
        setIsDashQuickOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dashQuickRef]);

  // Effect para Paginação
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  // --- Função de Sincronização de Estado (CRUCIAL) ---
  const syncGlobalState = async (refetchFunction, errorMsg) => {
    if (typeof refetchFunction === 'function') {
        // Assume que as props setPatients, setRecords, setMedications são 
        // funções assíncronas que buscam dados da API e atualizam o estado global.
        await refetchFunction();
    } else {
        console.error(`Função de recarga não encontrada para ${errorMsg}.`);
    }
  };
  // --- FIM FUNÇÃO SINCRONAÇÃO ---


  // --- Função de Validação de Duplicidade (Manter como UX) ---
  const checkDuplicatePatient = ({ cpf, susCard, currentId }) => {
    const isDuplicate =
      Array.isArray(patients) &&
      patients.some((patient) => {
        const currentPatientId = patient._id || patient.id; 

        if (currentPatientId === currentId) return false;
        
        const patientCPF = String(patient.cpf || '').replace(/\D/g, '');
        const cpfIsMatch = cpf && patientCPF && cpf === patientCPF;
        const patientSusCard = String(patient.susCard || '').replace(/\D/g, '');
        const susIsMatch =
          susCard && patientSusCard && susCard === patientSusCard;
        
        return cpfIsMatch || susIsMatch;
      });
    return isDuplicate;
  };

  // --- Funções Helper ---
  const closeConfirmation = () =>
    setConfirmation({
      isOpen: false,
      message: '',
      data: null,
      onConfirm: null,
    });
  
  const getPatientNameById = (patientId) =>
    Array.isArray(patients)
      ? patients.find((p) => (p._id || p.id) === patientId)?.name || 'Desconhecido'
      : 'Desconhecido';

  // 🚨 FUNÇÃO CORRIGIDA PARA FLICKERING E ESCOPO
  const handleEditPatient = (patient) => {
    // Garante que a edição não altere a lista original no estado 'patients'.
    setEditingPatient(patient ? JSON.parse(JSON.stringify(patient)) : null); 
    setIsPatientModalOpen(true);
  };
  
  // --- Memos (Mantidos) ---
  const filteredPatients = useMemo(
    () =>
      Array.isArray(patients)
        ? patients
            .filter(
              (p) =>
                p.name
                  ?.toLowerCase()
                  .includes(debouncedSearchTerm.toLowerCase()) ||
                (p.cpf && String(p.cpf).includes(debouncedSearchTerm)) ||
                (p.susCard && String(p.susCard).includes(debouncedSearchTerm))
            )
            .sort((a, b) => a.name?.localeCompare(b.name || '') || 0)
        : [],
    [patients, debouncedSearchTerm]
  );

  const patientRecords = useMemo(() => {
    const targetId = selectedPatient?._id || selectedPatient?.id;
    if (!targetId || !Array.isArray(records)) return [];
    
    return records
      .filter((r) => r.patientId === targetId)
      .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));
  }, [records, selectedPatient]);

  const pendingRecords = useMemo(
    () =>
      Array.isArray(records) 
        ? records
            .filter((r) => r.status === 'Pendente')
            .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate))
        : [],
    [records]
  );

  const quickFilteredPatients = useMemo(
    () =>
      Array.isArray(patients)
        ? patients
            .filter((p) =>
              p.name
                ?.toLowerCase()
                .includes(debouncedQuickSearchTerm.toLowerCase())
            )
            .sort((a, b) => a.name.localeCompare(b.name))
        : [],
    [patients, debouncedQuickSearchTerm]
  );

  // (NOVO) Memo para filtro de pacientes (Dashboard)
  const dashQuickFilteredPatients = useMemo(
    () =>
      Array.isArray(patients)
        ? patients
            .filter((p) =>
              p.name
                ?.toLowerCase()
                .includes(debouncedDashQuickSearch.toLowerCase())
            )
            .sort((a, b) => a.name.localeCompare(b.name))
        : [],
    [patients, debouncedDashQuickSearch]
  );

  const filteredRecords = useMemo(() => {
    const sorted = records.sort(
      (a, b) => new Date(b.entryDate) - new Date(a.entryDate)
    );
    if (statusFilter === 'Todos') {
      return sorted;
    }
    return sorted.filter((r) => r.status === statusFilter);
  }, [records, statusFilter]);

  // --- Memos (Paginação) ---
  const totalPages = useMemo(() => {
    return Math.ceil(filteredRecords.length / itemsPerPage);
  }, [filteredRecords, itemsPerPage]);

  const currentRecords = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage; 
    return filteredRecords.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredRecords, currentPage, itemsPerPage]);

  // --- NOVO MEMO (Filtro de 1 Semana para Entregas) - [CORRIGIDO] ---
  const recentDeliveries = useMemo(() => {
    const parseDateAsUTC = (dateString) => {
      if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return null;
      }
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(Date.UTC(year, month - 1, day));
    };

    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);

    const oneWeekAgoUTC = new Date(todayUTC);
    oneWeekAgoUTC.setUTCDate(todayUTC.getUTCDate() - 7);

    if (!Array.isArray(records)) {
      return [];
    }
    
    return records
      .filter((r) => {
        if (r.status !== 'Atendido' || !r.deliveryDate) {
          return false;
        }
        const deliveryDateUTC = parseDateAsUTC(r.deliveryDate);
        return deliveryDateUTC && deliveryDateUTC >= oneWeekAgoUTC;
      })
      .sort((a, b) => {
        const dateA = parseDateAsUTC(a.deliveryDate);
        const dateB = parseDateAsUTC(b.deliveryDate);
        return dateB - dateA;
      });
  }, [records]);
  // --- FIM DO MEMO CORRIGIDO ---


  // --- Funções CRUD (REESCRITAS PARA API) ---
  
  // 1. SALVAR PACIENTE (CREATE/UPDATE)
  const handleSavePatient = async (patientData) => {
    try {
        let response;
        const patientId = patientData._id || patientData.id; 
        const patientName = patientData.name;
        
        const payload = {
            name: patientName,
            cpf: patientData.cpf,
            susCard: patientData.susCard,
            observations: patientData.observations,
            generalNotes: patientData.generalNotes,
            status: patientData.status,
        };

        if (patientId && patientId !== 'new') {
            // Atualização (PUT)
            response = await axios.put(`${API_BASE_URL}/patients/${patientId}`, payload);
            addToast('Paciente atualizado com sucesso!', 'success');
            addLog?.(user?.name, `atualizou dados do paciente ${patientName}`);
        } else {
            // Criação (POST)
            response = await axios.post(`${API_BASE_URL}/patients`, payload);
            addToast('Paciente cadastrado com sucesso!', 'success');
            addLog?.(user?.name, `cadastrou novo paciente ${patientName}`);
        }
        
        await syncGlobalState(setPatients, 'pacientes');
        
        const updatedPatient = response.data;
        setSelectedPatient(updatedPatient);


    } catch (error) {
        console.error('[API Error] Salvar Paciente:', error);
        const msg = error.response?.data?.message || 'Erro ao salvar paciente. Tente novamente.';
        addToast(msg, 'error');
        
    } finally {
        setIsPatientModalOpen(false);
        setEditingPatient(null);
    }
  };
  
  // 2. EXCLUIR PACIENTE (DELETE)
  const handleDeletePatient = async (patientId) => {
    const patient = patients.find((p) => (p._id || p.id) === patientId);
    
    try {
        await axios.delete(`${API_BASE_URL}/patients/${patientId}`);
        
        addToast('Paciente excluído!', 'success');
        addLog?.(user?.name, `excluiu o paciente ${patient?.name}`);

        await syncGlobalState(setPatients, 'pacientes');
        
        setSelectedPatient(null);
        
    } catch (error) {
        console.error('[API Error] Excluir Paciente:', error);
        addToast('Falha ao excluir paciente. Pode haver registros associados.', 'error');
    }
  };
  
  // 3. SALVAR REGISTRO (CREATE/UPDATE)
  const handleSaveRecord = async (recordData) => {
    try {
        let response;
        const recordId = recordData._id || recordData.id; 
        const patientName = getPatientNameById(recordData.patientId);
        
        const professionalIdentifier = user?._id || user?.id;
        if (!professionalIdentifier) {
            throw new Error("ID do profissional não encontrado.");
        }

        const payload = {
            patientId: recordData.patientId, 
            professionalId: professionalIdentifier, // ID do usuário logado
            medications: recordData.medications, // Array de subdocumentos
            referenceDate: recordData.referenceDate,
            observation: recordData.observation,
            totalValue: recordData.totalValue,
            status: recordData.status || 'Pendente',
        };

        if (recordId && recordId !== 'new') {
            // Atualização (PUT)
            response = await axios.put(`${API_BASE_URL}/records/${recordId}`, payload); 
            addToast('Registro atualizado!', 'success');
            addLog?.(user?.name, `atualizou registro para ${patientName}`);
        } else {
            // Criação (POST)
            response = await axios.post(`${API_BASE_URL}/records`, payload);
            addToast('Registro salvo!', 'success');
            addLog?.(user?.name, `criou registro para ${patientName}`);
        }

        await syncGlobalState(setRecords, 'registros');

    } catch (error) {
        console.error('[API Error] Salvar Registro:', error); 
        const msg = error.response?.data?.message || 'Erro ao salvar registro. Verifique os dados.';
        addToast(msg, 'error');
        
    } finally {
        setIsRecordModalOpen(false);
        setEditingRecord(null);

        setQuickAddPatientId('');
        setSelectedPatientName('');
        setQuickSearchTerm('');
        setDashQuickPatientId('');
        setDashQuickPatientName('');
        setDashQuickSearch('');
    }
  };
  
  // 4. EXCLUIR REGISTRO (DELETE)
  const handleDeleteRecord = async (recordId) => {
    const record = records.find((r) => (r._id || r.id) === recordId);
    
    try {
        await axios.delete(`${API_BASE_URL}/records/${recordId}`);
        
        addToast('Registro excluído!', 'success');
        addLog?.(user?.name, `excluiu registro de ${getPatientNameById(record?.patientId)}`);
        
        await syncGlobalState(setRecords, 'registros');
        
    } catch (error) {
        console.error('[API Error] Excluir Registro:', error);
        addToast('Falha ao excluir registro. Tente novamente.', 'error');
    }
  };
  
  // 5. CADASTRAR NOVA MEDICAÇÃO (CRIAÇÃO RÁPIDA)
  const handleAddNewMedication = async (medData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/medications`, { name: medData.name.trim() });
        const newMed = response.data;

        addToast('Medicação cadastrada!', 'success');
        addLog?.(user?.name, `cadastrou medicação: ${newMed.name}`);
        
        await syncGlobalState(setMedications, 'medicações');
        
        return newMed; 
        
    } catch (error) {
        console.error('[API Error] Nova Medicação:', error);
        const msg = error.response?.data?.message || 'Erro ao cadastrar medicação.';
        addToast(msg, 'error');
        return null;
    }
  };
  
  // 6. ATUALIZAR STATUS (ATENDIMENTO)
  const handleUpdateRecordStatus = async (recordId, deliveryDateStr) => {
    if (!deliveryDateStr) {
      addToast('Selecione uma data.', 'error');
      return;
    }

    try {
        await axios.patch(`${API_BASE_URL}/records/${recordId}/status`, { 
            status: 'Atendido', 
            deliveryDate: deliveryDateStr 
        });

        addToast('Registro Atendido!', 'success');
        addLog?.(user?.name, `marcou registro (ID: ${recordId}) como Atendido`);
        
        await syncGlobalState(setRecords, 'registros');

    } catch (error) {
        console.error('[API Error] Atualizar Status:', error);
        addToast('Falha ao atualizar status. Tente novamente.', 'error');
    } finally {
        setAttendingRecord(null);
    }
  };

  // --- (INÍCIO DA CORREÇÃO 3) ---
  // A função agora aceita 'cancelReason' e o passa para a API
  const handleCancelRecordStatus = async (recordId, cancelReason) => {
    try {
        await axios.patch(`${API_BASE_URL}/records/${recordId}/status`, { 
            status: 'Cancelado', 
            deliveryDate: null,
            cancelReason: cancelReason // <-- Envia o motivo para a API
        });

        addToast('Registro Cancelado.', 'info');
        // Adiciona o motivo ao log
        addLog?.(user?.name, `cancelou registro (ID: ${recordId}). Motivo: ${cancelReason}`);
        
        await syncGlobalState(setRecords, 'registros');

    } catch (error) {
        console.error('[API Error] Cancelar Status:', error);
        addToast('Falha ao cancelar status. Tente novamente.', 'error');
    }
    // (O 'finally' foi removido daqui e será tratado pelo modal)
  };
  // --- (FIM DA CORREÇÃO 3) ---

  // --- Funções UI (Mantidas) ---
  const handleViewPatientHistory = (patientId) => {
    // Esta função agora deve NAVEGAR
    navigate('/patients');
  };
  const handleQuickAddRecord = (e, patient) => {
    e.stopPropagation();
    setSelectedPatient(patient);
    setEditingRecord(null);
    setIsRecordModalOpen(true);
  };
  // Função de Adicionar Rápido (Histórico)
  const openQuickAddModal = () => {
    if (quickAddPatientId) {
      const patient = Array.isArray(patients)
        ? patients.find((p) => (p._id || p.id) === (quickAddPatientId))
        : null;
      if (patient) {
        setSelectedPatient(patient);
        setEditingRecord(null);
        setIsRecordModalOpen(true);
      } else {
        addToast('Paciente não encontrado.', 'error');
      }
    } else {
      addToast('Selecione um paciente.', 'error');
    }
  };

  // (NOVO) Função de Adicionar Rápido (Dashboard)
  const openDashQuickAddModal = () => {
    if (dashQuickPatientId) {
      const patient = Array.isArray(patients)
        ? patients.find((p) => (p._id || p.id) === (dashQuickPatientId))
        : null;
      if (patient) {
        setSelectedPatient(patient);
        setEditingRecord(null);
        setIsRecordModalOpen(true);

        setDashQuickPatientId('');
        setDashQuickPatientName('');
        setDashQuickSearch('');
      } else {
        addToast('Paciente não encontrado.', 'error');
      }
    } else {
      addToast('Selecione um paciente.', 'error');
    }
  };


  // --- Renderização Condicional (CORRIGIDA) ---
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          // --- (INÍCIO) SEÇÃO DO DASHBOARD REDESENHADA ---
          <div className="space-y-8 animate-fade-in">
            
            {/* Título */}
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
              Dashboard Profissional
            </h2>
            
            {/* Grid de Cards com Novo Visual e 'navigate' */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
              
              {/* Card 1: Entradas Pendentes (CORRIGIDO: usa navigate) */}
              <div 
                className="bg-yellow-100 text-yellow-900 p-5 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
                onClick={() => navigate('/history')} // <-- Sincronizado com o menu da esquerda
              >
                <div className="flex items-center gap-3">
                  <span className="text-yellow-500 bg-white p-2 rounded-full">
                    {icons.clipboard || (<span></span>)}
                  </span>
                  <h3 className="text-lg font-semibold">
                    Entradas Pendentes
                  </h3>
                </div>
                <p className="text-4xl font-bold mt-3 text-yellow-800">
                  {pendingRecords.length}
                </p>
                <p className="text-sm text-yellow-700 hover:underline mt-2">
                  Ver Entradas
                </p>
              </div>

              {/* Card 2: Total de Pacientes (CORRIGIDO: usa navigate) */}
              <div 
                className="bg-blue-100 text-blue-900 p-5 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
                onClick={() => navigate('/patients')} // <-- Sincronizado com o menu da esquerda
              >
                <div className="flex items-center gap-3">
                  <span className="text-blue-500 bg-white p-2 rounded-full">
                    {icons.users || (<span></span>)}
                  </span>
                  <h3 className="text-lg font-semibold">
                    Total de Pacientes
                  </h3>
                </div>
                <p className="text-4xl font-bold mt-3 text-blue-800">
                  {patients.length}
                </p>
                <p className="text-sm text-blue-700 hover:underline mt-2">
                  Gerenciar Pacientes
                </p>
              </div>

              {/* Card 3: Entregas da Semana (CORRIGIDO: usa navigate) */}
              <div 
                className="bg-green-100 text-green-900 p-5 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
                onClick={() => navigate('/deliveries')} // <-- Sincronizado com o menu da esquerda
              >
                <div className="flex items-center gap-3">
                  <span className="text-green-500 bg-white p-2 rounded-full">
                    {icons.check || (<span></span>)}
                  </span>
                  <h3 className="text-lg font-semibold">
                    Entregas da Semana
                  </h3>
                </div>
                <p className="text-4xl font-bold mt-3 text-green-800">
                  {recentDeliveries.length}
                </p>
                <p className="text-sm text-green-700 hover:underline mt-2">
                  Ver Entregas
                </p>
              </div>

              {/* Card 4: Registro Rápido (Visual Sutil) */}
              <div
                className="bg-white p-5 rounded-lg shadow-lg hover:shadow-xl border-l-8 border-indigo-500 transition-all duration-300 flex flex-col justify-center gap-3"
                ref={dashQuickRef} 
              >
                <h3 className="text-lg font-semibold text-indigo-800 mb-1">
                  Registro Rápido
                </h3>

                {/* O select customizado (Dashboard) */}
                <div className="relative flex-grow w-full">
                  <button
                    type="button"
                    onClick={() => setIsDashQuickOpen((prev) => !prev)} 
                    className="w-full p-2 pl-3 pr-10 border rounded-lg text-sm bg-gray-50 text-left flex justify-between items-center cursor-pointer hover:border-indigo-500 transition-colors"
                  >
                    <span
                      className={
                        dashQuickPatientId ? 'text-gray-900' : 'text-gray-500' 
                      }
                    >
                      {dashQuickPatientName || 'Selecione um paciente...'}
                    </span>
                    <span className="absolute right-3 top-2.5 text-gray-400 text-xs">
                      &#9660;
                    </span>
                  </button>

                  {isDashQuickOpen && ( 
                    <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-60 flex flex-col">
                      <div className="p-2 border-b sticky top-0 bg-white">
                        <input
                          type="text"
                          placeholder="Buscar paciente..."
                          className="w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          value={dashQuickSearch} 
                          onChange={(e) => setDashQuickSearch(e.target.value)} 
                          autoFocus
                        />
                      </div>

                      <div className="overflow-y-auto">
                        <div
                          className="p-2 text-sm text-gray-500 hover:bg-indigo-50 cursor-pointer transition-colors"
                          onClick={() => {
                            setDashQuickPatientId(''); 
                            setDashQuickPatientName('Selecione um paciente...'); 
                            setIsDashQuickOpen(false); 
                            setDashQuickSearch(''); 
                          }}
                        >
                          -- Limpar seleção --
                        </div>

                        {dashQuickFilteredPatients.length > 0 ? ( 
                          dashQuickFilteredPatients.map((p) => ( 
                            <div
                              key={p._id || p.id}
                              className="p-2 text-sm hover:bg-indigo-50 cursor-pointer transition-colors"
                              onClick={() => {
                                setDashQuickPatientId(String(p._id || p.id)); 
                                setDashQuickPatientName(p.name); 
                                setIsDashQuickOpen(false); 
                                setDashQuickSearch(''); 
                              }}
                            >
                              {p.name}
                            </div>
                          ))
                        ) : (
                          <p className="p-2 text-sm text-gray-500 text-center">
                            Nenhum paciente encontrado.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Botão de Adicionar (Dashboard) */}
                <button
                  onClick={openDashQuickAddModal} 
                  disabled={!dashQuickPatientId} 
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 text-sm font-medium cursor-pointer transition-colors"
                >
                  <span className="w-4 h-4">{icons.plus}</span> Adicionar
                  Registro
                </button>
              </div>
            </div>

            {/* --- Seção de Atalhos Rápidos (com 'navigate') --- */}
            <div className="pt-6 border-t">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                Atalhos Rápidos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Atalho 1: Gerenciar Pacientes (CORRIGIDO: usa navigate) */}
                <button
                  onClick={() => navigate('/patients')} // <-- Sincronizado
                  className="p-5 bg-white rounded-lg shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-300 flex items-center gap-4 text-left"
                >
                  <span className="p-3 bg-blue-100 text-blue-600 rounded-full">
                    {icons.users || <span></span>}
                  </span>
                  <div>
                    <p className="text-base font-semibold text-gray-900">Gerenciar Pacientes</p>
                    <p className="text-sm text-gray-500">Ver lista e editar pacientes</p>
                  </div>
                </button>

                {/* Atalho 2: Histórico Geral (CORRIGIDO: usa navigate) */}
                <button
                  onClick={() => navigate('/history')} // <-- Sincronizado
                  className="p-5 bg-white rounded-lg shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-300 flex items-center gap-4 text-left"
                >
                  <span className="p-3 bg-purple-100 text-purple-600 rounded-full">
                    {icons.history || <span></span>}
                  </span>
                  <div>
                    <p className="text-base font-semibold text-gray-900">Histórico Geral</p>
                    <p className="text-sm text-gray-500">Ver todos os registros</p>
                  </div>
                </button>

                {/* Atalho 3: Registro Rápido (ALTERADO) */}
                <button
                  onClick={() => navigate('/history')} // <-- Leva para o histórico (onde está o form rápido)
                  className="p-5 bg-white rounded-lg shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-300 flex items-center gap-4 text-left"
                >
                  <span className="p-3 bg-indigo-100 text-indigo-600 rounded-full"> 
                    {icons.clipboard || <span></span>} 
                  </span>
                  <div>
                    <p className="text-base font-semibold text-gray-900">Registro Rápido</p> 
                    <p className="text-sm text-gray-500">Adicionar um novo registro</p>
                  </div>
                </button>

              </div>
            </div>
            
          </div>
          // --- (FIM) SEÇÃO DO DASHBOARD REDESENHADA ---
        );
      case 'patients':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)] animate-fade-in">
            {/* Coluna da Esquerda (Lista) */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-4 flex flex-col min-h-0">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                Pacientes
              </h2>
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Buscar por nome, CPF ou SUS..."
                  className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute left-3 top-2.5 text-gray-400 w-4 h-4">
                  {icons.search}
                </div>
              </div>
              <button
                onClick={() => handleEditPatient(null)} // Novo Paciente (null)
                className="w-full flex items-center justify-center gap-2 mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm cursor-pointer transition-colors"
              >
                <span className="w-4 h-4">{icons.plus}</span> Novo Paciente
              </button>

              <div className="flex-grow min-h-0 overflow-y-auto pr-2 -mr-2">
                {patients.length === 0 ? (
                  <div className="text-center text-gray-500 py-10 px-4 bg-gray-50 rounded-lg">
                    <div className="mb-4 text-gray-300 w-16 h-16 mx-auto">
                      {icons.users}
                    </div>
                    <h3 className="font-semibold text-lg mb-1">
                      Sem pacientes
                    </h3>
                    <p className="text-sm mb-4">
                      Parece que você ainda não cadastrou nenhum paciente.
                    </p>
                    <button
                      onClick={() => handleEditPatient(null)} // Novo Paciente
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium cursor-pointer transition-colors"
                    >
                      Cadastrar primeiro paciente
                    </button>
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="text-center text-gray-500 py-10 px-4 bg-gray-50 rounded-lg">
                    <div className="mb-4 text-gray-300 w-16 h-16 mx-auto">
                      {icons.search}
                    </div>
                    <h3 className="font-semibold text-lg mb-1">
                      Nenhum resultado
                    </h3>
                    <p className="text-sm">
                      Não encontramos pacientes para a busca{' '}
                      <strong className="text-gray-700">
                        "{debouncedSearchTerm}"
                      </strong>
                      .
                    </p>
                  </div>
                ) : (
                  filteredPatients.map((patient) => (
                    <div
                      key={patient._id || patient.id}
                      className={`p-3 rounded-lg cursor-pointer mb-2 border transition-colors ${
                        (selectedPatient?._id || selectedPatient?.id) === (patient._id || patient.id)
                          ? 'bg-blue-100 border-blue-400'
                          : 'hover:bg-blue-50 border-gray-200'
                      }`}
                      onClick={() => setSelectedPatient(patient)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        (e.key === 'Enter' || e.key === ' ') &&
                        setSelectedPatient(patient)
                      }
                    >
                      <div className="flex justify-between items-center">
                        <p
                          className={`text-sm truncate ${selectedPatient?._id === patient._id ? 'font-semibold text-blue-900' : 'font-medium text-gray-800'}`}
                        >
                          {patient.name}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StatusBadge status={patient.status} />
                          <button
                            onClick={(e) => handleQuickAddRecord(e, patient)}
                            title="Novo Registro Rápido"
                            className="text-gray-400 hover:text-blue-600 p-0.5 cursor-pointer transition-colors"
                          >
                            <span className="w-4 h-4 block">{icons.plus}</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {patient.cpf || patient.susCard || 'Sem documento'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Coluna da Direita (Detalhes) */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-4 md:p-6 flex flex-col min-h-0">
              {selectedPatient ? (
                <>
                  <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200">
                    <div>
                      <h2 className="text-xl md::text-2xl font-bold text-gray-800">
                        {selectedPatient?.name || 'Nome Indisponível'}
                      </h2>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium text-gray-800">
                            CPF:
                          </span>{' '}
                          {selectedPatient?.cpf || 'Não informado'}
                        </p>
                        <p>
                          <span className="font-medium text-gray-800">
                            SUS:
                          </span>{' '}
                          {selectedPatient?.susCard || 'Não informado'}
                        </p>
                      </div>
                      <div className="mt-3 text-sm">
                        <strong className="text-gray-800">
                          Observações:
                        </strong>
                        <p className="text-gray-600 italic">
                          {selectedPatient?.observations || 'Nenhuma'}
                        </p>
                      </div>
                      <div className="mt-3 text-sm">
                        <strong className="text-gray-800">
                          Anotações Gerais:
                        </strong>
                        <p className="text-gray-600 italic">
                          {selectedPatient?.generalNotes || 'Nenhuma'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleEditPatient(selectedPatient)} 
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-md cursor-pointer transition-colors"
                        title="Editar Paciente"
                      >
                        <span className="w-4 h-4 block">{icons.edit}</span>
                      </button>
                      
                      {/* --- (INÍCIO DA CORREÇÃO 5) --- */}
                      {/* Botão Excluir Paciente agora só aparece se a role NÃO for profissional */}
                      {(user?.role !== 'profissional' && user?.role !== 'Profissional') && (
                        <button
                          onClick={() =>
                            setConfirmation({
                              isOpen: true,
                              message: `Tem certeza? Excluir ${selectedPatient?.name} é uma ação PERMANENTE e não pode ser desfeita.`,
                              onConfirm: () =>
                                handleDeletePatient(selectedPatient._id || selectedPatient.id),
                              data: (selectedPatient._id || selectedPatient.id) // Passando o ID aqui
                            })
                          }
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-md cursor-pointer transition-colors"
                          title="Excluir Paciente"
                        >
                          <span className="w-4 h-4 block">{icons.trash}</span>
                        </button>
                      )}
                      {/* --- (FIM DA CORREÇÃO 5) --- */}
                      
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2 mb-3">
                    <h3 className="text-lg font-semibold text-gray-700">
                      Histórico de Registros
                    </h3>
                    <button
                      onClick={() => {
                        setEditingRecord(null);
                        setIsRecordModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium cursor-pointer transition-colors"
                    >
                      <span className="w-3 h-3">{icons.plus}</span> Novo
                      Registro
                    </button>
                  </div>

                  <div className="flex-grow min-h-0 overflow-y-auto -mx-4 md:-mx-6 px-4 md:px-6">
                    <PatientRecordsTable
                      records={
                        Array.isArray(patientRecords) ? patientRecords : []
                      }
                      medications={medications}
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 bg-gray-50 rounded-lg p-8">
                  <div className="mb-4 text-gray-300 w-16 h-16">
                    {icons.users}
                  </div>
                  <h2 className="text-xl font-semibold">
                    Selecione um Paciente
                  </h2>
                  <p className="text-sm">
                    Escolha um paciente na lista para ver seus detalhes.
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      // VISÃO: HISTÓRICO (Estilizado)
      case 'historico':
        return (
          // ... (Seu código da aba Histórico)
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 animate-fade-in flex flex-col h-[calc(100vh-8rem)]">
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800">
              Histórico Geral de Entradas
            </h2>

            {/* --- Bloco 'Adicionar Rápido' (Estilizado) --- */}
            <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200 shadow-sm">
              <h4 className="flex items-center gap-2 font-semibold mb-3 text-blue-800 text-base">
                <span className="w-5 h-5 text-blue-600">{icons.plus}</span>
                <span>Adicionar Novo Registro Rápido</span>
              </h4>

              <div
                className="flex flex-col sm:flex-row items-center gap-3"
                ref={quickSelectRef}
              >
                <div className="relative flex-grow w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsQuickSelectOpen((prev) => !prev)}
                    className="w-full p-2 pl-3 pr-10 border border-gray-300 rounded-lg text-sm bg-white text-left flex justify-between items-center transition-all duration-150 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  >
                    <span
                      className={
                        quickAddPatientId ? 'text-gray-900' : 'text-gray-500'
                      }
                    >
                      {selectedPatientName || 'Selecione um paciente...'}
                    </span>
                    <span className="absolute right-3 top-2.5 text-gray-400 text-xs">
                      &#9660;
                    </span>
                  </button>

                  {isQuickSelectOpen && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 flex flex-col">
                      <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                        <input
                          type="text"
                          placeholder="Buscar paciente..."
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={quickSearchTerm}
                          onChange={(e) => setQuickSearchTerm(e.target.value)}
                          autoFocus
                        />
                      </div>

                      <div className="overflow-y-auto">
                        <div
                          className="p-2 text-sm text-gray-500 hover:bg-blue-50 cursor-pointer transition-colors"
                          onClick={() => {
                            setQuickAddPatientId('');
                            setSelectedPatientName('Selecione um paciente...');
                            setIsQuickSelectOpen(false);
                            setQuickSearchTerm('');
                          }}
                        >
                          -- Limpar seleção --
                        </div>

                        {quickFilteredPatients.length > 0 ? (
                          quickFilteredPatients.map((p) => (
                            <div
                              key={p._id || p.id} // Usa _id ou id
                              className="p-2 text-sm text-gray-800 hover:bg-blue-50 cursor-pointer transition-colors"
                              onClick={() => {
                                setQuickAddPatientId(String(p._id || p.id));
                                setSelectedPatientName(p.name);
                                setIsQuickSelectOpen(false);
                                setQuickSearchTerm('');
                              }}
                            >
                              {p.name}
                            </div>
                          ))
                        ) : (
                          <p className="p-2 text-sm text-gray-500 text-center">
                            Nenhum paciente encontrado.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={openQuickAddModal}
                  disabled={!quickAddPatientId}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 w-full sm:w-auto text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                >
                  <span className="w-4 h-4">{icons.plus}</span>
                  <span>Adicionar</span>
                </button>
              </div>
            </div>
            {/* --- Fim do Bloco 'Adicionar Rápido' --- */}

            {/* --- Bloco 'Filtros de Status' (Estilizado) --- */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-sm font-semibold">Filtrar por Status:</span>
              {['Todos', 'Pendente', 'Atendido', 'Cancelado'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 text-xs rounded-full border cursor-pointer transition-colors ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white font-bold border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            {/* --- Fim dos Filtros --- */}

            {/* --- Container da Tabela (Estilizado) --- */}
            <div className="overflow-x-auto overflow-y-auto flex-grow min-h-0">
              <table className="min-w-full bg-white text-sm">
                <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entrada
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medicações
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.map((record) => (
                    <tr
                      key={record._id || record.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-3 font-medium">
                        <button
                          onClick={() =>
                            // (CORREÇÃO) Navega para a página de pacientes
                            navigate('/patients')
                          }
                          className="text-blue-600 hover:underline text-left cursor-pointer transition-colors"
                        >
                          {getPatientNameById(record.patientId)}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-gray-700">
                        {new Date(record.entryDate).toLocaleString('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3 px-3 text-gray-700">
                        {Array.isArray(record.medications)
                          ? record.medications
                              .map(
                                (m) =>
                                  `${getMedicationName(m.medicationId, medications)} (${m.quantity || 'N/A'})`
                              )
                              .join(', ')
                          : 'N/A'}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={record.status} />
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {record.status === 'Pendente' && (
                            <>
                              <button
                                onClick={() => setAttendingRecord(record)}
                                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 font-medium cursor-pointer transition-colors"
                              >
                                Atender
                              </button>
                              
                              {/* --- (INÍCIO DA CORREÇÃO 4) --- */}
                              {/* Botão "Cancelar" agora só aparece se a role NÃO for profissional */}
                              {(user?.role !== 'profissional' && user?.role !== 'Profissional') && (
                                <button
                                  onClick={() => setCancelingRecord(record)}
                                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 font-medium cursor-pointer transition-colors"
                                >
                                  Cancelar
                                </button>
                              )}
                              {/* --- (FIM DA CORREÇÃO 4) --- */}
                            </>
                          )}
                          <button
                            onClick={() => {
                              const patientForRecord = Array.isArray(patients)
                                ? patients.find(
                                    (p) => (p._id || p.id) === record.patientId
                                  )
                                : null;
                              if (patientForRecord) {
                                setSelectedPatient(patientForRecord);
                                setEditingRecord(record);
                                setIsRecordModalOpen(true);
                              }
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600 cursor-pointer transition-colors"
                            title="Editar"
                          >
                            <span className="w-4 h-4 block">{icons.edit}</span>
                          </button>
                          
                          {/* --- (INÍCIO DA CORREÇÃO 6) --- */}
                          {/* Botão "Excluir Registro" agora só aparece se a role NÃO for profissional */}
                          {(user?.role !== 'profissional' && user?.role !== 'Profissional') && (
                            <button
                              onClick={() =>
                                setConfirmation({
                                  isOpen: true,
                                  message: 'Excluir registro?',
                                  onConfirm: () => handleDeleteRecord(record._id || record.id),
                                  data: (record._id || record.id) // Passando o ID
                                })
                              }
                              className="p-1 text-gray-500 hover:text-red-600 cursor-pointer transition-colors"
                              title="Excluir"
                            >
                              <span className="w-4 h-4 block">{icons.trash}</span>
                            </button>
                          )}
                          {/* --- (FIM DA CORREÇÃO 6) --- */}
                          
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mensagem de 'vazio' */}
              {filteredRecords.length === 0 && (
                <p className="text-center text-gray-500 py-6">
                  {statusFilter === 'Todos'
                    ? 'Nenhuma entrada registrada.'
                    : `Nenhuma entrada com status '${statusFilter}'.`}
                </p>
              )}
            </div>
            {/* Fim do Container da Tabela */}

            {/* Controles de Paginação (Estilizado) */}
            {filteredRecords.length > itemsPerPage && (
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-auto">
                <span className="text-sm text-gray-700">
                  Mostrando{' '}
                  {Math.min(
                    (currentPage - 1) * itemsPerPage + 1,
                    filteredRecords.length
                  )}{' '}
                  {' a '}
                  {Math.min(currentPage * itemsPerPage, filteredRecords.length)}
                  {' de '}
                  {filteredRecords.length} registros
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="text-sm font-medium">
                    Página {currentPage} de {totalPages > 0 ? totalPages : 1}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(p + 1, totalPages))
                    }
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
            {/* --- FIM (Paginação) --- */}
          </div>
        );

      // VISÃO: ENTREGAS
      case 'deliveries':
        return (
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 animate-fade-in flex flex-col h-[calc(100vh-8rem)]">
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800">
              Entregas Atendidas (Última Semana)
            </h2>

            {/* Mensagem se não houver entregas recentes */}
            {recentDeliveries.length === 0 ? (
              <div className="flex-grow flex items-center justify-center">
                <p className="text-center text-gray-500 py-10">
                  Nenhuma entrega registrada na última semana.
                </p>
              </div>
            ) : (
              // Container da Tabela (com scroll)
              <div className="overflow-x-auto overflow-y-auto flex-grow min-h-0">
                <table className="min-w-full bg-white text-sm">
                  <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data da Entrega
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paciente
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Medicações Entregues
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data da Entrada
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDeliveries.map((record) => (
                      <tr
                        key={record._id || record.id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        {/* Data da Entrega (Corrigido para tratar UTC) */}
                        <td className="py-3 px-3 font-medium text-gray-800">
                          {new Date(record.deliveryDate + 'T00:00:00').toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            timeZone: 'UTC', // Garante que a data seja lida como UTC
                          })}
                        </td>

                        {/* Paciente (Linkável) (CORRIGIDO: usa navigate) */}
                        <td className="py-3 px-3">
                          <button
                            onClick={() => navigate('/patients')} // <-- MUDEI AQUI
                            className="text-blue-600 hover:underline font-medium text-left cursor-pointer transition-colors"
                          >
                            {getPatientNameById(record.patientId)}
                          </button>
                        </td>

                        {/* Medicações */}
                        <td className="py-3 px-3 text-gray-700">
                          {Array.isArray(record.medications)
                            ? record.medications
                                .map(
                                  (m) =>
                                    `${getMedicationName(m.medicationId, medications)} (${m.quantity || 'N/A'})`
                                )
                                .join(', ')
                            : 'N/A'}
                        </td>

                        {/* Data da Entrada (Original) */}
                        <td className="py-3 px-3 text-gray-700">
                          {new Date(record.entryDate).toLocaleString('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          <StatusBadge status={record.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center p-10">
            View desconhecida: {currentView}
          </div>
        );
    }
  };

  return (
    <>
      {/* Esta página agora renderiza APENAS o conteúdo da view.
          A navegação (a barra da esquerda) é 100% controlada
          pelo MainLayout.jsx, que é o seu "menu fixo".
      */}
      {renderCurrentView()}

      {/* --- Modais --- */}
      {isPatientModalOpen && (
        <PatientForm
          patient={editingPatient} 
          onSave={handleSavePatient}
          onClose={() => {
            setIsPatientModalOpen(false);
            setEditingPatient(null);
          }}
          checkDuplicate={checkDuplicatePatient}
          addToast={addToast} 
        />
      )}
      {isRecordModalOpen && selectedPatient && ( 
        <RecordForm
          patient={selectedPatient}
          professionalId={user?._id || user?.id} // Usa _id/id do usuário logado
          record={editingRecord}
          onSave={handleSaveRecord}
          onClose={() => {
            setIsRecordModalOpen(false);
            setEditingRecord(null);
          }}
          medicationsList={Array.isArray(medications) ? medications : []}
          onNewMedication={handleAddNewMedication}
          addToast={addToast} 
        />
      )}
      {confirmation.isOpen && (
        <ConfirmModal
          message={confirmation.message}
          onConfirm={() => {
            // Passa confirmation.data para o onConfirm, que é o ID, 
            // e fecha o modal.
            confirmation.onConfirm(confirmation.data); 
            closeConfirmation();
          }}
          onClose={closeConfirmation}
        />
      )}
      {attendingRecord && (
        <AttendRecordModal
          record={attendingRecord}
          onConfirm={handleUpdateRecordStatus}
          onClose={() => setAttendingRecord(null)}
          getPatientName={getPatientNameById}
          medications={medications}
          getMedicationName={getMedicationName} 
        />
      )}

      {/* --- (INÍCIO DA CORREÇÃO 5) --- */}
      {/* Renderiza o novo modal de cancelamento quando o estado 'cancelingRecord' for setado */}
      {cancelingRecord && (
        <CancelRecordModal
          record={cancelingRecord}
          onClose={() => setCancelingRecord(null)}
          onConfirm={handleCancelRecordStatus}
          getPatientNameById={getPatientNameById} // Passa o helper de nome
        />
      )}
      {/* --- (FIM DA CORREÇÃO 5) --- */}
    </>
  );
}