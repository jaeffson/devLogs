// src/components/common/PatientRecordsTable.jsx
import React from 'react';
import { StatusBadge } from './StatusBadge';

// Helper interno (Compara ID como string)
const getMedicationNameLocal = (medicationId, meds = []) => {
  return meds.find((m) => m.id === medicationId)?.name || 'ID Inválido';
};

// Função para formatar a Data de Referência com segurança (YYYY-MM-DD -> DD/MM/YYYY)
const formatDateRef = (dateStr) => {
  if (!dateStr) return '---';

  // Pega a string de data (ex: 2025-10-30T03:00:00.000Z) e isola YYYY-MM-DD
  const isoDatePart = dateStr.slice(0, 10);

  // Cria um novo objeto Date forçando a leitura como data local (T00:00:00) para evitar fuso horário
  return new Date(isoDatePart + 'T00:00:00').toLocaleDateString('pt-BR');
};

// Exportação nomeada
export function PatientRecordsTable({ records = [], medications = [] }) {
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
                {/* 🚨 APLICAÇÃO DA CORREÇÃO: Usa a função segura */}
                <td className="py-2 px-3">
                  {formatDateRef(record.referenceDate)}
                </td>

                {/* Entrada (data e hora) */}
                <td className="py-2 px-3 text-gray-700">
                  {record.entryDate
                    ? new Date(record.entryDate).toLocaleString('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })
                    : '---'}
                </td>
                {/* Entrega (data e hora) */}
                <td className="py-2 px-3 text-gray-700">
                  {record.deliveryDate
                    ? new Date(record.deliveryDate).toLocaleString('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })
                    : '---'}
                </td>

                {/* Medicações */}
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
                {/* Status */}
                <td className="py-2 px-3">
                  <StatusBadge status={record.status} />
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
