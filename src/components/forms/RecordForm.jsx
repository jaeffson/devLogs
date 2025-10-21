import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal'; // Importa Modal
import MedicationForm from './MedicationForm'; // Importa MedicationForm (se ainda não o fez)

// Constante movida para fora ou importada se usada em mais lugares
const quantityOptions = ['1 cx', '3 cxs', '1 tubo', '2 tubos', '1 cx com 60 comp'];

// Exportação Default
export default function RecordForm({
  patient,
  professionalId, // ID do usuário logado
  record, // Registro existente para edição (ou null para novo)
  onSave, // Função para salvar (recebe o objeto do registro)
  onClose, // Função para fechar o modal
  medicationsList = [], // Lista completa de medicações disponíveis
  onNewMedication, // Função para adicionar uma nova medicação à lista global
}) {
  const [referenceDate, setReferenceDate] = useState('');
  const [observation, setObservation] = useState('');
  const [medications, setMedications] = useState([{ medicationId: '', quantity: quantityOptions[0], value: '' }]);
  const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false);
  const [addingMedicationIndex, setAddingMedicationIndex] = useState(null);
  const [errors, setErrors] = useState({}); // Estado para erros

  // Carrega dados do registro ou define padrões ao abrir/mudar registro
  useEffect(() => {
    if (record) {
      setReferenceDate(record.referenceDate || new Date().toISOString().slice(0, 10));
      setObservation(record.observation || '');
      // Mapeia medicações existentes, garantindo que tenham todos os campos
      const existingMeds = record.medications?.map(m => ({
          medicationId: m.medicationId || '',
          quantity: m.quantity || quantityOptions[0],
          value: m.value || '',
          recordMedId: m.recordMedId // Mantém ID interno se houver
      })) || [];
      setMedications(existingMeds.length > 0 ? existingMeds : [{ medicationId: '', quantity: quantityOptions[0], value: '' }]);
    } else {
      // Padrões para novo registro
      setReferenceDate(new Date().toISOString().slice(0, 10));
      setObservation('');
      setMedications([{ medicationId: '', quantity: quantityOptions[0], value: '' }]);
    }
    setErrors({}); // Limpa erros
  }, [record]); // Roda quando 'record' (prop) muda


  const handleMedicationChange = (index, field, value) => {
    // Abre modal para nova medicação
    if (field === 'medicationId' && value === 'new') {
        setAddingMedicationIndex(index);
        setIsMedicationModalOpen(true);
        // Reseta o select para 'Selecione...' enquanto cadastra
        const newMedications = [...medications];
        newMedications[index][field] = '';
        setMedications(newMedications);
        return;
    }
    // Atualiza campo da medicação
    const newMedications = [...medications];
    newMedications[index][field] = value;
    // Limpa erro específico da linha/campo se houver
    if (errors[`medications[${index}].${field}`]) {
        setErrors(prev => {
            const next = {...prev};
            delete next[`medications[${index}].${field}`];
            return next;
        });
    }
    setMedications(newMedications);
  };

  const addMedicationField = () => {
      setMedications([...medications, { medicationId: '', quantity: quantityOptions[0], value: '' }]);
  };

  const removeMedicationField = (index) => {
      if(medications.length > 1) {
        setMedications(medications.filter((_, i) => i !== index));
        // Limpa erros relacionados a índices removidos (opcional, mas bom)
        setErrors(prev => {
            const next = {};
            Object.keys(prev).forEach(key => {
                if (!key.startsWith(`medications[${index}]`)) {
                    next[key] = prev[key];
                }
            });
            return next;
        });
      }
  };

  // Chamado quando o modal MedicationForm salva uma nova medicação
  const handleSaveNewMedication = (newMedData) => {
      // Chama a função passada por props para adicionar na lista global
      const newMed = typeof onNewMedication === 'function' ? onNewMedication(newMedData) : null;
      if (newMed && addingMedicationIndex !== null) {
          // Seleciona a medicação recém-criada no select
          handleMedicationChange(addingMedicationIndex, 'medicationId', newMed.id);
      }
      setIsMedicationModalOpen(false);
      setAddingMedicationIndex(null);
  };

  const validateRecordForm = () => {
    const newErrors = {};
    if (!referenceDate) {
        newErrors.referenceDate = 'Data de referência é obrigatória.';
    }
    // Valida se pelo menos uma medicação válida foi adicionada
    const validMeds = medications.filter(m => m.medicationId);
    if (validMeds.length === 0) {
        // Pode adicionar um erro geral ou marcar a primeira linha
        newErrors['medications[0].medicationId'] = 'Adicione pelo menos uma medicação.';
    } else {
        // Valida cada medicação adicionada
        medications.forEach((med, index) => {
            if (!med.medicationId) {
                newErrors[`medications[${index}].medicationId`] = 'Selecione uma medicação.';
            }
            // Adicione validação para quantidade ou valor se necessário
            // if (!med.quantity) newErrors[`medications[${index}].quantity`] = 'Quantidade obrigatória.';
            // if (med.value && isNaN(Number(med.value))) newErrors[`medications[${index}].value`] = 'Valor inválido.';
        });
    }
    return newErrors;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const formErrors = validateRecordForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    // Calcula valor total e filtra medicações válidas
    const validMedications = medications
       .filter(m => m.medicationId && m.quantity) // Garante que tem medicação e quantidade
       .map(m => ({
          ...m,
          // Garante que o valor seja número ou null/0
          value: Number(m.value) || 0,
          // Gera um ID interno único para cada item da medicação no registro
          recordMedId: m.recordMedId || `rec-med-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
       }));

    const totalValue = validMedications.reduce((sum, med) => sum + med.value, 0);

    const recordData = {
      id: record?.id, // Mantém ID se editando
      patientId: patient.id,
      professionalId, // ID do profissional que está criando/editando
      referenceDate,
      observation: observation.trim(),
      status: record?.status || 'Pendente', // Mantém status ou define como Pendente
      entryDate: record?.entryDate || new Date().toISOString(), // Mantém data de entrada ou define agora
      deliveryDate: record?.deliveryDate || null, // Mantém data de entrega se houver
      medications: validMedications, // Apenas medicações válidas
      totalValue // Valor total calculado
    };

    onSave(recordData);
    onClose();
  };

  return (
    <>
    {/* Modal principal do Registro */}
    <Modal onClose={onClose}>
        <h2 className="text-2xl font-bold mb-2">{record ? `Editar Registro` : 'Novo Registro para'} <span className="text-blue-600">{patient?.name || 'Paciente'}</span></h2>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Data de Referência */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-gray-700 font-medium mb-1" htmlFor={`rec-date-${record?.id || 'new'}`}>Data de Referência</label>
                    <input
                      type="date"
                      id={`rec-date-${record?.id || 'new'}`}
                      value={referenceDate}
                      onChange={e => setReferenceDate(e.target.value)}
                      className={`w-full p-2 border rounded ${errors.referenceDate ? 'border-red-500' : 'border-gray-300'}`}
                      required
                    />
                    {errors.referenceDate && <p className="text-red-500 text-xs mt-1">{errors.referenceDate}</p>}
                </div>
                {/* Pode adicionar mais campos aqui se necessário */}
            </div>

            {/* Seção de Medicações */}
            <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">Medicações</h3>
                {medications.map((med, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 mb-3 items-start border-b pb-3 last:border-b-0 last:pb-0"> {/* Separador e espaçamento */}
                        {/* Select Medicação */}
                        <div className="col-span-12 md:col-span-4">
                            <label className="text-xs text-gray-600 mb-1 block" htmlFor={`med-id-${index}`}>Medicação</label>
                            <select
                              id={`med-id-${index}`}
                              value={med.medicationId}
                              onChange={e => handleMedicationChange(index, 'medicationId', e.target.value)}
                              className={`w-full p-2 border rounded ${errors[`medications[${index}].medicationId`] ? 'border-red-500' : 'border-gray-300'} bg-white text-sm`}
                              required
                            >
                                <option value="" disabled>Selecione...</option>
                                {medicationsList.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                <option value="new" className="font-bold text-blue-600 italic">Cadastrar Nova...</option>
                            </select>
                            {errors[`medications[${index}].medicationId`] && <p className="text-red-500 text-xs mt-1">{errors[`medications[${index}].medicationId`]}</p>}
                        </div>
                        {/* Select Quantidade */}
                        <div className="col-span-6 md:col-span-3">
                            <label className="text-xs text-gray-600 mb-1 block" htmlFor={`med-qty-${index}`}>Quantidade</label>
                            <select
                              id={`med-qty-${index}`}
                              value={med.quantity}
                              onChange={e => handleMedicationChange(index, 'quantity', e.target.value)}
                              className="w-full p-2 border rounded border-gray-300 bg-white text-sm"
                            >
                                {quantityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                {/* Permitir digitar quantidade customizada? (requereria mudar para input) */}
                            </select>
                        </div>
                        {/* Input Valor */}
                        <div className="col-span-6 md:col-span-3">
                            <label className="text-xs text-gray-600 mb-1 block" htmlFor={`med-val-${index}`}>Valor (R$)</label>
                            <input
                              type="number"
                              id={`med-val-${index}`}
                              placeholder="0.00"
                              value={med.value}
                              onChange={e => handleMedicationChange(index, 'value', e.target.value)}
                              className={`w-full p-2 border rounded ${errors[`medications[${index}].value`] ? 'border-red-500' : 'border-gray-300'} text-sm`}
                              step="0.01" min="0"
                            />
                             {errors[`medications[${index}].value`] && <p className="text-red-500 text-xs mt-1">{errors[`medications[${index}].value`]}</p>}
                        </div>
                        {/* Botão Remover */}
                        <div className="col-span-12 md:col-span-2 flex items-end justify-end md:justify-start pt-2 md:pt-0">
                          <button
                            type="button"
                            onClick={() => removeMedicationField(index)}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs p-2 mt-4 md:mt-0"
                            disabled={medications.length <= 1}
                            title="Remover medicação"
                          >
                            Remover
                          </button>
                        </div>
                    </div>
                ))}
                <button type="button" onClick={addMedicationField} className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-semibold">+ Adicionar medicação</button>
            </div>

            {/* Observações Gerais */}
            <div>
              <label className="block text-gray-700 font-medium mb-1" htmlFor={`rec-obs-${record?.id || 'new'}`}>Observações Gerais</label>
              <textarea
                id={`rec-obs-${record?.id || 'new'}`}
                value={observation}
                onChange={e => setObservation(e.target.value)}
                className="w-full p-2 border rounded border-gray-300"
                rows="2"
                placeholder="Alguma observação sobre este registro específico..."
              ></textarea>
            </div>

            {/* Botões Finais */}
            <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar Registro</button>
            </div>
        </form>
    </Modal>

    {/* Modal para cadastrar nova medicação (renderizado condicionalmente) */}
    {isMedicationModalOpen && (
      <MedicationForm
        // Passa a função para salvar a nova medicação
        onSave={handleSaveNewMedication}
        // Passa a função para fechar este modal específico
        onClose={() => {
            setIsMedicationModalOpen(false);
            setAddingMedicationIndex(null);
            // Opcional: focar de volta no select?
        }}
        // Não passa 'medication' (é sempre novo)
        // Passe a prop para verificar duplicidade se implementada
      />
     )}
    </>
  );
}