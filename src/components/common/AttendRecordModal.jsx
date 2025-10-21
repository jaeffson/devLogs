import React, { useState } from 'react';
import { Modal } from './Modal'; // Importa Modal

// Exportação nomeada
export default function AttendRecordModal({ record, onConfirm, onClose, getPatientName }) {
    // Inicializa com a data atual ou a data de referência do registro se já existir
    const initialDate = record?.referenceDate || new Date().toISOString().slice(0, 10);
    const [deliveryDate, setDeliveryDate] = useState(initialDate);

    // Garante que getPatientName seja uma função antes de chamar
    const patientName = typeof getPatientName === 'function' ? getPatientName(record?.patientId) : 'Paciente desconhecido';

    return (
        <Modal onClose={onClose}>
            <h2 className="text-xl font-semibold mb-4">Confirmar Atendimento</h2>
            <p className="mb-4">Confirme ou ajuste a data de entrega para o paciente <strong>{patientName}</strong> (Ref: {new Date(initialDate + 'T00:00:00').toLocaleDateString('pt-BR')}).</p>
            <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-1">Data da Entrega</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  className="w-full p-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  // Define um mínimo (opcional, ex: data de referência) e máximo (data atual)
                  min={record?.referenceDate}
                  max={new Date().toISOString().slice(0, 10)}
                />
            </div>
            <div className="flex justify-end gap-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
                <button
                  type="button"
                  onClick={() => {
                      if (record?.id && deliveryDate) { // Verifica se tem ID e data
                          onConfirm(record.id, deliveryDate);
                          onClose();
                      } else {
                          // Adicionar feedback de erro se necessário
                          console.error("ID do registro ou data de entrega ausente.");
                      }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={!deliveryDate} // Desabilita se não houver data
                >
                    Confirmar
                </button>
            </div>
        </Modal>
    )
}