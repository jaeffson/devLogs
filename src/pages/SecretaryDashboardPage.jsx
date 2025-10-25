// src/pages/SecretaryDashboardPage.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// --- Imports de Componentes ---
import { BarChart } from '../components/common/BarChart';
import { PatientRecordsTable } from '../components/common/PatientRecordsTable';
import { RecentDeliveriesTab } from '../components/common/RecentDeliveriesTab';
import { StatusBadge } from '../components/common/StatusBadge';
import icons from '../utils/icons'; // Ajuste o caminho ../ se necessário
import useDebounce from '../hooks/useDebounce'; // Assumindo que /src/hooks/useDebounce.js existe

// --- Imports de Utils ---
import { getMedicationName } from '../utils/helpers'; // Importa da pasta utils

// --- Componente da Página ---
export default function SecretaryDashboardPage({
    user,
    annualBudget,
    patients = [],
    records = [],
    medications = [],
    filterYear = new Date().getFullYear(),
    activeTabForced,
    addToast
}) {
  const navigate = useNavigate();

  // --- Estados Internos da Página ---
  const [currentView, setCurrentView] = useState('dashboard');
  const [searchTermPatient, setSearchTermPatient] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // --- Debounce ---
  const debouncedSearchTermPatient = useDebounce(searchTermPatient, 300);
  const debouncedReportSearchTerm = useDebounce(reportSearchTerm, 300);

  // --- Flags de Feedback de Carregamento/Busca ---
  const isSearchingPatient = searchTermPatient !== debouncedSearchTermPatient;
  const isSearchingReport = reportSearchTerm !== debouncedReportSearchTerm;

    // --- Efeito para atualizar a visão ---
    useEffect(() => {
     if (activeTabForced) {
       setCurrentView(activeTabForced);
     } else {
        setCurrentView('dashboard');
     }
    }, [activeTabForced]);

    // --- Efeito para Paginação ---
    useEffect(() => {
        setCurrentPage(1);
    }, [filterPeriod, filterStatus, debouncedReportSearchTerm]);


  // --- Funções Helper Internas ---
  const getPatientNameById = (patientId) => {
    return patients.find(p => p.id === patientId)?.name || 'Desconhecido';
  };

  // --- Memos para dados derivados ---
  const filteredPatientsForSearch = useMemo(() =>
    patients.filter(p =>
        p.name.toLowerCase().includes(debouncedSearchTermPatient.toLowerCase()) ||
        (p.cpf && String(p.cpf).includes(debouncedSearchTermPatient)) ||
        (p.susCard && String(p.susCard).includes(debouncedSearchTermPatient))
    ).sort((a, b) => a.name.localeCompare(b.name)),
    [patients, debouncedSearchTermPatient]);

  const selectedPatientRecords = useMemo(() => {
    if (!selectedPatient) return [];
    return records.filter(r => r.patientId === selectedPatient.id)
               .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));
  }, [selectedPatient, records]);

  const filteredRecordsForReport = useMemo(() => {
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

  const totalPages = useMemo(() => {
    return Math.ceil(filteredRecordsForReport.length / itemsPerPage);
  }, [filteredRecordsForReport, itemsPerPage]);

  const currentRecordsForReport = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredRecordsForReport.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredRecordsForReport, currentPage, itemsPerPage]);

  const recordsByYear = useMemo(() =>
    records.filter(r => new Date(r.entryDate).getFullYear() === filterYear),
    [records, filterYear]);

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
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
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
          const medsList = record.medications.map(m => {
              const medName = getMedicationName(m.medicationId, medications);
              const valueFormatted = (m.value && !isNaN(m.value)) ? ` (R$ ${Number(m.value).toFixed(2)})` : '';
              return `${medName} (${m.quantity})${valueFormatted}`;
          }).join('<br>');
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

  // --- Função para navegar e aplicar filtro ---
  const navigateWithFilter = (view, status) => {
    setFilterStatus(status);
    setCurrentView(view);
  };

  // --- Renderização Condicional do Conteúdo ---
  const renderCurrentView = () => {
     switch(currentView) {
        // VISÃO: DASHBOARD (Gráfico e Atalhos)
        case 'dashboard':
          return (
            <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard Secretária</h2>
                
                {/* --- NOVO: Atalhos Rápidos --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Atalho Pendências */}
                    <div className="bg-white p-4 md:p-6 rounded-lg shadow hover:shadow-lg transition-shadow flex flex-col items-center justify-center text-center cursor-pointer"
                         onClick={() => navigateWithFilter('all_history', 'Pendente')}
                         title="Ver todos os registros com status Pendente">
                        <span className="text-yellow-500 w-10 h-10 mb-2">{icons.pending || icons.clipboard}</span> {/* Use um ícone apropriado */}
                        <h3 className="text-lg font-semibold text-gray-700">Ver Pendências</h3>
                        <p className="text-sm text-gray-500">Ir para o relatório filtrado</p>
                    </div>
                    {/* Atalho Ver Históricos (Pacientes) */}
                    <div className="bg-white p-4 md:p-6 rounded-lg shadow hover:shadow-lg transition-shadow flex flex-col items-center justify-center text-center cursor-pointer"
                         onClick={() => setCurrentView('records')}
                         title="Buscar histórico por paciente específico">
                         <span className="text-blue-500 w-10 h-10 mb-2">{icons.users}</span>
                        <h3 className="text-lg font-semibold text-gray-700">Ver Históricos</h3>
                        <p className="text-sm text-gray-500">Buscar por paciente</p>
                    </div>
                    {/* Atalho Entregas Recentes */}
                    <div className="bg-white p-4 md:p-6 rounded-lg shadow hover:shadow-lg transition-shadow flex flex-col items-center justify-center text-center cursor-pointer"
                         onClick={() => setCurrentView('deliveries')}
                         title="Ver registros atendidos na última semana">
                         <span className="text-green-500 w-10 h-10 mb-2">{icons.check || icons.calendar}</span> {/* Use um ícone apropriado */}
                        <h3 className="text-lg font-semibold text-gray-700">Entregas Recentes</h3>
                        <p className="text-sm text-gray-500">Ver atendidos na semana</p>
                    </div>
                </div>
                {/* --- FIM: Atalhos Rápidos --- */}

                {/* Seção do Gráfico */}
                <section className="bg-white p-4 md:p-6 rounded-lg shadow">
                    <BarChart data={monthlyAttendanceData} title={`Pacientes Únicos Atendidos por Mês (${filterYear})`} />
                </section>
            </div>
          );

       // VISÃO: HISTÓRICO POR PACIENTE
       case 'records':
         return (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)] animate-fade-in">
              <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow flex flex-col min-h-0">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Buscar Paciente</h3>
                  <div className="relative mb-4">
                     <input type="text" placeholder="Nome, CPF ou SUS..." className="w-full p-2 pl-10 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                       value={searchTermPatient}
                       onChange={e => setSearchTermPatient(e.target.value)}
                     />
                     <div className="absolute left-3 top-2.5 text-gray-400 w-4 h-4">
                       {/* --- NOVO: Indicador de loading --- */}
                       {isSearchingPatient ? (
                         <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                       ) : (
                         icons.search
                       )}
                     </div>
                  </div>
                  <div className="overflow-y-auto pr-2 -mr-2 flex-grow min-h-0"> {/* Lista Rolável */}
                     {filteredPatientsForSearch.length > 0 ? filteredPatientsForSearch.map((p, index) => ( // Adicionado index
                         <div key={p.id}
                              // --- NOVO: Linhas Zebradas ---
                              className={`p-3 rounded-lg cursor-pointer border ${selectedPatient?.id === p.id ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-100 border-transparent hover:border-gray-200'} ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                              onClick={() => setSelectedPatient(p)}
                              role="button" tabIndex={0}
                              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedPatient(p)}
                         >
                             <p className="font-semibold text-gray-800 text-sm truncate">{p.name}</p>
                             <p className="text-xs text-gray-500 mt-0.5">{p.cpf || p.susCard || 'Sem documento'}</p>
                         </div>
                     )) : (
                         <p className="text-center text-gray-500 py-4 text-sm">Nenhum paciente encontrado.</p>
                     )}
                  </div>
              </div>
              <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-lg shadow flex flex-col min-h-0">
                  {selectedPatient ? (
                      <>
                          <h3 className="text-lg md:text-xl font-bold mb-4 text-gray-800 text-left">Histórico: <span className="text-blue-600">{selectedPatient.name}</span></h3>
                           <div className="flex-grow min-h-0 overflow-y-auto -mx-4 md:-mx-6 px-4 md:px-6">
                             <PatientRecordsTable
                                records={selectedPatientRecords}
                                medications={medications}
                             />
                           </div>
                      </>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                          <div className="mb-4 text-gray-300 w-16 h-16">{icons.clipboard}</div>
                          <h2 className="text-xl font-semibold">Selecione um Paciente</h2>
                          <p className="text-sm">Escolha um paciente na lista para ver seu histórico.</p>
                      </div>
                  )}
              </div>
           </div>
         );

       // VISÃO: RELATÓRIO GERAL
       case 'all_history':
         return (
           <div className="bg-white rounded-lg shadow p-4 md:p-6 animate-fade-in flex flex-col h-[calc(100vh-8rem)]">
             <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3 border-b pb-4">
               <h2 className="text-xl md:text-2xl font-bold text-gray-800">Relatório Geral de Entradas</h2>
               <button onClick={handleExportPDF} disabled={filteredRecordsForReport.length === 0} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
                 title="Exportar a lista filtrada abaixo para um arquivo PDF"> {/* --- NOVO: Tooltip --- */}
                   <span className="w-4 h-4">{icons.download}</span> Exportar para PDF
               </button>
             </div>
              <div className="flex flex-col md:flex-row flex-wrap gap-4 items-end mb-4 p-4 bg-gray-50 rounded-lg border">
                  {/* Busca por Paciente */}
                  <div className="flex-grow w-full md:w-auto relative"> {/* Adicionado relative */}
                      <label className="text-xs font-medium text-gray-700 mb-1 block" htmlFor="report-search">Buscar por Paciente</label>
                      <input type="text" id="report-search" placeholder="Nome do paciente..."
                        value={reportSearchTerm}
                        onChange={e => setReportSearchTerm(e.target.value)}
                        // --- NOVO: Indicador de Filtro Ativo ---
                        className={`w-full p-2 border rounded-lg text-sm pr-8 ${reportSearchTerm ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300'}`} />
                      {/* --- NOVO: Indicador de loading --- */}
                      {isSearchingReport && (
                        <div className="absolute right-2 top-7 text-gray-400 w-4 h-4">
                          <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                           </svg>
                        </div>
                      )}
                  </div>
                  {/* Filtro Período */}
                  <div className="w-full sm:w-auto">
                      <label className="text-xs font-medium text-gray-700 mb-1 block" htmlFor="report-period">Período</label>
                      <select id="report-period" value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}
                        // --- NOVO: Indicador de Filtro Ativo ---
                        className={`w-full p-2 border rounded-lg text-sm bg-white ${filterPeriod !== 'all' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300'}`}>
                          <option value="all">Todos</option>
                          <option value="7">Últimos 7 dias</option>
                          <option value="30">Últimos 30 dias</option>
                          <option value="90">Últimos 90 dias</option>
                      </select>
                  </div>
                  {/* Filtro Status */}
                  <div className="w-full sm:w-auto">
                      <label className="text-xs font-medium text-gray-700 mb-1 block" htmlFor="report-status">Status</label>
                      <select id="report-status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                        // --- NOVO: Indicador de Filtro Ativo ---
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
             <div className="overflow-x-auto overflow-y-auto flex-grow min-h-0">
                 <table className="min-w-full bg-white text-sm">
                     <thead className="bg-gray-100 sticky top-0">
                         <tr>
                             <th className="text-left py-2 px-3 font-semibold text-gray-600" title="Nome do Paciente">Paciente</th> {/* --- NOVO: Tooltip --- */}
                             <th className="text-left py-2 px-3 font-semibold text-gray-600" title="Data e hora que o registro foi criado">Entrada</th> {/* --- NOVO: Tooltip --- */}
                             <th className="text-left py-2 px-3 font-semibold text-gray-600" title="Medicamentos e quantidades registrados">Medicações</th> {/* --- NOVO: Tooltip --- */}
                             <th className="text-left py-2 px-3 font-semibold text-gray-600" title="Valor total calculado dos medicamentos">Valor Total</th> {/* --- NOVO: Tooltip --- */}
                             <th className="text-left py-2 px-3 font-semibold text-gray-600" title="Situação atual do registro">Status</th> {/* --- NOVO: Tooltip --- */}
                         </tr>
                     </thead>
                     {/* --- NOVO: tbody com classe para opacidade durante busca --- */}
                     <tbody className={isSearchingReport ? 'opacity-75 transition-opacity duration-300' : ''}>
                         {currentRecordsForReport.map((record, index) => { // Adicionado index
                           // --- NOVO: Lógica de destaque ---
                           const patientName = getPatientNameById(record.patientId);
                           const isHighlighted = debouncedReportSearchTerm && patientName.toLowerCase().includes(debouncedReportSearchTerm.toLowerCase());
                           return (
                             // --- NOVO: Linhas Zebradas ---
                             <tr key={record.id} className={`border-b hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                 {/* --- NOVO: Destaque na célula --- */}
                                 <td className={`py-2 px-3 font-medium text-gray-800 ${isHighlighted ? 'bg-yellow-100' : ''}`}>{patientName}</td>
                                 <td className="py-2 px-3 text-gray-700">{new Date(record.entryDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short'})}</td>
                                 <td className="py-2 px-3 text-gray-700">
                                     {record.medications.map(m => `${getMedicationName(m.medicationId, medications)} (${m.quantity})`).join(', ')}
                                 </td>
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
             {filteredRecordsForReport.length > itemsPerPage && (
                <div className="flex justify-between items-center pt-4 border-t mt-auto">
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
                      title="Ir para a página anterior"> {/* --- NOVO: Tooltip --- */}
                      Anterior
                    </button>
                    <span className="text-sm font-medium">
                      Página {currentPage} de {totalPages > 0 ? totalPages : 1}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Ir para a próxima página"> {/* --- NOVO: Tooltip --- */}
                      Próxima
                    </button>
                  </div>
                </div>
             )}
          </div>
         );

       // VISÃO: ENTREGAS RECENTES
       case 'deliveries':
         return (
           <div className="bg-white rounded-lg shadow p-4 md:p-6 animate-fade-in flex flex-col h-[calc(100vh-8rem)]">
             <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800">Entregas da Última Semana</h2>
             <div className="flex-grow min-h-0 overflow-y-auto">
               <RecentDeliveriesTab
                 records={recentDeliveries}
                 patients={patients}
                 medications={medications}
               />
               {recentDeliveries.length === 0 && (
                  <p className="text-center text-gray-500 py-10">Nenhuma entrega registrada na última semana.</p>
               )}
             </div>
           </div>
         );

       default: // Fallback para Dashboard
         return (
            <div className="text-center p-10">
                <h2 className="text-xl font-semibold text-gray-700">Visão Inválida</h2>
                <p className="text-gray-500">Ocorreu um erro ao carregar a visualização solicitada.</p>
                <button onClick={() => setCurrentView('dashboard')} className="mt-4 text-blue-600 hover:underline">Voltar ao Dashboard</button>
            </div>
          );
     }
  };

  // --- Renderização Principal da Página ---
  return (
    <>
      {renderCurrentView()}
      {/* Modais removidos pois secretário não edita/cria/confirma ações aqui */}
    </>
  );
}