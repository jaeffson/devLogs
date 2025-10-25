// src/components/common/SkeletonBlock.jsx
import React from 'react';

export function SkeletonBlock() {
  return (
    <div className="h-64 w-full rounded-lg bg-white p-6 shadow animate-pulse">
      {/* Caixa cinza que simula o conteúdo do gráfico/tabela */}
      <div className="h-full w-full rounded bg-gray-200"></div>
    </div>
  );
}