// src/components/views/secretary/GeneralReportView.jsx
// (ATUALIZADO: Adicionado seletor de Ano nos filtros locais)

import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StatusBadge } from '../../common/StatusBadge';
import { icons } from '../../../utils/icons';
import useDebounce from '../../../hooks/useDebounce';

const MS_IN_30_DAYS = 30 * 24 * 60 * 60 * 1000;

// --- HELPER: Mapeia o campo de localização para um nome de Farmácia ---
const getFarmaciaName = (record) => {
  const loc = String(record?.location || record?.farmacia || record?.pharmacy || record?.origin || '').toLowerCase().trim();
  
  if (loc.includes('campina grande') || loc.includes('campina') || loc.includes('grande') || loc.includes('farmacia a') || loc === 'a' || loc === 'cg') return 'Campina Grande';
  if (loc.includes('joao paulo') || loc.includes('joão paulo') || loc.includes('joao') || loc.includes('joão') || loc.includes('paulo') || loc.includes('farmacia b') || loc === 'b' || loc === 'jp') return 'João Paulo';
  if (loc.length > 0) return `Debug: ${loc.toUpperCase()}`;
  
  return 'Não Identificada';
};

export function GeneralReportView({
  user,
  records = [],
  medications = [],
  distributors = [], 
  addToast,
  getPatientNameById,
  getMedicationName,
  initialFilterStatus, 
  onReportViewed,
  onViewReason, 
  onBack
}) {
  
  // --- Estados ---
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear()); // NOVO: Estado do Ano
  const [filterStatus, setFilterStatus] = useState(initialFilterStatus || 'all');
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  const [selectedPharmacy, setSelectedPharmacy] = useState(''); 

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  const debouncedReportSearchTerm = useDebounce(reportSearchTerm, 300);
  const isSearchingReport = reportSearchTerm !== debouncedReportSearchTerm;

  // Sincroniza initialFilterStatus
  useEffect(() => {
    if (initialFilterStatus) {
      setFilterStatus(initialFilterStatus);
      if (onReportViewed) onReportViewed(); 
    }
  }, [initialFilterStatus, onReportViewed]);

  // Reseta paginação quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPeriod, filterStatus, debouncedReportSearchTerm, selectedPharmacy, filterYear]);

  // Opções de Status
  const statusOptions = useMemo(() => {
    const options = [
      { value: 'all', label: 'Todos' },
      { value: 'Atendido', label: 'Atendido' },
      { value: 'Pendente', label: 'Pendente' },
      { value: 'Cancelado', label: 'Cancelado' },
    ];
    if (initialFilterStatus === 'Vencido' || filterStatus === 'Vencido') {
      options.push({ value: 'Vencido', label: 'Vencido (30d+)' });
    }
    return options;
  }, [initialFilterStatus, filterStatus]);

  // --- Lógica de Filtros ---
  const filteredRecordsForReport = useMemo(() => {
    let filtered = Array.isArray(records) ? [...records] : [];
    
    // 1. Filtro de Ano (NOVO)
    if (filterYear) {
      filtered = filtered.filter(r => {
        try {
          return new Date(r.entryDate).getFullYear() === parseInt(filterYear);
        } catch (e) {
          return false;
        }
      });
    }

    // 2. Período (Dias)
    if (filterPeriod !== 'all') {
      const days = parseInt(filterPeriod, 10);
      if (!isNaN(days)) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        cutoffDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter((r) => {
          try { return new Date(r.entryDate) >= cutoffDate; } catch (e) { return false; }
        });
      }
    }

    // 3. Status
    const now = new Date().getTime();
    if (filterStatus !== 'all') {
      if (filterStatus === 'Vencido') {
        filtered = filtered.filter(r => {
          if (r.status !== 'Pendente' || !r.entryDate) return false;
          try {
            const entryTime = new Date(r.entryDate).getTime();
            return (now - entryTime) > MS_IN_30_DAYS;
          } catch (e) { return false; }
        });
      } else {
        filtered = filtered.filter((r) => r.status === filterStatus);
      }
    }

    // 4. Farmácia
    if (selectedPharmacy) {
        filtered = filtered.filter(r => getFarmaciaName(r) === selectedPharmacy);
    }

    // 5. Busca
    const searchTermLower = debouncedReportSearchTerm.toLowerCase();
    if (searchTermLower) {
      filtered = filtered.filter((r) =>
        (getPatientNameById(r.patientId) || '').toLowerCase().includes(searchTermLower) || 
        getFarmaciaName(r).toLowerCase().includes(searchTermLower) 
      );
    }
    
    return filtered.length > 0
      ? filtered.sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate))
      : [];
  }, [records, filterPeriod, filterStatus, selectedPharmacy, debouncedReportSearchTerm, getPatientNameById, filterYear]);

  // Paginação
  const totalPages = useMemo(() => Math.ceil(filteredRecordsForReport.length / itemsPerPage), [filteredRecordsForReport, itemsPerPage]);
  const currentRecordsForReport = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredRecordsForReport.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredRecordsForReport, currentPage, itemsPerPage]);

  // Exportar PDF
  const handleExportPDF = () => {
    if (!filteredRecordsForReport.length) {
      addToast?.('Sem dados para exportar.', 'error');
      return;
    }
    try {
      const doc = new jsPDF();
      const reportTitle = 'Relatório Geral de Entradas';
      const statusLabel = statusOptions.find(o => o.value === filterStatus)?.label || 'Todos';
      const pharmacyLabel = selectedPharmacy || 'Todas';
      
      const filtersText = `Ano: ${filterYear} | Filtros: ${filterPeriod === 'all' ? 'Todo Período' : `${filterPeriod} dias`} | Status: ${statusLabel} | Unidade: ${pharmacyLabel}`;
      const generationInfo = `Gerado em: ${new Date().toLocaleString('pt-BR')} por ${user?.name || 'Sistema'}`;

      doc.setFontSize(16);
      doc.text(reportTitle, 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(filtersText, 14, 28);
      doc.setFontSize(8);
      doc.text(generationInfo, 14, 33);

      const tableColumn = ['Paciente', 'Data', 'Entrega', 'Medicações', 'Farmácia', 'Status']; 
      const tableRows = filteredRecordsForReport.map((record) => {
        const farmacia = getFarmaciaName(record); 
        const patientName = getPatientNameById(record.patientId) || 'N/A'; 
        const date = new Date(record.entryDate).toLocaleDateString('pt-BR');
        
        let deliveryFormatted = '-';
        if (record.deliveryDate) {
           const dObj = new Date(record.deliveryDate);
           dObj.setMinutes(dObj.getMinutes() + dObj.getTimezoneOffset());
           deliveryFormatted = dObj.toLocaleDateString('pt-BR');
        }
        
        const items = Array.isArray(record.medications) 
           ? record.medications.map(m => `${getMedicationName(m.medicationId, medications)} (${m.quantity})`).join(', ')
           : '0 itens';

        return [patientName, date, deliveryFormatted, items, farmacia, record.status];
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 38,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [63, 81, 181], textColor: 255 },
        columnStyles: { 3: { cellWidth: 'auto' } }
      });

      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.text(`Total: ${filteredRecordsForReport.length} registros`, 14, finalY);

      doc.output('dataurlnewwindow');
      addToast?.('PDF gerado!', 'success');
    } catch (err) {
      console.error(err);
      addToast?.('Erro ao gerar PDF.', 'error');
    }
  };

  // Gera lista de anos (Atual - 3 até Atual + 2)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 3; i <= currentYear + 2; i++) {
        years.push(i);
    }
    return years.reverse(); // Do mais recente para o mais antigo
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] w-full bg-white rounded-xl shadow-sm overflow-hidden animate-fade-in">
      
      {/* --- HEADER --- */}
      <div className="flex-none p-4 md:p-6 border-b border-gray-100 bg-white z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
                title="Voltar"
              >
                {icons.arrowLeft || '<-'}
              </button>
            )}
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">Relatório Geral</h1>
              <p className="text-gray-500 text-xs md:text-sm">Controle completo de movimentações</p>
            </div>
          </div>
          
          <button
            onClick={handleExportPDF}
            disabled={!filteredRecordsForReport.length}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 transition-colors w-full md:w-auto justify-center shadow-sm cursor-pointer disabled:cursor-not-allowed"
          >
            {icons.download} PDF
          </button>
        </div>

        {/* --- BARRA DE FILTROS --- */}
        <div className="flex flex-col gap-3">
            {/* Status Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {statusOptions.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => setFilterStatus(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all border cursor-pointer
                    ${filterStatus === opt.value 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                >
                    {opt.label}
                </button>
                ))}
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Filtro de Ano (NOVO) */}
                <div className="md:col-span-2">
                   <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 cursor-pointer hover:bg-white transition-colors"
                    >
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                <div className="md:col-span-3">
                    <select
                        value={selectedPharmacy}
                        onChange={(e) => setSelectedPharmacy(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 cursor-pointer hover:bg-white transition-colors"
                    >
                        <option value="">Todas as Unidades</option>
                        {distributors.map(dist => (
                            <option key={dist._id || dist.id} value={dist.name}>{dist.name}</option>
                        ))}
                    </select>
                </div>
                
                <div className="md:col-span-3">
                    <select
                        value={filterPeriod}
                        onChange={(e) => setFilterPeriod(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 cursor-pointer hover:bg-white transition-colors"
                    >
                        <option value="all">Todo o Histórico</option>
                        <option value="7">Últimos 7 dias</option>
                        <option value="30">Últimos 30 dias</option>
                        <option value="90">Últimos 90 dias</option>
                    </select>
                </div>

                <div className="md:col-span-4 relative">
                    <input
                        type="text"
                        placeholder="Buscar paciente, farmácia..."
                        value={reportSearchTerm}
                        onChange={(e) => setReportSearchTerm(e.target.value)}
                        className="w-full pl-9 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
                    />
                    <span className="absolute left-3 top-2.5 text-gray-400 text-xs">{icons.search}</span>
                    {isSearchingReport && (
                        <span className="absolute right-3 top-2.5 w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                    )}
                </div>
            </div>
            
            <div className="flex justify-between items-center text-xs text-gray-500 px-1 mt-1">
                 <span><b>{filteredRecordsForReport.length}</b> resultados em <b>{filterYear}</b></span>
                 <span>{selectedPharmacy ? `Filtro: ${selectedPharmacy}` : 'Todas as unidades'}</span>
            </div>
        </div>
      </div>

      {/* --- CORPO DA TABELA --- */}
      <div className="flex-grow overflow-auto bg-gray-50/50">
        <table className="w-full text-left border-collapse min-w-[800px] md:min-w-full">
          <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/4">Paciente</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Entrada</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Entrega</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/4">Medicações</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Unidade</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {currentRecordsForReport.length > 0 ? (
              currentRecordsForReport.map((record) => {
                const patientName = getPatientNameById(record.patientId) || 'Não identificado';
                const farmaciaName = getFarmaciaName(record);
                const isHighlighted = debouncedReportSearchTerm && 
                   (patientName.toLowerCase().includes(debouncedReportSearchTerm.toLowerCase()) || 
                    farmaciaName.toLowerCase().includes(debouncedReportSearchTerm.toLowerCase()));

                let deliveryDateFormatted = '---';
                if (record.status === 'Atendido' && record.deliveryDate) {
                    try {
                        let dt = new Date(record.deliveryDate);
                        if(!isNaN(dt)) {
                             dt.setMinutes(dt.getMinutes() + dt.getTimezoneOffset());
                             deliveryDateFormatted = dt.toLocaleDateString('pt-BR');
                        }
                    } catch(e){}
                }

                return (
                  <tr key={record._id || record.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className={`p-4 font-medium text-sm text-gray-900 ${isHighlighted ? 'bg-yellow-50' : ''}`}>
                       {patientName}
                    </td>
                    <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                       {new Date(record.entryDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                       {deliveryDateFormatted}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                       <div className="max-h-20 overflow-y-auto custom-scrollbar">
                         {Array.isArray(record.medications) ? record.medications.map((m, i) => (
                             <div key={i} className="mb-0.5 last:mb-0 text-xs">
                                • {getMedicationName(m.medicationId, medications)} <span className="text-gray-400">({m.quantity})</span>
                             </div>
                         )) : '-'}
                       </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border
                            ${farmaciaName === 'Campina Grande' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                              farmaciaName === 'João Paulo' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                              'bg-gray-50 text-gray-600 border-gray-100'}`}>
                            {farmaciaName}
                        </span>
                    </td>
                    <td className="p-4 text-center">
                        <StatusBadge status={record.status} />
                        {record.status === 'Cancelado' && (
                            <button 
                                onClick={() => onViewReason(record)}
                                className="block mx-auto mt-1 text-[10px] text-red-500 hover:text-red-700 underline cursor-pointer"
                            >
                                Ver Motivo
                            </button>
                        )}
                    </td>
                  </tr>
                );
              })
            ) : (
                <tr>
                    <td colSpan="6" className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                            <span className="text-4xl mb-3 opacity-30">{icons.search || '🔍'}</span>
                            <p className="text-sm">Nenhum registro encontrado para este filtro.</p>
                        </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- PAGINAÇÃO --- */}
      {totalPages > 1 && (
         <div className="flex-none p-4 bg-white border-t border-gray-100 flex justify-between items-center z-10">
            <span className="text-xs md:text-sm text-gray-500">
               Pág <b>{currentPage}</b> de <b>{totalPages}</b>
            </span>
            <div className="flex gap-2">
               <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs md:text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
               >
                  Anterior
               </button>
               <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs md:text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
               >
                  Próxima
               </button>
            </div>
         </div>
      )}

    </div>
  );
}