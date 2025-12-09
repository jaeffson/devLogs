// src/pages/SecretarySettingsPage.jsx


import React, { useState, useMemo, useEffect } from 'react';
import api from '../services/api'; // Importado para comunicação com a API

// --- Imports de Componentes ---
import { AnnualBudgetChart } from '../components/common/AnnualBudgetChart';
import { SimpleCard } from '../components/common/SimpleCard';
import { icons } from '../utils/icons';

// --- Componente da Página ---
export default function SecretarySettingsPage({
  user,
  annualBudget,
  handleUpdateBudget, // Função passada do App.jsx (agora só para atualização do estado global)
  records = [], // Dados dos registros
  addToast,
  addLog, // NOVO: Adicionado para registrar a alteração
}) {
  // Inicializa com o valor da prop, mas permite edição
  const [newBudgetValue, setNewBudgetValue] = useState(
    String(annualBudget || '0')
  );

  // Sincroniza o estado interno (newBudgetValue) quando a prop mudar (ex: após o App.jsx salvar na API)
  useEffect(() => {
    // Formatação amigável para o input
    setNewBudgetValue(
      new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(
        annualBudget || 0
      )
    );
  }, [annualBudget]);

  // --- CÁLCULO OTIMIZADO DE GASTOS DO ANO ---
  const totalSpentForYear = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return (records || [])
      .filter((r) => {
        // Usa o campo entryDate para filtrar por ano
        return new Date(r.entryDate).getFullYear() === currentYear;
      })
      .reduce((sum, item) => {
        // ATENÇÃO: totalValue deve vir como string da API, mas ser parseado para número
        return sum + (Number(item.totalValue) || 0);
      }, 0);
  }, [records]);

  // --- FUNÇÃO DE SALVAR ORÇAMENTO (CORRIGIDA) ---
  const handleBudgetSave = async () => {
    // AGORA ASYNC
    // 1. Remove pontuação de milhar (se houver) e substitui vírgula por ponto para parsear
    const cleanedValue = newBudgetValue.replace(/\./g, '').replace(',', '.');
    const value = parseFloat(cleanedValue);

    if (!isNaN(value) && value >= 0) {
      try {
        // 2. CHAMA A API PARA SALVAR NO BANCO DE DADOS
        await api.post('/settings/budget', {
          budget: value,
        });

        // 3. ATUALIZA O ESTADO GLOBAL (via prop) e notifica
        if (typeof handleUpdateBudget === 'function') {
          handleUpdateBudget(value);
          addToast?.('Orçamento atualizado com sucesso!', 'success');
        } else {
          addToast?.(
            'Sucesso no servidor, mas falha na atualização local.',
            'info'
          );
        }

        // 4. REGISTRA O LOG
        addLog?.(
          user?.name,
          `atualizou o Orçamento Anual para R$ ${value.toFixed(2).replace('.', ',')}`
        );
      } catch (error) {
        console.error('[API Error] Salvar Orçamento:', error);
        addToast?.('Falha ao salvar orçamento no servidor.', 'error');
      }
    } else {
      addToast?.(
        'Por favor, insira um valor numérico válido e positivo.',
        'error'
      );
    }
  };

  // --- Helpers de Exibição ---
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const totalRemaining = annualBudget - totalSpentForYear;
  // const percentageSpent = annualBudget > 0 ? (totalSpentForYear / annualBudget) * 100 : 0; // Não usado no novo design
  const isOverBudget = totalRemaining < 0;

  return (
    // Container Principal: Aplicando o visual cartesiano e moderno
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 border-b pb-4 mb-8 flex items-center gap-3">
          <span className="text-blue-600">{icons.gear}</span> Configurações da
          Secretária
        </h1>

        {/* --- SEÇÃO ORÇAMENTO ANUAL --- */}
        <section className="mb-8">
          <h3 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-2">
            {icons.dollar} Orçamento Anual e Gastos
          </h3>

          {/* Cartão principal para o controle de orçamento */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md">
            {/* Gráfico (centralizado e proeminente) */}
            <div className="mb-6 flex justify-center">
              <AnnualBudgetChart
                key={annualBudget}
                totalSpent={totalSpentForYear}
                budgetLimit={annualBudget}
              />
            </div>

            {/* Indicadores de KPI (Grid de 3 Cards) */}
            <div className="grid md:grid-cols-3 gap-4 border-t border-gray-100 pt-6">
              <SimpleCard
                title="Orçamento Total"
                value={formatCurrency(annualBudget)}
                icon={icons.money}
                // Estilo moderno: cores mais claras no fundo para melhor contraste
                className="bg-blue-50 border-blue-200 text-blue-800"
              />
              <SimpleCard
                title="Gasto no Ano"
                value={formatCurrency(totalSpentForYear)}
                icon={icons.chart}
                className="bg-yellow-50 border-yellow-200 text-yellow-800"
              />
              <SimpleCard
                title="Restante Estimado"
                value={formatCurrency(totalRemaining)}
                icon={icons.wallet}
                // Destaca vermelho para estouro, verde para sobra
                className={
                  isOverBudget
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-green-50 border-green-200 text-green-800'
                }
              />
            </div>

            {/* Campo para alterar o valor (Estilo Moderno) */}
            <div className="pt-8 border-t border-gray-100 mt-6">
              <label
                className="block text-gray-700 font-semibold mb-2"
                htmlFor="annual-budget-input"
              >
                Definir Novo Limite do Orçamento (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 font-bold">
                  R$
                </span>
                <input
                  id="annual-budget-input"
                  type="text"
                  value={newBudgetValue}
                  onChange={(e) => setNewBudgetValue(e.target.value)}
                  // Novo estilo de input: maior, borda mais grossa, foco azul
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-blue-500 transition-colors text-lg font-bold text-gray-800"
                  placeholder="0,00"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Use vírgula para separar centavos (ex: 5.000,00).
              </p>
            </div>

            {/* Botão para salvar (Estilo Moderno) */}
            <button
              onClick={handleBudgetSave}
              disabled={newBudgetValue.length === 0}
              className="w-full mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {icons.save} Salvar Novo Orçamento
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
