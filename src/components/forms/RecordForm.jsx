// src/components/forms/RecordForm.jsx
// (ATUALIZADO: Novo layout "clean" para a lista de medicações)
// (MANTIDO: Correção do overflow do dropdown de medicações)
// (MANTIDO: Lista de 'quantityOptions' expandida)

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal } from '../common/Modal';
import MedicationForm from './MedicationForm';
import { icons } from '../../utils/icons';

// Lista de opções de quantidade
const quantityOptions = [
  '1cx (30cp)',  '1cx (60cp)',
 '2cxs (total 60cp)', '2cxs (total 120cp)',
  '3cxs', '4cxs', '5cxs', '6cxs', '7cxs',
  '1cx (10 tiras)', '1cx (25 tiras)', '1cx (50 tiras)',
  '1 Frasco', '2 Frascos', '3 Frascos','4 Frascos','5 Frascos',
  '1 Bisnaga', '2 Bisnagas', '1 Ampola', '1 Seringa',
  '1cx', '2cxs', '1tb'
];


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

  // --- LÓGICA (Sem alteração) ---
  const getTodayIsoDate = () => new Date().toISOString().slice(0, 10);
  
  const formattedDate = (dateString) => {
    if (!dateString) return 'Data inválida';
    const isoDatePart = dateString.slice(0, 10);
    const parts = isoDatePart.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
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
    if (openMedSelectIndex === null) return [];
    if (!medSearchTerm) return medicationsList.slice(0, 50); 
    return medicationsList.filter((med) =>
      med.name.toLowerCase().includes(medSearchTerm.toLowerCase())
    );
  }, [medicationsList, medSearchTerm, openMedSelectIndex]);

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
    const newMed = typeof onNewMedication === 'function' ? onNewMedication(newMedData) : null;
    if (newMed && addingMedicationIndex !== null) {
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
        if (!med.quantity) newErrors[`medications[${index}].quantity`] = 'Quantidade obrigatória.';
        if (Number(med.value) < 0) newErrors[`medications[${index}].value`] = 'Valor inválido.';
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
        medicationId: m.medicationId, 
        value: Number(m.value) || 0,
        recordMedId: m.recordMedId, 
      }));
    const totalValue = validMedications.reduce((sum, med) => sum + med.value, 0);
    const recordData = {
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
    onClose();
  };
  // --- FIM DA LÓGICA ---


  return (
    <>
      <Modal onClose={onClose} modalClasses="max-w-3xl">
        <div className="flex flex-col h-[90vh]">
          {/* Cabeçalho */}
          <div className="flex-shrink-0 flex items-center gap-3">
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

          {/* Conteúdo com rolagem (A barra de rolagem principal do modal) */}
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

                {/* --- (INÍCIO DO NOVO LAYOUT) --- */}
                <div
                  className="space-y-3 border border-gray-200 rounded-lg"
                  ref={medSelectRef}
                >
                  {/* Cabeçalho da Tabela (Opcional, mas limpo) */}
                  <div className="grid grid-cols-12 gap-3 items-center bg-gray-50 p-3 rounded-t-lg">
                    <div className="col-span-12 md:col-span-6 text-xs font-semibold text-gray-600 uppercase">Medicação</div>
                    <div className="col-span-4 md:col-span-3 text-xs font-semibold text-gray-600 uppercase">Qtd.</div>
                    <div className="col-span-4 md:col-span-2 text-xs font-semibold text-gray-600 uppercase">Valor (R$)</div>
                    <div className="col-span-4 md:col-span-1 text-xs font-semibold text-gray-600 uppercase">Ação</div>
                  </div>

                  {/* Linhas de Medicação */}
                  {medications.map((med, index) => {
                    const selectedMedName =
                      medicationsList.find((m) => (m.id || m._id) === med.medicationId)?.name || ''; 
                    
                    return (
                      <div
                        key={med.tempId} 
                        className="grid grid-cols-12 gap-3 items-start p-3 border-b last:border-b-0"
                      >
                        {/* Medicação (COMBOBOX) */}
                        <div className="col-span-12 md:col-span-6">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Buscar ou selecionar..."
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

                            {/* Dropdown (sem alteração na lógica) */}
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

                        {/* Quantidade (com datalist) */}
                        <div className="col-span-4 md:col-span-3">
                          <input
                            type="text"
                            value={med.quantity}
                            onChange={(e) =>
                              handleMedicationChange(index, 'quantity', e.target.value)
                            }
                            className="w-full p-2 border-0 ring-1 ring-gray-200 rounded bg-white text-sm h-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            list={`quantity-options-${index}`}
                          />
                          <datalist id={`quantity-options-${index}`}>
                            {quantityOptions.map(opt => (
                              <option key={opt} value={opt} />
                            ))}
                          </datalist>
                        </div>

                        {/* Valor */}
                        <div className="col-span-4 md:col-span-2">
                          <input
                            type="number"
                            value={med.value}
                            onChange={(e) =>
                              handleMedicationChange(index, 'value', e.target.value)
                            }
                            className="w-full p-2 border-0 ring-1 ring-gray-200 rounded text-sm h-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            step="0.01"
                            min="0"
                          />
                        </div>

                        {/* Botão Remover */}
                        <div className="col-span-4 md:col-span-1 flex items-center">
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
                      </div>
                    );
                  })}
                </div>
                {/* --- (FIM DO NOVO LAYOUT) --- */}


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