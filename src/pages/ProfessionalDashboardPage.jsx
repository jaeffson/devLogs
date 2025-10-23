// src/pages/ProfessionalDashboardPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
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
  const [quickAddPatientId, setQuickAddPatientId] = useState('');
  const [attendingRecord, setAttendingRecord] = useState(null);

  useEffect(() => {
    setCurrentView(activeTabForced || 'dashboard');
  }, [activeTabForced]);

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
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.cpf && String(p.cpf).includes(searchTerm)) ||
      (p.susCard && String(p.susCard).includes(searchTerm))
    ).sort((a, b) => a.name?.localeCompare(b.name || '') || 0) : [],
    [patients, searchTerm]);

  const patientRecords = useMemo(() => {
    if (!selectedPatient?.id || !Array.isArray(records)) return [];
    return records.filter(r => r.patientId === selectedPatient.id).sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));
  }, [records, selectedPatient]);

  const pendingRecords = useMemo(() =>
    Array.isArray(records) ? records.filter(r => r.status === 'Pendente').sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate)) : [],
  [records]);

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
      // VISÃO: DASHBOARD (Código completo)
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
                {/* Você pode adicionar mais seções ao dashboard aqui */}
             </div>
          );
      // VISÃO: PACIENTES (Código completo)
      case 'patients':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-10rem)] animate-fade-in">
            {/* Coluna da Lista */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow p-4 flex flex-col">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Pacientes</h2>
                <div className="relative mb-4">
                  <input type="text" placeholder="Buscar por nome, CPF ou SUS..." className="w-full p-2 pl-10 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  <div className="absolute left-3 top-2.5 text-gray-400 w-4 h-4">{icons.search}</div>
                </div>
                <button onClick={() => { setEditingPatient(null); setIsPatientModalOpen(true); }} className="w-full flex items-center justify-center gap-2 mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  <span className="w-4 h-4">{icons.plus}</span> Novo Paciente
                </button>
                <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                  {filteredPatients.length > 0 ? filteredPatients.map(patient => (
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
                  )) : ( <p className="text-center text-gray-500 py-4 text-sm">Nenhum paciente encontrado.</p> )}
                </div>
            </div>
            {/* Coluna de Detalhes */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow p-4 md:p-6 flex flex-col">
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
                     <div className="flex-grow overflow-y-auto -mx-4 md:-mx-6 px-4 md:px-6">
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
      // VISÃO: HISTÓRICO (Código completo)
      case 'historico':
        return (
           <div className="bg-white rounded-lg shadow p-4 md:p-6 animate-fade-in">
             <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800">Histórico Geral de Entradas</h2>
               <div className="bg-gray-50 p-4 rounded-lg mb-4 border">
                 <h4 className="font-semibold mb-2 text-gray-700">Adicionar Novo Registro Rápido</h4>
                 <div className="flex flex-col sm:flex-row items-center gap-3">
                   <select onChange={(e) => setQuickAddPatientId(e.target.value)} value={quickAddPatientId} className="flex-grow p-2 border rounded-lg w-full sm:w-auto text-sm bg-white">
                       <option value="">Selecione um paciente...</option>
                       {patients.sort((a,b) => a.name.localeCompare(b.name)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                   </select>
                   <button onClick={openQuickAddModal} disabled={!quickAddPatientId} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 w-full sm:w-auto text-sm font-medium">
                       <span className="inline-block mr-1">+</span> Adicionar
                   </button>
                 </div>
               </div>
             <div className="overflow-x-auto">
                 <table className="min-w-full bg-white text-sm">
                     <thead className="bg-gray-100">
                         <tr>
                             <th className="text-left py-2 px-3 font-semibold text-gray-600">Paciente</th>
                             <th className="text-left py-2 px-3 font-semibold text-gray-600">Entrada</th>
                             <th className="text-left py-2 px-3 font-semibold text-gray-600">Medicações</th>
                             <th className="text-left py-2 px-3 font-semibold text-gray-600">Status</th>
                             <th className="text-left py-2 px-3 font-semibold text-gray-600">Ações</th>
                         </tr>
                     </thead>
                     <tbody>
                         {records.sort((a,b) => new Date(b.entryDate) - new Date(a.entryDate)).map(record => (
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
                 {records.length === 0 && <p className="text-center text-gray-500 py-6">Nenhuma entrada registrada.</p>}
             </div>
         </div>
        );
      // VISÃO: ENTREGAS (Código completo)
      case 'deliveries':
        return <RecentDeliveriesTab records={Array.isArray(records) ? records : []} patients={Array.isArray(patients) ? patients : []} medications={Array.isArray(medications) ? medications : []} />;
      default:
        return (<div className="text-center p-10">View desconhecida: {currentView}</div>);
    }
  };

  return (
    <>
      {renderCurrentView()}
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
            onConfirm={() => confirmation.onConfirm(confirmation.data)}
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

