// src/pages/AdminReportsPage.jsx
// (ATUALIZADO: Monitoramento de Farmácias, Previsão IA e Exportação PDF Completa)

import React, { useState, useMemo, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../services/api'; // Necessário para buscar as farmácias

// --- Imports de Componentes ---
import { BarChart } from '../components/common/BarChart';
import { AnnualBudgetChart } from '../components/common/AnnualBudgetChart';

// --- Imports de Utils ---
import { getMedicationName } from '../utils/helpers';
import { icons } from '../utils/icons';

// --- Skeletons ---
import { SkeletonCard } from '../components/common/SkeletonCard';
import { SkeletonBlock } from '../components/common/SkeletonBlock';

// --- HELPER: Identificação Robusta de Farmácia ---
const getFarmaciaName = (record) => {
  const loc = String(
    record?.location ||
      record?.farmacia ||
      record?.pharmacy ||
      record?.origin ||
      ''
  )
    .toLowerCase()
    .trim();

  if (
    loc.includes('campina grande') ||
    loc.includes('campina') ||
    loc.includes('grande') ||
    loc.includes('farmacia a') ||
    loc === 'a' ||
    loc === 'cg'
  )
    return 'Campina Grande';
  if (
    loc.includes('joao paulo') ||
    loc.includes('joão paulo') ||
    loc.includes('joao') ||
    loc.includes('joão') ||
    loc.includes('paulo') ||
    loc.includes('farmacia b') ||
    loc === 'b' ||
    loc === 'jp'
  )
    return 'João Paulo';
  if (loc.length > 0) return loc.toUpperCase(); // Fallback para nome original

  return 'Não Identificada';
};

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
  const reportRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [distributors, setDistributors] = useState([]);

  // --- 1. Carregamento de Dados (Incluindo Farmácias) ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Busca as farmácias cadastradas para ter os tetos atualizados
        const response = await api.get('/distributors');
        setDistributors(response.data || []);
      } catch (error) {
        console.error('Erro ao carregar farmácias para o relatório', error);
      } finally {
        // Pequeno delay para suavizar a UI (opcional)
        setTimeout(() => setIsLoading(false), 800);
      }
    };
    fetchData();
  }, []);

  // --- 2. Filtro de Registros do Ano ---
  const recordsThisYear = useMemo(
    () =>
      records.filter((r) => new Date(r.entryDate).getFullYear() === filterYear),
    [records, filterYear]
  );

  // --- 3. Estatísticas Gerais ---
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

  // --- 4. Inteligência de Dados: Estatísticas por Farmácia ---
  const pharmacyStats = useMemo(() => {
    if (!distributors.length) return [];

    return distributors
      .map((dist) => {
        // Soma gastos desta farmácia específica
        const distSpent = recordsThisYear
          .filter(
            (r) =>
              getFarmaciaName(r) === dist.name ||
              getFarmaciaName(r).includes(dist.name.toLowerCase())
          )
          .reduce((acc, curr) => acc + (Number(curr.totalValue) || 0), 0);

        const budget = Number(dist.budget) || 1; // Evita divisão por zero

        return {
          id: dist._id || dist.id,
          name: dist.name,
          spent: distSpent,
          budget: budget,
          percentage: (distSpent / budget) * 100,
        };
      })
      .sort((a, b) => b.percentage - a.percentage); // Ordena por quem gastou mais %
  }, [distributors, recordsThisYear]);

  // --- 5. Previsão Orçamentária (Forecast AI) ---
  const forecast = useMemo(() => {
    const now = new Date();
    if (filterYear !== now.getFullYear()) return null; // Só prevê para o ano atual

    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now - startOfYear;
    const oneDay = 1000 * 60 * 60 * 24;
    const daysPassed = Math.floor(diff / oneDay);

    if (daysPassed === 0) return null;

    const dailyAvg = generalStats.totalCost / daysPassed;
    const projectedTotal = dailyAvg * 365;

    // Calcula o teto global (soma das farmácias ou anualBudget)
    const globalLimit =
      distributors.length > 0
        ? distributors.reduce((acc, d) => acc + (d.budget || 0), 0)
        : annualBudget || 0;

    const projectedPercentage =
      globalLimit > 0 ? (projectedTotal / globalLimit) * 100 : 0;

    return {
      dailyAvg,
      projectedTotal,
      projectedPercentage,
      status:
        projectedPercentage > 100
          ? 'danger'
          : projectedPercentage > 85
            ? 'warning'
            : 'safe',
    };
  }, [generalStats.totalCost, filterYear, distributors, annualBudget]);

  // --- Dados para Gráficos ---
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
      if (monthIndex >= 0 && monthIndex < 12)
        costByMonth[monthIndex] += Number(record.totalValue) || 0;
    });
    return months.map((monthLabel, index) => ({
      label: monthLabel,
      value: costByMonth[index],
    }));
  }, [recordsThisYear]);

  const medicationUsage = useMemo(() => {
    const usageCount = {};
    recordsThisYear.forEach((record) => {
      record.medications?.forEach((medItem) => {
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
  }, [recordsThisYear, medications, getMedicationName]);

  // --- Exportação PDF ---
  const handleExportPdf = () => {
    if (!reportRef.current) return;
    setIsLoading(true);
    const scale = 2;

    html2canvas(reportRef.current, {
      scale: scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#f9fafb', // Garante fundo cinza claro no PDF
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Relatorio_Admin_Completo_${filterYear}.pdf`);
      setIsLoading(false);
    });
  };

  // --- Sub-componente StatCard ---
  const StatCard = ({ title, value, colorClass, icon, format = (v) => v }) => (
    <div className="p-5 rounded-xl shadow-sm border border-gray-100 bg-white hover:shadow-md transition-all">
      <div className={`text-3xl font-bold ${colorClass}`}>{icons[icon]}</div>
      <div className="text-2xl font-bold text-gray-900 mt-3 truncate">
        {format(value)}
      </div>
      <div className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">
        {title}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in min-h-screen bg-gray-50 p-4 md:p-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center pb-4 border-b border-gray-200 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
            {icons.chart} Centro de Comando
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Análise estratégica e financeira do exercício de{' '}
            <span className="font-bold text-blue-600">{filterYear}</span>
          </p>
        </div>
        <button
          onClick={handleExportPdf}
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-md font-semibold text-sm transition-all flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer hover:-translate-y-0.5"
        >
          {isLoading ? (
            <>{icons.loading || '...'} Processando</>
          ) : (
            <>{icons.download} Baixar Relatório Completo</>
          )}
        </button>
      </div>

      {isLoading && !reportRef.current ? (
        <div className="space-y-6">
          <SkeletonBlock className="h-40" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonBlock className="h-64" />
            <SkeletonBlock className="h-64" />
          </div>
        </div>
      ) : (
        // --- INÍCIO DA ÁREA IMPRESSA NO PDF ---
        <div ref={reportRef} className="p-1 md:p-2 bg-gray-50 space-y-8">
          {/* 1. CARDS DE KPIS GERAIS */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Gasto"
              value={generalStats.totalCost}
              icon="dollar"
              colorClass="text-emerald-500"
              format={(v) =>
                `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              }
            />
            <StatCard
              title="Atendimentos"
              value={generalStats.attended}
              icon="check"
              colorClass="text-blue-500"
            />
            <StatCard
              title="Pendências"
              value={generalStats.pending}
              icon="clock"
              colorClass="text-amber-500"
            />
            <StatCard
              title="Pacientes Únicos"
              value={generalStats.uniquePatientsAttended}
              icon="users"
              colorClass="text-purple-500"
            />
          </section>

          {/* 2. PREVISÃO E ORÇAMENTO (NOVO) */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card de Previsão IA */}
            <div
              className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden ${forecast?.status === 'danger' ? 'ring-2 ring-red-100' : ''}`}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">
                {icons.trendingUp || '📈'}
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Previsão Anual (IA)
              </h3>

              {forecast ? (
                <>
                  <p className="text-3xl font-extrabold text-gray-900">
                    R${' '}
                    {forecast.projectedTotal.toLocaleString('pt-BR', {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span
                        className={
                          forecast.status === 'danger'
                            ? 'text-red-600'
                            : forecast.status === 'warning'
                              ? 'text-amber-600'
                              : 'text-green-600'
                        }
                      >
                        {forecast.projectedPercentage.toFixed(1)}% do Orçamento
                        Global
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          forecast.status === 'danger'
                            ? 'bg-red-500'
                            : forecast.status === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min(forecast.projectedPercentage, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Baseado na média diária de R${' '}
                      {forecast.dailyAvg.toFixed(2)}.
                      {forecast.status === 'danger' && (
                        <span className="block text-red-500 font-bold mt-1">
                          ⚠️ Risco de estourar orçamento!
                        </span>
                      )}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-sm py-4">
                  Previsão disponível apenas para o ano corrente.
                </p>
              )}
            </div>

            {/* Gráfico de Execução Orçamentária */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Execução Orçamentária Global
              </h3>
              <AnnualBudgetChart
                totalSpent={generalStats.totalCost}
                budgetLimit={annualBudget}
              />
            </div>
          </section>

          {/* 3. PERFORMANCE POR UNIDADE (NOVO) */}
          {pharmacyStats.length > 0 && (
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                {icons.organization || '🏥'} Desempenho por Unidade
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {pharmacyStats.map((dist) => {
                  const isCritical = dist.percentage > 100;
                  const isWarning = dist.percentage > 85 && !isCritical;
                  const barColor = isCritical
                    ? 'bg-red-500'
                    : isWarning
                      ? 'bg-amber-400'
                      : 'bg-blue-500';
                  const textColor = isCritical
                    ? 'text-red-700'
                    : isWarning
                      ? 'text-amber-700'
                      : 'text-blue-700';
                  const bgColor = isCritical
                    ? 'bg-red-50'
                    : isWarning
                      ? 'bg-amber-50'
                      : 'bg-blue-50';

                  return (
                    <div
                      key={dist.id}
                      className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-700">{dist.name}</h4>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-full ${bgColor} ${textColor}`}
                        >
                          {dist.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                        <div
                          className={`h-2.5 rounded-full ${barColor}`}
                          style={{
                            width: `${Math.min(dist.percentage, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>
                          Gasto:{' '}
                          <b>
                            R${' '}
                            {dist.spent.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                            })}
                          </b>
                        </span>
                        <span>
                          Teto: R${' '}
                          {dist.budget.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 4. GRÁFICOS E TABELAS CLÁSSICOS */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <BarChart
                data={monthlyCostData}
                title={`Custo Mensal (${filterYear})`}
                barColor="#10b981"
              />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <BarChart
                data={statusChartData}
                title={`Status dos Registros (${filterYear})`}
                barColor="#3b82f6"
              />
            </div>
          </section>

          {/* 5. TOP MEDICAMENTOS */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              {icons.pill} Medicamentos Mais Utilizados
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="py-3 px-4 text-left">#</th>
                    <th className="py-3 px-4 text-left">Nome</th>
                    <th className="py-3 px-4 text-right">Qtd. Saídas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {medicationUsage.slice(0, 10).map((med, idx) => (
                    <tr key={med.id}>
                      <td className="py-3 px-4 text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-medium text-gray-800">
                        {med.name}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-indigo-600">
                        {med.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {medicationUsage.length === 0 && (
                <p className="text-center py-6 text-gray-500">Sem dados.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
