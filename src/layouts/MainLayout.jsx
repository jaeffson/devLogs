// src/layouts/MainLayout.jsx
// (CORRIGIDO: Passando filterYear e dados via context para o Outlet)

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
import { formatUserName } from '../utils/helpers';
import { icons } from '../utils/icons';

// --- Helpers de Clima e Data ---
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
    const options = { day: 'numeric', month: 'long' }; 
    const dateStr = new Intl.DateTimeFormat('pt-BR', options).format(today);
    setFormattedDate(dateStr);
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
        setError('Indisponível');
      }
    };
    fetchWeather();
    const intervalId = setInterval(fetchWeather, 1800000);
    return () => clearInterval(intervalId);
  }, [latitude, longitude]);
  return { weather, error };
}

// --- Mobile Bottom Navigation Bar ---
const MobileBottomNav = ({ menuItems, location, handleOpenDrawer }) => {
  const primaryItems = menuItems.slice(0, 4);
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
    return isActive ? baseColor : 'bg-transparent group-hover:bg-gray-50';
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white z-50 md:hidden shadow-2xl rounded-t-2xl overflow-hidden">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto">
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
              <div
                className={`w-14 h-10 flex items-center justify-center rounded-2xl transition-all duration-300 
                ${getActiveBgClass(item.path, index)}`}
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMouseOverSidebar, setIsMouseOverSidebar] = useState(false);

  const formattedDate = useFormattedDate();
  const { weather } = useWeather(-7.02, -36.5);
  const fixedLocationName = 'Parari, PB';

  const idleTimerRef = useRef(null);
  const collapseTimerRef = useRef(null);

  // --- LÓGICA DE AUTO-COLAPSO (Desktop) ---
  const handleCollapseSidebar = useCallback(() => {
    if (!isMouseOverSidebar) {
      setIsSidebarCollapsed(true);
    }
  }, [isMouseOverSidebar]);

  const resetCollapseTimer = useCallback(() => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
    }
    collapseTimerRef.current = setTimeout(handleCollapseSidebar, 3000);
  }, [handleCollapseSidebar]);

  const handleMouseEnter = () => {
    setIsMouseOverSidebar(true);
    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
    }
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsMouseOverSidebar(false);
    resetCollapseTimer();
  };

  useEffect(() => {
    resetCollapseTimer();
    return () => {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
      }
    };
  }, [resetCollapseTimer]);

  // --- LÓGICA DE TIMER DE INATIVIDADE ---
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

  // --- LÓGICA DE MENUS ---
  const getRoleName = (role) => {
    const names = {
      profissional: 'Profissional',
      secretario: 'Secretaria',
      admin: 'Admin',
    };
    return names[role] || role;
  };

  const menuItems = useMemo(() => {
    const profissionalMenu = [
      { path: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
      { path: '/deliveries', label: 'Entregas', icon: icons.clipboard },
      { path: '/history', label: 'Histórico', icon: icons.history },
      { path: '/patients', label: 'Pacientes', icon: icons.users },
      { path: '/medications', label: 'Medicações', icon: icons.pill },
    ];

    const secretaryMenu = [
      { path: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
      { path: '/patient-history', label: 'Histórico', icon: icons.history },
      { path: '/reports-general', label: 'Relatórios', icon: icons.clipboard },
      { path: '/settings', label: 'Ajustes', icon: icons.settings },
    ];

    const adminMenu = [
      { path: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
      { path: '/deliveries', label: 'Entregas', icon: icons.clipboard },
      { path: '/history', label: 'Histórico', icon: icons.history },
      { path: '/patients', label: 'Pacientes', icon: icons.users },
      { path: '/medications', label: 'Medicações', icon: icons.pill },
      { path: '/reports', label: 'Relatórios', icon: icons.reports },
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
        return [];
    }
  }, [user?.role]);

  // --- Efeitos de Fechar Dropdown ---
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
    setIsSidebarOpen(false);
  };

  return (
    <div className="relative min-h-screen md:h-screen md:flex md:overflow-hidden bg-gray-100 pb-16 md:pb-0">
      {/* 1. OVERLAY Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 2. SIDEBAR */}
      <aside
        className={`
          fixed inset-y-0 left-0 flex-shrink-0 flex-col z-50 
          bg-slate-900 shadow-2xl transition-all duration-300 ease-in-out
          hidden md:flex md:static md:translate-x-0 
          ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
          ${isSidebarOpen ? 'w-11/12 max-w-xs translate-x-0 flex' : 'hidden -translate-x-full'}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="p-4 border-b border-slate-700 flex justify-between items-center h-16">
          <div
            className={`overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'md:w-0' : 'md:w-auto'}`}
          >
            <h1 className="text-2xl font-bold text-white whitespace-nowrap">
              Medlogs
            </h1>
          </div>

          <button
            className="hidden md:block text-slate-400 hover:text-white p-1 transition-colors"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            <span className="w-5 h-5">
              {isSidebarCollapsed ? icons.chevronRight : icons.chevronLeft}
            </span>
          </button>

          <button
            className="md:hidden text-slate-400 hover:text-white p-1 transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <span className="w-6 h-6">{icons.close}</span>
          </button>
        </div>

        <nav className="flex-grow p-4 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`relative w-full text-left p-3 rounded-xl text-sm transition-all duration-300 mb-2 flex items-center 
                          ${isSidebarCollapsed ? 'md:justify-center' : 'md:justify-start'}
                          ${
                            isActive
                              ? 'bg-indigo-600 text-white font-semibold shadow-inner shadow-indigo-800/50'
                              : 'text-slate-300 hover:bg-indigo-700/50 hover:text-white group hover:shadow-lg hover:shadow-indigo-500/10'
                          }`}
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
      </aside>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER ATUALIZADO */}
        <header className="bg-white shadow-sm px-6 flex justify-between items-center flex-shrink-0 z-10 h-16">
          
          {/* Lado Esquerdo: Toggle Mobile + Cidade/Data Limpo */}
          <div className="flex items-center gap-4">
            <button
              className="text-gray-600 hover:text-gray-900 md:hidden p-1 cursor-pointer"
              onClick={() => setIsSidebarOpen(true)}
            >
              <span className="w-6 h-6">{icons.menu}</span>
            </button>

            <div className="hidden md:flex flex-col justify-center">
              <h2 className="text-base font-bold text-gray-800 leading-none">
                {fixedLocationName}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                   {weather ? `${weather.temp}°C` : '--'}
                </span>
                <span className="text-xs text-gray-500 capitalize">
                  {formattedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Lado Direito: Seletor de Ano + Perfil */}
          <div className="flex items-center gap-4 md:gap-6">
            
            {/* Seletor de Ano Moderno */}
            {(user?.role === 'admin' || user?.role === 'secretario') && (
              <div className="hidden sm:flex items-center">
                <div className="relative group">
                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(parseInt(e.target.value))}
                      className="appearance-none cursor-pointer bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-24 p-2 pl-3 transition-colors outline-none"
                    >
                      {[...Array(2)].map((_, i) => {
                        const year = new Date().getFullYear() + 1 - i;
                        return (
                          <option key={year} value={year}>
                            Ano {year}
                          </option>
                        );
                      })}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                </div>
              </div>
            )}

            {/* Dropdown de Perfil */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 text-sm font-medium text-gray-700 rounded-full hover:bg-gray-50 p-1 pr-2 transition-colors cursor-pointer border border-transparent hover:border-gray-200"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden md:flex flex-col items-start text-xs">
                    <span className="font-bold text-gray-800 leading-none mb-0.5">{formatUserName(user?.name)}</span>
                    <span className="text-gray-500 font-normal">{getRoleName(user?.role)}</span>
                </div>
                <span
                  className={`hidden md:block transition-transform text-gray-400 w-4 h-4 ${isProfileOpen ? 'rotate-180' : ''}`}
                >
                  {icons.chevronDown}
                </span>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100 ring-1 ring-black ring-opacity-5">
                  <div className="px-4 py-3 border-b border-gray-50">
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
                    className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span className="w-4 h-4">{icons.user}</span>
                    <span>Perfil</span>
                  </Link>
                  {(user?.role === 'admin' || user?.role === 'secretario') && (
                    <Link
                      to="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span className="w-4 h-4">{icons.settings}</span>
                      <span>Ajustes</span>
                    </Link>
                  )}
                  <div className="border-t border-gray-50 my-1"></div>
                  <button
                    onClick={handleLogoutClick}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <span className="w-4 h-4">{icons.logout}</span>
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-grow p-4 md:p-6 overflow-auto bg-gray-50/50">
          {/* AQUI ESTAVA O PROBLEMA: Agora passamos o contexto para os filhos */}
          <Outlet context={{ filterYear, records, annualBudget, user }} />
        </main>
      </div>

      <MobileBottomNav
        menuItems={menuItems}
        location={location}
        handleOpenDrawer={() => setIsSidebarOpen(true)}
      />
    </div>
  );
}