import React from 'react';

// Exportação nomeada
export function FullScreenPreloader() {
  return (
    <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-[9999]">
      <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );
}
export default FullScreenPreloader