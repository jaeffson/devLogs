// src/components/common/CancelRecordModal.jsx
// (ATUALIZADO: Adicionado ClipLoader e estado de isSubmitting)

import React, { useState } from 'react';
import { icons } from '../../utils/icons'; 
// NOVO: Importa o ClipLoader para o spinner
import { ClipLoader } from 'react-spinners'; 


// Este modal recebe:
// - record: O registro que está sendo cancelado
// - onClose: A função para fechar o modal (ex: setCancelingRecord(null))
// - onConfirm: A função que chama a API (ex: handleCancelRecordStatus)
// - getPatientNameById: (Opcional, mas recomendado) A função para mostrar o nome do paciente
export function CancelRecordModal({
  record,
  onClose,
  onConfirm,
  getPatientNameById,
}) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // NOVO: Estado de envio
  
  // O botão de confirmar é desabilitado se não houver motivo OU se estiver enviando
  const isConfirmDisabled = reason.trim() === '' || isSubmitting; 

  // Tenta pegar o nome do paciente, se a função for fornecida
  const patientName = getPatientNameById
    ? getPatientNameById(record.patientId)
    : `ID ${record.patientId}`;

  const handleConfirmClick = async () => { // Função assíncrona
    if (reason.trim() === '') return; // Re-check reason before submitting

    setIsSubmitting(true); // 1. Inicia o carregamento

    try {
        // 2. Aguarda a conclusão da API (onConfirm)
        await onConfirm(record._id || record.id, reason); 
        onClose(); // 3. Fecha o modal SÓ APÓS o sucesso
    } catch (error) {
        // Tratar erro (opcional: exibir um toast de erro)
        console.error("Erro ao cancelar registro:", error);
    } finally {
        // 4. Garante que o carregamento seja desativado, independente do resultado
        setIsSubmitting(false); 
    }
  };

  return (
    // Overlay escuro
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      onClick={onClose} 
    >
      {/* Conteúdo do Modal */}
      <div
        className="relative bg-white rounded-lg shadow-2xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Header (MANTIDO) */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">
            Justificar Cancelamento
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 transition-colors"
            title="Fechar"
            disabled={isSubmitting} // Desabilita fechar
          >
            <span className="w-5 h-5">
              {icons.close || (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </span>
          </button>
        </div>

        {/* Corpo (MANTIDO) */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            <span className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0">
              {icons.exclamation || (
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              )}
            </span>
            <span>
              Você está cancelando o registro de{' '}
              <strong className="font-semibold">{patientName}</strong>. A
              justificativa é obrigatória.
            </span>
          </div>

          <div>
            <label
              htmlFor="cancelReason"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Motivo do Cancelamento (Obrigatório)
            </label>
            <textarea
              id="cancelReason"
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ex: Erro de lançamento, falta de medicação, paciente não compareceu..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              autoFocus 
              disabled={isSubmitting} // Desabilita o input
            />
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex justify-end items-center gap-3 p-4 bg-gray-50 border-t rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting} // Desabilita o botão Voltar
          >
            Voltar
          </button>
          <button
            onClick={handleConfirmClick}
            disabled={isConfirmDisabled}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2" // Adicionado classes flex
          >
            {isSubmitting ? (
                <>
                    {/* Exibe o ClipLoader */}
                    <ClipLoader color="#ffffff" size={16} /> 
                    <span>Cancelando...</span>
                </>
            ) : (
                <span>Confirmar Cancelamento</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}