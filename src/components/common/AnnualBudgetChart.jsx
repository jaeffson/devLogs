// src/components/common/AnnualBudgetChart.jsx

import React, { useMemo } from 'react';

export function AnnualBudgetChart({ 
  records = [], 
  distributors = [], 
  annualBudget = 0,
  filterYear // Recebe o ano selecionado no filtro
}) {
  
  // Define o ano base: se não vier prop, usa o ano atual
  const targetYear = filterYear || new Date().getFullYear();

  const { percentage } = useMemo(() => {
    
    // 1. TETO (ORÇAMENTO): Soma das Farmácias ou Global
    // Usa Number() simples igual à Dashboard
    const sumDistributors = distributors.reduce((acc, d) => acc + (Number(d.budget) || 0), 0);
    const finalBudget = sumDistributors > 0 ? sumDistributors : (Number(annualBudget) || 0);

    // 2. GASTO REAL: Filtra pelo targetYear igual à Dashboard
    const totalSpent = records
      .filter(r => {
        const recordYear = new Date(r.referenceDate || r.entryDate).getFullYear();
        return recordYear === Number(targetYear) && r.status !== 'Cancelado';
      })
      .reduce((acc, curr) => acc + (Number(curr.totalValue) || 0), 0);

    // 3. Porcentagem
    const pct = finalBudget > 0 ? (totalSpent / finalBudget) * 100 : 0;

    return { percentage: pct };
  }, [records, distributors, annualBudget, targetYear]);

  // --- Cores e Visual ---
  const isOver = percentage > 100;
  const isWarning = percentage > 85 && !isOver;
  
  let gradient = 'from-emerald-400 to-teal-500';
  let textColor = 'text-emerald-600';
  
  if (isOver) {
    gradient = 'from-red-500 to-rose-600';
    textColor = 'text-red-600';
  } else if (isWarning) {
    gradient = 'from-amber-400 to-orange-500';
    textColor = 'text-amber-600';
  }

  return (
    <div className="w-full animate-fadeIn">
      {/* Cabeçalho */}
      <div className="flex justify-between items-end mb-3">
        <h4 className="text-gray-600 font-bold text-base flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isOver ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
          Saúde Financeira
        </h4>
        <span className={`text-3xl font-extrabold tracking-tight ${textColor}`}>
          {percentage.toFixed(1)}%
        </span>
      </div>

      {/* Barra de Progresso */}
      <div className="relative h-5 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-200/50">
        <div 
          className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000 ease-out shadow-sm`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        >
          <div className="absolute top-0 left-0 right-0 h-[40%] bg-white/30"></div>
          {(isWarning || isOver) && (
             <div className="absolute inset-0 w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.2)_50%,rgba(255,255,255,.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress-bar-stripes_1s_linear_infinite]"></div>
          )}
        </div>
      </div>
    </div>
  );
}