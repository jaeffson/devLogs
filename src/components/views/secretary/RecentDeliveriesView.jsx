
// src/components/views/secretary/RecentDeliveriesView.jsx
import React, { useState, useMemo } from 'react';
import { StatusBadge } from '../../common/StatusBadge';
import { icons } from '../../../utils/icons';

export function RecentDeliveriesView({
  records = [],
  medications = [],
  getPatientNameById,
  getMedicationName,
  onPatientClick,
}) {
  // --- Configurações de Estado ---
  const [timeRange, setTimeRange] = useState(7); // 7 dias por padrão
  const [searchTerm, setSearchTerm] = useState('');

  // --- Lógica de Filtragem e Processamento ---
  const filteredDeliveries = useMemo(() => {
    // 1. Data de Corte
    const cutoffDate = new Date();
    cutoffDate.setHours(0, 0, 0, 0);
    
    // Se timeRange for -1, consideramos "Todo o período" (data muito antiga)
    if (timeRange !== -1) {
      cutoffDate.setDate(cutoffDate.getDate() - timeRange);
    } else {
      cutoffDate.setFullYear(1970);
    }

    // 2. Filtragem
    const term = searchTerm.toLowerCase();

    return records
      .filter((r) => {
        // A. Validação de Status e Data
        if (r.status !== 'Atendido') return false;
        
        let recordDate = null;
        try {
          if (r.deliveryDate) recordDate = new Date(r.deliveryDate + 'T00:00:00');
        } catch (e) { return false; }
        
        if (!recordDate || isNaN(recordDate) || recordDate < cutoffDate) return false;

        // B. Filtro de Texto (Nome do Paciente ou Nome da Medicação)
        if (term) {
            const patientName = getPatientNameById(record.patientId)?.toLowerCase() || '';
            
            // Verifica se alguma medicação bate com a busca
            const hasMedicationMatch = Array.isArray(r.medications) && r.medications.some(m => {
                const medName = getMedicationName(m.medicationId, medications)?.toLowerCase() || '';
                return medName.includes(term);
            });

            return patientName.includes(term) || hasMedicationMatch;
        }

        return true;
      })
      .sort((a, b) => {
        // 3. Ordenação (Mais recente primeiro)
        try {
          return new Date(b.deliveryDate + 'T00:00:00') - new Date(a.deliveryDate + 'T00:00:00');
        } catch (e) { return 0; }
      });
  }, [records, timeRange, searchTerm, getPatientNameById, getMedicationName, medications]);

  // --- Helpers de Renderização ---
  const formatDate = (dateString) => {
    try {
        if (!dateString) return '-';
        const dt = new Date(dateString + 'T00:00:00');
        return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); // Ex: 05/12
    } catch { return dateString; }
  };

  const formatDateTime = (isoDate) => {
    try {
        if (!isoDate) return '-';
        return new Date(isoDate).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' });
    } catch { return '-'; }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 animate-fade-in flex flex-col h-[calc(100vh-8rem)]">
      
      {/* --- Cabeçalho e Filtros --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                Entregas Realizadas
                <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {filteredDeliveries.length}
                </span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">Histórico de dispensações concluídas.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Busca */}
            <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <span className="w-4 h-4">{icons.search || '?'}</span>
                </div>
                <input 
                    type="text" 
                    placeholder="Buscar paciente ou remédio..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
            </div>

            {/* Filtro de Período */}
            <select
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-2 cursor-pointer outline-none"
            >
                <option value={0}>Hoje</option>
                <option value={7}>Últimos 7 dias</option>
                <option value={15}>Últimos 15 dias</option>
                <option value={30}>Últimos 30 dias</option>
                <option value={-1}>Todo o período</option>
            </select>
        </div>
      </div>

      {/* --- Conteúdo da Tabela --- */}
      {filteredDeliveries.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-lg bg-gray-50/50">
          <div className="text-gray-300 w-12 h-12 mb-3">{icons.checkCircle || icons.list}</div>
          <p className="text-gray-500 font-medium">Nenhuma entrega encontrada.</p>
          <p className="text-gray-400 text-sm mt-1">
             {searchTerm ? `Sem resultados para "${searchTerm}"` : "Ajuste o filtro de data para ver mais registros."}
          </p>
        </div>
      ) : (
        <div className="overflow-auto flex-grow rounded-lg border border-gray-200">
          <table className="min-w-full bg-white text-sm relative">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                  Data
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/4">
                  Paciente
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Medicações
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 hidden lg:table-cell">
                  Solicitado em
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDeliveries.map((record) => {
                const patientName = getPatientNameById(record.patientId);
                
                return (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50/80 transition-colors group"
                  >
                    {/* Data Entrega */}
                    <td className="py-3 px-4 font-mono text-gray-600 whitespace-nowrap align-top">
                      {formatDate(record.deliveryDate)}
                    </td>

                    {/* Paciente */}
                    <td className="py-3 px-4 align-top">
                      <button
                        onClick={() => onPatientClick(record.patientId)}
                        className="font-medium text-gray-800 hover:text-blue-600 hover:underline text-left flex items-center gap-1 transition-colors"
                        title="Ver histórico completo"
                      >
                         {patientName}
                         <span className="opacity-0 group-hover:opacity-100 text-blue-400 ml-1 text-xs">↗</span>
                      </button>
                    </td>

                    {/* Medicações (Visual de Tags) */}
                    <td className="py-3 px-4 align-top">
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(record.medications) && record.medications.length > 0 ? (
                            record.medications.map((m, idx) => {
                                const medName = getMedicationName(m.medicationId, medications);
                                return (
                                    <span 
                                        key={idx} 
                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                                    >
                                        {medName}
                                        <span className="ml-1.5 pl-1.5 border-l border-indigo-200 text-indigo-500 font-bold">
                                            {m.quantity || 1}
                                        </span>
                                    </span>
                                )
                            })
                        ) : (
                            <span className="text-gray-400 italic text-xs">Sem itens registrados</span>
                        )}
                      </div>
                    </td>

                    {/* Data Entrada (Hidden em mobile) */}
                    <td className="py-3 px-4 text-gray-500 text-xs hidden lg:table-cell align-top pt-3.5">
                      {formatDateTime(record.entryDate)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 align-top">
                      <StatusBadge status={record.status} size="sm" />
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