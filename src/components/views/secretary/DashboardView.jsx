// src/components/views/secretary/DashboardView.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart } from '../../common/BarChart';

// Constante para cálculo de datas (30 dias)
const MS_IN_30_DAYS = 30 * 24 * 60 * 60 * 1000;

// --- Sub-componentes ---

// Card KPI com suporte a estados de Alerta (Crítico)
const KpiCard = ({
  title,
  value,
  subtext,
  icon,
  colorClass,
  isCritical,
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`
      relative overflow-hidden p-5 rounded-2xl shadow-sm border flex items-start justify-between 
      transition-all duration-300
      ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-1' : ''}
      ${isCritical ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}
    `}
  >
    {/* Efeito de brilho para alertas críticos */}
    {isCritical && (
      <div className="absolute top-0 right-0 -mt-2 -mr-2 w-20 h-20 bg-red-500 blur-3xl opacity-10 rounded-full animate-pulse"></div>
    )}

    <div className="z-10">
      <p
        className={`text-sm font-medium mb-1 ${isCritical ? 'text-red-800' : 'text-gray-500'}`}
      >
        {title}
      </p>
      <h3
        className={`text-2xl font-bold ${isCritical ? 'text-red-900' : 'text-gray-800'}`}
      >
        {value}
      </h3>
      {subtext && (
        <p
          className={`text-xs mt-2 font-medium flex items-center gap-1 ${isCritical ? 'text-red-700 font-bold' : 'text-gray-400'}`}
        >
          {isCritical && (
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
          )}
          {subtext}
        </p>
      )}
    </div>

    <div className={`p-3 rounded-xl shadow-lg z-10 ${colorClass} text-white`}>
      {icon}
    </div>
  </div>
);

export function DashboardView({
  user,
  annualBudget,
  patients = [],
  records = [],
  medications = [],
  filterYear,
  getPatientNameById,
  getMedicationName,
  icons: appIcons,
  onNavigateWithFilter,
}) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 800);
  }, [filterYear]);

  // --- LÓGICA DE DADOS ---

  const recordsByYear = useMemo(
    () =>
      records.filter((r) => new Date(r.entryDate).getFullYear() === filterYear),
    [records, filterYear]
  );

  const todayStats = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todayRecords = records.filter(
      (r) => new Date(r.entryDate).toDateString() === todayStr
    );

    return {
      total: todayRecords.length,
      attended: todayRecords.filter((r) => r.status === 'Atendido').length,
      pending: todayRecords.filter((r) => r.status === 'Pendente').length,
      cost: todayRecords.reduce(
        (acc, r) => acc + (Number(r.totalValue) || 0),
        0
      ),
    };
  }, [records]);

  const financialStats = useMemo(() => {
    const totalSpent = recordsByYear.reduce(
      (acc, r) => acc + (Number(r.totalValue) || 0),
      0
    );
    const attendedCount = recordsByYear.filter(
      (r) => r.status === 'Atendido'
    ).length;
    const avgTicket = attendedCount > 0 ? totalSpent / attendedCount : 0;

    return { totalSpent, avgTicket };
  }, [recordsByYear]);

  // Lógica de Medicamentos Top 5
  const topMedications = useMemo(() => {
    const countMap = {};
    recordsByYear.forEach((rec) => {
      if (rec.medications && Array.isArray(rec.medications)) {
        rec.medications.forEach((item) => {
          countMap[item.medicationId] =
            (countMap[item.medicationId] || 0) + (Number(item.quantity) || 1);
        });
      }
    });
    return Object.entries(countMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, qtd]) => ({
        id,
        name: getMedicationName(id, medications),
        quantity: qtd,
      }));
  }, [recordsByYear, medications, getMedicationName]);

  const recentActivity = useMemo(() => {
    return [...records]
      .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate))
      .slice(0, 5);
  }, [records]);

  const monthlyData = useMemo(() => {
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
    const data = new Array(12).fill(0);
    recordsByYear
      .filter((r) => r.status === 'Atendido')
      .forEach((r) => {
        const m = new Date(r.entryDate).getMonth();
        if (m >= 0 && m < 12) data[m]++;
      });
    return months.map((label, i) => ({ label, value: data[i] }));
  }, [recordsByYear]);

  // --- LÓGICA DE ALERTAS E PENDÊNCIAS (Restaurada) ---

  // Total de pendentes
  const totalPending = records.filter((r) => r.status === 'Pendente').length;

  // Pendentes há mais de 30 dias (Atrasados)
  const pendingOver30Days = useMemo(() => {
    if (!Array.isArray(records)) return 0;
    const now = new Date().getTime();

    return records.filter((r) => {
      if (r.status !== 'Pendente' || !r.entryDate) return false;
      try {
        const entryTime = new Date(r.entryDate).getTime();
        return now - entryTime > MS_IN_30_DAYS;
      } catch (e) {
        return false;
      }
    }).length;
  }, [records]);

  // Define se o card de pendências está em estado crítico
  const isPendingCritical = pendingOver30Days > 0;

  // Handler inteligente para o clique no card de pendências
  const handlePendingClick = () => {
    if (pendingOver30Days > 0) {
      // Se tem atrasados, filtra por 'Vencido' (lógica original)
      onNavigateWithFilter('/reports-general', 'Vencido');
    } else {
      // Senão, filtra por pendentes normais
      onNavigateWithFilter('/reports-general', 'Pendente');
    }
  };

  const handlePatientClick = (patientId) => {
    const patient = patients.find((p) => p._id === patientId);
    navigate('/patient-history', { state: { initialPatient: patient } });
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-96">
        <div className="flex flex-col items-center animate-pulse text-indigo-400">
          <span className="text-4xl mb-4">{appIcons.spinner}</span>
          <p>Carregando Dashboard Inteligente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
            Visão Geral
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2 text-sm">
            {appIcons.calendar}{' '}
            <span>
              Ano de referência: <b>{filterYear}</b>
            </span>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/patient-history')}
            className="cursor-pointer bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all text-sm font-medium active:scale-95"
          >
            {appIcons.search} Buscar Paciente
          </button>
          <button
            onClick={handlePendingClick}
            className={`cursor-pointer px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg transition-all text-sm font-medium active:scale-95 text-white
                    ${isPendingCritical ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}
                `}
          >
            {appIcons.clipboard}
            {isPendingCritical ? 'Resolver Atrasos' : 'Gerenciar Pendências'}
          </button>
        </div>
      </div>

      {/* --- GRID DE KPIS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Atendimentos Hoje */}
        <KpiCard
          title="Movimento Hoje"
          value={todayStats.total}
          subtext={`${todayStats.attended} atendidos, ${todayStats.pending} na fila`}
          icon={appIcons.clock}
          colorClass="bg-gradient-to-br from-blue-500 to-indigo-600"
          onClick={() => onNavigateWithFilter('/reports-general', 'all')}
        />

        {/* KPI 2: Pendências (Com Alerta de Atraso Integrado) */}
        <KpiCard
          title={isPendingCritical ? 'ATENÇÃO: Atrasados' : 'Pendências Totais'}
          value={totalPending}
          subtext={
            isPendingCritical
              ? `${pendingOver30Days} com +30 dias!`
              : totalPending > 0
                ? 'Requer atenção'
                : 'Tudo em dia'
          }
          icon={appIcons.bell || appIcons.clipboard}
          isCritical={isPendingCritical} // Ativa o visual vermelho
          colorClass={`bg-gradient-to-br ${isPendingCritical ? 'from-red-500 to-red-600' : totalPending > 0 ? 'from-amber-400 to-orange-500' : 'from-green-400 to-emerald-500'}`}
          onClick={handlePendingClick}
        />

        {/* KPI 3: Gasto Anual */}
        <KpiCard
          title="Gasto Acumulado"
          value={`R$ ${(financialStats.totalSpent / 1000).toFixed(1)}k`}
          subtext={`Ticket Médio: R$ ${financialStats.avgTicket.toFixed(0)}`}
          icon={appIcons.dollar}
          colorClass="bg-gradient-to-br from-purple-500 to-fuchsia-600"
          onClick={() => onNavigateWithFilter('/reports-general', 'Atendido')}
        />

        {/* KPI 4: Orçamento */}
        <KpiCard
          title="Saldo Orçamentário"
          value={`R$ ${((Number(annualBudget) || 0) - financialStats.totalSpent).toFixed(0)}`}
          subtext="Disponível para uso"
          icon={appIcons.chart}
          colorClass="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
      </div>

      {/* SEÇÃO PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              {appIcons.chart} Fluxo de Atendimentos
            </h3>
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md">
              Mensal
            </span>
          </div>
          <div className="h-64 md:h-80 w-full">
            <BarChart data={monthlyData} title="" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            {appIcons.pill} Mais Saídos ({filterYear})
          </h3>
          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-4">
            {topMedications.length > 0 ? (
              topMedications.map((med, idx) => (
                <div key={med.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium truncate w-3/4">
                      {med.name}
                    </span>
                    <span className="text-gray-900 font-bold">
                      {med.quantity} cx
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-indigo-500"
                      style={{
                        width: `${Math.min(100, (med.quantity / topMedications[0].quantity) * 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm text-center py-10">
                Sem dados ainda.
              </p>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => navigate('/medications')}
              className="w-full cursor-pointer text-indigo-600 text-sm font-medium hover:text-indigo-800 flex justify-center items-center gap-1 p-2 rounded hover:bg-indigo-50 transition-colors"
            >
              Ver Estoque Completo {appIcons.chevronRight}
            </button>
          </div>
        </div>
      </div>

      {/* TIMELINE E ORÇAMENTO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            {appIcons.history} Atividade Recente
          </h3>
          <div className="space-y-2">
            {recentActivity.map((record) => (
              <div
                key={record._id}
                onClick={() => handlePatientClick(record.patientId)}
                className="cursor-pointer flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-all border border-transparent hover:border-gray-100 group active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                      record.status === 'Atendido'
                        ? 'bg-green-100 text-green-600'
                        : record.status === 'Pendente'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {record.status === 'Atendido'
                      ? appIcons.check
                      : record.status === 'Pendente'
                        ? appIcons.clock
                        : appIcons.ban}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                      {getPatientNameById(record.patientId) ||
                        'Paciente não identificado'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(record.entryDate).toLocaleDateString()} às{' '}
                      {new Date(record.entryDate).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      record.status === 'Atendido'
                        ? 'bg-green-50 text-green-700'
                        : record.status === 'Pendente'
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {record.status}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    R$ {Number(record.totalValue).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-gray-400 text-center text-sm">
                Nenhuma atividade recente.
              </p>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl shadow-lg text-white flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg mb-1 flex items-center gap-2 text-white">
              {appIcons.organization} Saúde do Orçamento
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Status do consumo anual
            </p>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300">Consumido</span>
                  <span className="font-bold">
                    {(
                      (financialStats.totalSpent / Number(annualBudget || 1)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 h-3 rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min(100, (financialStats.totalSpent / Number(annualBudget || 1)) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-400">Gasto Atual</p>
                  <p className="font-mono font-bold text-lg">
                    R${(financialStats.totalSpent / 1000).toFixed(1)}k
                  </p>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-400">Total Anual</p>
                  <p className="font-mono font-bold text-lg">
                    R${(Number(annualBudget) / 1000).toFixed(1)}k
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateWithFilter('/reports-general', 'all')}
            className="w-full cursor-pointer mt-6 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm transition-colors border border-white/10 active:scale-95"
          >
            Relatório Financeiro Completo
          </button>
        </div>
      </div>
    </div>
  );
}
