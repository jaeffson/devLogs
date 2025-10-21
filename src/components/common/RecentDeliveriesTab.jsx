import React from 'react';
import { StatusBadge } from './StatusBadge'; // Importa StatusBadge
// Importe helpers se eles estiverem em utils/
// import { getMedicationName } from '../../utils/helpers';

// !!! IMPORTANTE: Remova ou ajuste a dependência de getMedicationName se ela não estiver importada
// Para este exemplo, vou comentar a linha que a usa.
// Se você moveu getMedicationName para utils/helpers.js, descomente o import acima e a linha abaixo.

// Exportação nomeada
export function RecentDeliveriesTab({ records = [], patients = [], medications = [] }) { // Valores padrão
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10);

  const recentRecords = records.filter(r =>
    r.status === 'Atendido' && r.deliveryDate && (r.deliveryDate.startsWith(today) || r.deliveryDate.startsWith(yesterday))
  ).sort((a, b) => new Date(b.deliveryDate) - new Date(a.deliveryDate));

  // Helper interno (não precisa exportar)
  const getPatientNameById = (patientId) => {
    return patients.find(p => p.id === patientId)?.name || 'Desconhecido';
  };

  // Helper interno (substitua pelo import se moveu para utils)
  const getMedicationNameLocal = (medicationId, meds) => {
     const idToFind = Number(medicationId);
     return meds.find(m => m.id === idToFind)?.name || 'Desconhecida';
  };


  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <h3 className="text-xl font-semibold mb-4">Entregas Atendidas Recentes</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white text-sm"> {/* Tamanho de fonte menor */}
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left py-2 px-3">Paciente</th> {/* Padding menor */}
              <th className="text-left py-2 px-3">Data da Entrega</th>
              <th className="text-left py-2 px-3">Medicações</th>
              <th className="text-left py-2 px-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentRecords.map(record => (
              <tr key={record.id} className="border-b">
                <td className="py-2 px-3 font-semibold">{getPatientNameById(record.patientId)}</td>
                <td className="py-2 px-3">{new Date(record.deliveryDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short'})}</td> {/* Formato mais curto */}
                <td className="py-2 px-3">
                    {/* Usando helper local ou importado */}
                    {record.medications.map(m => `${getMedicationNameLocal(m.medicationId, medications)} (${m.quantity})`).join(', ')}
                    {/* {record.medications.map(m => `${getMedicationName(m.medicationId, medications)} (${m.quantity})`).join(', ')} */}
                </td>
                <td className="py-2 px-3">
                   <StatusBadge status={record.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {recentRecords.length === 0 && <p className="text-center text-gray-500 py-4">Nenhuma entrega atendida hoje ou ontem.</p>}
      </div>
    </div>
  );
}
export default RecentDeliveriesTab