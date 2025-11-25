// src/components/common/AttendRecordModal.jsx
import React, { useState } from 'react';
import { Modal } from './Modal';
import { icons } from '../../utils/icons';

export default function AttendRecordModal({
  isOpen,
  onClose,
  record,
  onConfirm,
}) {
  // Estado para controlar o loader
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().slice(0, 16) // Padrão input datetime-local
  );
  const [observation, setObservation] = useState('');

  if (!isOpen) return null;

  const handleConfirm = async () => {
    // 1. Ativa o loader
    setIsSubmitting(true);

    try {
      // 2. Aguarda a conclusão da função onConfirm (que deve ser async ou retornar Promise)
      await onConfirm({
        recordId: record.id || record._id,
        deliveryDate,
        observation,
      });

      // 3. Se deu tudo certo (sem erro), fecha o modal automaticamente
      onClose();
      
    } catch (error) {
      console.error("Erro ao confirmar entrega:", error);
      // Aqui o loader vai parar (no finally) e o modal continua aberto para o usuário tentar de novo
    } finally {
      // 4. Desativa o loader independentemente do resultado
      setIsSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Confirmar Entrega de Medicação">
      <div className="space-y-4">
        <p className="text-gray-600">
          Você está confirmando a entrega para o paciente{' '}
          <span className="font-bold text-gray-800">{record?.patientName}</span>.
        </p>

        {/* Data da Entrega */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data/Hora da Entrega
          </label>
          <input
            type="datetime-local"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            disabled={isSubmitting}
            className="w-full p-2 border rounded border-gray-300 focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Observação */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observações (Opcional)
          </label>
          <textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            disabled={isSubmitting}
            className="w-full p-2 border rounded border-gray-300 focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Ex: Entregue para o filho do paciente..."
            rows="3"
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3 mt-6 border-t pt-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 active:bg-green-800 disabled:bg-green-400 disabled:cursor-not-allowed font-medium flex items-center gap-2 transition-colors min-w-[120px] justify-center"
          >
            {isSubmitting ? (
              <>
                {/* SVG Spinner de Carregamento */}
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Salvando...</span>
              </>
            ) : (
              <>
                {/* Ícone de Check normal */}
                <span className="w-5 h-5">{icons.check || '✓'}</span>
                <span>Confirmar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}