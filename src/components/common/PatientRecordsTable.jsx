// src/components/common/PatientRecordsTable.jsx

import React from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { icons } from '../../utils/icons'; 

// Helper interno (Compara ID como string)
const getMedicationNameLocal = (medicationId, meds = []) => {
  return meds.find((m) => m.id === medicationId)?.name || 'ID Inválido';
};

// Função para formatar a Data de Referência com segurança (YYYY-MM-DD -> DD/MM/YYYY)
const formatDateRef = (dateStr) => {
  if (!dateStr) return '---';
  const isoDatePart = dateStr.slice(0, 10);
  return new Date(isoDatePart + 'T00:00:00').toLocaleDateString('pt-BR');
};

export function PatientRecordsTable({ records = [], medications = [], onViewReason }) {
  if (!Array.isArray(records) || records.length === 0) {
    return (
      <p className="text-gray-500 mt-4 text-center">
        Nenhum registro encontrado para este paciente.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto mt-4">
      <table className="min-w-full bg-white text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left py-2 px-3 font-semibold text-gray-600">
              Data Ref.
            </th>
            <th className="text-left py-2 px-3 font-semibold text-gray-600">
              Entrada
            </th>
            <th className="text-left py-2 px-3 font-semibold text-gray-600">
              Entrega
            </th>
            <th className="text-left py-2 px-3 font-semibold text-gray-600">
              Medicações
            </th>
            <th className="text-left py-2 px-3 font-semibold text-gray-600">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {[...records]
            .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate))
            .map((record) => (
              <tr key={record.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-3">
                  {formatDateRef(record.referenceDate)}
                </td>
                <td className="py-2 px-3 text-gray-700">
                  {record.entryDate
                    ? new Date(record.entryDate).toLocaleString('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })
                    : '---'}
                </td>
                <td className="py-2 px-3 text-gray-700">
                  {record.deliveryDate
                    ? new Date(record.deliveryDate).toLocaleString('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })
                    : '---'}
                </td>
                <td className="py-2 px-3 text-gray-700">
                  {Array.isArray(record.medications)
                    ? record.medications
                        .map(
                          (m) =>
                            `${getMedicationNameLocal(m.medicationId, medications)} (${m.quantity || 'N/A'})`
                        )
                        .join(', ')
                    : 'N/A'}
                </td>
                
                <td className="py-2 px-3">
                  <StatusBadge status={record.status} />
                  {record.status === 'Cancelado' && onViewReason && (
                    <button
                      onClick={() => onViewReason(record)}
                      className="mt-1 text-xs text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                      title="Ver motivo do cancelamento"
                    >
                      <span className="w-4 h-4">{icons.info}</span>
                      (Ver Motivo)
                    </button>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}