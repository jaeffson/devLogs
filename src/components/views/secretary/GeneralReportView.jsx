  // Função para exportar para Excel (CSV)
  const handleExportExcel = () => {
    if (!Array.isArray(filteredRecordsForReport) || filteredRecordsForReport.length === 0) {
      addToast?.('Não há dados para exportar com os filtros selecionados.', 'error');
      return;
    }
    try {
      let csvContent = 'Relatório Geral de Entradas\n';
      csvContent += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
      csvContent += `Filtro de Status: ${statusOptions.find(o => o.value === filterStatus)?.label || 'Todos'}\n`;
      csvContent += `Período: ${filterPeriod === 'all' ? 'Todos' : `Últimos ${filterPeriod} dias`}\n\n`;
      
      csvContent += 'Paciente,Data de Entrada,Data de Entrega,Medicações,Valor Total,Status\n';
      
      filteredRecordsForReport.forEach((record) => {
        const patientName = getPatientNameById(record.patientId) || 'Desconhecido';
        let entryDateFormatted = 'Inválido';
        try {
          entryDateFormatted = new Date(record.entryDate).toLocaleDateString('pt-BR');
        } catch (e) {
          entryDateFormatted = 'Inválido';
        }
        
        let deliveryDateFormatted = '-';
        if (record.deliveryDate)
          try {
            deliveryDateFormatted = new Date(record.deliveryDate).toLocaleDateString('pt-BR');
          } catch (e) {
            deliveryDateFormatted = 'Inválido';
          }

        const medsList = Array.isArray(record.medications)
          ? record.medications.map(m => `${getMedicationName(m.medicationId, medications) || '?'} (${m.quantity || 'N/A'})`).join('; ')
          : '';
        const totalValue = !isNaN(record.totalValue) ? `R$ ${Number(record.totalValue).toFixed(2).replace('.', ',')}` : 'R$ 0,00';
        
        csvContent += `"${patientName}","${entryDateFormatted}","${deliveryDateFormatted}","${medsList}","${totalValue}","${record.status || 'N/A'}"\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio_entradas_${new Date().getTime()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addToast?.('Relatório exportado para Excel com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao exportar Excel: ', err);
      addToast?.(`Erro ao exportar: ${err.message}`, 'error');
    }
  };

// src/components/views/secretary/GeneralReportView.jsx
// (ATUALIZADO: Adicionado botão "Ver Motivo" para status "Cancelado")

import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StatusBadge } from '../../common/StatusBadge';
import { icons } from '../../../utils/icons';
import useDebounce from '../../../hooks/useDebounce';

const MS_IN_30_DAYS = 30 * 24 * 60 * 60 * 1000;

// 1. RECEBER A NOVA PROP 'onViewReason'
export function GeneralReportView({
  user,
  records = [],
  medications = [],
  addToast,
  getPatientNameById,
  getMedicationName,
  initialFilterStatus, 
  onReportViewed,
  onViewReason, // <-- PROP ADICIONADA
}) {
  
  // --- Estados (Movidos para cá) ---
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterStatus, setFilterStatus] = useState(initialFilterStatus || 'all');
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const debouncedReportSearchTerm = useDebounce(reportSearchTerm, 300);
  const isSearchingReport = reportSearchTerm !== debouncedReportSearchTerm;

  // Efeito para sincronizar e limpar o 'initialFilterStatus' no controlador
  useEffect(() => {
    if (initialFilterStatus) {
      setFilterStatus(initialFilterStatus);
      if (onReportViewed) onReportViewed(); 
    }
  }, [initialFilterStatus, onReportViewed]);


  // Reseta paginação quando os filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPeriod, filterStatus, debouncedReportSearchTerm]);

  
  const statusOptions = useMemo(() => {
    const options = [
      { value: 'all', label: 'Todos' },
      { value: 'Atendido', label: 'Atendido' },
      { value: 'Pendente', label: 'Pendente' },
      { value: 'Cancelado', label: 'Cancelado' },
    ];
    if (initialFilterStatus === 'Vencido' && filterStatus === 'Vencido') {
      options.push({ value: 'Vencido', label: 'Vencido (30d+)' });
    }
    return options;
  }, [initialFilterStatus, filterStatus]);

  
  // --- Memos (Movidos para cá) ---
  const filteredRecordsForReport = useMemo(() => {
    let filtered = Array.isArray(records) ? [...records] : [];
    if (filterPeriod !== 'all') {
      const days = parseInt(filterPeriod, 10);
      if (!isNaN(days)) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        cutoffDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter((r) => {
          try {
            return new Date(r.entryDate) >= cutoffDate;
          } catch (e) {
            return false;
          }
        });
      }
    }

    const now = new Date().getTime();
    if (filterStatus !== 'all') {
      if (filterStatus === 'Vencido') {
        filtered = filtered.filter(r => {
          if (r.status !== 'Pendente' || !r.entryDate) return false;
          try {
            const entryTime = new Date(r.entryDate).getTime();
            return (now - entryTime) > MS_IN_30_DAYS;
          } catch (e) {
            return false;
          }
        });
      } else {
        filtered = filtered.filter((r) => r.status === filterStatus);
      }
    }

    const searchTermLower = debouncedReportSearchTerm.toLowerCase();
    if (searchTermLower) {
      filtered = filtered.filter((r) =>
        getPatientNameById(r.patientId)
          .toLowerCase()
          .includes(searchTermLower)
      );
    }
    return filtered.length > 0
      ? filtered.sort((a, b) => {
          try {
            return new Date(b.entryDate) - new Date(a.entryDate);
          } catch (e) {
            return 0;
          }
        })
      : [];
  }, [
    records,
    filterPeriod,
    filterStatus,
    debouncedReportSearchTerm,
    getPatientNameById,
  ]);

  const totalPages = useMemo(
    () => Math.ceil(filteredRecordsForReport.length / itemsPerPage),
    [filteredRecordsForReport, itemsPerPage]
  );

  const currentRecordsForReport = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredRecordsForReport.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredRecordsForReport, currentPage, itemsPerPage]);


  // --- Funções de Ação (Movidas para cá) ---
  const handleExportPDF = () => {
    if (
      !Array.isArray(filteredRecordsForReport) ||
      filteredRecordsForReport.length === 0
    ) {
      addToast?.('Não há dados para exportar com os filtros selecionados.', 'error');
      return;
    }
    try {
      const doc = new jsPDF();
      const reportTitle = 'Relatório Geral de Entradas';
      const statusLabel = statusOptions.find(o => o.value === filterStatus)?.label || 'Todos';
      const filtersText = `Filtros: Período (${
        filterPeriod === 'all' ? 'Todos' : `Últimos ${filterPeriod} dias`
      }), Status (${statusLabel}), Busca (${reportSearchTerm || 'Nenhuma'})`;
      
      const generationDate = new Date().toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
      const generatedBy = user?.name || 'Usuário Desconhecido';
      const generationInfo = `Gerado em: ${generationDate} por ${generatedBy}`;

      doc.setFontSize(18);
      doc.text(reportTitle, 105, 22, { align: 'center' });
      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text(filtersText, 105, 30, { align: 'center' });
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(generationInfo, 105, 35, { align: 'center' });

      const tableColumn = [
        'Paciente',
        'Entrada',
        'Atendido em',
        'Medicações',
        'Valor Total',
        'Status',
      ];
      const tableRows = [];

      filteredRecordsForReport.forEach((record) => {
        const patientName = getPatientNameById(record.patientId);
        let entryDateFormatted = 'Inválido';
        try {
          const dt = new Date(record.entryDate);
          if (!isNaN(dt))
            entryDateFormatted = dt.toLocaleString('pt-BR', {
              dateStyle: 'short',
              timeStyle: 'short',
            });
        } catch (e) {}
        let deliveryDateFormatted = '---';
        if (record.deliveryDate) {
          try {
            let dt = new Date(record.deliveryDate + 'T00:00:00');
            if (isNaN(dt)) dt = new Date(record.deliveryDate);
            if (!isNaN(dt))
              deliveryDateFormatted = dt.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              });
            else deliveryDateFormatted = 'Inválido';
          } catch (e) {
            deliveryDateFormatted = 'Inválido';
          }
        }
        const medsList = Array.isArray(record.medications)
          ? record.medications
              .map(
                (m) =>
                  `${
                    getMedicationName(m.medicationId, medications) || '?'
                  } (${m.quantity || 'N/A'})`
              )
              .join('\n')
          : '';
        const totalValueFormatted = !isNaN(record.totalValue)
          ? Number(record.totalValue).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })
          : 'R$ 0,00';
        tableRows.push([
          patientName,
          entryDateFormatted,
          deliveryDateFormatted,
          medsList,
          totalValueFormatted,
          record.status || 'N/A',
        ]);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 42,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20 },
          3: { cellWidth: 'auto' },
          4: { cellWidth: 20, halign: 'right' },
          5: { cellWidth: 20 },
        },
      });

      doc.output('dataurlnewwindow');
      addToast?.('Relatório PDF gerado com sucesso!', 'success');
    } catch (err) {
      console.error('Erro PDF: ', err);
      addToast?.(`Erro PDF: ${err.message}`, 'error');
    }
  };

  // --- Renderização ---
  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6 animate-fade-in flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3 border-b pb-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">
          Relatório Geral de Entradas
        </h2>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleExportPDF}
            disabled={!Array.isArray(filteredRecordsForReport) || filteredRecordsForReport.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-1 md:flex-none cursor-pointer"
            title="Exportar em formato PDF"
          >
            <span className="w-4 h-4">{icons.download}</span> PDF
          </button>
          <button
            onClick={handleExportExcel}
            disabled={!Array.isArray(filteredRecordsForReport) || filteredRecordsForReport.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-1 md:flex-none cursor-pointer"
            title="Exportar em formato Excel (CSV)"
          >
            <span className="w-4 h-4">{icons.download}</span> Excel
          </button>
        </div>
      </div>
      {/* Filtros */}
      <div className="flex flex-col md:flex-row flex-wrap gap-4 items-end mb-4 p-4 bg-gray-50 rounded-lg border">
        <div className="flex-grow w-full md:w-auto relative">
          <label
            className="text-xs font-medium text-gray-700 mb-1 block"
            htmlFor="report-search-all"
          >
            Buscar por Paciente
          </label>
          <input
            type="text"
            id="report-search-all"
            placeholder="Nome do paciente..."
            value={reportSearchTerm}
            onChange={(e) => setReportSearchTerm(e.target.value)}
            className={`w-full p-2 border rounded-lg text-sm pr-8 ${
              reportSearchTerm
                ? 'border-blue-500 ring-1 ring-blue-500'
                : 'border-gray-300'
            }`}
          />
          {isSearchingReport && (
            <div className="absolute right-2 top-7 text-gray-400 w-4 h-4">
              <svg
                className="animate-spin h-4 w-4 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          )}
        </div>
        <div className="w-full sm:w-auto">
          <label
            className="text-xs font-medium text-gray-700 mb-1 block"
            htmlFor="report-period-all"
          >
            Período
          </label>
          <select
            id="report-period-all"
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className={`w-full p-2 border rounded-lg text-sm bg-white ${
              filterPeriod !== 'all'
                ? 'border-blue-500 ring-1 ring-blue-500'
                : 'border-gray-300'
            }`}
          >
            <option value="all">Todos</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
        </div>
        <div className="w-full sm:w-auto">
          <label
            className="text-xs font-medium text-gray-700 mb-1 block"
            htmlFor="report-status-all"
          >
            Status
          </label>
          <select
            id="report-status-all"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`w-full p-2 border rounded-lg text-sm bg-white ${
              filterStatus !== 'all'
                ? 'border-blue-500 ring-1 ring-blue-500'
                : 'border-gray-300'
            }`}
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-600 mt-2 md:mt-0">
          {filteredRecordsForReport.length} registro(s) encontrado(s).
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto overflow-y-auto flex-grow min-h-0 border border-gray-200 rounded-lg">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paciente
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entrada
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data Entrega
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Medicações
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Total
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody
            className={`divide-y divide-gray-200 ${
              isSearchingReport
                ? 'opacity-75 transition-opacity duration-300'
                : ''
            }`}
          >
            {Array.isArray(currentRecordsForReport) &&
              currentRecordsForReport.map((record) => {
                const patientName = getPatientNameById(record.patientId);
                const isHighlighted =
                  debouncedReportSearchTerm &&
                  patientName
                    .toLowerCase()
                    .includes(debouncedReportSearchTerm.toLowerCase());

                let deliveryDateFormatted = '---';
                if (record.status === 'Atendido' && record.deliveryDate) {
                  try {
                    let dt = new Date(record.deliveryDate + 'T00:00:00');
                    if (isNaN(dt)) dt = new Date(record.deliveryDate);
                    if (!isNaN(dt)) {
                      deliveryDateFormatted = dt.toLocaleDateString(
                        'pt-BR',
                        { day: '2-digit', month: '2-digit', year: 'numeric' }
                      );
                    } else {
                      deliveryDateFormatted = 'Inválido';
                    }
                  } catch (e) {
                    deliveryDateFormatted = 'Inválido';
                  }
                }

                return (
                  // (CORREÇÃO) Adicionada key única
                  <tr key={record._id || record.id} className="hover:bg-gray-50 transition-colors">
                    <td
                      className={`py-3 px-4 font-medium text-gray-900 ${
                        isHighlighted ? 'bg-yellow-100' : ''
                      }`}
                    >
                      {patientName}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
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
                    <td
                      className={`py-3 px-4 ${
                        record.status === 'Atendido'
                          ? 'font-semibold text-gray-800'
                          : 'text-gray-600'
                      }`}
                    >
                      {deliveryDateFormatted}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
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
                        : ''}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{`R$ ${(
                      Number(record.totalValue) || 0
                    ).toFixed(2)}`}</td>
                    
                    {/* --- 2. (INÍCIO DA MUDANÇA) --- */}
                    <td className="py-3 px-4">
                      <StatusBadge status={record.status} />
                      {record.status === 'Cancelado' && (
                        <button
                          onClick={() => onViewReason(record)}
                          className="mt-1 text-xs text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                          title="Ver motivo do cancelamento"
                        >
                          <span className="w-4 h-4">{icons.info}</span>
                          (Ver Motivo)
                        </button>
                      )}
                    </td>
                    {/* --- (FIM DA MUDANÇA) --- */}

                  </tr>
                );
              })}
          </tbody>
        </table>
        {(!Array.isArray(filteredRecordsForReport) ||
          filteredRecordsForReport.length === 0) && (
          <p className="text-center text-gray-500 py-6">
            Nenhuma entrada encontrada para os filtros selecionados.
          </p>
        )}
      </div>
      {/* Paginação */}
      {Array.isArray(filteredRecordsForReport) &&
        filteredRecordsForReport.length > itemsPerPage && (
          <div className="flex justify-between items-center pt-4 border-t mt-auto">
            <span className="text-sm text-gray-700">
              Mostrando{' '}
              {Math.min(
                (currentPage - 1) * itemsPerPage + 1,
                filteredRecordsForReport.length
              )}{' '}
              a{' '}
              {Math.min(
                currentPage * itemsPerPage,
                filteredRecordsForReport.length
              )}{' '}
              de {filteredRecordsForReport.length} registros
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Anterior
              </button>
              <span className="text-sm font-medium">
                Página {currentPage} de {totalPages > 0 ? totalPages : 1}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
    </div>
  );
}