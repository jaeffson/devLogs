import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { icons } from '../../utils/icons';

// Função auxiliar para pegar a data atual no formato YYYY-MM-DD
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function AttendRecordModal({
  record,
  onConfirm,
  onClose,
  getPatientName,
  getMedicationName, 
  isSaving,
}) {
  // Estado local para controlar o spinner
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Define a data inicial como hoje
  const today = getLocalDateString();
  const [deliveryDate, setDeliveryDate] = useState(today);

  // ID do registro para validação
  const recordId = record?._id || record?.id;

  // Atualiza a data sempre que o modal abre
  useEffect(() => {
    if (record) {
      setDeliveryDate(today);
      setIsSubmitting(false);
    }
  }, [record, today]);

  // Se não tiver registro, não mostra nada
  if (!record) return null;

  const patientName = typeof getPatientName === 'function'
    ? getPatientName(record.patientId)
    : (record.patientName || 'Paciente');

  const handleConfirmClick = async () => {
    if (!recordId || !deliveryDate) return;

    setIsSubmitting(true);

    try {
      // Executa a confirmação (espera a Promise se for async)
      await onConfirm({
        recordId,
        deliveryDate
      });
      // Fecha o modal após sucesso (opcional, depende se o pai fecha)
      onClose();
    } catch (error) {
      console.error("Erro ao confirmar:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Combina loading do pai (isSaving) com loading local (isSubmitting)
  const isLoading = isSaving || isSubmitting;

  return (
    <Modal onClose={onClose} title="Confirmar Entrega">
      <div className="space-y-4">
        
        {/* Info do Paciente */}
        <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
          <p className="text-sm text-blue-800">
            Confirmar entrega para: <span className="font-bold">{patientName}</span>
          </p>
        </div>

        {/* Lista de Medicações DO REGISTRO (Lógica original restaurada) */}
        {record.medications && record.medications.length > 0 && (
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Medicações Solicitadas:
            </h4>
            <ul className="space-y-2">
              {record.medications.map((item, index) => {
                // Tenta pegar o nome pela função ou usa o que já está no item
                const name = getMedicationName 
                  ? getMedicationName(item.medicationId) 
                  : (item.medicationName || 'Medicação');
                
                return (
                  <li key={index} className="flex justify-between text-sm">
                    <span className="text-gray-700 font-medium">{name}</span>
                    <span className="text-gray-500 bg-white px-2 rounded border border-gray-200 text-xs flex items-center">
                      {item.quantity}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Input de Data */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data da Entrega
          </label>
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            disabled={isLoading}
            max={today} 
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">
            Aviso: Não é permitido selecionar datas futuras.
          </p>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 font-medium text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={!deliveryDate || !recordId || isLoading}
            className={`
              px-4 py-2 rounded-md font-medium text-sm text-white flex items-center justify-center gap-2 min-w-[120px] transition-all
              ${isLoading 
                ? 'bg-green-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 active:bg-green-800 cursor-pointer'}
            `}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <span className="w-4 h-4">{icons.check || '✓'}</span>
                <span>Confirmar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}