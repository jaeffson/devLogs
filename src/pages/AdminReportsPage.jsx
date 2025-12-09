// src/pages/AdminReportsPage.jsx
// (ATUALIZADO: Tema Claro Moderno, Funcionalidade Exportar PDF)

import React, { useState, useMemo, useEffect, useRef } from 'react'; 
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Imports de Componentes (Opcional: Gráficos) ---
import { BarChart } from '../components/common/BarChart';
import { AnnualBudgetChart } from '../components/common/AnnualBudgetChart';

// --- Imports de Utils ---
import { getMedicationName } from '../utils/helpers';
import { icons } from '../utils/icons';

// --- NOSSOS NOVOS SKELETONS ---
import { SkeletonCard } from '../components/common/SkeletonCard';
import { SkeletonBlock } from '../components/common/SkeletonBlock';

// --- Componente da Página ---
export default function AdminReportsPage({
  user,
  patients = [],
  records = [],
  medications = [],
  users = [],
  annualBudget,
  filterYear, 
}) {
  // Cria uma referência para o container que será exportado como PDF
  const reportRef = useRef(null); 
  const [isLoading, setIsLoading] = useState(true);

  // Simula o carregamento dos dados
  useEffect(() => {
    setIsLoading(true); 

    const timer = setTimeout(() => {
      setIsLoading(false); 
    }, 1000);

    return () => clearTimeout(timer);
  }, [filterYear]);

  // --- Memos para Calcular Estatísticas (Lógica Mantida) ---

  const recordsThisYear = useMemo(
    () =>
      records.filter((r) => new Date(r.entryDate).getFullYear() === filterYear),
    [records, filterYear]
  );

  const generalStats = useMemo(() => {
    const totalRecords = recordsThisYear.length;
    const attended = recordsThisYear.filter(
      (r) => r.status === 'Atendido'
    ).length;
    const pending = recordsThisYear.filter(
      (r) => r.status === 'Pendente'
    ).length;
    const canceled = recordsThisYear.filter(
      (r) => r.status === 'Cancelado'
    ).length;
    const totalCost = recordsThisYear.reduce(
      (sum, r) => sum + (Number(r.totalValue) || 0),
      0
    );
    const uniquePatientsAttended = new Set(
      recordsThisYear
        .filter((r) => r.status === 'Atendido')
        .map((r) => r.patientId)
    ).size;

    return {
      totalPatients: patients.length,
      totalRecords,
      attended,
      pending,
      canceled,
      totalCost,
      uniquePatientsAttended,
    };
  }, [patients, recordsThisYear]);

  const statusChartData = useMemo(
    () => [
      { label: 'Atendidos', value: generalStats.attended },
      { label: 'Pendentes', value: generalStats.pending },
      { label: 'Cancelados', value: generalStats.canceled },
    ],
    [generalStats]
  );

  const monthlyCostData = useMemo(() => {
    const months = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ];
    const costByMonth = Array(12).fill(0);

    recordsThisYear.forEach((record) => {
      const monthIndex = new Date(record.entryDate).getMonth();
      if (monthIndex >= 0 && monthIndex < 12) {
        costByMonth[monthIndex] += Number(record.totalValue) || 0;
      }
    });

    return months.map((monthLabel, index) => ({
      label: monthLabel,
      value: costByMonth[index], 
    }));
  }, [recordsThisYear]);

  const medicationUsage = useMemo(() => {
    const usageCount = {};
    recordsThisYear.forEach((record) => {
      record.medications.forEach((medItem) => {
        const medId = medItem.medicationId;
        usageCount[medId] = (usageCount[medId] || 0) + 1; 
      });
    });
    return Object.entries(usageCount)
      .map(([medId, count]) => ({
        id: medId,
        name: getMedicationName(medId, medications),
        count: count,
      }))
      .sort((a, b) => b.count - a.count); 
  }, [recordsThisYear, medications]);


  // --- Função de Exportação de PDF ---
  const handleExportPdf = () => {
    if (!reportRef.current) return;

    // Garante que o usuário vê que algo está acontecendo
    setIsLoading(true);

    // Ajusta a escala para melhor resolução no PDF
    const scale = 2; 

    html2canvas(reportRef.current, {
      scale: scale,
      useCORS: true, // Necessário se houver imagens externas
      logging: false,
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4'); // 'p': portrait, 'mm': units, 'a4': format
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Adiciona a primeira página (ou a única)
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Se o conteúdo for maior que uma página, adiciona mais páginas
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Relatorio_Anual_${filterYear}.pdf`);
      setIsLoading(false); // Finaliza o carregamento
    });
  };
  // --- Fim Função de Exportação de PDF ---


  // --- Componente de Card de Estatística (Novo Visual Claro) ---
  const StatCard = ({ title, value, colorClass, icon, span = 1, format = (v) => v }) => (
    <div className={`p-5 rounded-xl shadow-md border border-gray-100 bg-white transition-all hover:shadow-lg lg:col-span-${span}`}>
      <div className={`text-3xl font-bold ${colorClass}`}>
        {icons[icon]}
      </div>
      <div className="text-xl font-bold text-gray-900 mt-3 flex items-end justify-between">
          {format(value)}
      </div>
      <div className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-wider">
        {title}
      </div>
    </div>
  );

  // --- Renderização ---
  return (
    <div className="space-y-8 animate-fade-in min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header da Página (Sempre visível) */}
      <div className="flex flex-col md:flex-row justify-between items-center pb-4 border-b border-gray-200">
        <h2 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
          {icons.chart} Centro de Comando & Relatórios
        </h2>
        <div className="flex items-center gap-4 mt-2 md:mt-0">
          <p className="text-gray-500 text-sm">
            Análise: <span className="font-semibold text-blue-600">{filterYear}</span>
          </p>
          <button
            onClick={handleExportPdf}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-md font-semibold text-sm transition-all flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                {icons.loading} Gerando...
              </>
            ) : (
              <>
                {icons.download} Exportar PDF
              </>
            )}
          </button>
        </div>
      </div>

      {isLoading && !reportRef.current ? ( // Mostra skeleton apenas no carregamento inicial
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-xl shadow-xl border border-gray-200">
            <div className="h-6 w-1/3 rounded bg-gray-200 animate-pulse mb-6"></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
              {[...Array(9)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </section>
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonBlock />
            <SkeletonBlock />
          </section>
          <section className="bg-white p-6 rounded-xl shadow-xl border border-gray-200">
            <SkeletonBlock />
          </section>
        </div>
      ) : (
        // --- CONTEÚDO REAL DENTRO DO CONTAINER PARA PDF ---
        <div ref={reportRef} className="p-2 md:p-0 bg-gray-50"> 
          
          {/* Seção de Estatísticas Gerais (Cards Claros) */}
          <section className="bg-white p-6 rounded-xl shadow-xl border border-gray-200 mb-8">
            <h3 className="text-xl font-semibold text-blue-600 mb-6 flex items-center gap-2">
              {icons.overview} KPIs Anuais
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
              
              {/* Card de Total de Pacientes (Geral) */}
              <StatCard
                title="Pacientes Cadastrados"
                value={generalStats.totalPatients}
                icon="users"
                colorClass="text-blue-500"
              />

              {/* Card de Total de Registros (Anual) */}
              <StatCard
                title="Registros Anuais"
                value={generalStats.totalRecords}
                icon="clipboard"
                colorClass="text-indigo-500"
              />

              {/* Card de Atendidos (Sucesso) */}
              <StatCard
                title="Atendidos (Concluídos)"
                value={generalStats.attended}
                icon="check"
                colorClass="text-green-500"
              />

              {/* Card de Pacientes Únicos Atendidos */}
              <StatCard
                title="Pacientes Únicos Atend."
                value={generalStats.uniquePatientsAttended}
                icon="user"
                colorClass="text-purple-500"
              />

              {/* Card de Custo Total (Destacado) */}
              <StatCard
                title="Custo Total (R$)"
                value={generalStats.totalCost}
                icon="dollar"
                colorClass="text-emerald-500"
                format={(v) => `R$ ${v.toFixed(2).replace('.', ',')}`}
              />

              {/* Linha 2 de Cards menores */}
              <div className='lg:col-span-2 grid grid-cols-2 gap-4 lg:gap-6'>
                {/* Card de Pendentes */}
                <StatCard
                  title="Pendentes"
                  value={generalStats.pending}
                  icon="hourglass"
                  colorClass="text-yellow-500"
                />
                
                {/* Card de Cancelados */}
                <StatCard
                  title="Cancelados"
                  value={generalStats.canceled}
                  icon="close"
                  colorClass="text-red-500"
                />
              </div>

              {/* Card de Orçamento Anual */}
              <StatCard
                title="Orçamento Limite"
                value={Number(annualBudget) || 0}
                icon="budget"
                colorClass="text-teal-500"
                format={(v) => `R$ ${v.toFixed(2).replace('.', ',')}`}
                span={1}
              />
              
              {/* Gráfico de Desempenho vs Orçamento */}
              <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-200 col-span-2 lg:col-span-2 flex justify-center items-center">
                <AnnualBudgetChart
                  totalSpent={generalStats.totalCost}
                  budgetLimit={annualBudget}
                />
              </div>
            </div>
          </section>

          {/* Gráficos em colunas */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-200">
              <BarChart
                data={statusChartData}
                title={`Status dos Registros (${filterYear})`}
                barColor="#3b82f6" // blue-500
              />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-200">
              <BarChart
                data={monthlyCostData}
                title={`Custo Mensal (R$) (${filterYear})`}
                barColor="#10b981" // emerald-500
              />
            </div>
          </section>

          {/* Relatório de Uso de Medicações (Tabela) */}
          <section className="bg-white p-6 rounded-xl shadow-xl border border-gray-200">
            <h3 className="text-xl font-semibold text-blue-600 mb-6 flex items-center gap-2">
              {icons.pill} Top 15 Medicações Utilizadas ({filterYear})
            </h3>
            <div className="overflow-x-auto max-h-96 custom-scrollbar">
              {medicationUsage.length > 0 ? (
                <table className="min-w-full bg-white rounded-lg overflow-hidden text-sm">
                  <thead className="bg-gray-100 sticky top-0 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 uppercase tracking-wider">
                        #
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 uppercase tracking-wider">
                        Medicação
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600 uppercase tracking-wider">
                        Nº de Registros
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicationUsage.slice(0, 15).map((med, index) => (
                      <tr 
                        key={med.id} 
                        className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors ${index < 3 ? 'text-blue-700 font-semibold' : 'text-gray-700'}`}
                      >
                        <td className="py-3 px-4">{index + 1}</td>
                        <td className="py-3 px-4 font-medium">
                          {med.name}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-lg">
                          {med.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Nenhum registro de medicação encontrado para este ano.
                </p>
              )}
            </div>
            {medicationUsage.length > 15 && (
              <p className="text-xs text-gray-500 mt-4 text-center">
                Exibindo as 15 mais utilizadas.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}