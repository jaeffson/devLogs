// src/components/views/secretary/DashboardView.jsx

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart } from '../../common/BarChart';

// --- CONSTANTES ---
const MS_IN_30_DAYS = 30 * 24 * 60 * 60 * 1000;

// --- COMPONENTE: Card KPI (Indicador Chave de Desempenho) ---
const KpiCard = ({
  title,
  value,
  subtext,
  icon,
  gradient,
  onClick,
  isAlert,
  footer
}) => (
  <div
    onClick={onClick}
    className={`
      relative overflow-hidden p-6 rounded-2xl shadow-sm border border-gray-100 bg-white
      transition-all duration-300 group
      ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''}
      ${isAlert ? 'ring-2 ring-red-100 bg-red-50/50' : ''}
    `}
  >
    {/* Background Decorativo */}
    <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 ${gradient}`}></div>
    
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl text-white shadow-lg ${gradient}`}>
        {icon}
      </div>
      {isAlert && (
        <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}
    </div>

    <div>
      <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
      <div className="text-2xl font-bold text-gray-800 tracking-tight">{value}</div>
      {subtext && (
        <p className={`text-xs mt-2 font-medium ${isAlert ? 'text-red-600' : 'text-gray-400'}`}>
          {subtext}
        </p>
      )}
    </div>
    
    {footer && (
      <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
        {footer}
      </div>
    )}
  </div>
);

// --- COMPONENTE: Card de Orçamento por Farmácia ---
const PharmacyBudgetCard = ({ name, spent, budget, percentage }) => {
  const isCritical = percentage > 100;
  const isWarning = percentage > 85 && !isCritical;
  
  let barColor = 'bg-emerald-500';
  let textColor = 'text-emerald-700';
  
  if (isCritical) {
    barColor = 'bg-red-500';
    textColor = 'text-red-700';
  } else if (isWarning) {
    barColor = 'bg-amber-400';
    textColor = 'text-amber-700';
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-bold text-gray-700 truncate pr-2" title={name}>{name}</h4>
        <span className={`text-xs font-bold px-2 py-1 rounded-full bg-gray-100 ${textColor}`}>
          {percentage.toFixed(1)}%
        </span>
      </div>
      
      <div className="space-y-3">
        {/* Barra de Progresso */}
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div 
            className={`h-2.5 rounded-full transition-all duration-1000 ${barColor}`} 
            style={{ width: `${Math.min(100, percentage)}%` }}
          ></div>
        </div>
        
        {/* Valores */}
        <div className="flex justify-between text-xs text-gray-500">
          <div>
            <p className="text-[10px] uppercase">Gasto</p>
            <p className="font-semibold text-gray-800">R$ {new Intl.NumberFormat('pt-BR').format(spent)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase">Teto</p>
            <p className="font-semibold text-gray-800">R$ {new Intl.NumberFormat('pt-BR').format(budget)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export function DashboardView({
  user,
  annualBudget,
  distributors = [],
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

  // Simulação de loading para UX
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [filterYear]);

  // --- 1. FILTRAGEM DE DADOS DO ANO ---
  const recordsByYear = useMemo(
    () => records.filter((r) => new Date(r.entryDate).getFullYear() === filterYear),
    [records, filterYear]
  );

  // --- 2. ESTATÍSTICAS DE HOJE ---
  const todayStats = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todayRecords = records.filter(
      (r) => new Date(r.entryDate).toDateString() === todayStr
    );
    return {
      total: todayRecords.length,
      attended: todayRecords.filter((r) => r.status === 'Atendido').length,
      pending: todayRecords.filter((r) => r.status === 'Pendente').length,
    };
  }, [records]);

  // --- 3. DADOS FINANCEIROS GLOBAIS ---
  const financialStats = useMemo(() => {
    const totalSpent = recordsByYear.reduce(
      (acc, r) => acc + (Number(r.totalValue) || 0),
      0
    );
    return { totalSpent };
  }, [recordsByYear]);

  // --- 4. ORÇAMENTO POR FARMÁCIA (DETALHADO) ---
  const pharmacyStats = useMemo(() => {
    if (!distributors.length) return [];
    
    return distributors.map(dist => {
      // Filtra registros desta farmácia (pelo nome)
      const distSpent = recordsByYear
        .filter(r => 
           (r.farmacia === dist.name || r.pharmacy === dist.name || r.location === dist.name) && 
           r.status !== 'Cancelado'
        )
        .reduce((acc, curr) => acc + (Number(curr.totalValue) || 0), 0);
      
      const budget = Number(dist.budget) || 1; 

      return {
        id: dist._id || dist.id,
        name: dist.name,
        spent: distSpent,
        budget: budget,
        percentage: (distSpent / budget) * 100
      };
    });
  }, [distributors, recordsByYear]);

  // --- 5. TETO GLOBAL (Soma das Farmácias ou Configuração Geral) ---
  const globalBudget = useMemo(() => {
    const sumDistributors = pharmacyStats.reduce((acc, p) => acc + p.budget, 0);
    return sumDistributors > 0 ? sumDistributors : (Number(annualBudget) || 1);
  }, [pharmacyStats, annualBudget]);

  // --- 6. INTELIGÊNCIA DE DADOS (PREVISÃO) ---
  const forecast = useMemo(() => {
    const now = new Date();
    // Se o filtro não for o ano atual, a previsão não faz sentido da mesma forma (seria retrospectiva)
    if (filterYear !== now.getFullYear()) return null;

    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now - startOfYear;
    const oneDay = 1000 * 60 * 60 * 24;
    const daysPassed = Math.floor(diff / oneDay); // Dias corridos até hoje

    if (daysPassed === 0) return { projected: 0, status: 'safe' };

    const dailyAvg = financialStats.totalSpent / daysPassed;
    const projectedTotal = dailyAvg * 365; // Projeção linear simples
    
    const percentageOfBudget = (projectedTotal / globalBudget) * 100;
    
    let status = 'safe'; // verde
    if (percentageOfBudget > 100) status = 'danger'; // vermelho
    else if (percentageOfBudget > 90) status = 'warning'; // amarelo

    return {
      dailyAvg,
      projectedTotal,
      percentageOfBudget,
      status
    };
  }, [financialStats.totalSpent, globalBudget, filterYear]);

  // --- 7. ALERTAS DE ATRASO (> 30 DIAS) ---
  const pendingOver30Days = useMemo(() => {
    const now = new Date().getTime();
    return records.filter((r) => {
      if (r.status !== 'Pendente' || !r.entryDate) return false;
      const entryTime = new Date(r.entryDate).getTime();
      return now - entryTime > MS_IN_30_DAYS;
    }).length;
  }, [records]);

  // --- 8. GRÁFICOS E TOP 5 ---
  const topMedications = useMemo(() => {
    const countMap = {};
    recordsByYear.forEach((rec) => {
      if (rec.medications && Array.isArray(rec.medications)) {
        rec.medications.forEach((item) => {
          countMap[item.medicationId] = (countMap[item.medicationId] || 0) + (Number(item.quantity) || 1);
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

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const data = new Array(12).fill(0);
    recordsByYear.filter((r) => r.status === 'Atendido').forEach((r) => {
      const m = new Date(r.entryDate).getMonth();
      if (m >= 0 && m < 12) data[m]++;
    });
    return months.map((label, i) => ({ label, value: data[i] }));
  }, [recordsByYear]);

  // --- LOADING SKELETON (Simples) ---
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>)}
        <div className="md:col-span-4 h-64 bg-gray-200 rounded-2xl mt-4"></div>
      </div>
    );
  }

  // --- HANDLERS ---
  const handlePendingClick = () => {
    onNavigateWithFilter('/reports-general', pendingOver30Days > 0 ? 'Vencido' : 'Pendente');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Visão Geral</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2 text-sm">
            {appIcons.calendar} <span>Ano Fiscal: <b>{filterYear}</b></span>
          </p>
        </div>
        <div className="flex gap-3">
           <button onClick={() => navigate('/patient-history')} className="cursor-pointer bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all text-sm font-medium hover:-translate-y-0.5">
             {appIcons.search} Buscar Paciente
           </button>
           <button onClick={handlePendingClick} className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all text-sm font-medium hover:-translate-y-0.5">
             {appIcons.clipboard} Gerenciar Fila
           </button>
        </div>
      </div>

      {/* 1. SEÇÃO DE KPIS E INTELIGÊNCIA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI: Movimento Hoje */}
        <KpiCard
          title="Atendimentos Hoje"
          value={todayStats.total}
          subtext={`${todayStats.attended} concluídos / ${todayStats.pending} na fila`}
          icon={appIcons.clock}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          onClick={() => onNavigateWithFilter('/reports-general', 'all')}
        />

        {/* KPI: Alertas (Pendências Antigas) */}
        <KpiCard
          title={pendingOver30Days > 0 ? "ATENÇÃO: Atrasados" : "Pendências Totais"}
          value={records.filter(r => r.status === 'Pendente').length}
          subtext={pendingOver30Days > 0 ? `${pendingOver30Days} aguardam há +30 dias!` : "Fila dentro do prazo"}
          icon={appIcons.bell}
          gradient={pendingOver30Days > 0 ? "bg-gradient-to-br from-red-500 to-rose-600" : "bg-gradient-to-br from-amber-400 to-orange-500"}
          isAlert={pendingOver30Days > 0}
          onClick={handlePendingClick}
        />

        {/* KPI: Execução Orçamentária Global */}
        <KpiCard
          title="Execução Global"
          value={((financialStats.totalSpent / globalBudget) * 100).toFixed(1) + "%"}
          subtext={`R$ ${(financialStats.totalSpent/1000).toFixed(1)}k de R$ ${(globalBudget/1000).toFixed(1)}k`}
          icon={appIcons.chart}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          onClick={() => onNavigateWithFilter('/reports-general', 'Atendido')}
        />

        {/* KPI: INTELIGÊNCIA DE DADOS (Previsão) */}
        {forecast ? (
          <KpiCard
            title="Previsão (IA)"
            value={`R$ ${(forecast.projectedTotal / 1000).toFixed(1)}k`}
            subtext={
              forecast.status === 'danger' ? "Risco de estourar o orçamento!" : 
              forecast.status === 'warning' ? "Alerta: Consumo elevado" : 
              "Tendência estável"
            }
            icon={appIcons.trendingUp || <span>📈</span>}
            gradient={
              forecast.status === 'danger' ? "bg-gradient-to-br from-red-600 to-red-800" :
              forecast.status === 'warning' ? "bg-gradient-to-br from-amber-500 to-orange-600" :
              "bg-gradient-to-br from-indigo-500 to-purple-600"
            }
            footer={`Média Diária: R$ ${forecast.dailyAvg.toFixed(2)}`}
          />
        ) : (
          // Fallback se não for ano atual
          <KpiCard 
             title="Saldo Livre"
             value={`R$ ${((globalBudget - financialStats.totalSpent)/1000).toFixed(1)}k`}
             subtext="Disponível para uso"
             icon={appIcons.dollar}
             gradient="bg-gradient-to-br from-gray-700 to-gray-900"
          />
        )}
      </div>

      {/* 2. ORÇAMENTO DETALHADO POR FARMÁCIA */}
      {pharmacyStats.length > 0 && (
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
             <div className="bg-white p-2 rounded-lg text-indigo-600 shadow-sm">{appIcons.organization}</div>
             <h3 className="font-bold text-gray-800 text-lg">Orçamento por Unidade</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pharmacyStats.map(pharmacy => (
              <PharmacyBudgetCard
                key={pharmacy.id}
                name={pharmacy.name}
                spent={pharmacy.spent}
                budget={pharmacy.budget}
                percentage={pharmacy.percentage}
              />
            ))}
          </div>
          
          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => onNavigateWithFilter('/reports-general', 'Atendido')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1"
            >
              Ver Detalhes Financeiros {appIcons.chevronRight}
            </button>
          </div>
        </div>
      )}

      {/* 3. GRÁFICOS E TOP MEDICAMENTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Fluxo */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              {appIcons.chart} Fluxo de Atendimentos
            </h3>
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium">Mensal ({filterYear})</span>
          </div>
          <div className="h-72 w-full">
            <BarChart data={monthlyData} title="" />
          </div>
        </div>

        {/* Top Medicamentos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            {appIcons.pill} Mais Entregues
          </h3>
          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-4">
            {topMedications.length > 0 ? topMedications.map((med, idx) => (
              <div key={med.id} className="group cursor-default">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium truncate w-3/4 group-hover:text-indigo-600 transition-colors">{med.name}</span>
                  <span className="text-gray-900 font-bold">{med.quantity} cx</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div 
                    className="h-1.5 rounded-full bg-indigo-500 group-hover:bg-indigo-600 transition-all" 
                    style={{ width: `${Math.min(100, (med.quantity / topMedications[0].quantity) * 100)}%` }}
                  ></div>
                </div>
              </div>
            )) : (
              <p className="text-gray-400 text-sm text-center py-10">Sem dados ainda.</p>
            )}
          </div>
          <button
            onClick={() => navigate('/medications')}
            className="w-full mt-4 cursor-pointer text-indigo-600 text-sm font-medium bg-indigo-50 hover:bg-indigo-100 py-2 rounded-lg transition-colors flex justify-center items-center gap-1"
          >
            Ver Estoque Completo {appIcons.chevronRight}
          </button>
        </div>
      </div>

      {/* 4. ATIVIDADE RECENTE (Timeline) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
          {appIcons.history} Atividades Recentes
        </h3>
        <div className="space-y-0">
          {records.slice(0, 5).map((record, index) => (
            <div 
              key={record._id || index} 
              onClick={() => {
                  const patient = patients.find(p => (p._id || p.id) === record.patientId);
                  navigate('/patient-history', { state: { initialPatient: patient } });
              }}
              className="cursor-pointer flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-all border-b border-gray-50 last:border-0 group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm 
                  ${record.status === 'Atendido' ? 'bg-green-100 text-green-600' : 
                    record.status === 'Pendente' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                  {record.status === 'Atendido' ? appIcons.check : record.status === 'Pendente' ? appIcons.clock : appIcons.ban}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                    {getPatientNameById(record.patientId)}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    {new Date(record.entryDate).toLocaleDateString()} às {new Date(record.entryDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    <span className="text-gray-300">•</span>
                    <span>{record.medications?.length || 0} itens</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold 
                   ${record.status === 'Atendido' ? 'bg-green-50 text-green-700' : 
                     record.status === 'Pendente' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                  {record.status}
                </span>
                {Number(record.totalValue) > 0 && (
                   <p className="text-xs font-medium text-gray-500 mt-1">R$ {Number(record.totalValue).toFixed(2)}</p>
                )}
              </div>
            </div>
          ))}
          {records.length === 0 && (
             <p className="text-center text-gray-400 py-6">Nenhuma atividade registrada.</p>
          )}
        </div>
      </div>

    </div>
  );
}