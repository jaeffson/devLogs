// src/components/common/PatientRecordsTable.jsx
import React from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { icons } from '../../utils/icons';

// --- 1. FUNÇÃO BLINDADA PARA DATA (A MESMA QUE FUNCIONOU NO DASHBOARD) ---
const formatDeliveryDate = (dateString) => {
  if (!dateString) return '-';

  // Transforma em texto
  const str = String(dateString);

  // 1. Se tiver "T" (ex: 2026-02-11T00:00:00), pega só a primeira parte
  const cleanDate = str.includes('T') ? str.split('T')[0] : str;

  // 2. Se não tiver traço (formato inválido), retorna como veio
  if (!cleanDate.includes('-')) return '-';

  // 3. Monta manualmente dia/mês/ano (Zero fuso horário = Zero erro)
  const [year, month, day] = cleanDate.split('-');
  return `${day}/${month}/${year}`;
};

// --- HELPER PARA NOME DA MEDICAÇÃO ---
const getMedicationNameLocal = (medicationId, meds = []) => {
  if (!medicationId) return '-';
  const targetId =
    typeof medicationId === 'object'
      ? medicationId._id || medicationId.id
      : medicationId;

  if (!targetId) return 'Desconhecido';
  const targetIdString = String(targetId);

  const found = meds.find(
    (m) => String(m._id) === targetIdString || String(m.id) === targetIdString
  );

  return found ? found.name : 'Desconhecido';
};

// --- HELPER PARA DATA DE ENTRADA (MANTIDO COM FUSO BRASIL) ---
// Entrada geralmente tem hora, então usamos o fuso.
const getFormattedEntryDate = (dateString) => {
  if (!dateString) return { date: '--/--/--', time: '' };
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return { date: 'Inválido', time: '' };

  return {
    date: date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    time: date.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
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
                    {(() => {
                      const { date, time } = getFormattedEntryDate(
                        record.entryDate
                      );
                      return (
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800">
                            {date}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {time}
                          </span>
                        </div>
                      );
                    })()}
                  </td>

                  {/* 2. Entrega (AGORA BLINDADA) */}
                  <td className="py-4 px-3 align-middle text-gray-600">
                    {record.deliveryDate ? (
                      <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-medium border border-green-100">
                        {/* Chama a nova função aqui */}
                        {formatDeliveryDate(record.deliveryDate)}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs italic">
                        Pendente
                      </span>
                    )}
                  </td>

                  {/* 3. Medicações */}
                  <td className="py-4 px-3 align-middle">
                    <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                      {Array.isArray(record.medications) &&
                      record.medications.length > 0 ? (
                        record.medications.map((m, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs border border-gray-200"
                          >
                            <span className="font-medium mr-1">
                              {getMedicationNameLocal(
                                m.medicationId,
                                medications
                              )}
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
