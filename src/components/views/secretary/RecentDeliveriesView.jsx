// src/components/views/secretary/RecentDeliveriesView.jsx
import React, { useMemo } from 'react';
import { StatusBadge } from '../../common/StatusBadge';

// Recebe a lista de 'patients' para que o clique funcione corretamente,
// além dos helpers e callbacks do Controlador.
export function RecentDeliveriesView({
  records = [],
  medications = [],
  getPatientNameById,
  getMedicationName,
  onPatientClick, // Callback para navegar para o histórico (espera patientId)
}) {
  // --- Memos ---
  const recentDeliveries = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);
    return Array.isArray(records)
      ? records
          .filter((r) => {
            let d = null;
            try {
              if (r.deliveryDate) d = new Date(r.deliveryDate + 'T00:00:00');
            } catch (e) {}
            return (
              r.status === 'Atendido' &&
              d instanceof Date &&
              !isNaN(d) &&
              d >= oneWeekAgo
            );
          })
          .sort((a, b) => {
            try {
              return (
                new Date(b.deliveryDate + 'T00:00:00') -
                new Date(a.deliveryDate + 'T00:00:00')
              );
            } catch (e) {
              return 0;
            }
          })
      : [];
  }, [records]);

  // --- Renderização ---
  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 animate-fade-in flex flex-col h-[calc(100vh-8rem)]">
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800">
        Entregas Atendidas (Última Semana)
      </h2>
      {recentDeliveries.length === 0 ? (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-center text-gray-500 py-10">
            Nenhuma entrega registrada na última semana.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-auto flex-grow min-h-0">
          <table className="min-w-full bg-white text-sm">
            <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
              <tr>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data da Entrega
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paciente
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medicações Entregues
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data da Entrada
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {recentDeliveries.map((record) => {
                let deliveryDtFormatted = 'Inválido';
                try {
                  let dt = new Date(record.deliveryDate + 'T00:00:00');
                  if (!isNaN(dt))
                    deliveryDtFormatted = dt.toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    });
                } catch (e) {}

                return (
                  <tr
                    key={record.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-3 px-3 font-medium text-gray-800">
                      {deliveryDtFormatted}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => {
                          // Chamamos o callback do controlador, passando APENAS o ID do paciente.
                          // O controlador fará o resto (encontrar o objeto do paciente e navegar).
                          onPatientClick(record.patientId);
                        }}
                        className="text-blue-600 hover:underline font-medium text-left"
                        title="Ver histórico deste paciente"
                      >
                        {getPatientNameById(record.patientId)}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-gray-700">
                      {Array.isArray(record.medications)
                        ? record.medications
                            .map(
                              (m) =>
                                `${getMedicationName(
                                  m.medicationId,
                                  medications
                                )} (${m.quantity || 'N/A'})`
                            )
                            .join(', ')
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-gray-700">
                      {(() => {
                        try {
                          return new Date(record.entryDate).toLocaleString(
                            'pt-BR',
                            { dateStyle: 'short', timeStyle: 'short' }
                          );
                        } catch (e) {
                          return 'Inválido';
                        }
                      })()}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={record.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}