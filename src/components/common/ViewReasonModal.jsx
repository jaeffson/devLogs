// src/components/common/ViewReasonModal.jsx
// (ESTE É UM NOVO ARQUIVO)

import React from 'react';
import { Modal } from './Modal'; // Importa seu modal base
import { icons } from '../../utils/icons'; // Importa seus ícones

export function ViewReasonModal({ record, onClose, getPatientNameById }) {
  
  // Garante que temos um registro antes de tentar acessá-lo
  if (!record) return null;

  const patientName = getPatientNameById
    ? getPatientNameById(record.patientId)
    : `ID ${record.patientId}`;

  const reason = record.cancelReason || "Nenhum motivo fornecido.";

  return (
    // Usa o Modal base para a estrutura
    <Modal onClose={onClose}>
      {/* Cabeçalho */}
      <div className="flex items-center pb-4 border-b border-gray-200 mb-4">
        <span className="w-6 h-6 text-blue-600 mr-3">
            {icons.info}
        </span>
        <h2 className="text-lg font-semibold text-gray-800">
          Motivo do Cancelamento
        </h2>
      </div>

      {/* Conteúdo */}
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          Registro do paciente: <strong className="text-gray-900">{patientName}</strong>
        </p>
        
        {/* Caixa de citação para o motivo */}
        <blockquote className="bg-gray-50 border-l-4 border-gray-300 p-4 rounded-r-lg">
          <p className="text-gray-700 italic">
            "{reason}"
          </p>
        </blockquote>
      </div>

      {/* Rodapé */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm transition-colors"
        >
          Fechar
        </button>
      </div>
    </Modal>
  );
}