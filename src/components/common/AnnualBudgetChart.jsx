import React from 'react';

// Exportação nomeada
export default function AnnualBudgetChart({ totalSpent = 0, budgetLimit = 0 }) { // Valores padrão
  const numericTotalSpent = Number(totalSpent) || 0;
  const numericBudgetLimit = Number(budgetLimit) || 0;

  const formatCurrency = (value) => {
      // Trata NaN e Infinity
      if (!isFinite(value)) return 'R$ ---';
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  // Garante que a porcentagem esteja entre 0 e um valor razoável se estourar muito
  const percentage = numericBudgetLimit > 0 ? (numericTotalSpent / numericBudgetLimit) * 100 : (numericTotalSpent > 0 ? 101 : 0);
  const displayPercentage = Math.min(percentage, 100); // Para a barra não passar de 100%
  const isOverBudget = percentage > 100;
  const budgetDifference = numericBudgetLimit - numericTotalSpent; // Pode ser negativo

  let colorClass = 'bg-green-500';
  if (percentage > 100) {
    colorClass = 'bg-red-500';
  } else if (percentage > 85) { // Limiar um pouco mais alto
    colorClass = 'bg-orange-500';
  } else if (percentage > 50) {
    colorClass = 'bg-yellow-500';
  }


  return (
    <div className="w-full max-w-xs">
      <h3 className="text-sm font-semibold text-center text-gray-600 mb-1">Orçamento Anual</h3>
      <div className="space-y-1"> {/* Reduzido espaço */}
        <div>
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="font-semibold">Gasto</span>
            <span className="font-mono">{formatCurrency(numericTotalSpent)} / {formatCurrency(numericBudgetLimit)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 relative group"> {/* Adicionado group para tooltip */}
            <div
              className={`${colorClass} h-4 rounded-full transition-all duration-500 flex items-center justify-center text-white font-bold text-xs`}
              style={{ width: `${displayPercentage}%` }}
              // Tooltip (opcional)
              title={`Utilizado: ${percentage.toFixed(1)}%`}
            >
            </div>
               {/* Indicador de estouro */}
               {isOverBudget && (
                 <div className="absolute top-0 right-0 h-4 w-1 flex items-center -mr-2">
                     <span className="text-red-500 text-xs font-bold" title={`Estourado: ${formatCurrency(budgetDifference)}`}>!</span>
                 </div>
               )}
          </div>
           {/* Texto de status (opcional) */}
           <p className={`text-xs mt-1 text-right ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
             {isOverBudget ? `Estourado em ${formatCurrency(Math.abs(budgetDifference))}` : `Restante: ${formatCurrency(budgetDifference)}`}
           </p>
        </div>
      </div>
    </div>
  );
}