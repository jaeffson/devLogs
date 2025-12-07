// src/components/views/secretary/DashboardView.jsx
// (CORRIGIDO: Botão "Ver Atrasados" agora envia o filtro "Vencido")

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { BarChart } from '../../common/BarChart';
import { AnnualBudgetChart } from '../../common/AnnualBudgetChart';
import { SkeletonCard } from '../../common/SkeletonCard';
import { SkeletonBlock } from '../../common/SkeletonBlock';
// A importação de 'icons' é mantida para os 'Atalhos Rápidos'
import { icons } from '../../../utils/icons';

// Define o número de milissegundos em 30 dias
const MS_IN_30_DAYS = 30 * 24 * 60 * 60 * 1000;

// Recebemos as props do "Controlador"
export function DashboardView({
  user,
  annualBudget,
  patients = [],
  records = [],
  medications = [],
  filterYear,
  getMedicationName,
  icons, 
  onNavigateWithFilter, // <-- Prop de filtro mantida
}) {
  
  const navigate = useNavigate(); // <-- Hook de navegação mantido

  // --- Estados (Movidos para cá) ---
  const [isLoading, setIsLoading] = useState(true);
  const [isOverdueAlertVisible, setIsOverdueAlertVisible] = useState(true);

  // Efeito de loading (Movido para cá)
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Simula 1s de carga
    return () => clearTimeout(timer);
  }, [filterYear]);

  // --- Memos (Movidos para cá) ---

  const recordsByYear = useMemo(
    () =>
      Array.isArray(records)
        ? records.filter((r) => {
            try {
              return new Date(r.entryDate).getFullYear() === filterYear;
            } catch (e) {
              return false;
            }
          })
        : [],
    [records, filterYear]
  );

  const monthlyAttendanceData = useMemo(() => {
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
    ];
    const attendanceByMonth = Array(12).fill(null).map(() => new Set());
    if (Array.isArray(recordsByYear)) {
      recordsByYear.forEach((record) => {
        if (record.status === 'Atendido') {
          try {
            const d = new Date(record.entryDate);
            if (!isNaN(d)) {
              const m = d.getMonth();
              if (m >= 0 && m < 12) attendanceByMonth[m].add(record.patientId);
            }
          } catch (e) {}
        }
      });
    }
    return months.map((monthLabel, index) => ({
      label: monthLabel,
      value: attendanceByMonth[index].size,
    }));
  }, [recordsByYear]);

  // Memos para os cards do dashboard
  const totalPatients = useMemo(
    () => (Array.isArray(patients) ? patients.length : 0),
    [patients]
  );
  
  // Calcula o total de pendentes (geral)
  const totalPending = useMemo(
    () =>
      Array.isArray(records)
        ? records.filter((r) => r.status === 'Pendente').length
        : 0,
    [records]
  );
  
  // --- NOVO MEMO: Pendências Velhas (30+ dias) ---
  const pendingOver30Days = useMemo(() => {
    if (!Array.isArray(records)) return 0;
    const now = new Date().getTime();

    return records.filter(r => {
      if (r.status !== 'Pendente' || !r.entryDate) return false;
      
      try {
        const entryTime = new Date(r.entryDate).getTime();
        // Verifica se a diferença em milissegundos é maior que 30 dias
        return (now - entryTime) > MS_IN_30_DAYS;
      } catch (e) {
        return false;
      }
    }).length;
  }, [records]);
  // --- FIM NOVO MEMO ---

  const totalSpentForYear = useMemo(
    () =>
      Array.isArray(recordsByYear)
        ? recordsByYear.reduce((sum, item) => sum + (Number(item.totalValue) || 0), 0)
        : 0,
    [recordsByYear]
  );

  // Memos para a seção de Relatórios Admin (usando recordsByYear)
  const generalStats = useMemo(() => {
    const totalRecords = recordsByYear.length;
    const attended = recordsByYear.filter(
      (r) => r.status === 'Atendido'
    ).length;
    const pending = recordsByYear.filter(
      (r) => r.status === 'Pendente'
    ).length;
    const canceled = recordsByYear.filter(
      (r) => r.status === 'Cancelado'
    ).length;
    const totalCost = totalSpentForYear;
    const uniquePatientsAttended = new Set(
      recordsByYear
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
  }, [patients.length, recordsByYear, totalSpentForYear]);

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
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
    ];
    const costByMonth = Array(12).fill(0);
    recordsByYear.forEach((record) => {
      try {
        const m = new Date(record.entryDate).getMonth();
        if (m >= 0 && m < 12)
          costByMonth[m] += Number(record.totalValue) || 0;
      } catch (e) {}
    });
    return months.map((monthLabel, index) => ({
      label: monthLabel,
      value: costByMonth[index],
    }));
  }, [recordsByYear]);

  const medicationUsage = useMemo(() => {
    const usageCount = {};
    recordsByYear.forEach((record) => {
      if (Array.isArray(record.medications)) {
        record.medications.forEach((medItem) => {
          const medId = medItem.medicationId;
          usageCount[medId] = (usageCount[medId] || 0) + 1;
        });
      }
    });
    return Object.entries(usageCount)
      .map(([medId, count]) => ({
        id: medId,
        name: getMedicationName(medId, medications),
        count: count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [recordsByYear, medications, getMedicationName]);

  // FASE 1: Taxa de atendimento (%)
  const attendanceRate = useMemo(() => {
    if (generalStats.totalRecords === 0) return 0;
    return Math.round((generalStats.attended / generalStats.totalRecords) * 100);
  }, [generalStats]);

  // FASE 2: Motivos de cancelamento
  const cancelationReasons = useMemo(() => {
    const reasons = {};
    recordsByYear
      .filter((r) => r.status === 'Cancelado')
      .forEach((record) => {
        const reason = record.cancellationReason || 'Sem especificação';
        reasons[reason] = (reasons[reason] || 0) + 1;
      });
    return Object.entries(reasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);
  }, [recordsByYear]);

  // FASE 2: Produtividade por profissional (usando campo userId se existir)
  const professionalProductivity = useMemo(() => {
    const productivity = {};
    recordsByYear.forEach((record) => {
      if (record.userId) {
        if (!productivity[record.userId]) {
          productivity[record.userId] = { total: 0, attended: 0, pending: 0, canceled: 0 };
        }
        productivity[record.userId].total += 1;
        if (record.status === 'Atendido') productivity[record.userId].attended += 1;
        else if (record.status === 'Pendente') productivity[record.userId].pending += 1;
        else if (record.status === 'Cancelado') productivity[record.userId].canceled += 1;
      }
    });
    return Object.entries(productivity)
      .map(([userId, stats]) => ({
        userId,
        ...stats,
        successRate: stats.total > 0 ? Math.round((stats.attended / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [recordsByYear]);

  // FASE 2: Comparativo mês atual vs mês anterior
  const monthComparison = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const currentYear = now.getFullYear();
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthRecords = recordsByYear.filter(
      (r) => new Date(r.entryDate).getMonth() === currentMonth && r.status === 'Atendido'
    ).length;

    const previousMonthRecords = recordsByYear.filter((r) => {
      const d = new Date(r.entryDate);
      return (
        d.getMonth() === previousMonth &&
        d.getFullYear() === previousYear &&
        r.status === 'Atendido'
      );
    }).length;

    const growth = previousMonthRecords > 0 
      ? Math.round(((currentMonthRecords - previousMonthRecords) / previousMonthRecords) * 100)
      : 0;

    return { currentMonthRecords, previousMonthRecords, growth };
  }, [recordsByYear]);
  
  // --- Renderização ---
  return (
    <div className="space-y-6 animate-fade-in">
      {/* --- SEÇÃO 1: DASHBOARD ORIGINAL --- */}
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
        Dashboard Secretária
      </h2>
      
      {/* --- (INÍCIO) Cards com Novo Visual e Navegação Corrigida --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 md:gap-6">
        {/* Card 1: Total de Pacientes */}
        <div 
          className="relative bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-900 p-6 rounded-xl shadow-lg hover:shadow-2xl border border-blue-100/50 transition-all duration-300 cursor-pointer group hover:-translate-y-1 overflow-hidden animate-fade-in"
          onClick={() => navigate('/patient-history')}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent"></div>
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-500 p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                {icons.users || <span></span>}
              </div>
              <h3 className="text-lg font-bold text-blue-900">Pacientes</h3>
            </div>
            <p className="text-5xl font-bold text-blue-800 mb-2">
              {totalPatients}
            </p>
            <p className="text-sm font-medium text-blue-700 group-hover:text-blue-600 transition-colors">
              Total cadastrados
            </p>
          </div>
        </div>

        {/* Card 2: Registros Pendentes */}
        <div 
          className="relative bg-gradient-to-br from-yellow-50 to-amber-50 text-yellow-900 p-6 rounded-xl shadow-lg hover:shadow-2xl border border-yellow-100/50 transition-all duration-300 cursor-pointer group hover:-translate-y-1 overflow-hidden animate-fade-in"
          onClick={() => onNavigateWithFilter('/reports-general', 'Pendente')}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent"></div>
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-amber-500 p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                {icons.clipboard || <span></span>}
              </div>
              <h3 className="text-lg font-bold text-yellow-900">Pendentes</h3>
            </div>
            <p className="text-5xl font-bold text-yellow-800 mb-2">
              {totalPending}
            </p>
            <p className="text-sm font-medium text-yellow-700 group-hover:text-yellow-600 transition-colors">
              Aguardando processamento
            </p>
          </div>
        </div>

        {/* Card 3: Taxa de Atendimento % (NOVA) */}
        <div 
          className="relative bg-gradient-to-br from-green-50 to-emerald-50 text-green-900 p-6 rounded-xl shadow-lg hover:shadow-2xl border border-green-100/50 transition-all duration-300 group overflow-hidden animate-fade-in"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent"></div>
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                {icons.check || <span></span>}
              </div>
              <h3 className="text-lg font-bold text-green-900">Taxa Sucesso</h3>
            </div>
            <p className="text-5xl font-bold text-green-800 mb-2">
              {attendanceRate}%
            </p>
            <p className="text-sm font-medium text-green-700 group-hover:text-green-600 transition-colors">
              De atendimentos concluídos
            </p>
          </div>
        </div>

        {/* Card 4: Gasto Total */}
        <div 
          className="relative bg-gradient-to-br from-purple-50 to-pink-50 text-purple-900 p-6 rounded-xl shadow-lg hover:shadow-2xl border border-purple-100/50 transition-all duration-300 group overflow-hidden animate-fade-in"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent"></div>
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                {icons.chart || <span></span>}
              </div>
              <h3 className="text-lg font-bold text-purple-900">Gasto Total</h3>
            </div>
            <p className="text-4xl font-bold text-purple-800 mb-2">
              R$ {(totalSpentForYear / 1000).toFixed(0)}k
            </p>
            <p className="text-sm font-medium text-purple-700 group-hover:text-purple-600 transition-colors">
              Ano de {filterYear}
            </p>
          </div>
        </div>

        {/* Card 5: Orçamento Restante */}
        <div 
          className="relative bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-900 p-6 rounded-xl shadow-lg hover:shadow-2xl border border-indigo-100/50 transition-all duration-300 group overflow-hidden animate-fade-in"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent"></div>
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-blue-500 p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                {icons.budget || icons.chart || <span></span>}
              </div>
              <h3 className="text-lg font-bold text-indigo-900">Orçamento</h3>
            </div>
            <p className="text-4xl font-bold text-indigo-800 mb-2">
              R$ {((Number(annualBudget) || 0) - totalSpentForYear).toFixed(0)}
            </p>
            <p className="text-sm font-medium text-indigo-700 group-hover:text-indigo-600 transition-colors">
              Saldo disponível
            </p>
          </div>
        </div>
      </div>
      {/* --- (FIM) Cards com Novo Visual --- */}


      {/* --- (INÍCIO) BLOCO DE ALERTA ATUALIZADO (Visual e Lógica) --- */}
      
      {/* NOVO CARD: Pendências Velhas (30+ dias) com visual atualizado */}
      {pendingOver30Days > 0 && isOverdueAlertVisible && (
        <div 
          className="bg-white border-l-8 border-red-600 p-4 rounded-lg shadow-lg flex items-start gap-3"
          role="alert"
        >
          {/* Ícone com toque visual (SVG) */}
          <div className="flex-shrink-0 text-red-500 mt-1">
            <span className="w-6 h-6">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </span>
          </div>
          
          {/* Conteúdo do Texto */}
          <div className="flex-grow">
            <h4 className="font-bold text-gray-800">
              ATENÇÃO: Pendências com Entrega Atrasada
            </h4>
            <p className="text-sm text-gray-700">
              Existem <span className="font-extrabold">{pendingOver30Days}</span> {pendingOver30Days === 1 ? 'registro' : 'registros'} pendentes há mais de 30 dias.
            </p>
            {/* --- (INÍCIO DA CORREÇÃO) ---
              O onClick agora envia o filtro "Vencido"
            */}
            <button 
              onClick={() => onNavigateWithFilter('/reports-general', 'Vencido')}
              className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline font-medium mt-1 cursor-pointer transition-colors"
            >
              Ver Atrasados
            </button>
            {/* --- (FIM DA CORREÇÃO) --- */}
          </div>

          {/* Botão de Fechar (SVG) */}
          <button
            onClick={() => setIsOverdueAlertVisible(false)}
            className="p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full cursor-pointer transition-colors"
            title="Dispensar"
          >
            <span className="w-5 h-5">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          </button>
        </div>
      )}
      {/* FIM DO CARD PENDÊNCIAS VELHAS */}

      {/* CARD DE AVISO DE PENDÊNCIAS GERAIS (Visual atualizado) */}
      {totalPending > 0 && (!isOverdueAlertVisible || pendingOver30Days === 0) && (
        <div 
          className="bg-white border-l-8 border-yellow-500 p-4 rounded-lg shadow-lg flex items-start gap-3"
          role="alert"
        >
          {/* Ícone (SVG) */}
          <div className="flex-shrink-0 text-yellow-500 mt-1">
            <span className="w-6 h-6">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375m0 0l3.004 3.004m-3.004-3.004v3.75m0 0v3.75m0-3.75h3.75m-3.75 0h.375m-3.375 0H6.75m10.5 0h.375c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-4.5c-.621 0-1.125-.504-1.125-1.125v-1.5c0-.621.504 1.125 1.125-1.125h.375m-3.375 0h.375m0 0l3.004 3.004m-3.004-3.004v3.75m0 0v3.75m0-3.75h3.75m-3.75 0h.375m-3.375 0H6.75" />
              </svg>
            </span>
          </div>
          {/* Texto */}
          <div className="flex-grow">
            <h4 className="font-bold text-gray-800">
              Aviso de Pendências
            </h4>
            <p className="text-sm text-gray-700">
              Existem <span className="font-semibold">{totalPending}</span> {totalPending === 1 ? 'registro pendente' : 'registros pendentes'} que necessitam de atenção.
            </p>
            <button 
              onClick={() => onNavigateWithFilter('/reports-general', 'Pendente')} // <-- Correto: Usa filtro "Pendente"
              className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline font-medium mt-1 cursor-pointer transition-colors"
            >
              Acessar
            </button>
          </div>
        </div>
      )}
      {/* --- (FIM) BLOCO DE ALERTA ATUALIZADO --- */}


      {/* Atalhos (Corrigidos com 'navigate') */}
      <h3 className="text-xl font-semibold text-gray-700 pt-4 border-t mt-2">
        Atalhos Rápidos
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        
        <div
          className="bg-white p-4 md:p-6 rounded-lg shadow hover:shadow-lg transition-shadow flex flex-col items-center justify-center text-center cursor-pointer"
          onClick={() => navigate('/patient-history')} // <-- Correto: Só navega
          title="Buscar histórico por paciente específico"
        >
          <span className="text-blue-500 w-10 h-10 mb-2">{icons.users}</span>
          <h3 className="text-lg font-semibold text-gray-700">
            Histórico por Paciente
          </h3>
          <p className="text-sm text-gray-500">
            Buscar por nome, CPF ou SUS
          </p>
        </div>
        <div
          className="bg-white p-4 md:p-6 rounded-lg shadow hover:shadow-lg transition-shadow flex flex-col items-center justify-center text-center cursor-pointer"
          onClick={() => navigate('/reports-general')} // <-- Correto: Só navega (sem filtro)
          title="Ver todos os registros com filtros"
        >
          <span className="text-indigo-500 w-10 h-10 mb-2">
            {icons.reports || icons.clipboard}
          </span>
          <h3 className="text-lg font-semibold text-gray-700">
            Relatório Geral
          </h3>
          <p className="text-sm text-gray-500">
            Filtrar e exportar todos os registros
          </p>
        </div>
        <div
          className="bg-white p-4 md:p-6 rounded-lg shadow hover:shadow-lg transition-shadow flex flex-col items-center justify-center text-center cursor-pointer"
          onClick={() => navigate('/deliveries')} // <-- Correto: Só navega
          title="Ver registros atendidos na última semana"
        >
          <span className="text-green-500 w-10 h-10 mb-2">
            {icons.check || icons.calendar}
          </span>
          <h3 className="text-lg font-semibold text-gray-700">
            Entregas Recentes
          </h3>
          <p className="text-sm text-gray-500">
            Atendidos na última semana
          </p>
        </div>
      </div>
      {/* Gráfico */}
      <section className="bg-white p-4 md:p-6 rounded-lg shadow mt-6">
        <BarChart
          data={monthlyAttendanceData}
          title={`Pacientes Únicos Atendidos por Mês (${filterYear})`}
        />
      </section>
      {/* --- FIM DA SEÇÃO 1 --- */}

      {/* --- SEÇÃO 3: RELATÓRIOS ADMIN (/reports) --- */}
      <section className="space-y-6 animate-fade-in mt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 border-b pb-3">
          <div className="flex items-center gap-3 mb-2 md:mb-0">
            <span className="text-indigo-500 w-8 h-8 hidden sm:block">
              {icons.reports || icons.chart}
            </span>
            <div>
              <h2 className="2xl md:text-3xl font-bold text-gray-800">
                Relatórios Administrativos
              </h2>
              <p className="text-sm text-gray-500 -mt-1">
                Visão geral do ano de {filterYear}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <section className="bg-white p-4 md:p-6 rounded-lg shadow">
              <div className="h-6 w-1/3 rounded bg-gray-200 animate-pulse mb-4"></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                {[...Array(9)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </section>
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SkeletonBlock />
              <SkeletonBlock />
            </section>
            <section className="bg-white p-4 md:p-6 rounded-lg shadow">
              <SkeletonBlock />
            </section>
          </div>
        ) : (
          <>
            <section className="bg-white p-4 md:p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                Visão Geral ({filterYear})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                <div className="border border-gray-200 p-3 rounded-lg shadow-sm">
                  <div className="text-sm text-blue-800 font-semibold">
                    Total Pacientes
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {generalStats.totalPatients}
                  </div>
                </div>
                <div className="border border-gray-200 p-3 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-800 font-semibold">
                    Total Registros
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {generalStats.totalRecords}
                  </div>
                </div>
                <div className="border border-gray-200 p-3 rounded-lg shadow-sm">
                  <div className="text-sm text-green-800 font-semibold">
                    Atendidos
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {generalStats.attended}
                  </div>
                </div>
                <div className="border border-gray-200 p-3 rounded-lg shadow-sm">
                  <div className="text-sm text-yellow-800 font-semibold">
                    Pendentes
                  </div>
                  <div className="text-2xl font-bold text-yellow-900">
                    {generalStats.pending}
                  </div>
                </div>
                <div className="border border-gray-200 p-3 rounded-lg shadow-sm">
                  <div className="text-sm text-red-800 font-semibold">
                    Cancelados
                  </div>
                  <div className="text-2xl font-bold text-red-900">
                    {generalStats.canceled}
                  </div>
                </div>
                <div className="border border-gray-200 p-3 rounded-lg shadow-sm col-span-2 sm:col-span-1">
                  <div className="text-sm text-purple-800 font-semibold">
                    Pacientes Únicos Atend.
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    {generalStats.uniquePatientsAttended}
                  </div>
                </div>
                <div className="border-l-4 border-indigo-500 bg-white p-3 rounded shadow-sm col-span-2 lg:col-span-1">
                  <div className="text-sm text-indigo-800 font-semibold">
                    Custo Total (Registros)
                  </div>
                  <div className="text-xl font-bold text-indigo-900">
                    R$ {generalStats.totalCost.toFixed(2).replace('.', ',')}
                  </div>
                </div>
                <div className="border-l-4 border-teal-500 bg-white p-3 rounded shadow-sm col-span-2 lg:col-span-1">
                  <div className="text-sm text-teal-800 font-semibold">
                    Orçamento Anual
                  </div>
                  <div className="text-xl font-bold text-teal-900">
                    R${' '}
                    {(Number(annualBudget) || 0)
                      .toFixed(2)
                      .replace('.', ',')}
                  </div>
                </div>
                <div className="bg-white p-3 rounded col-span-2 lg:col-span-2 flex justify-center items-center border border-gray-200 shadow-sm">
                  <AnnualBudgetChart
                    totalSpent={generalStats.totalCost}
                    budgetLimit={annualBudget}
                  />
                </div>
              </div>
            </section>
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 md:p-6 rounded-lg shadow">
                <BarChart
                  data={statusChartData}
                  title={`Status dos Registros (${filterYear})`}
                />
              </div>
              <div className="bg-white p-4 md:p-6 rounded-lg shadow">
                <BarChart
                  data={monthlyCostData}
                  title={`Custo Mensal (R$) (${filterYear})`}
                />
              </div>
            </section>
            <section className="bg-white p-4 md:p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                Medicações Mais Utilizadas ({filterYear})
              </h3>
              <div className="overflow-x-auto max-h-60 border border-gray-200 rounded-lg">
                {medicationUsage.length > 0 ? (
                  <table className="min-w-full bg-white text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 uppercase text-xs">
                          Medicação
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-600 uppercase text-xs">
                          Nº de Registros
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {medicationUsage.slice(0, 15).map((med) => (
                        <tr key={med.id}>
                          <td className="py-3 px-4 font-medium text-gray-800">
                            {med.name}
                          </td>
                          <td className="py-3 px-4 text-gray-600 text-right font-medium">
                            {med.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    Nenhum registro encontrado para este ano.
                  </p>
                )}
              </div>
              {medicationUsage.length > 15 && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Exibindo as 15 mais utilizadas.
                </p>
              )}
            </section>
          </>
        )}
      </section>
      {/* --- FIM DA SEÇÃO 3 --- */}
    </div>
  );
}