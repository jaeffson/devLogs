// src/layouts/MainLayout.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- Imports ---
// Gráfico (verifique se a importação está correta)
import { AnnualBudgetChart } from '../components/common/AnnualBudgetChart';
import { formatUserName } from '../utils/helpers';
// Ícones e useDebounce (presumindo que existem nesses locais)
import icons from '../utils/icons'; // Importa o objeto de ícones
// import useDebounce from '../hooks/useDebounce'; // Descomente se usar debounce AQUI

// --- Definição dos Ícones (Recomendação: Mover para src/utils/icons.js ou similar) ---
// const icons = { /* ... Seu objeto de ícones SVG ... */ };
// Para simplificar a leitura, vamos assumir que o objeto 'icons' importado
// contém as chaves corretas (dashboard, users, history, etc.)

// Simulação de dados
const fetchSimulatedData = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
        user: { id: 2, name: 'Secretária Silva', role: 'secretario' },
        // user: { id: 1, name: 'Dr. Carlos Andrade', role: 'profissional' },
        patients: [ {id: 1, name: "Ana"}, {id: 2, name: "Bruno"} ],
        records: [ { id: 1, patientId: 1, entryDate: '2025-10-23T10:00:00Z', medications: [{ medicationId: 1, quantity: 2, value: 5.50 }], totalValue: 11.00, status: 'Pendente', deliveryDate: null }, { id: 2, patientId: 2, entryDate: '2025-10-22T14:30:00Z', medications: [{ medicationId: 2, quantity: 1, value: 12.00 }], totalValue: 12.00, status: 'Atendido', deliveryDate: '2025-10-22' } ],
        medications: [ { id: 1, name: 'Med A' }, { id: 2, name: 'Med B' } ],
        annualBudget: 50000,
    };
};


export default function MainLayout() { // Removidas props não usadas diretamente aqui
    const location = useLocation();

    // --- Estados Globais do Layout ---
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Estados dos Dados da Aplicação ---
    const [user, setUser] = useState(null);
    const [patients, setPatients] = useState([]);
    const [records, setRecords] = useState([]);
    const [medications, setMedications] = useState([]);
    const [annualBudget, setAnnualBudget] = useState(0);
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());

    // --- Funções Toast e Log ---
    const addToast = useCallback((message, type = 'info') => {
        toast(message, { type });
    }, []);
    const addLog = useCallback((userName, action) => {
        console.log(`[LOG] ${userName}: ${action} em ${new Date().toLocaleString()}`);
    }, []);

    // --- Efeito para Buscar Dados Iniciais ---
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchSimulatedData();
                setUser(data.user);
                setPatients(data.patients || []);
                setRecords(data.records || []);
                setMedications(data.medications || []);
                setAnnualBudget(data.annualBudget || 0);
            } catch (err) {
                setError('Falha ao carregar os dados. Tente novamente mais tarde.');
                addToast('Erro ao carregar dados.', 'error');
                console.error("Fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [addToast]); // Depende do addToast para evitar warning do linter

    // --- Memos para Gráfico ---
     const recordsByYear = useMemo(() =>
      Array.isArray(records) ? records.filter(r => new Date(r.entryDate).getFullYear() === filterYear) : [],
      [records, filterYear]);

    const totalSpentForYear = useMemo(() =>
        recordsByYear.reduce((sum, item) => sum + (Number(item.totalValue) || 0), 0),
        [recordsByYear] // Depende dos registros já filtrados por ano
    );

    // --- Helper para Nome do Role ---
    const getRoleName = (role) => {
        const names = { profissional: "Profissional", secretario: "Secretário(a)", admin: "Admin" };
        return names[role] || role;
    };

    // --- Links da Sidebar (Reorganizado e Simplificado) ---
    const navLinks = useMemo(() => {
        const baseLinks = [
             // { path: '/ajuda', label: 'Ajuda', icon: icons.help }, // Exemplo de link comum
        ];

        let roleSpecificLinks = [];

        switch (user?.role) {
            case 'secretario':
                roleSpecificLinks = [
                    { path: '/secretaria/dashboard', label: 'Dashboard', icon: icons.dashboard },
                ];
                break;
            case 'profissional':
                roleSpecificLinks = [
                    { path: '/profissional/dashboard', label: 'Dashboard', icon: icons.dashboard },
                    { path: '/profissional/pacientes', label: 'Pacientes', icon: icons.users },
                    { path: '/profissional/historico', label: 'Histórico Geral', icon: icons.history },
                    { path: '/profissional/entregas', label: 'Entregas Recentes', icon: icons.delivery }, // Mudado de clipboard para delivery
                ];
                break;
            case 'admin':
                roleSpecificLinks = [
                    { path: '/admin/dashboard', label: 'Dashboard Admin', icon: icons.settings }, // Exemplo
                    { path: '/admin/usuarios', label: 'Gerenciar Usuários', icon: icons.users },
                    { path: '/admin/medicamentos', label: 'Gerenciar Meds', icon: icons.pill },
                    // { path: '/admin/logs', label: 'Logs', icon: icons.history }, // Exemplo
                ];
                break;
            default:
                roleSpecificLinks = [];
        }

        return [...roleSpecificLinks, ...baseLinks]; // Combina específicos com comuns
    }, [user?.role]); // Depende apenas do role do usuário

    // --- Aba ativa ---
    const getActiveTabFromPath = useCallback(() => {
        // Encontra o link cuja base corresponde ao início do pathname atual
        // Dá prioridade para matches mais longos (ex: /profissional/pacientes antes de /profissional)
        let bestMatch = '/';
        let maxMatchLength = 0;
        navLinks.forEach(link => {
            if (location.pathname.startsWith(link.path) && link.path.length > maxMatchLength) {
                maxMatchLength = link.path.length;
                bestMatch = link.path;
            }
        });
        return bestMatch;
    }, [location.pathname, navLinks]);
    const activeTab = getActiveTabFromPath();

    // --- Efeito para fechar sidebar em telas grandes ---
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) { // md breakpoint
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- Simulação de Logout ---
    const handleLogout = () => {
        addToast("Logout realizado (simulação)", "success");
        // Adicionar lógica real de logout aqui (limpar token, redirecionar, etc.)
        // navigate('/login');
        setUser(null); // Simula o logout limpando o usuário
    };


    // --- Renderização ---
    if (isLoading) return <div className="flex justify-center items-center h-screen text-gray-600">Carregando...</div>;
    if (error) return <div className="flex justify-center items-center h-screen text-red-600 font-semibold p-4">{error}</div>;
    // Se não houver usuário após o carregamento, pode redirecionar para login ou mostrar mensagem
    if (!user && !isLoading) {
         // Exemplo: return <Navigate to="/login" replace />;
         return <div className="flex justify-center items-center h-screen">Usuário não autenticado. Redirecionando...</div>;
    }


    return (
        <div className="flex h-screen bg-gray-100">
            {/* Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                ></div>
            )}

            {/* Sidebar */}
            <aside
              className={`fixed inset-y-0 left-0 bg-gradient-to-b from-gray-800 to-gray-900 text-gray-100 shadow-lg flex-shrink-0 flex flex-col z-30 w-64
                         transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                         md:relative md:translate-x-0 transition-transform duration-300 ease-in-out`}
              aria-label="Menu Principal"
            >
                {/* Header da Sidebar */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center h-16 flex-shrink-0">
                    <div>
                        {/* Logo ou Título */}
                        <h1 className="text-2xl font-bold text-white tracking-tight">SysMed</h1>
                         {/* Role (opcional em mobile) */}
                         <p className="text-xs text-blue-300 hidden md:block">{getRoleName(user?.role)}</p>
                    </div>
                    <button
                      className="md:hidden text-gray-400 hover:text-white p-1 -mr-2"
                      onClick={() => setIsSidebarOpen(false)}
                      aria-label="Fechar menu"
                    >
                      {icons.close || 'X'}
                    </button>
                </div>

                {/* Navegação */}
                <nav className="flex-grow p-4 overflow-y-auto">
                    {navLinks.map(item => {
                        const isActive = activeTab === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`w-full text-left p-2.5 rounded-md text-sm font-medium transition-all duration-150 mb-2 flex items-center gap-3 group ${
                                    isActive
                                        ? 'bg-blue-600 text-white shadow-sm' // Estilo ativo mais forte
                                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                }`}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <span className={`w-5 h-5 transition-colors duration-150 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{item.icon || icons.default}</span>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer da Sidebar */}
                <div className="p-4 border-t border-gray-700 flex-shrink-0">
                     {/* Informações do Usuário */}
                     <div className="mb-4 text-center">
                         <div className="w-10 h-10 rounded-full bg-blue-500 mx-auto mb-2 flex items-center justify-center text-white font-bold">
                             {user?.name ? user.name.charAt(0).toUpperCase() : '?'} {/* Inicial */}
                         </div>
                         <p className="text-sm font-medium text-gray-200 truncate">{formatUserName(user?.name)}</p>
                         <p className="text-xs text-gray-400">{getRoleName(user?.role)}</p>
                     </div>
                     {/* Botão Sair */}
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 p-2.5 text-sm bg-red-800 hover:bg-red-700 text-red-100 rounded-md font-medium transition-colors duration-150">
                        <span className="w-5 h-5">{icons.logout}</span>
                        <span>Sair</span>
                    </button>
                </div>
            </aside>

            {/* Conteúdo Principal */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Cabeçalho Principal */}
                <header className="bg-white shadow-sm p-4 flex justify-between items-center flex-shrink-0 z-10 h-16 border-b">
                    {/* Lado Esquerdo: Botão Menu Mobile */}
                    <div className="flex items-center gap-4">
                        <button
                          className="text-gray-500 hover:text-gray-800 md:hidden p-1 -ml-1" // Ajuste de margem
                          onClick={() => setIsSidebarOpen(true)}
                          aria-label="Abrir menu"
                        >
                          {icons.menu || '☰'}
                        </button>
                         {/* Título da Página Atual (Opcional, pode ficar em branco ou mostrar saudação) */}
                        <h2 className="text-lg font-semibold text-gray-700 hidden sm:block">
                           {navLinks.find(link => link.path === activeTab)?.label || `Olá, ${formatUserName(user?.name)}`}
                        </h2>
                    </div>

                    {/* Lado Direito: Gráfico e Ano */}
                    <div className="flex items-center gap-4 md:gap-6">
                        {(user?.role === 'admin' || user?.role === 'secretario') && (
                            <> {/* Fragmento para agrupar */}
                                <div className="hidden lg:block"> {/* Oculta gráfico em telas menores que large */}
                                    <AnnualBudgetChart
                                        key={annualBudget + totalSpentForYear} // Chave para forçar re-render se dados mudam
                                        totalSpent={totalSpentForYear}
                                        budgetLimit={annualBudget}
                                    />
                                </div>
                                <div className="flex items-center">
                                    <label className="text-xs font-medium text-gray-600 mr-2 hidden md:inline">Ano:</label>
                                    <select
                                      value={filterYear}
                                      onChange={e => setFilterYear(parseInt(e.target.value))}
                                      className="p-1 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                      aria-label="Selecionar Ano para Filtro"
                                    >
                                        {/* Gerar opções de ano dinamicamente seria melhor */}
                                        <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                                        <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                                        <option value={new Date().getFullYear() - 2}>{new Date().getFullYear() - 2}</option>
                                    </select>
                                </div>
                            </>
                        )}
                         {/* Outros ícones/controles do header aqui (ex: notificações, perfil) */}
                    </div>
                </header>

                {/* Área de Conteúdo com Scroll */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                    {/* Renderiza a página da rota atual */}
                    {/* Passa todos os dados e funções necessários via contexto */}
                    <div className="p-4 md:p-6"> {/* Padding aplicado aqui */}
                        <Outlet context={{ user, patients, records, medications, annualBudget, filterYear, addToast, addLog, setPatients, setRecords /* Passa setters se precisar */ }} />
                    </div>
                </main>
            </div>

            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored" // Um tema mais moderno
            />
        </div>
    );
}