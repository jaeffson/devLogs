// src/components/common/RecentDeliveriesTab.jsx
import React from 'react';
import { StatusBadge } from './StatusBadge'; 

// Helper interno (CORRIGIDO: Compara ID como string)
const getMedicationNameLocal = (medicationId, meds) => {
     // 🚨 CORREÇÃO: Compara IDs como strings (MongoDB ObjectIds)
     // (Mantido conforme sua lógica)
     return meds.find(m => m.id === medicationId)?.name || 'ID Inválido';
  };

/**
 * [NOVO HELPER]
 * Helper robusto para obter a string 'YYYY-MM-DD' na data LOCAL,
 * evitando problemas de fuso horário com .toISOString()
 * @param {Date} date - O objeto de data local
 * @returns {string} - A data formatada
 */
const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};


// Exportação nomeada
export function RecentDeliveriesTab({ records = [], patients = [], medications = [] }) { 

  // --- [FIX 1: Cálculo de Data Local] ---
  // Usa o helper local-aware para garantir que as datas
  // correspondam ao fuso horário do usuário.
  const localDate = new Date();
  const today = getLocalDateString(localDate);
  
  const yesterdayDate = new Date(localDate);
  yesterdayDate.setDate(localDate.getDate() - 1);
  const yesterday = getLocalDateString(yesterdayDate);
  // --- Fim do Fix 1 ---

  const recentRecords = records.filter(r =>
    r.status === 'Atendido' && 
    r.deliveryDate && 
    (r.deliveryDate.startsWith(today) || r.deliveryDate.startsWith(yesterday))
  ).sort((a, b) => {
    // A ordenação pode continuar comparando as strings diretamente ou
    // usando o new Date(), pois a comparação UTC-vs-UTC é estável.
    return new Date(b.deliveryDate) - new Date(a.deliveryDate)
  });

  // Helper interno (não precisa exportar)
  const getPatientNameById = (patientId) => {
    return patients.find(p => p.id === patientId)?.name || 'Desconhecido';
  };


  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <h3 className="text-xl font-semibold mb-4">Entregas Atendidas Recentes</h3>
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
            {recentRecords.map(record => (
              <tr key={record.id} className="border-b">
                <td className="py-2 px-3 font-semibold">{getPatientNameById(record.patientId)}</td>
                
                {/* --- [FIX 2: Exibição da Data Local] ---
                    Adiciona 'T00:00:00' para forçar new Date() a interpretar
                    a string 'YYYY-MM-DD' como data LOCAL, e não UTC.
                --- */}
                <td className="py-2 px-3">
                  {new Date(record.deliveryDate + 'T00:00:00').toLocaleString('pt-BR', { 
                      dateStyle: 'short', 
                      timeStyle: 'short',
                      timeZone: 'America/Sao_Paulo' // Garante o fuso de SP, ou remova se preferir o fuso do navegador
                  })}
                </td> 
                {/* --- Fim do Fix 2 --- */}

                <td className="py-2 px-3">
                    {/* Usa helper local corrigido */}
                    {record.medications.map(m => `${getMedicationNameLocal(m.medicationId, medications)} (${m.quantity})`).join(', ')}
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

export default RecentDeliveriesTab;