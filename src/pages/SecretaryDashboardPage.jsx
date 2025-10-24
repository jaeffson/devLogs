// src/pages/SecretaryDashboardPage.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
// REMOVIDO: useNavigate

// --- Imports de Componentes ---
import { BarChart } from '../components/common/BarChart';
import { StatusBadge } from '../components/common/StatusBadge';
import icons from '../utils/icons';
import {useDebounce} from '../hooks/useDebounce';

// --- Imports de Utils ---
import { getMedicationName } from '../utils/helpers';

// --- Componente da Página ---
export default function SecretaryDashboardPage({
    user,
    annualBudget,
    patients = [],
    records = [],
    medications = [],
    filterYear = new Date().getFullYear(),
    addToast // Para notificações
    // REMOVIDO: activeTabForced
}) {
  // --- Estados Internos da Página ---
  // Estados para o Relatório Geral
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [reportSearchTerm, setReportSearchTerm] = useState('');

  // Estados de Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // 20 itens por página

  // --- Debounce ---
  const debouncedReportSearchTerm = useDebounce(reportSearchTerm, 300);

  // --- Flags de Feedback de Carregamento/Busca ---
  const isSearchingReport = reportSearchTerm !== debouncedReportSearchTerm;

  // --- Efeito para Paginação ---
  useEffect(() => {
      setCurrentPage(1);
  }, [filterPeriod, filterStatus, debouncedReportSearchTerm]);


  // --- Funções Helper Internas ---
  const getPatientNameById = (patientId) => {
    return Array.isArray(patients) ? (patients.find(p => p.id === patientId)?.name || 'Desconhecido') : 'Desconhecido';
  };

  // --- Memos para dados derivados ---
  // Registros filtrados para o Relatório Geral
  const filteredRecordsForReport = useMemo(() => {
    if (!Array.isArray(records)) return [];
    let filtered = [...records];
    if(filterPeriod !== 'all') {
        const days = parseInt(filterPeriod, 10);
        if (!isNaN(days)) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            cutoffDate.setHours(0, 0, 0, 0);
            filtered = filtered.filter(r => new Date(r.entryDate) >= cutoffDate);
        }
    }
    if(filterStatus !== 'all') {
        filtered = filtered.filter(r => r.status === filterStatus);
    }
    const searchTermLower = debouncedReportSearchTerm.toLowerCase();
    if (searchTermLower) {
        filtered = filtered.filter(r => getPatientNameById(r.patientId).toLowerCase().includes(searchTermLower));
    }
    return filtered.sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));
  }, [records, patients, filterPeriod, filterStatus, debouncedReportSearchTerm]);

  // --- Memos (Paginação para Relatório) ---
  const totalPages = useMemo(() => {
    return Math.ceil(filteredRecordsForReport.length / itemsPerPage);
  }, [filteredRecordsForReport, itemsPerPage]);

  const currentRecordsForReport = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredRecordsForReport.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredRecordsForReport, currentPage, itemsPerPage]);

  // Registros do ano selecionado (para gráfico)
  const recordsByYear = useMemo(() =>
    Array.isArray(records) ? records.filter(r => new Date(r.entryDate).getFullYear() === filterYear) : [],
    [records, filterYear]);

  // Dados para o gráfico
  const monthlyAttendanceData = useMemo(() => {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const attendanceByMonth = Array(12).fill(null).map(() => new Set());
      recordsByYear.forEach(record => {
          if (record.status === 'Atendido') {
              const recordDate = new Date(record.entryDate);
              const monthIndex = recordDate.getMonth();
              if(monthIndex >= 0 && monthIndex < 12){
                 attendanceByMonth[monthIndex].add(record.patientId);
              }
          }
      });
      return months.map((monthLabel, index) => ({
          label: monthLabel,
          value: attendanceByMonth[index].size
      }));
  }, [recordsByYear]);

  // Entregas da última semana
  const recentDeliveries = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);
    return Array.isArray(records) ? records
      .filter(r =>
        r.status === 'Atendido' &&
        r.deliveryDate &&
        new Date(r.deliveryDate + 'T00:00:00') >= oneWeekAgo
      )
      .sort((a, b) => new Date(b.deliveryDate) - new Date(a.deliveryDate))
    : [];
  }, [records]);

  // Contagem de Pendentes
  const pendingRecordsCount = useMemo(() =>
    Array.isArray(records) ? records.filter(r => r.status === 'Pendente').length : 0,
  [records]);


  // --- Função para Exportar PDF (Relatório Geral) ---
  const handleExportPDF = () => {
      if (filteredRecordsForReport.length === 0) {
          addToast?.('Não há dados para exportar com os filtros selecionados.', 'error');
          return;
      }
      const reportTitle = "Relatório Geral de Entradas";
      const printWindow = window.open('', '_blank', 'height=800,width=1000');
      if (!printWindow) {
          addToast?.('Não foi possível abrir a janela de impressão. Verifique bloqueadores de pop-up.', 'error');
          return;
      }
      const styles = `
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 10pt; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
          th { background-color: #f2f2f2; font-weight: bold; }
          h1 { font-size: 16pt; text-align: center; margin-bottom: 20px; }
          @media print {
              body { padding: 10px; font-size: 9pt; }
              button { display: none; }
              h1 { font-size: 14pt; margin-bottom: 15px; }
              th, td { padding: 4px 6px; }
          }
      `;
      printWindow.document.write('<html><head><title>' + reportTitle + '</title>');
      printWindow.document.write('<style>' + styles + '</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write('<h1>' + reportTitle + '</h1>');
      printWindow.document.write(`<p style="font-size: 9pt; color: #555;">Filtros aplicados: Período (${filterPeriod}), Status (${filterStatus}), Busca (${reportSearchTerm || 'Nenhuma'})</p>`);
      printWindow.document.write('<table><thead><tr><th>Paciente</th><th>Data Entrada</th><th>Data Atend.</th><th>Medicações</th><th>Valor Total</th><th>Status</th></tr></thead><tbody>');
      filteredRecordsForReport.forEach(record => {
          const patientName = getPatientNameById(record.patientId);
          const entryDate = new Date(record.entryDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short'});
          const deliveryDate = record.deliveryDate ? new Date(record.deliveryDate + 'T00:00:00').toLocaleDateString('pt-BR') : '---';
          const medsList = Array.isArray(record.medications) ? record.medications.map(m => {
              const medName = getMedicationName(m.medicationId, medications);
              const valueFormatted = (m.value && !isNaN(m.value)) ? ` (R$ ${Number(m.value).toFixed(2)})` : '';
              return `${medName} (${m.quantity})${valueFormatted}`;
          }).join('<br>') : 'N/A';
          const totalValueFormatted = (record.totalValue && !isNaN(record.totalValue)) ? `R$ ${Number(record.totalValue).toFixed(2)}` : 'R$ 0.00';
          printWindow.document.write('<tr>');
          printWindow.document.write(`<td>${patientName}</td>`);
          printWindow.document.write(`<td>${entryDate}</td>`);
          printWindow.document.write(`<td>${deliveryDate}</td>`);
          printWindow.document.write(`<td>${medsList || 'Nenhuma'}</td>`);
          printWindow.document.write(`<td>${totalValueFormatted}</td>`);
          printWindow.document.write(`<td>${record.status}</td>`);
          printWindow.document.write('</tr>');
      });
      printWindow.document.write('</tbody></table>');
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); }, 500);
  };


  // --- Renderização Principal da Página ---
  // Removida a função renderCurrentView, renderiza diretamente o dashboard
  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-6"> {/* Container principal permite scroll natural */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard Secretária</h2>

        {/* --- Cards de Resumo --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white p-4 md:p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold text-gray-700">Entradas Pendentes</h3>
                <p className="text-3xl font-bold mt-2 text-yellow-600">{pendingRecordsCount}</p>
                 <a href="#report-section" onClick={(e) => { e.preventDefault(); setFilterStatus('Pendente'); document.getElementById('report-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm text-blue-600 hover:underline mt-2 inline-block">Ver no Relatório</a>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold text-gray-700">Total de Pacientes</h3>
                <p className="text-3xl font-bold mt-2 text-blue-600">{Array.isArray(patients) ? patients.length : 0}</p>
            </div>
             <div className="bg-white p-4 md:p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold text-gray-700">Entregas (Última Semana)</h3>
                <p className="text-3xl font-bold mt-2 text-green-600">{recentDeliveries.length}</p>
                <a href="#deliveries-section" onClick={(e) => { e.preventDefault(); document.getElementById('deliveries-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm text-blue-600 hover:underline mt-2 inline-block">Ver Detalhes</a>
            </div>
        </div>

        {/* --- Seção do Gráfico --- */}
        <section className="bg-white p-4 md:p-6 rounded-lg shadow">
            <BarChart data={monthlyAttendanceData} title={`Pacientes Únicos Atendidos por Mês (${filterYear})`} />
        </section>

        {/* --- Seção: Relatório Geral --- */}
        <section id="report-section" className="bg-white rounded-lg shadow p-4 md:p-6">
            {/* Header do Relatório */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3 border-b pb-4">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800">Relatório Geral de Entradas</h3>
              <button onClick={handleExportPDF} disabled={filteredRecordsForReport.length === 0} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
                title="Exportar a lista filtrada abaixo para um arquivo PDF">
                  <span className="w-4 h-4">{icons.download}</span> Exportar para PDF
              </button>
            </div>
            {/* Filtros */}
            <div className="flex flex-col md:flex-row flex-wrap gap-4 items-end mb-4 p-4 bg-gray-50 rounded-lg border">
                 <div className="flex-grow w-full md:w-auto relative">
                     <label className="text-xs font-medium text-gray-700 mb-1 block" htmlFor="report-search">Buscar por Paciente</label>
                     <input type="text" id="report-search" placeholder="Nome do paciente..."
                       value={reportSearchTerm}
                       onChange={e => setReportSearchTerm(e.target.value)}
                       className={`w-full p-2 border rounded-lg text-sm pr-8 ${reportSearchTerm ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300'}`} />
                     {isSearchingReport && (
                       <div className="absolute right-2 top-7 text-gray-400 w-4 h-4">
                         <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                       </div>
                     )}
                 </div>
                 <div className="w-full sm:w-auto">
                     <label className="text-xs font-medium text-gray-700 mb-1 block" htmlFor="report-period">Período</label>
                     <select id="report-period" value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}
                       className={`w-full p-2 border rounded-lg text-sm bg-white ${filterPeriod !== 'all' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300'}`}>
                         <option value="all">Todos</option>
                         <option value="7">Últimos 7 dias</option>
                         <option value="30">Últimos 30 dias</option>
                         <option value="90">Últimos 90 dias</option>
                     </select>
                 </div>
                 <div className="w-full sm:w-auto">
                     <label className="text-xs font-medium text-gray-700 mb-1 block" htmlFor="report-status">Status</label>
                     <select id="report-status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                       className={`w-full p-2 border rounded-lg text-sm bg-white ${filterStatus !== 'all' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300'}`}>
                         <option value="all">Todos</option>
                         <option value="Atendido">Atendido</option>
                         <option value="Pendente">Pendente</option>
                         <option value="Cancelado">Cancelado</option>
                     </select>
                 </div>
                 <div className="text-sm text-gray-600 mt-2 md:mt-0">
                     {filteredRecordsForReport.length} registro(s) encontrado(s).
                 </div>
              </div>
            {/* Tabela de Resultados (Scroll X apenas) */}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="text-left py-2 px-3 font-semibold text-gray-600" title="Nome do Paciente">Paciente</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-600" title="Data e hora que o registro foi criado">Entrada</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-600" title="Medicamentos e quantidades registrados">Medicações</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-600" title="Valor total calculado dos medicamentos">Valor Total</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-600" title="Situação atual do registro">Status</th>
                        </tr>
                    </thead>
                    <tbody className={isSearchingReport ? 'opacity-75 transition-opacity duration-300' : ''}>
                        {currentRecordsForReport.map((record, index) => {
                          const patientName = getPatientNameById(record.patientId);
                          const isHighlighted = debouncedReportSearchTerm && patientName.toLowerCase().includes(debouncedReportSearchTerm.toLowerCase());
                          const medsString = Array.isArray(record.medications) ? record.medications.map(m => `${getMedicationName(m.medicationId, medications)} (${m.quantity})`).join(', ') : 'N/A';
                          return (
                            <tr key={record.id} className={`border-b hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                <td className={`py-2 px-3 font-medium text-gray-800 ${isHighlighted ? 'bg-yellow-100' : ''}`}>{patientName}</td>
                                <td className="py-2 px-3 text-gray-700">{new Date(record.entryDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short'})}</td>
                                <td className="py-2 px-3 text-gray-700">{medsString}</td>
                                <td className="py-2 px-3 text-gray-700">
                                    {`R$ ${(Number(record.totalValue) || 0).toFixed(2)}`}
                                </td>
                                <td className="py-2 px-3">
                                    <StatusBadge status={record.status} />
                                </td>
                            </tr>
                          )
                        })}
                    </tbody>
                </table>
                {filteredRecordsForReport.length === 0 && (
                   <p className="text-center text-gray-500 py-6">
                     {statusFilter === 'Todos' ? 'Nenhuma entrada encontrada para os filtros selecionados.' : `Nenhuma entrada com status '${statusFilter}' encontrada.`}
                   </p>
                )}
            </div>
            {/* Paginação */}
            {filteredRecordsForReport.length > itemsPerPage && (
               <div className="flex justify-between items-center pt-4 border-t mt-4">
                 <span className="text-sm text-gray-700">
                   Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, filteredRecordsForReport.length)}
                   {' a '}
                   {Math.min(currentPage * itemsPerPage, filteredRecordsForReport.length)}
                   {' de '}
                   {filteredRecordsForReport.length} registros
                 </span>
                 <div className="flex items-center gap-2">
                   <button
                     onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                     disabled={currentPage === 1}
                     className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                     title="Ir para a página anterior">
                     Anterior
                   </button>
                   <span className="text-sm font-medium">
                     Página {currentPage} de {totalPages > 0 ? totalPages : 1}
                   </span>
                   <button
                     onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                     disabled={currentPage === totalPages || totalPages === 0}
                     className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                     title="Ir para a próxima página">
                     Próxima
                   </button>
                 </div>
               </div>
            )}
        </section>

        {/* --- Seção: Entregas Recentes --- */}
        <section id="deliveries-section" className="bg-white rounded-lg shadow p-4 md:p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Últimas Entregas (Última Semana)</h3>
            {recentDeliveries.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="text-left py-2 px-3 font-semibold text-gray-600">Paciente</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-600">Data Entrega</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-600">Medicações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Mostra apenas as últimas 5 */}
                            {recentDeliveries.slice(0, 5).map((record, index) => {
                                const medsString = Array.isArray(record.medications) ? record.medications.map(m => `${getMedicationName(m.medicationId, medications)} (${m.quantity})`).join(', ') : 'N/A';
                                return (
                                    <tr key={record.id} className={`border-b hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                        <td className="py-2 px-3 font-medium text-gray-800">{getPatientNameById(record.patientId)}</td>
                                        <td className="py-2 px-3 text-gray-700">{new Date(record.deliveryDate + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                        <td className="py-2 px-3 text-gray-700">{medsString}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {recentDeliveries.length > 5 && (
                        <div className="text-center mt-4">
                            <a href="#report-section" onClick={(e) => { e.preventDefault(); setFilterStatus('Atendido'); setFilterPeriod('7'); document.getElementById('report-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm text-blue-600 hover:underline">
                                Ver todas as {recentDeliveries.length} entregas da semana no relatório...
                            </a>
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-center text-gray-500 py-6">Nenhuma entrega registrada na última semana.</p>
            )}
        </section>

    </div> // Fecha o container principal da página
  );
}