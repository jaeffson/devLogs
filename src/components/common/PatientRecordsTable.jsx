// src/components/common/PatientRecordsTable.jsx
import React from 'react';
import { StatusBadge } from './StatusBadge';
// Importe se você moveu para utils
 import { getMedicationName } from '../../utils/helpers';

// Helper interno
const getMedicationNameLocal = (medicationId, meds = []) => {
   const idToFind = Number(medicationId);
   return meds.find(m => m.id === idToFind)?.name || 'Desconhecida';
};

// Exportação nomeada
export function PatientRecordsTable({ records = [], medications = [] }) {
    if (!Array.isArray(records) || records.length === 0) { // Verifica se é array
        return <p className="text-gray-500 mt-4 text-center">Nenhum registro encontrado para este paciente.</p>
    }

    return (
        <div className="overflow-x-auto mt-4">
            <table className="min-w-full bg-white text-sm">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="text-left py-2 px-3 font-semibold text-gray-600">Data Ref.</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-600">Entrada</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-600">Entrega</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-600">Medicações</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-600">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Ordena por data de entrada mais recente */}
                    {[...records].sort((a,b) => new Date(b.entryDate) - new Date(a.entryDate)).map(record => (
                        <tr key={record.id} className="border-b hover:bg-gray-50">
                            {/* Data Ref (apenas data) */}
                            <td className="py-2 px-3">{record.referenceDate ? new Date(record.referenceDate + 'T00:00:00').toLocaleDateString('pt-BR') : '---'}</td>
                            {/* Entrada (data e hora) - CORRIGIDO */}
                            <td className="py-2 px-3 text-gray-700">{record.entryDate ? new Date(record.entryDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short'}) : '---'}</td>
                            {/* Entrega (data e hora) - CORRIGIDO */}
                            <td className="py-2 px-3 text-gray-700">{record.deliveryDate ? new Date(record.deliveryDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short'}) : '---'}</td>
                            {/* Medicações */}
                            <td className="py-2 px-3 text-gray-700">
                                {/* Garante que record.medications é um array antes de mapear */}
                                {Array.isArray(record.medications) ? record.medications.map(m => `${getMedicationNameLocal(m.medicationId, medications)} (${m.quantity || 'N/A'})`).join(', ') : 'N/A'}
                            </td>
                            {/* Status */}
                            <td className="py-2 px-3"><StatusBadge status={record.status} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}