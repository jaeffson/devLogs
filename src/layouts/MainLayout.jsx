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
  Package,
  LayoutDashboard,
  History,
  Users,
  Pill,
  ClipboardCheck,
  Settings,
  FileBarChart,
  CheckSquare,
  LogOut,
  User as UserIcon,
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bell,
} from 'lucide-react';
import {
  WiDaySunny,
  WiDayCloudy,
  WiCloudy,
  WiDayFog,
  WiDayRain,
  WiDayShowers,
  WiDayThunderstorm,
  WiDaySnow,
  WiNightClear,
  WiNightCloudy,
  WiNightRain,
  WiNightShowers,
  WiNightThunderstorm,
  WiNightFog,
  WiNightSnow,
  WiCloud,
} from 'react-icons/wi';

import { formatUserName } from '../utils/helpers';
import { icons } from '../utils/icons';
import LGPDBanner from '../components/common/LGPDBanner';
import OfflineAlert from '../components/common/OfflineAlert';

// NOVO: Importando o nosso cérebro de notificações
import { useSystemAlerts } from '../hooks/useSystemAlerts';

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
  };
  return weatherMap[code] || { text: 'Indefinido', icon: WiCloud };
}

export default function MainLayout({
  user,
  handleLogout,
  annualBudget,
  records,
  shipments,
  patients, // <-- ADICIONADO: Precisamos dos pacientes para calcular atrasos
  filterYear,
  setFilterYear,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  // Referências para fechar os menus ao clicar fora
  const profileRef = useRef(null);
  const alertsRef = useRef(null);

  // Estados de Interface
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false); // <-- NOVO: Estado do Painel de Alertas
  const [isMouseOverSidebar, setIsMouseOverSidebar] = useState(false);

  // NOVO: Inicializa o Hook de Alertas Inteligentes
  const { alerts, unreadCount } = useSystemAlerts({
    user,
    patients,
    records,
    shipments,
  });

  // Efeito para fechar os modais/dropdowns se o usuário clicar fora deles
  useEffect(() => {
    function handleClickOutside(event) {
      if (alertsRef.current && !alertsRef.current.contains(event.target)) {
        setIsAlertsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = useMemo(() => {
    const common = [
      {
        path: '/dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard size={22} />,
      },
    ];

    const professional = [
      ...common,
      { path: '/patients', label: 'Pacientes', icon: <Users size={22} /> },
      {
        path: '/deliveries',
        label: 'Entregas',
        icon: <ClipboardCheck size={22} />,
      },
      { path: '/history', label: 'Histórico', icon: <History size={22} /> },
      { path: '/medications', label: 'Medicações', icon: <Pill size={22} /> },
      {
        path: '/conferencia',
        label: 'Conferência',
        icon: <CheckSquare size={22} />,
      },
    ];

    const secretary = [
      ...common,
      {
        path: '/shipments',
        label: 'Gestão de Remessas',
        icon: <Package size={22} />,
      },
      {
        path: '/reports-general',
        label: 'Relatórios Operacionais',
        icon: <FileBarChart size={22} />,
      },
      {
        path: '/patient-history',
        label: 'Base de Usuários',
        icon: <Users size={22} />,
      },
      { path: '/settings', label: 'Ajustes', icon: <Settings size={22} /> },
    ];

    const admin = [
      ...common,
      { path: '/shipments', label: 'Remessas', icon: <Package size={22} /> },
      { path: '/patients', label: 'Pacientes', icon: <Users size={22} /> },
      { path: '/medications', label: 'Medicações', icon: <Pill size={22} /> },
      {
        path: '/history',
        label: 'Histórico Geral',
        icon: <History size={22} />,
      },
      {
        path: '/reports',
        label: 'Business Intelligence',
        icon: <FileBarChart size={22} />,
      },
      {
        path: '/settings',
        label: 'Configurações',
        icon: <Settings size={22} />,
      },
    ];

    if (user?.role === 'admin') return admin;
    if (user?.role === 'secretario') return secretary;
    return professional;
  }, [user?.role]);

  const handleMouseEnter = () => {
    setIsMouseOverSidebar(true);
    setIsSidebarCollapsed(false);
  };
  const handleMouseLeave = () => {
    setIsMouseOverSidebar(false);
    setIsSidebarCollapsed(true);
  };

  const handleLogoutClick = () => {
    setIsProfileOpen(false);
    handleLogout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-500 font-sans">
      <OfflineAlert />

      {/* ============================================== */}
      {/* SIDEBAR (Barra Lateral)                          */}
      {/* ============================================== */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed inset-y-0 left-0 z-[60] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-500 ease-in-out shadow-2xl md:shadow-none md:translate-x-0 ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full md:w-20'} ${!isSidebarCollapsed && 'md:w-72'}`}
      >
        <div className="h-20 flex items-center px-6 border-b border-slate-50 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200 shrink-0">
            <Package size={22} />
          </div>
          <span
            className={`ml-4 text-xl font-black text-slate-800 dark:text-white tracking-tight transition-opacity duration-300 ${isSidebarCollapsed && 'md:opacity-0'}`}
          >
            MedLogs<span className="text-indigo-600">.</span>
          </span>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto custom-scrollbar h-[calc(100%-160px)]">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center p-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-100 dark:ring-indigo-900' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <div
                  className={`shrink-0 ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-200`}
                >
                  {item.icon}
                </div>
                <span
                  className={`ml-4 font-bold text-sm whitespace-nowrap transition-opacity duration-300 ${isSidebarCollapsed && 'md:opacity-0'}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {!isSidebarCollapsed && (
          <div className="absolute bottom-6 left-6 right-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in duration-300">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Unidade
            </p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Parari, PB
            </p>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 uppercase tracking-wider">
              By <span className="text-indigo-500">Js Sistemas</span>
            </p>
          </div>
        )}
      </aside>

      {/* ============================================== */}
      {/* ÁREA PRINCIPAL DA TELA (Conteúdo)                */}
      {/* ============================================== */}
      {/* MÁGICA DO "PUSH" ACONTECE AQUI: A margem muda de ml-20 para ml-72 suavemente */}
      <div
        className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-500 ease-in-out ${!isSidebarCollapsed ? 'md:ml-72' : 'md:ml-20'}`}
      >
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 flex justify-between items-center z-40 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-slate-500 cursor-pointer"
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:block">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                Sistema de Gestão
              </h2>
              <p className="text-lg font-bold text-slate-800 dark:text-white">
                Operação Integrada
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            {/* ... Bloco das Notificações Mantido Igual ... */}
            <div className="relative" ref={alertsRef}>
              <button
                onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                className={`relative p-2.5 rounded-2xl transition-all duration-300 border cursor-pointer ${
                  isAlertsOpen
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/40 dark:border-indigo-700 dark:text-indigo-300'
                    : unreadCount > 0
                      ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700'
                }`}
              >
                <Bell
                  size={20}
                  className={
                    unreadCount > 0 && !isAlertsOpen
                      ? 'animate-[wiggle_1s_ease-in-out_infinite]'
                      : ''
                  }
                />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 ring-2 ring-white dark:ring-slate-900 text-[10px] font-black text-white shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isAlertsOpen && (
                <div className="absolute right-0 mt-4 w-80 sm:w-[400px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-4 z-50">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="font-black text-slate-800 dark:text-white text-sm">
                      Notificações
                    </h3>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-md">
                      {unreadCount} Novas
                    </span>
                  </div>
                  <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                    {alerts.length > 0 ? (
                      alerts.map((alert) => (
                        <div
                          key={alert.id}
                          onClick={() => {
                            navigate(alert.actionPath);
                            setIsAlertsOpen(false);
                          }}
                          className="p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors group flex gap-4 items-start"
                        >
                          <div
                            className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${alert.color}`}
                          >
                            {alert.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {alert.title}
                              </h4>
                              <span className="text-[9px] font-bold text-slate-400 uppercase ml-2 text-right shrink-0">
                                {alert.time}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug font-medium">
                              {alert.message}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-2">
                          <CheckSquare size={24} />
                        </div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          Tudo Atualizado!
                        </p>
                        <p className="text-xs text-slate-500">
                          Seu painel de operações está limpo.
                        </p>
                      </div>
                    )}
                  </div>
                  {alerts.length > 0 && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 text-center">
                      <button
                        onClick={() => setIsAlertsOpen(false)}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors uppercase tracking-widest cursor-pointer"
                      >
                        Fechar painel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Year Selector */}
            {(user?.role === 'admin' || user?.role === 'secretario') && (
              <div className="relative hidden sm:block">
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(parseInt(e.target.value))}
                  className="pl-4 pr-10 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 appearance-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:ring-2 focus:ring-indigo-500"
                >
                  {[new Date().getFullYear(), new Date().getFullYear() + 1].map(
                    (y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    )
                  )}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            )}

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 sm:gap-3 p-1.5 sm:pr-4 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border border-transparent active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-100 shrink-0">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                    {formatUserName(user?.name)}
                  </p>
                  <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                    {user?.role}
                  </p>
                </div>
                <ChevronDown
                  size={16}
                  className={`hidden sm:block text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-4 w-56 sm:w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2 animate-in fade-in slide-in-from-top-2 z-50">
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    <UserIcon size={18} className="text-slate-400" /> Meu Perfil
                  </Link>
                  <button
                    onClick={handleLogoutClick}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-bold text-red-600 transition-colors cursor-pointer"
                  >
                    <LogOut size={18} /> Sair do Sistema
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTAINER FLUIDO (100% da tela) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar bg-slate-50/50 dark:bg-slate-950 relative">
          <div className="w-full h-full">
            <Outlet
              context={{
                filterYear,
                records,
                shipments,
                patients,
                annualBudget,
                user,
              }}
            />
          </div>
        </main>
      </div>

      <LGPDBanner />
    </div>
  );
}
