import React from 'react';
import  Toast from '../common/Toast'; // Importa o Toast do mesmo diretório

// Container para os Toasts - Exportação nomeada
export  function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-5 right-5 z-[9999]"> {/* Z-index alto */}
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}
