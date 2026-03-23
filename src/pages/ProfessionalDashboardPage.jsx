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
import {
  FiArrowRight,
  FiSearch,
  FiRefreshCw,
  FiX,
  FiTruck,
  FiClock,
  FiUsers,
  FiActivity,
  FiPlus,
  FiAlertCircle,
  FiBox,
  FiDollarSign,
  FiCalendar,
  FiCheck,
  FiAlertTriangle,
} from 'react-icons/fi';

// ============================================================================
// ÁREA DE HELPERS (Funções auxiliares
const fixDate = (dateString) => {
  if (!dateString) return '-';
  const cleanDate = String(dateString).split('T')[0];
  if (!cleanDate.includes('-')) return cleanDate;
  const [year, month, day] = cleanDate.split('-');
  return `${day}/${month}/${year}`;
};

const getPatientName = (record, patientsList) => {
  if (!record) return 'Paciente não identificado';

  if (typeof record.patientNameId === 'string' && record.patientNameId.trim())
    return record.patientNameId;
  if (
    record.patient &&
    typeof record.patient.name === 'string' &&
    record.patient.name.trim()
  )
    return record.patient.name;
  if (typeof record.nomePaciente === 'string' && record.nomePacienteId.trim())
    return record.nomePacienteId;

  // 2ª Tentativa: Captura o ID real do paciente de forma segura
  let patientId = null;

  if (record.patientId && typeof record.patientId !== 'object') {
    patientId = record.patientId;
  } else if (record.patient) {
    if (typeof record.patient === 'object') {
      patientId = record.patient._id || record.patient.id;
    } else {
      patientId = record.patient;
    }
  }

  // Se, por algum motivo absurdo, o ID ainda for um objeto, tentamos limpar
  if (typeof patientId === 'object' && patientId !== null) {
    patientId = patientId._id || patientId.id || null;
  }

  // Transforma num texto seguro e ignora se for "[object Object]"
  const safeId = patientId ? String(patientId).trim() : null;

  // 3ª Tentativa: Se achamos um ID válido, vamos cruzar com a lista de pacientes
  if (safeId && safeId !== '[object Object]' && Array.isArray(patientsList)) {
    const found = patientsList.find((p) => String(p._id || p.id) === safeId);
    if (found && found.name) return found.name;
  }

  // 4ª Tentativa: Fallback final - Mostra o ID cortado, desde que não seja um objeto quebrado
  if (safeId && safeId !== '[object Object]') {
    return `ID: ${safeId.substring(0, 6)}...`;
  }

  return 'Paciente não identificado';
};
const getFarmaciaName = (record) => {
  return (
    record.farmaciaDestino ||
    record.pharmacy ||
    record.distributor ||
    'Destino não informado'
  );
};

// 3. Dá bom dia, boa tarde ou boa noite dependendo da hora
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
};
// ---------------------------------

const MS_IN_30_DAYS = 30 * 24 * 60 * 60 * 1000;
const MS_IN_20_DAYS = 20 * 24 * 60 * 60 * 1000;

// --- Subcomponente: Modal de Busca de Paciente ---
const SearchPatientModal = ({
  isOpen,
  onClose,
  patients = [], // Blindagem: garante que nunca quebra se a lista estiver vazia
  onSelectPatient,
  onCreateNew,
  records,
  setRecords,
}) => {
  const [term, setTerm] = useState('');
  const searchInputRef = useRef(null);
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTerm('');
      if (searchInputRef.current) {
        setTimeout(() => searchInputRef.current.focus(), 100);
      }
    }
  }, [isOpen]);

  // Hook de Filtragem de Pacientes (Blindado contra erros)
  const filtered = useMemo(() => {
    const safePatients = Array.isArray(patients) ? patients : [];
    if (!term) return safePatients.slice(0, 10);
    const lowerTerm = term.toLowerCase();
    return safePatients.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(lowerTerm)) ||
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
            <FiSearch className="text-indigo-600" /> Buscar Próximo Paciente
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1"
          >
            <FiX size={20} />
          </button>
        </div>
        <div className="p-4 border-b border-gray-100">
          <input
            ref={searchInputRef}
            type="text"
            className="w-full bg-gray-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-3 text-base transition-all outline-none"
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
                className="w-full text-left p-3 hover:bg-indigo-50 rounded-xl transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {p.name ? p.name.charAt(0).toUpperCase() : '?'}
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
                <div className="text-gray-400 group-hover:text-indigo-600">
                  <FiArrowRight />
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>Nenhum paciente encontrado.</p>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onCreateNew}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md transition-all flex justify-center items-center gap-2 cursor-pointer active:scale-95"
          >
            <FiPlus size={18} /> Cadastrar Novo Paciente
          </button>
        </div>
      </div>
    </div>
  );
};
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
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);

  // --- INTELIGÊNCIA DE NEGÓCIO: Alerta de 30 Dias ---
  const pendingOver30Days = useMemo(() => {
    if (!records) return [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return records.filter((r) => {
      const status = String(r.status || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const isPending =
        status.includes('pendente') ||
        status.includes('parcial') ||
        status.includes('aguardando');
      const recordDate = new Date(r.createdAt || r.entryDate);

      return isPending && recordDate < thirtyDaysAgo;
    });
  }, [records]);
 // =========================================================================
  // FUNÇÃO AUXILIAR RECUPERADA (Cola isto antes do return do seu Dashboard!)
  // =========================================================================
  const getPatientNameById = (patientId) => {
        if (!patients || patients.length === 0) return 'Paciente';
    const patient = patients.find(p => p._id === patientId || p.id === patientId);
    return patient ? patient.name : 'Paciente';
  };
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

  const getPatientName = (record, patientsList) => {
    if (!record) return 'Paciente não identificado';
    if (
      record.patientId &&
      typeof record.patientId === 'object' &&
      record.patientId.name
    ) {
      return record.patientId.name;
    }

    // Fallbacks de segurança caso algum registro antigo venha diferente
    if (typeof record.patientName === 'string' && record.patientName.trim())
      return record.patientName;
    if (
      record.patient &&
      typeof record.patient.name === 'string' &&
      record.patient.name.trim()
    )
      return record.patient.name;

    // Se vier só o texto do ID solto
    let pId = null;
    if (typeof record.patientId === 'string') pId = record.patientId;
    else if (record.patientId && record.patientId._id)
      pId = record.patientId._id;

    // Cruza com a lista de pacientes se tivermos apenas o ID
    if (pId && Array.isArray(patientsList)) {
      const found = patientsList.find(
        (p) => String(p._id || p.id) === String(pId)
      );
      if (found && found.name) return found.name;
    }

    return 'Paciente não identificado';
  };

  const getFarmaciaName = (record) => {
    return (
      record.farmacia ||
      record.pharmacy ||
      record.farmaciaDestino ||
      record.distributor ||
      'Destino não informado'
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };
  const findRecentRecord = (patient) => {
    if (!patient || !records) return null;

    const patientId = patient._id || patient.id;

    // Filtra de forma blindada, ignorando registros vazios ou sem paciente
    const recentRecords = records.filter((r) => {
      if (!r) return false;

      const recId = r.patient?._id || r.patient?.id || r.patientId || r.patient;

      return String(recId) === String(patientId);
    });

    const openRecord = recentRecords.find(
      (r) =>
        r.status === 'Pendente' ||
        r.status === 'Aguardando' ||
        r.status === 'Parcial'
    );

    // Retorna o registro em aberto, ou o mais recente, ou null se não houver nenhum
    return openRecord || recentRecords[0] || null;
  };

  const openSearchModal = () => setIsSearchModalOpen(true);

  const handleSelectPatientFromSearch = (patient) => {
    setIsSearchModalOpen(false);
    openRecordModalWithCheck(patient, null);
  };

  const openRecordModalWithCheck = (patient) => {
    if (!patient) return;

    const recent = findRecentRecord(patient);
    if (
      recent &&
      (recent.status === 'Pendente' ||
        recent.status === 'Aguardando' ||
        recent.status === 'Parcial')
    ) {
      setEditingRecord(recent); 
    } else {
      setEditingRecord(null); 
    }
    // (Verifique se os nomes dos seus setters são exatamente estes, senão adapte para os seus)
    if (typeof setSelectedPatient === 'function') setSelectedPatient(patient);
    if (typeof setIsRecordModalOpen === 'function') setIsRecordModalOpen(true);
    if (typeof setIsSearchModalOpen === 'function') setIsSearchModalOpen(false);
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
    // Se não tiver registros carregados ou paciente selecionado, retorna vazio
    if (!records || !selectedPatient) return [];

    const targetId = String(
      selectedPatient._id || selectedPatient.id || ''
    ).trim();
    const targetName = String(selectedPatient.name || '')
      .trim()
      .toLowerCase();

    return records.filter((r) => {
      if (!r) return false;

      // 1. TENTATIVA DIRETA (Verifica os campos padrão)
      const pId = String(
        r.patient?._id ||
          r.patient?.id ||
          r.patientId ||
          (typeof r.patient === 'string' ? r.patient : '')
      ).trim();
      const pName = String(r.patientName || r.patient?.name || '')
        .trim()
        .toLowerCase();

      if (targetId && pId === targetId) return true;
      if (targetName && pName === targetName) return true;
      const recordTextJSON = JSON.stringify(r).toLowerCase();
      if (
        targetId &&
        targetId.length > 5 &&
        JSON.stringify(r).includes(targetId)
      ) {
        return true;
      }

      if (
        targetName &&
        targetName.length > 3 &&
        recordTextJSON.includes(targetName)
      ) {
        return true;
      }

      return false;
    });
  }, [records, selectedPatient]);
  const recordsWithPatientNames = useMemo(() => {
    if (!records) return [];

    const patientMap = new Map();

    if (Array.isArray(patients)) {
      patients.forEach((p) => {
        const id = String(p?._id || p?.id);
        if (id) {
          patientMap.set(id, p?.name || 'Desconhecido');
        }
      });
    }

    return records.map((r) => {
      let patientName = 'Desconhecido';
      let patientId = null;

      if (r?.patientId) {
        if (typeof r.patientId === 'object') {
          patientId = r.patientId?._id || r.patientId?.id;
          patientName = r.patientId?.name || 'Desconhecido';
        } else {
          patientId = r.patientId;
        }
      }

      // busca no mapa
      if (patientId && patientMap.has(String(patientId))) {
        patientName = patientMap.get(String(patientId));
      }

      // fallback
      if (r?.patientName) {
        patientName = r.patientName;
      }

      return {
        ...r,
        patientName,
      };
    });
  }, [records, patients]);
const filteredRecords = useMemo(() => {
    // 1. Organiza do mais novo para o mais velho
    let result = recordsWithPatientNames.sort(
      (a, b) => new Date(b.entryDate || b.createdAt) - new Date(a.entryDate || a.createdAt)
    );

    // 2. FILTRO DE STATUS (Atrasados, Pendente, etc)
    if (statusFilter === 'Atrasados') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      result = result.filter((r) => {
        const st = String(r.status).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const isPending = st.includes('pendente') || st.includes('parcial') || st.includes('aguardando');
        const recordDate = new Date(r.createdAt || r.entryDate);
        return isPending && recordDate < thirtyDaysAgo;
      });
    } else if (statusFilter !== 'Todos') {
      result = result.filter((r) => r.status === statusFilter);
    }

    // 3. A NOVA PESQUISA INTELIGENTE (Sem acentos, Maiúsculas/Minúsculas, CPF e SUS)
    if (debouncedHistorySearch) {
      // Função ajudante que remove acentos e transforma tudo em minúsculas
      const normalizeText = (text) => 
        String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

      const searchClean = normalizeText(debouncedHistorySearch);

      result = result.filter((r) => {
        const nameClean = normalizeText(r.patientName);
        
        // Tenta capturar o CPF ou SUS de onde o banco de dados tiver guardado
        const cpfClean = normalizeText(r.patientId?.cpf || r.patient?.cpf || r.cpf);
        const susClean = normalizeText(r.patientId?.susCard || r.patient?.susCard || r.susCard);

        return (
          nameClean.includes(searchClean) || 
          cpfClean.includes(searchClean) || 
          susClean.includes(searchClean)
        );
      });
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

  const getMedicationName = (medicationId, meds = []) => {
    if (!medicationId) return '-';

    const id =
      typeof medicationId === 'object'
        ? medicationId._id || medicationId.id
        : medicationId;

    const med = meds.find(
      (m) => String(m._id) === String(id) || String(m.id) === String(id)
    );

    return med?.name || 'Desconhecido';
  };
  const renderCurrentView = () => {
    switch (currentView) {
      // ======================================================================
      // DASHBOARD 
      // ======================================================================
      case 'dashboard':
        return (
          <div className="h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar p-4 animate-fade-in bg-slate-50/50 space-y-6">
            {/* CABEÇALHO EXECUTIVO & AÇÕES RÁPIDAS */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-3xl shadow-lg p-8 text-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <h2 className="text-3xl font-black tracking-tight mb-2">
                  {getGreeting()}, {user?.name?.split(' ')[0] || 'Profissional'}
                  !
                </h2>
                <p className="text-indigo-200 font-medium flex items-center gap-2">
                  <FiClock className="animate-pulse" /> Resumo operacional e
                  insights de hoje
                </p>
              </div>

              {/* BOTÕES DE AÇÃO RÁPIDA */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setIsSearchModalOpen(true)} // Adapte para a sua função de abrir modal de registro
                  className="px-5 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <FiPlus size={18} /> Novo Registro Rápido
                </button>
                <button
                  onClick={() => setCurrentView('patients')}
                  className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <FiUsers size={18} /> Gerenciar Pacientes
                </button>
              </div>
            </div>

            {/* ALERTA CRÍTICO: PACIENTES PENDENTES > 30 DIAS */}
            {pendingOver30Days.length > 0 && (
              <div
                onClick={() => {
                  setStatusFilter('+30 dias'); // Ativa o filtro que criámos
                  setCurrentView('historico'); // Muda para a aba do histórico
                }}
                className="bg-rose-50 border border-rose-200 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:bg-rose-100 transition-colors shadow-sm group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <FiAlertTriangle size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-rose-800">
                      Atenção Crítica: Pedidos Atrasados
                    </h3>
                    <p className="text-sm font-medium text-rose-600 mt-1">
                      Você tem{' '}
                      <strong className="text-rose-900 text-base">
                        {pendingOver30Days.length} paciente(s)
                      </strong>{' '}
                      aguardando itens há mais de 30 dias.
                    </p>
                  </div>
                </div>
                <button className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all cursor-pointer text-white rounded-xl font-bold text-sm shadow-md flex items-center gap-2 shrink-0">
                  Resolver Agora <FiArrowRight />
                </button>
              </div>
            )}

            {/* BENTO BOX: CARDS DE MÉTRICAS REAIS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div
                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setCurrentView('patients')}
              >
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                  <FiUsers size={24} />
                </div>
                <h3 className="text-3xl font-black text-slate-800">
                  {patients?.length || 0}
                </h3>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
                  Total de Pacientes
                </p>
              </div>
              <div
                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setCurrentView('historico')}
              >
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
                  <FiActivity size={24} />
                </div>
                <h3 className="text-3xl font-black text-slate-800">
                  {records?.filter((r) => {
                    const st = String(r.status).toLowerCase();
                    return (
                      st.includes('pendente') ||
                      st.includes('parcial') ||
                      st.includes('aguardando')
                    );
                  }).length || 0}
                </h3>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
                  Aguardando Envio
                </p>
              </div>
              <div
                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setCurrentView('historico')}
              >
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                  <FiCheck size={24} />
                </div>
                <h3 className="text-3xl font-black text-slate-800">
                  {records?.filter((r) => {
                    // BLINDAGEM: Converte para minúsculas E remove todos os acentos
                    const st = String(r.status)
                      .toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '');
                    return (
                      st.includes('concluido') ||
                      st.includes('finalizado') ||
                      st.includes('entregue') ||
                      st.includes('atendido') ||
                      st.includes('recebido')
                    );
                  }).length || 0}
                </h3>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
                  Entregas Concluídas
                </p>
              </div>
              <div
                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setCurrentView('medications')}
              >
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                  <FiBox size={24} />
                </div>
                <h3 className="text-3xl font-black text-slate-800">
                  {medications?.length || 0}
                </h3>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
                  Itens no Catálogo
                </p>
              </div>
            </div>

            {/* TABELA: ÚLTIMAS MOVIMENTAÇÕES */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    Últimas Movimentações
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Clique num registro para ver os detalhes
                  </p>
                </div>
                <button
                  onClick={() => setCurrentView('historico')}
                  className="text-indigo-600 font-bold text-sm hover:underline flex items-center gap-1"
                >
                  Ver Histórico Completo <FiArrowRight />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-5">Paciente & Destino</th>
                      <th className="px-6 py-5">Data e Hora</th>
                      <th className="px-6 py-5">Status</th>
                      <th className="px-6 py-5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {/* Exibe os 6 registros mais recentes */}
                    {records?.slice(0, 6).map((r, i) => (
                      <tr
                        key={r._id || i}
                        onClick={() => setDetalhesMovimentacao(r)}
                        className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4">
                          <div className="font-black text-slate-800 text-sm">
                            {getPatientName(r, patients)}
                          </div>
                          <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
                            <FiTruck size={12} className="text-indigo-400" />
                            {getFarmaciaName(r)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-slate-600">
                            {new Date(
                              r.createdAt || r.entryDate
                            ).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                            às{' '}
                            {new Date(
                              r.createdAt || r.entryDate
                            ).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-indigo-600 font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            Ver Detalhes &rarr;
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!records?.length && (
                      <tr>
                        <td
                          colSpan="4"
                          className="p-12 text-center text-slate-400 font-medium"
                        >
                          Nenhum registro encontrado no banco de dados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MODAL MODERNO DE DETALHES DA MOVIMENTAÇÃO */}
            {detalhesMovimentacao && (
              <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100">
                  <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <StatusBadge status={detalhesMovimentacao.status} />
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                          <FiClock />{' '}
                          {new Date(
                            detalhesMovimentacao.createdAt ||
                              detalhesMovimentacao.entryDate
                          ).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <h3 className="font-black text-2xl text-slate-800">
                        {getPatientName(detalhesMovimentacao, patients)}
                      </h3>
                    </div>
                    <button
                      onClick={() => setDetalhesMovimentacao(null)}
                      className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
                    >
                      <FiX size={20} />
                    </button>
                  </div>

                  <div className="p-8 space-y-6">
                    {/* Fornecedor / Destino */}
                    <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 flex items-start gap-4">
                      <div className="p-3 bg-white text-indigo-600 rounded-xl shadow-sm shrink-0">
                        <FiTruck size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                          Unidade Responsável / Fornecedor
                        </p>
                        <p className="text-lg font-black text-indigo-900">
                          {getFarmaciaName(detalhesMovimentacao)}
                        </p>
                        {detalhesMovimentacao.senderName && (
                          <p className="text-xs font-bold text-indigo-600 mt-1">
                            Separado por: {detalhesMovimentacao.senderName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Lista de Medicamentos */}
                    <div>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">
                        Itens Relacionados neste Pedido
                      </span>
                      <ul className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                        {(
                          detalhesMovimentacao.medicamentos ||
                          detalhesMovimentacao.medications ||
                          detalhesMovimentacao.items ||
                          []
                        ).map((med, idx) => (
                          <li
                            key={idx}
                            className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-100 shadow-sm"
                          >
                            <span className="font-bold text-slate-700">
                              {med.name ||
                                med.medicationId?.name ||
                                getMedicationName(
                                  med.medicationId,
                                  medications
                                ) ||
                                'Item não especificado'}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-400">
                                Qtd:
                              </span>
                              <span className="font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg">
                                {med.quantity || med.requestedQuantity || 1}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                      onClick={() => setDetalhesMovimentacao(null)}
                      className="px-6 py-3 text-slate-500 hover:bg-slate-200 rounded-xl font-bold cursor-pointer transition-colors"
                    >
                      Fechar
                    </button>
                    <button
                      onClick={() => {
                        setDetalhesMovimentacao(null);
                        setCurrentView('historico');
                      }}
                      className="px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-black cursor-pointer shadow-lg transition-all active:scale-95"
                    >
                      Ver no Histórico Completo
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
        // --- 1. MÉTRICAS E CÁLCULOS ---
        const totalPacientes = patients?.length || 0;
        const totalMedicamentos = medications?.length || 0;
        const entregasRecentes = recentDeliveries?.length || 0;

        // Lógica: Filtra pacientes com mais de 35 dias sem visita
        const pacientesEmAtraso =
          patients?.filter((p) => {
            if (!p.lastVisit) return false;
            return calculateDaysLate(p.lastVisit) > 35;
          }) || [];

        // Lógica: Pacientes com status 'Pendente' há mais de 30 dias
        const pacientesPendentes =
          patients?.filter((p) => {
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
                      <span className="text-blue-400">
                        {user?.name?.split(' ')[0] || 'Profissional'}
                      </span>
                    </h1>
                    <div className="max-w-xl text-sm font-light leading-relaxed mt-4 space-y-2">
                      {pacientesPendentes.length > 0 && (
                        <span className="inline-flex items-center gap-2 text-red-100 font-bold bg-red-600/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-red-500/50 shadow-sm cursor-default">
                          ⚠ {pacientesPendentes.length}{' '}
                          {pacientesPendentes.length === 1
                            ? 'paciente pendente'
                            : 'pacientes pendentes'}{' '}
                          há mais de 30 dias!
                        </span>
                      )}

                      {pacientesEmAtraso.length > 0 && (
                        <span className="inline-flex items-center gap-2 text-orange-100 font-bold bg-orange-500/30 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-orange-500/30 shadow-sm mt-2 md:mt-0 md:ml-2 cursor-default">
                          ⏱ {pacientesEmAtraso.length}{' '}
                          {pacientesEmAtraso.length === 1
                            ? 'paciente'
                            : 'pacientes'}{' '}
                          sem retorno (&gt;35 dias).
                        </span>
                      )}

                      {pacientesEmAtraso.length === 0 &&
                        pacientesPendentes.length === 0 && (
                          <span className="inline-flex items-center gap-2 text-emerald-100 font-medium bg-emerald-500/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-emerald-500/30 cursor-default">
                            {icons.check} O sistema está atualizado e sem
                            pendências no momento.
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
                <div
                  onClick={() => setCurrentView('patients')}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group hover:shadow-md hover:-translate-y-1 hover:border-blue-300 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                      {icons.users}
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Ativos
                    </span>
                  </div>
                  <h3 className="text-3xl font-black text-slate-800">
                    {totalPacientes}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium mt-1 group-hover:text-blue-600 transition-colors">
                    Gerenciar Usuários &rarr;
                  </p>
                </div>

                <div
                  onClick={() => setCurrentView('medications')}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group hover:shadow-md hover:-translate-y-1 hover:border-indigo-300 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                      {icons.medication}
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Estoque
                    </span>
                  </div>
                  <h3 className="text-3xl font-black text-slate-800">
                    {totalMedicamentos}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium mt-1 group-hover:text-indigo-600 transition-colors">
                    Medicamentos &rarr;
                  </p>
                </div>

                <div
                  onClick={() => setCurrentView('deliveries')}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group hover:shadow-md hover:-translate-y-1 hover:border-emerald-300 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                      {icons.check}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Saídas
                    </span>
                  </div>
                  <h3 className="text-3xl font-black text-slate-800">
                    {entregasRecentes}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium mt-1 group-hover:text-emerald-600 transition-colors">
                    Histórico Recente &rarr;
                  </p>
                </div>

                <div
                  onClick={() => setCurrentView('patients')}
                  className={`p-6 rounded-2xl shadow-sm border transition-all duration-300 group relative overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-md ${pacientesPendentes.length > 0 || pacientesEmAtraso.length > 0 ? 'bg-red-50/50 border-red-200 hover:border-red-400' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                >
                  {(pacientesPendentes.length > 0 ||
                    pacientesEmAtraso.length > 0) && (
                    <div className="absolute right-0 top-0 w-20 h-20 bg-red-500/5 rounded-bl-[100px] pointer-events-none"></div>
                  )}
                  <div className="flex justify-between items-center mb-4 relative z-10">
                    <div
                      className={`p-3 rounded-xl transition-colors duration-300 shadow-sm ${pacientesPendentes.length > 0 || pacientesEmAtraso.length > 0 ? 'bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-200'}`}
                    >
                      {icons.alert}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${pacientesPendentes.length > 0 || pacientesEmAtraso.length > 0 ? 'text-red-700 bg-red-100' : 'text-slate-500 bg-slate-100'}`}
                    >
                      Atenção
                    </span>
                  </div>
                  <h3
                    className={`text-3xl font-black mb-1 ${pacientesPendentes.length > 0 || pacientesEmAtraso.length > 0 ? 'text-red-700' : 'text-slate-400'}`}
                  >
                    {pacientesPendentes.length + pacientesEmAtraso.length}
                  </h3>
                  <p
                    className={`text-sm font-medium transition-colors ${pacientesPendentes.length > 0 || pacientesEmAtraso.length > 0 ? 'text-red-500 group-hover:text-red-700' : 'text-slate-400 group-hover:text-slate-600'}`}
                  >
                    {pacientesPendentes.length > 0 ||
                    pacientesEmAtraso.length > 0
                      ? 'Pendências no sistema &rarr;'
                      : 'Sem alertas &rarr;'}
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
                    <button
                      onClick={() => setCurrentView('deliveries')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all cursor-pointer active:scale-95"
                    >
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
                              <span
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border tracking-wider inline-block ${r.status === 'Entregue' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}
                              >
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
                      <span className="text-blue-500">{icons.plus}</span> Ações
                      Rápidas
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <button
                        onClick={() => setCurrentView('patients')}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 text-slate-700 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all duration-300 cursor-pointer active:scale-[0.98] group shadow-sm hover:shadow"
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-bold text-sm group-hover:text-blue-700 transition-colors">
                            Gerenciar Usuários
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Cadastrar ou editar perfis
                          </span>
                        </div>
                        <div className="text-slate-400 group-hover:text-blue-600 transition-colors p-2 bg-white rounded-xl shadow-sm">
                          {icons.users}
                        </div>
                      </button>
                      <button
                        onClick={() => setCurrentView('patients')}
                        className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 text-slate-600 rounded-2xl border border-slate-300 border-dashed hover:border-slate-400 transition-all duration-300 cursor-pointer active:scale-[0.98] group"
                      >
                        <span className="font-bold text-sm group-hover:text-slate-800">
                          Novo Registro
                        </span>
                        <div className="text-slate-400 font-black text-lg group-hover:scale-110 transition-transform">
                          +
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Avisos */}
                  {pacientesPendentes.length > 0 && (
                    <div className="bg-red-600 rounded-3xl shadow-md border border-red-700 p-6 text-white relative overflow-hidden">
                      <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)] pointer-events-none"></div>
                      <h4 className="font-bold mb-4 text-xs uppercase tracking-widest flex items-center gap-2 relative z-10 text-red-50">
                        ⚠ Status Pendente Crítico
                      </h4>
                      <div className="space-y-3 max-h-[160px] overflow-y-auto custom-scrollbar pr-2 relative z-10">
                        {pacientesPendentes.slice(0, 3).map((p, i) => (
                          <div
                            key={i}
                            onClick={() => setCurrentView('patients')}
                            className="flex justify-between items-center bg-red-500 hover:bg-red-400 transition-colors p-3 rounded-xl border border-red-400/50 cursor-pointer shadow-sm group"
                          >
                            <span className="text-sm font-bold text-white truncate max-w-[130px] group-hover:translate-x-1 transition-transform">
                              {p.name}
                            </span>
                            <span className="text-[10px] font-black bg-red-900/40 px-2 py-1 rounded-md text-red-50 border border-red-900/30">
                              &gt; 30 dias
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pacientesEmAtraso.length > 0 && (
                    <div className="bg-orange-50 rounded-3xl shadow-sm border border-orange-200 p-6">
                      <h4 className="font-bold text-orange-800 mb-4 text-xs uppercase tracking-widest flex items-center gap-2">
                        ⏱ Sem Retorno Recente
                      </h4>
                      <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                        {pacientesEmAtraso.slice(0, 3).map((p, i) => (
                          <div
                            key={i}
                            onClick={() => setCurrentView('patients')}
                            className="flex justify-between items-center bg-white hover:bg-orange-100/50 transition-colors p-2.5 rounded-xl border border-orange-100 cursor-pointer group"
                          >
                            <span className="text-xs font-bold text-slate-700 truncate max-w-[120px] group-hover:text-orange-900 transition-colors">
                              {p.name}
                            </span>
                            <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-md">
                              {calculateDaysLate(p.lastVisit)} dias
                            </span>
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
                      <span className="text-blue-500">{icons.check}</span>{' '}
                      Detalhes do Atendimento
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
                        <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider block mb-1">
                          Paciente
                        </span>
                        <span className="font-black text-slate-800 text-lg">
                          {getPatientNameById(detalhesMovimentacao.patientId)}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                          Status
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-black uppercase border tracking-wider inline-block ${detalhesMovimentacao.status === 'Entregue' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}
                        >
                          {detalhesMovimentacao.status}
                        </span>
                      </div>

                      {/* Data e Hora */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                          Data / Hora
                        </span>
                        <span className="font-bold text-slate-700 text-sm">
                          {new Date(
                            detalhesMovimentacao.deliveryDate ||
                              detalhesMovimentacao.createdAt
                          ).toLocaleString('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>

                      {/* Fornecedor */}
                      <div className="col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                          Fornecedor
                        </span>
                        <span className="font-bold text-slate-700 text-sm">
                          {detalhesMovimentacao.fornecedor ||
                            detalhesMovimentacao.supplier ||
                            'Não informado'}
                        </span>
                      </div>
                    </div>

                    {/* Lista de Medicamentos (Estilo Recibo) */}
                    <div>
                      <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block mb-3 border-b border-slate-100 pb-2">
                        Medicamentos Prescritos
                      </span>
                      <ul className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                        {detalhesMovimentacao.medicamentos?.length > 0 ||
                        detalhesMovimentacao.medications?.length > 0 ? (
                          (
                            detalhesMovimentacao.medicamentos ||
                            detalhesMovimentacao.medications
                          ).map((med, idx) => (
                            <li
                              key={idx}
                              className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100"
                            >
                              <span className="font-bold text-slate-700 text-sm">
                                {med.nome || med.name}
                              </span>
                              <span className="font-black text-blue-600 bg-blue-100/50 px-2 py-1 rounded text-xs">
                                {med.quantidade || med.quantity}
                              </span>
                            </li>
                          ))
                        ) : (
                          <li className="text-center text-slate-400 text-sm italic py-2">
                            Nenhum medicamento listado.
                          </li>
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
          <div className="flex flex-col h-[calc(100vh-8rem)] max-w-7xl mx-auto p-4 md:p-6 animate-fade-in bg-slate-50/50">
            {/* ========================================================= */}
            {/* 1. BUSCA NO TOPO E AÇÕES GERAIS */}
            {/* ========================================================= */}
            <div className="relative z-50 shrink-0 mb-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-3 bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="relative w-full group flex-1">
                  <input
                    type="text"
                    placeholder="Buscar paciente por nome, CPF ou SUS..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      // Se estava vendo um paciente e digitou algo, fecha o paciente para ver a busca
                      if (selectedPatient) setSelectedPatient(null);
                    }}
                  />
                  <span className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    {icons.search}
                  </span>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  {selectedPatient && (
                    <button
                      onClick={() => setSelectedPatient(null)}
                      className="w-full md:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 border border-slate-200"
                    >
                      ← FECHAR PACIENTE
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedPatient(null);
                      handleEditPatient(null);
                    }}
                    className="w-full md:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shrink-0"
                  >
                    {icons.plus} NOVO PACIENTE
                  </button>
                </div>
              </div>

              {/* LISTA DE RESULTADOS FLUTUANTE (Aparece só quando digita) */}
              {searchTerm && !selectedPatient && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[60vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2">
                  {filteredPatients.length > 0 ? (
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {filteredPatients.slice(0, 30).map((p) => (
                        <div
                          key={p._id || p.id}
                          onClick={() => {
                            setSelectedPatient(p);
                            setSearchTerm(''); // Limpa a barra ao abrir
                          }}
                          className="flex items-center gap-3 p-3 hover:bg-indigo-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-indigo-100 group"
                        >
                          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-black text-base shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-700">
                              {p.name}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate mt-0.5">
                              {p.cpf
                                ? `CPF: ${p.cpf}`
                                : p.susCard
                                  ? `SUS: ${p.susCard}`
                                  : 'Sem documento'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500">
                      <p className="font-bold">
                        Nenhum paciente encontrado com "{searchTerm}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* 2. ÁREA PRINCIPAL */}
            {/* ========================================================= */}
            <div className="flex-1 flex flex-col min-h-0">
              {!selectedPatient ? (
                /* --- TELA VAZIA (Sem Grid Gigante, Foco na Busca) --- */
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-white rounded-3xl shadow-sm border border-slate-200 border-dashed animate-in fade-in duration-500">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border-2 border-slate-100 shadow-inner">
                    <span className="text-4xl opacity-50">{icons.search}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-700 tracking-tight mb-2">
                    Busque um paciente
                  </h3>
                  <p className="text-sm font-medium text-slate-500 max-w-sm leading-relaxed">
                    Utilize a barra no topo para pesquisar por nome, CPF ou
                    cartão SUS. Os resultados aparecerão instantaneamente.
                  </p>
                </div>
              ) : (
                /* --- PERFIL DO PACIENTE (Header Compacto + Tabela Gigante) --- */
                <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                  {/* HEADER COMPACTO E FINO */}
                  <div className="bg-slate-50/80 p-4 md:p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 relative">
                    <div className="flex gap-4 items-center w-full md:w-auto">
                      <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-md shrink-0 border-2 border-white">
                        {selectedPatient.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 pr-4">
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight truncate leading-none mb-1.5">
                          {selectedPatient.name}
                        </h2>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-slate-500 text-[11px] font-bold bg-white px-2 py-0.5 border border-slate-200 rounded-md">
                            CPF: {selectedPatient.cpf || 'Não inf.'}
                          </span>
                          <span className="text-slate-500 text-[11px] font-bold bg-white px-2 py-0.5 border border-slate-200 rounded-md">
                            SUS: {selectedPatient.susCard || 'Não inf.'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* BOTÕES DE AÇÃO (Com Novo Registro verde) */}
                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        onClick={() =>
                          openRecordModalWithCheck(selectedPatient, null)
                        }
                        className="flex-1 md:flex-none px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {icons.plus} NOVO REGISTRO
                      </button>
                      <button
                        onClick={() => handleEditPatient(selectedPatient)}
                        className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {icons.edit}{' '}
                        <span className="hidden sm:inline">EDITAR</span>
                      </button>
                    </div>
                  </div>

                  {/* TABELA DE HISTÓRICO MAXIMIZADA (Scroll Interno) */}
                  <div className="flex-1 flex flex-col p-4 md:p-6 min-h-0 bg-white">
                    <h3 className="font-black text-slate-800 flex items-center gap-2 text-base mb-3 shrink-0">
                      <span className="text-indigo-500">{icons.history}</span>{' '}
                      Histórico de Movimentações
                    </h3>

                    <div className="flex-1 overflow-hidden border border-slate-200 rounded-2xl relative shadow-sm">
                      <div className="absolute inset-0 overflow-y-auto custom-scrollbar bg-slate-50/30">
                        <table className="min-w-full text-sm text-left">
                          <thead className="bg-slate-100/50 text-slate-500 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10 border-b border-slate-200 backdrop-blur-md">
                            <tr>
                              <th className="py-3 px-5">
                                Data da Movimentação
                              </th>
                              <th className="py-3 px-5">
                                Medicamentos / Dosagem
                              </th>
                              <th className="py-3 px-5 text-center">Status</th>
                              <th className="py-3 px-5 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {patientRecords.map((record) => (
                              <tr
                                key={record._id || record.id}
                                className="hover:bg-slate-50/80 transition-colors group"
                              >
                                <td className="py-3 px-5 text-slate-600 font-medium">
                                  {new Date(
                                    record.entryDate
                                  ).toLocaleDateString('pt-BR')}
                                  <span className="block text-[11px] text-slate-400 mt-0.5">
                                    {new Date(
                                      record.entryDate
                                    ).toLocaleTimeString('pt-BR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </td>

                                <td className="py-3 px-5">
                                  <div className="flex flex-wrap gap-1.5">
                                    {Array.isArray(record.medications) ? (
                                      record.medications.map((m, i) => (
                                        <span
                                          key={i}
                                          className="flex items-center gap-1.5 px-2.5 py-1 bg-white text-slate-700 text-[11px] rounded-lg border border-slate-200 font-medium shadow-sm"
                                        >
                                          <span>
                                            {m.name ||
                                              getMedicationName(
                                                m.medicationId,
                                                medications
                                              )}
                                          </span>
                                          <span className="text-indigo-600 border-l border-slate-200 pl-1.5 font-black">
                                            {m.quantity} un.{' '}
                                            {m.dosage ? `(${m.dosage})` : ''}
                                          </span>
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-slate-400 italic text-xs">
                                        Sem itens
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="py-3 px-5 text-center">
                                  <StatusBadge status={record.status} />
                                </td>

                                <td className="py-3 px-5 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {/* BOTÃO DETALHES SEMPRE VISÍVEL */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDetalhesMovimentacao(record);
                                      }}
                                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-lg text-[11px] font-bold transition-all cursor-pointer border border-slate-200 active:scale-95"
                                    >
                                      Detalhes
                                    </button>

                                    {/* ATENDER E CANCELAR (Somente se Pendente) */}
                                    {record.status === 'Pendente' && (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setAttendingRecord(record);
                                          }}
                                          className="text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer active:scale-95 shadow-sm"
                                        >
                                          ATENDER
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setCancelingRecord(record);
                                          }}
                                          className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all cursor-pointer border border-transparent hover:border-red-100 active:scale-95"
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
                                      className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 transition-all cursor-pointer active:scale-95"
                                      title="Editar"
                                    >
                                      {icons.edit}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {patientRecords.length === 0 && (
                              <tr>
                                <td colSpan="4" className="py-16 text-center">
                                  <div className="text-4xl text-slate-200 mb-3">
                                    {icons.history}
                                  </div>
                                  <p className="text-slate-500 font-bold text-sm">
                                    Nenhum histórico encontrado.
                                  </p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* MODAL DETALHES DA MOVIMENTAÇÃO (Agora Inteligente p/ Cancelamentos e Fornecedores) */}
            {/* ========================================================= */}
            {detalhesMovimentacao && (
              <div
                className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in"
                onClick={() => setDetalhesMovimentacao(null)}
              >
                <div
                  className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col animate-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-black text-slate-800 text-lg flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                        {icons.check}
                      </div>
                      Ficha da Movimentação
                    </h3>
                    <button
                      onClick={() => setDetalhesMovimentacao(null)}
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* SE FOI CANCELADO, MOSTRA O MOTIVO EM VERMELHO */}
                    {detalhesMovimentacao.status === 'Cancelado' && (
                      <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3">
                        <span className="text-red-500 mt-0.5">
                          {icons.alert}
                        </span>
                        <div>
                          <p className="text-[10px] uppercase font-black text-red-700 tracking-wider">
                            Motivo do Cancelamento
                          </p>
                          <p className="text-sm font-medium text-red-900 italic mt-1">
                            "
                            {detalhesMovimentacao.cancelReason ||
                              'Nenhum motivo detalhado fornecido.'}
                            "
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2">
                          Status do Pedido
                        </span>
                        <StatusBadge status={detalhesMovimentacao.status} />
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                          Data de Criação
                        </span>
                        <span className="font-black text-slate-800 text-sm">
                          {new Date(
                            detalhesMovimentacao.entryDate ||
                              detalhesMovimentacao.createdAt
                          ).toLocaleString('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>

                      {/* FORNECEDOR INTELIGENTE */}
                      <div className="col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                          Origem / Fornecedor
                        </span>
                        <span className="font-bold text-slate-800 text-sm">
                          {detalhesMovimentacao.fornecedor ||
                            detalhesMovimentacao.supplier ||
                            detalhesMovimentacao.origin ||
                            'Dispensação Padrão (Estoque Local)'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] uppercase font-black text-slate-400 tracking-wider block mb-3 border-b border-slate-100 pb-2">
                        Medicamentos Requisitados
                      </span>
                      <ul className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-2">
                        {detalhesMovimentacao.medicamentos?.length > 0 ||
                        detalhesMovimentacao.medications?.length > 0 ? (
                          (
                            detalhesMovimentacao.medicamentos ||
                            detalhesMovimentacao.medications
                          ).map((med, idx) => (
                            <li
                              key={idx}
                              className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm"
                            >
                              <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                {med.nome ||
                                  med.name ||
                                  getMedicationName(
                                    med.medicationId,
                                    medications
                                  )}
                                {med.dosage && (
                                  <span className="text-slate-400 text-xs font-medium ml-1">
                                    ({med.dosage})
                                  </span>
                                )}
                              </span>
                              <span className="font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 text-xs">
                                {med.quantidade || med.quantity} un.
                              </span>
                            </li>
                          ))
                        ) : (
                          <li className="text-center text-slate-400 text-sm font-medium py-4">
                            Nenhum item encontrado.
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <button
                      onClick={() => setDetalhesMovimentacao(null)}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3.5 rounded-xl transition-all cursor-pointer shadow-md active:scale-95 text-sm"
                    >
                      FECHAR
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'historico':
        return (
          <div className="flex flex-col h-full w-full min-h-0 animate-in fade-in duration-300">
            {/* CABEÇALHO E FILTROS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200 shrink-0">
              <div>
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  Histórico de Entradas
                  {/* Indicador de Sincronização em Tempo Real (Requer variável isBackgroundSyncing no seu state) */}
                  {isBackgroundSyncing && (
                    <span className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase bg-indigo-50 text-indigo-500 px-2 py-1 rounded-md animate-pulse border border-indigo-100">
                      <FiRefreshCw className="animate-spin" size={10} />{' '}
                      Sincronizando
                    </span>
                  )}
                </h2>
                <p className="text-slate-500 text-sm mt-1 font-medium">
                  Acompanhe e gerencie todos os registros em tempo real.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-center w-full md:w-auto">
                <div className="relative w-full sm:w-auto">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por paciente ou CPF/SUS..."
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    className="pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 w-full sm:w-72 transition-all shadow-sm"
                  />
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto shadow-inner border border-slate-200/50 overflow-x-auto custom-scrollbar">
                  {[
                    'Todos',
                    'Pendente',
                    'Atendido',
                    'Cancelado',
                    '+30 dias',
                    ,
                  ].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`flex-1 sm:flex-none px-5 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        statusFilter === status
                          ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                <button
                  onClick={openSearchModal}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-200 active:scale-95"
                >
                  <FiPlus size={18} /> Novo Registro
                </button>
              </div>
            </div>

            {/* CONTAINER DA TABELA (Ocupa 100% do espaço restante) */}
            <div className="flex-1 min-h-0 relative bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col overflow-hidden">
              <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
                <table className="min-w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-500 font-black uppercase tracking-widest text-[10px] sticky top-0 z-10 border-b border-slate-200 shadow-sm backdrop-blur-md">
                    <tr>
                      <th className="py-4 px-6">Paciente</th>
                      <th className="py-4 px-4">Entrada</th>
                      <th className="py-4 px-4">Medicações (Qtd/Unid)</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentRecords.map((record) => (
                      <tr
                        key={record._id || record.id}
                        className="hover:bg-indigo-50/50 transition-colors group cursor-pointer border-b border-slate-50"
                      >
                        <td className="py-4 px-6">
                          <div className="font-black text-slate-800 text-base">
                            {record.patientName}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-700">
                            {new Date(record.entryDate).toLocaleDateString(
                              'pt-BR'
                            )}
                          </div>
                          <div className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                            <FiClock size={10} />
                            {new Date(record.entryDate).toLocaleTimeString(
                              'pt-BR',
                              { hour: '2-digit', minute: '2-digit' }
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(record.medications) &&
                            record.medications.length > 0 ? (
                              record.medications.map((m, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg shadow-sm"
                                >
                                  {m.name ||
                                    getMedicationName(
                                      m.medicationId,
                                      medications
                                    )}
                                  <span className="text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded font-black tracking-widest uppercase text-[9px]">
                                    {m.dosage ||
                                      `${m.quantity} `}
                                  </span>
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 italic text-xs font-medium">
                                Nenhuma informada
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <StatusBadge status={record.status} />
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-50 sm:group-hover:opacity-100 transition-opacity">
                            {record.status === 'Pendente' && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAttendingRecord(record);
                                  }}
                                  className="text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm shadow-emerald-200 px-4 py-2 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                                >
                                  ATENDER
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCancelingRecord(record);
                                  }}
                                  className="text-red-500 hover:bg-red-50 hover:text-red-600 p-2 rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-100"
                                  title="Cancelar"
                                >
                                  {icons.close || <FiX />}
                                </button>
                              </>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditRecordClick(record);
                              }}
                              className="text-slate-400 hover:text-indigo-600 p-2 rounded-xl hover:bg-indigo-50 transition-all cursor-pointer"
                              title="Editar"
                            >
                              {icons.edit || <FiEdit3 />}
                            </button>

                            {user?.role !== 'profissional' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmation({
                                    isOpen: true,
                                    title: 'Excluir Registro',
                                    message: `Deseja realmente excluir o registro de ${record.patientName}? Ação irreversível.`,
                                    onConfirm: () => {
                                      closeConfirmation();
                                      handleDeleteRecord(
                                        record._id || record.id
                                      );
                                    },
                                    isDestructive: true,
                                    confirmText: 'Excluir Definitivamente',
                                  });
                                }}
                                className="text-slate-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-all cursor-pointer"
                                title="Excluir Registro"
                              >
                                {icons.trash || <FiTrash2 />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredRecords.length === 0 && (
                  <div className="flex flex-col items-center justify-center p-20 text-center text-slate-400">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <FiSearch size={32} className="text-slate-300" />
                    </div>
                    <p className="text-xl font-black text-slate-700 tracking-tight">
                      Nenhum registro encontrado
                    </p>
                    <p className="text-sm font-medium mt-1 text-slate-500">
                      A sua busca ou filtro não retornou nenhum paciente para
                      esta lista.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* PAGINAÇÃO STICKY NO RODAPÉ */}
            {filteredRecords.length > 0 && (
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-200 shrink-0">
                <p className="text-sm font-bold text-slate-500">
                  Mostrando página{' '}
                  <span className="text-slate-800 font-black">
                    {currentPage}
                  </span>{' '}
                  de{' '}
                  <span className="text-slate-800 font-black">
                    {totalPages}
                  </span>
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-4 py-2 text-sm font-bold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-sm"
                  >
                    Anterior
                  </button>
                  <button
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-4 py-2 text-sm font-bold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-sm"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
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
          records = { records };
          setRecords = { setRecords };
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
          currentShipmentId={null} 
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
