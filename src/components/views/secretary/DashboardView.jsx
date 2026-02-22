// src/components/views/secretary/DashboardView.jsx

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart } from '../../common/BarChart';
import {
  FiActivity,
  FiAlertCircle,
  FiClock,
  FiCheckCircle,
  FiPieChart,
  FiTrendingUp,
  FiDollarSign,
  FiUsers,
  FiShoppingBag,
  FiArrowRight,
  FiSearch,
  FiCalendar,
} from 'react-icons/fi';

// --- HELPER DE RESOLUÇÃO DE ID (BLINDAGEM SENIOR COM OPTIONAL CHAINING) ---
const getSafeMedicationName = (medicationId, meds = []) => {
  if (!medicationId) return 'Desconhecido';

  // Blindagem: Extrai o ID com Optional Chaining (?.) para não quebrar se for null
  const targetId = medicationId?._id || medicationId?.id || medicationId;

  if (!targetId) return 'Desconhecido';
  const targetIdStr = String(targetId);

  const found = meds.find(
    (m) => String(m?._id) === targetIdStr || String(m?.id) === targetIdStr
  );

  return found ? found.name : 'Desconhecido';
};

// --- COMPONENTE: KPI CARD ---
const KpiCard = ({
  title,
  value,
  subtext,
  icon,
  gradient,
  onClick,
  isAlert,
  footer,
}) => (
  <div
    onClick={onClick}
    className={`relative overflow-hidden p-6 rounded-2xl shadow-sm border border-gray-100 bg-white transition-all duration-300 group ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''} ${isAlert ? 'ring-2 ring-red-100 bg-red-50/50' : ''}`}
  >
    <div
      className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-10 transition-transform group-hover:scale-110 ${gradient}`}
    ></div>
    <div className="flex justify-between items-start mb-4 relative z-10">
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
    <div className="relative z-10">
      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
        {title}
      </h3>
      <div className="text-3xl font-extrabold text-gray-800 tracking-tight">
        {value}
      </div>
      {subtext && (
        <p
          className={`text-xs mt-2 font-medium flex items-center gap-1 ${isAlert ? 'text-red-600' : 'text-gray-400'}`}
        >
          {subtext}
        </p>
      )}
    </div>
    {footer && (
      <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 font-medium relative z-10">
        {footer}
      </div>
    )}
  </div>
);

// --- COMPONENTE: Card de Orçamento ---
const PharmacyBudgetCard = ({ name, spent, budget, percentage }) => {
  const isCritical = percentage >= 100;
  const isWarning = percentage > 85 && !isCritical;
  let barColor = 'bg-emerald-500',
    textColor = 'text-emerald-600',
    bgColor = 'bg-emerald-50';

  if (isCritical) {
    barColor = 'bg-red-500';
    textColor = 'text-red-600';
    bgColor = 'bg-red-50';
  } else if (isWarning) {
    barColor = 'bg-amber-400';
    textColor = 'text-amber-600';
    bgColor = 'bg-amber-50';
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full group">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${bgColor} ${textColor}`}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4
              className="font-bold text-gray-800 truncate pr-2 text-sm leading-tight"
              title={name}
            >
              {name}
            </h4>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${bgColor} ${textColor}`}
            >
              {percentage.toFixed(1)}% Uso
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ease-out ${barColor}`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 font-medium font-mono">
          <span>
            R${' '}
            {new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(
              spent
            )}
          </span>
          <span className="text-gray-300">/</span>
          <span>
            R${' '}
            {new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(
              budget
            )}
          </span>
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
  icons: appIcons,
  onNavigateWithFilter,
}) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [filterYear]);

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
    };
  }, [records]);

  const financialStats = useMemo(() => {
    const totalBudget = distributors.reduce(
      (acc, d) => acc + (d.budget || 0),
      0
    );
    const totalUsed = distributors.reduce(
      (acc, d) => acc + (d.usedBudget || 0),
      0
    );
    const finalBudget =
      totalBudget > 0 ? totalBudget : Number(annualBudget) || 1;
    return {
      budget: finalBudget,
      used: totalUsed,
      percentage: (totalUsed / finalBudget) * 100,
    };
  }, [distributors, annualBudget]);

  const pharmacyStats = useMemo(() => {
    return distributors
      .map((dist) => {
        const budget = Number(dist.budget) || 1;
        const spent = Number(dist.usedBudget) || 0;
        return {
          id: dist._id || dist.id,
          name: dist.name,
          spent: spent,
          budget: budget,
          percentage: (spent / budget) * 100,
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [distributors]);

  const pendingOver30Days = useMemo(() => {
    const MS_IN_30_DAYS = 30 * 24 * 60 * 60 * 1000;
    const now = new Date().getTime();
    return records.filter(
      (r) =>
        r.status === 'Pendente' &&
        r.entryDate &&
        now - new Date(r.entryDate).getTime() > MS_IN_30_DAYS
    ).length;
  }, [records]);

  const forecast = useMemo(() => {
    const now = new Date();
    if (filterYear !== now.getFullYear()) return null;
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const daysPassed = Math.max(
      1,
      Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24))
    );
    const dailyAvg = financialStats.used / daysPassed;
    const projectedTotal = dailyAvg * 365;
    let status = 'safe';
    if (projectedTotal > financialStats.budget) status = 'danger';
    else if (projectedTotal > financialStats.budget * 0.9) status = 'warning';
    return { dailyAvg, projectedTotal, status };
  }, [financialStats, filterYear]);

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

  // --- CORREÇÃO: TOP MEDICAMENTOS (MAIS SAÍDOS COM OPTIONAL CHAINING) ---
  const topMedications = useMemo(() => {
    const countMap = {};
    recordsByYear.forEach((rec) => {
      if (rec.medications && Array.isArray(rec.medications)) {
        rec.medications.forEach((item) => {
          // Blindagem de ID aqui também
          const medId =
            item?.medicationId?._id ||
            item?.medicationId?.id ||
            item?.medicationId;

          if (medId) {
            countMap[medId] =
              (countMap[medId] || 0) + (Number(item.quantity) || 1);
          }
        });
      }
    });
    return Object.entries(countMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, qtd]) => ({
        id,
        name: getSafeMedicationName(id, medications),
        quantity: qtd,
      }));
  }, [recordsByYear, medications]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse p-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 bg-gray-100 rounded-2xl"></div>
        ))}
        <div className="md:col-span-4 h-96 bg-gray-100 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            Visão Geral <span className="text-gray-300 font-light">|</span>{' '}
            <span className="text-indigo-600">{filterYear}</span>
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2 text-sm font-medium">
            <FiCalendar className="text-indigo-500" /> Resumo operacional e
            financeiro da secretaria.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/patient-history')}
            className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all text-sm font-bold hover:shadow-md cursor-pointer"
          >
            <FiSearch /> Buscar Paciente
          </button>
          <button
            onClick={() =>
              onNavigateWithFilter(
                '/reports-general',
                pendingOver30Days > 0 ? 'Vencido' : 'Pendente'
              )
            }
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all text-sm font-bold hover:-translate-y-0.5 cursor-pointer"
          >
            <FiClock /> Gerenciar Fila ({todayStats.pending})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard
          title="Atendimentos Hoje"
          value={todayStats.total}
          subtext={`${todayStats.attended} finalizados`}
          icon={<FiUsers size={24} />}
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          onClick={() => onNavigateWithFilter('/reports-general', 'all')}
          footer={`${todayStats.pending} aguardando na fila`}
        />
        <KpiCard
          title="Execução Orçamentária"
          value={`${financialStats.percentage.toFixed(1)}%`}
          subtext={`R$ ${(financialStats.used / 1000).toFixed(1)}k gastos`}
          icon={<FiPieChart size={24} />}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          isAlert={financialStats.percentage > 100}
          onClick={() => onNavigateWithFilter('/reports-general', 'Atendido')}
          footer={`Teto Global: R$ ${(financialStats.budget / 1000).toFixed(1)}k`}
        />
        <KpiCard
          title={pendingOver30Days > 0 ? 'Atrasos Críticos' : 'Fila de Espera'}
          value={records.filter((r) => r.status === 'Pendente').length}
          subtext={
            pendingOver30Days > 0
              ? `${pendingOver30Days} vencidos (+30 dias)`
              : 'Fluxo normal'
          }
          icon={<FiAlertCircle size={24} />}
          gradient={
            pendingOver30Days > 0
              ? 'bg-gradient-to-br from-red-500 to-rose-600'
              : 'bg-gradient-to-br from-amber-400 to-orange-500'
          }
          isAlert={pendingOver30Days > 0}
          onClick={() =>
            onNavigateWithFilter(
              '/reports-general',
              pendingOver30Days > 0 ? 'Vencido' : 'Pendente'
            )
          }
          footer="Pacientes aguardando medicação"
        />
        {forecast ? (
          <KpiCard
            title="Projeção Anual (IA)"
            value={`R$ ${(forecast.projectedTotal / 1000).toFixed(1)}k`}
            subtext={
              forecast.status === 'danger'
                ? 'Risco de estouro!'
                : forecast.status === 'warning'
                  ? 'Alerta de consumo'
                  : 'Tendência segura'
            }
            icon={<FiTrendingUp size={24} />}
            gradient={
              forecast.status === 'danger'
                ? 'bg-gradient-to-br from-red-600 to-red-800'
                : forecast.status === 'warning'
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                  : 'bg-gradient-to-br from-violet-500 to-purple-600'
            }
            footer={`Média/Dia: R$ ${forecast.dailyAvg.toFixed(2)}`}
          />
        ) : (
          <KpiCard
            title="Saldo Disponível"
            value={`R$ ${((financialStats.budget - financialStats.used) / 1000).toFixed(1)}k`}
            subtext="Livre para empenho"
            icon={<FiDollarSign size={24} />}
            gradient="bg-gradient-to-br from-gray-700 to-gray-900"
          />
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <FiActivity className="text-indigo-500" /> Fluxo de
                  Atendimentos
                </h3>
                <p className="text-gray-400 text-xs">
                  Pacientes atendidos por mês
                </p>
              </div>
              <span className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full font-bold border border-indigo-100">
                {filterYear}
              </span>
            </div>
            <div className="h-72 w-full">
              <BarChart data={monthlyData} title="" color="#6366f1" />
            </div>
          </div>
          {pharmacyStats.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                    <FiShoppingBag />
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">
                    Execução por Unidade
                  </h3>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pharmacyStats.map((pharmacy) => (
                  <PharmacyBudgetCard
                    key={pharmacy.id}
                    name={pharmacy.name}
                    spent={pharmacy.spent}
                    budget={pharmacy.budget}
                    percentage={pharmacy.percentage}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
            <h3 className="font-bold text-gray-800 text-lg mb-6 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm">
                #
              </div>
              Mais Saídos
            </h3>
            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-5">
              {topMedications.length > 0 ? (
                topMedications.map((med, idx) => (
                  <div key={med.id} className="group cursor-default">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-700 font-bold truncate w-3/4 group-hover:text-indigo-600 transition-colors">
                        {idx + 1}. {med.name}
                      </span>
                      <span className="text-gray-900 font-mono font-bold bg-gray-50 px-2 rounded text-xs py-0.5">
                        {med.quantity} cx
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-orange-400 group-hover:bg-orange-500 transition-all shadow-sm"
                        style={{
                          width: `${Math.min(100, (med.quantity / topMedications[0].quantity) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                  <FiPieChart size={32} className="mb-2 opacity-20" />
                  Sem dados ainda.
                </div>
              )}
            </div>
            <button
              onClick={() => navigate('/medications')}
              className="w-full mt-4 cursor-pointer text-indigo-600 text-sm font-bold bg-indigo-50 hover:bg-indigo-100 py-3 rounded-xl transition-colors flex justify-center items-center gap-2"
            >
              Ver Estoque Completo <FiArrowRight />
            </button>
          </div>

          {/* Seção: Atividade Recente (BLINDADA COM OPTIONAL CHAINING) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[400px] overflow-hidden flex flex-col">
            <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
              <FiClock className="text-gray-400" /> Recentes
            </h3>
            <div className="overflow-y-auto custom-scrollbar flex-grow -mx-4 px-4">
              {records.length > 0 ? (
                records.slice(0, 8).map((record, index) => {
                  // --- A MÁGICA ACONTECE AQUI: A BLINDAGEM DO OPTIONAL CHAINING ---
                  const recPatientId =
                    record?.patientId?._id ||
                    record?.patientId?.id ||
                    record?.patientId;

                  const patient = patients.find((p) => {
                    const pId = p?._id || p?.id;
                    // Só compara se ambos existirem, evitando quebrar a tela
                    return (
                      pId &&
                      recPatientId &&
                      String(pId) === String(recPatientId)
                    );
                  });

                  const patientDisplayName = patient
                    ? patient.name
                    : record?.patientName || 'Paciente Não Identificado';
                  // -------------------------------------------------------

                  return (
                    <div
                      key={record?._id || index}
                      onClick={() => {
                        if (patient) {
                          navigate('/patient-history', {
                            state: { initialPatient: patient },
                          });
                        }
                      }}
                      className="cursor-pointer flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-all border-b border-gray-50 last:border-0 group"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm shrink-0 ${
                          record.status === 'Atendido'
                            ? 'bg-green-100 text-green-600'
                            : record.status === 'Pendente'
                              ? 'bg-amber-100 text-amber-600'
                              : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {record.status === 'Atendido' ? (
                          <FiCheckCircle size={14} />
                        ) : record.status === 'Pendente' ? (
                          <FiClock size={14} />
                        ) : (
                          <FiAlertCircle size={14} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition-colors truncate">
                          {patientDisplayName}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {record.medications?.length || 0} itens •{' '}
                          {record.entryDate
                            ? new Date(record.entryDate).toLocaleDateString(
                                'pt-BR'
                              )
                            : '--'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        {Number(record.totalValue) > 0 && (
                          <p className="text-xs font-mono font-bold text-gray-600">
                            R$ {Number(record.totalValue).toFixed(0)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-400 py-10 text-sm">
                  Nenhuma atividade recente.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
