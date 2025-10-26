// src/components/views/secretary/DashboardView.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart } from '../../common/BarChart';
import { AnnualBudgetChart } from '../../common/AnnualBudgetChart';
import { SkeletonCard } from '../../common/SkeletonCard';
import { SkeletonBlock } from '../../common/SkeletonBlock';
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
  onNavigate, // Função para mudar a view (recebe o nome da view)
  onNavigateWithFilter, // Função para mudar a view com filtro (recebe view, status)
}) {
  
  // --- Estados (Movidos para cá) ---
  const [isLoading, setIsLoading] = useState(true);

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
  
  // --- Renderização ---
  return (
    <div className="space-y-6 animate-fade-in">
      {/* --- SEÇÃO 1: DASHBOARD ORIGINAL --- */}
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
        Dashboard Secretária
      </h2>
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-blue-800">
            Total de Pacientes
          </h3>
          <p className="text-3xl font-bold mt-2 text-blue-600">
            {totalPatients}
          </p>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <h3 className="text-lg font-semibold text-yellow-800">
            Registros Pendentes
          </h3>
          <p className="text-3xl font-bold mt-2 text-yellow-600">
            {totalPending}
          </p>
          <button
            onClick={() => onNavigateWithFilter('all_history', 'Pendente')}
            // Adicionado cursor-pointer e hover na cor do texto do botão do card
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline mt-2 cursor-pointer transition-colors"
          >
            Ver pendências
          </button>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-green-800">
            Gasto Total ({filterYear})
          </h3>
          <p className="text-3xl font-bold mt-2 text-green-600">
            {totalSpentForYear.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </p>
        </div>
      </div>

      {/* --- NOVO CARD: Pendências Velhas (30+ dias) --- */}
      {pendingOver30Days > 0 && (
        <div 
          className="p-4 rounded-lg shadow-md flex items-center gap-4 bg-red-100 border-l-4 border-red-600 animate-pulse-slow"
        >
          <span className="w-8 h-8 flex-shrink-0 text-red-600">
            {icons.alert} 
          </span>
          <div className="flex-grow">
            <h4 className="font-bold text-red-800">
              ATENÇÃO: Pendências com Entrega Atrasada
            </h4>
            <p className="text-sm text-gray-700">
              Existem <span className="font-extrabold">{pendingOver30Days}</span> {pendingOver30Days === 1 ? 'registro' : 'registros'} pendentes há mais de 30 dias. Ação Imediata Necessária!
            </p>
          </div>
          <button 
            onClick={() => onNavigateWithFilter('all_history', 'Pendente')}
            // Adicionado cursor-pointer
            className="px-3 py-1 text-sm font-medium rounded-lg flex-shrink-0 bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
          >
            Ver Atrasados
          </button>
        </div>
      )}
      {/* --- FIM DO CARD PENDÊNCIAS VELHAS --- */}

      {/* --- CARD DE AVISO DE PENDÊNCIAS GERAIS (MANTIDO) --- */}
      {totalPending > 0 && (
        <div 
          className={`p-4 rounded-lg shadow-md flex items-center gap-4 transition-all duration-300 ${
            pendingOver30Days === 0 // Mostra o alerta amarelo apenas se não houver vermelhos
              ? 'bg-yellow-50 border-l-4 border-yellow-500' 
              : 'hidden'
          }`}
        >
          <span className={`w-8 h-8 flex-shrink-0 text-yellow-600`}>
            {icons.alert} 
          </span>
          <div className="flex-grow">
            <h4 className={`font-bold text-yellow-800`}>
              Aviso de Pendências
            </h4>
            <p className="text-sm text-gray-700">
              Existem <span className="font-semibold">{totalPending}</span> {totalPending === 1 ? 'registro pendente' : 'registros pendentes'} que necessitam de atenção.
            </p>
          </div>
          <button 
            onClick={() => onNavigateWithFilter('all_history', 'Pendente')}
            // Adicionado cursor-pointer
            className={`px-3 py-1 text-sm font-medium rounded-lg flex-shrink-0 bg-yellow-400 text-yellow-900 hover:bg-yellow-500 transition-colors cursor-pointer`}
          >
            Acessar
          </button>
        </div>
      )}
      {/* --- FIM DO CARD DE AVISO --- */}

      {/* Atalhos */}
      <h3 className="text-xl font-semibold text-gray-700 pt-4 border-t mt-2">
        Atalhos Rápidos
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Estes já tinham as classes de interação nos passos anteriores */}
        <div
          className="bg-white p-4 md:p-6 rounded-lg shadow hover:shadow-lg transition-shadow flex flex-col items-center justify-center text-center cursor-pointer"
          onClick={() => onNavigate('records')}
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
          onClick={() => onNavigate('all_history')}
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
          onClick={() => onNavigate('deliveries')}
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