// src/layouts/MainLayout.jsx

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
import LGPDBanner from '../components/common/LGPDBanner';
import OfflineAlert from '../components/common/OfflineAlert';

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

// --- Mobile Bottom Navigation ---
const MobileBottomNav = ({ menuItems, location, handleOpenDrawer }) => {
  const primaryItems = menuItems.slice(0, 4);
  
  const isCurrentPathActive = (path) =>
    location.pathname === path ||
    (path !== '/' && location.pathname.startsWith(path));

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 h-20 z-50 md:hidden pb-safe transition-all duration-300
                 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl backdrop-saturate-200
                 border-t border-gray-200 dark:border-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]"
      aria-label="Navegação móvel"
    >
      <div className="flex justify-around items-center h-full max-w-lg mx-auto px-2">
        {primaryItems.map((item) => {
          const isActive = isCurrentPathActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-14 rounded-2xl group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95 transition-all duration-200
                ${isActive ? 'bg-indigo-50 dark:bg-indigo-500/20' : 'hover:bg-gray-100 dark:hover:bg-slate-800'}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={`text-2xl mb-0.5 transition-colors duration-200 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {item.icon}
              </span>
              <span className={`text-[10px] font-bold transition-colors duration-200 ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>
                 {item.label}
              </span>
            </Link>
          );
        })}

        <button
          onClick={handleOpenDrawer}
          className="flex flex-col items-center justify-center w-full h-14 rounded-2xl group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-slate-800"
          aria-label="Abrir menu lateral"
        >
          <span className="text-2xl mb-0.5 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {icons.menu}
          </span>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
            Menu
          </span>
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

  // --- Auto-Colapso ---
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

  // --- Timer de Inatividade ---
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

  // --- Menus por Role ---
  const getRoleName = (role) => {
    const names = {
      profissional: 'Profissional',
      secretario: 'Secretaria',
      admin: 'Administrador',
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

  // --- Efeitos ---
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
    <div className="relative min-h-screen md:h-screen md:flex md:overflow-hidden bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <OfflineAlert />
      {/* Overlay Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-white/20 dark:bg-slate-900/40 backdrop-blur-md z-[55] md:hidden transition-all duration-500 ease-in-out"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR (Desktop & Drawer Mobile) */}
      <aside
        className={`
          fixed inset-y-0 left-0 flex-shrink-0 flex-col z-[60] 
          bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl backdrop-saturate-150 
          border-r border-gray-200 dark:border-slate-800
          shadow-2xl md:shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
          md:flex md:static 
          ${isSidebarCollapsed ? 'md:w-[72px]' : 'md:w-72'}
          ${isSidebarOpen 
            ? 'flex translate-x-0 w-[85vw] max-w-xs' 
            : 'hidden md:flex -translate-x-full md:translate-x-0'}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label="Menu Principal"
      >
        {/* Header da Sidebar */}
        <div className="flex-shrink-0 flex items-center h-20 px-4 border-b border-gray-100 dark:border-slate-800">
          <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'md:w-0 opacity-0' : 'md:w-auto opacity-100'}`}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0">
               <span className="font-bold text-lg tracking-tight">M</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap tracking-tight">
              MedLogs
            </h1>
          </div>

          <div className={`${isSidebarCollapsed ? 'w-full flex justify-center' : 'ml-auto'}`}>
             <button
              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              aria-label={isSidebarCollapsed ? "Expandir menu" : "Colapsar menu"}
            >
              <span className="w-5 h-5 block">
                {isSidebarCollapsed ? icons.chevronRight : icons.chevronLeft}
              </span>
            </button>
          </div>
          
          <button
            className="md:hidden ml-auto text-slate-400 hover:text-slate-600 p-2 rounded-lg active:scale-90 transition-transform"
            onClick={() => setIsSidebarOpen(false)}
          >
            <span className="w-6 h-6">{icons.close}</span>
          </button>
        </div>

        {/* Links de Navegação */}
        <nav className="flex-grow p-4 overflow-y-auto overflow-x-hidden space-y-1.5 custom-scrollbar">
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
                className={`relative group w-full flex items-center p-3.5 rounded-xl text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.98]
                          ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}
                          ${
                            isActive
                              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-sm ring-1 ring-indigo-500/10'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
              >
                {isActive && (
                   <div className="absolute left-0.5 top-3 bottom-3 w-1 bg-indigo-600 rounded-full" />
                )}

                <span
                  className={`w-6 h-6 flex-shrink-0 text-xl transition-all duration-300 
                    ${isActive ? 'text-indigo-600 dark:text-indigo-400 scale-110' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}
                    ${isSidebarCollapsed ? '' : 'mr-3.5'}
                  `}
                >
                  {item.icon}
                </span>
                
                <span
                  className={`whitespace-nowrap overflow-hidden transition-all duration-300 font-medium
                  ${isSidebarCollapsed ? 'md:w-0 md:opacity-0 hidden' : 'md:w-auto md:opacity-100 block'}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
        
        {/* Footer Sidebar */}
        {!isSidebarCollapsed && (
            <div className="p-5 border-t border-gray-100 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-600 text-center uppercase tracking-widest">
                MedLogs System
            </div>
        )}
      </aside>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        
        {/* HEADER */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 px-4 md:px-8 flex justify-between items-center h-16 md:h-20 transition-colors duration-300">
          
          {/* Esquerda: Mobile Toggle + Contexto */}
          <div className="flex items-center gap-4">
            <button
              className="text-slate-500 dark:text-slate-400 md:hidden p-2 -ml-2 rounded-xl active:bg-gray-100 dark:active:bg-slate-800 transition-colors active:scale-95"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <span className="w-7 h-7 block">{icons.menu}</span>
            </button>

            <div className="hidden md:flex flex-col">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight tracking-tight">
                {fixedLocationName}
              </h2>
              <div className="flex items-center gap-2.5 mt-0.5">
                <div className="flex items-center text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-md">
                    <span className="text-lg mr-1.5">{weather?.IconComponent && <weather.IconComponent />}</span>
                    <span className="text-sm font-bold">{weather ? `${weather.temp}°C` : '--'}</span>
                </div>
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {formattedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Direita: Ações + Perfil */}
          <div className="flex items-center gap-3 md:gap-5">
            
            {/* Seletor de Ano - Visível em Mobile e Desktop */}
            {(user?.role === 'admin' || user?.role === 'secretario') && (
              <div className="block mr-1 md:mr-0">
                <div className="relative group">
                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(parseInt(e.target.value))}
                      className="appearance-none cursor-pointer bg-gray-100/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-24 md:w-28 py-2 pl-3 md:pl-3.5 pr-7 md:pr-8 transition-all outline-none shadow-sm"
                      aria-label="Filtrar por ano"
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
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                </div>
              </div>
            )}

            {/* Perfil Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100/80 dark:hover:bg-slate-800/50 transition-all cursor-pointer border border-transparent focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none active:scale-95"
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center text-sm font-bold shadow-md ring-2 ring-white dark:ring-slate-800">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden md:flex flex-col items-start text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-200 leading-none mb-1">{formatUserName(user?.name)}</span>
                    <span className="text-slate-500 dark:text-slate-400 font-medium px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">{getRoleName(user?.role)}</span>
                </div>
                <span
                  className={`hidden md:block transition-transform duration-300 text-slate-400 w-4 h-4 ${isProfileOpen ? 'rotate-180' : ''}`}
                >
                  {icons.chevronDown}
                </span>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl py-2 z-50 border border-gray-100 dark:border-slate-800 ring-1 ring-black/5 animate-in fade-in slide-in-from-top-3 duration-200 origin-top-right">
                  <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {user?.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1 font-medium">
                      {user?.email}
                    </p>
                  </div>
                  
                  <div className="py-2 px-2">
                    <Link
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors group"
                    >
                        <span className="w-5 h-5 text-slate-400 group-hover:text-indigo-500">{icons.user}</span>
                        <span>Perfil do Usuário</span>
                    </Link>
                    {(user?.role === 'admin' || user?.role === 'secretario') && (
                        <Link
                        to="/settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors group"
                        >
                        <span className="w-5 h-5 text-slate-400 group-hover:text-indigo-500">{icons.settings}</span>
                        <span>Ajustes do Sistema</span>
                        </Link>
                    )}
                  </div>

                  <div className="border-t border-gray-100 dark:border-slate-800 my-1 mx-2"></div>
                  
                  <div className="px-2 pb-2">
                    <button
                        onClick={handleLogoutClick}
                        className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3 transition-colors cursor-pointer"
                    >
                        <span className="w-5 h-5">{icons.logout}</span>
                        <span>Sair da Conta</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-grow p-4 md:p-8 overflow-auto scroll-smooth">
           <div className="max-w-7xl mx-auto w-full h-full pb-20 md:pb-0">
               <Outlet context={{ filterYear, records, annualBudget, user }} />
           </div>
        </main>
      </div>

      <MobileBottomNav
        menuItems={menuItems}
        location={location}
        handleOpenDrawer={() => setIsSidebarOpen(true)}
      />

      <LGPDBanner />
      
    </div>
  );
}