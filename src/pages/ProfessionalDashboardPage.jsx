// src/pages/ProfessionalDashboardPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Para navegação

// --- Imports de Componentes ---
import { Modal, ConfirmModal } from '../components/common/Modal'; // Ajuste o caminho se Modal.jsx estiver em outra subpasta
import PatientForm from '../components/forms/PatientForm';
import RecordForm from '../components/forms/RecordForm';
import MedicationForm from '../components/forms/MedicationForm'; // Necessário para o RecordForm
import { StatusBadge } from '../components/common/StatusBadge';
import AttendRecordModal  from '../components/common/AttendRecordModal';
import { RecentDeliveriesTab } from '../components/common/RecentDeliveriesTab'; // Importa a tab de entregas
import icons from '../utils/icons'
import { getMedicationName } from '../utils/helpers'; // Importa da pasta utils

// --- Componente da Página ---
// Recebe props do App.jsx (passadas pelo Outlet ou diretamente na Rota)
// activeTabForced é uma prop especial que passamos na definição da Rota no App.jsx
export default  function ProfessionalDashboardPage({
    user,
    patients = [], setPatients, // Adiciona valores padrão
    records = [], setRecords,
    medications = [], setMedications,
    addToast,
    addLog, // Recebe addLog se precisar registrar ações específicas daqui
    activeTabForced // Indica qual visão mostrar (ex: 'patients', 'historico')
}) {
  const navigate = useNavigate(); // Hook para navegação programática

  // --- Estados Internos da Página ---
  const [currentView, setCurrentView] = useState('dashboard'); // Estado local para a visão ativa
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [confirmation, setConfirmation] = useState({ isOpen: false, message: '', onConfirm: null });
  const [quickAddPatientId, setQuickAddPatientId] = useState(''); // Para o select de adição rápida
  const [attendingRecord, setAttendingRecord] = useState(null); // Para o modal de confirmar atendimento

  // --- Efeito para atualizar a visão baseado na prop da Rota ---
  // Isso permite que links externos (ou o App.jsx) definam qual parte mostrar
  useEffect(() => {
    if (activeTabForced) {
      setCurrentView(activeTabForced);
    } else {
        setCurrentView('dashboard'); // Padrão se nenhuma forçada
    }
  }, [activeTabForced]);

  // --- Funções Helper Internas ---
  const closeConfirmation = () => setConfirmation({ isOpen: false, message: '', onConfirm: null });

  // Pega o nome do paciente (pode vir de utils se usada em mais lugares)
  const getPatientNameById = (patientId) => {
    const patient = patients.find(p => p.id === patientId);
    return patient?.name || 'Desconhecido';
  };

  // --- Memos para dados derivados ---
  const filteredPatients = useMemo(() =>
    patients.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.cpf && String(p.cpf).includes(searchTerm)) || // Garante que cpf é string
      (p.susCard && String(p.susCard).includes(searchTerm)) // Garante que susCard é string
    ).sort((a, b) => a.name.localeCompare(b.name)), // Ordena por nome
    [patients, searchTerm]);

  const patientRecords = useMemo(() => {
    if (!selectedPatient) return [];
    return records
      .filter(r => r.patientId === selectedPatient.id)
      .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate)); // Mais recentes primeiro
  }, [records, selectedPatient]);

  const pendingRecords = useMemo(() =>
    records.filter(r => r.status === 'Pendente')
           .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate)),
  [records]);

  // --- Funções de Manipulação de Dados (CRUD) ---
  // Usam as funções (setPatients, etc.) recebidas via props
  const handleSavePatient = (patientData) => {
    let message = '';
    if (patientData.id) {
      setPatients(prev => prev.map(p => p.id === patientData.id ? { ...p, ...patientData } : p)); // Atualiza
      message = 'Paciente atualizado com sucesso!';
      addLog?.(user?.name, `atualizou dados do paciente ${patientData.name} (ID: ${patientData.id})`);
    } else {
      const newPatient = { ...patientData, id: Date.now(), createdAt: new Date().toISOString().slice(0, 10), status: 'Ativo' }; // ID temporário
      setPatients(prev => [...prev, newPatient].sort((a, b) => a.name.localeCompare(b.name))); // Adiciona e re-ordena
      message = 'Paciente cadastrado com sucesso!';
      addLog?.(user?.name, `cadastrou novo paciente ${newPatient.name}`);
    }
    addToast(message, 'success');
    setIsPatientModalOpen(false);
    setEditingPatient(null);
  };

  const handleDeletePatient = (patientId) => {
    const patientToDelete = patients.find(p => p.id === patientId);
    // Idealmente, verificar se há registros associados antes de excluir ou usar exclusão lógica
    setPatients(prev => prev.filter(p => p.id !== patientId));
    // Opcional: Remover registros associados (CUIDADO!)
    // setRecords(prev => prev.filter(r => r.patientId !== patientId));
    if(selectedPatient && selectedPatient.id === patientId) {
      setSelectedPatient(null); // Desseleciona se o paciente atual foi excluído
    }
    addToast('Paciente excluído com sucesso!', 'success');
    addLog?.(user?.name, `excluiu paciente ${patientToDelete?.name || ''} (ID: ${patientId})`);
  };

  const handleDeleteRecord = (recordId) => {
    const recordToDelete = records.find(r => r.id === recordId);
    setRecords(prev => prev.filter(r => r.id !== recordId));
    addToast('Registro excluído com sucesso!', 'success');
    addLog?.(user?.name, `excluiu registro (ID: ${recordId}) do paciente ${getPatientNameById(recordToDelete?.patientId)}`);
  };

  const handleSaveRecord = (recordData) => {
    let message = '';
    const patientName = getPatientNameById(recordData.patientId);
    if (recordData.id) {
        setRecords(prev => prev.map(r => r.id === recordData.id ? { ...r, ...recordData } : r));
        message = 'Registro atualizado com sucesso!';
        addLog?.(user?.name, `atualizou registro (ID: ${recordData.id}) para ${patientName}`);
    } else {
        const newRecord = { ...recordData, id: Date.now(), entryDate: new Date().toISOString() }; // ID e data de entrada
        setRecords(prev => [...prev, newRecord]);
        message = 'Registro salvo com sucesso!';
        addLog?.(user?.name, `criou novo registro para ${patientName}`);
    }
    addToast(message, 'success');
    setIsRecordModalOpen(false);
    setEditingRecord(null);
    setQuickAddPatientId(''); // Limpa select de adição rápida
    // setSelectedPatient(null); // Não deseleciona para continuar vendo o histórico
  };

  // Função para adicionar nova medicação (chamada pelo RecordForm)
  const handleAddNewMedication = (medData) => {
      const newMed = {
          id: Date.now(), // ID temporário
          name: medData.name,
          createdAt: new Date().toISOString().slice(0, 10)
      };
      setMedications(prev => [...prev, newMed].sort((a,b)=> a.name.localeCompare(b.name))); // Adiciona e ordena
      addToast('Medicação cadastrada com sucesso!', 'success');
      addLog?.(user?.name, `cadastrou nova medicação: ${newMed.name}`);
      return newMed; // Retorna a nova medicação para o RecordForm selecionar
  };

  // --- Funções de Mudança de Status ---
  const handleUpdateRecordStatus = (recordId, deliveryDateStr) => {
    // Validação da data
    if (!deliveryDateStr) {
      addToast('Por favor, selecione uma data de entrega.', 'error');
      return;
    }
    // Converte a string 'YYYY-MM-DD' para um objeto Date e depois para ISO String (idealmente com hora UTC)
    // Para simplicidade, vamos armazenar como string por enquanto, mas ISO é melhor
    // const deliveryDateISO = new Date(deliveryDateStr + 'T12:00:00Z').toISOString(); // Exemplo com UTC noon

    setRecords(prev => prev.map(r =>
        r.id === recordId
        ? { ...r, status: 'Atendido', deliveryDate: deliveryDateStr } // Usando string por enquanto
        : r
    ));
    addToast('Registro marcado como Atendido!', 'success');
    addLog?.(user?.name, `marcou registro (ID: ${recordId}) como Atendido`);
    setAttendingRecord(null); // Fecha o modal de confirmação
  };

  const handleCancelRecordStatus = (recordId) => {
    setRecords(prev => prev.map(r =>
        r.id === recordId ? { ...r, status: 'Cancelado', deliveryDate: null } : r
    ));
    addToast('Registro marcado como Cancelado.', 'info');
    addLog?.(user?.name, `marcou registro (ID: ${recordId}) como Cancelado`);
  };

  // --- Funções de Navegação e UI ---
  const handleViewPatientHistory = (patientId) => {
      const patient = patients.find(p => p.id === patientId);
      if(patient) {
          setSelectedPatient(patient); // Seleciona o paciente
          setCurrentView('patients'); // Muda a visão interna para a de pacientes/detalhes
          // Ou navega para uma rota específica se existir: navigate(`/patients/${patientId}`);
      }
  }

  // Abre modal de novo registro para o paciente clicado
  const handleQuickAddRecord = (e, patient) => {
      e.stopPropagation(); // Previne que o clique selecione a linha inteira
      setSelectedPatient(patient); // Garante que o paciente está selecionado
      setEditingRecord(null); // Garante que é um novo registro
      setIsRecordModalOpen(true);
  }

  // Abre modal de novo registro a partir do select
  const openQuickAddModal = () => {
    if(quickAddPatientId) {
        const patient = patients.find(p => p.id === parseInt(quickAddPatientId));
        if(patient) {
            setSelectedPatient(patient);
            setEditingRecord(null);
            setIsRecordModalOpen(true);
        } else {
            addToast('Paciente não encontrado.', 'error');
        }
    } else {
        addToast('Selecione um paciente primeiro.', 'error');
    }
  }


  // --- Renderização Condicional do Conteúdo da Página ---
  const renderCurrentView = () => {
    switch(currentView) {
      // VISÃO: DASHBOARD INICIAL
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
                    {/* Ações Rápidas (Opcional) */}
                    <div className="bg-white p-4 md:p-6 rounded-lg shadow flex flex-col justify-center items-center gap-3">
                         <button onClick={() => { setEditingPatient(null); setIsPatientModalOpen(true); }} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                           <span className="w-4 h-4">{icons.plus}</span> Novo Paciente
                         </button>
                         <button onClick={() => setCurrentView('historico')} className="w-full px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">Ver Histórico Geral</button>
                    </div>
                </div>
                {/* Pode adicionar um gráfico ou outra info aqui */}
             </div>
          );

      // VISÃO: GERENCIAR PACIENTES (Lista e Detalhes)
      case 'patients':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-10rem)] animate-fade-in"> {/* Altura ajustada */}
            {/* Coluna da Lista */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow p-4 flex flex-col">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Pacientes</h2>
                {/* Busca */}
                <div className="relative mb-4">
                  <input type="text" placeholder="Buscar por nome, CPF ou SUS..." className="w-full p-2 pl-10 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  <div className="absolute left-3 top-2.5 text-gray-400 w-4 h-4">{icons.search}</div>
                </div>
                {/* Botão Novo Paciente */}
                <button onClick={() => { setEditingPatient(null); setIsPatientModalOpen(true); }} className="w-full flex items-center justify-center gap-2 mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  <span className="w-4 h-4">{icons.plus}</span> Novo Paciente
                </button>
                {/* Lista Rolável */}
                <div className="flex-grow overflow-y-auto pr-2 -mr-2"> {/* Negativo margem para scrollbar */}
                  {filteredPatients.length > 0 ? filteredPatients.map(patient => (
                    <div key={patient.id}
                         className={`p-3 rounded-lg cursor-pointer mb-2 border ${selectedPatient?.id === patient.id ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-50 border-transparent hover:border-gray-200'}`}
                         onClick={() => setSelectedPatient(patient)}
                         role="button"
                         tabIndex={0} // Para acessibilidade
                         onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedPatient(patient)}
                    >
                      <div className="flex justify-between items-center">
                          <p className="font-semibold text-gray-800 text-sm truncate">{patient.name}</p> {/* Truncate */}
                           <div className="flex items-center gap-2 flex-shrink-0"> {/* Evita que botões quebrem */}
                            <StatusBadge status={patient.status} />
                            <button onClick={(e) => handleQuickAddRecord(e, patient)} title="Novo Registro Rápido" className="text-gray-400 hover:text-blue-600 p-0.5">
                                <span className="w-4 h-4 block">{icons.plus}</span>
                            </button>
                           </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{patient.cpf || patient.susCard || 'Sem documento'}</p>
                    </div>
                  )) : (
                     <p className="text-center text-gray-500 py-4 text-sm">Nenhum paciente encontrado.</p>
                  )}
                </div>
            </div>
            {/* Coluna de Detalhes */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow p-4 md:p-6 flex flex-col">
              {selectedPatient ? (
                <>
                  {/* Info Paciente */}
                  <div className="flex justify-between items-start mb-4 pb-4 border-b">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-800">{selectedPatient.name}</h2>
                      <p className="text-sm text-gray-500 mt-1">CPF: {selectedPatient.cpf || 'Não informado'}</p>
                      <p className="text-sm text-gray-500">SUS: {selectedPatient.susCard || 'Não informado'}</p>
                      <p className="mt-2 text-sm"><strong>Observações:</strong> {selectedPatient.observations || 'Nenhuma'}</p>
                       <p className="mt-1 text-sm"><strong>Anotações Gerais:</strong> {selectedPatient.generalNotes || 'Nenhuma'}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => { setEditingPatient(selectedPatient); setIsPatientModalOpen(true); }} className="p-2 text-gray-600 hover:text-blue-600" title="Editar Paciente">
                         <span className="w-4 h-4 block">{icons.edit}</span>
                      </button>
                      <button onClick={() => setConfirmation({ isOpen: true, message: `Excluir ${selectedPatient.name}? (Registros não serão excluídos)`, onConfirm: () => handleDeletePatient(selectedPatient.id) })} className="p-2 text-gray-600 hover:text-red-600" title="Excluir Paciente">
                         <span className="w-4 h-4 block">{icons.trash}</span>
                      </button>
                    </div>
                  </div>
                   {/* Histórico */}
                   <div className="flex justify-between items-center mt-2 mb-3">
                      <h3 className="text-lg font-semibold text-gray-700">Histórico de Registros</h3>
                      <button onClick={() => { setEditingRecord(null); setIsRecordModalOpen(true);}} className="flex items-center gap-1.5 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium">
                        <span className="w-3 h-3">{icons.plus}</span> Novo Registro
                      </button>
                    </div>
                     {/* Tabela de Histórico Rolável */}
                     <div className="flex-grow overflow-y-auto -mx-4 md:-mx-6 px-4 md:px-6"> {/* Overflow com padding negativo/positivo */}
                        <PatientRecordsTable records={patientRecords} medications={medications} />
                     </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                  <div className="mb-4 text-gray-300 w-16 h-16">{icons.users}</div>
                  <h2 className="text-xl font-semibold">Selecione um Paciente</h2>
                  <p className="text-sm">Escolha um paciente na lista à esquerda para ver seus detalhes e histórico.</p>
                </div>
              )}
            </div>
          </div>
        );

      // VISÃO: HISTÓRICO GERAL DE ENTRADAS
      case 'historico':
        return (
           <div className="bg-white rounded-lg shadow p-4 md:p-6 animate-fade-in">
             <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800">Histórico Geral de Entradas</h2>
               {/* Adição Rápida */}
               <div className="bg-gray-50 p-4 rounded-lg mb-4 border">
                 <h4 className="font-semibold mb-2 text-gray-700">Adicionar Novo Registro Rápido</h4>
                 <div className="flex flex-col sm:flex-row items-center gap-3">
                   <select onChange={(e) => setQuickAddPatientId(e.target.value)} value={quickAddPatientId} className="flex-grow p-2 border rounded-lg w-full sm:w-auto text-sm bg-white">
                       <option value="">Selecione um paciente...</option>
                       {/* Ordena pacientes no select */}
                       {patients.sort((a,b) => a.name.localeCompare(b.name)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                   </select>
                   <button onClick={openQuickAddModal} disabled={!quickAddPatientId} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 w-full sm:w-auto text-sm font-medium">
                       <span className="inline-block mr-1">+</span> Adicionar
                   </button>
                 </div>
               </div>
             {/* Tabela de Histórico */}
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
                         {/* Usa a lista completa de records ordenada */}
                         {records.sort((a,b) => new Date(b.entryDate) - new Date(a.entryDate)).map(record => (
                             <tr key={record.id} className="border-b hover:bg-gray-50">
                                 {/* Nome clicável */}
                                 <td className="py-2 px-3 font-medium">
                                     <button onClick={() => handleViewPatientHistory(record.patientId)} className="text-blue-600 hover:underline text-left">
                                       {getPatientNameById(record.patientId)}
                                     </button>
                                 </td>
                                 <td className="py-2 px-3 text-gray-700">{new Date(record.entryDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short'})}</td>
                                 <td className="py-2 px-3 text-gray-700">
                                     {record.medications.map(m => `${getMedicationName(m.medicationId, medications)} (${m.quantity})`).join(', ')}
                                 </td>
                                  <td className="py-2 px-3"><StatusBadge status={record.status} /></td>
                                 {/* Ações */}
                                 <td className="py-2 px-3">
                                   <div className="flex items-center gap-2">
                                     {record.status === 'Pendente' && (
                                         <>
                                             <button onClick={() => setAttendingRecord(record)} className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 font-medium" title="Marcar como Atendido">Atendido</button>
                                             <button onClick={() => setConfirmation({ isOpen: true, message: 'Cancelar este registro?', onConfirm: () => handleCancelRecordStatus(record.id)})} className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 font-medium" title="Cancelar Registro">Cancelar</button>
                                         </>
                                     )}
                                      <button onClick={() => {
                                         const patientForRecord = patients.find(p => p.id === record.patientId);
                                         if(patientForRecord) {
                                           setSelectedPatient(patientForRecord); // Seleciona para o modal saber o contexto
                                           setEditingRecord(record);
                                           setIsRecordModalOpen(true);
                                         }
                                      }} className="p-1 text-gray-500 hover:text-blue-600" title="Editar Registro">
                                         <span className="w-4 h-4 block">{icons.edit}</span>
                                      </button>
                                     <button onClick={() => setConfirmation({ isOpen: true, message: 'Excluir este registro permanentemente?', onConfirm: () => handleDeleteRecord(record.id)})} className="p-1 text-gray-500 hover:text-red-600" title="Excluir Registro">
                                        <span className="w-4 h-4 block">{icons.trash}</span>
                                     </button>
                                   </div>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
                 {records.length === 0 && <p className="text-center text-gray-500 py-6">Nenhuma entrada registrada ainda.</p>}
             </div>
         </div>
        );

       // VISÃO: ENTREGAS RECENTES (Reutiliza o componente)
       case 'deliveries':
           return <RecentDeliveriesTab records={records} patients={patients} medications={medications} />;

      default: // Caso a view seja desconhecida ou 'dashboard' por padrão
        // Retorna o Dashboard como fallback
        return (
            <div className="text-center p-10">
                <h2 className="text-xl font-semibold text-gray-700">Visão Inválida</h2>
                <p className="text-gray-500">Ocorreu um erro ao carregar a visualização solicitada.</p>
                <button onClick={() => setCurrentView('dashboard')} className="mt-4 text-blue-600 hover:underline">Voltar ao Dashboard</button>
            </div>
        );
    }
  }

  // --- Renderização Principal da Página ---
  return (
    <>
      {/* Renderiza a visão atual */}
      {renderCurrentView()}

      {/* --- Modais --- */}
      {/* Modal de Paciente (Novo/Editar) */}
      {isPatientModalOpen && (
        <PatientForm
            patient={editingPatient}
            onSave={handleSavePatient}
            onClose={() => { setIsPatientModalOpen(false); setEditingPatient(null); }}
            // Passar função de checar duplicidade se implementada
        />
      )}
      {/* Modal de Registro (Novo/Editar) */}
      {isRecordModalOpen && selectedPatient && ( // Só abre se tiver um paciente selecionado
        <RecordForm
            patient={selectedPatient}
            professionalId={user.id} // ID do usuário logado
            record={editingRecord}
            onSave={handleSaveRecord}
            onClose={() => { setIsRecordModalOpen(false); setEditingRecord(null); /* Não deseleciona paciente */ }}
            medicationsList={medications} // Lista completa de medicações
            onNewMedication={handleAddNewMedication} // Função para adicionar medicação dinamicamente
        />
       )}
      {/* Modal de Confirmação Genérico */}
      {confirmation.isOpen && (
        <ConfirmModal
            message={confirmation.message}
            onConfirm={confirmation.onConfirm}
            onClose={closeConfirmation}
        />
      )}
       {/* Modal para Confirmar Atendimento */}
       {attendingRecord && (
         <AttendRecordModal
            record={attendingRecord}
            onConfirm={handleUpdateRecordStatus}
            onClose={() => setAttendingRecord(null)}
            getPatientName={getPatientNameById} // Passa a função helper
         />
       )}
        {/* Modal para Adicionar Medicação (renderizado dentro do RecordForm) */}
    </>
  );
}