import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

// --- Imports de Componentes e Utils ---
import { AnnualBudgetChart } from '../components/common/AnnualBudgetChart'; 
import { formatUserName } from '../utils/helpers'; 
import icons  from '../utils/icons'; // Importando nossos novos ícones

export default function MainLayout({ user, handleLogout, annualBudget, records }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  
  // Estados para melhorias
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const profileRef = useRef(null);
  const navigate = useNavigate();

  // (Lógica de cálculo e getRoleName - sem mudanças)
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

  // Definição dos menus (sem mudanças, mas usarão os novos ícones)
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
      { path: '/reports', label: 'Relatórios Admin', icon: icons.reports },
      { path: '/settings', label: 'Configurações', icon: icons.settings },
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
      default: return [];
    }
  }, [user?.role]);

  // (useEffect para fechar sidebar - sem mudanças)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // (useEffect para fechar dropdown - sem mudanças)
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileRef]);

  // (Função de logout - sem mudanças)
  const handleLogoutClick = () => {
    setIsProfileOpen(false);
    handleLogout();
    navigate('/login');
  };

  return (
    <div className="relative min-h-screen md:flex bg-gray-100">
      
      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* --- SIDEBAR ATUALIZADA --- */}
      <aside 
        className={`fixed inset-y-0 left-0 bg-white shadow-xl flex-shrink-0 flex flex-col z-30
                  transition-all duration-300 ease-in-out
                  ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
                  transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                  md:static md:translate-x-0`}
        aria-label="Menu Principal"
      >
        {/* Header da Sidebar */}
        <div className="p-4 border-b flex justify-between items-center h-16">
          <div className={`overflow-hidden transition-all ${isSidebarCollapsed ? 'md:w-0' : 'md:w-auto'}`}>
            <h1 className="text-2xl font-bold text-indigo-700 whitespace-nowrap">SysMed</h1>
            <p className="text-sm text-gray-500 hidden md:block whitespace-nowrap">
              Painel de {getRoleName(user?.role)}
            </p>
          </div>
          
          <button 
            className="md:hidden text-gray-500 hover:text-gray-900 p-1"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Fechar menu"
          >
            {icons.close}
          </button>
          
          <button 
            className="hidden md:block text-gray-500 hover:text-indigo-600 p-1 transition-colors"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            aria-label={isSidebarCollapsed ? "Expandir menu" : "Retrair menu"}
          >
            {isSidebarCollapsed ? icons.chevronRight : icons.chevronLeft}
          </button>
        </div>

        {/* --- NAVEGAÇÃO ATUALIZADA --- */}
        <nav className="flex-grow p-4 overflow-y-auto">
          {menuItems.map(item => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`relative w-full text-left p-3 rounded-lg text-sm font-medium transition-all duration-150 mb-2 flex items-center gap-4
                          ${isSidebarCollapsed ? 'md:justify-center' : ''}
                          ${isActive
                            ? 'bg-indigo-50 text-indigo-700 font-semibold' // Estilo de fundo para ativo
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* --- NOVO ESTILO DE INDICADOR ATIVO --- */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-indigo-600 rounded-r-full"></span>
                )}

                <span className="w-5 h-5 flex-shrink-0 text-lg">{item.icon}</span>
                <span className={`transition-opacity whitespace-nowrap ${isSidebarCollapsed ? 'md:opacity-0 md:hidden' : 'md:opacity-100'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer da Sidebar (Vazio por enquanto, o "Sair" está no perfil) */}
        <div className="p-4 border-t">
        </div>
      </aside>
      
      {/* --- CONTEÚDO PRINCIPAL E HEADER --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
          
        {/* --- HEADER ATUALIZADO --- */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center flex-shrink-0 z-10 h-16">
          
          <div className="flex items-center gap-4">
            <button 
              className="text-gray-600 hover:text-gray-900 md:hidden p-1"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              {icons.menu}
            </button>
            
            {/* Busca Global (Estilo atualizado) */}
            <div className="relative hidden md:block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                {icons.search}
              </span>
              <input
                type="text"
                placeholder="Buscar pacientes, médicos..."
                className="pl-10 pr-4 py-2 text-sm w-72 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          {/* Lado Direito */}
          <div className="flex items-center gap-4 md:gap-6">
            
            {/* Gráfico e Ano (sem mudanças, exceto o anel de foco) */}
            {(user?.role === 'admin' || user?.role === 'secretario') && (
              <div className="hidden sm:flex items-center gap-4">
                <AnnualBudgetChart
                  key={annualBudget}
                  totalSpent={totalSpentForYear}
                  budgetLimit={annualBudget}
                />
                <div className="flex items-center">
                  <label className="text-xs font-medium text-gray-700 mr-2 hidden md:inline">Ano:</label>
                  <select
                    value={filterYear}
                    onChange={e => setFilterYear(parseInt(e.target.value))}
                    className="p-1 border rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label="Selecionar Ano para Filtro"
                  >
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                  </select>
                </div>
              </div>
            )}

            {/* --- DROPDOWN DE PERFIL ATUALIZADO --- */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 rounded-full hover:bg-gray-100 p-1"
              >
                 <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl">
                   {icons.userCircle}
                 </span>
                 <span className="hidden md:block font-semibold">{formatUserName(user?.name)}</span>
                 <span className={`transition-transform text-gray-500 ${isProfileOpen ? 'rotate-180' : ''}`}>
                   {icons.chevronDown}
                 </span>
              </button>

              {/* Menu Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-100">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <Link 
                    to="/profile" 
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <span className="w-5 h-5">{icons.user}</span>
                    <span>Meu Perfil</span>
                  </Link>
                  <Link 
                    to="/settings" 
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <span className="w-5 h-5">{icons.organization}</span>
                    <span>Minha Organização</span>
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button 
                    onClick={handleLogoutClick}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                  >
                    <span className="w-5 h-5">{icons.logout}</span>
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </div>
            
          </div>
        </header>
          
        <main className="flex-grow p-4 md:p-6 overflow-auto bg-gray-100">
          {/* O Outlet é onde suas páginas (com as abas) serão renderizadas */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};