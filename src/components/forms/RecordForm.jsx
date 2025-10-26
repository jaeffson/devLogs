import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal } from '../common/Modal';
import MedicationForm from './MedicationForm';

const quantityOptions = ['1 cx', '3 cxs', '1 tubo', '2 tubos', '1 cx com 60 comp'];

export default function RecordForm({
  patient,
  professionalId,
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
    { medicationId: '', quantity: quantityOptions[0], value: '' },
  ]);
  const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false);
  const [addingMedicationIndex, setAddingMedicationIndex] = useState(null);
  const [errors, setErrors] = useState({});
  const [openMedSelectIndex, setOpenMedSelectIndex] = useState(null);
  const [medSearchTerm, setMedSearchTerm] = useState('');
  const medSelectRef = useRef(null);

  useEffect(() => {
    if (record) {
      setReferenceDate(record.referenceDate || new Date().toISOString().slice(0, 10));
      setObservation(record.observation || '');
      const existingMeds =
        record.medications?.map((m) => ({
          medicationId: m.medicationId || '',
          quantity: m.quantity || quantityOptions[0],
          value: m.value || '',
          recordMedId: m.recordMedId,
        })) || [];
      setMedications(
        existingMeds.length > 0
          ? existingMeds
          : [{ medicationId: '', quantity: quantityOptions[0], value: '' }]
      );
    } else {
      setReferenceDate(new Date().toISOString().slice(0, 10));
      setObservation('');
      setMedications([{ medicationId: '', quantity: quantityOptions[0], value: '' }]);
    }
    setErrors({});
  }, [record]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (medSelectRef.current && !medSelectRef.current.contains(event.target)) {
        setOpenMedSelectIndex(null);
        setMedSearchTerm(''); // Limpa a busca ao fechar
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredMedicationsList = useMemo(() => {
    // Se nenhum dropdown estiver aberto, ou não houver termo de busca, não filtre (ou mostre tudo)
    if (openMedSelectIndex === null || !medSearchTerm) {
      return medicationsList;
    }
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
    if (errors[`medications[${index}].${field}`]) {
      const newErr = { ...errors };
      delete newErr[`medications[${index}].${field}`];
      setErrors(newErr);
    }
    setMedications(newMeds);
  };

  const addMedicationField = () => {
    setMedications([...medications, { medicationId: '', quantity: quantityOptions[0], value: '' }]);
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
      handleMedicationChange(addingMedicationIndex, 'medicationId', newMed.id);
    }
    setIsMedicationModalOpen(false);
    setAddingMedicationIndex(null);
  };

  const validateRecordForm = () => {
    const newErrors = {};
    if (!referenceDate) newErrors.referenceDate = 'Data de referência é obrigatória.';
    const validMeds = medications.filter((m) => m.medicationId);
    if (validMeds.length === 0) {
      newErrors['medications[0].medicationId'] = 'Adicione pelo menos uma medicação.';
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formErrors = validateRecordForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    const validMedications = medications
      .filter((m) => m.medicationId && m.quantity)
      .map((m) => ({
        ...m,
        value: Number(m.value) || 0,
        recordMedId:
          m.recordMedId ||
          `rec-med-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      }));

    const totalValue = validMedications.reduce((sum, med) => sum + med.value, 0);

    const recordData = {
      id: record?.id,
      patientId: patient.id,
      professionalId,
      referenceDate,
      observation: observation.trim(),
      status: record?.status || 'Pendente',
      entryDate: record?.entryDate || new Date().toISOString(),
      deliveryDate: record?.deliveryDate || null,
      medications: validMedications,
      totalValue,
    };

    onSave(recordData);
    addToast?.(record ? 'Registro atualizado!' : 'Registro salvo!', 'success');
    onClose();
  };

  const formattedDate = (dateString) => {
    if (!dateString) return 'Data inválida';
    const [year, month, day] = dateString.slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <>
      <Modal onClose={onClose} modalClasses="max-w-6xl px-10">
        <div className="flex flex-col h-[90vh]">
          {/* Cabeçalho */}
          <div className="flex-shrink-0">
            <h2 className="text-2xl font-bold mb-4">
              {record ? `Editar Registro` : 'Novo Registro para'}{' '}
              <span className="text-blue-700 font-semibold">
                {patient?.name || 'Paciente'}
              </span>
            </h2>
          </div>

          {/* Conteúdo com rolagem */}
          <div className="flex-grow overflow-y-auto pr-2">
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

                {/* Scroll interno só nas medicações */}
                <div
                  className="overflow-y-auto max-h-[500px] space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200"
                  ref={medSelectRef}
                >
                  {medications.map((med, index) => {
                    const selectedMedName =
                      medicationsList.find((m) => m.id === med.medicationId)?.name || '';
                    
                    return (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-3 items-start bg-white p-3 rounded-lg shadow-sm border border-gray-200"
                      >
                        {/* Medicação (COMBOBOX) - ALTERADO */}
                        <div className="col-span-12 md:col-span-5"> {/* <-- Alterado de 4 para 5 */}
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
                                errors[`medications[${index}].medicationId`]
                                  ? 'border-red-500'
                                  : 'border-gray-300'
                              } bg-white`}
                            />

                            {openMedSelectIndex === index && (
                              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 flex flex-col">
                                <div className="overflow-y-auto">
                                  {/* 1. Lista de resultados */}
                                  {filteredMedicationsList.map((m) => (
                                    <div
                                      key={m.id}
                                      className="p-2 text-sm text-gray-800 hover:bg-blue-50 cursor-pointer"
                                      onClick={() => {
                                        handleMedicationChange(index, 'medicationId', m.id);
                                        setOpenMedSelectIndex(null);
                                        setMedSearchTerm('');
                                      }}
                                    >
                                      {m.name}
                                    </div>
                                  ))}
                                  
                                  {/* 2. Mensagem de 'Nenhum resultado' ou 'Digite' */}
                                  {filteredMedicationsList.length === 0 && (
                                    <p className="p-2 text-sm text-gray-500 text-center">
                                      {medSearchTerm ? `Nenhum resultado para "${medSearchTerm}".` : "Digite para buscar..."}
                                    </p>
                                  )}
                                  
                                  {/* 3. Botão de Cadastrar Novo */}
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

                        {/* Quantidade (ALINHADO) */}
                        <div className="col-span-4 md:col-span-3"> {/* <-- Mantido como 3 */}
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

                        {/* Valor (ALINHADO) - ALTERADO */}
                        <div className="col-span-4 md:col-span-2"> {/* <-- Alterado de 3 para 2 */}
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

                        {/* Remover (ALINHADO) */}
                        <div className="col-span-4 md:col-span-2"> {/* <-- Mantido como 2 */}
                          <label className="text-xs text-gray-600 mb-1 block">&nbsp;</label> {/* Label fantasma para alinhar */}
                          <button
                            type="button"
                            onClick={() => removeMedicationField(index)}
                            className="px-3 h-10 text-sm bg-red-100 text-red-700 rounded-md font-medium hover:bg-red-200 active:bg-red-300 cursor-pointer w-full md:w-auto"
                            disabled={medications.length <= 1}
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={addMedicationField}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md font-semibold hover:bg-blue-200 active:bg-blue-300 cursor-pointer"
                >
                  <span>+</span>
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
          <div className="flex-shrink-0 flex justify-end gap-4 bg-gray-50 -mx-8 px-8 py-4 rounded-b-lg border-t mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 active:bg-gray-100 font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 font-medium cursor-pointer"
            >
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