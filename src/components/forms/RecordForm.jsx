// src/components/forms/RecordForm.jsx
// (ATUALIZADO: Ícones adicionados e botões padronizados com a cor AZUL)

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal } from '../common/Modal';
import MedicationForm from './MedicationForm';
import { icons } from '../../utils/icons'; // <-- 1. Importar ícones

const quantityOptions = ['1cx','1cx(60cp)','2cxs','3cxs','4cxs','5xs','6cxs','7cxs','1tb'];

export default function RecordForm({
  patient,
  profissionalId,
  record,
  onSave,
  onClose,
  medicationsList = [],
  onNewMedication,
  addToast,
}) {
  const [referenceDate, setReferenceDate] = useState('');
  const [observation, setObservation] = useState('');
  const [medications, setMedications] = useState([
    { medicationId: '', quantity: quantityOptions[0], value: '', tempId: Date.now() }, 
  ]);
  const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false);
  const [addingMedicationIndex, setAddingMedicationIndex] = useState(null);
  const [errors, setErrors] = useState({});
  const [openMedSelectIndex, setOpenMedSelectIndex] = useState(null);
  const [medSearchTerm, setMedSearchTerm] = useState('');
  const medSelectRef = useRef(null);

  // --- (Funções de data e useEffects... sem mudança) ---
  const getTodayIsoDate = () => {
    return new Date().toISOString().slice(0, 10);
  };
  
  const formattedDate = (dateString) => {
    if (!dateString) return 'Data inválida';
    const isoDatePart = dateString.slice(0, 10);
    const parts = isoDatePart.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return 'Data Inválida';
  };

  useEffect(() => {
    const today = getTodayIsoDate();

    if (record) {
      setReferenceDate(record.referenceDate ? new Date(record.referenceDate).toISOString().slice(0, 10) : today);
      setObservation(record.observation || '');
      const existingMeds =
        record.medications?.map((m, i) => ({
          medicationId: m.medicationId || '', 
          quantity: m.quantity || quantityOptions[0],
          value: m.value || '',
          tempId: m.recordMedId || m.id || `edit-${i}`, 
        })) || [];
      setMedications(
        existingMeds.length > 0
          ? existingMeds
          : [{ medicationId: '', quantity: quantityOptions[0], value: '', tempId: Date.now() }]
      );
    } else {
      setReferenceDate(today);
      setObservation('');
      setMedications([{ medicationId: '', quantity: quantityOptions[0], value: '', tempId: Date.now() }]);
    }
    setErrors({});
  }, [record]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (medSelectRef.current && !medSelectRef.current.contains(event.target)) {
        setOpenMedSelectIndex(null);
        setMedSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setMedSearchTerm, setOpenMedSelectIndex]); 

  const filteredMedicationsList = useMemo(() => {
    if (openMedSelectIndex === null) {
        return [];
    }
    if (!medSearchTerm) {
        return medicationsList.slice(0, 50); 
    }
    return medicationsList.filter((med) =>
      med.name.toLowerCase().includes(medSearchTerm.toLowerCase())
    );
  }, [medicationsList, medSearchTerm, openMedSelectIndex, medicationsList.length]);


  const handleMedicationChange = (index, field, value) => {
    if (field === 'medicationId' && value === 'new') {
      setAddingMedicationIndex(index);
      setIsMedicationModalOpen(true);
      const newMeds = [...medications];
      newMeds[index][field] = '';
      setMedications(newMeds);
      return;
    }
    const newMeds = [...medications];
    newMeds[index][field] = value;
    
    if (errors[`medications[${index}].${field}`] || errors['medications[0].medicationId']) {
      const newErr = { ...errors };
      delete newErr[`medications[${index}].${field}`];
      delete newErr['medications[0].medicationId'];
      setErrors(newErr);
    }
    setMedications(newMeds);
  };

  const addMedicationField = () => {
    setMedications([...medications, { medicationId: '', quantity: quantityOptions[0], value: '', tempId: Date.now() }]);
  };

  const removeMedicationField = (index) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const handleSaveNewMedication = (newMedData) => {
    const newMed =
      typeof onNewMedication === 'function' ? onNewMedication(newMedData) : null;
    if (newMed && addingMedicationIndex !== null) {
      // 🚨 CORREÇÃO: Pega o ID da nova medicação (pode ser .id ou ._id)
      handleMedicationChange(addingMedicationIndex, 'medicationId', newMed.id || newMed._id); 
    }
    setIsMedicationModalOpen(false);
    setAddingMedicationIndex(null);
  };

  const validateRecordForm = () => {
    const newErrors = {};
    if (!referenceDate) newErrors.referenceDate = 'Data de referência é obrigatória.';
    
    const validMeds = medications.filter((m) => m.medicationId);
    
    if (medications.length === 0 || validMeds.length === 0) { 
        newErrors['medications[0].medicationId'] = 'É obrigatório adicionar pelo menos uma medicação.';
    }
    
    validMeds.forEach((med, index) => {
        if (!med.quantity) {
             newErrors[`medications[${index}].quantity`] = 'Quantidade obrigatória.';
        }
        if (Number(med.value) < 0) {
             newErrors[`medications[${index}].value`] = 'Valor inválido.';
        }
    });

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formErrors = validateRecordForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      addToast?.('Preencha os campos obrigatórios.', 'error');
      return;
    }

    const validMedications = medications
      .filter((m) => m.medicationId && m.quantity)
      .map((m) => ({
        ...m,
        // Garante que o ID da medicação é apenas o ID
        medicationId: m.medicationId, 
        value: Number(m.value) || 0,
        recordMedId: m.recordMedId, 
      }));

    const totalValue = validMedications.reduce((sum, med) => sum + med.value, 0);

    const recordData = {
      // 🚨 CORREÇÃO: Usa o _id se existir (para edição)
      _id: record?._id || record?.id, 
      patientId: patient._id || patient.id, 
      profissionalId,
      referenceDate,
      observation: observation.trim(),
      status: record?.status || 'Pendente',
      entryDate: record?.entryDate || new Date().toISOString(),
      deliveryDate: record?.deliveryDate || null,
      medications: validMedications,
      totalValue,
    };

    onSave(recordData);
    // 🚨 REMOVIDO: O Toast de sucesso agora é mostrado no ProfessionalDashboardPage
    // addToast?.(record ? 'Registro atualizado!' : 'Registro salvo!', 'success');
    onClose();
  };
  // --- Fim das funções de lógica ---


  return (
    <>
      {/* --- (INÍCIO DA MUDANÇA 1) --- */}
      {/* Modal agora usa o tamanho max-w-3xl para dar mais espaço */}
      <Modal onClose={onClose} modalClasses="max-w-3xl">
        <div className="flex flex-col h-[90vh]">
          {/* Cabeçalho */}
          <div className="flex-shrink-0 flex items-center gap-3">
             {/* Ícone adicionado */}
            <span className="w-8 h-8 text-blue-600 flex-shrink-0">
                {icons.clipboard}
            </span>
            <h2 className="text-2xl font-bold">
              {record ? `Editar Registro` : 'Novo Registro para'}{' '}
              <span className="text-blue-700 font-semibold">
                {patient?.name || 'Paciente'}
              </span>
            </h2>
          </div>
          {/* --- (FIM DA MUDANÇA 1) --- */}

          {/* Conteúdo com rolagem */}
          <div className="flex-grow overflow-y-auto pr-2 my-4">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Data */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">Data de Referência</label>
                <p className="w-full p-2 border rounded border-gray-300 bg-gray-100 text-gray-700 cursor-not-allowed flex items-center">
                  <span className="font-medium text-gray-800">{formattedDate(referenceDate)}</span>
                </p>
              </div>

              {/* Medicações */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Medicações</h3>
                
                {errors['medications[0].medicationId'] && (
                     <p className="text-red-600 text-sm mb-3">
                         {errors['medications[0].medicationId']}
                     </p>
                )}

                <div
                  className="overflow-y-auto max-h-[45vh] space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200"
                  ref={medSelectRef}
                >
                  {medications.map((med, index) => {
                    const selectedMedName =
                      medicationsList.find((m) => (m.id || m._id) === med.medicationId)?.name || ''; 
                    
                    return (
                      <div
                        key={med.tempId} 
                        
                        className="grid grid-cols-12 gap-3 items-start bg-white p-3 rounded-lg shadow-sm border border-gray-200"
                    
                      >
                        {/* Medicação (COMBOBOX) */}
                        <div className="col-span-12 md:col-span-6"> {/* <-- Ajustado para 6 */}
                          <label className="text-xs text-gray-600 mb-1 block">Medicação</label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Buscar ou selecionar medicação..."
                              value={openMedSelectIndex === index ? medSearchTerm : selectedMedName}
                              onChange={(e) => setMedSearchTerm(e.target.value)}
                              onFocus={() => {
                                setOpenMedSelectIndex(index);
                                setMedSearchTerm(''); 
                              }}
                              className={`w-full p-2 border rounded text-sm h-10 ${ 
                                errors[`medications[${index}].medicationId`] || errors['medications[0].medicationId']
                                  ? 'border-red-500'
                                  : 'border-gray-300'
                              } bg-white`}
                            />

                            {openMedSelectIndex === index && (
                              <div 
                                className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 flex flex-col"
                                onMouseDown={(e) => e.preventDefault()} 
                              >
                                <div className="overflow-y-auto">
                                  {filteredMedicationsList.map((m) => {
                                    const finalId = m.id || m._id; 
                                    
                                    return (
                                    <div
                                      key={finalId} 
                                      className="p-2 text-sm text-gray-800 hover:bg-blue-50 cursor-pointer"
                                      onClick={() => {
                                        handleMedicationChange(index, 'medicationId', finalId); 
                                        setOpenMedSelectIndex(null);
                                        setMedSearchTerm('');
                                      }}
                                    >
                                      {m.name}
                                    </div>
                                  )})}
                                  
                                  {filteredMedicationsList.length === 0 && (
                                    <p className="p-2 text-sm text-gray-500 text-center">
                                      {medSearchTerm ? `Nenhum resultado para "${medSearchTerm}".` : "Digite para buscar..."}
                                    </p>
                                  )}
                                  
                                  <div
                                    className="p-2 text-sm text-blue-600 font-medium hover:bg-blue-50 cursor-pointer border-t border-gray-200 mt-1"
                                    onClick={() => {
                                      handleMedicationChange(index, 'medicationId', 'new');
                                      setOpenMedSelectIndex(null);
                                      setMedSearchTerm('');
                                    }}
                                  >
                                    + Cadastrar Nova Medicação
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quantidade */}
                        <div className="col-span-4 md:col-span-3"> {/* <-- Ajustado para 3 */}
                          <label className="text-xs text-gray-600 mb-1 block">Quantidade</label>
                          <input
                            type="text"
                            value={med.quantity}
                            onChange={(e) =>
                              handleMedicationChange(index, 'quantity', e.target.value)
                            }
                            className="w-full p-2 border rounded border-gray-300 bg-white text-sm h-10"
                            list={`quantity-options-${index}`}
                          />
                          <datalist id={`quantity-options-${index}`}>
                            {quantityOptions.map(opt => (
                              <option key={opt} value={opt} />
                            ))}
                          </datalist>
                        </div>

                        {/* Valor */}
                        <div className="col-span-4 md:col-span-2"> {/* <-- Ajustado para 2 */}
                          <label className="text-xs text-gray-600 mb-1 block">Valor (R$)</label>
                          <input
                            type="number"
                            value={med.value}
                            onChange={(e) =>
                              handleMedicationChange(index, 'value', e.target.value)
                            }
                            className="w-full p-2 border rounded border-gray-300 text-sm h-10"
                            step="0.01"
                            min="0"
                          />
                        </div>

                        {/* --- (INÍCIO DA MUDANÇA 3) --- */}
                        {/* Botão Remover (agora ícone) */}
                        <div className="col-span-4 md:col-span-1 flex items-end"> {/* <-- Ajustado para 1 */}
                          <button
                            type="button"
                            onClick={() => removeMedicationField(index)}
                            className="h-10 w-full flex items-center justify-center text-red-600 rounded-md font-medium hover:bg-red-100 active:bg-red-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            disabled={medications.length <= 1}
                            title="Remover medicação"
                          >
                            <span className="w-5 h-5">{icons.trash}</span>
                          </button>
                        </div>
                        {/* --- (FIM DA MUDANÇA 3) --- */}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={addMedicationField}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md font-semibold hover:bg-blue-200 active:bg-blue-300 cursor-pointer"
                >
                  <span className="w-4 h-4">{icons.plus}</span>
                  <span>Adicionar medicação</span>
                </button>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">Observações Gerais</label>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  className="w-full p-2 border rounded border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  rows="2"
                ></textarea>
              </div>
            </form>
          </div>

          {/* Rodapé fixo */}
          {/* --- (INÍCIO DA MUDANÇA 4) --- */}
          {/* Botões do rodapé padronizados */}
          <div className="flex-shrink-0 flex justify-end gap-4 bg-gray-50 -mx-10 px-8 py-4 rounded-b-lg border-t mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 active:bg-gray-100 font-medium cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 font-medium cursor-pointer flex items-center gap-2"
            >
              <span className="w-5 h-5">{icons.check}</span>
              Salvar Registro
            </button>
          </div>
          {/* --- (FIM DA MUDANÇA 4) --- */}
        </div>
      </Modal>

      {isMedicationModalOpen && (
        <MedicationForm
          onSave={handleSaveNewMedication}
          onClose={() => {
            setIsMedicationModalOpen(false);
            setAddingMedicationIndex(null);
          }}
          addToast={addToast}
        />
      )}
    </>
  );
}