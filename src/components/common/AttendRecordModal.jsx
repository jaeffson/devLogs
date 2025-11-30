// src/components/common/AttendRecordModal.jsx
// (ATUALIZADO: Corrigido bug de fuso horário na data 'today')

import React, { useState } from 'react';
import { Modal } from './Modal';
import { icons } from '../../utils/icons';

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};
// --- (FIM DA CORREÇÃO) ---

export function AttendRecordModal({
  record,
  onConfirm,
  onClose,
  getPatientName,
  medications, 
  getMedicationName, 
  isSaving,
}) {

  // --- (INÍCIO DA CORREÇÃO) ---
  // Usa a nova função para definir 'today'
  const today = getLocalDateString(); 
  // --- (FIM DA CORREÇÃO) ---
  
  const recordId = record?._id; 
  const [deliveryDate, setDeliveryDate] = useState(today); 

  const patientName =
    typeof getPatientName === 'function'
      ? getPatientName(record?.patientId)
      : 'Paciente desconhecido';

  const handleConfirmClick = () => {
    if (!isSaving && recordId && deliveryDate) { 
      onConfirm(recordId, deliveryDate);
    } else if (!recordId || !deliveryDate) {
      alert('Erro: ID do registro ausente ou data de entrega inválida.');
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 mb-4">
        <span className="w-6 h-6 text-green-600">
            {icons.check}
        </span>
        <h2 className="text-lg font-semibold text-gray-800">
          Confirmar Atendimento
        </h2>
      </div>

      <div className="mb-4 space-y-2 text-sm">
        <p>
          Paciente: <strong className="text-gray-700">{patientName}</strong>
        </p>
        
        <div>
          <h4 className="font-medium text-gray-700 mb-1">
            Medicações Registradas:
          </h4>
          {typeof getMedicationName === 'function' &&
          Array.isArray(medications) ? (
            <ul className="list-disc list-inside text-gray-600 space-y-1 pl-1 max-h-32 overflow-y-auto border rounded p-2 bg-gray-50 text-xs">
              {record?.medications?.length > 0 ? (
                record.medications.map((medItem, index) => (
                  <li key={medItem.recordMedId || index}>
                    {getMedicationName(medItem.medicationId, medications) ||
                      `ID ${medItem.medicationId} não encontrado`}
                    {medItem.quantity && ` (${medItem.quantity})`}
                  </li>
                ))
              ) : (
                <li className="text-gray-500 italic">Nenhuma medicação.</li>
              )}
            </ul>
          ) : (
            <p className="text-red-500 text-xs">
              Erro: Dados de medicação indisponíveis.
            </p> 
          )}
        </div>
      </div>
      <div className="mb-6">
        <label
          htmlFor="deliveryDateAttended"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Confirmar Data da Entrega
        </label>
        <input
          id="deliveryDateAttended"
          type="date"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          className="w-full p-2 border rounded border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
          max={today} 
          required
        />
        
        <p className="text-xs text-gray-500 mt-1">
          Aviso: Não é permitido selecionar datas futuras.
        </p>

      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 font-medium text-sm transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSaving}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirmClick}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium text-sm transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center justify-center gap-2"
          disabled={!deliveryDate || !recordId || isSaving}
        >
          {isSaving ? (
            <span className="w-5 h-5 animate-spin">{icons.spinner}</span>
          ) : (
            <span className="w-5 h-5">{icons.check}</span>
          )}
          {isSaving ? 'Confirmando...' : 'Confirmar Entrega'}
        </button>
      </div>
    </Modal>
  );
}