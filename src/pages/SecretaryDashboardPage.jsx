// src/pages/SecretaryDashboardPage.jsx
import React, { useState, useMemo, useEffect, navigate } from 'react';
import { useNavigate } from 'react-router-dom'; // Para navegação se necessário

// --- Imports de Componentes ---
import { BarChart } from '../components/common/BarChart';
import { PatientRecordsTable } from '../components/common/PatientRecordsTable';
import { RecentDeliveriesTab } from '../components/common/RecentDeliveriesTab';
import { StatusBadge } from '../components/common/StatusBadge';
import icons from '../utils/icons'; // Ajuste o caminho ../ se necessário

// --- Imports de Utils ---
import { getMedicationName } from '../utils/helpers'; // Importa da pasta utils

// --- Componente da Página ---
export default function SecretaryDashboardPage({
    user, // Pode ser útil para mostrar o nome
    annualBudget, // Recebe o orçamento
    patients = [], // Recebe lista de pacientes
    records = [], // Recebe lista de registros
    medications = [], // Recebe lista de medicações
    filterYear = new Date().getFullYear(), // Recebe o ano do filtro do MainLayout ou App
    activeTabForced, // Indica qual visão mostrar
    addToast // Para notificações
}) {
  const navigate = useNavigate(); // Hook para navegação programática

  // --- Estados Internos da Página ---
  const [currentView, setCurrentView] = useState('dashboard'); // Visão interna
  // Estados para a visão 'records' (Histórico por Paciente)
  const [searchTermPatient, setSearchTermPatient] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  // Estados para a visão 'all_history' (Relatório Geral)
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [reportSearchTerm, setReportSearchTerm] = useState('');

   // --- Efeito para atualizar a visão baseado na prop da Rota ---
   useEffect(() => {
    if (activeTabForced) {
      setCurrentView(activeTabForced);
    } else {
        setCurrentView('dashboard'); // Padrão
    }
  }, [activeTabForced]);

  // --- Funções Helper Internas ---
  const getPatientNameById = (patientId) => {
    return patients.find(p => p.id === patientId)?.name || 'Desconhecido';
  };

  // --- Memos para dados derivados ---
  // Filtro de pacientes para a busca na visão 'records'
  const filteredPatientsForSearch = useMemo(() =>
    patients.filter(p =>
        p.name.toLowerCase().includes(searchTermPatient.toLowerCase()) ||
        (p.cpf && String(p.cpf).includes(searchTermPatient)) ||
        (p.susCard && String(p.susCard).includes(searchTermPatient))
    ).sort((a, b) => a.name.localeCompare(b.name)),
    [patients, searchTermPatient]);

  // Registros do paciente selecionado na visão 'records'
  const selectedPatientRecords = useMemo(() => {
    if (!selectedPatient) return [];
    return records.filter(r => r.patientId === selectedPatient.id)
                  .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));
  }, [selectedPatient, records]);

  // Registros filtrados para o Relatório Geral ('all_history')
  const filteredRecordsForReport = useMemo(() => {
    let filtered = [...records];
    // Filtro por período
    if(filterPeriod !== 'all') {
        const days = parseInt(filterPeriod, 10);
        if (!isNaN(days)) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            cutoffDate.setHours(0, 0, 0, 0); // Começo do dia
            filtered = filtered.filter(r => new Date(r.entryDate) >= cutoffDate);
        }
    }
    // Filtro por status
    if(filterStatus !== 'all') {
        filtered = filtered.filter(r => r.status === filterStatus);
    }
    // Filtro por nome do paciente
    const searchTermLower = reportSearchTerm.toLowerCase();
    if (searchTermLower) {
        filtered = filtered.filter(r => getPatientNameById(r.patientId).toLowerCase().includes(searchTermLower));
    }
    // Ordena por data de entrada mais recente
    return filtered.sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));

  }, [records, patients, filterPeriod, filterStatus, reportSearchTerm]); // Inclui 'patients' na dependência

  // Registros do ano selecionado (para gráfico do dashboard)
  const recordsByYear = useMemo(() =>
    records.filter(r => new Date(r.entryDate).getFullYear() === filterYear),
    [records, filterYear]);

  // Dados para o gráfico de atendimentos mensais
  const monthlyAttendanceData = useMemo(() => {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      // Usar Set para contar pacientes únicos por mês
      const attendanceByMonth = Array(12).fill(null).map(() => new Set());

      recordsByYear.forEach(record => {
          // Considera apenas registros 'Atendido'
          if (record.status === 'Atendido') {
              const recordDate = new Date(record.entryDate);
              const monthIndex = recordDate.getMonth(); // 0 = Janeiro, 11 = Dezembro
              if(monthIndex >= 0 && monthIndex < 12){ // Checagem de segurança
                 attendanceByMonth[monthIndex].add(record.patientId); // Adiciona ID do paciente ao Set
              }
          }
      });
      // Mapeia para o formato do gráfico
      return months.map((monthLabel, index) => ({
          label: monthLabel,
          value: attendanceByMonth[index].size // Pega o tamanho do Set (pacientes únicos)
      }));
  }, [recordsByYear]); // Depende dos registros filtrados por ano

  // --- Função para Exportar PDF (Relatório Geral) ---
  const handleExportPDF = () => {
      // Verifica se há dados para exportar
      if (filteredRecordsForReport.length === 0) {
          addToast?.('Não há dados para exportar com os filtros selecionados.', 'error');
          return;
      }

      const reportTitle = "Relatório Geral de Entradas";
      const printWindow = window.open('', '_blank', 'height=800,width=1000'); // Abre em nova aba
      if (!printWindow) {
          addToast?.('Não foi possível abrir a janela de impressão. Verifique bloqueadores de pop-up.', 'error');
          return;
      }

      // Estilos básicos para impressão
      const styles = `
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 10pt; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
          th { background-color: #f2f2f2; font-weight: bold; }
          h1 { font-size: 16pt; text-align: center; margin-bottom: 20px; }
          @media print {
              body { padding: 10px; font-size: 9pt; }
              button { display: none; } /* Esconde botões na impressão */
              h1 { font-size: 14pt; margin-bottom: 15px; }
              th, td { padding: 4px 6px; }
          }
      `;

      printWindow.document.write('<html><head><title>' + reportTitle + '</title>');
      printWindow.document.write('<style>' + styles + '</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write('<h1>' + reportTitle + '</h1>');
      // Adiciona informações dos filtros usados (opcional)
      printWindow.document.write(`<p style="font-size: 9pt; color: #555;">Filtros aplicados: Período (${filterPeriod}), Status (${filterStatus}), Busca (${reportSearchTerm || 'Nenhuma'})</p>`);

      printWindow.document.write('<table><thead><tr><th>Paciente</th><th>Data Entrada</th><th>Data Atend.</th><th>Medicações</th><th>Valor Total</th><th>Status</th></tr></thead><tbody>');

      filteredRecordsForReport.forEach(record => {
          const patientName = getPatientNameById(record.patientId);
          const entryDate = new Date(record.entryDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short'});
          const deliveryDate = record.deliveryDate ? new Date(record.deliveryDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short'}) : '---';
          // Lista de medicações formatada
          const medsList = record.medications.map(m => {
              const medName = getMedicationName(m.medicationId, medications);
              const valueFormatted = (m.value && !isNaN(m.value)) ? ` (R$ ${Number(m.value).toFixed(2)})` : '';
              return `${medName} (${m.quantity})${valueFormatted}`;
          }).join('<br>'); // Usa <br> para quebra de linha no HTML
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
      // Adiciona botão para imprimir (opcional, pois o foco já chama print)
      // printWindow.document.write('<button onclick="window.print(); window.close();" style="margin-top: 20px;">Imprimir</button>');
      printWindow.document.write('</body></html>');
      printWindow.document.close(); // Essencial para finalizar o carregamento
      printWindow.focus(); // Foca na nova janela

      // Atraso para garantir que o conteúdo carregou antes de imprimir
      setTimeout(() => {
         printWindow.print();
         // Não fechar automaticamente para o usuário poder salvar como PDF
         // printWindow.close();
      }, 500); // Aumentar se necessário
  };

  // --- Renderização Condicional do Conteúdo ---
  const renderCurrentView = () => {
     switch(currentView) {
        // VISÃO: DASHBOARD (Gráfico)
        case 'dashboard':
          return (
            <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard Secretária</h2>
                {/* Seção do Gráfico */}
                <section className="bg-white p-4 md:p-6 rounded-lg shadow">
                    {/* Pode adicionar um seletor de ano aqui se não quiser usar o global */}
                    <BarChart data={monthlyAttendanceData} title={`Pacientes Únicos Atendidos por Mês (${filterYear})`} />
                </section>
                {/* Outras seções do dashboard podem ser adicionadas aqui */}
                 <RecentDeliveriesTab records={records} patients={patients} medications={medications} />
            </div>
          );

       // VISÃO: HISTÓRICO POR PACIENTE
       case 'records': // Corresponde a 'patient-history' na rota
         return (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-10rem)] animate-fade-in"> {/* Altura ajustada */}
                {/* Coluna de Busca */}
               <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow flex flex-col">
                   <h3 className="text-xl font-bold mb-4 text-gray-800">Buscar Paciente</h3>
                   <div className="relative mb-4">
                     <input type="text" placeholder="Nome, CPF ou SUS..." className="w-full p-2 pl-10 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" value={searchTermPatient} onChange={e => setSearchTermPatient(e.target.value)} />
                     <div className="absolute left-3 top-2.5 text-gray-400 w-4 h-4">{icons.search}</div>
                   </div>
                   {/* Lista Rolável */}
                   <div className="space-y-2 overflow-y-auto pr-2 -mr-2 flex-grow">
                     {filteredPatientsForSearch.length > 0 ? filteredPatientsForSearch.map(p => (
                         <div key={p.id}
                              className={`p-3 rounded-lg cursor-pointer border ${selectedPatient?.id === p.id ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-50 border-transparent hover:border-gray-200'}`}
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
               {/* Coluna de Histórico */}
               <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-lg shadow flex flex-col">
                   {selectedPatient ? (
                       <>
                           <h3 className="text-lg md:text-xl font-bold mb-4 text-gray-800 text-left">Histórico: <span className="text-blue-600">{selectedPatient.name}</span></h3>
                           {/* Tabela de Histórico Rolável */}
                            <div className="flex-grow overflow-y-auto -mx-4 md:-mx-6 px-4 md:px-6">
                              <PatientRecordsTable records={selectedPatientRecords} medications={medications} />
                            </div>
                       </>
                   ) : (
                       <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                           <div className="mb-4 text-gray-300 w-16 h-16">{icons.clipboard}</div>
                           <h2 className="text-xl font-semibold">Selecione um Paciente</h2>
                           <p className="text-sm">Escolha um paciente na lista para ver seu histórico de entregas.</p>
                       </div>
                   )}
               </div>
           </div>
         );

       // VISÃO: RELATÓRIO GERAL
       case 'all_history': // Corresponde a 'reports-general' na rota
         return (
           <div className="bg-white rounded-lg shadow p-4 md:p-6 animate-fade-in">
             {/* Header do Relatório */}
             <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3 border-b pb-4">
               <h2 className="text-xl md:text-2xl font-bold text-gray-800">Relatório Geral de Entradas</h2>
               <button onClick={handleExportPDF} disabled={filteredRecordsForReport.length === 0} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto">
                   <span className="w-4 h-4">{icons.download}</span> Exportar para PDF
               </button>
             </div>
             {/* Filtros */}
              <div className="flex flex-col md:flex-row flex-wrap gap-4 items-end mb-4 p-4 bg-gray-50 rounded-lg border">
                   {/* Busca por Paciente */}
                   <div className="flex-grow w-full md:w-auto">
                       <label className="text-xs font-medium text-gray-700 mb-1 block" htmlFor="report-search">Buscar por Paciente</label>
                       <input type="text" id="report-search" placeholder="Nome do paciente..." value={reportSearchTerm} onChange={e => setReportSearchTerm(e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                   </div>
                   {/* Filtro Período */}
                   <div className="w-full sm:w-auto">
                       <label className="text-xs font-medium text-gray-700 mb-1 block" htmlFor="report-period">Período</label>
                       <select id="report-period" value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} className="w-full p-2 border rounded-lg text-sm bg-white">
                           <option value="all">Todos</option>
                           <option value="7">Últimos 7 dias</option>
                           <option value="30">Últimos 30 dias</option>
                           <option value="90">Últimos 90 dias</option>
                       </select>
                   </div>
                   {/* Filtro Status */}
                   <div className="w-full sm:w-auto">
                       <label className="text-xs font-medium text-gray-700 mb-1 block" htmlFor="report-status">Status</label>
                       <select id="report-status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full p-2 border rounded-lg text-sm bg-white">
                           <option value="all">Todos</option>
                           <option value="Atendido">Atendido</option>
                           <option value="Pendente">Pendente</option>
                           <option value="Cancelado">Cancelado</option>
                       </select>
                   </div>
                    {/* Contador de Registros */}
                    <div className="text-sm text-gray-600 mt-2 md:mt-0">
                        {filteredRecordsForReport.length} registro(s) encontrado(s).
                    </div>
               </div>
             {/* Tabela de Resultados */}
             <div className="overflow-x-auto">
                 <table className="min-w-full bg-white text-sm">
                     <thead className="bg-gray-100">
                         <tr>
                             <th className="text-left py-2 px-3 font-semibold text-gray-600">Paciente</th>
                             <th className="text-left py-2 px-3 font-semibold text-gray-600">Entrada</th>
                             <th className="text-left py-2 px-3 font-semibold text-gray-600">Medicações</th>
                             <th className="text-left py-2 px-3 font-semibold text-gray-600">Valor Total</th>
                             <th className="text-left py-2 px-3 font-semibold text-gray-600">Status</th>
                         </tr>
                     </thead>
                     <tbody>
                         {filteredRecordsForReport.map(record => (
                             <tr key={record.id} className="border-b hover:bg-gray-50">
                                 <td className="py-2 px-3 font-medium text-gray-800">{getPatientNameById(record.patientId)}</td>
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
                         ))}
                     </tbody>
                 </table>
                 {filteredRecordsForReport.length === 0 && <p className="text-center text-gray-500 py-6">Nenhuma entrada encontrada para os filtros selecionados.</p>}
             </div>
         </div>
         );

        // VISÃO: ENTREGAS RECENTES
        case 'deliveries':
           return <RecentDeliveriesTab records={records} patients={patients} medications={medications} />;

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
    <div className="space-y-6">
      {renderCurrentView()}
      {/* Modais específicos desta página (se houver) podem ser colocados aqui */}
    </div>
  );
}