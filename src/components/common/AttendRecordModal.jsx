// src/components/common/AttendRecordModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { icons } from '../../utils/icons';

export  function AttendRecordModal({
  isOpen,         // Pode vir como isOpen ou apenas renderizado condicionalmente
  onClose,
  record,
  onConfirm,
  getPatientName, // Mantendo compatibilidade com seu código
  isSaving,       // Mantendo compatibilidade (mas vamos usar o estado interno)
}) {
  // Estado local para controlar o carregamento (Spinner)
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados do formulário
  const [deliveryDate, setDeliveryDate] = useState('');
  const [observation, setObservation] = useState('');

  // Pega o nome do paciente de forma segura (usando sua prop ou o objeto record)
  const patientName = typeof getPatientName === 'function' 
    ? getPatientName(record?.patientId) 
    : (record?.patientName || 'Paciente');

  // Inicializa os dados quando o modal abre ou o registro muda
  useEffect(() => {
    if (record) {
      // Define data/hora atual ajustada para o fuso horário local (para input datetime-local)
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setDeliveryDate(now.toISOString().slice(0, 16));
      
      setObservation('');
      setIsSubmitting(false);
    }
  }, [record, isOpen]);

  // Se não houver registro, não renderiza nada (proteção)
  if (!record) return null;

  const handleConfirm = async () => {
    if (!deliveryDate) return; // Validação básica

    // 1. Ativa o loading
    setIsSubmitting(true);

    try {
      // 2. Chama a função do pai e ESPERA (await) ela terminar
      // O 'recordId' é passado garantindo que pegamos o _id ou id
      await onConfirm({
        recordId: record._id || record.id,
        deliveryDate,
        observation,
      });

      // 3. Se o pai não der erro, fechamos o modal
      onClose();
      
    } catch (error) {
      console.error("Erro ao confirmar entrega:", error);
      // Se der erro, o modal continua aberto para o usuário tentar de novo
    } finally {
      // 4. Desativa o loading (caso o modal não tenha fechado ou tenha dado erro)
      setIsSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Confirmar Entrega">
      <div className="space-y-5">
        
        {/* Mensagem de Confirmação */}
        <div className="bg-blue-50 p-3 rounded-md border border-blue-100 flex items-start gap-3">
          <span className="text-blue-600 mt-0.5 w-5 h-5 flex-shrink-0">{icons.info}</span>
          <p className="text-sm text-blue-800">
            Você está registrando a entrega de medicação para:<br/>
            <span className="font-bold text-lg block mt-1">{patientName}</span>
          </p>
        </div>

        {/* Campo: Data/Hora */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data e Hora da Entrega
          </label>
          <input
            type="datetime-local"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            disabled={isSubmitting || isSaving}
            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-500 outline-none transition-all"
          />
        </div>

        {/* Campo: Observações */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observações (Opcional)
          </label>
          <textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            disabled={isSubmitting || isSaving}
            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 outline-none transition-all resize-none"
            placeholder="Ex: Entregue para o filho(a)..."
            rows="3"
          />
        </div>

        {/* Rodapé com Botões */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isSaving}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || isSaving || !deliveryDate}
            className={`
              px-4 py-2 rounded-md font-medium text-white flex items-center justify-center gap-2 min-w-[140px] transition-all shadow-sm
              ${(isSubmitting || isSaving)
                ? 'bg-green-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 active:bg-green-800 cursor-pointer'}
            `}
          >
            {(isSubmitting || isSaving) ? (
              <>
                {/* SVG Spinner */}
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <span className="w-5 h-5">{icons.check}</span>
                <span>Confirmar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}