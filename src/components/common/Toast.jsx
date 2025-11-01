import React, { useEffect } from 'react';

// Componente: Toast (Notificação) - Exportação nomeada
export default function Toast({ message, type, onClose }) {
  const bgColor =
    type === 'success'
      ? 'bg-green-500'
      : type === 'error'
        ? 'bg-red-500'
        : 'bg-blue-500';

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`m-2 p-4 text-white rounded-lg shadow-lg ${bgColor} animate-fade-in-down`}
    >
      {' '}
      {/* Animação simples */}
      {message}
    </div>
  );
}
