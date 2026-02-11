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

// Imports de Componentes e Utils
import { formatUserName } from '../utils/helpers';
import { icons } from '../utils/icons';
import LGPDBanner from '../components/common/LGPDBanner';
import OfflineAlert from '../components/common/OfflineAlert';

// --- HELPERS DE CLIMA (Manutenção da Lógica Existente) ---
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
    // ... restante do mapeamento mantido
  };
  return weatherMap[code] || { text: 'Indefinido', icon: WiCloud };
}

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

  // Estados de Interface
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMouseOverSidebar, setIsMouseOverSidebar] = useState(false);

  // --- NAVEGAÇÃO PROFISSIONAL (ORDEM LÓGICA) ---
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

  // --- LOGICA DE UI (SIDEBAR & TIMERS) ---
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

      {/* SIDEBAR MODERNA */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed inset-y-0 left-0 z-[60] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-500 ease-in-out shadow-2xl md:shadow-none md:translate-x-0 ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full md:w-20'} ${!isSidebarCollapsed && 'md:w-72'}`}
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 border-b border-slate-50 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Package size={22} />
          </div>
          <span
            className={`ml-4 text-xl font-black text-slate-800 dark:text-white tracking-tight transition-opacity duration-300 ${isSidebarCollapsed && 'md:opacity-0'}`}
          >
            MedLogs<span className="text-indigo-600">.</span>
          </span>
        </div>

        {/* Navigation */}
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
                  className={`${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-200`}
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

        {/* User Quick Info (Sidebar Bottom) */}
        {!isSidebarCollapsed && (
          <div className="absolute bottom-6 left-6 right-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Unidade
            </p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Parari, PB
            </p>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-20 overflow-hidden">
        {/* REFINED HEADER */}
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 flex justify-between items-center z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-slate-500"
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

          <div className="flex items-center gap-6">
            {/* Year Selector - UI Senior */}
            {(user?.role === 'admin' || user?.role === 'secretario') && (
              <div className="relative">
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
                className="flex items-center gap-3 p-1.5 pr-4 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border border-transparent active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-100">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                    {formatUserName(user?.name)}
                  </p>
                  <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                    {user?.role}
                  </p>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* PERFIL DROPDOWN MENU */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-4 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2 animate-in fade-in slide-in-from-top-2">
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200"
                  >
                    <UserIcon size={18} className="text-slate-400" /> Ver Perfil
                  </Link>
                  <button
                    onClick={handleLogoutClick}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-bold text-red-600 transition-colors"
                  >
                    <LogOut size={18} /> Sair do Sistema
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-slate-50/50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet context={{ filterYear, records, annualBudget, user }} />
          </div>
        </main>
      </div>

      <LGPDBanner />
    </div>
  );
}
