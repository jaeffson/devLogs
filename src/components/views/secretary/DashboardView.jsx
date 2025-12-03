// src/components/views/secretary/DashboardView.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// IMPORTANTE: Certifique-se de ter instalado: npm install recharts
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, AreaChart, Area 
} from 'recharts';

import { icons } from '../../../utils/icons';

const MS_IN_30_DAYS = 30 * 24 * 60 * 60 * 1000;

export function DashboardView({
  user,
  annualBudget,
  patients = [],
  records = [],
  medications = [],
  filterYear,
  getMedicationName,
  onNavigateWithFilter,
}) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Simulação de loading
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [filterYear]);

  // --- HELPER: Limpeza de Nome ---
  const cleanMedicationName = (fullName) => {
    if (!fullName) return 'Desconhecido';
    return fullName
      .replace(/\s+\d+\s*(cx|cxs|caixa|un|und|fr|frasco|amp|ampola)s?\.?/gi, '')
      .replace(/\s+(cx|cxs|caixa|un|und|fr|frasco|amp|ampola)s?\.?$/gi, '')
      .trim();
  };

  // --- PROCESSAMENTO DE DADOS (MEMOS) ---

  const recordsByYear = useMemo(() => 
    Array.isArray(records) ? records.filter(r => {
        try { return new Date(r.entryDate).getFullYear() === filterYear; } catch { return false; }
    }) : [], 
  [records, filterYear]);

  // 1. Dados para Recharts (Tendência + Gráfico)
  const monthlyTrends = useMemo(() => {
      const monthsLabel = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      // Inicializa array com 12 meses
      const data = Array.from({ length: 12 }, (_, i) => ({ 
          name: monthsLabel[i], // Nome para o Eixo X
          monthIndex: i,
          value: 0 
      }));
      
      recordsByYear.forEach(r => {
          if (r.status === 'Atendido') {
              const m = new Date(r.entryDate).getMonth();
              if (data[m]) data[m].value += 1;
          }
      });

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentVal = data[currentMonth]?.value || 0;
      const prevVal = data[currentMonth - 1]?.value || 0;
      const growth = prevVal === 0 ? 0 : Math.round(((currentVal - prevVal) / prevVal) * 100);

      return { chartData: data, growth, currentVal };
  }, [recordsByYear]);

  // 2. KPIs Principais
  const kpis = useMemo(() => {
    const totalSpent = recordsByYear.reduce((acc, r) => acc + (Number(r.totalValue) || 0), 0);
    const budget = Number(annualBudget) || 0;
    const remaining = budget - totalSpent;
    const percentUsed = budget > 0 ? (totalSpent / budget) * 100 : 0;
    
    const pendingCount = Array.isArray(records) ? records.filter(r => r.status === 'Pendente').length : 0;
    
    const now = Date.now();
    const criticalList = Array.isArray(records) ? records
        .filter(r => r.status === 'Pendente' && (now - new Date(r.entryDate).getTime() > MS_IN_30_DAYS))
        .sort((a,b) => new Date(a.entryDate) - new Date(b.entryDate))
        .slice(0, 3) : [];

    return {
        totalPatients: Array.isArray(patients) ? patients.length : 0,
        totalSpent,
        remaining,
        percentUsed,
        pendingCount,
        criticalList,
        criticalCount: Array.isArray(records) ? records.filter(r => r.status === 'Pendente' && (now - new Date(r.entryDate).getTime() > MS_IN_30_DAYS)).length : 0
    };
  }, [records, recordsByYear, patients, annualBudget]);

  // 3. Top Medicações (Com limpeza de nome)
  const topMedications = useMemo(() => {
      const countsByName = {};
      
      recordsByYear.forEach(r => {
          if (Array.isArray(r.medications)) {
            r.medications.forEach(m => {
                const rawName = getMedicationName(m.medicationId, medications);
                const cleanName = cleanMedicationName(rawName);
                const qtd = Number(m.quantity) || 1;
                countsByName[cleanName] = (countsByName[cleanName] || 0) + qtd;
            });
          }
      });

      return Object.entries(countsByName)
          .map(([name, qtd]) => ({ name, qtd }))
          .sort((a, b) => b.qtd - a.qtd)
          .slice(0, 5);
  }, [recordsByYear, medications, getMedicationName]);


  if (isLoading) {
      return (
          <div className="p-6 space-y-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>)}
              </div>
              <div className="h-64 bg-gray-200 rounded-xl mt-6"></div>
          </div>
      );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* --- CABEÇALHO --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-100 pb-5">
        <div>
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Visão Geral</h1>
            <p className="text-gray-500 mt-1">
                Acompanhamento estratégico de {filterYear}. 
                <span className="text-emerald-600 font-medium ml-2 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                    ● Sistema Operante
                </span>
            </p>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={() => navigate('/deliveries')}
                className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-indigo-600 transition-colors shadow-sm cursor-pointer"
            >
                Últimas Entregas
            </button>
            <button 
                onClick={() => onNavigateWithFilter('/reports-general', 'Pendente')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all active:scale-95 cursor-pointer"
            >
                + Resolver Pendências
            </button>
        </div>
      </div>

      {/* --- CARDS DE KPI (Modernizados com Sparklines Recharts) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Orçamento */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all cursor-default">
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <p className="text-sm font-medium text-gray-500">Orçamento Disponível</p>
                      <h3 className="text-2xl font-bold text-gray-800 mt-1">
                          R$ {(kpis.remaining / 1000).toFixed(1)}k
                      </h3>
                  </div>
                  <div className={`p-2 rounded-lg ${kpis.remaining < 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {icons.money || '$'}
                  </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${kpis.percentUsed > 90 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                    style={{ width: `${Math.min(kpis.percentUsed, 100)}%` }}
                  ></div>
              </div>
              <p className="text-xs text-gray-400">
                  <span className={`font-semibold ${kpis.percentUsed > 90 ? 'text-red-500' : 'text-gray-600'}`}>
                    {kpis.percentUsed.toFixed(1)}%
                  </span> utilizado do anual.
              </p>
          </div>

          {/* Card 2: Atendimentos (Com Sparkline) */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 group hover:shadow-md transition-all flex flex-col justify-between cursor-default">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-sm font-medium text-gray-500">Atendimentos (Mês)</p>
                      <h3 className="text-2xl font-bold text-gray-800 mt-1">{monthlyTrends.currentVal}</h3>
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${monthlyTrends.growth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {monthlyTrends.growth >= 0 ? '↑' : '↓'} {Math.abs(monthlyTrends.growth)}%
                  </div>
              </div>
              
              {/* Mini Gráfico de Área (Sparkline) */}
              <div className="mt-4 h-12 w-full opacity-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrends.chartData}>
                        <defs>
                            <linearGradient id="colorAtend" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="url(#colorAtend)" />
                    </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Card 3: Pendências */}
          <div 
            onClick={() => onNavigateWithFilter('/reports-general', 'Pendente')}
            className={`cursor-pointer p-5 rounded-2xl shadow-sm border transition-all relative overflow-hidden group
                ${kpis.pendingCount > 0 ? 'bg-orange-50 border-orange-100 hover:bg-orange-100' : 'bg-white border-gray-100 hover:shadow-md'}
            `}
          >
              <div className="flex justify-between items-start z-10 relative">
                  <div>
                      <p className={`text-sm font-medium ${kpis.pendingCount > 0 ? 'text-orange-700' : 'text-gray-500'}`}>
                          Aguardando Ação
                      </p>
                      <h3 className={`text-2xl font-bold mt-1 ${kpis.pendingCount > 0 ? 'text-orange-900' : 'text-gray-800'}`}>
                          {kpis.pendingCount}
                      </h3>
                  </div>
                  <div className="p-2 bg-white/50 rounded-lg text-orange-600 backdrop-blur-sm">
                      {icons.alert || '!'}
                  </div>
              </div>
              {kpis.criticalCount > 0 && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100/80 text-red-700 text-xs font-bold animate-pulse z-10 relative">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                      {kpis.criticalCount} Atrasados (+30d)
                  </div>
              )}
          </div>

          {/* Card 4: Pacientes */}
          <div 
            onClick={() => navigate('/patient-history')}
            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-pointer group hover:shadow-md transition-all hover:border-blue-200"
          >
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-sm font-medium text-gray-500">Base de Pacientes</p>
                      <h3 className="text-2xl font-bold text-gray-800 mt-1">{kpis.totalPatients}</h3>
                  </div>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                      {icons.users}
                  </div>
              </div>
              <div className="mt-4 flex -space-x-2 overflow-hidden">
                  <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center text-[8px] text-gray-500 font-bold">P1</div>
                  <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center text-[8px] text-gray-500 font-bold">P2</div>
                  <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-[8px] text-gray-500">+</div>
              </div>
          </div>
      </div>

      {/* --- SEÇÃO PRINCIPAL: GRÁFICOS E LISTAS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* GRÁFICO PRINCIPAL COM RECHARTS (2/3 da largura) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-800">Fluxo de Atendimentos</h3>
                  {/* Select com cursor-pointer */}
                  <select className="text-xs border-gray-200 rounded-md text-gray-500 bg-gray-50 p-1 cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500">
                      <option>Visualização Anual</option>
                  </select>
              </div>
              
              <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyTrends.chartData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false}
                            tickLine={false}
                            tick={{fill: '#9ca3af', fontSize: 12}}
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{fill: '#9ca3af', fontSize: 12}}
                          />
                          <Tooltip 
                            cursor={{fill: '#f9fafb'}}
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                          />
                          <Bar 
                            dataKey="value" 
                            name="Atendimentos" 
                            fill="#6366f1" 
                            radius={[4, 4, 0, 0]} 
                            barSize={32}
                          />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* LISTA LATERAL: TOP MEDICAÇÕES (1/3 da largura) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Mais Saídas</h3>
              <div className="flex-grow space-y-4">
                  {topMedications.map((med, idx) => (
                      <div key={idx} className="relative group">
                          <div className="flex justify-between text-sm mb-1 relative z-10">
                              <span className="font-medium text-gray-700 truncate pr-2 capitalize">{med.name}</span>
                              <span className="font-bold text-gray-900">{med.qtd}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-indigo-400 h-1.5 rounded-full" 
                                style={{ width: `${(med.qtd / (topMedications[0]?.qtd || 1)) * 100}%` }}
                              ></div>
                          </div>
                      </div>
                  ))}
                  {topMedications.length === 0 && (
                      <div className="text-center py-10 text-gray-400 text-sm">
                          Nenhum dado registrado.
                      </div>
                  )}
              </div>
              <button 
                onClick={() => navigate('/reports-general')}
                className="mt-4 w-full py-2 text-sm text-indigo-600 font-medium bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                  Ver Relatório Completo
              </button>
          </div>
      </div>

      {/* --- SEÇÃO DE ALERTA DE PENDÊNCIAS CRÍTICAS --- */}
      {kpis.criticalList.length > 0 && (
          <div className="bg-red-50/50 border border-red-100 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 text-red-600 rounded-full animate-pulse">
                      {icons.clock || '⏰'}
                  </div>
                  <h3 className="text-lg font-bold text-red-900">Atenção Necessária: Atrasos Críticos</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {kpis.criticalList.map(item => (
                      <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-red-100 flex flex-col">
                           <div className="text-xs font-bold text-red-500 uppercase tracking-wide mb-1">
                               {Math.floor((Date.now() - new Date(item.entryDate).getTime()) / (1000 * 60 * 60 * 24))} dias de atraso
                           </div>
                           <div className="font-bold text-gray-800 mb-2 truncate">
                               {patients.find(p => (p.id || p._id) === item.patientId)?.name || 'Paciente'}
                           </div>
                           <button 
                                onClick={() => onNavigateWithFilter('/reports-general', 'Vencido')}
                                className="mt-auto text-sm text-indigo-600 hover:underline text-left cursor-pointer"
                           >
                               Resolver agora →
                           </button>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
}