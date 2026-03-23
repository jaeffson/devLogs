// src/pages/AdminReportsPage.jsx

import React, { useState, useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Imports de Componentes ---
import { BarChart } from '../components/common/BarChart';
import { SkeletonBlock } from '../components/common/SkeletonBlock';

// --- Imports de Utils e Ícones ---
import { getMedicationName } from '../utils/helpers';
import {
  FiDownload,
  FiTrendingUp,
  FiDollarSign,
  FiBox,
  FiActivity,
  FiClock,
  FiPieChart,
  FiAward,
  FiAlertTriangle,
} from 'react-icons/fi';

// ============================================================================
// HELPERS (Totalmente alinhados com a sua base de dados)
// ============================================================================

// 1. Extrai o mês e ano da data de entrada ou criação (entryDate / createdAt)
const getYearAndMonth = (dateStr) => {
  if (!dateStr)
    return { year: new Date().getFullYear(), month: new Date().getMonth() };
  const str = String(dateStr).split('T')[0];
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3)
      return { year: Number(parts[2]), month: Number(parts[1]) - 1 };
  } else if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3)
      return { year: Number(parts[0]), month: Number(parts[1]) - 1 };
  }
  const d = new Date(dateStr);
  return { year: d.getFullYear(), month: d.getMonth() };
};

// 2. Calcula o custo multiplicando quantity * unitPrice
const getRecordCost = (record) => {
  let sum = 0;
  if (Array.isArray(record.medications)) {
    record.medications.forEach((m) => {
      // Extrai o número da quantidade (ex: "2cxs" vira 2)
      const match = String(m.quantity).match(/^(\d+)/);
      const qtd = match ? parseFloat(match[0]) : Number(m.quantity) || 1;

      // Limpa o preço unitário (ex: "R$ 50,00" vira 50.00)
      const rawPrice = m.unitPrice || m.price || 0;
      const cleanPrice = String(rawPrice)
        .replace(/[^\d.,]/g, '')
        .replace(',', '.');
      const preco = Number(cleanPrice) || 0;

      sum += qtd * preco;
    });
  }
  return sum || Number(record.totalValue) || 0;
};

// 3. Lê o nome da farmácia
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
  if (loc.includes('campina grande') || loc.includes('cg') || loc === 'a')
    return 'Campina Grande';
  if (loc.includes('joao paulo') || loc.includes('jp') || loc === 'b')
    return 'João Paulo';
  if (loc.length > 0) return loc.toUpperCase();
  return 'Unidade Padrão';
};

// ============================================================================
// COMPONENTE AUXILIAR: REPORT METRIC CARD
// ============================================================================
function ReportMetricCard({ title, value, subtitle, icon, color, onClick }) {
  const colorStyles = {
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    rose: 'text-rose-600 bg-rose-50 border-rose-100',
    slate: 'text-slate-600 bg-slate-100 border-slate-200',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm transition-all duration-300 group flex flex-col justify-between relative overflow-hidden ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-xl' : ''}`}
    >
      <div
        className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${colorStyles[color].split(' ')[0].replace('text-', 'bg-')}`}
      ></div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div
          className={`p-3.5 rounded-2xl border transition-transform duration-300 group-hover:scale-110 shadow-sm ${colorStyles[color]}`}
        >
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <h3
          className="text-3xl font-black text-slate-800 tracking-tight leading-tight line-clamp-1"
          title={value}
        >
          {value}
        </h3>
        <p className="text-sm font-bold text-slate-800 mt-2">{title}</p>
        <p className="text-xs font-medium text-slate-400 mt-0.5 line-clamp-1">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL: PÁGINA DE RELATÓRIOS (ADMIN)
// ============================================================================
export default function AdminReportsPage({
  user,
  patients = [],
  records = [],
  medications = [],
  filterYear,
}) {
  const reportRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  // Força o ano para número
  const anoAtual = Number(filterYear) || new Date().getFullYear();

  // --- 1. Filtro Geral pelo Ano Selecionado ---
  const recordsThisYear = useMemo(() => {
    return records.filter((r) => {
      // Volta a usar os campos corretos da sua base de dados
      const dataStr = r.entryDate || r.createdAt || r.date;
      if (!dataStr) return false;
      const { year } = getYearAndMonth(dataStr);
      return year === anoAtual;
    });
  }, [records, anoAtual]);

  // --- 2. Estatísticas Gerais ---
  const generalStats = useMemo(() => {
    const totalRecords = recordsThisYear.length;
    let attended = 0,
      pending = 0,
      canceled = 0,
      totalCost = 0;
    const uniquePatients = new Set();

    recordsThisYear.forEach((r) => {
      const status = r.status || '';
      if (status === 'Atendido' || status === 'Entregue') {
        attended++;
        uniquePatients.add(r.patientId || r.patient?.name || r.patientName);
      } else if (status === 'Cancelado') canceled++;
      else pending++;

      if (status !== 'Cancelado') {
        totalCost += getRecordCost(r);
      }
    });

    return {
      totalPatients: patients.length,
      totalRecords,
      attended,
      pending,
      canceled,
      totalCost,
      uniquePatientsAttended: uniquePatients.size,
    };
  }, [patients, recordsThisYear]);

  // --- 3. KPIs Avançados (Top Paciente) ---
  const advancedStats = useMemo(() => {
    const patientCounts = {};
    recordsThisYear.forEach((r) => {
      if (r.status === 'Atendido' || r.status === 'Entregue') {
        const pName =
          r.patient?.name ||
          r.patientName ||
          r.patientId ||
          'Paciente Não Informado';
        patientCounts[pName] = (patientCounts[pName] || 0) + 1;
      }
    });

    let topPatient = { name: 'Sem dados', count: 0 };
    const sortedPatients = Object.entries(patientCounts).sort(
      (a, b) => b[1] - a[1]
    );

    if (sortedPatients.length > 0) {
      topPatient = { name: sortedPatients[0][0], count: sortedPatients[0][1] };
    }
    return { topPatient };
  }, [recordsThisYear]);

  // --- 4. Uso de Medicamentos ---
  const medicationUsage = useMemo(() => {
    const usageCount = {};
    recordsThisYear.forEach((record) => {
      if (record.status === 'Atendido' || record.status === 'Entregue') {
        record.medications?.forEach((medItem) => {
          let medName = medItem.name;
          if (!medName && medItem.medicationId) {
            const foundName = getMedicationName(
              medItem.medicationId,
              medications
            );
            if (foundName && !foundName.toLowerCase().includes('inválido')) {
              medName = foundName;
            }
          }
          medName = medName || 'Medicamento Desconhecido';

          const match = String(medItem.quantity).match(/^(\d+)/);
          const realQuantity = match ? parseFloat(match[0]) : 1;

          usageCount[medName] = (usageCount[medName] || 0) + realQuantity;
        });
      }
    });

    return Object.entries(usageCount)
      .map(([name, count]) => ({ id: name, name: name, count: count }))
      .sort((a, b) => b.count - a.count);
  }, [recordsThisYear, medications]);

  const topMedication =
    medicationUsage.length > 0
      ? medicationUsage[0]
      : { name: 'Sem registos', count: 0 };
  const maxMedCount = medicationUsage.length > 0 ? medicationUsage[0].count : 1;

  // --- 5. Eficiência por Farmácia ---
  const pharmacyStats = useMemo(() => {
    const stats = {};
    const defaultBudget = 50000;
    recordsThisYear.forEach((r) => {
      if (r.status === 'Cancelado') return;
      const fName = getFarmaciaName(r);
      if (!stats[fName]) {
        stats[fName] = {
          id: fName,
          name: fName,
          spent: 0,
          budget: defaultBudget,
        };
      }
      stats[fName].spent += getRecordCost(r);
    });

    return Object.values(stats)
      .map((dist) => ({
        ...dist,
        percentage: dist.spent > 0 ? (dist.spent / dist.budget) * 100 : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [recordsThisYear]);

  // --- 6. Dados para Gráficos Mensais ---
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
    const countByMonth = Array(12).fill(0);

    recordsThisYear.forEach((record) => {
      if (record.status !== 'Cancelado') {
        const dateStr = record.entryDate || record.createdAt || record.date;
        if (dateStr) {
          const { month } = getYearAndMonth(dateStr);
          if (month >= 0 && month < 12) {
            costByMonth[month] += getRecordCost(record);
            countByMonth[month] += 1;
          }
        }
      }
    });

    return months.map((monthLabel, index) => ({
      label: monthLabel,
      value: costByMonth[index],
      atendimentos: countByMonth[index], // Guardamos a quantidade de atendimentos aqui
    }));
  }, [recordsThisYear]);

  const statusPercentages = useMemo(() => {
    if (generalStats.totalRecords === 0)
      return { attended: 0, pending: 0, canceled: 0 };
    return {
      attended: Math.round(
        (generalStats.attended / generalStats.totalRecords) * 100
      ),
      pending: Math.round(
        (generalStats.pending / generalStats.totalRecords) * 100
      ),
      canceled: Math.round(
        (generalStats.canceled / generalStats.totalRecords) * 100
      ),
    };
  }, [generalStats]);

  // --- 7. Exportação PDF Protegida ---
  const handleExportPdf = () => {
    if (!reportRef.current) return;
    setIsExporting(true);

    setTimeout(async () => {
      try {
        const canvas = await html2canvas(reportRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#f8fafc',
          allowTaint: true,
        });

        const imgData = canvas.toDataURL('image/png');
        const PDFConstructor = jsPDF.jsPDF || jsPDF;
        const pdf = new PDFConstructor('p', 'mm', 'a4');

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pdfHeight;
        }

        pdf.save(`Relatorio_Gerencial_${anoAtual}.pdf`);
      } catch (error) {
        console.error('Erro ao gerar o PDF:', error);
        alert('Houve um erro ao gerar o PDF.');
      } finally {
        setIsExporting(false);
      }
    }, 500);
  };

  return (
    <div className="flex flex-col h-full min-h-0 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar pb-8 pr-2 gap-6 bg-slate-50">
      {/* --- HEADER FIXO EXECUTIVE --- */}
      <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 flex-shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
            <div className="p-2.5 bg-slate-900 rounded-xl text-white shadow-lg">
              <FiPieChart size={24} />
            </div>
            Inteligência de Negócio
          </h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">
            Visão consolidada do exercício financeiro e operacional de{' '}
            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
              {anoAtual}
            </span>
          </p>
        </div>

        <button
          onClick={handleExportPdf}
          disabled={isExporting}
          className="bg-slate-900 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-indigo-500/30 font-bold text-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <FiClock className="animate-spin" size={18} />
          ) : (
            <FiDownload size={18} />
          )}
          {isExporting
            ? 'Processando Imagens...'
            : 'Descarregar Relatório Oficial'}
        </button>
      </div>

      {/* --- CONTEÚDO DO RELATÓRIO --- */}
      <div ref={reportRef} className="space-y-6">
        {/* 1. GRID DE KPIs SUPERIORES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ReportMetricCard
            title="Investimento Estimado"
            value={generalStats.totalCost.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
            subtitle={`${generalStats.totalRecords} movimentações no ano`}
            icon={<FiDollarSign size={24} />}
            color="emerald"
          />
          <ReportMetricCard
            title="Paciente Mais Frequente"
            value={advancedStats.topPatient.name}
            subtitle={`${advancedStats.topPatient.count} passagens no sistema`}
            icon={<FiAward size={24} />}
            color="indigo"
          />
          <ReportMetricCard
            title="Medicamento Mais Consumido"
            value={topMedication.name}
            subtitle={`${topMedication.count} unidades dispensadas`}
            icon={<FiBox size={24} />}
            color="amber"
          />
          <ReportMetricCard
            title="Fila Operacional"
            value={generalStats.pending}
            subtitle="Processos aguardando liberação"
            icon={<FiClock size={24} />}
            color={generalStats.pending > 0 ? 'rose' : 'slate'}
          />
        </div>

        {/* 2. GRID PRINCIPAL */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            {/* Card: Evolução Mensal */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200/60">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <FiTrendingUp className="text-emerald-500" /> Evolução
                    Financeira Mensal
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Soma dos custos de atendimentos ativos
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg hidden sm:block">
                  <span className="text-xs font-bold text-slate-600">
                    Média:{' '}
                    {(generalStats.totalCost / 12).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                    /mês
                  </span>
                </div>
              </div>
              <div className="h-72">
                <BarChart
                  data={monthlyCostData}
                  title="Custo"
                  barColor="#10b981"
                />
              </div>

              {/* Painel extra para compensar o BarChart que não mostra Atendimentos nativamente */}
              <div className="mt-4 grid grid-cols-6 md:grid-cols-12 gap-2">
                {monthlyCostData.map((m, i) => (
                  <div
                    key={i}
                    className="text-center bg-slate-50 rounded-lg p-2 border border-slate-100"
                  >
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      {m.label}
                    </p>
                    <p
                      className="text-xs font-black text-slate-700"
                      title="Atendimentos no mês"
                    >
                      {m.atendimentos}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Card: Eficiência por Farmácia */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200/60">
              <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <FiActivity className="text-indigo-500" /> Eficiência e Consumo
                por Unidade
              </h3>

              {pharmacyStats.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {pharmacyStats.map((dist) => {
                    const isCritical = dist.percentage > 100;
                    const isWarning = dist.percentage > 85 && !isCritical;

                    return (
                      <div key={dist.id} className="relative group">
                        <div className="flex justify-between items-end mb-2">
                          <span className="font-bold text-slate-700 text-sm truncate pr-2">
                            {dist.name}
                          </span>
                          <span
                            className={`text-xs font-black px-2 py-1 rounded-md tracking-wide shrink-0 ${isCritical ? 'bg-rose-100 text-rose-700' : isWarning ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
                          >
                            {dist.percentage.toFixed(1)}% do Teto
                          </span>
                        </div>

                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-2">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{
                              width: `${Math.min(dist.percentage, 100)}%`,
                            }}
                          ></div>
                        </div>

                        <div className="flex justify-between text-xs font-bold text-slate-500">
                          <span>
                            Consumido:{' '}
                            <span className="text-slate-700">
                              {dist.spent.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </span>
                          </span>
                          <span>
                            Teto:{' '}
                            {dist.budget.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                  <p className="font-bold text-sm">
                    Nenhuma unidade identificada nas movimentações.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-1 space-y-6">
            {/* Card: Status dos Pedidos */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200/60 flex flex-col justify-center">
              <h3 className="text-lg font-black text-slate-800 mb-6">
                Taxa de Conversão
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></div>
                    <span className="font-bold text-emerald-900 text-sm">
                      Sucesso / Atendidos
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-emerald-700 leading-none">
                      {statusPercentages.attended}%
                    </p>
                    <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest mt-1">
                      {generalStats.attended} regs
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm animate-pulse"></div>
                    <span className="font-bold text-amber-900 text-sm">
                      Em Aberto / Fila
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-amber-700 leading-none">
                      {statusPercentages.pending}%
                    </p>
                    <p className="text-[10px] font-bold text-amber-600/60 uppercase tracking-widest mt-1">
                      {generalStats.pending} regs
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-slate-400 shadow-sm"></div>
                    <span className="font-bold text-slate-700 text-sm">
                      Cancelados / Perdas
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-600 leading-none">
                      {statusPercentages.canceled}%
                    </p>
                    <p className="text-[10px] font-bold text-slate-500/60 uppercase tracking-widest mt-1">
                      {generalStats.canceled} regs
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Top Medicamentos */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200/60 h-[450px] flex flex-col">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <FiBox className="text-blue-500" /> Ranking de Saídas
                </h3>
              </div>

              <div className="overflow-y-auto custom-scrollbar flex-1 pr-2">
                {medicationUsage.length > 0 ? (
                  <div className="space-y-5">
                    {medicationUsage.slice(0, 10).map((med, idx) => {
                      const percent = Math.round(
                        (med.count / maxMedCount) * 100
                      );
                      return (
                        <div key={med.id} className="relative group">
                          <div className="flex justify-between items-end mb-1.5">
                            <span className="font-bold text-slate-700 text-sm line-clamp-1 pr-4 group-hover:text-indigo-600 transition-colors">
                              <span
                                className={`font-black mr-2 ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-orange-400' : 'text-slate-300'}`}
                              >
                                #{idx + 1}
                              </span>
                              {med.name}
                            </span>
                            <span className="font-black text-slate-800 text-sm">
                              {med.count}{' '}
                              <span className="text-[10px] text-slate-400 font-bold uppercase">
                                un
                              </span>
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ease-out ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-400' : 'bg-blue-400'}`}
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <FiAlertTriangle
                      size={32}
                      className="mb-2 opacity-50 text-amber-500"
                    />
                    <p className="font-bold text-sm text-center">
                      Nenhum medicamento
                      <br />
                      dispensado neste período.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}