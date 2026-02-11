// src/components/common/RecentDeliveriesTab.jsx
import React from 'react';
import { StatusBadge } from './StatusBadge';

// --- HELPER BLINDADO ---
const getMedicationNameLocal = (medicationId, meds = []) => {
  if (!medicationId) return '-';
  const targetId =
    typeof medicationId === 'object'
      ? medicationId._id || medicationId.id
      : medicationId;
  if (!targetId) return 'Desconhecido';

  const targetIdStr = String(targetId);
  const found = meds.find(
    (m) => String(m._id) === targetIdStr || String(m.id) === targetIdStr
  );

  return found ? found.name : 'Desconhecido'; // Removemos o "ID Inválido"
};

const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatSafeDate = (dateString) => {
  if (!dateString) return '-';
  let d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';
  d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
  return d.toLocaleDateString('pt-BR');
};

export function RecentDeliveriesTab({
  records = [],
  patients = [],
  medications = [],
}) {
  const localDate = new Date();
  const today = getLocalDateString(localDate);
  const yesterdayDate = new Date(localDate);
  yesterdayDate.setDate(localDate.getDate() - 1);
  const yesterday = getLocalDateString(yesterdayDate);

  const recentRecords = records
    .filter(
      (r) =>
        r.status === 'Atendido' &&
        r.deliveryDate &&
        (r.deliveryDate.startsWith(today) ||
          r.deliveryDate.startsWith(yesterday))
    )
    .sort((a, b) => new Date(b.deliveryDate) - new Date(a.deliveryDate));

  const getPatientNameById = (id) => {
    const p = patients.find((p) => (p._id || p.id) === id);
    return p ? p.name : 'Desconhecido';
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <h3 className="text-xl font-semibold mb-4">
        Entregas Atendidas Recentes
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left py-2 px-3">Paciente</th>
              <th className="text-left py-2 px-3">Data da Entrega</th>
              <th className="text-left py-2 px-3">Medicações</th>
              <th className="text-left py-2 px-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentRecords.map((record) => (
              <tr
                key={record._id || record.id}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="py-2 px-3 font-semibold">
                  {getPatientNameById(record.patientId)}
                </td>
                <td className="py-2 px-3 font-medium text-green-700">
                  {formatSafeDate(record.deliveryDate)}
                </td>
                <td className="py-2 px-3">
                  {record.medications
                    ?.map(
                      (m) =>
                        `${getMedicationNameLocal(m.medicationId, medications)} (${m.quantity || '1'})`
                    )
                    .join(', ')}
                </td>
                <td className="py-2 px-3">
                  <StatusBadge status={record.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {recentRecords.length === 0 && (
          <p className="text-center text-gray-500 py-8 border-dashed border bg-gray-50 rounded mt-2">
            Nenhuma entrega atendida hoje ou ontem.
          </p>
        )}
      </div>
    </div>
  );
}

export default RecentDeliveriesTab;
