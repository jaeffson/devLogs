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
import AddShipmentItemModal from '../components/common/AddShipmentItemModal';
import MedicationsPage from './MedicationsPage';
import { icons } from '../utils/icons';
import { getMedicationName } from '../utils/helpers';
import { useDebounce } from '../hooks/useDebounce';
import { FiArrowRight } from 'react-icons/fi'; 


// ============================================================================
// ÁREA DE HELPERS (Funções auxiliares - FORA DO COMPONENTE)
const fixDate = (dateString) => {
  if (!dateString) return '-';
  const cleanDate = String(dateString).split('T')[0];
  if (!cleanDate.includes('-')) return cleanDate;
  const [year, month, day] = cleanDate.split('-');
  return `${day}/${month}/${year}`;
};

// 2. Define a Saudação
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

// 3. Calcula dias de atraso (Lógica dos 35 dias)
const calculateDaysLate = (lastVisitDate) => {
  if (!lastVisitDate) return 0;
  const last = new Date(lastVisitDate);
  const today = new Date();
  const diffTime = Math.abs(today - last);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

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
  addLog,
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
  const [detalhesMovimentacao, setDetalhesMovimentacao] = useState(null);

  // NOVO: Estado para Modal de Nova Remessa
  const [isAddShipmentModalOpen, setIsAddShipmentModalOpen] = useState(false);

  const [editingPatient, setEditingPatient] = useState(null);
  const [viewingCancelReason, setViewingCancelReason] = useState(null);
  const handleViewCancelReason = (record) => {
    setViewingCancelReason(record);
  };

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

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

  const getPatientNameById = (patientId) => {
    const inList = Array.isArray(patients)
      ? patients.find((p) => (p._id || p.id) === patientId)?.name
      : null;

    if (!inList) {
      if (typeof patientId === 'object' && patientId?.name)
        return patientId.name;
      return 'Desconhecido';
    }
    return inList;
  };

  const findRecentRecord = (patientId, recordToExcludeId = null) => {
    if (!patientId || !Array.isArray(records)) return null;
    const now = new Date().getTime();
    const patientRecords = records
      .filter((r) => {
        const recordId = r._id || r.id;
        const pId =
          typeof r.patientId === 'object' ? r.patientId._id : r.patientId;
        return (
          pId === patientId &&
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

  const handleEditRecordClick = (record) => {
    let pId = record.patientId;
    if (typeof pId === 'object' && pId !== null) {
      pId = pId._id || pId.id;
    }
    let targetPatient = patients.find((p) => (p._id || p.id) === pId);
    if (!targetPatient && pId) {
      targetPatient = {
        _id: pId,
        name: record.patientName || 'Paciente (Arquivo)',
        isGhost: true,
      };
    }
    if (targetPatient) {
      setSelectedPatient(targetPatient);
      setEditingRecord(record);
      setIsRecordModalOpen(true);
    } else {
      addToast('Erro: Dados do paciente corrompidos.', 'error');
    }
  };

  const handleSavePatient = async (patientData) => {
    try {
      let response;
      const patientId = patientData._id || patientData.id;
      const payload = { ...patientData };
      if (payload.cpf) payload.cpf = String(payload.cpf).trim();
      if (payload.susCard) payload.susCard = String(payload.susCard).trim();

      if (patientId && patientId !== 'new') {
        response = await api.put(`/patients/${patientId}`, payload);
        addLog?.(
          user?.name,
          `atualizou o cadastro do paciente ${patientData.name}`
        );
        addToast('Paciente atualizado!', 'success');
        setIsPatientModalOpen(false);
        setEditingPatient(null);
      } else {
        response = await api.post('/patients', payload);
        addLog?.(user?.name, `cadastrou novo paciente: ${patientData.name}`);
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

  const handleSaveRecord = async (formData) => {
    try {
      if (editingRecord) {
        const id = editingRecord._id || editingRecord.id;
        const response = await api.put(`/records/${id}`, formData);
        setRecords((prev) =>
          prev.map((r) => (r._id === id || r.id === id ? response.data : r))
        );
        addToast('Registro atualizado com sucesso!', 'success');
      } else {
        const response = await api.post('/records', formData);
        setRecords((prev) => [response.data, ...prev]);
        addToast('Registro criado com sucesso!', 'success');
      }
      setIsRecordModalOpen(false);
      setEditingRecord(null);
    } catch (error) {
      console.error('Erro ao salvar registro:', error);
      addToast('Erro ao salvar o registro. Verifique os dados.', 'error');
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
      addLog?.(
        user?.name,
        `EXCLUIU o registro de atendimento de ${patientName}`
      );
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
      addLog?.(user?.name, `cadastrou nova medicação: ${medData.name.trim()}`);
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
      addLog?.(user?.name, `registrou ATENDIMENTO de ${patientName}`);
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
      addLog?.(
        user?.name,
        `CANCELOU o registro de atendimento de ${patientName} (Motivo: ${reason})`
      );
      addToast('Cancelado.', 'info');
      await syncGlobalState(setRecords, 'registros');
    } catch {
      addToast('Erro ao cancelar.', 'error');
    }
  };

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
      .filter((r) => {
        const pId =
          typeof r.patientId === 'object' ? r.patientId._id : r.patientId;
        return pId === targetId;
      })
      .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));
  }, [records, selectedPatient]);

  // OTIMIZAÇÃO: Pré-calcula o nome do paciente
  const recordsWithPatientNames = useMemo(() => {
    const patientMap = patients.reduce((acc, p) => {
      acc[p._id || p.id] = p.name;
      return acc;
    }, {});

    return records.map((r) => {
      let pId = r.patientId;
      if (typeof pId === 'object') pId = pId._id;
      let pName = patientMap[pId];
      if (!pName) {
        if (r.patientName) pName = r.patientName;
        else if (typeof r.patientId === 'object' && r.patientId.name)
          pName = r.patientId.name;
        else pName = 'Desconhecido';
      }
      return {
        ...r,
        patientName: pName,
      };
    });
  }, [records, patients]);

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

  const getSafeMedicationName = (medicationId, meds = []) => {
    if (!medicationId) return '-';
    const targetId =
      typeof medicationId === 'object'
        ? medicationId._id || medicationId.id
        : medicationId;
    if (!targetId) return 'Desconhecido';
    const targetIdStr = String(targetId);
    const found = meds.find(
      (m) => String(m._id) === targetIdStr || String(m.id) === targetIdStr
    );
    return found ? found.name : 'Desconhecido';
  };

  const renderCurrentView = () => {
    switch (currentView) {
      // ======================================================================
      // DASHBOARD (DESIGN SENIOR CORRIGIDO)
      // ======================================================================
  case 'dashboard':
        // --- 1. MÉTRICAS E CÁLCULOS ---
        const totalPacientes = patients?.length || 0;
        const totalMedicamentos = medications?.length || 0;
        const entregasRecentes = recentDeliveries?.length || 0;

        // Lógica: Filtra pacientes com mais de 35 dias sem visita
        const pacientesEmAtraso = patients?.filter((p) => {
            if (!p.lastVisit) return false;
            return calculateDaysLate(p.lastVisit) > 35;
        }) || [];

        // Lógica: Pacientes com status 'Pendente' há mais de 30 dias
        const pacientesPendentes = patients?.filter((p) => {
            if (p.status !== 'Pendente') return false;
            const dataBase = p.createdAt || p.lastVisit;
            if (!dataBase) return false;
            return calculateDaysLate(dataBase) > 30;
        }) || [];

        return (
          <>
            <div className="h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar p-4 animate-fade-in bg-slate-50/50">
              {/* --- 2. CABEÇALHO EXECUTIVO --- */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 rounded-3xl shadow-lg p-8 mb-8 text-white relative overflow-hidden border border-slate-700">
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div>
                    <h1 className="text-3xl font-black mb-2 tracking-tight flex items-center gap-3">
                      {getGreeting()},{' '}
                      <span className="text-blue-400">{user?.name?.split(' ')[0] || 'Profissional'}</span>
                    </h1>
                    <div className="max-w-xl text-sm font-light leading-relaxed mt-4 space-y-2">
                      
                      {pacientesPendentes.length > 0 && (
                        <span className="inline-flex items-center gap-2 text-red-100 font-bold bg-red-600/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-red-500/50 shadow-sm cursor-default">
                          ⚠ {pacientesPendentes.length} {pacientesPendentes.length === 1 ? 'paciente pendente' : 'pacientes pendentes'} há mais de 30 dias!
                        </span>
                      )}

                      {pacientesEmAtraso.length > 0 && (
                        <span className="inline-flex items-center gap-2 text-orange-100 font-bold bg-orange-500/30 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-orange-500/30 shadow-sm mt-2 md:mt-0 md:ml-2 cursor-default">
                          ⏱ {pacientesEmAtraso.length} {pacientesEmAtraso.length === 1 ? 'paciente' : 'pacientes'} sem retorno (&gt;35 dias).
                        </span>
                      )}

                      {pacientesEmAtraso.length === 0 && pacientesPendentes.length === 0 && (
                        <span className="inline-flex items-center gap-2 text-emerald-100 font-medium bg-emerald-500/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-emerald-500/30 cursor-default">
                          {icons.check} O sistema está atualizado e sem pendências no momento.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4 md:mt-0">
                    <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-center shadow-inner cursor-default">
                      <span className="block text-3xl font-black text-white">
                        {totalPacientes}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">
                        Total Usuários
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- 3. CARDS KPI (INDICADORES PRINCIPAIS) --- */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div onClick={() => setCurrentView('patients')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group hover:shadow-md hover:-translate-y-1 hover:border-blue-300 transition-all duration-300 cursor-pointer">
                  <div className="flex justify-between items-center mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">{icons.users}</div>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-full uppercase tracking-wider">Ativos</span>
                  </div>
                  <h3 className="text-3xl font-black text-slate-800">{totalPacientes}</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1 group-hover:text-blue-600 transition-colors">Gerenciar Usuários &rarr;</p>
                </div>

                <div onClick={() => setCurrentView('medications')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group hover:shadow-md hover:-translate-y-1 hover:border-indigo-300 transition-all duration-300 cursor-pointer">
                  <div className="flex justify-between items-center mb-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-sm">{icons.medication}</div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-full uppercase tracking-wider">Estoque</span>
                  </div>
                  <h3 className="text-3xl font-black text-slate-800">{totalMedicamentos}</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1 group-hover:text-indigo-600 transition-colors">Medicamentos &rarr;</p>
                </div>

                <div onClick={() => setCurrentView('deliveries')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group hover:shadow-md hover:-translate-y-1 hover:border-emerald-300 transition-all duration-300 cursor-pointer">
                  <div className="flex justify-between items-center mb-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-sm">{icons.check}</div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-full uppercase tracking-wider">Saídas</span>
                  </div>
                  <h3 className="text-3xl font-black text-slate-800">{entregasRecentes}</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1 group-hover:text-emerald-600 transition-colors">Histórico Recente &rarr;</p>
                </div>

                <div onClick={() => setCurrentView('patients')} className={`p-6 rounded-2xl shadow-sm border transition-all duration-300 group relative overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-md ${pacientesPendentes.length > 0 || pacientesEmAtraso.length > 0 ? 'bg-red-50/50 border-red-200 hover:border-red-400' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  {(pacientesPendentes.length > 0 || pacientesEmAtraso.length > 0) && (
                    <div className="absolute right-0 top-0 w-20 h-20 bg-red-500/5 rounded-bl-[100px] pointer-events-none"></div>
                  )}
                  <div className="flex justify-between items-center mb-4 relative z-10">
                    <div className={`p-3 rounded-xl transition-colors duration-300 shadow-sm ${pacientesPendentes.length > 0 || pacientesEmAtraso.length > 0 ? 'bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-200'}`}>
                      {icons.alert}
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${pacientesPendentes.length > 0 || pacientesEmAtraso.length > 0 ? 'text-red-700 bg-red-100' : 'text-slate-500 bg-slate-100'}`}>
                      Atenção
                    </span>
                  </div>
                  <h3 className={`text-3xl font-black mb-1 ${pacientesPendentes.length > 0 || pacientesEmAtraso.length > 0 ? 'text-red-700' : 'text-slate-400'}`}>
                    {pacientesPendentes.length + pacientesEmAtraso.length}
                  </h3>
                  <p className={`text-sm font-medium transition-colors ${pacientesPendentes.length > 0 || pacientesEmAtraso.length > 0 ? 'text-red-500 group-hover:text-red-700' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    {pacientesPendentes.length > 0 || pacientesEmAtraso.length > 0 ? 'Pendências no sistema &rarr;' : 'Sem alertas &rarr;'}
                  </p>
                </div>
              </div>

              {/* --- 4. ÁREA DE OPERAÇÕES E NAVEGAÇÃO --- */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* TABELA: Últimas Movimentações */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                    <h3 className="font-bold text-slate-800 flex items-center gap-3 uppercase text-xs tracking-widest">
                      <span className="w-2 h-5 bg-blue-600 rounded-full shadow-sm"></span>
                      Últimas Movimentações
                    </h3>
                    <button onClick={() => setCurrentView('deliveries')} className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all cursor-pointer active:scale-95">
                      Ver Tudo &rarr;
                    </button>
                  </div>

                  <div className="overflow-x-auto flex-grow">
                    <table className="w-full text-sm text-left">
                      <thead className="text-[10px] text-slate-400 uppercase font-black tracking-wider border-b border-slate-100 bg-slate-50/50">
                        <tr>
                          <th className="px-6 py-4">Data</th>
                          <th className="px-6 py-4">Paciente</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {recentDeliveries.slice(0, 5).map((r, i) => (
                          <tr
                            key={i}
                            className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                            // A MÁGICA ACONTECE AQUI: ABRE O MODAL COM OS DADOS DA LINHA
                            onClick={() => setDetalhesMovimentacao(r)} 
                          >
                            <td className="px-6 py-4">
                              <span className="font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg text-xs border border-slate-200 group-hover:border-blue-200 transition-colors">
                                {fixDate(r.deliveryDate || r.createdAt)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-slate-800 text-sm block group-hover:text-blue-700 transition-colors">
                                {getPatientNameById(r.patientId)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border tracking-wider inline-block ${r.status === 'Entregue' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {recentDeliveries.length === 0 && (
                      <div className="p-12 text-center text-slate-400 text-sm font-medium flex flex-col items-center gap-2">
                        <span className="text-3xl">📭</span>
                        Nenhuma movimentação registrada recentemente.
                      </div>
                    )}
                  </div>
                </div>

                {/* PAINEL LATERAL DIREITO (Mantido igual) */}
                <div className="flex flex-col gap-6">
                  {/* Ações Rápidas */}
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                    <h4 className="font-bold text-slate-800 mb-6 text-xs uppercase tracking-widest flex items-center gap-2">
                      <span className="text-blue-500">{icons.plus}</span> Ações Rápidas
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <button onClick={() => setCurrentView('patients')} className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 text-slate-700 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all duration-300 cursor-pointer active:scale-[0.98] group shadow-sm hover:shadow">
                        <div className="flex flex-col items-start">
                          <span className="font-bold text-sm group-hover:text-blue-700 transition-colors">Gerenciar Usuários</span>
                          <span className="text-[10px] text-slate-400 font-medium">Cadastrar ou editar perfis</span>
                        </div>
                        <div className="text-slate-400 group-hover:text-blue-600 transition-colors p-2 bg-white rounded-xl shadow-sm">{icons.users}</div>
                      </button>
                      <button onClick={() => setCurrentView('patients')} className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 text-slate-600 rounded-2xl border border-slate-300 border-dashed hover:border-slate-400 transition-all duration-300 cursor-pointer active:scale-[0.98] group">
                        <span className="font-bold text-sm group-hover:text-slate-800">Novo Registro</span>
                        <div className="text-slate-400 font-black text-lg group-hover:scale-110 transition-transform">+</div>
                      </button>
                    </div>
                  </div>

                  {/* Avisos */}
                  {pacientesPendentes.length > 0 && (
                    <div className="bg-red-600 rounded-3xl shadow-md border border-red-700 p-6 text-white relative overflow-hidden">
                      <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)] pointer-events-none"></div>
                      <h4 className="font-bold mb-4 text-xs uppercase tracking-widest flex items-center gap-2 relative z-10 text-red-50">⚠ Status Pendente Crítico</h4>
                      <div className="space-y-3 max-h-[160px] overflow-y-auto custom-scrollbar pr-2 relative z-10">
                        {pacientesPendentes.slice(0, 3).map((p, i) => (
                          <div key={i} onClick={() => setCurrentView('patients')} className="flex justify-between items-center bg-red-500 hover:bg-red-400 transition-colors p-3 rounded-xl border border-red-400/50 cursor-pointer shadow-sm group">
                            <span className="text-sm font-bold text-white truncate max-w-[130px] group-hover:translate-x-1 transition-transform">{p.name}</span>
                            <span className="text-[10px] font-black bg-red-900/40 px-2 py-1 rounded-md text-red-50 border border-red-900/30">&gt; 30 dias</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pacientesEmAtraso.length > 0 && (
                    <div className="bg-orange-50 rounded-3xl shadow-sm border border-orange-200 p-6">
                      <h4 className="font-bold text-orange-800 mb-4 text-xs uppercase tracking-widest flex items-center gap-2">⏱ Sem Retorno Recente</h4>
                      <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                        {pacientesEmAtraso.slice(0, 3).map((p, i) => (
                          <div key={i} onClick={() => setCurrentView('patients')} className="flex justify-between items-center bg-white hover:bg-orange-100/50 transition-colors p-2.5 rounded-xl border border-orange-100 cursor-pointer group">
                            <span className="text-xs font-bold text-slate-700 truncate max-w-[120px] group-hover:text-orange-900 transition-colors">{p.name}</span>
                            <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-md">{calculateDaysLate(p.lastVisit)} dias</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* MODAL DE DETALHES DA MOVIMENTAÇÃO (Renderização Condicional) */}
            {/* ========================================================= */}
            {detalhesMovimentacao && (
              <div 
                className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in"
                onClick={() => setDetalhesMovimentacao(null)} // Fecha ao clicar fora
              >
                <div 
                  className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 flex flex-col animate-slide-up"
                  onClick={(e) => e.stopPropagation()} // Evita fechar ao clicar dentro do card
                >
                  {/* Cabeçalho do Modal */}
                  <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                      <span className="text-blue-500">{icons.check}</span> Detalhes do Atendimento
                    </h3>
                    <button 
                      onClick={() => setDetalhesMovimentacao(null)}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Corpo do Modal (Informações Principais) */}
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Paciente */}
                      <div className="col-span-2 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                        <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider block mb-1">Paciente</span>
                        <span className="font-black text-slate-800 text-lg">{getPatientNameById(detalhesMovimentacao.patientId)}</span>
                      </div>

                      {/* Status */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Status</span>
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border tracking-wider inline-block ${detalhesMovimentacao.status === 'Entregue' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                          {detalhesMovimentacao.status}
                        </span>
                      </div>

                      {/* Data e Hora */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Data / Hora</span>
                        <span className="font-bold text-slate-700 text-sm">
                          {new Date(detalhesMovimentacao.deliveryDate || detalhesMovimentacao.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>

                      {/* Fornecedor */}
                      <div className="col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Fornecedor</span>
                        <span className="font-bold text-slate-700 text-sm">
                          {detalhesMovimentacao.fornecedor || detalhesMovimentacao.supplier || 'Não informado'}
                        </span>
                      </div>
                    </div>

                    {/* Lista de Medicamentos (Estilo Recibo) */}
                    <div>
                      <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block mb-3 border-b border-slate-100 pb-2">Medicamentos Prescritos</span>
                      <ul className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                        {detalhesMovimentacao.medicamentos?.length > 0 || detalhesMovimentacao.medications?.length > 0 ? (
                          (detalhesMovimentacao.medicamentos || detalhesMovimentacao.medications).map((med, idx) => (
                            <li key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <span className="font-bold text-slate-700 text-sm">{med.nome || med.name}</span>
                              <span className="font-black text-blue-600 bg-blue-100/50 px-2 py-1 rounded text-xs">{med.quantidade || med.quantity} un.</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-center text-slate-400 text-sm italic py-2">Nenhum medicamento listado.</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Rodapé do Modal */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <button 
                      onClick={() => setDetalhesMovimentacao(null)}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      case 'patients':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-8rem)] animate-fade-in max-w-7xl mx-auto p-4 md:p-0">
            {/* Painel Lateral: Lista de Pacientes */}
            <div className="lg:col-span-4 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-gray-100 flex flex-col overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="font-extrabold text-gray-900 flex items-center gap-3 tracking-tight">
                    <span className="bg-blue-100 text-blue-600 p-2 rounded-xl">
                      {icons.users}
                    </span>
                    Pacientes
                  </h2>
                  <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg shadow-blue-200">
                    {patients.length} TOTAL
                  </span>
                </div>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Buscar paciente..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm group-hover:border-gray-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <span className="absolute left-3.5 top-3.5 text-gray-400 group-hover:text-blue-500 transition-colors">
                    {icons.search}
                  </span>
                </div>
                <button
                  onClick={() => handleEditPatient(null)}
                  className="mt-4 w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  {icons.plus} NOVO CADASTRO
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {filteredPatients.map((p) => {
                  const active =
                    (selectedPatient?._id || selectedPatient?.id) ===
                    (p._id || p.id);
                  return (
                    <div
                      key={p._id || p.id}
                      onClick={() => setSelectedPatient(p)}
                      className={`p-4 rounded-2xl cursor-pointer flex items-center gap-4 transition-all duration-200 ${
                        active
                          ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 scale-[1.02]'
                          : 'hover:bg-blue-50 border border-transparent text-gray-700'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-inner ${
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p
                          className={`font-bold truncate ${active ? 'text-white' : 'text-gray-900'}`}
                        >
                          {p.name}
                        </p>
                        <p
                          className={`text-[11px] font-medium truncate ${active ? 'text-blue-100' : 'text-gray-400'}`}
                        >
                          {p.cpf
                            ? `CPF: ${p.cpf}`
                            : p.susCard
                              ? `SUS: ${p.susCard}`
                              : 'Sem documento'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Painel Principal: Detalhes e Prontuários */}
            <div className="lg:col-span-8 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-gray-100 flex flex-col overflow-hidden">
              {selectedPatient ? (
                <>
                  {/* Header do Paciente */}
                  <div className="bg-gradient-to-br from-white to-blue-50/50 p-8 border-b border-blue-50 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex gap-6 items-center w-full">
                      <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center text-3xl font-black shadow-2xl shadow-blue-200 ring-4 ring-white">
                        {selectedPatient.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight truncate">
                          {selectedPatient.name}
                        </h2>
                        <div className="flex flex-wrap gap-3 mt-2">
                          <span className="bg-white border border-gray-200 text-gray-500 px-3 py-1 rounded-lg text-xs font-bold shadow-sm">
                            CPF: {selectedPatient.cpf || '--'}
                          </span>
                          <span className="bg-white border border-gray-200 text-gray-500 px-3 py-1 rounded-lg text-xs font-bold shadow-sm">
                            SUS: {selectedPatient.susCard || '--'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                      <button
                        onClick={() => handleEditPatient(selectedPatient)}
                        className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-all shadow-sm font-bold text-sm cursor-pointer flex items-center justify-center gap-2"
                      >
                        {icons.edit} EDITAR
                      </button>
                      {user?.role !== 'profissional' && (
                        <button
                          onClick={() =>
                            setConfirmation({
                              isOpen: true,
                              title: 'Excluir Paciente',
                              message: `Atenção: Todos os dados de ${selectedPatient.name} serão removidos permanentemente.`,
                              onConfirm: () =>
                                handleDeletePatient(
                                  selectedPatient._id || selectedPatient.id
                                ),
                              isDestructive: true,
                              confirmText: 'EXCLUIR AGORA',
                            })
                          }
                          className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-red-100 rounded-xl hover:bg-red-50 text-red-500 transition-all shadow-sm font-bold text-sm cursor-pointer flex items-center justify-center gap-2"
                        >
                          {icons.trash}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tabela de Prontuários (Histórico do Paciente) */}
                  <div className="p-8 flex-grow flex flex-col bg-gray-50/20">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="font-black text-gray-800 flex items-center gap-2 text-lg">
                          {icons.history} Prontuário Digital
                        </h3>
                        <p className="text-xs text-gray-400 font-medium">
                          Histórico de solicitações e entregas.
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          openRecordModalWithCheck(selectedPatient, null)
                        }
                        className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-sm font-black hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                      >
                        {icons.plus} NOVA ENTRADA
                      </button>
                    </div>

                    <div className="flex-grow overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-inner shadow-gray-100">
                      <PatientRecordsTable
                        records={patientRecords}
                        medications={medications}
                        onViewReason={handleViewCancelReason}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-300 animate-pulse">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border-4 border-dashed border-gray-100">
                    <span className="text-5xl">{icons.user}</span>
                  </div>
                  <p className="text-xl font-black uppercase tracking-widest">
                    Selecione um Paciente
                  </p>
                  <p className="text-sm font-medium mt-2">
                    Para visualizar o histórico completo e realizar
                    atendimentos.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'historico':
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-fade-in flex flex-col h-[calc(100vh-8rem)] max-w-7xl mx-auto p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Histórico Completo
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Visualize e gerencie todas as entradas.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative w-full sm:w-auto">
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
                  {['Todos', 'Pendente', 'Atendido', 'Cancelado'].map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${statusFilter === status ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
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

                        {/* --- Correção na exibição de medicações --- */}
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(record.medications)
                              ? record.medications.map((m, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200"
                                  >
                                    {m.name ||
                                      getMedicationName(
                                        m.medicationId,
                                        medications
                                      )}
                                    <span className="text-gray-400 border-l border-gray-300 pl-1 ml-1 font-bold">
                                      {m.dosage ||
                                        `${m.quantity} ${m.unit || ''}`}
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
                                handleEditRecordClick(record);
                              }}
                              className="text-gray-500 hover:text-blue-600 p-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                              {icons.edit}
                            </button>

                            {user?.role !== 'profissional' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmation({
                                    isOpen: true,
                                    title: 'Excluir Registro',
                                    message: `Tem certeza que deseja excluir o registro de ${record.patientName} (Entrada: ${new Date(record.entryDate).toLocaleDateString('pt-BR')})? Esta ação é irreversível.`,
                                    onConfirm: () => {
                                      closeConfirmation();
                                      handleDeleteRecord(
                                        record._id || record.id
                                      );
                                    },
                                    isDestructive: true,
                                    confirmText: 'Excluir',
                                  });
                                }}
                                className="text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors cursor-pointer"
                                title="Excluir Registro"
                              >
                                {icons.trash}
                              </button>
                            )}
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

      // ======================================================================
      // ABA ENTREGAS (CORRIGIDA COM DATA BLINDADA)
      // ======================================================================
      case 'deliveries':
        return (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                  <span className="bg-green-100 text-green-600 p-3 rounded-2xl shadow-sm">
                    {icons.check}
                  </span>
                  Entregas da Semana
                </h2>
                <p className="text-gray-500 mt-2 font-medium">
                  Acompanhe o fluxo de saídas recentes.
                </p>
              </div>
              <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                <span className="text-blue-700 font-bold text-sm">
                  {recentDeliveries.length} Atendimentos
                </span>
              </div>
            </div>

            <div className="flex-grow overflow-auto rounded-2xl border border-gray-200 bg-white shadow-inner custom-scrollbar">
              <table className="min-w-full text-sm text-left border-separate border-spacing-0">
                <thead className="bg-gray-50/50 sticky top-0 z-20 backdrop-blur-md">
                  <tr>
                    <th className="py-4 px-6 font-bold text-gray-400 uppercase tracking-widest text-[10px] border-b border-gray-100">
                      Data
                    </th>
                    <th className="py-4 px-6 font-bold text-gray-400 uppercase tracking-widest text-[10px] border-b border-gray-100">
                      Paciente
                    </th>
                    <th className="py-4 px-6 font-bold text-gray-400 uppercase tracking-widest text-[10px] border-b border-gray-100">
                      Itens Entregues
                    </th>
                    <th className="py-4 px-6 font-bold text-gray-400 uppercase tracking-widest text-[10px] border-b border-gray-100 text-center">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentDeliveries.map((r, idx) => (
                    <tr
                      key={r._id || r.id}
                      className="hover:bg-blue-50/40 transition-all duration-200 group"
                    >
                      <td className="py-5 px-6">
                        {/* --- CORREÇÃO AQUI (Data Blindada) --- */}
                        <span className="font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                          {fixDate(r.deliveryDate)}
                        </span>
                      </td>
                      <td className="py-5 px-6 font-bold text-gray-800 text-base">
                        {getPatientNameById(r.patientId)}
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex flex-wrap gap-2">
                          {r.medications?.map((m, i) => (
                            <span
                              key={i}
                              className="bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-lg text-xs font-semibold shadow-sm group-hover:border-blue-200 transition-colors"
                            >
                              {getSafeMedicationName(
                                m.medicationId,
                                medications
                              )}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-5 px-6 text-center">
                        <StatusBadge status={r.status} />
                        {r.status === 'Cancelado' && r.cancelReason && (
                          <div className="mt-2 text-[10px] font-bold text-red-500 flex items-center justify-center gap-1 uppercase italic">
                            <span className="text-red-400">{icons.info}</span>{' '}
                            {r.cancelReason}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {recentDeliveries.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400 italic">
                  <div className="p-6 bg-gray-50 rounded-full mb-4 opacity-50">
                    {icons.history}
                  </div>
                  <p className="text-lg font-medium">
                    Nenhuma entrega registrada nos últimos 7 dias.
                  </p>
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

      {/* --- MODAL NOVA REMESSA (ADICIONADO) --- */}
      {isAddShipmentModalOpen && (
        <AddShipmentItemModal
          onClose={() => setIsAddShipmentModalOpen(false)}
          onSuccess={() => {
            setIsAddShipmentModalOpen(false);
            addToast('Remessa registrada com sucesso!', 'success');
            syncGlobalState(setRecords, 'registros'); // Atualiza a lista
          }}
          currentShipmentId={null} // Ou lógica para criar novo ID
        />
      )}

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
      {/* MODAL DE MOTIVO DO CANCELAMENTO (SENIOR UI) */}
      {viewingCancelReason && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border border-red-50">
            <div className="p-6 bg-gradient-to-br from-red-50 to-white border-b border-red-100 flex justify-between items-center">
              <div className="flex items-center gap-3 text-red-600">
                <span className="p-2 bg-red-100 rounded-xl">{icons.info}</span>
                <h3 className="font-black text-lg tracking-tight">
                  MOTIVO DO CANCELAMENTO
                </h3>
              </div>
              <button
                onClick={() => setViewingCancelReason(null)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
              >
                {icons.close}
              </button>
            </div>

            <div className="p-8">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                Detalhes informados:
              </p>
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 italic text-gray-700 leading-relaxed shadow-inner">
                "
                {viewingCancelReason.cancelReason ||
                  'Nenhum motivo detalhado foi fornecido.'}
                "
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <p className="text-[10px] text-gray-400 font-medium">
                  Cancelado em:{' '}
                  {new Date(viewingCancelReason.updatedAt).toLocaleDateString(
                    'pt-BR'
                  )}
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setViewingCancelReason(null)}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-black hover:bg-black transition-all cursor-pointer shadow-lg shadow-gray-200"
              >
                ENTENDIDO
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
