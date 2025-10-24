// src/pages/ProfessionalDashboardPage.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// --- Imports (Verifique se os caminhos estão corretos para sua estrutura) ---
import { Modal, ConfirmModal } from '../components/common/Modal';
import PatientForm from '../components/forms/PatientForm';
import RecordForm from '../components/forms/RecordForm';
import MedicationForm from '../components/forms/MedicationForm';
import { StatusBadge } from '../components/common/StatusBadge';
import { AttendRecordModal } from '../components/common/AttendRecordModal';
import { RecentDeliveriesTab } from '../components/common/RecentDeliveriesTab';
import { PatientRecordsTable } from '../components/common/PatientRecordsTable';
import icons from '../utils/icons';
import { getMedicationName } from '../utils/helpers';
import {useDebounce} from '../hooks/useDebounce';

// --- Componente da Página ---
export default function ProfessionalDashboardPage({
    user,
    patients = [], setPatients,
    records = [], setRecords,
    medications = [], setMedications,
    addToast,
    addLog,
    activeTabForced
}) {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [confirmation, setConfirmation] = useState({ isOpen: false, message: '', data: null, onConfirm: null });
  const [attendingRecord, setAttendingRecord] = useState(null);

  // --- Estados do 'Select com Busca' ---
  const [quickAddPatientId, setQuickAddPatientId] = useState('');
  const [quickSearchTerm, setQuickSearchTerm] = useState('');
  const [isQuickSelectOpen, setIsQuickSelectOpen] = useState(false);
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const quickSelectRef = useRef(null);

  // --- Estado do Filtro de Histórico ---
  const [statusFilter, setStatusFilter] = useState('Todos'); // 'Todos', 'Pendente', 'Atendido', 'Cancelado'

  // --- Estados de Paginação ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // 20 itens por página

  // --- Debounce ---
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedQuickSearchTerm = useDebounce(quickSearchTerm, 300);

  useEffect(() => {
    setCurrentView(activeTabForced || 'dashboard');
  }, [activeTabForced]);

  // Effect para fechar o select customizado
  useEffect(() => {
    function handleClickOutside(event) {
      if (quickSelectRef.current && !quickSelectRef.current.contains(event.target)) {
        setIsQuickSelectOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [quickSelectRef]);

  // Effect para Paginação
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);


  // --- Função de Validação de Duplicidade ---
  const checkDuplicatePatient = ({ cpf, susCard, currentId }) => {
    console.log(`[Dashboard] checkDuplicatePatient INICIADO. CPF: ${cpf}, SUS: ${susCard}, Ignorando ID: ${currentId}`);
    const isDuplicate = Array.isArray(patients) && patients.some(patient => {
      if (patient.id === currentId) return false;
      const patientCPF = String(patient.cpf || '').replace(/\D/g, '');
      const cpfIsMatch = cpf && patientCPF && cpf === patientCPF;
      const patientSusCard = String(patient.susCard || '').replace(/\D/g, '');
      const susIsMatch = susCard && patientSusCard && susCard === patientSusCard;
      if (cpfIsMatch || susIsMatch) {
          console.log(`[Dashboard] DUPLICADO ENCONTRADO! Comparando com Paciente ID: ${patient.id} (${patient.name}). CPF Match: ${cpfIsMatch}, SUS Match: ${susIsMatch}`);
          return true;
      }
      return false;
    });
    console.log(`[Dashboard] checkDuplicatePatient FINALIZADO. Retornando: ${isDuplicate}`);
    return isDuplicate;
  };

  // --- Funções Helper ---
  const closeConfirmation = () => setConfirmation({ isOpen: false, message: '', data: null, onConfirm: null });
  const getPatientNameById = (patientId) => Array.isArray(patients) ? (patients.find(p => p.id === patientId)?.name || 'Desconhecido') : 'Desconhecido';

  // --- Memos ---
  const filteredPatients = useMemo(() =>
    Array.isArray(patients) ? patients.filter(p =>
      p.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      (p.cpf && String(p.cpf).includes(debouncedSearchTerm)) ||
      (p.susCard && String(p.susCard).includes(debouncedSearchTerm))
    ).sort((a, b) => a.name?.localeCompare(b.name || '') || 0) : [],
    [patients, debouncedSearchTerm]
  );

  const patientRecords = useMemo(() => {
    if (!selectedPatient?.id || !Array.isArray(records)) return [];
    return records.filter(r => r.patientId === selectedPatient.id).sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));
  }, [records, selectedPatient]);

  const pendingRecords = useMemo(() =>
    Array.isArray(records) ? records.filter(r => r.status === 'Pendente').sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate)) : [],
  [records]);

  const quickFilteredPatients = useMemo(() =>
    Array.isArray(patients) ? patients
      .filter(p => p.name?.toLowerCase().includes(debouncedQuickSearchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name))
    : [],
  [patients, debouncedQuickSearchTerm]
  );

  const filteredRecords = useMemo(() => {
    const sorted = records.sort((a,b) => new Date(b.entryDate) - new Date(a.entryDate));
    if (statusFilter === 'Todos') {
      return sorted;
    }
    return sorted.filter(r => r.status === statusFilter);
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

  // --- NOVO MEMO (Filtro de 1 Semana para Entregas) ---
  const recentDeliveries = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0); // Começo do dia, 7 dias atrás

    return Array.isArray(records) ? records
      .filter(r =>
        r.status === 'Atendido' &&
        r.deliveryDate && // Garante que a data existe
        new Date(r.deliveryDate + 'T00:00:00') >= oneWeekAgo // Compara datas (adiciona hora para evitar problemas de fuso)
      )
      .sort((a, b) => new Date(b.deliveryDate) - new Date(a.deliveryDate)) // Ordena pela data de entrega, mais recente primeiro
    : [];
  }, [records]);


  // --- Funções CRUD ---
  const handleSavePatient = (patientData) => {
    console.log("[Dashboard] handleSavePatient CHAMADO com:", patientData);
    let message = '';
    if (patientData.id) {
      setPatients(prev => Array.isArray(prev) ? prev.map(p => p.id === patientData.id ? { ...p, ...patientData } : p) : [patientData]);
      message = 'Paciente atualizado com sucesso!';
      addLog?.(user?.name, `atualizou dados do paciente ${patientData.name}`);
    } else {
      const newPatient = { ...patientData, id: Date.now(), createdAt: new Date().toISOString().slice(0, 10), status: 'Ativo' };
       setPatients(prev => Array.isArray(prev) ? [...prev, newPatient].sort((a, b) => a.name.localeCompare(b.name)) : [newPatient]);
      message = 'Paciente cadastrado com sucesso!';
      addLog?.(user?.name, `cadastrou novo paciente ${newPatient.name}`);
    }
    addToast(message, 'success');
    setIsPatientModalOpen(false);
    setEditingPatient(null);
  };
  const handleDeletePatient = (patientId) => {
    const patient = Array.isArray(patients) ? patients.find(p => p.id === patientId) : null;
    setPatients(prev => Array.isArray(prev) ? prev.filter(p => p.id !== patientId) : []);
    if(selectedPatient?.id === patientId) setSelectedPatient(null);
    addToast('Paciente excluído!', 'success');
    addLog?.(user?.name, `excluiu o paciente ${patient?.name}`);
  };
  const handleDeleteRecord = (recordId) => {
    const record = Array.isArray(records) ? records.find(r => r.id === recordId) : null;
    setRecords(prev => Array.isArray(prev) ? prev.filter(r => r.id !== recordId) : []);
    addToast('Registro excluído!', 'success');
    addLog?.(user?.name, `excluiu registro de ${getPatientNameById(record?.patientId)}`);
  };
  const handleSaveRecord = (recordData) => {
    let message = '';
    const patientName = getPatientNameById(recordData.patientId);
    if (recordData.id) {
        setRecords(prev => Array.isArray(prev) ? prev.map(r => r.id === recordData.id ? { ...r, ...recordData } : r) : [recordData]);
        message = 'Registro atualizado!';
        addLog?.(user?.name, `atualizou registro para ${patientName}`);
    } else {
        const newRecord = { ...recordData, id: Date.now(), entryDate: new Date().toISOString() };
        setRecords(prev => Array.isArray(prev) ? [...prev, newRecord] : [newRecord]);
        message = 'Registro salvo!';
        addLog?.(user?.name, `criou registro para ${patientName}`);
    }
    addToast(message, 'success');
    setIsRecordModalOpen(false);
    setEditingRecord(null);
    
    setQuickAddPatientId('');
    setSelectedPatientName('');
    setQuickSearchTerm('');
  };
  const handleAddNewMedication = (medData) => {
      const newMed = { id: Date.now(), name: medData.name, createdAt: new Date().toISOString().slice(0, 10) };
      setMedications(prev => Array.isArray(prev) ? [...prev, newMed].sort((a,b)=> a.name.localeCompare(b.name)) : [newMed]);
      addToast('Medicação cadastrada!', 'success');
      addLog?.(user?.name, `cadastrou medicação: ${newMed.name}`);
      return newMed;
  };
  const handleUpdateRecordStatus = (recordId, deliveryDateStr) => {
    if (!deliveryDateStr) { addToast('Selecione uma data.', 'error'); return; }
    setRecords(prev => Array.isArray(prev) ? prev.map(r => r.id === recordId ? { ...r, status: 'Atendido', deliveryDate: deliveryDateStr } : r ) : []);
    addToast('Registro Atendido!', 'success');
    addLog?.(user?.name, `marcou registro (ID: ${recordId}) como Atendido`);
    setAttendingRecord(null);
  };
  const handleCancelRecordStatus = (recordId) => {
    setRecords(prev => Array.isArray(prev) ? prev.map(r => r.id === recordId ? { ...r, status: 'Cancelado', deliveryDate: null } : r ) : []);
    addToast('Registro Cancelado.', 'info');
    addLog?.(user?.name, `marcou registro (ID: ${recordId}) como Cancelado`);
  };
  
  // --- Funções UI ---
  const handleViewPatientHistory = (patientId) => {
      const patient = Array.isArray(patients) ? patients.find(p => p.id === patientId) : null;
      if(patient) {
          setSelectedPatient(patient);
          setCurrentView('patients');
      }
  };
  const handleQuickAddRecord = (e, patient) => {
      e.stopPropagation();
      setSelectedPatient(patient);
      setEditingRecord(null);
      setIsRecordModalOpen(true);
  };
  const openQuickAddModal = () => {
    if(quickAddPatientId) {
        const patient = Array.isArray(patients) ? patients.find(p => p.id === parseInt(quickAddPatientId)) : null;
        if(patient) {
            setSelectedPatient(patient);
            setEditingRecord(null);
            setIsRecordModalOpen(true);
        } else { addToast('Paciente não encontrado.', 'error'); }
    } else { addToast('Selecione um paciente.', 'error'); }
  };

  // --- Renderização Condicional ---
  const renderCurrentView = () => {
    switch(currentView) {
      // VISÃO: DASHBOARD
      case 'dashboard':
          return (
             <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard Profissional</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Card Pendentes */}
                    <div className="bg-white p-4 md:p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                        <h3 className="text-lg font-semibold text-gray-700">Entradas Pendentes</h3>
                        <p className="text-3xl font-bold mt-2 text-yellow-600">{pendingRecords.length}</p>
                        <button onClick={() => setCurrentView('historico')} className="text-sm text-blue-600 hover:underline mt-2">Ver Entradas</button>
                    </div>
                    {/* Card Pacientes */}
                    <div className="bg-white p-4 md:p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                        <h3 className="text-lg font-semibold text-gray-700">Total de Pacientes</h3>
                        <p className="text-3xl font-bold mt-2 text-blue-600">{patients.length}</p>
                        <button onClick={() => setCurrentView('patients')} className="text-sm text-blue-600 hover:underline mt-2">Gerenciar Pacientes</button>
                    </div>
                    {/* Ações Rápidas */}
                    <div className="bg-white p-4 md:p-6 rounded-lg shadow flex flex-col justify-center items-center gap-3">
                         <button onClick={() => { setEditingPatient(null); setIsPatientModalOpen(true); }} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                           <span className="w-4 h-4">{icons.plus}</span> Novo Paciente
                         </button>
                         <button onClick={() => setCurrentView('historico')} className="w-full px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">Ver Histórico Geral</button>
                    </div>
                </div>
             </div>
          );
      // VISÃO: PACIENTES
      case 'patients':
        return (
          // --- Altura aumentada ---
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)] animate-fade-in">
            
            <div className="lg:col-span-1 bg-white rounded-lg shadow p-4 flex flex-col min-h-0">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Pacientes</h2>
                <div className="relative mb-4">
                  <input type="text" placeholder="Buscar por nome, CPF ou SUS..." className="w-full p-2 pl-10 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                  />
                  <div className="absolute left-3 top-2.5 text-gray-400 w-4 h-4">{icons.search}</div>
                </div>
                <button onClick={() => { setEditingPatient(null); setIsPatientModalOpen(true); }} className="w-full flex items-center justify-center gap-2 mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  <span className="w-4 h-4">{icons.plus}</span> Novo Paciente
                </button>
                
                <div className="flex-grow min-h-0 overflow-y-auto pr-2 -mr-2">
                  
                  {patients.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 px-4">
                      <div className="mb-4 text-gray-300 w-16 h-16 mx-auto">{icons.users}</div>
                      <h3 className="font-semibold text-lg mb-1">Sem pacientes</h3>
                      <p className="text-sm mb-4">Parece que você ainda não cadastrou nenhum paciente.</p>
                      <button 
                        onClick={() => { setEditingPatient(null); setIsPatientModalOpen(true); }} 
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        Cadastrar primeiro paciente
                      </button>
                    </div>
                  ) : filteredPatients.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 px-4">
                      <div className="mb-4 text-gray-300 w-16 h-16 mx-auto">{icons.search}</div>
                      <h3 className="font-semibold text-lg mb-1">Nenhum resultado</h3>
                      <p className="text-sm">Não encontramos pacientes para a busca <strong className="text-gray-700">"{debouncedSearchTerm}"</strong>.</p>
                    </div>
                  ) : (
                    filteredPatients.map(patient => (
                      <div key={patient.id}
                           className={`p-3 rounded-lg cursor-pointer mb-2 border ${selectedPatient?.id === patient.id ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-50 border-transparent hover:border-gray-200'}`}
                           onClick={() => setSelectedPatient(patient)} role="button" tabIndex={0}
                           onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedPatient(patient)} >
                        <div className="flex justify-between items-center">
                            <p className="font-semibold text-gray-800 text-sm truncate">{patient.name}</p>
                             <div className="flex items-center gap-2 flex-shrink-0">
                              <StatusBadge status={patient.status} />
                              <button onClick={(e) => handleQuickAddRecord(e, patient)} title="Novo Registro Rápido" className="text-gray-400 hover:text-blue-600 p-0.5">
                                  <span className="w-4 h-4 block">{icons.plus}</span>
                              </button>
                             </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{patient.cpf || patient.susCard || 'Sem documento'}</p>
                      </div>
                    ))
                  )}
                </div>
            </div>
            
            <div className="lg:col-span-2 bg-white rounded-lg shadow p-4 md:p-6 flex flex-col min-h-0">
              {selectedPatient ? (
                <>
                  <div className="flex justify-between items-start mb-4 pb-4 border-b">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-800">{selectedPatient?.name || 'Nome Indisponível'}</h2>
                      <p className="text-sm text-gray-500 mt-1">CPF: {selectedPatient?.cpf || 'Não informado'}</p>
                      <p className="text-sm text-gray-500">SUS: {selectedPatient?.susCard || 'Não informado'}</p>
                      <p className="mt-2 text-sm"><strong>Observações:</strong> {selectedPatient?.observations || 'Nenhuma'}</p>
                      <p className="mt-1 text-sm"><strong>Anotações Gerais:</strong> {selectedPatient?.generalNotes || 'Nenhuma'}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => { setEditingPatient(selectedPatient); setIsPatientModalOpen(true); }} className="p-2 text-gray-600 hover:text-blue-600" title="Editar Paciente"><span className="w-4 h-4 block">{icons.edit}</span></button>
                      <button onClick={() => setConfirmation({ isOpen: true, message: `Excluir ${selectedPatient?.name}?`, onConfirm: () => handleDeletePatient(selectedPatient.id) })} className="p-2 text-gray-600 hover:text-red-600" title="Excluir Paciente"><span className="w-4 h-4 block">{icons.trash}</span></button>
                    </div>
                  </div>
                   <div className="flex justify-between items-center mt-2 mb-3">
                      <h3 className="text-lg font-semibold text-gray-700">Histórico de Registros</h3>
                      <button onClick={() => { setEditingRecord(null); setIsRecordModalOpen(true); }} className="flex items-center gap-1.5 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium"><span className="w-3 h-3">{icons.plus}</span> Novo Registro</button>
                    </div>
                       
                        <div className="flex-grow min-h-0 overflow-y-auto -mx-4 md:-mx-6 px-4 md:px-6">
                          <PatientRecordsTable records={Array.isArray(patientRecords) ? patientRecords : []} medications={medications} />
                       </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                  <div className="mb-4 text-gray-300 w-16 h-16">{icons.users}</div>
                  <h2 className="text-xl font-semibold">Selecione um Paciente</h2>
                  <p className="text-sm">Escolha um paciente na lista para ver seus detalhes.</p>
                </div>
              )}
            </div>
          </div>
        );
      // VISÃO: HISTÓRICO
      case 'historico':
        return (
           // --- Altura aumentada ---
           <div className="bg-white rounded-lg shadow p-4 md:p-6 animate-fade-in flex flex-col h-[calc(100vh-8rem)]">
             <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800">Histórico Geral de Entradas</h2>
               
               {/* --- Bloco 'Adicionar Rápido' (sem scroll) --- */}
               <div className="bg-gray-50 p-4 rounded-lg mb-4 border">
                 <h4 className="font-semibold mb-2 text-gray-700">Adicionar Novo Registro Rápido</h4>
                 
                 <div className="flex flex-col sm:flex-row items-center gap-3" ref={quickSelectRef}>
                   
                   <div className="relative flex-grow w-full sm:w-auto">
                     <button
                       type="button"
                       onClick={() => setIsQuickSelectOpen(prev => !prev)}
                       className="w-full p-2 pl-3 pr-10 border rounded-lg text-sm bg-white text-left flex justify-between items-center"
                     >
                       <span className={quickAddPatientId ? 'text-gray-900' : 'text-gray-500'}>
                         {selectedPatientName || "Selecione um paciente..."}
                       </span>
                       <span className="absolute right-3 top-2.5 text-gray-400 text-xs">&#9660;</span>
                     </button>

                     {isQuickSelectOpen && (
                       <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-60 flex flex-col">
                         
                         <div className="p-2 border-b sticky top-0 bg-white">
                           <input
                             type="text"
                             placeholder="Buscar paciente..."
                             className="w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                             value={quickSearchTerm} 
                             onChange={e => setQuickSearchTerm(e.target.value)} 
                             autoFocus
                           />
                         </div>

                         <div className="overflow-y-auto">
                           <div
                             className="p-2 text-sm text-gray-500 hover:bg-blue-100 cursor-pointer"
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
                             quickFilteredPatients.map(p => (
                               <div
                                 key={p.id}
                                 className="p-2 text-sm hover:bg-blue-100 cursor-pointer"
                                 onClick={() => {
                                   setQuickAddPatientId(String(p.id));
                                   setSelectedPatientName(p.name);
                                   setIsQuickSelectOpen(false);
                                   setQuickSearchTerm('');
                                 }}
                               >
                                 {p.name}
                               </div>
                             ))
                           ) : (
                             <p className="p-2 text-sm text-gray-500 text-center">Nenhum paciente encontrado.</p>
                           )}
                         </div>
                       </div>
                     )}
                   </div>
                   
                   <button onClick={openQuickAddModal} disabled={!quickAddPatientId} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 w-full sm:w-auto text-sm font-medium">
                       <span className="inline-block mr-1">+</span> Adicionar
                   </button>
                 </div>
               </div>
               {/* --- Fim do Bloco 'Adicionar Rápido' --- */}


              {/* --- Bloco 'Filtros de Status' (sem scroll) --- */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-sm font-semibold">Filtrar por Status:</span>
                {['Todos', 'Pendente', 'Atendido', 'Cancelado'].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 text-xs rounded-full ${
                      statusFilter === status
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              {/* --- Fim dos Filtros --- */}

             {/* --- Container da Tabela (com scroll) --- */}
             <div className="overflow-x-auto overflow-y-auto flex-grow min-h-0">
                 <table className="min-w-full bg-white text-sm">
                     <thead className="bg-gray-100 sticky top-0">
                         <tr>
                             <th className="text-left py-2 px-3 font-semibold text-gray-600">Paciente</th>
                             <th className="text-left py-2 px-3 font-semibold text-gray-600">Entrada</th>
                             <th className="text-left py-2 px-3 font-semibold text-gray-600">Medicações</th>
                             <th className="text-left py-2 px-3 font-semibold text-gray-600">Status</th>
                             <th className="text-left py-2 px-3 font-semibold text-gray-600">Ações</th>
                         </tr>
                     </thead>
                     <tbody>
                         {/* Mapeia 'currentRecords' (itens da página atual) */}
                         {currentRecords.map(record => (
                             <tr key={record.id} className="border-b hover:bg-gray-50">
                                 <td className="py-2 px-3 font-medium">
                                     <button onClick={() => handleViewPatientHistory(record.patientId)} className="text-blue-600 hover:underline text-left">{getPatientNameById(record.patientId)}</button>
                                 </td>
                                 <td className="py-2 px-3 text-gray-700">{new Date(record.entryDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short'})}</td>
                                 <td className="py-2 px-3 text-gray-700">{Array.isArray(record.medications) ? record.medications.map(m => `${getMedicationName(m.medicationId, medications)} (${m.quantity || 'N/A'})`).join(', ') : 'N/A'}</td>
                                 <td className="py-2 px-3"><StatusBadge status={record.status} /></td>
                                 <td className="py-2 px-3">
                                   <div className="flex items-center gap-2 flex-wrap">
                                     {record.status === 'Pendente' && (
                                         <>
                                             <button onClick={() => setAttendingRecord(record)} className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 font-medium">Atendido</button>
                                             <button onClick={() => setConfirmation({ isOpen: true, message: 'Cancelar registro?', onConfirm: () => handleCancelRecordStatus(record.id)})} className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 font-medium">Cancelar</button>
                                         </>
                                     )}
                                      <button onClick={() => {
                                         const patientForRecord = Array.isArray(patients) ? patients.find(p => p.id === record.patientId) : null;
                                         if(patientForRecord) {
                                           setSelectedPatient(patientForRecord);
                                           setEditingRecord(record);
                                           setIsRecordModalOpen(true);
                                         }
                                      }} className="p-1 text-gray-500 hover:text-blue-600" title="Editar"><span className="w-4 h-4 block">{icons.edit}</span></button>
                                     <button onClick={() => setConfirmation({ isOpen: true, message: 'Excluir registro?', onConfirm: () => handleDeleteRecord(record.id)})} className="p-1 text-gray-500 hover:text-red-600" title="Excluir"><span className="w-4 h-4 block">{icons.trash}</span></button>
                                   </div>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
                 
                 {/* Mensagem de 'vazio' */}
                 {filteredRecords.length === 0 && (
                    <p className="text-center text-gray-500 py-6">
                      {statusFilter === 'Todos' ? 'Nenhuma entrada registrada.' : `Nenhuma entrada com status '${statusFilter}'.`}
                    </p>
                 )}
             </div>
             {/* Fim do Container da Tabela */}

             {/* Controles de Paginação (sem scroll) */}
             {filteredRecords.length > itemsPerPage && ( 
                <div className="flex justify-between items-center pt-4 border-t mt-auto">
                  <span className="text-sm text-gray-700">
                    Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, filteredRecords.length)} 
                    {' a '} 
                    {Math.min(currentPage * itemsPerPage, filteredRecords.length)} 
                    {' de '} 
                    {filteredRecords.length} registros
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="text-sm font-medium">
                      Página {currentPage} de {totalPages > 0 ? totalPages : 1}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
          // --- ATUALIZAÇÃO: Adicionado container com altura e scroll ---
          <div className="bg-white rounded-lg shadow p-4 md:p-6 animate-fade-in flex flex-col h-[calc(100vh-8rem)]">
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800">Entregas da Última Semana</h2>
            {/* O componente RecentDeliveriesTab agora rola internamente se precisar */}
            <div className="flex-grow min-h-0 overflow-y-auto">
              {/* --- ATUALIZAÇÃO: Passando 'recentDeliveries' filtrado --- */}
              <RecentDeliveriesTab 
                records={recentDeliveries} 
                patients={Array.isArray(patients) ? patients : []} 
                medications={Array.isArray(medications) ? medications : []} 
              />
              {/* Mensagem se não houver entregas recentes */}
              {recentDeliveries.length === 0 && (
                 <p className="text-center text-gray-500 py-10">Nenhuma entrega registrada na última semana.</p>
              )}
            </div>
          </div>
        );
      default:
        return (<div className="text-center p-10">View desconhecida: {currentView}</div>);
    }
  };

  return (
    <>
      {renderCurrentView()}
      
      {/* --- Modais --- */}
      {isPatientModalOpen && (
        <PatientForm
            patient={editingPatient}
            onSave={handleSavePatient}
            onClose={() => { setIsPatientModalOpen(false); setEditingPatient(null); }}
            checkDuplicate={checkDuplicatePatient}
        />
      )}
      {isRecordModalOpen && selectedPatient?.id && (
        <RecordForm
            patient={selectedPatient}
            professionalId={user?.id}
            record={editingRecord}
            onSave={handleSaveRecord}
            onClose={() => { setIsRecordModalOpen(false); setEditingRecord(null); }}
            medicationsList={Array.isArray(medications) ? medications : []}
            onNewMedication={handleAddNewMedication}
        />
      )}
      {confirmation.isOpen && (
        <ConfirmModal
            message={confirmation.message}
            onConfirm={() => { confirmation.onConfirm(confirmation.data); closeConfirmation(); }}
            onClose={closeConfirmation}
        />
      )}
       {attendingRecord && (
         <AttendRecordModal
            record={attendingRecord}
            onConfirm={handleUpdateRecordStatus}
            onClose={() => setAttendingRecord(null)}
            getPatientName={getPatientNameById}
         />
       )}
    </>
  );
}