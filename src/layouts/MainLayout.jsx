// src/layouts/MainLayout.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

// --- Imports de Componentes ---
// Certifique-se que o caminho e a exportação (default ou named {}) estão corretos
import  AnnualBudgetChart  from '../components/common/AnnualBudgetChart';

// --- DEFINIÇÃO DOS ÍCONES ---
// Para garantir que funcione, os ícones estão definidos diretamente aqui.
// O ideal é mantê-los em 'src/utils/icons.jsx' e importar, mas isso garante a correção.
const icons = {
  user: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  lock: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
  plus: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  search: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  edit: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  trash: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>,
  logout: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  pill: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path><path d="m8.5 8.5 7 7"></path></svg>,
  users: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  clipboard: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>,
  dollar: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
  settings: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  dashboard: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
  download: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
  history: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>,
  reports: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>,
  menu: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
  close: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
};
// --- FIM DOS ÍCONES ---

export default function MainLayout({ user, handleLogout, annualBudget, records }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());

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

    // --- LÓGICA DO MENU CORRIGIDA ---
    const menuItems = useMemo(() => {
        const professionalMenu = [
            { path: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
            { path: '/deliveries', label: 'Entregas Recentes', icon: icons.clipboard },
            { path: '/history', label: 'Histórico de Entradas', icon: icons.history },
            { path: '/patients', label: 'Gerenciar Pacientes', icon: icons.users },
        ];
        const secretaryMenu = [
            { path: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
            { path: '/deliveries', label: 'Entregas Recentes', icon: icons.clipboard },
            { path: '/reports-general', label: 'Relatório Geral', icon: icons.reports },
            { path: '/patient-history', label: 'Histórico por Paciente', icon: icons.history },
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

        switch(user?.role) {
            case 'admin': return adminMenu;
            case 'secretario': return secretaryMenu;
            case 'profissional': return professionalMenu;
            default: return []; // Retorna um array vazio se o usuário ou a role não existirem
        }
    }, [user?.role]);

    // Efeito para fechar o menu em telas maiores
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) { // Ponto de quebra 'md' do Tailwind
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="relative min-h-screen md:flex bg-gray-100">
            {/* Overlay para fechar menu em mobile */}
            {isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                onClick={() => setIsSidebarOpen(false)}
                aria-hidden="true"
              ></div>
            )}

            {/* --- SIDEBAR (MENU LATERAL) --- */}
            <aside 
              className={`fixed inset-y-0 left-0 bg-white shadow-lg flex-shrink-0 flex flex-col z-30 w-64
                         transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                         md:relative md:translate-x-0 md:shadow-md transition-transform duration-300 ease-in-out`}
              aria-label="Menu Principal"
            >
                {/* Header da Sidebar */}
                <div className="p-4 border-b flex justify-between items-center h-16">
                   <div>
                      <h1 className="text-2xl font-bold text-gray-800">SysMed</h1>
                      <p className="text-sm text-gray-500 hidden md:block">Painel de {getRoleName(user?.role)}</p>
                   </div>
                   <button 
                     className="md:hidden text-gray-500 hover:text-gray-800 p-1"
                     onClick={() => setIsSidebarOpen(false)}
                     aria-label="Fechar menu"
                   >
                     {icons.close}
                   </button>
                </div>

                {/* Navegação */}
                <nav className="flex-grow p-4 overflow-y-auto">
                    {menuItems.map(item => {
                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`w-full text-left p-2 rounded-md text-sm font-medium transition-colors mb-2 flex items-center gap-3 ${
                                    isActive
                                        ? 'bg-blue-100 text-blue-700 font-semibold'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <span className="w-5 h-5">{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer da Sidebar (Logout) */}
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
                 <header className="bg-white shadow-sm p-4 flex justify-between items-center flex-shrink-0 z-10 h-16">
                    <div className="flex items-center gap-4">
                        <button 
                          className="text-gray-600 hover:text-gray-900 md:hidden p-1"
                          onClick={() => setIsSidebarOpen(true)}
                          aria-label="Abrir menu"
                        >
                          {icons.menu}
                        </button>
                        <span className="text-sm hidden xs:block">Olá, <strong className="font-semibold">{user?.name || 'Usuário'}</strong></span>
                    </div>
                   
                    <div className="flex items-center gap-4 md:gap-6">
                      {(user?.role === 'admin' || user?.role === 'secretario') && (
                          <div className="hidden sm:block">
                            <AnnualBudgetChart
                                key={annualBudget}
                                totalSpent={totalSpentForYear}
                                budgetLimit={annualBudget}
                            />
                          </div>
                      )}
                      {(user?.role === 'admin' || user?.role === 'secretario') &&
                          <div className="flex items-center">
                              <label className="text-xs font-medium text-gray-700 mr-2 hidden md:inline">Ano:</label>
                              <select
                                value={filterYear}
                                onChange={e => setFilterYear(parseInt(e.target.value))}
                                className="p-1 border rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                aria-label="Selecionar Ano para Filtro"
                              >
                                  <option value="2025">2025</option>
                                  <option value="2024">2024</option>
                                  <option value="2023">2023</option>
                              </select>
                          </div>
                      }
                    </div>
                 </header>
                 
                 {/* Área de Conteúdo da Rota */}
                 <main className="flex-grow p-4 md:p-6 overflow-auto bg-gray-100">
                    {/* O Outlet renderiza o componente da rota filha (ex: ProfessionalDashboardPage) */}
                    <Outlet />
                 </main>
            </div>
        </div>
    );
};

