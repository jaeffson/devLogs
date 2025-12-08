// src/components/forms/RecordForm.jsx


import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal } from '../common/Modal';
import MedicationForm from './MedicationForm';
import { icons } from '../../utils/icons';
import { ClipLoader } from 'react-spinners';

const quantityOptions = [
  '1cx (30cp)', '1cx (60cp)',
  '2cxs (total 60cp)', '2cxs (total 120cp)',
  '3cxs', '4cxs', '5cxs', '6cxs', '7cxs',
  '1 Frasco', '2 Frascos', '3 Frascos',
  '1 Bisnaga', '2 Bisnagas', '1 Ampola', '1 Seringa',
  '1cx', '2cxs', '1tb'
];

export default function RecordForm({
  patient,
  patients = [],
  profissionalId,
  records = [],
  record,
  recentRecord = null,
  onSave,
  onClose,
  medicationsList = [],
  onNewMedication,
  addToast,
}) {
  // --- Estados do Formulário ---
  const [localPatient, setLocalPatient] = useState(patient || null);
  const [referenceDate, setReferenceDate] = useState('');
  const [observation, setObservation] = useState('');
  const [medications, setMedications] = useState([
    { medicationId: '', quantity: quantityOptions[0], value: '', tempId: Date.now() },
  ]);
  
  // --- NOVO ESTADO PARA A FARMÁCIA ---
  const [farmaciaOrigin, setFarmaciaOrigin] = useState(record?.farmacia || '');

  // --- Estados de Busca e UI ---
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientList, setShowPatientList] = useState(false);
  const [medSearchTerm, setMedSearchTerm] = useState('');
  const [openMedSelectIndex, setOpenMedSelectIndex] = useState(null);
  
  // --- Estados de Controle ---
  const [isSaving, setIsSaving] = useState(false);
  const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false);
  const [addingMedicationIndex, setAddingMedicationIndex] = useState(null);
  const [errors, setErrors] = useState({});
  const [autoFilled, setAutoFilled] = useState(false);

  // Refs
  const patientInputRef = useRef(null);
  const listRef = useRef(null);
  const medDropdownRef = useRef(null);

  // --- Inicialização ---
  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const today = getLocalDateString();
    
    if (record) {
      // MODO EDIÇÃO
      setReferenceDate(record.referenceDate ? new Date(record.referenceDate).toISOString().slice(0, 10) : today);
      setObservation(record.observation || '');
      setLocalPatient(patient || null);
      setFarmaciaOrigin(record.farmacia || ''); // Carrega farmácia existente
      
      const existingMeds = record.medications?.map((m, i) => ({
          medicationId: m.medicationId || '',
          quantity: m.quantity || quantityOptions[0],
          value: m.value || '',
          tempId: m.recordMedId || m.id || `edit-${i}`,
      })) || [];
      
      setMedications(existingMeds.length > 0 ? existingMeds : [{ medicationId: '', quantity: quantityOptions[0], value: '', tempId: Date.now() }]);
    } else {
      // MODO NOVO REGISTRO
      if (!referenceDate) setReferenceDate(today);
      if (patient) setLocalPatient(patient);
      if (!farmaciaOrigin) setFarmaciaOrigin(''); // Limpa ou mantém o default para novo registro
    }
  }, [record, patient]);

  // Click Outside
  useEffect(() => {
    function handleClickOutside(event) {
        if (listRef.current && !listRef.current.contains(event.target) && patientInputRef.current && !patientInputRef.current.contains(event.target)) {
            setShowPatientList(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Lógica de Registro Recente ---
  const activeRecentRecord = useMemo(() => {
    if (!localPatient) return null;
    
    if (recentRecord && (recentRecord.patientId === (localPatient._id || localPatient.id))) {
      return recentRecord;
    }
    
    if (Array.isArray(records)) {
      const targetId = localPatient._id || localPatient.id;
      const patientRecords = records
        .filter(r => r.patientId === targetId && r.status !== 'Cancelado')
        .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));
      
      if (patientRecords.length > 0) {
        const last = patientRecords[0];
        const diff = new Date().getTime() - new Date(last.entryDate).getTime();
        const days = diff / (1000 * 3600 * 24);
        if (days <= 20) return last;
      }
    }
    return null;
  }, [localPatient, recentRecord, records]);

  // --- Função para Repetir Medicamentos ---
  const repeatLastPrescription = () => {
    if (!activeRecentRecord || !activeRecentRecord.medications) return;
    
    const copiedMeds = activeRecentRecord.medications.map((m, i) => ({
      medicationId: m.medicationId || m.id || m._id,
      quantity: m.quantity || quantityOptions[0],
      value: m.value || '',
      tempId: Date.now() + i
    }));

    setMedications(copiedMeds);
    setAutoFilled(true);
    addToast('Medicações carregadas!', 'success');
  };

  // --- Filtros ---
  const filteredPatients = useMemo(() => {
    if (!patientSearchTerm) return patients.slice(0, 20);
    const lower = patientSearchTerm.toLowerCase();
    return patients.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      String(p.cpf || '').includes(lower) ||
      String(p.susCard || '').includes(lower)
    ).slice(0, 50);
  }, [patients, patientSearchTerm]);

  const filteredMedications = useMemo(() => {
    if (!medSearchTerm) return medicationsList.slice(0, 50);
    return medicationsList.filter(m => m.name.toLowerCase().includes(medSearchTerm.toLowerCase()));
  }, [medicationsList, medSearchTerm]);

  // --- Handlers ---
  const handleSelectPatient = (p) => {
    setLocalPatient(p);
    setPatientSearchTerm('');
    setShowPatientList(false);
    setAutoFilled(false);
    setMedications([{ medicationId: '', quantity: quantityOptions[0], value: '', tempId: Date.now() }]);
    setErrors({});
  };

  const handleClearForm = () => {
    setLocalPatient(null);
    setMedications([{ medicationId: '', quantity: quantityOptions[0], value: '', tempId: Date.now() }]);
    setObservation('');
    setAutoFilled(false);
    setPatientSearchTerm('');
    setFarmaciaOrigin(''); // Limpa a farmácia também
    setTimeout(() => {
       if(patientInputRef.current) patientInputRef.current.focus();
    }, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!localPatient) newErrors.patient = "Selecione um paciente!";
    if (!farmaciaOrigin) newErrors.farmacia = "Selecione a Farmácia de origem!"; // Validação da Farmácia
    const validMeds = medications.filter(m => m.medicationId);
    if (validMeds.length === 0) newErrors.medications = "Adicione pelo menos uma medicação.";
    validMeds.forEach((m, i) => {
      if(!m.quantity) newErrors[`qty_${i}`] = "Qtd?";
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast("Preencha os campos obrigatórios", "error");
      return;
    }

    setIsSaving(true);

    try {
        const payload = {
            _id: record?._id || record?.id,
            patientId: localPatient._id || localPatient.id,
            profissionalId,
            referenceDate,
            observation,
            status: record?.status || 'Pendente',
            entryDate: record?.entryDate || new Date(),
            farmacia: farmaciaOrigin, // <<-- CAMPO ADICIONADO AQUI
            medications: validMeds.map(m => ({
                medicationId: m.medicationId,
                quantity: m.quantity,
                value: Number(m.value) || 0
            })),
            totalValue: validMeds.reduce((acc, cur) => acc + (Number(cur.value)||0), 0)
        };

        await onSave(payload);
        addToast("Registro salvo com sucesso!", "success");

        if (!record) {
            handleClearForm(); 
        } else {
            onClose();
        }
    } catch (error) {
        console.error(error);
        addToast("Erro ao salvar.", "error");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <>
      <Modal onClose={onClose}>
        {/* FIX: h-[85vh] trava a altura total para caber na tela */}
        <div className="flex flex-col h-[85vh] -m-6 rounded-lg overflow-hidden bg-white">
          
          {/* HEADER (Fixo) */}
          <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center shadow-md shrink-0">
             <div className="flex items-center gap-3">
                 <div className="p-2 bg-gray-700 rounded-lg">{icons.clipboard}</div>
                 <div>
                     <h2 className="text-xl font-bold">{record ? 'Editar Atendimento' : 'Novo Atendimento'}</h2>
                     <p className="text-xs text-gray-300">Preencha os dados abaixo.</p>
                 </div>
             </div>
             <button 
                  onClick={onClose} 
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1"
                  title="Fechar"
              >
                 {icons.close || 'X'}
             </button>
          </div>

          {/* BODY (Rolagem Interna) - flex-grow garante que ocupe o espaço restante */}
          <div className="flex-grow overflow-y-auto bg-gray-50 p-6 flex flex-col gap-6">
              
              {/* 1. SELEÇÃO DE PACIENTE */}
              <div className={`transition-all duration-300`}>
                  {!localPatient ? (
                      <div className="max-w-2xl mx-auto w-full relative">
                          <label className="block text-center text-gray-700 font-bold mb-3 text-lg">
                              Quem será atendido agora?
                          </label>
                          <div className="relative group">
                               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                  {icons.search}
                               </div>
                               <input
                                  ref={patientInputRef}
                                  type="text"
                                  className="w-full pl-12 pr-4 py-4 text-lg border-2 border-blue-300 rounded-xl shadow-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all cursor-text"
                                  placeholder="Digite nome, CPF ou cartão SUS..."
                                  value={patientSearchTerm}
                                  onChange={(e) => {
                                      setPatientSearchTerm(e.target.value);
                                      setShowPatientList(true);
                                  }}
                                  onFocus={() => setShowPatientList(true)}
                                  autoFocus
                               />
                          </div>
                          
                          {showPatientList && (
                              <div 
                                  ref={listRef}
                                  className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden max-h-60 overflow-y-auto"
                              >
                                  {filteredPatients.length > 0 ? (
                                      filteredPatients.map(p => (
                                          <div 
                                              key={p._id || p.id}
                                              onClick={() => handleSelectPatient(p)}
                                              className="px-5 py-4 border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors flex justify-between items-center group"
                                          >
                                              <div>
                                                  <div className="font-bold text-gray-800 text-lg group-hover:text-blue-700">{p.name}</div>
                                                  <div className="text-sm text-gray-500 flex gap-4">
                                                      <span>CPF: {p.cpf || '---'}</span>
                                                      <span>SUS: {p.susCard || '---'}</span>
                                                  </div>
                                              </div>
                                              <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  Selecionar &rarr;
                                              </div>
                                          </div>
                                      ))
                                  ) : (
                                      <div className="p-6 text-center text-gray-500">
                                          Nenhum paciente encontrado.
                                      </div>
                                  )}
                              </div>
                          )}
                          {errors.patient && <p className="text-center text-red-500 mt-2 font-medium">{errors.patient}</p>}
                      </div>
                  ) : (
                      // CARD PACIENTE SELECIONADO
                      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 flex flex-col md:flex-row justify-between items-center gap-6 animate-fade-in relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                          
                          <div className="flex items-center gap-5 z-10">
                              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold border-4 border-white shadow-sm">
                                  {localPatient.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                  <h3 className="text-2xl font-bold text-gray-900">{localPatient.name}</h3>
                                  <div className="flex gap-3 text-sm text-gray-600 mt-1">
                                      <span className="bg-gray-100 px-2 py-1 rounded">CPF: {localPatient.cpf || 'N/A'}</span>
                                      <span className="bg-gray-100 px-2 py-1 rounded">SUS: {localPatient.susCard || 'N/A'}</span>
                                  </div>
                              </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 z-10 w-full md:w-auto">
                               {activeRecentRecord && !autoFilled && (
                                   <button
                                      type="button"
                                      onClick={repeatLastPrescription}
                                      className="w-full md:w-auto px-4 py-2 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-lg hover:bg-yellow-200 transition-colors flex items-center justify-center gap-2 font-semibold shadow-sm animate-pulse cursor-pointer"
                                   >
                                       <span>⚡ Repetir Última Receita</span>
                                   </button>
                               )}
                               
                               <button 
                                  onClick={handleClearForm}
                                  className="text-sm text-red-500 hover:text-red-700 underline font-medium cursor-pointer"
                               >
                                  Alterar Paciente (Esc)
                               </button>
                          </div>
                      </div>
                  )}
              </div>

              {/* 2. ÁREA DE REGISTRO */}
              {localPatient && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-grow flex flex-col animate-slide-up">
                      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center rounded-t-xl">
                          <h4 className="font-bold text-gray-700 uppercase tracking-wider text-sm flex items-center gap-2">
                              {icons.clipboard} Detalhes do Atendimento
                          </h4>
                          <div className="flex items-center gap-4">
                            {/* CAMPO DE SELEÇÃO DA FARMÁCIA (NOVO) */}
                            <div className="flex flex-col items-start">
                                <label className="text-xs text-gray-700 font-bold mb-1">FARMÁCIA</label>
                                <select 
                                    value={farmaciaOrigin} 
                                    onChange={e => setFarmaciaOrigin(e.target.value)}
                                    className={`bg-white border rounded px-2 py-1 text-sm text-gray-700 font-medium outline-none ${errors.farmacia ? 'border-red-500' : 'border-gray-300'}`}
                                >
                                    <option value="" disabled>Selecione a origem</option>
                                    <option value="Campina Grande">Farmácia Campina Grande</option>
                                    <option value="João Paulo">Farmácia João Paulo</option>
                                </select>
                                {errors.farmacia && <p className="text-xs text-red-500 mt-1">{errors.farmacia}</p>}
                            </div>

                            {/* FIX: Data TRAVADA (disabled) */}
                            <div className="flex flex-col items-start">
                                <label className="text-xs text-gray-700 font-bold mb-1">DATA</label>
                                <input 
                                    type="date" 
                                    value={referenceDate}
                                    disabled
                                    className="bg-gray-100 border border-gray-200 rounded px-2 py-1 text-sm text-gray-500 font-medium cursor-not-allowed outline-none"
                                />
                            </div>
                          </div>
                      </div>

                      <div className="p-6 space-y-4">
                          {medications.map((med, index) => {
                               const medName = medicationsList.find(m => (m.id || m._id) === med.medicationId)?.name || '';
                               return (
                                  <div key={med.tempId} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors shadow-sm">
                                      <div className="md:col-span-6 relative">
                                          <label className="text-xs font-bold text-gray-500 mb-1 block">Medicação</label>
                                          <input
                                              type="text"
                                              placeholder="Buscar medicação..."
                                              className={`w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-text ${!med.medicationId && errors.medications ? 'border-red-300' : 'border-gray-300'}`}
                                              value={openMedSelectIndex === index ? medSearchTerm : medName}
                                              onChange={e => setMedSearchTerm(e.target.value)}
                                              onFocus={() => {
                                                  setOpenMedSelectIndex(index);
                                                  setMedSearchTerm('');
                                              }}
                                          />
                                          {openMedSelectIndex === index && (
                                              <div className="absolute z-20 w-full bg-white border border-gray-200 shadow-xl rounded-lg mt-1 max-h-48 overflow-y-auto">
                                                  {filteredMedications.map(m => (
                                                      <div 
                                                          key={m.id || m._id}
                                                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                                                          onMouseDown={(e) => {
                                                              e.preventDefault();
                                                              const newMeds = [...medications];
                                                              newMeds[index].medicationId = m.id || m._id;
                                                              setMedications(newMeds);
                                                              setOpenMedSelectIndex(null);
                                                          }}
                                                      >
                                                          {m.name}
                                                      </div>
                                                  ))}
                                                  <div 
                                                      className="px-4 py-2 bg-blue-50 text-blue-700 font-bold cursor-pointer hover:bg-blue-100 text-sm"
                                                      onMouseDown={(e) => {
                                                          e.preventDefault();
                                                          setAddingMedicationIndex(index);
                                                          setIsMedicationModalOpen(true);
                                                          setOpenMedSelectIndex(null);
                                                      }}
                                                  >
                                                      + Cadastrar Novo
                                                  </div>
                                              </div>
                                          )}
                                      </div>

                                      <div className="md:col-span-3">
                                          <label className="text-xs font-bold text-gray-500 mb-1 block">Qtd.</label>
                                          <input
                                              type="text"
                                              list={`qty-${index}`}
                                              className={`w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer ${!med.quantity && errors[`qty_${index}`] ? 'border-red-300' : 'border-gray-300'}`}
                                              value={med.quantity}
                                              onChange={(e) => {
                                                  const newMeds = [...medications];
                                                  newMeds[index].quantity = e.target.value;
                                                  setMedications(newMeds);
                                              }}
                                          />
                                          <datalist id={`qty-${index}`}>
                                              {quantityOptions.map(opt => <option key={opt} value={opt} />)}
                                          </datalist>
                                      </div>

                                      <div className="md:col-span-2">
                                          <label className="text-xs font-bold text-gray-500 mb-1 block">Valor (R$)</label>
                                          <input
                                              type="number"
                                              className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 cursor-text"
                                              value={med.value}
                                              onChange={(e) => {
                                                  const newMeds = [...medications];
                                                  newMeds[index].value = e.target.value;
                                                  setMedications(newMeds);
                                              }}
                                              placeholder="0.00"
                                          />
                                      </div>

                                      <div className="md:col-span-1 pt-6 flex justify-center">
                                          <button 
                                              onClick={() => {
                                                  if(medications.length > 1) {
                                                      setMedications(medications.filter((_, i) => i !== index));
                                                  }
                                              }}
                                              className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                                              disabled={medications.length === 1}
                                              title="Remover Item"
                                          >
                                              {icons.trash}
                                          </button>
                                      </div>
                                  </div>
                               );
                          })}

                          <button 
                              onClick={() => setMedications([...medications, { medicationId: '', quantity: quantityOptions[0], value: '', tempId: Date.now() }])}
                              className="w-full py-3 border-2 border-dashed border-blue-200 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                          >
                              {icons.plus} Adicionar Outra Medicação
                          </button>

                          <div className="pt-4">
                              <label className="text-sm font-bold text-gray-700 mb-1 block">Observações (Opcional)</label>
                              <textarea 
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none resize-none h-20 cursor-text"
                                  placeholder="Alguma observação sobre esta entrega?"
                                  value={observation}
                                  onChange={e => setObservation(e.target.value)}
                              />
                          </div>
                      </div>
                  </div>
              )}
          </div>

          {/* FOOTER (Fixo) */}
          <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center shrink-0 z-20">
               <div className="text-sm text-gray-500 hidden md:block">
                   {localPatient ? 
                      <span>Total Estimado: <strong className="text-gray-900 text-lg ml-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(medications.reduce((acc, cur) => acc + (Number(cur.value)||0), 0))}</strong></span> 
                      : 'Selecione um paciente para iniciar.'
                   }
               </div>

               <div className="flex gap-4 w-full md:w-auto">
                   <button 
                      onClick={onClose}
                      className="flex-1 md:flex-none px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      disabled={isSaving}
                   >
                      Cancelar
                   </button>
                   <button 
                      onClick={handleSubmit}
                      disabled={!localPatient || isSaving}
                      className="flex-1 md:flex-none px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
                   >
                      {isSaving ? <ClipLoader color="#fff" size={20}/> : icons.check}
                      {isSaving ? 'Salvando...' : 'Confirmar e Próximo'}
                   </button>
               </div>
          </div>
        </div>
      </Modal>

      {isMedicationModalOpen && (
        <MedicationForm
          onSave={(newMed) => {
              const created = onNewMedication ? onNewMedication(newMed) : newMed;
              if(created && addingMedicationIndex !== null) {
                  const newMeds = [...medications];
                  newMeds[addingMedicationIndex].medicationId = created.id || created._id;
                  setMedications(newMeds);
              }
              setIsMedicationModalOpen(false);
          }}
          onClose={() => setIsMedicationModalOpen(false)}
          addToast={addToast}
        />
      )}
    </>
  );
}