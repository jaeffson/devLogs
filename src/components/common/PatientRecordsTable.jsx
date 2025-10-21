import React from 'react';
import { StatusBadge } from './StatusBadge'; // Importa StatusBadge
// import { getMedicationName } from '../../utils/helpers'; // Importe se necessário

// Helper interno (substitua pelo import se moveu para utils)
const getMedicationNameLocal = (medicationId, meds) => {
   const idToFind = Number(medicationId);
   return meds.find(m => m.id === idToFind)?.name || 'Desconhecida';
};

// Exportação nomeada
export function PatientRecordsTable({ records = [], medications = [] }) { // Valores padrão
    if (records.length === 0) {
        return <p className="text-gray-500 mt-4 text-center">Nenhum registro encontrado para este paciente.</p>
    }

    return (
        <div className="overflow-x-auto mt-4">
            <table className="min-w-full bg-white text-sm"> {/* Fonte menor */}
                <thead className="bg-gray-100">
                    <tr>
                        <th className="text-left py-2 px-3">Data Ref.</th> {/* Padding menor */}
                        <th className="text-left py-2 px-3">Entrada</th>
                        <th className="text-left py-2 px-3">Entrega</th>
                        <th className="text-left py-2 px-3">Medicações</th>
                        <th className="text-left py-2 px-3">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Ordena por data de entrada mais recente */}
                    {[...records].sort((a,b) => new Date(b.entryDate) - new Date(a.entryDate)).map(record => (
                        <tr key={record.id} className="border-b hover:bg-gray-50"> {/* Hover */}
                            <td className="py-2 px-3">{new Date(record.referenceDate + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                            <td className="py-2 px-3">{new Date(record.entryDate).toLocaleDateString('pt-BR', { dateStyle: 'short', timeStyle: 'short'})}</td>
                            <td className="py-2 px-3">{record.deliveryDate ? new Date(record.deliveryDate).toLocaleDateString('pt-BR', { dateStyle: 'short', timeStyle: 'short'}) : '---'}</td>
                            <td className="py-2 px-3">
                                {/* Usando helper local ou importado */}
                                {record.medications.map(m => `${getMedicationNameLocal(m.medicationId, medications)} (${m.quantity})`).join(', ')}
                                {/* {record.medications.map(m => `${getMedicationName(m.medicationId, medications)} (${m.quantity})`).join(', ')} */}
                            </td>
                            <td className="py-2 px-3"><StatusBadge status={record.status} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
export default PatientRecordsTable