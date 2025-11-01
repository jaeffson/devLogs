// src/components/common/SimpleCard.jsx

import React from 'react';

// Um componente simples e reutilizável para exibir métricas
export function SimpleCard({ title, value, icon, className = '' }) {
  return (
    <div className={`p-4 rounded-lg shadow-sm border ${className}`}>
      <div className="flex items-center gap-3">
        {icon && (
          // O ícone usa as cores herdadas (currentColor), então as cores Tailwind no span funcionam
          <span className="w-6 h-6 text-current flex-shrink-0">
            {icon} 
          </span>
        )}
        <div className="flex-grow">
          <p className="text-sm font-medium text-gray-700">{title}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}