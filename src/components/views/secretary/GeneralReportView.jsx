// src/components/views/secretary/GeneralReportView.jsx
// (ATUALIZADO: Fonte da tela maior (SM), PDF mantido compacto + Numeração de Páginas)

import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StatusBadge } from '../../common/StatusBadge';
import { icons } from '../../../utils/icons';
import useDebounce from '../../../hooks/useDebounce';

const MS_IN_DAY = 24 * 60 * 60 * 1000;

// --- HELPER: Identificação de Farmácia (Lógica Preservada) ---
const getFarmaciaName = (record, distributors = []) => {
  // 1. Tenta pegar o nome direto do objeto
  if (record?.distributor?.name) return record.distributor.name;
  if (record?.unidade?.name) return record.unidade.name;

  // 2. Cruza ID com a lista de distribuidores
  if (distributors && distributors.length > 0) {
    const possibleId = record?.distributorId || record?.distributor || record?.location || record?.farmacia;
    const found = distributors.find(d => 
      d._id === possibleId || d.id === possibleId || d.name === possibleId
    );
    if (found) return found.name;
  }

  // 3. Fallback por string
  let raw = record?.location || record?.farmacia || record?.pharmacy || record?.origin || record?.unidade || '';
  const loc = String(raw).toLowerCase().trim();
  
  if (loc.includes('campina grande') || loc.includes('campina') || loc.includes('grande') || loc === 'cg') return 'Campina Grande';
  if (loc.includes('joao paulo') || loc.includes('joão paulo') || loc.includes('jp')) return 'João Paulo';

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
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState(initialFilterStatus || 'all');
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  const [selectedPharmacy, setSelectedPharmacy] = useState(''); 

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // Reduzi levemente itens por página pois a fonte aumentou
  
  const debouncedReportSearchTerm = useDebounce(reportSearchTerm, 300);

  useEffect(() => {
    if (initialFilterStatus) {
      setFilterStatus(initialFilterStatus);
      if (onReportViewed) onReportViewed(); 
    }
  }, [initialFilterStatus, onReportViewed]);

  useEffect(() => { setCurrentPage(1); }, [filterPeriod, filterStatus, debouncedReportSearchTerm, selectedPharmacy, filterYear]);

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

  // --- Filtragem ---
  const filteredRecordsForReport = useMemo(() => {
    let filtered = Array.isArray(records) ? [...records] : [];
    
    // Ano
    if (filterYear) {
      filtered = filtered.filter(r => {
        try { return new Date(r.entryDate).getFullYear() === parseInt(filterYear); } catch (e) { return false; }
      });
    }

    // Período
    if (filterPeriod !== 'all') {
      const days = parseInt(filterPeriod, 10);
      if (!isNaN(days)) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        cutoffDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter((r) => { try { return new Date(r.entryDate) >= cutoffDate; } catch (e) { return false; } });
      }
    }

    // Status
    const now = new Date().getTime();
    if (filterStatus !== 'all') {
      if (filterStatus === 'Vencido') {
        filtered = filtered.filter(r => {
          if (r.status !== 'Pendente' || !r.entryDate) return false;
          try { return (now - new Date(r.entryDate).getTime()) > (30 * MS_IN_DAY); } catch (e) { return false; }
        });
      } else {
        filtered = filtered.filter((r) => r.status === filterStatus);
      }
    }

    // Farmácia
    if (selectedPharmacy) {
        filtered = filtered.filter(r => getFarmaciaName(r, distributors) === selectedPharmacy);
    }

    // Busca
    const searchTermLower = debouncedReportSearchTerm.toLowerCase();
    if (searchTermLower) {
      filtered = filtered.filter((r) =>
        (getPatientNameById(r.patientId) || '').toLowerCase().includes(searchTermLower) || 
        getFarmaciaName(r, distributors).toLowerCase().includes(searchTermLower) 
      );
    }
    
    return filtered.length > 0
      ? filtered.sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate))
      : [];
  }, [records, filterPeriod, filterStatus, selectedPharmacy, debouncedReportSearchTerm, getPatientNameById, filterYear, distributors]);

  // Paginação
  const totalPages = useMemo(() => Math.ceil(filteredRecordsForReport.length / itemsPerPage), [filteredRecordsForReport, itemsPerPage]);
  const currentRecordsForReport = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredRecordsForReport.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredRecordsForReport, currentPage, itemsPerPage]);

  // --- Exportar PDF (Configuração Mantida + Numeração de Páginas) ---
  const handleExportPDF = () => {
    if (!filteredRecordsForReport.length) { addToast?.('Sem dados.', 'error'); return; }
    try {
      const doc = new jsPDF();
      const reportTitle = 'Relatório Geral de Movimentações';
      const userName = user?.name || 'Usuário do Sistema';
      const dateNow = new Date().toLocaleDateString('pt-BR');
      const timeNow = new Date().toLocaleTimeString('pt-BR');
      
      doc.setFontSize(14); 
      doc.text(reportTitle, 14, 15);
      
      doc.setFontSize(8); 
      doc.setTextColor(100);
      doc.text(`Emitido por: ${userName}`, 14, 21);
      doc.text(`Data: ${dateNow} às ${timeNow}`, 14, 25);
      doc.text(`Filtro Ano: ${filterYear} | Registros: ${filteredRecordsForReport.length}`, 14, 29);

      const tableRows = filteredRecordsForReport.map((record) => {
        const farmacia = getFarmaciaName(record, distributors); 
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
        head: [['Paciente', 'Entrada', 'Entrega', 'Medicações', 'Unidade', 'Status']],
        body: tableRows,
        startY: 34,
        theme: 'grid',
        // MANTIDO fontSize 7 como solicitado para o PDF
        styles: { fontSize: 7, cellPadding: 2 }, 
        headStyles: { fillColor: [50, 50, 50], textColor: 255 },
        // ADICIONADO: Numeração de Páginas no PDF
        didDrawPage: function (data) {
            doc.setFontSize(7);
            doc.setTextColor(150);
            doc.text(
                'Página ' + data.pageNumber,
                data.settings.margin.left,
                doc.internal.pageSize.height - 10
            );
        }
      });

      doc.output('dataurlnewwindow');
      addToast?.('PDF gerado!', 'success');
    } catch (err) { addToast?.('Erro ao gerar PDF.', 'error'); }
  };

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 3; i <= currentYear + 2; i++) years.push(i);
    return years.reverse();
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      
      {/* --- HEADER --- */}
      <div className="flex-none p-3 border-b border-gray-200 bg-gray-50">
        
        {/* Linha 1: Título e Botões */}
        <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
                {onBack && (
                <button 
                    onClick={onBack} 
                    className="p-2 rounded-full bg-white border border-gray-300 hover:bg-gray-100 text-gray-600 transition-colors shadow-sm cursor-pointer" 
                    title="Voltar"
                >
                    {/* Ícone Arrow Left */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
                )}
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    Relatório
                    <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full border border-gray-300">
                        {filteredRecordsForReport.length}
                    </span>
                </h2>
            </div>
            
            <button
                onClick={handleExportPDF}
                disabled={!filteredRecordsForReport.length}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 text-sm font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {icons.download} PDF
            </button>
        </div>

        {/* Linha 2: Filtros (Aumentados para text-sm) */}
        <div className="flex flex-wrap gap-3 items-center">
            
            {/* Busca */}
            <div className="relative flex-grow min-w-[200px]">
                <input
                    type="text"
                    placeholder="Buscar paciente ou farmácia..."
                    value={reportSearchTerm}
                    onChange={(e) => setReportSearchTerm(e.target.value)}
                    className="w-full pl-8 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-500 outline-none bg-white cursor-text"
                />
                <span className="absolute left-2.5 top-2.5 text-gray-400 text-sm">{icons.search}</span>
            </div>

            {/* Ano */}
            <select
                value={filterYear}
                onChange={(e) => setFilterYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-500 outline-none bg-white cursor-pointer"
            >
                {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>

            {/* Unidade */}
            <select
                value={selectedPharmacy}
                onChange={(e) => setSelectedPharmacy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-500 outline-none bg-white cursor-pointer max-w-[180px]"
            >
                <option value="">Todas Unidades</option>
                {distributors.map(dist => (
                    <option key={dist._id || dist.id} value={dist.name}>{dist.name}</option>
                ))}
            </select>

             {/* Período */}
             <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-500 outline-none bg-white cursor-pointer"
            >
                <option value="all">Todo Histórico</option>
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="60">Últimos 60 dias</option>
                <option value="90">Últimos 90 dias</option>
            </select>

            {/* Tabs de Status */}
            <div className="flex bg-white rounded border border-gray-300 p-1 overflow-hidden">
                {statusOptions.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => setFilterStatus(opt.value)}
                    className={`px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer rounded
                    ${filterStatus === opt.value 
                        ? 'bg-gray-700 text-white shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    {opt.label}
                </button>
                ))}
            </div>
        </div>
      </div>

      {/* --- TABELA (Fonte Aumentada) --- */}
      <div className="flex-grow overflow-auto bg-white">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
            <tr>
              {/* Fonte dos headers aumentada para text-sm */}
              <th className="p-3 text-sm font-semibold text-gray-700 uppercase border-b border-gray-200">Paciente</th>
              <th className="p-3 text-sm font-semibold text-gray-700 uppercase border-b border-gray-200">Datas</th>
              <th className="p-3 text-sm font-semibold text-gray-700 uppercase border-b border-gray-200 w-1/3">Medicações</th>
              <th className="p-3 text-sm font-semibold text-gray-700 uppercase border-b border-gray-200">Unidade</th>
              <th className="p-3 text-sm font-semibold text-gray-700 uppercase text-center border-b border-gray-200">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentRecordsForReport.length > 0 ? (
              currentRecordsForReport.map((record) => {
                const patientName = getPatientNameById(record.patientId) || 'Não identificado';
                const farmaciaName = getFarmaciaName(record, distributors);
                
                let deliveryDateFormatted = null;
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
                  <tr key={record._id || record.id} className="hover:bg-blue-50 transition-colors">
                    {/* Células com text-sm (14px) para melhor leitura */}
                    <td className="p-3 text-sm font-medium text-gray-900 align-top">
                       {patientName}
                    </td>
                    <td className="p-3 text-sm align-top text-gray-600">
                        <div className="flex flex-col gap-0.5">
                            <span>E: {new Date(record.entryDate).toLocaleDateString('pt-BR')}</span>
                            {deliveryDateFormatted && <span className="text-emerald-700 font-medium">S: {deliveryDateFormatted}</span>}
                        </div>
                    </td>
                    <td className="p-3 align-top">
                       <div className="flex flex-wrap gap-1.5">
                         {Array.isArray(record.medications) ? record.medications.map((m, i) => (
                             <span key={i} className="inline-flex items-center px-2 py-1 rounded border border-gray-200 bg-gray-50 text-gray-700 text-xs">
                                {getMedicationName(m.medicationId, medications)} <b>({m.quantity})</b>
                             </span>
                         )) : '-'}
                       </div>
                    </td>
                    <td className="p-3 align-top">
                        <span className={`px-2 py-1 rounded text-xs font-medium border whitespace-nowrap
                            ${farmaciaName === 'Campina Grande' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                              farmaciaName === 'João Paulo' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                              'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {farmaciaName}
                        </span>
                    </td>
                    <td className="p-3 text-center align-top">
                        <StatusBadge status={record.status} />
                        {record.status === 'Cancelado' && (
                            <button 
                                onClick={() => onViewReason(record)}
                                className="block mx-auto mt-1 text-xs text-red-600 hover:underline cursor-pointer"
                            >
                                Motivo
                            </button>
                        )}
                    </td>
                  </tr>
                );
              })
            ) : (
                <tr>
                    <td colSpan="5" className="py-10 text-center text-gray-500 text-sm">
                        Nenhum registro encontrado.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- PAGINAÇÃO (UI) --- */}
      {totalPages > 1 && (
         <div className="flex-none p-2 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-sm">
            <span className="text-gray-600 ml-2">
               Pág <b>{currentPage}</b> / <b>{totalPages}</b>
            </span>
            <div className="flex gap-2">
               <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 cursor-pointer text-sm"
               >
                  Anterior
               </button>
               <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 cursor-pointer text-sm"
               >
                  Próxima
               </button>
            </div>
         </div>
      )}

    </div>
  );
}