// src/components/common/AnnualBudgetChart.jsx
// (Versão com visual mais profissional e elegante)

import React from 'react';

// Exportação NOMEADA
export function AnnualBudgetChart({ totalSpent = 0, budgetLimit = 0 }) {
  const numericTotalSpent = Number(totalSpent) || 0;
  const numericBudgetLimit = Number(budgetLimit) || 0;

  const formatCurrency = (value) => {
    if (!isFinite(value)) return 'R$ ---';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  const percentage = numericBudgetLimit > 0 ? (numericTotalSpent / numericBudgetLimit) * 100 : (numericTotalSpent > 0 ? 101 : 0);
  const displayPercentage = Math.min(percentage, 100);
  const isOverBudget = percentage > 100;
  const budgetDifference = numericBudgetLimit - numericTotalSpent;

  // --- (NOVA) LÓGICA DE CORES (Mais Limpa) ---
  let barColorClass = 'bg-blue-600';    // Padrão (OK)
  let textColorClass = 'text-gray-700'; // Padrão
  let percentageText = `${percentage.toFixed(0)}%`;

  if (isOverBudget) {
    barColorClass = 'bg-red-600';     // Estourado
    textColorClass = 'text-red-700';
    // Mostra o quanto estourou
    percentageText = `+${(percentage - 100).toFixed(0)}%`; 
  } else if (percentage > 85) {
    barColorClass = 'bg-yellow-500';  // Alerta
    textColorClass = 'text-yellow-700';
  }
  // --- Fim da nova lógica ---

  return (
    // Container principal
    <div className="min-w-[220px] animate-fade-in mx-auto">
      <div className="space-y-1">
        
        {/* --- 1. Informações de Porcentagem (Topo) --- */}
        {/* A informação principal (porcentagem) fica em destaque */}
        <div className="flex justify-between items-baseline mb-1 text-sm">
          <span className="font-semibold text-gray-800">Progresso Anual</span>
          <span className={`font-bold text-lg ${textColorClass}`}>
            {percentageText}
          </span>
        </div>

        {/* --- 2. Barra de Progresso (Slim) --- */}
        {/* A barra agora é mais fina (h-2.5) e sem texto dentro */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700" title={`Utilizado: ${percentage.toFixed(1)}%`}>
          <div
            className={`h-2.5 rounded-full ${barColorClass} transition-all duration-1000 ease-out`}
            style={{ width: `${displayPercentage}%` }}
          ></div>
        </div>

        {/* --- 3. Informações de Valor (Contexto) --- */}
        {/* Os valores "Gasto" e "Limite" ficam abaixo, como contexto */}
        <div className="flex justify-between items-center text-xs text-gray-600">
          <span className="font-mono" title="Total Gasto">
            {formatCurrency(numericTotalSpent)}
          </span>
          <span className="font-mono" title="Limite do Orçamento">
            {formatCurrency(numericBudgetLimit)}
          </span>
        </div>

        {/* --- 4. Status (Restante / Estourado) --- */}
        {/* O resultado final (Restante/Estourado) fica por último */}
      

      </div>
    </div>
  );
}