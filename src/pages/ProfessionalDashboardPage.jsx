// src/pages/ProfessionalDashboardPage.jsx
// (ATUALIZADO: Otimização de Performance, UI/UX Moderno e Logs de Atividade Corrigidos)

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../services/api';
import { ConfirmModal } from '../components/common/Modal';
import PatientForm from '../components/forms/PatientForm';
import RecordForm from '../components/forms/RecordForm';
import { StatusBadge } from '../components/common/StatusBadge';
import { AttendRecordModal } from '../components/common/AttendRecordModal';
import { CancelRecordModal } from '../components/common/CancelRecordModal';
import { PatientRecordsTable } from '../components/common/PatientRecordsTable';
import MedicationsPage from './MedicationsPage';
import { icons } from '../utils/icons';
import { getMedicationName } from '../utils/helpers';
import { useDebounce } from '../hooks/useDebounce';

// --- Constantes ---
const MS_IN_30_DAYS = 30 * 24 * 60 * 60 * 1000;
const MS_IN_20_DAYS = 20 * 24 * 60 * 60 * 1000;

// --- Subcomponente: Modal de Busca de Paciente ---
const SearchPatientModal = ({
  isOpen,
  onClose,
  patients,
  onSelectPatient,
  onCreateNew,
}) => {
  const [term, setTerm] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTerm('');
      if (searchInputRef.current) {
        setTimeout(() => searchInputRef.current.focus(), 100);
      }
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!term) return patients.slice(0, 10);
    const lowerTerm = term.toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerTerm) ||
        (p.cpf && p.cpf.includes(lowerTerm)) ||
        (p.susCard && p.susCard.includes(lowerTerm))
    );
  }, [patients, term]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      {/* Responsividade: max-w-lg garante que não fica gigante, e max-h-[90vh] funciona em telas pequenas */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            {icons.search} Buscar Próximo Paciente
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            {icons.close}
          </button>
        </div>
        <div className="p-4 border-b border-gray-100">
          <input
            ref={searchInputRef}
            type="text"
            className="w-full bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-3 text-base transition-all outline-none"
            placeholder="Digite nome, CPF ou SUS..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
        <div className="flex-grow overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filtered.length > 0 ? (
            filtered.map((p) => (
              <button
                key={p._id || p.id}
                onClick={() => onSelectPatient(p)}
                // cursor-pointer já está aqui (embutido no botão)
                className="w-full text-left p-3 hover:bg-blue-50 rounded-xl transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {p.cpf || p.susCard || 'Sem documento'}
                    </p>
                  </div>
                </div>
                <div className="text-gray-400 group-hover:text-blue-600">
                  {icons.arrowRight || '>'}
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>Nenhum paciente encontrado.</p>
              <button
                onClick={onCreateNew}
                className="mt-3 text-blue-600 hover:underline font-medium text-sm cursor-pointer"
              >
                + Cadastrar Novo Paciente
              </button>
            </div>
          )}
        </div>
        <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
          <button
            onClick={onCreateNew}
            className="w-full py-2.5 rounded-xl border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {icons.plus} Cadastrar Novo Paciente
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Componente Principal ---
export default function ProfessionalDashboardPage({
  user,
  patients = [],
  setPatients,
  records = [],
  setRecords,
  medications = [],
  setMedications,
  addToast,
  addLog, // Garantir que addLog está sendo passado
  activeTabForced,
}) {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('dashboard');

  // --- Estados Principais ---
  const [searchTerm, setSearchTerm] = useState('');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Modais
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // Chaves para resetar formulários
  const [recordFormKey, setRecordFormKey] = useState(0);

  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    message: '',
    data: null,
    onConfirm: null,
    title: 'Confirmação',
    confirmText: 'Confirmar',
    isDestructive: false,
  });

  const [attendingRecord, setAttendingRecord] = useState(null);
  const [isAttendingLoading, setIsAttendingLoading] = useState(false);
  const [cancelingRecord, setCancelingRecord] = useState(null);
  const [isOverdueAlertVisible, setIsOverdueAlertVisible] = useState(true);

  // Filtros
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedHistorySearch = useDebounce(historySearchTerm, 300);

  useEffect(() => {
    setCurrentView(activeTabForced || 'dashboard');
  }, [activeTabForced]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, debouncedHistorySearch]);

  // --- Helpers ---
  const syncGlobalState = async (refetchFunction, errorMsg) => {
    if (typeof refetchFunction === 'function') await refetchFunction();
    else console.error(`Função de recarga não encontrada para ${errorMsg}.`);
  };

  const checkDuplicatePatient = ({ cpf, susCard, currentId }) => {
    return (
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
      })
    );
  };

  const closeConfirmation = () =>
    setConfirmation({
      isOpen: false,
      message: '',
      data: null,
      onConfirm: null,
      title: 'Confirmação',
      confirmText: 'Confirmar',
      isDestructive: false,
    });

  const getPatientNameById = (patientId) =>
    Array.isArray(patients)
      ? patients.find((p) => (p._id || p.id) === patientId)?.name ||
        'Desconhecido'
      : 'Desconhecido';

  const findRecentRecord = (patientId, recordToExcludeId = null) => {
    if (!patientId || !Array.isArray(records)) return null;
    const now = new Date().getTime();
    const patientRecords = records
      .filter((r) => {
        const recordId = r._id || r.id;
        return (
          r.patientId === patientId &&
          r.status !== 'Cancelado' &&
          recordId !== recordToExcludeId
        );
      })
      .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));

    if (patientRecords.length === 0) return null;
    if (now - new Date(patientRecords[0].entryDate).getTime() < MS_IN_20_DAYS)
      return patientRecords[0];
    return null;
  };

  // --- FLUXO DE ATENDIMENTO ---
  const openSearchModal = () => setIsSearchModalOpen(true);

  const handleSelectPatientFromSearch = (patient) => {
    setIsSearchModalOpen(false);
    openRecordModalWithCheck(patient, null);
  };

  const openRecordModalWithCheck = (patient, recordData = null) => {
    const patientId = patient?._id || patient?.id;
    const recentRecord = findRecentRecord(
      patientId,
      recordData?._id || recordData?.id || null
    );

    if (recordData === null && recentRecord) {
      setConfirmation({
        isOpen: true,
        title: 'Aviso de Registro Recente',
        message: `Este paciente já possui um registro recente (${new Date(recentRecord.entryDate).toLocaleDateString('pt-BR')}). Criar novo?`,
        onConfirm: () => {
          setSelectedPatient(patient);
          setEditingRecord(null);
          setIsRecordModalOpen(true);
          closeConfirmation();
        },
        confirmText: 'Sim, Criar',
        isDestructive: false,
      });
    } else {
      setSelectedPatient(patient);
      setEditingRecord(recordData);
      setIsRecordModalOpen(true);
    }
  };

  const handleEditPatient = (patient) => {
    setEditingPatient(patient ? JSON.parse(JSON.stringify(patient)) : null);
    setIsPatientModalOpen(true);
  };

  // --- API Handlers ---

  const handleSavePatient = async (patientData) => {
    try {
      let response;
      const patientId = patientData._id || patientData.id;
      const payload = { ...patientData };
      if (payload.cpf) payload.cpf = String(payload.cpf).trim();
      if (payload.susCard) payload.susCard = String(payload.susCard).trim();

      if (patientId && patientId !== 'new') {
        response = await api.put(`/patients/${patientId}`, payload);
        // --- LOG DE ATIVIDADE: Atualização de Paciente ---
        addLog?.(
          user?.name,
          `atualizou o cadastro do paciente ${patientData.name}`
        );
        // --- FIM LOG ---
        addToast('Paciente atualizado!', 'success');
        setIsPatientModalOpen(false);
        setEditingPatient(null);
      } else {
        response = await api.post('/patients', payload);
        // --- LOG DE ATIVIDADE: Criação de Paciente ---
        addLog?.(user?.name, `cadastrou novo paciente: ${patientData.name}`);
        // --- FIM LOG ---
        addToast('Paciente cadastrado!', 'success');

        setIsPatientModalOpen(false);
        setEditingPatient(null);
        openRecordModalWithCheck(response.data, null);
      }
      await syncGlobalState(setPatients, 'pacientes');
    } catch (error) {
      addToast(
        error.response?.data?.message || 'Erro ao salvar paciente.',
        'error'
      );
    }
  };

  const handleSaveRecord = async (recordData) => {
    try {
      const recordId = recordData._id || recordData.id;
      const payload = {
        patientId: recordData.patientId,
        profissionalId: user?._id || user?.id,
        medications: (recordData.medications || [])
          .map((m) => ({
            medicationId:
              typeof m === 'object' && m.id
                ? String(m.id)
                : m.medicationId || String(m),
            quantity: m.quantity || 'N/A',
          }))
          .filter((m) => m.medicationId),
        referenceDate: recordData.referenceDate,
        observation: recordData.observation,
        totalValue: recordData.totalValue,
        status: recordData.status || 'Pendente',
      };

      if (recordId && recordId !== 'new') {
        await api.put(`/records/${recordId}`, payload);
        const patientName = getPatientNameById(recordData.patientId);
        // --- LOG DE ATIVIDADE: Atualização de Registro ---
        addLog?.(
          user?.name,
          `atualizou o registro de atendimento de ${patientName}`
        );
        // --- FIM LOG ---
        addToast('Registro atualizado!', 'success');
        setIsRecordModalOpen(false);
        setEditingRecord(null);
      } else {
        await api.post('/records', payload);
        const patientName = getPatientNameById(recordData.patientId);
        // --- LOG DE ATIVIDADE: Criação de Registro ---
        addLog?.(
          user?.name,
          `criou novo registro de atendimento para ${patientName}`
        );
        // --- FIM LOG ---
        addToast('Atendimento salvo! Selecione o próximo paciente.', 'success');

        // Fluxo "Confirmar e Próximo"
        setIsRecordModalOpen(false);
        setSelectedPatient(null);
        setEditingRecord(null);

        setTimeout(() => {
          setIsSearchModalOpen(true);
        }, 200);
      }
      await syncGlobalState(setRecords, 'registros');
    } catch {
      addToast('Erro ao salvar registro.', 'error');
    }
  };

  const handleDeletePatient = async (id) => {
    try {
      await api.delete(`/patients/${id}`);
      addToast('Paciente excluído!', 'success');
      await syncGlobalState(setPatients, 'pacientes');
      setSelectedPatient(null);
    } catch {
      addToast('Erro ao excluir.', 'error');
    }
  };

  const handleDeleteRecord = async (id) => {
    const record = records.find((r) => (r._id || r.id) === id);
    const patientName = getPatientNameById(record?.patientId);

    try {
      await api.delete(`/records/${id}`);
      // --- LOG DE ATIVIDADE: Exclusão de Registro ---
      addLog?.(
        user?.name,
        `EXCLUIU o registro de atendimento de ${patientName}`
      );
      // --- FIM LOG ---
      addToast('Registro excluído!', 'success');
      await syncGlobalState(setRecords, 'registros');
    } catch {
      addToast('Erro ao excluir.', 'error');
    } finally {
      closeConfirmation();
    }
  };

  const handleAddNewMedication = async (medData) => {
    try {
      const res = await api.post('/medications', { name: medData.name.trim() });
      // --- LOG DE ATIVIDADE: Criação de Medicação ---
      addLog?.(user?.name, `cadastrou nova medicação: ${medData.name.trim()}`);
      // --- FIM LOG ---
      addToast('Medicação cadastrada!', 'success');
      await syncGlobalState(setMedications, 'medicações');
      return res.data;
    } catch {
      addToast('Erro ao cadastrar medicação.', 'error');
      return null;
    }
  };

  const handleUpdateRecordStatus = async (id, date) => {
    setIsAttendingLoading(true);
    const record = records.find((r) => (r._id || r.id) === id);
    const patientName = getPatientNameById(record?.patientId);

    try {
      await api.patch(`/records/${id}/status`, {
        status: 'Atendido',
        deliveryDate: date,
      });

      // --- LOG DE ATIVIDADE: Atendimento (Conclusão) ---
      addLog?.(user?.name, `registrou ATENDIMENTO de ${patientName}`);
      // --- FIM LOG ---

      await syncGlobalState(setRecords, 'registros');
      addToast('Atendido!', 'success');
      setAttendingRecord(null);
    } catch {
      addToast('Erro ao atualizar.', 'error');
    } finally {
      setIsAttendingLoading(false);
    }
  };

  const handleCancelRecordStatus = async (id, reason) => {
    const record = records.find((r) => (r._id || r.id) === id);
    const patientName = getPatientNameById(record?.patientId);

    try {
      await api.patch(`/records/${id}/status`, {
        status: 'Cancelado',
        cancelReason: reason,
      });

      // --- LOG DE ATIVIDADE: Cancelamento de Registro ---
      addLog?.(
        user?.name,
        `CANCELOU o registro de atendimento de ${patientName} (Motivo: ${reason})`
      );
      // --- FIM LOG ---

      addToast('Cancelado.', 'info');
      await syncGlobalState(setRecords, 'registros');
    } catch {
      addToast('Erro ao cancelar.', 'error');
    }
  };

  // --- Memos de Listagem e Performance ---
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
        ? records.filter((r) => r.status === 'Pendente')
        : [],
    [records]
  );
  const overduePendingRecords = useMemo(() => {
    if (!Array.isArray(records)) return [];
    const now = new Date().getTime();
    return records.filter(
      (r) =>
        r.status === 'Pendente' &&
        r.entryDate &&
        now - new Date(r.entryDate).getTime() > MS_IN_30_DAYS
    );
  }, [records]);

  // OTIMIZAÇÃO: Pré-calcula o nome do paciente
  const recordsWithPatientNames = useMemo(() => {
    const patientMap = patients.reduce((acc, p) => {
      acc[p._id || p.id] = p.name;
      return acc;
    }, {});

    return records.map((r) => ({
      ...r,
      patientName: patientMap[r.patientId] || 'Desconhecido',
    }));
  }, [records, patients]);

  // Filtro de Histórico usando o nome pré-calculado
  const filteredRecords = useMemo(() => {
    let result = recordsWithPatientNames.sort(
      (a, b) => new Date(b.entryDate) - new Date(a.entryDate)
    );
    if (statusFilter !== 'Todos') {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (debouncedHistorySearch) {
      const lowerSearch = debouncedHistorySearch.toLowerCase();
      result = result.filter((r) =>
        r.patientName.toLowerCase().includes(lowerSearch)
      );
    }
    return result;
  }, [recordsWithPatientNames, statusFilter, debouncedHistorySearch]);

  const totalPages = useMemo(
    () => Math.ceil(filteredRecords.length / itemsPerPage),
    [filteredRecords, itemsPerPage]
  );
  const currentRecords = useMemo(
    () =>
      filteredRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [filteredRecords, currentPage, itemsPerPage]
  );

  const recentDeliveries = useMemo(() => {
    if (!Array.isArray(records)) return [];
    const now = new Date();
    return records
      .filter((r) => {
        if (r.status !== 'Atendido' || !r.deliveryDate) return false;
        const dDate = new Date(r.deliveryDate);
        if (isNaN(dDate.getTime())) return false;
        const diffDays = (now.getTime() - dDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7 && diffDays >= 0;
      })
      .sort((a, b) => new Date(b.deliveryDate) - new Date(a.deliveryDate));
  }, [records]);

  // --- RENDER ---
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        // --- Novo Visual para o Dashboard (Mantido para Contexto) ---

        // --- Alerta de Registros Vencidos ---
        const showOverdueAlert =
          overduePendingRecords.length > 0 && isOverdueAlertVisible;

        // --- Mapeamento de Cores para Cards ---
        const statCards = [
          {
            label: 'Novo Atendimento',
            value: icons.newEntry,
            subtext: 'Clique para iniciar a busca',
            icon: icons.search,
            color: 'bg-blue-600',
            textColor: 'text-white',
            hover: 'hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-200',
            action: openSearchModal,
            isButton: true,
            shadow: 'shadow-lg shadow-blue-200',
          },
          {
            label: 'Pendentes',
            value: pendingRecords.length,
            subtext: 'Aguardando ação',
            icon: icons.clipboard,
            color: 'bg-yellow-50',
            textColor: 'text-yellow-700',
            hover: 'hover:border-yellow-300',
            action: () => navigate('/history'),
            isButton: false,
            shadow: 'shadow-sm',
          },
          {
            label: 'Pacientes',
            value: patients.length,
            subtext: 'Total cadastrados',
            icon: icons.users,
            color: 'bg-blue-50',
            textColor: 'text-blue-700',
            hover: 'hover:border-blue-300',
            action: () => navigate('/patients'),
            isButton: false,
            shadow: 'shadow-sm',
          },
          {
            label: 'Entregas (7 dias)',
            value: recentDeliveries.length,
            subtext: 'Realizadas recentemente',
            icon: icons.check,
            color: 'bg-green-50',
            textColor: 'text-green-700',
            hover: 'hover:border-green-300',
            action: () => navigate('/deliveries'),
            isButton: false,
            shadow: 'shadow-sm',
          },
        ];

        // --- Mapeamento de Acessos Rápidos ---
        const quickAccess = [
          {
            label: 'Pacientes',
            icon: icons.users,
            path: '/patients',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Histórico',
            icon: icons.history,
            path: '/history',
            color: 'text-purple-600',
            bg: 'bg-purple-50',
          },
          {
            label: 'Medicações',
            icon: icons.pill,
            path: '/medications',
            color: 'text-pink-600',
            bg: 'bg-pink-50',
          },
        ];

        return (
          <div className="space-y-8 animate-fade-in max-w-7xl mx-auto p-4 md:p-6 lg:p-0">
            {/* --- 1. Cabeçalho e Botão Principal --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
                  Bem-vindo(a),{' '}
                  <span className="text-blue-600">
                    {user?.name?.split(' ')[0] || 'Profissional'}
                  </span>
                </h2>
                <p className="text-gray-500 mt-1 font-medium">
                  Seu resumo de atividades e acesso rápido.
                </p>
              </div>

              {/* Botão de Iniciar Atendimento - Proeminente */}
              <button
                onClick={openSearchModal}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl shadow-xl shadow-blue-200 font-semibold flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:scale-95 text-lg cursor-pointer flex-shrink-0"
              >
                <span className="text-xl">{icons.search}</span>
                <span>Iniciar Atendimento Rápido</span>
              </button>
            </div>

            {/* --- 2. Alertas --- */}
            {showOverdueAlert && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex justify-between items-center transition-opacity animate-slide-down">
                <div className="flex items-center gap-3">
                  <span className="text-red-600 text-xl flex-shrink-0">
                    {icons.alert}
                  </span>
                  <p className="text-sm font-medium text-red-800">
                    Atenção: Você tem **{overduePendingRecords.length}**{' '}
                    registro(s) pendente(s) por mais de 30 dias. Verifique no
                    Histórico.
                  </p>
                </div>
                <button
                  onClick={() => setIsOverdueAlertVisible(false)}
                  className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0 p-1 cursor-pointer"
                >
                  {icons.close}
                </button>
              </div>
            )}

            {/* --- 3. Cards de Estatísticas (Grid 4 colunas) --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((card, idx) => (
                <div
                  key={idx}
                  onClick={card.action}
                  className={`bg-white p-6 rounded-2xl border border-gray-100 transition-all cursor-pointer ${card.hover} ${card.shadow} ${
                    card.isButton ? 'border-none' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase mb-2">
                        {card.label}
                      </p>
                      {card.isButton ? (
                        <span className="text-3xl font-bold text-white flex items-center gap-2">
                          {card.value}
                        </span>
                      ) : (
                        <h3 className="text-4xl font-bold text-gray-800">
                          {card.value}
                        </h3>
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-xl transition-transform ${
                        card.isButton ? card.color : card.color
                      } ${card.textColor} group-hover:scale-110`}
                    >
                      {card.icon}
                    </div>
                  </div>
                  <p
                    className={`mt-3 text-xs font-medium ${
                      card.isButton ? 'text-white/80' : 'text-gray-500'
                    }`}
                  >
                    {card.subtext}
                  </p>
                </div>
              ))}
            </div>

            {/* --- 4. Acesso Rápido e Últimas Entregas (Grid 2/3) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
              {/* Bloco 1: Acesso Rápido */}
              <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  {icons.bolt} Acesso Rápido
                </h3>
                <div className="space-y-3">
                  {quickAccess.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => navigate(item.path)}
                      className="w-full text-left p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 hover:border-gray-300 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-lg ${item.bg} ${item.color} transition-transform`}
                        >
                          {item.icon}
                        </div>
                        <span className="font-semibold text-gray-700 text-base">
                          {item.label}
                        </span>
                      </div>
                      <div className="text-gray-400 group-hover:text-blue-600">
                        {icons.arrowRight}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bloco 2: Últimas Entregas (Mini Tabela) */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  {icons.history} Últimas Entregas ({recentDeliveries.length})
                </h3>
                <div className="flex-grow overflow-auto">
                  {recentDeliveries.slice(0, 5).length > 0 ? (
                    <table className="min-w-full text-sm text-left border-collapse">
                      <thead className="text-gray-500 font-medium uppercase text-xs border-b border-gray-100">
                        <tr>
                          <th className="py-2 px-1">Paciente</th>
                          <th className="py-2 px-1">Data</th>
                          <th className="py-2 px-1">Itens</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {recentDeliveries.slice(0, 5).map((record) => (
                          <tr
                            key={record._id || record.id}
                            onClick={() => {
                              setSelectedPatient(
                                patients.find(
                                  (p) => (p._id || p.id) === record.patientId
                                )
                              );
                              navigate('/patients');
                            }}
                            className="hover:bg-green-50/30 transition-colors cursor-pointer"
                          >
                            <td className="py-2 px-1 font-medium text-gray-800">
                              {getPatientNameById(record.patientId)}
                            </td>
                            <td className="py-2 px-1 text-green-600">
                              {new Date(record.deliveryDate).toLocaleDateString(
                                'pt-BR'
                              )}
                            </td>
                            <td className="py-2 px-1 text-gray-600">
                              {record.medications?.length || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <p>Nenhuma entrega na última semana.</p>
                    </div>
                  )}
                </div>
                {recentDeliveries.length > 5 && (
                  <button
                    onClick={() => navigate('/deliveries')}
                    className="mt-4 text-sm font-medium text-blue-600 hover:underline self-start cursor-pointer"
                  >
                    Ver todas as entregas recentes
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      case 'patients':
        return (
          // O grid de 12 colunas só ativa em 'lg', mobile é 1 coluna
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)] animate-fade-in max-w-7xl mx-auto p-4 md:p-0">
            {' '}
            {/* Adicionado padding para móvel */}
            {/* Painel lateral: Mobile ocupa 100%, Desktop 4 colunas */}
            <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    {icons.users} Pacientes
                  </h2>
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                    {patients.length}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar paciente..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute left-3 top-2.5 text-gray-400">
                    {icons.search}
                  </div>
                </div>
                <button
                  onClick={() => handleEditPatient(null)}
                  className="mt-3 w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {icons.plus} Novo Cadastro
                </button>
              </div>
              <div className="flex-grow overflow-y-auto p-2 space-y-1">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => {
                    const isSelected =
                      (selectedPatient?._id || selectedPatient?.id) ===
                      (patient._id || patient.id);
                    return (
                      <div
                        key={patient._id || patient.id}
                        onClick={() => setSelectedPatient(patient)}
                        // cursor-pointer garantido
                        className={`p-3 rounded-xl cursor-pointer border transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                            : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            isSelected
                              ? 'bg-blue-200 text-blue-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {patient.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <p
                            className={`text-sm truncate font-medium ${
                              isSelected ? 'text-blue-900' : 'text-gray-800'
                            }`}
                          >
                            {patient.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {patient.cpf || patient.susCard || 'Sem documento'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    Nenhum paciente encontrado.
                  </div>
                )}
              </div>
            </div>
            {/* Painel de detalhes: Mobile só aparece se houver paciente selecionado */}
            <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden relative">
              {selectedPatient ? (
                <>
                  <div className="bg-gradient-to-r from-blue-50 to-white p-6 border-b border-blue-100">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-200">
                          {selectedPatient.name.charAt(0)}
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800">
                            {selectedPatient.name}
                          </h2>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                            <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                              CPF: {selectedPatient.cpf || '-'}
                            </span>
                            <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                              SUS: {selectedPatient.susCard || '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditPatient(selectedPatient)}
                          className="p-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:text-blue-600 hover:border-blue-200 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          {icons.edit}
                        </button>
                        {user?.role !== 'profissional' && (
                          <button
                            onClick={() =>
                              setConfirmation({
                                isOpen: true,
                                title: 'Excluir',
                                message: `Excluir ${selectedPatient.name}?`,
                                onConfirm: () =>
                                  handleDeletePatient(
                                    selectedPatient._id || selectedPatient.id
                                  ),
                                isDestructive: true,
                              })
                            }
                            className="p-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
                            title="Excluir"
                          >
                            {icons.trash}
                          </button>
                        )}
                      </div>
                    </div>
                    {(selectedPatient.observations ||
                      selectedPatient.generalNotes) && (
                      <div className="mt-6 bg-yellow-50/50 p-4 rounded-xl border border-yellow-100 text-sm text-yellow-800">
                        {selectedPatient.observations && (
                          <p className="mb-1">
                            <strong>Obs:</strong> {selectedPatient.observations}
                          </p>
                        )}
                        {selectedPatient.generalNotes && (
                          <p>
                            <strong>Notas:</strong>{' '}
                            {selectedPatient.generalNotes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-grow flex flex-col min-h-0 bg-gray-50/30">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        {icons.history} Histórico Clínico
                      </h3>
                      <button
                        onClick={() =>
                          openRecordModalWithCheck(selectedPatient, null)
                        }
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm shadow-green-200 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        {icons.plus} Nova Entrada
                      </button>
                    </div>
                    <div className="flex-grow overflow-auto bg-white rounded-xl border border-gray-200 shadow-sm">
                      <PatientRecordsTable
                        records={
                          Array.isArray(patientRecords) ? patientRecords : []
                        }
                        medications={medications}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50/50">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-3xl">
                    {icons.user}
                  </div>
                  <p className="text-lg font-medium text-gray-600">
                    Nenhum paciente selecionado
                  </p>
                  {/* Responsividade: Botão de voltar no mobile se a lista estiver escondida */}
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="mt-4 text-blue-600 hover:underline lg:hidden cursor-pointer"
                  >
                    Voltar ao Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'historico':
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-fade-in flex flex-col h-[calc(100vh-8rem)] max-w-7xl mx-auto p-4 md:p-6">
            {' '}
            {/* Ajustado padding */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Histórico Completo
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Visualize e gerencie todas as entradas.
                </p>
              </div>

              {/* Responsividade: flex-wrap para permitir que os botões quebrem a linha em telas pequenas */}
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative w-full sm:w-auto">
                  {' '}
                  {/* w-full para input no mobile */}
                  <input
                    type="text"
                    placeholder="Buscar paciente no relatório..."
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full sm:w-64"
                  />
                  <div className="absolute left-2.5 top-2.5 text-gray-400 text-xs">
                    {icons.search}
                  </div>
                </div>
                <button
                  onClick={openSearchModal}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {icons.plus} Novo Registro
                </button>
                <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
                  {' '}
                  {/* w-full para grupo de botões no mobile */}
                  {['Todos', 'Pendente', 'Atendido', 'Cancelado'].map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                          statusFilter === status
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {status}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
            <div className="flex-grow overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col">
              <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-grow">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium uppercase tracking-wider text-xs sticky top-0 z-10 border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4 pl-6">Paciente</th>
                      <th className="py-3 px-4">Entrada</th>
                      <th className="py-3 px-4">Medicações</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right pr-6">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {currentRecords.map((record) => (
                      <tr
                        key={record._id || record.id}
                        // UI/UX Moderno e Cursor-Pointer
                        className="hover:bg-blue-50/30 transition-colors group cursor-pointer border-b border-gray-100 shadow-sm hover:shadow-md"
                        tabIndex={0}
                      >
                        <td className="py-3 px-4 pl-6 font-medium text-gray-800">
                          {record.patientName}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(record.entryDate).toLocaleDateString(
                            'pt-BR'
                          )}{' '}
                          <span className="text-gray-400 text-xs">
                            {new Date(record.entryDate).toLocaleTimeString(
                              'pt-BR',
                              { hour: '2-digit', minute: '2-digit' }
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(record.medications)
                              ? record.medications.map((m, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200"
                                  >
                                    {getMedicationName(
                                      m.medicationId,
                                      medications
                                    )}{' '}
                                    <span className="text-gray-400 border-l border-gray-300 pl-1 ml-1">
                                      {m.quantity}
                                    </span>
                                  </span>
                                ))
                              : '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={record.status} />
                        </td>
                        <td className="py-3 px-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            {record.status === 'Pendente' && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAttendingRecord(record);
                                  }}
                                  className="text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer"
                                >
                                  ATENDER
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCancelingRecord(record);
                                  }}
                                  className="text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors cursor-pointer"
                                  title="Cancelar"
                                >
                                  {icons.close}
                                </button>
                              </>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const p = patients.find(
                                  (pat) =>
                                    (pat._id || pat.id) === record.patientId
                                );
                                if (p) {
                                  setSelectedPatient(p);
                                  setEditingRecord(record);
                                  setIsRecordModalOpen(true);
                                }
                              }}
                              className="text-gray-500 hover:text-blue-600 p-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                              {icons.edit}
                            </button>
                            {/* --- NOVO BOTÃO DE EXCLUSÃO (Somente Admin) --- */}
                            {user?.role !== 'profissional' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmation({
                                    isOpen: true,
                                    title: 'Excluir Registro',
                                    message: `Tem certeza que deseja excluir o registro de ${record.patientName} (Entrada: ${new Date(record.entryDate).toLocaleDateString('pt-BR')})? Esta ação é irreversível.`,
                                    onConfirm: () => {
                                      // Fecha o modal imediatamente para o feedback visual ser rápido
                                      closeConfirmation();
                                      // Chama a função que fará a requisição e a toast
                                      handleDeleteRecord(
                                        record._id || record.id
                                      );
                                    },
                                    isDestructive: true,
                                    confirmText: 'Excluir',
                                  });
                                }}
                                // Adicionado cursor-pointer
                                className="text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors cursor-pointer"
                                title="Excluir Registro"
                              >
                                {icons.trash}
                              </button>
                            )}
                            {/* --- FIM NOVO BOTÃO DE EXCLUSÃO --- */}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredRecords.length === 0 && (
                  <div className="p-10 text-center text-gray-400">
                    Nenhum registro encontrado.
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-100">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-500">
                Pág {currentPage} de {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                Próxima
              </button>
            </div>
          </div>
        );

      case 'deliveries':
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-fade-in flex flex-col h-[calc(100vh-8rem)] max-w-7xl mx-auto p-4 md:p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="bg-green-100 text-green-600 p-2 rounded-lg">
                {icons.check}
              </span>
              Entregas da Semana
            </h2>
            <div className="flex-grow overflow-auto bg-white rounded-xl border border-gray-200 shadow-sm">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium uppercase text-xs border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4 pl-6">Data Entrega</th>
                    <th className="py-3 px-4">Paciente</th>
                    <th className="py-3 px-4">Medicações</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentDeliveries.map((record) => (
                    <tr
                      key={record._id || record.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      {' '}
                      {/* cursor-pointer garantido */}
                      <td className="py-3 px-4 pl-6 font-medium text-green-700">
                        {new Date(record.deliveryDate).toLocaleDateString(
                          'pt-BR'
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800">
                        {getPatientNameById(record.patientId)}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {record.medications
                          ?.map((m) =>
                            getMedicationName(m.medicationId, medications)
                          )
                          .join(', ')}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={record.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentDeliveries.length === 0 && (
                <div className="p-10 text-center text-gray-400">
                  Nenhuma entrega nos últimos 7 dias.
                </div>
              )}
            </div>
          </div>
        );

      case 'medications':
        return (
          <MedicationsPage user={user} addToast={addToast} addLog={addLog} />
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
      {renderCurrentView()}

      <SearchPatientModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        patients={patients}
        onSelectPatient={handleSelectPatientFromSearch}
        onCreateNew={() => {
          setIsSearchModalOpen(false);
          handleEditPatient(null);
        }}
      />

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

      {isRecordModalOpen && (
        <RecordForm
          key={recordFormKey}
          patient={selectedPatient}
          patients={patients}
          records={records}
          profissionalId={user?._id || user?.id}
          record={editingRecord}
          recentRecord={
            selectedPatient
              ? findRecentRecord(
                  selectedPatient?._id || selectedPatient?.id,
                  editingRecord?._id || editingRecord?.id || null
                )
              : null
          }
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
          title={confirmation.title}
          message={confirmation.message}
          confirmText={confirmation.confirmText}
          isDestructive={confirmation.isDestructive}
          onConfirm={() => {
            if (confirmation.onConfirm)
              confirmation.onConfirm(confirmation.data);
          }}
          onClose={closeConfirmation}
        />
      )}
      {attendingRecord && (
        <AttendRecordModal
          record={attendingRecord}
          onConfirm={handleUpdateRecordStatus}
          onClose={() => !isAttendingLoading && setAttendingRecord(null)}
          getPatientName={getPatientNameById}
          medications={medications}
          getMedicationName={getMedicationName}
          isSaving={isAttendingLoading}
        />
      )}
      {cancelingRecord && (
        <CancelRecordModal
          record={cancelingRecord}
          onClose={() => setCancelingRecord(null)}
          onConfirm={handleCancelRecordStatus}
          getPatientNameById={getPatientNameById}
        />
      )}
    </>
  );
}
