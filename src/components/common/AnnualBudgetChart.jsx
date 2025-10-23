// src/components/common/AnnualBudgetChart.jsx
import React from 'react';

// Exportação NOMEADA (para combinar com o import no MainLayout)
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

  // --- LÓGICA DE CORES COM GRADIENTES ---
  let gradientClass = 'from-green-500 to-green-400';
  let statusColorClass = 'text-green-600';
  if (percentage > 100) {
    gradientClass = 'from-red-500 to-red-400';
    statusColorClass = 'text-red-600';
  } else if (percentage > 85) {
    gradientClass = 'from-orange-500 to-orange-400';
    statusColorClass = 'text-orange-600';
  } else if (percentage > 50) {
    gradientClass = 'from-yellow-500 to-yellow-400';
    statusColorClass = 'text-yellow-600';
  }

  return (
    // --- CORREÇÃO AQUI: "box-content" foi RE-ADICIONADO ---
    <div className="w-full max-w-xs animate-fade-in box-content">
      <h3 className="text-sm font-semibold text-center text-gray-600 mb-1">Orçamento Anual</h3>
      <div className="space-y-1">
        <div>
          {/* Informações de Texto */}
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="font-semibold text-gray-700">Gasto</span>
            <span className="font-mono text-gray-600">{formatCurrency(numericTotalSpent)} / {formatCurrency(numericBudgetLimit)}</span>
          </div>
          {/* Barra de Progresso */}
          <div className="w-full bg-gray-200 rounded-full h-4 relative group" title={`Utilizado: ${percentage.toFixed(1)}%`}>
            {/* --- BARRA COM GRADIENTE E ANIMAÇÃO --- */}
            <div
              className={`h-4 rounded-full bg-gradient-to-r ${gradientClass} transition-all duration-1000 ease-out flex items-center justify-center text-white font-bold text-xs shadow-inner`}
              style={{ width: `${displayPercentage}%` }}
            >
              {/* Mostra porcentagem dentro da barra se ela for larga o suficiente */}
              {displayPercentage > 20 && (
                <span className="text-white text-xs font-bold" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
                  {Math.round(percentage)}%
                </span>
              )}
            </div>
            {/* Indicador de estouro */}
            {isOverBudget && (
                 <div className="absolute top-0 right-0 h-4 w-1 flex items-center -mr-2 animate-pulse">
                     <span className="text-red-500 text-base font-bold" title={`Estourado em: ${formatCurrency(Math.abs(budgetDifference))}`}>!</span>
                 </div>
            )}
          </div>
          {/* Texto de Status abaixo da barra */}
          <p className={`text-xs mt-1 text-right font-medium ${statusColorClass}`}>
             {isOverBudget ? `Estourado em ${formatCurrency(Math.abs(budgetDifference))}` : `Restante: ${formatCurrency(budgetDifference)}`}
           </p>
        </div>
      </div>
    </div>
  );
}

