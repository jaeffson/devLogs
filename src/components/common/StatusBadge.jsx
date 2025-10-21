import React from 'react';

// Exportação nomeada
export const StatusBadge = ({ status }) => {
    let badgeClass = 'bg-gray-100 text-gray-800 border border-gray-300'; // Default com borda
    switch (status) {
        case 'Atendido':
            badgeClass = 'bg-green-100 text-green-800 border border-green-300';
            break;
        case 'Pendente':
            badgeClass = 'bg-yellow-100 text-yellow-800 border border-yellow-300';
            break;
        case 'Cancelado':
            badgeClass = 'bg-red-100 text-red-800 border border-red-300';
            break;
        // Adicione mais status se necessário
        case 'active': // Para usuários
             badgeClass = 'bg-green-100 text-green-800 border border-green-300';
             return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${badgeClass}`}>Ativo</span>;
        case 'inactive': // Para usuários
             badgeClass = 'bg-red-100 text-red-800 border border-red-300';
              return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${badgeClass}`}>Inativo</span>;
        case 'pending': // Para usuários
              badgeClass = 'bg-yellow-100 text-yellow-800 border border-yellow-300';
               return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${badgeClass}`}>Pendente</span>;

    }
    // Retorna o status original se não for um status de usuário mapeado acima
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${badgeClass}`}>{status}</span>;
}
export default StatusBadge