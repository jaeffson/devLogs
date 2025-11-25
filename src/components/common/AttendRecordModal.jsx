// src/components/common/AttendRecordModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { icons } from '../../utils/icons';

export function AttendRecordModal({
  record,
  onConfirm,
  onClose,
  getPatientName,
  medications = [], // Lista de medicações
  getMedicationName,
  isSaving, // Prop original (mantida por compatibilidade)
}) {
  // 1. Estado local para o Spinner
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 2. Data de hoje formatada para o input datetime-local
  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [deliveryDate, setDeliveryDate] = useState('');
  const [observation, setObservation] = useState('');

  // Atualiza estados quando o modal abre
  useEffect(() => {
    if (record) {
      setDeliveryDate(getLocalDateString());
      setObservation('');
      setIsSubmitting(false);
    }
  }, [record]);

  if (!record) return null;

  const patientName = typeof getPatientName === 'function'
    ? getPatientName(record.patientId)
    : (record.patientName || 'Paciente');

  // 3. Função de Confirmação com Async/Await
  const handleConfirmClick = async () => {
    if (!deliveryDate) return;

    setIsSubmitting(true); // Ativa spinner

    try {
      // Chama a função do pai e espera terminar
      await onConfirm({
        recordId: record._id || record.id,
        deliveryDate,
        observation
      });
      // Se der certo, o modal será fechado pelo pai ou por aqui se quiser
      // onClose(); 
    } catch (error) {
      console.error("Erro ao confirmar:", error);
    } finally {
      setIsSubmitting(false); // Desativa spinner
    }
  };

  // Define se está carregando (pela prop pai ou estado local)
  const isLoading = isSaving || isSubmitting;

  return (
    <Modal onClose={onClose} title="Confirmar Entrega">
      <div className="space-y-5">
        
        {/* Bloco de Informação do Paciente */}
        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
          <p className="text-sm text-blue-800 mb-1">Paciente:</p>
          <p className="text-lg font-bold text-blue-900">{patientName}</p>
        </div>

        {/* --- LISTA DE MEDICAÇÕES (RESTAURADA) --- */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span className="text-gray-500">{icons.pill || '💊'}</span>
            Medicações a Entregar:
          </h4>
          <div className="bg-gray-50 rounded-md border border-gray-200 max-h-40 overflow-y-auto">
            {medications && medications.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {medications.map((med, idx) => {
                  const medName = getMedicationName 
                    ? getMedicationName(med.medicationId) 
                    : (med.medicationName || 'Medicação');
                  return (
                    <li key={idx} className="px-3 py-2 text-sm flex justify-between items-center">
                      <span className="font-medium text-gray-700">{medName}</span>
                      <span className="bg-white px-2 py-0.5 rounded border text-gray-600 text-xs">
                        {med.quantity}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="p-3 text-sm text-gray-500 italic">Nenhuma medicação listada.</p>
            )}
          </div>
        </div>

        {/* Campo: Data da Entrega */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data/Hora da Entrega
          </label>
          <input
            type="datetime-local"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            disabled={isLoading}
            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
        </div>

        {/* Campo: Observação */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observações (Opcional)
          </label>
          <textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            disabled={isLoading}
            placeholder="Quem recebeu? Alguma observação?"
            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 outline-none resize-none"
            rows="2"
          />
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleConfirmClick}
            disabled={isLoading || !deliveryDate}
            className={`
              px-4 py-2 rounded-md font-medium text-white flex items-center justify-center gap-2 min-w-[130px] transition-all
              ${(isLoading)
                ? 'bg-green-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 active:bg-green-800'}
            `}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <span>{icons.check}</span>
                <span>Confirmar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}