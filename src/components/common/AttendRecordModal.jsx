// src/components/common/AttendRecordModal.jsx
// (ATUALIZADO: Corrigido bug de fuso horário na data 'today')

import React, { useState } from 'react';
import { Modal } from './Modal';
import { ClipLoader } from 'react-spinners';
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
    <Modal onClose={onClose} modalClasses="max-w-md">
      <div className="flex items-center gap-3 pb-6 border-b-2 border-green-100 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <span className="w-6 h-6 text-green-600">{icons.check}</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          Confirmar Atendimento
        </h2>
      </div>

      <div className="mb-6 space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-gray-900">Paciente:</span> {patientName}
          </p>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 text-sm">
            Medicações Registradas:
          </h4>
          {typeof getMedicationName === 'function' &&
          Array.isArray(medications) ? (
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {record?.medications?.length > 0 ? (
                record.medications.map((medItem, index) => (
                  <li key={medItem.recordMedId || index} className="flex items-start gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100 text-sm">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    <span className="text-gray-800">
                      {getMedicationName(medItem.medicationId, medications) ||
                        `ID ${medItem.medicationId} não encontrado`}
                      {medItem.quantity && <span className="text-gray-500 ml-1">({medItem.quantity})</span>}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 italic text-sm bg-gray-50 rounded-lg p-3 border border-gray-100">Nenhuma medicação registrada.</li>
              )}
            </ul>
          ) : (
            <p className="text-red-600 text-sm font-medium bg-red-50 rounded-lg p-3 border border-red-100">
              Erro: Dados de medicação indisponíveis.
            </p> 
          )}
        </div>
      </div>
      <div className="mb-6">
        <label
          htmlFor="deliveryDateAttended"
          className="block text-sm font-semibold text-gray-900 mb-2"
        >
          Data de Entrega
        </label>
        <input
          id="deliveryDateAttended"
          type="date"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm font-medium transition-all bg-white"
          max={today} 
          disabled={isSaving}
          required
        />
        
        <p className="text-xs text-gray-500 mt-2">
          ℹ️ Não é permitido selecionar datas futuras.
        </p>

      </div>

      <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold text-sm transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSaving}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirmClick}
          className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 font-semibold text-sm transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center justify-center gap-2 shadow-lg"
          disabled={!deliveryDate || !recordId || isSaving}
        >
          {isSaving ? (
            <>
              <ClipLoader color="#ffffff" size={16} />
              <span>Confirmando...</span>
            </>
          ) : (
            <>
              <span className="w-5 h-5">{icons.check}</span>
              <span>Confirmar Entrega</span>
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}