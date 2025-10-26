// (NOVO) Adicione 'useCallback' aos seus imports do React
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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

// --- Helpers de Clima e Data (Sem mudanças) ---
function getWeatherInfo(code, isDay = true) {
  const weatherMap = {
    0: { text: 'Céu limpo', icon: isDay ? WiDaySunny : WiNightClear },
    1: { text: 'Quase limpo', icon: isDay ? WiDaySunny : WiNightClear },
    2: { text: 'Parcialmente nublado', icon: isDay ? WiDayCloudy : WiNightCloudy },
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
    81: { text: 'Pancadas moderadas', icon: isDay ? WiShowers : WiNightShowers },
    82: { text: 'Pancadas fortes', icon: isDay ? WiRain : WiNightRain },
    95: { text: 'Trovoada', icon: isDay ? WiDayThunderstorm : WiNightThunderstorm },
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
// --- Fim dos Helpers ---

export default function MainLayout({
  user,
  handleLogout,
  annualBudget,
  records,
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const formattedDate = useFormattedDate();
  const { weather, error } = useWeather(-7.02, -36.5);
  const fixedLocationName = 'Parari, PB';

  const profileRef = useRef(null);
  const navigate = useNavigate();

  // ==============================================================
  // --- (INÍCIO) LÓGICA DO TIMER DE INATIVIDADE ---
  // ==============================================================

  // (NOVO) Usamos 'useRef' para guardar a ID do timer sem causar re-renderizações
  const idleTimerRef = useRef(null);

  // (NOVO) Função que será chamada quando o tempo esgotar
  // Usamos 'useCallback' para garantir que a função não seja recriada
  const logoutOnIdle = useCallback(() => {
    // (Opcional) Você pode adicionar um Toast aqui para avisar o usuário
    // Ex: addToast('Você foi desconectado por inatividade.', 'info');
    
    // Chama a função de logout que veio do App.jsx
    handleLogout();
    
    // Força o redirecionamento para a tela de login
    navigate('/login');
  }, [handleLogout, navigate]);


  // (NOVO) Função que reseta o timer
  const resetIdleTimer = useCallback(() => {
    // Limpa o timer anterior (se existir)
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    // (CUSTOMIZE AQUI) Define o tempo de 10 minutos
    const idleTimeout = 10 * 60 * 1000; // 10 minutos * 60 segundos * 1000 ms

    // Cria um novo timer
    idleTimerRef.current = setTimeout(logoutOnIdle, idleTimeout);
  }, [logoutOnIdle]);


  // (NOVO) 'useEffect' para adicionar e remover os "ouvintes" de atividade
  useEffect(() => {
    // Lista de eventos que contam como "atividade"
    const activityEvents = [
      'mousemove',  // Movimento do mouse
      'mousedown',  // Clique do mouse
      'keypress',   // Tecla pressionada
      'touchstart', // Toque na tela (mobile)
      'scroll',     // Scroll
    ];

    // Inicia o timer quando o layout é carregado
    resetIdleTimer();

    // Adiciona um "ouvinte" para cada evento de atividade
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetIdleTimer);
    });

    // Função de "limpeza": será executada quando o componente for desmontado
    return () => {
      // Limpa o timer
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      // Remove todos os "ouvintes" para evitar vazamento de memória
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [resetIdleTimer]); // A dependência é o 'resetIdleTimer'

  // ==============================================================
  // --- (FIM) LÓGICA DO TIMER DE INATIVIDADE ---
  // ==============================================================


  // (Lógica de cálculo e getRoleName - sem mudanças)
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

  // (Definição dos menus - sem mudanças)
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

    switch (user?.role) {
      case 'admin':
        return adminMenu;
      case 'secretario':
        return secretaryMenu;
      case 'profissional':
        return professionalMenu;
      default:
        return [];
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileRef]);

  // (Função de logout - sem mudanças)
  const handleLogoutClick = () => {
    setIsProfileOpen(false);
    handleLogout();
    navigate('/login');
  };

  return (
    <div className="relative min-h-screen md:h-screen md:flex md:overflow-hidden bg-gray-100">
      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* --- SIDEBAR (Sem mudanças) --- */}
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
          <div
            className={`overflow-hidden transition-all ${isSidebarCollapsed ? 'md:w-0' : 'md:w-auto'}`}
          >
            <h1 className="text-2xl font-bold text-indigo-700 whitespace-nowrap">
              SysMed
            </h1>
            <p className="text-sm text-gray-500 hidden md:block whitespace-nowrap">
              Painel de {getRoleName(user?.role)}
            </p>
          </div>
          <button
            className="md:hidden text-gray-500 hover:text-gray-900 p-1"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Fechar menu"
          >
            <span className="w-6 h-6">{icons.close}</span>
          </button>
          <button
            className="hidden md:block text-gray-500 hover:text-indigo-600 p-1 transition-colors"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            aria-label={
              isSidebarCollapsed ? 'Expandir menu' : 'Retrair menu'
            }
          >
            <span className="w-5 h-5">
              {isSidebarCollapsed ? icons.chevronRight : icons.chevronLeft}
            </span>
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
                onClick={() => setIsSidebarOpen(false)}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`relative w-full text-left p-3 rounded-lg text-sm font-medium transition-all duration-150 mb-2 flex items-center gap-4
                          ${isSidebarCollapsed ? 'md:justify-center' : ''}
                          ${
                            isActive
                              ? 'bg-indigo-50 text-indigo-700 font-semibold'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-indigo-600 rounded-r-full"></span>
                )}
                <span className="w-5 h-5 flex-shrink-0 text-lg">
                  {item.icon}
                </span>
                <span
                  className={`transition-opacity whitespace-nowrap ${isSidebarCollapsed ? 'md:opacity-0 md:hidden' : 'md:opacity-100'}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t"></div>
      </aside>

      {/* --- CONTEÚDO PRINCIPAL E HEADER (Sem mudanças) --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center flex-shrink-0 z-10 h-16">
          {/* Lado Esquerdo (Clima) */}
          <div className="flex items-center gap-4">
            <button
              className="text-gray-600 hover:text-gray-900 md:hidden p-1"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <span className="w-6 h-6">{icons.menu}</span>
            </button>
            <div className="hidden md:flex items-center gap-3">
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
                    {error
                      ? error
                      : weather
                        ? weather.description
                        : '...'}
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

          {/* Lado Direito (Perfil, etc) */}
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
                    onChange={(e) => setFilterYear(parseInt(e.targe.value))}
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
            {/* Dropdown de Perfil */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 rounded-full hover:bg-gray-100 p-1"
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
              {/* Menu Dropdown */}
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
                    user?.role === 'profissional') && (
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

        {/* --- CONTEÚDO (Rola) --- */}
        <main className="flex-grow p-4 md:p-6 overflow-auto bg-gray-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
}