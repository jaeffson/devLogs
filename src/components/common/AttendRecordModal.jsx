// src/components/common/AttendRecordModal.jsx
import React, { useState } from 'react';
import { Modal } from './Modal';

export function AttendRecordModal({
  record,
  onConfirm,
  onClose,
  getPatientName,
  medications, // <-- Prop recebida
  getMedicationName, // <-- Prop recebida
}) {
  const today = new Date().toISOString().slice(0, 10);
  const initialDate = record?.referenceDate || today; // Data de referência OU hoje
  const [deliveryDate, setDeliveryDate] = useState(today); // Padrão: HOJE

  const patientName =
    typeof getPatientName === 'function'
      ? getPatientName(record?.patientId)
      : 'Paciente desconhecido';

  const handleConfirmClick = () => {
    if (record?.id && deliveryDate) {
      console.log(
        `[AttendRecordModal] Confirmando Atendimento para Record ID: ${record.id}, Data: ${deliveryDate}`
      ); // Debug
      onConfirm(record.id, deliveryDate);
      // onClose(); // O onConfirm já deve fechar
    } else {
      console.error('ID do registro ou data de entrega ausente.');
      // Idealmente, usar addToast aqui se fosse passado como prop
      alert('Erro: Selecione uma data de entrega válida.');
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
        Confirmar Atendimento
      </h2>
      <div className="mb-4 space-y-2 text-sm">
        <p>
          Paciente: <strong className="text-gray-700">{patientName}</strong>
        </p>
        <p>
          Data Ref.:{' '}
          <strong className="text-gray-700">
            {new Date(initialDate + 'T00:00:00').toLocaleDateString('pt-BR')}
          </strong>
        </p>
        <div>
          <h4 className="font-medium text-gray-700 mb-1">
            Medicações Registradas:
          </h4>
          {/* Verifica se as props necessárias existem */}
          {typeof getMedicationName === 'function' &&
          Array.isArray(medications) ? (
            <ul className="list-disc list-inside text-gray-600 space-y-1 pl-1 max-h-32 overflow-y-auto border rounded p-2 bg-gray-50 text-xs">
              {record?.medications?.length > 0 ? (
                record.medications.map((medItem, index) => (
                  <li key={medItem.recordMedId || index}>
                    {/* Uso correto das props */}
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
            </p> // Mensagem de erro se props faltarem
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
          className="w-full p-2 border rounded border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          max={today}
          required
        />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 font-medium text-sm transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirmClick}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium text-sm transition-colors"
          disabled={!deliveryDate}
        >
          Confirmar Entrega
        </button>
      </div>
    </Modal>
  );
}
