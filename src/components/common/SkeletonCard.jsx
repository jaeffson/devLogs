import React from 'react';

export function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      {/* 'animate-pulse' é a mágica do Tailwind */}
      <div className="animate-pulse">
        {/* Linha 1 (Título do Card) */}
        <div className="mb-2 h-4 w-1/2 rounded bg-gray-200"></div>
        {/* Linha 2 (Número Grande) */}
        <div className="mb-3 h-8 w-1/4 rounded bg-gray-200"></div>
        {/* Linha 3 (Subtítulo) */}
        <div className="h-3 w-3/4 rounded bg-gray-200"></div>
      </div>
    </div>
  );
}