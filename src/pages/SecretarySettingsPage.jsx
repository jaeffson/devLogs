import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import {
  FiSave,
  FiTruck,
  FiDollarSign,
  FiActivity,
  FiPieChart,
  FiAlertCircle,
  FiCheckCircle,
  FiTrendingUp,
} from 'react-icons/fi';

export default function SecretarySettingsPage({ addToast }) {
  const [distributors, setDistributors] = useState([]);
  const [editingValues, setEditingValues] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    loadDistributors();
  }, []);

  const loadDistributors = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/distributors');
      setDistributors(response.data || []);

      // Inicializa os valores de edição apenas com o TETO (Budget)
      const values = {};
      response.data.forEach((d) => {
        values[d._id] = d.budget || 0;
      });
      setEditingValues(values);
    } catch (error) {
      if (addToast) addToast('Erro ao carregar dados.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (id) => {
    setSavingId(id);
    try {
      const newVal = parseFloat(editingValues[id]);

      if (isNaN(newVal) || newVal < 0) {
        if (addToast) addToast('Insira um valor válido.', 'warning');
        setSavingId(null);
        return;
      }

      // Envia apenas o budget para atualizar o Teto
      await api.put(`/distributors/${id}`, { budget: newVal });

      if (addToast) addToast('Teto atualizado com sucesso!', 'success');

      // Atualiza o estado local para refletir na hora sem F5
      setDistributors((prev) =>
        prev.map((d) => (d._id === id ? { ...d, budget: newVal } : d))
      );
    } catch (e) {
      if (addToast) addToast('Erro ao salvar.', 'error');
      console.error(e);
    } finally {
      setSavingId(null);
    }
  };

  // --- CÁLCULOS TOTAIS (MEMOIZED) ---
  const totals = useMemo(() => {
    return distributors.reduce(
      (acc, d) => ({
        budget: acc.budget + (d.budget || 0),
        used: acc.used + (d.usedBudget || 0),
      }),
      { budget: 0, used: 0 }
    );
  }, [distributors]);

  const saldoGlobal = totals.budget - totals.used;
  const percentualGlobal =
    totals.budget > 0 ? (totals.used / totals.budget) * 100 : 0;

  // Helper de Formatação
  const formatCurrency = (val) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* --- HEADER --- */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-200">
              <FiDollarSign size={24} />
            </div>
            Gestão Financeira
          </h1>
          <p className="mt-2 text-gray-500 ml-1">
            Defina os tetos de gastos e acompanhe a execução orçamentária em
            tempo real.
          </p>
        </div>

        {/* --- CARDS DE RESUMO (DASHBOARD) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Card 1: Orçamento Total */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <FiPieChart size={80} className="text-blue-600" />
            </div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <FiDollarSign />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Teto Global Aprovado
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-800 mt-2">
              {formatCurrency(totals.budget)}
            </div>
            <div className="mt-2 text-xs text-blue-600 font-medium bg-blue-50 inline-block px-2 py-1 rounded">
              Soma de todos os limites
            </div>
          </div>

          {/* Card 2: Executado */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <FiTrendingUp size={80} className="text-orange-600" />
            </div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <FiActivity />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Total Executado
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-800 mt-2">
              {formatCurrency(totals.used)}
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
              <div
                className={`h-1.5 rounded-full ${percentualGlobal > 100 ? 'bg-red-500' : 'bg-orange-500'}`}
                style={{ width: `${Math.min(percentualGlobal, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Card 3: Saldo */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <FiCheckCircle
                size={80}
                className={saldoGlobal < 0 ? 'text-red-600' : 'text-green-600'}
              />
            </div>
            <div className="flex items-center gap-3 mb-1">
              <div
                className={`p-2 rounded-lg ${saldoGlobal < 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
              >
                {saldoGlobal < 0 ? <FiAlertCircle /> : <FiCheckCircle />}
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Saldo Disponível
              </span>
            </div>
            <div
              className={`text-3xl font-bold mt-2 ${saldoGlobal < 0 ? 'text-red-600' : 'text-green-600'}`}
            >
              {formatCurrency(saldoGlobal)}
            </div>
            <div className="mt-2 text-xs text-gray-400">
              {saldoGlobal < 0 ? 'Orçamento estourado!' : 'Dentro do previsto'}
            </div>
          </div>
        </div>

        {/* --- LISTA DE DISTRIBUIDORES --- */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
              <FiTruck className="text-indigo-500" /> Detalhamento por Unidade
            </h3>
            <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-3 py-1 rounded-full border border-gray-200">
              {distributors.length} Registros
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 flex justify-center flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              <p className="text-gray-400 text-sm animate-pulse">
                Carregando dados financeiros...
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {distributors.length > 0 ? (
                distributors.map((dist) => {
                  const percent =
                    dist.budget > 0 ? (dist.usedBudget / dist.budget) * 100 : 0;
                  const isOver = dist.usedBudget > dist.budget;
                  const isWarning = percent > 80 && !isOver;

                  // Cor da barra baseada no status
                  let progressColor = 'bg-green-500';
                  if (isWarning) progressColor = 'bg-yellow-400';
                  if (isOver) progressColor = 'bg-red-500';

                  return (
                    <div
                      key={dist._id}
                      className="p-6 hover:bg-gray-50 transition-colors grid grid-cols-1 lg:grid-cols-12 gap-6 items-center group"
                    >
                      {/* 1. Identificação e Progresso (Coluna Larga) */}
                      <div className="lg:col-span-5">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl shadow-sm border border-indigo-100 shrink-0">
                            {dist.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p
                              className="font-bold text-gray-800 text-base truncate"
                              title={dist.name}
                            >
                              {dist.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {dist.cnpj || 'CNPJ não informado'}
                            </p>
                          </div>
                        </div>

                        {/* Barra de Progresso Visual */}
                        <div className="w-full">
                          <div className="flex justify-between text-xs mb-1 font-semibold">
                            <span
                              className={`${isOver ? 'text-red-500' : 'text-gray-500'}`}
                            >
                              {percent.toFixed(1)}% Consumido
                            </span>
                          </div>
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
                            <div
                              className={`h-full ${progressColor} transition-all duration-500 ease-out`}
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* 2. Executado (Read Only) */}
                      <div className="lg:col-span-3">
                        <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 block">
                          Executado (Acumulado)
                        </label>
                        <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
                          <span className="text-gray-400 text-xs">R$</span>
                          <span className="font-mono font-bold text-gray-700">
                            {new Intl.NumberFormat('pt-BR', {
                              minimumFractionDigits: 2,
                            }).format(dist.usedBudget)}
                          </span>
                        </div>
                      </div>

                      {/* 3. Teto (Editável) e Ação */}
                      <div className="lg:col-span-4 flex items-end gap-3">
                        <div className="flex-1">
                          <label className="text-[10px] text-indigo-600 uppercase font-bold tracking-wider mb-1 block flex items-center gap-1">
                            Teto (Limite) <FiEdit3 size={10} />
                          </label>
                          <div className="relative group/input">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium transition-colors group-focus-within/input:text-indigo-500">
                              R$
                            </span>
                            <input
                              type="number"
                              className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-lg text-gray-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                              value={editingValues[dist._id] || ''}
                              onChange={(e) =>
                                setEditingValues({
                                  ...editingValues,
                                  [dist._id]: e.target.value,
                                })
                              }
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => handleSave(dist._id)}
                          disabled={savingId === dist._id}
                          className="h-[46px] px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          title="Salvar novo teto"
                        >
                          {savingId === dist._id ? (
                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                          ) : (
                            <FiSave size={20} />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-gray-400 bg-gray-50 flex flex-col items-center">
                  <FiAlertCircle size={40} className="mb-2 opacity-50" />
                  <p>Nenhum fornecedor cadastrado.</p>
                  <p className="text-sm">
                    Cadastre fornecedores no painel administrativo.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Icone auxiliar (se não tiver importado)
const FiEdit3 = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20h9"></path>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
  </svg>
);
