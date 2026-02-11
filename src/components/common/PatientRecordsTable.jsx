// src/components/common/PatientRecordsTable.jsx
import React from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { icons } from '../../utils/icons';

// --- HELPER BLINDADO PARA NOME DA MEDICAÇÃO ---
const getMedicationNameLocal = (medicationId, meds = []) => {
  if (!medicationId) return '-';

  // 1. Extrai o ID puro, caso venha dentro de um objeto
  const targetId = typeof medicationId === 'object' 
    ? (medicationId._id || medicationId.id) 
    : medicationId;

  if (!targetId) return 'Desconhecido';

  // 2. Converte para String para garantir a comparação (A MÁGICA É AQUI)
  const targetIdString = String(targetId);

  // 3. Busca na lista convertendo também os IDs da lista para String
  const found = meds.find((m) => 
    String(m._id) === targetIdString || String(m.id) === targetIdString
  );

  return found ? found.name : 'Desconhecido';
};

// --- HELPER BLINDADO PARA DATA ---
const formatDeliveryDate = (dateString) => {
  if (!dateString) return null;

  let date = new Date(dateString);

  // Se a data for inválida, tenta corrigir string YYYY-MM-DD
  if (isNaN(date.getTime())) {
      if (typeof dateString === 'string' && dateString.length === 10) {
          date = new Date(dateString + 'T00:00:00');
      } else {
          return '-';
      }
  }

  // Correção de Fuso Horário para visualização
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());

  return date.toLocaleDateString('pt-BR');
};

export function PatientRecordsTable({
  records = [],
  medications = [],
  onViewReason,
}) {
  if (!Array.isArray(records) || records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <span className="text-3xl mb-2 opacity-20">{icons.clipboard}</span>
        <p className="text-sm">Nenhum registro encontrado.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50/80 text-gray-500 font-medium uppercase tracking-wider text-[11px] border-b border-gray-100">
            <tr>
              <th className="py-3 px-3 pl-4">Data de Entrada</th>
              <th className="py-3 px-3">Data de Entrega</th>
              <th className="py-3 px-3">Medicações</th>
              <th className="py-3 px-3 pr-4 text-right">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {[...records]
              .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate))
              .map((record) => (
                <tr
                  key={record._id || record.id}
                  className="group hover:bg-blue-50/30 transition-colors duration-150 ease-in-out"
                >
                  {/* 1. Entrada */}
                  <td className="py-4 px-3 pl-4 align-middle text-gray-700">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800">
                        {record.entryDate
                          ? new Date(record.entryDate).toLocaleDateString('pt-BR')
                          : '--/--/--'}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {record.entryDate
                          ? new Date(record.entryDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                    </div>
                  </td>

                  {/* 2. Entrega */}
                  <td className="py-4 px-3 align-middle text-gray-600">
                    {record.deliveryDate ? (
                      <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-medium border border-green-100">
                        {formatDeliveryDate(record.deliveryDate)}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs italic">Pendente</span>
                    )}
                  </td>

                  {/* 3. Medicações */}
                  <td className="py-4 px-3 align-middle">
                    <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                      {Array.isArray(record.medications) && record.medications.length > 0 ? (
                        record.medications.map((m, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs border border-gray-200"
                          >
                            <span className="font-medium mr-1">
                              {/* Função blindada sendo usada aqui */}
                              {getMedicationNameLocal(m.medicationId, medications)}
                            </span>
                            {m.quantity && (
                              <span className="text-gray-400 text-[10px] border-l border-gray-300 pl-1 ml-1">
                                {m.quantity}
                              </span>
                            )}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs">N/A</span>
                      )}
                    </div>
                  </td>

                  {/* 4. Status */}
                  <td className="py-4 px-3 pr-4 align-middle text-right">
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={record.status} />
                      {record.status === 'Cancelado' && onViewReason && (
                        <button
                          onClick={() => onViewReason(record)}
                          className="mt-1 text-[11px] font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                        >
                          {icons.info} Ver Motivo
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}