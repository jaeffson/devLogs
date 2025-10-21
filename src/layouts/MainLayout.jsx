// src/layouts/MainLayout.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

// Importe os ícones que você usa aqui (ou importe todos de um arquivo central de ícones)
import icons from '../utils/icons'; // Ajuste o caminho ../ se necessário

// Importe componentes comuns necessários
import AnnualBudgetChart  from '../components/common/AnnualBudgetChart'; // Ajuste o caminho se necessário

// --- Componente de Layout Principal (COM ROUTER E RESPONSIVIDADE) ---
export default function MainLayout ({ user, handleLogout, annualBudget, records /* Outras props de App.jsx podem ser acessadas via context */ }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [filterYear, setFilterYear] = useState(new Date().getFullYear()); // Ou receba via props/context
    const location = useLocation(); // Hook para saber a rota atual
    const navigate = useNavigate(); // Hook para navegação programática

    // Calcula gasto total (exemplo, idealmente viria do estado global/context)
    const totalSpentForYear = useMemo(() =>
        (records || [])
            .filter(r => new Date(r.entryDate).getFullYear() === filterYear)
            .reduce((sum, item) => sum + (Number(item.totalValue) || 0), 0),
        [records, filterYear]
    );

    const getRoleName = (role) => {
        const names = { profissional: "Profissional", secretario: "Secretário(a)", admin: "Administrador(a)" };
        return names[role] || role;
    };

    // Definição dos Menus (ajuste os `path` para corresponderem às suas rotas)
    const professionalMenu = [
        { path: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
        { path: '/deliveries', label: 'Entregas Recentes', icon: icons.clipboard },
        { path: '/history', label: 'Histórico de Entradas', icon: icons.history },
        { path: '/patients', label: 'Gerenciar Pacientes', icon: icons.users },
    ];
    const secretaryMenu = [
        { path: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
        { path: '/deliveries', label: 'Entregas Recentes', icon: icons.clipboard },
        { path: '/reports-general', label: 'Relatório Geral', icon: icons.reports }, // Ajuste o path se necessário
        { path: '/patient-history', label: 'Histórico por Paciente', icon: icons.history }, // Ajuste o path se necessário
    ];
    const adminMenu = [
        { path: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
        { path: '/deliveries', label: 'Entregas Recentes', icon: icons.clipboard },
        { path: '/history', label: 'Histórico de Entradas', icon: icons.history },
        { path: '/patients', label: 'Gerenciar Pacientes', icon: icons.users },
        { path: '/medications', label: 'Gerenciar Medicações', icon: icons.pill },
        { path: '/reports', label: 'Relatórios Admin', icon: icons.reports },
        { path: '/settings', label: 'Configurações', icon: icons.settings },
    ];

    const menuItems = useMemo(() => {
        switch(user?.role) {
            case 'admin': return adminMenu;
            case 'secretario': return secretaryMenu;
            case 'profissional': return professionalMenu;
            default: return []; // Retorna vazio se não houver role
        }
    }, [user?.role]); // Recalcula apenas se a role mudar

    // Fecha a sidebar se a tela for redimensionada para desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) { // Tailwind 'md' breakpoint
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="relative min-h-screen md:flex bg-gray-100">

            {/* Overlay (só aparece em mobile quando menu está aberto) */}
            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                onClick={() => setIsSidebarOpen(false)}
                aria-hidden="true" // Para acessibilidade
              ></div>
            )}

            {/* --- SIDEBAR --- */}
            <aside
              className={`fixed inset-y-0 left-0 bg-white shadow-lg flex-shrink-0 flex flex-col z-30 w-64
                         transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                         md:relative md:translate-x-0 md:shadow-md transition-transform duration-300 ease-in-out`}
              aria-label="Menu Principal"
            >
                {/* Header da Sidebar */}
                <div className="p-4 border-b flex justify-between items-center h-16"> {/* Altura fixa para alinhar com header principal */}
                   <div>
                      <h1 className="text-2xl font-bold text-gray-800">SysMed</h1>
                      <p className="text-sm text-gray-500 hidden md:block">Painel de {getRoleName(user?.role)}</p> {/* Esconde em mobile */}
                   </div>
                   {/* Botão de Fechar (só em mobile) */}
                   <button
                     className="md:hidden text-gray-500 hover:text-gray-800 p-1 -mr-1" // Ajuste de padding
                     onClick={() => setIsSidebarOpen(false)}
                     aria-label="Fechar menu"
                   >
                     {icons.close}
                   </button>
                </div>
                {/* Navegação */}
                <nav className="flex-grow p-4 overflow-y-auto">
                    {menuItems.map(item => {
                        // Verifica se a rota atual corresponde ao item do menu
                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link // Usar Link do React Router
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)} // Fecha ao navegar
                                className={`w-full text-left p-2 rounded-md text-sm font-medium transition-colors mb-2 flex items-center gap-3 ${
                                    isActive
                                        ? 'bg-blue-100 text-blue-700 font-semibold' // Destaca mais o ativo
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                                aria-current={isActive ? 'page' : undefined} // Para acessibilidade
                            >
                                <span className="w-5 h-5">{item.icon}</span> {/* Garante tamanho do ícone */}
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
                 {/* Footer da Sidebar */}
                <div className="p-4 border-t">
                     <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-2 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-md font-medium">
                       <span className="w-5 h-5">{icons.logout}</span>
                       <span>Sair</span>
                     </button>
                </div>
            </aside>

            {/* Conteúdo Principal */}
            <div className="flex-1 flex flex-col overflow-hidden">
                 {/* Header Principal */}
                 <header className="bg-white shadow-sm p-4 flex justify-between items-center flex-shrink-0 z-10 h-16"> {/* Altura fixa */}
                    <div className="flex items-center gap-4">
                        {/* Botão Hamburger (só em mobile) */}
                        <button
                          className="text-gray-600 hover:text-gray-900 md:hidden p-1 -ml-1" // Ajuste de padding
                          onClick={() => setIsSidebarOpen(true)}
                          aria-label="Abrir menu"
                        >
                          {icons.menu}
                        </button>
                        {/* Saudação escondida em telas extra pequenas */}
                        <span className="text-sm hidden xs:block">Olá, <strong className="font-semibold">{user?.name || 'Usuário'}</strong></span>
                    </div>

                    {/* Orçamento e Seletor de Ano */}
                    <div className="flex items-center gap-4 md:gap-6">
                      {(user?.role === 'admin' || user?.role === 'secretario') && (
                          <div className="hidden sm:block"> {/* Esconde orçamento em telas extra pequenas */}
                            <AnnualBudgetChart totalSpent={totalSpentForYear} budgetLimit={annualBudget} />
                          </div>
                      )}
                      {(user?.role === 'admin' || user?.role === 'secretario') &&
                          <div className="flex items-center">
                              <label className="text-xs font-medium text-gray-700 mr-2 hidden md:inline">Ano:</label> {/* Esconde label em mobile */}
                              <select
                                value={filterYear}
                                onChange={e => setFilterYear(parseInt(e.target.value))}
                                className="p-1 border rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                aria-label="Selecionar Ano para Filtro"
                              >
                                  <option value="2025">2025</option>
                                  <option value="2024">2024</option>
                                  <option value="2023">2023</option>
                                   {/* Adicione mais anos dinamicamente se necessário */}
                              </select>
                          </div>
                      }
                    </div>
                 </header>

                 {/* Área de Conteúdo da Rota */}
                 <main className="flex-grow p-4 md:p-6 overflow-auto bg-gray-100"> {/* Fundo adicionado */}
                    {/* Outlet renderiza o componente da rota filha correspondente */}
                    {/* Passa props via context para as rotas filhas poderem usar useOutletContext() */}
                    <Outlet context={{ user, annualBudget, records, filterYear /* Passe outras props de App.jsx se precisar */ }} />
                 </main>
            </div>
        </div>
    );
};
