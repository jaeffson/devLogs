// src/layouts/MainLayout.jsx
// (FINALIZADO: Sidebar Desktop com Auto-colapso e Hover | Bottom Nav Bar com Cores Dinâmicas)

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  WiDaySunny,
  WiDayCloudy,
  WiCloud,
  WiCloudy,
  WiRain,
  WiShowers,
  WiThunderstorm,
  WiSnow,
  WiFog,
  WiNightClear,
  WiNightCloudy,
  WiNightRain,
  WiNightShowers,
  WiNightThunderstorm,
  WiNightFog,
  WiNightSnow,
  WiDayRain,
  WiDayShowers,
  WiDayThunderstorm,
  WiDaySnow,
  WiDayFog,
} from 'react-icons/wi';

// --- Imports de Componentes e Utils ---
import { AnnualBudgetChart } from '../components/common/AnnualBudgetChart';
import { formatUserName } from '../utils/helpers';
import { icons } from '../utils/icons';

// --- Helpers de Clima e Data (Lógica Mantida) ---
function getWeatherInfo(code, isDay = true) {
  const weatherMap = {
    0: { text: 'Céu limpo', icon: isDay ? WiDaySunny : WiNightClear },
    1: { text: 'Quase limpo', icon: isDay ? WiDaySunny : WiNightClear },
    2: {
      text: 'Parcialmente nublado',
      icon: isDay ? WiDayCloudy : WiNightCloudy,
    },
    3: { text: 'Nublado', icon: WiCloudy },
    45: { text: 'Nevoeiro', icon: isDay ? WiDayFog : WiNightFog },
    48: { text: 'Nevoeiro gelado', icon: isDay ? WiDayFog : WiNightFog },
    51: { text: 'Garoa leve', icon: isDay ? WiDayRain : WiNightRain },
    53: { text: 'Garoa moderada', icon: isDay ? WiDayRain : WiNightRain },
    55: { text: 'Garoa forte', icon: isDay ? WiDayRain : WiNightRain },
    61: { text: 'Chuva leve', icon: isDay ? WiDayShowers : WiNightShowers },
    63: { text: 'Chuva moderada', icon: isDay ? WiShowers : WiNightShowers },
    65: { text: 'Chuva forte', icon: isDay ? WiRain : WiNightRain },
    71: { text: 'Neve leve', icon: isDay ? WiDaySnow : WiNightSnow },
    73: { text: 'Neve moderada', icon: isDay ? WiDaySnow : WiNightSnow },
    75: { text: 'Neve forte', icon: isDay ? WiSnow : WiNightSnow },
    80: { text: 'Pancadas leves', icon: isDay ? WiDayShowers : WiNightShowers },
    81: {
      text: 'Pancadas moderadas',
      icon: isDay ? WiShowers : WiNightShowers,
    },
    82: { text: 'Pancadas fortes', icon: isDay ? WiRain : WiNightRain },
    95: {
      text: 'Trovoada',
      icon: isDay ? WiDayThunderstorm : WiNightThunderstorm,
    },
  };
  return weatherMap[code] || { text: 'Indefinido', icon: WiCloud };
}

function useFormattedDate() {
  const [formattedDate, setFormattedDate] = useState('');
  useEffect(() => {
    const today = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const dateStr = new Intl.DateTimeFormat('pt-BR', options).format(today);
    setFormattedDate(dateStr.charAt(0).toUpperCase() + dateStr.slice(1));
  }, []);
  return formattedDate;
}

function useWeather(latitude, longitude) {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,is_day,weather_code&timezone=America/Sao_Paulo`;
    const fetchWeather = async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Resposta da API não foi OK.');
        const data = await res.json();
        if (!data.current) throw new Error('Dados de clima não encontrados.');
        const {
          temperature_2m: temp,
          is_day: isDay,
          weather_code: code,
        } = data.current;
        const { text, icon } = getWeatherInfo(code, isDay === 1);
        setWeather({
          temp: Math.round(temp),
          description: text,
          IconComponent: icon,
        });
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar clima:', err);
        setError('Clima indisponível.');
      }
    };
    fetchWeather();
    const intervalId = setInterval(fetchWeather, 1800000);
    return () => clearInterval(intervalId);
  }, [latitude, longitude]);
  return { weather, error };
}
// --- Fim dos Helpers (Lógica Mantida) ---

// --- COMPONENTE: Mobile Bottom Navigation Bar (Bottom Tab Bar) ---
const MobileBottomNav = ({ menuItems, location, handleOpenDrawer }) => {
  // Padrão: 4 a 5 itens principais
  const primaryItems = menuItems.slice(0, 4);

  // Array de cores de fundo para alternância (futurista/vibrante)
  const bgColors = [
    'bg-indigo-200/50',
    'bg-blue-200/50',
    'bg-pink-200/50',
    'bg-green-200/50',
  ];

  const isCurrentPathActive = (path) =>
    location.pathname === path ||
    (path !== '/' && location.pathname.startsWith(path));

  const getIconClass = (path) => {
    const isActive = isCurrentPathActive(path);
    return isActive
      ? 'text-indigo-700'
      : 'text-gray-500 group-hover:text-indigo-600';
  };

  const getActiveBgClass = (path, index) => {
    const isActive = isCurrentPathActive(path);
    const baseColor = bgColors[index % bgColors.length];

    // Se ativo, usa a cor base. Se inativo, usa transparente/hover.
    return isActive ? baseColor : 'bg-transparent group-hover:bg-gray-50';
  };

  return (
    // Barra inferior moderna, arredondada e com sombra
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white z-50 md:hidden shadow-2xl rounded-t-2xl overflow-hidden">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto">
        {/* Renderiza os 4 itens principais */}
        {primaryItems.map((item, index) => {
          const isActive = isCurrentPathActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center w-1/4 h-full group transition-all duration-300 cursor-pointer"
              aria-current={isActive ? 'page' : undefined}
              title={item.label}
            >
              {/* Destaque visual: Pill destacada (active pill) */}
              <div
                className={`w-14 h-10 flex items-center justify-center rounded-2xl transition-all duration-300 
                ${getActiveBgClass(item.path, index)}`} // Aplica a cor de fundo aqui
              >
                <span
                  className={`w-6 h-6 transition-colors duration-300 ${getIconClass(item.path)}`}
                >
                  {item.icon}
                </span>
              </div>
            </Link>
          );
        })}

        {/* Ícone para abrir o menu drawer (Mais Opções) */}
        <button
          onClick={handleOpenDrawer}
          className="flex flex-col items-center justify-center w-1/4 h-full group transition-colors cursor-pointer"
          title="Mais Opções"
        >
          <div
            className={`w-14 h-10 flex items-center justify-center rounded-2xl transition-all duration-300 bg-transparent group-hover:bg-gray-50`}
          >
            <span
              className={`w-6 h-6 text-gray-500 group-hover:text-indigo-600`}
            >
              {icons.menu}
            </span>
          </div>
        </button>
      </div>
    </nav>
  );
};
// --- FIM: Mobile Bottom Navigation Bar ---

export default function MainLayout({
  user,
  handleLogout,
  annualBudget,
  records,
  filterYear,
  setFilterYear,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef(null);

  // Estados
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile Drawer state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // Desktop Collapsed state (Começa recolhido)
  const [isProfileOpen, setIsProfileOpen] = useState(false); // Estado do Dropdown de Perfil
  const [isMouseOverSidebar, setIsMouseOverSidebar] = useState(false); // Estado de Hover

  const formattedDate = useFormattedDate();
  const { weather, error } = useWeather(-7.02, -36.5);
  const fixedLocationName = 'Parari, PB';

  const idleTimerRef = useRef(null);
  const collapseTimerRef = useRef(null);

  // --- LÓGICA DE AUTO-COLAPSO DA SIDEBAR (Desktop) ---
  const handleCollapseSidebar = useCallback(() => {
    if (!isMouseOverSidebar) {
      setIsSidebarCollapsed(true);
    }
  }, [isMouseOverSidebar]);

  const resetCollapseTimer = useCallback(() => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
    }
    // Define um tempo para recolher (e.g., 3 segundos)
    collapseTimerRef.current = setTimeout(handleCollapseSidebar, 3000);
  }, [handleCollapseSidebar]);

  const handleMouseEnter = () => {
    // Ao entrar, abre a sidebar e para o timer de recolhimento
    setIsMouseOverSidebar(true);
    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
    }
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
    }
  };

  const handleMouseLeave = () => {
    // Ao sair, ativa o timer de recolhimento
    setIsMouseOverSidebar(false);
    resetCollapseTimer();
  };

  useEffect(() => {
    // Inicia o timer de recolhimento no mount
    resetCollapseTimer();
    return () => {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
      }
    };
  }, [resetCollapseTimer]);
  // --- FIM LÓGICA DE AUTO-COLAPSO ---

  // --- LÓGICA DE TIMER DE INATIVIDADE (Mantida) ---
  const logoutOnIdle = useCallback(() => {
    handleLogout();
    navigate('/login');
  }, [handleLogout, navigate]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    const idleTimeout = 10 * 60 * 1000; // 10 minutos
    idleTimerRef.current = setTimeout(logoutOnIdle, idleTimeout);
  }, [logoutOnIdle]);

  useEffect(() => {
    const activityEvents = [
      'mousemove',
      'mousedown',
      'keypress',
      'touchstart',
      'scroll',
    ];
    resetIdleTimer();
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetIdleTimer);
    });
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [resetIdleTimer]);
  // --- FIM TIMER DE INATIVIDADE (Mantida) ---

  // --- LÓGICA DE MENUS (Mantida) ---
  const totalSpentForYear = useMemo(
    () =>
      (records || [])
        .filter((r) => new Date(r.entryDate).getFullYear() === filterYear)
        .reduce((sum, item) => sum + (Number(item.totalValue) || 0), 0),
    [records, filterYear]
  );
  const getRoleName = (role) => {
    const names = {
      profissional: 'Profissional',
      secretario: 'Secretário(a)',
      admin: 'Administrador(a)',
    };
    return names[role] || role;
  };

  const menuItems = useMemo(() => {
    const profissionalMenu = [
      { path: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
      {
        path: '/deliveries',
        label: 'Entregas Recentes',
        icon: icons.clipboard,
      },
      { path: '/history', label: 'Histórico Geral', icon: icons.history },
      { path: '/patients', label: 'Gerenciar Pacientes', icon: icons.users },
      { path: '/medications', label: 'Medicações', icon: icons.pill },
    ];

    const secretaryMenu = [
      { path: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
      {
        path: '/patient-history',
        label: 'Histórico por Paciente',
        icon: icons.history,
      },
      {
        path: '/reports-general',
        label: 'Relatórios Admin',
        icon: icons.clipboard,
      },
      { path: '/settings', label: 'Configurações', icon: icons.settings },
    ];

    const adminMenu = [
      { path: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
      {
        path: '/deliveries',
        label: 'Entregas Recentes',
        icon: icons.clipboard,
      },
      { path: '/history', label: 'Histórico Geral', icon: icons.history },
      { path: '/patients', label: 'Gerenciar Pacientes', icon: icons.users },
      { path: '/medications', label: 'Gerenciar Medicações', icon: icons.pill },
      { path: '/reports', label: 'Relatórios Admin', icon: icons.reports },
      { path: '/settings', label: 'Configurações', icon: icons.settings },
    ];

    switch (user?.role) {
      case 'admin':
        return adminMenu;
      case 'secretario':
        return secretaryMenu;
      case 'profissional':
      case 'professional':
      case 'Profissional':
        return profissionalMenu;
      default:
        console.error('Cargo (Role) de usuário desconhecido:', user?.role);
        return [];
    }
  }, [user?.role]);
  // --- FIM LÓGICA DE MENUS (Mantida) ---

  // --- Efeitos de Fechar Dropdown (Mantidos) ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileRef]);

  const handleLogoutClick = () => {
    setIsProfileOpen(false);
    handleLogout();
    navigate('/login');
  };

  const handleLinkClick = () => {
    // Fecha o drawer mobile após clicar em um link
    setIsSidebarOpen(false);
  };
  // --- FIM Efeitos ---

  return (
    // Adicionado padding-bottom no mobile para compensar a barra de navegação fixa
    <div className="relative min-h-screen md:h-screen md:flex md:overflow-hidden bg-gray-100 pb-16 md:pb-0">
      {/* 1. OVERLAY (para Mobile Drawer) */}
      {isSidebarOpen && (
        <div
          // Fundo com blur e sobreposição escura
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 2. SIDEBAR (Desktop Minimalista / Mobile Drawer) */}
      <aside
        className={`
          // Base styles
          fixed inset-y-0 left-0 flex-shrink-0 flex-col z-50 
          bg-slate-900 shadow-2xl transition-all duration-300 ease-in-out
          
          // Desktop Visibility and Width
          hidden md:flex md:static md:translate-x-0 
          ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
          
          // Mobile Drawer Logic (Overrides hidden, only when open)
          ${isSidebarOpen ? 'w-11/12 max-w-xs translate-x-0 flex' : 'hidden -translate-x-full'}
          
        `}
        aria-label="Menu Principal"
        // Eventos de Mouse para Auto-colapso
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header da Sidebar */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center h-16">
          <div
            className={`overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'md:w-0' : 'md:w-auto'}`}
          >
            <h1 className="text-2xl font-bold text-white whitespace-nowrap">
              Medlogs
            </h1>
            <p className="text-sm text-slate-400 hidden md:block whitespace-nowrap">
              Painel de {getRoleName(user?.role)}
            </p>
          </div>

          {/* Botão de Toggle Sidebar (Desktop) */}
          <button
            className="hidden md:block text-slate-400 hover:text-white p-1 transition-colors"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            aria-label={isSidebarCollapsed ? 'Expandir menu' : 'Retrair menu'}
          >
            <span className="w-5 h-5">
              {isSidebarCollapsed ? icons.chevronRight : icons.chevronLeft}
            </span>
          </button>

          {/* Botão de Fechar (Mobile) */}
          <button
            className="md:hidden text-slate-400 hover:text-white p-1 transition-colors"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Fechar menu"
          >
            <span className="w-6 h-6">{icons.close}</span>
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-grow p-4 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleLinkClick} // Fecha o drawer no mobile
                title={isSidebarCollapsed ? item.label : undefined}
                className={`relative w-full text-left p-3 rounded-xl text-sm transition-all duration-300 mb-2 flex items-center 
                          ${isSidebarCollapsed ? 'md:justify-center' : 'md:justify-start'}
                          ${
                            isActive
                              ? // Estado ativo: cor índigo e shadow interna para efeito de profundidade
                                'bg-indigo-600 text-white font-semibold shadow-inner shadow-indigo-800/50'
                              : // Estado hover: Brilho/blur suave
                                'text-slate-300 hover:bg-indigo-700/50 hover:text-white group hover:shadow-lg hover:shadow-indigo-500/10'
                          }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span
                  className={`w-5 h-5 flex-shrink-0 text-lg transition-transform ${isSidebarCollapsed ? 'md:mx-auto' : 'md:mr-4'}`}
                >
                  {item.icon}
                </span>
                <span
                  className={`transition-opacity whitespace-nowrap overflow-hidden duration-300 ${isSidebarCollapsed ? 'md:opacity-0 md:w-0' : 'md:opacity-100 md:w-auto'}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700"></div>
      </aside>
      {/* --- FIM: SIDEBAR --- */}

      {/* --- CONTEÚDO PRINCIPAL E HEADER --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center flex-shrink-0 z-10 h-16">
          {/* Lado Esquerdo (Clima e Botão Mobile) */}
          <div className="flex items-center gap-4">
            {/* Botão para abrir o Drawer (visível apenas no mobile) */}
            <button
              className="text-gray-600 hover:text-gray-900 md:hidden p-1 transition-colors cursor-pointer"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Abrir menu lateral"
            >
              <span className="w-6 h-6">{icons.menu}</span>
            </button>

            <div className="hidden md:flex items-center gap-3">
              {' '}
              {/* Oculta o clima no mobile */}
              {/* Mantido: Lógica do clima */}
              <div className="flex items-center gap-1">
                {weather && weather.IconComponent ? (
                  <span
                    className="text-3xl text-indigo-500"
                    title={weather.description}
                  >
                    <weather.IconComponent />
                  </span>
                ) : (
                  <span className="w-8 h-8 flex items-center justify-center text-gray-400">
                    <WiCloud />
                  </span>
                )}
                <div className="text-left">
                  <p className="text-base font-bold text-gray-800 leading-tight">
                    {weather ? `${weather.temp}°C` : '...'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize leading-tight">
                    {error ? error : weather ? weather.description : '...'}
                  </p>
                </div>
              </div>
              <div className="h-8 w-px bg-gray-200"></div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-800 leading-tight">
                  {formattedDate || 'Carregando data...'}
                </p>
                <p className="text-xs text-gray-500 leading-tight">
                  {fixedLocationName}
                </p>
              </div>
            </div>
          </div>

         
          <div className="flex items-center gap-4 md:gap-6">
            {(user?.role === 'admin' || user?.role === 'secretario') && (
              <div className="hidden sm:flex items-center gap-4 border-r border-gray-200 pr-4 md:pr-6">
                <AnnualBudgetChart
                  key={annualBudget}
                  totalSpent={totalSpentForYear}
                  budgetLimit={annualBudget}
                />
                <div className="flex items-center">
                  <label className="text-xs font-medium text-gray-700 mr-2 hidden md:inline">
                    Ano:
                  </label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(parseInt(e.target.value))}
                    className="p-1 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    aria-label="Selecionar Ano para Filtro"
                  >
                    {[...Array(2)].map((_, i) => {
                      const year = new Date().getFullYear() + 1 - i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            )}

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 rounded-full hover:bg-gray-100 p-1 cursor-pointer"
              >
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl">
                  {icons.userCircle}
                </span>
                <span className="hidden md:block font-semibold">
                  {formatUserName(user?.name)}
                </span>
                <span
                  className={`transition-transform text-gray-500 w-5 h-5 ${isProfileOpen ? 'rotate-180' : ''}`}
                >
                  {icons.chevronDown}
                </span>
              </button>
              {/* Menu Dropdown - Lógica mantida */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-100">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <span className="w-5 h-5">{icons.user}</span>
                    <span>Meu Perfil</span>
                  </Link>
                  {(user?.role === 'admin' || user?.role === 'secretario') && (
                    <Link
                      to="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <span className="w-5 h-5">{icons.organization}</span>
                      <span>Configuração</span>
                    </Link>
                  )}
                  {(user?.role === 'admin' ||
                    user?.role === 'profissional' ||
                    user?.role === 'Profissional') && (
                    <Link
                      to="/medications"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <span className="w-5 h-5">{icons.pill}</span>
                      <span>Gerenciar Medicações</span>
                    </Link>
                  )}
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={handleLogoutClick}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <span className="w-5 h-5">{icons.logout}</span>
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* --- CONTEÚDO (Rola) --- */}
        <main className="flex-grow p-4 md:p-6 overflow-auto bg-gray-100">
          <Outlet />
        </main>
      </div>

      {/* 3. BARRA DE NAVEGAÇÃO INFERIOR (MOBILE) */}
      <MobileBottomNav
        menuItems={menuItems}
        location={location}
        handleOpenDrawer={() => setIsSidebarOpen(true)} // Abre o Drawer
      />
    </div>
  );
}
