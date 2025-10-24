// src/components/professional/ProfessionalDashboardTabs.jsx
import React from 'react';

const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'patients', label: 'Pacientes' },
    { id: 'historico', label: 'Histórico' },
    { id: 'deliveries', label: 'Entregas Recentes' },
];

export function ProfessionalDashboardTabs({ activeTab, setActiveTab }) {
    return (
        <div className="border-b border-gray-200 mb-6"> {/* Adicionado mb-6 */}
            <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs"> {/* Adicionado overflow */}
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`whitespace-nowrap py-3 px-2 md:px-4 border-b-2 font-medium text-sm transition-colors duration-150 ease-in-out focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 rounded-t ${ /* Ajustado padding e rounded */
                            activeTab === tab.id
                                ? 'border-blue-600 text-blue-700'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                        aria-current={activeTab === tab.id ? 'page' : undefined}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
    );
}