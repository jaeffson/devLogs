// src/components/common/AttendRecordModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { icons } from '../../utils/icons';

// Função auxiliar para data (mantendo sua lógica original)
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export function AttendRecordModal({
  record,
  onConfirm,
  onClose,
  getPatientName,
  medications = [], // Lista de medicações
  getMedicationName, 
  isSaving, // Prop vinda do pai
}) {
  // Estado local para controlar o spinner interno
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [deliveryDate, setDeliveryDate] = useState('');
  const [observation, setObservation] = useState('');

  // Inicializa os dados ao abrir o modal
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

  // Lógica de confirmação com suporte a async/await para o spinner
  const handleConfirmClick = async () => {
    if (!deliveryDate) return;

    setIsSubmitting(true); // Ativa o spinner

    try {
      // Chama a função original passando os dados
      await onConfirm({
        recordId: record._id || record.id,
        deliveryDate,
        observation
      });
      // Nota: Não fechamos o modal aqui, deixamos o pai controlar ou fechar após sucesso
    } catch (error) {
      console.error("Erro ao confirmar:", error);
    } finally {
      setIsSubmitting(false); // Desativa o spinner se der erro
    }
  };

  // O botão fica em loading se o pai disser (isSaving) ou se o estado local disser (isSubmitting)
  const isLoading = isSaving || isSubmitting;

  return (
    <Modal onClose={onClose} title="Confirmar Entrega">
      <div className="space-y-4">
        
        {/* 1. Informações do Paciente */}
        <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
          <p className="text-sm text-blue-800">
            Confirmar entrega para: <span className="font-bold">{patientName}</span>
          </p>
        </div>

        {/* 2. Lista de Medicações (Mantendo a lógica de exibição) */}
        {medications && medications.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Medicações:</h4>
            <div className="bg-gray-50 rounded border border-gray-200 max-h-32 overflow-y-auto">
              <ul className="divide-y divide-gray-200">
                {medications.map((med, idx) => {
                  const medName = getMedicationName 
                    ? getMedicationName(med.medicationId) 
                    : (med.medicationName || 'Medicação');
                  return (
                    <li key={idx} className="px-3 py-2 text-sm flex justify-between items-center">
                      <span className="text-gray-700">{medName}</span>
                      <span className="bg-white px-2 py-0.5 rounded border text-xs font-medium text-gray-600">
                        {med.quantity}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        {/* 3. Input de Data */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data/Hora da Entrega
          </label>
          <input
            type="datetime-local"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            disabled={isLoading}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>

        {/* 4. Input de Observação */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observações (Opcional)
          </label>
          <textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            disabled={isLoading}
            placeholder="Ex: Entregue para familiar..."
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none resize-none"
            rows="2"
          />
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 font-medium text-sm transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isLoading || !deliveryDate}
            className={`
              px-4 py-2 rounded-md font-medium text-white text-sm flex items-center justify-center gap-2 min-w-[120px] transition-colors
              ${isLoading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}
            `}
          >
            {isLoading ? (
              <>
                {/* SPINNER AQUI */}
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <span>{icons.check || '✓'}</span>
                <span>Confirmar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}