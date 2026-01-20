// src/pages/AdminReportsPage.jsx

import React, { useState, useMemo, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../services/api';

// --- Imports de Componentes ---
import { BarChart } from '../components/common/BarChart';
import { AnnualBudgetChart } from '../components/common/AnnualBudgetChart';

// --- Imports de Utils ---
import { getMedicationName } from '../utils/helpers';
import { icons } from '../utils/icons';

// --- Skeletons ---
import { SkeletonCard } from '../components/common/SkeletonCard';
import { SkeletonBlock } from '../components/common/SkeletonBlock';

// --- HELPER: Identificação Robusta de Farmácia (Mantido) ---
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
  if (loc.length > 0) return loc.toUpperCase();
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

  // --- 1. Carregamento de Dados ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/distributors');
        setDistributors(response.data || []);
      } catch (error) {
        console.error('Erro ao carregar farmácias', error);
      } finally {
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

  // --- NOVO: KPIs Avançados (Ticket Médio e Pico) ---
  const advancedStats = useMemo(() => {
    const avgTicket =
      generalStats.uniquePatientsAttended > 0
        ? generalStats.totalCost / generalStats.uniquePatientsAttended
        : 0;

    const avgCostPerRecord =
      generalStats.totalRecords > 0
        ? generalStats.totalCost / generalStats.totalRecords
        : 0;

    return { avgTicket, avgCostPerRecord };
  }, [generalStats]);

  // --- 4. Estatísticas por Farmácia ---
  const pharmacyStats = useMemo(() => {
    if (!distributors.length) return [];
    return distributors
      .map((dist) => {
        const distSpent = recordsThisYear
          .filter(
            (r) =>
              getFarmaciaName(r) === dist.name ||
              getFarmaciaName(r).includes(dist.name.toLowerCase())
          )
          .reduce((acc, curr) => acc + (Number(curr.totalValue) || 0), 0);

        const budget = Number(dist.budget) || 1;
        return {
          id: dist._id || dist.id,
          name: dist.name,
          spent: distSpent,
          budget: budget,
          percentage: (distSpent / budget) * 100,
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [distributors, recordsThisYear]);

  // --- 5. Previsão IA ---
  const forecast = useMemo(() => {
    const now = new Date();
    if (filterYear !== now.getFullYear()) return null;

    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now - startOfYear;
    const oneDay = 1000 * 60 * 60 * 24;
    const daysPassed = Math.floor(diff / oneDay);
    if (daysPassed === 0) return null;

    const dailyAvg = generalStats.totalCost / daysPassed;
    const projectedTotal = dailyAvg * 365;

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

  // --- Gráficos ---
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

  // --- NOVO: Identificar Mês de Pico ---
  const peakMonth = useMemo(() => {
    const sorted = [...monthlyCostData].sort((a, b) => b.value - a.value);
    return sorted[0] || { label: '-', value: 0 };
  }, [monthlyCostData]);

  // --- Medicamentos Mais Usados ---
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
      backgroundColor: '#f9fafb',
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
      pdf.save(`Relatorio_Admin_${filterYear}.pdf`);
      setIsLoading(false);
    });
  };

  // --- NOVO COMPONENTE: Top 3 Podium ---
  const TopMedicationPodium = ({ top3 }) => (
    <div className="grid grid-cols-3 gap-2 md:gap-4 items-end mb-6 h-48">
      {/* 2nd Place */}
      {top3[1] && (
        <div className="flex flex-col items-center justify-end h-32 animate-fade-in-up delay-100">
          <div className="text-center mb-2">
            <span className="text-xs font-bold text-gray-400 block">
              2º LUGAR
            </span>
            <span className="text-sm font-semibold text-gray-700 leading-tight block line-clamp-2 w-24">
              {top3[1].name}
            </span>
            <span className="text-xs font-bold text-gray-500">
              {top3[1].count} saídas
            </span>
          </div>
          <div className="w-full bg-slate-300 rounded-t-lg h-24 flex items-center justify-center shadow-sm">
            <span className="text-2xl opacity-50">🥈</span>
          </div>
        </div>
      )}

      {/* 1st Place */}
      {top3[0] && (
        <div className="flex flex-col items-center justify-end h-48 animate-fade-in-up">
          {/* Crown Icon or similar could go here */}
          <div className="text-center mb-2">
            <span className="text-xs font-bold text-amber-500 block">
              1º LUGAR
            </span>
            <span className="text-sm font-bold text-gray-800 leading-tight block line-clamp-2 w-28">
              {top3[0].name}
            </span>
            <span className="text-sm font-extrabold text-indigo-600">
              {top3[0].count} saídas
            </span>
          </div>
          <div className="w-full bg-amber-300 rounded-t-lg h-36 flex items-center justify-center shadow-md border-t-4 border-amber-400">
            <span className="text-4xl">🏆</span>
          </div>
        </div>
      )}

      {/* 3rd Place */}
      {top3[2] && (
        <div className="flex flex-col items-center justify-end h-24 animate-fade-in-up delay-200">
          <div className="text-center mb-2">
            <span className="text-xs font-bold text-orange-400 block">
              3º LUGAR
            </span>
            <span className="text-xs font-semibold text-gray-700 leading-tight block line-clamp-2 w-24">
              {top3[2].name}
            </span>
            <span className="text-xs font-bold text-gray-500">
              {top3[2].count} saídas
            </span>
          </div>
          <div className="w-full bg-orange-200 rounded-t-lg h-16 flex items-center justify-center shadow-sm">
            <span className="text-xl opacity-60">🥉</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in min-h-screen bg-gray-50 p-4 md:p-8">
      {/* --- HEADER FIXO --- */}
      <div className="flex flex-col md:flex-row justify-between items-center pb-4 border-b border-gray-200 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            {icons.chart} Dashboard Executivo
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Visão consolidada do exercício de{' '}
            <span className="font-bold text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded-md border border-indigo-100">
              {filterYear}
            </span>
          </p>
        </div>
        <button
          onClick={handleExportPdf}
          disabled={isLoading}
          className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-lg shadow-lg hover:shadow-xl font-medium text-sm transition-all flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
        >
          {isLoading ? (
            <>{icons.loading || '...'} Gerando PDF...</>
          ) : (
            <>{icons.download} Baixar Relatório</>
          )}
        </button>
      </div>

      {isLoading && !reportRef.current ? (
        <div className="space-y-6">
          <SkeletonBlock className="h-32" />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="col-span-8">
              <SkeletonBlock className="h-96" />
            </div>
            <div className="col-span-4">
              <SkeletonBlock className="h-96" />
            </div>
          </div>
        </div>
      ) : (
        // --- ÁREA DE RELATÓRIO PDF ---
        <div ref={reportRef} className="space-y-6 bg-gray-50 p-2">
          {/* 1. KEY METRICS GRID (Novo Layout) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Gasto */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group">
              <div className="absolute right-0 top-0 h-full w-1 bg-emerald-500"></div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Investimento Total
                </p>
                <h3 className="text-2xl font-black text-gray-800 mt-1">
                  R${' '}
                  {generalStats.totalCost.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {generalStats.totalRecords} movimentações
                </p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-full text-emerald-600 group-hover:bg-emerald-200 transition-colors">
                {icons.dollar}
              </div>
            </div>

            {/* Ticket Médio (NOVO) */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group">
              <div className="absolute right-0 top-0 h-full w-1 bg-blue-500"></div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Ticket Médio / Paciente
                </p>
                <h3 className="text-2xl font-black text-gray-800 mt-1">
                  R${' '}
                  {advancedStats.avgTicket.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Base: {generalStats.uniquePatientsAttended} pacientes
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full text-blue-600 group-hover:bg-blue-200 transition-colors">
                {icons.users}
              </div>
            </div>

            {/* Mês de Pico (NOVO) */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group">
              <div className="absolute right-0 top-0 h-full w-1 bg-indigo-500"></div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Maior Demanda
                </p>
                <h3 className="text-2xl font-black text-gray-800 mt-1">
                  {peakMonth.label}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  R${' '}
                  {peakMonth.value.toLocaleString('pt-BR', {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 group-hover:bg-indigo-200 transition-colors">
                {icons.trendingUp || '📈'}
              </div>
            </div>

            {/* Pendências */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group">
              <div
                className={`absolute right-0 top-0 h-full w-1 ${generalStats.pending > 0 ? 'bg-amber-500' : 'bg-gray-300'}`}
              ></div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Aguardando Ação
                </p>
                <h3 className="text-2xl font-black text-gray-800 mt-1">
                  {generalStats.pending}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Processos em aberto
                </p>
              </div>
              <div className="bg-amber-100 p-3 rounded-full text-amber-600 group-hover:bg-amber-200 transition-colors">
                {icons.clock}
              </div>
            </div>
          </div>

          {/* 2. MAIN CONTENT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* COLUNA ESQUERDA: Financeiro e Gráficos (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Card de Orçamento Anual */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    {icons.chart} Execução Orçamentária
                  </h3>
                  {forecast && (
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded border ${
                        forecast.status === 'danger'
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : forecast.status === 'warning'
                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                            : 'bg-green-50 text-green-600 border-green-200'
                      }`}
                    >
                      Previsão IA: R${' '}
                      {forecast.projectedTotal.toLocaleString('pt-BR', {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  )}
                </div>
                <AnnualBudgetChart
                  totalSpent={generalStats.totalCost}
                  budgetLimit={annualBudget}
                />
              </div>

              {/* Gráfico Mensal */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Evolução Mensal de Custos
                </h3>
                <BarChart
                  data={monthlyCostData}
                  title="Custo (R$)"
                  barColor="#10b981"
                />
              </div>

              {/* Performance por Farmácia (Cards Compactos) */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  {icons.organization || '🏥'} Eficiência por Unidade
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pharmacyStats.map((dist) => {
                    const isCritical = dist.percentage > 100;
                    const isWarning = dist.percentage > 85 && !isCritical;
                    return (
                      <div
                        key={dist.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-gray-700 truncate">
                            {dist.name}
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${isCritical ? 'bg-red-100 text-red-700' : isWarning ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}
                          >
                            {dist.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                          <div
                            className={`h-1.5 rounded-full ${isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-green-500'}`}
                            style={{
                              width: `${Math.min(dist.percentage, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                          <span>
                            R${' '}
                            {dist.spent.toLocaleString('pt-BR', {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                          <span>
                            Meta: R${' '}
                            {dist.budget.toLocaleString('pt-BR', {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA: Estatísticas Rápidas e Top Medicamentos (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Status Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Status dos Pedidos
                </h3>
                <div className="h-48">
                  <BarChart
                    data={statusChartData}
                    title="Qtd"
                    barColor="#6366f1"
                  />
                </div>
              </div>

              {/* --- SEÇÃO REFORMULADA: Top Medicamentos --- */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    {icons.pill} Top Medicamentos
                  </h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    Mais Saídos
                  </span>
                </div>

                {/* Componente Visual de Podium */}
                {medicationUsage.length > 0 ? (
                  <>
                    <TopMedicationPodium top3={medicationUsage.slice(0, 3)} />

                    {/* Lista Complementar (do 4º em diante) */}
                    <div className="mt-6 space-y-3">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Ranking Geral
                      </h4>
                      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {medicationUsage.slice(3).map((med, idx) => (
                          <div
                            key={med.id}
                            className="py-2 flex justify-between items-center group hover:bg-gray-50 px-2 rounded cursor-default"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-gray-400 w-4">
                                #{idx + 4}
                              </span>
                              <span className="text-sm text-gray-700 font-medium truncate max-w-[140px]">
                                {med.name}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              {med.count}
                            </span>
                          </div>
                        ))}
                        {medicationUsage.length <= 3 && (
                          <p className="text-xs text-gray-400 text-center py-2">
                            Fim da lista.
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <span className="text-4xl mb-2 opacity-30">
                      {icons.pill}
                    </span>
                    <p>Nenhum dado registrado.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
