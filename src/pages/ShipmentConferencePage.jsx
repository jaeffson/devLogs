import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  FiTruck,
  FiCheckSquare,
  FiBox,
  FiSearch,
  FiCheckCircle,
  FiChevronDown,
  FiPackage,
  FiClock,
  FiPrinter,
  FiAlertCircle,
  FiPlus,
  FiMinus,
  FiAlertTriangle, // Novo ícone para o alerta
} from 'react-icons/fi';
import { generateShipmentPDF } from '../utils/pdfGenerator';
import { ConfirmModal } from '../components/common/Modal'; // Importando Modal Moderno

export default function ShipmentConferencePage() {
  const [activeTab, setActiveTab] = useState('incoming');
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para controle da conferência visual
  const [expandedId, setExpandedId] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [adjustedQuantities, setAdjustedQuantities] = useState({});

  // --- NOVO: Estado do Modal de Confirmação ---
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    isDestructive: false,
    data: null, // Guarda o ID da remessa para usar na função
  });

  useEffect(() => {
    fetchShipments();
  }, [activeTab]);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/shipments/history');
      const all = res.data || [];

      if (activeTab === 'incoming') {
        // Busca o que o fornecedor já respondeu
        setShipments(all.filter((s) => s.status === 'aguardando_conferencia'));
      } else {
        // Busca o que já acabou
        setShipments(all.filter((s) => s.status === 'finalizado'));
      }
    } catch (error) {
      toast.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = (id) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleQuantityChange = (id, currentVal, delta) => {
    const actualVal =
      adjustedQuantities[id] !== undefined
        ? adjustedQuantities[id]
        : currentVal;
    const newVal = actualVal + delta;
    if (newVal < 1) return;
    setAdjustedQuantities((prev) => ({ ...prev, [id]: newVal }));
  };

  const getSmartUnit = (quantity, unit) => {
    if (!unit) return '';
    const qty = Number(quantity);
    const u = unit.toLowerCase().trim();

    const map = {
      cx: { s: 'Caixa', p: 'Caixas' },
      caixa: { s: 'Caixa', p: 'Caixas' },
      fr: { s: 'Frasco', p: 'Frascos' },
      frasco: { s: 'Frasco', p: 'Frascos' },
      un: { s: 'Unidade', p: 'Unidades' },
      und: { s: 'Unidade', p: 'Unidades' },
      unidade: { s: 'Unidade', p: 'Unidades' },
      amp: { s: 'Ampola', p: 'Ampolas' },
      com: { s: 'Comp.', p: 'Comp.' },
      cp: { s: 'Comp.', p: 'Comp.' },
    };

    if (map[u]) {
      return qty > 1 ? map[u].p : map[u].s;
    }
    return unit.toUpperCase();
  };

  const getProgress = (ship) => {
    let total = 0;
    let checked = 0;
    ship.items.forEach((p) =>
      p.medications.forEach((m) => {
        if (m.status !== 'falta') {
          total++;
          if (checkedItems[`${p._id}-${m._id}`]) checked++;
        }
      })
    );
    return {
      total,
      checked,
      percent: total === 0 ? 100 : (checked / total) * 100,
    };
  };

  // --- 1. PRIMEIRO PASSO: Verifica e Abre o Modal ---
  const handleVerifyReceive = (ship) => {
    const progress = getProgress(ship);
    const hasPendingItems = progress.checked < progress.total;

    if (hasPendingItems) {
      // CASO DE ALERTA: Faltam itens
      setConfirmation({
        isOpen: true,
        title: 'Conferência Incompleta!',
        message: `Atenção: Você conferiu apenas ${progress.checked} de ${progress.total} itens. Os itens NÃO marcados serão ignorados e não entrarão no estoque. Deseja finalizar mesmo assim?`,
        confirmText: 'Sim, Finalizar Parcialmente',
        isDestructive: true, // Modal Vermelho
        data: ship._id,
      });
    } else {
      // CASO SUCESSO: Tudo conferido
      setConfirmation({
        isOpen: true,
        title: 'Finalizar Entrada',
        message:
          'Todos os itens foram conferidos. Confirmar a entrada no estoque e fechar a remessa?',
        confirmText: 'Confirmar Entrada',
        isDestructive: false, // Modal Azul/Normal
        data: ship._id,
      });
    }
  };

  // --- 2. SEGUNDO PASSO: Executa a Ação (Chamado pelo Modal) ---
  const executeReceive = async () => {
    const shipmentId = confirmation.data;

    // O Modal já tem loading interno, mas podemos usar toast também se preferir
    // Como o ConfirmModal trata promises, retornamos a promise para ele gerenciar o spinner

    try {
      await api.post('/shipments/receive', {
        shipmentId,
        receivedQuantities: adjustedQuantities,
      });

      toast.success('Estoque atualizado com sucesso!');

      // Limpa estados
      setExpandedId(null);
      setAdjustedQuantities({});
      setConfirmation({ ...confirmation, isOpen: false }); // Fecha modal

      fetchShipments(); // Atualiza lista
    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar entrada. Tente novamente.');
      throw error; // Lança erro para o modal saber que falhou
    }
  };

  const filteredShipments = shipments.filter(
    (s) =>
      s.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans text-gray-800 pb-20 animate-fade-in">
      <div className="max-w-5xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg">
              <FiCheckSquare size={24} />
            </div>
            Conferência de Carga
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">
            Bipe ou marque os itens recebidos.
          </p>
        </div>
        <div className="relative w-full md:w-72 group">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Buscar remessa..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'incoming' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            <FiPackage /> A Receber (
            {activeTab === 'incoming' ? shipments.length : ''})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'history' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            <FiCheckCircle /> Histórico
          </button>
        </div>

        <div className="space-y-4">
          {filteredShipments.map((ship) => {
            const { checked, total, percent } = getProgress(ship);
            const isExpanded = expandedId === ship._id;
            const isComplete = checked === total && total > 0;

            return (
              <div
                key={ship._id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${isExpanded ? 'shadow-lg border-blue-200 ring-1 ring-blue-100' : 'shadow-sm border-gray-200 hover:border-blue-300'}`}
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : ship._id)}
                  className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between cursor-pointer bg-white gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 ${activeTab === 'incoming' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}
                    >
                      <FiTruck />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">
                        {ship.supplier}
                      </h3>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-200 font-bold">
                          {ship.code}
                        </span>
                        {activeTab === 'history' ? (
                          <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                            <FiCheckCircle size={10} /> Conferido em:{' '}
                            {new Date(ship.receivedAt).toLocaleString()}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <FiClock size={10} /> Enviado em:{' '}
                            {new Date(ship.updatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    {activeTab === 'incoming' && (
                      <div className="text-right flex-1 md:flex-none">
                        <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">
                          Conferência
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="w-full md:w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${percent < 100 ? 'bg-blue-500' : 'bg-green-500'}`}
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                          <span
                            className={`text-xs font-bold min-w-[30px] text-right ${percent < 100 ? 'text-blue-600' : 'text-green-600'}`}
                          >
                            {checked}/{total}
                          </span>
                        </div>
                      </div>
                    )}
                    {activeTab === 'history' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          generateShipmentPDF(ship, 'conference');
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        <FiPrinter size={16} />{' '}
                        <span className="hidden sm:inline">Relatório</span>
                      </button>
                    )}
                    <div
                      className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      <FiChevronDown className="text-gray-400" size={20} />
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-6 animate-fade-in">
                    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                          <FiPackage /> Detalhamento da Carga
                        </h4>
                        {ship.observations && (
                          <p className="text-xs text-gray-500 mt-1 italic max-w-lg">
                            Obs: "{ship.observations}"
                          </p>
                        )}
                      </div>

                      {/* BOTÃO FINALIZAR (AGORA SEMPRE ATIVO) */}
                      {activeTab === 'incoming' && (
                        <button
                          onClick={() => handleVerifyReceive(ship)}
                          className={`px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-sm cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 ${
                            isComplete
                              ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-green-200' // Estilo Sucesso
                              : 'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-orange-200' // Estilo Alerta
                          }`}
                        >
                          {isComplete ? (
                            <FiCheckCircle size={18} />
                          ) : (
                            <FiAlertTriangle size={18} />
                          )}
                          {isComplete
                            ? 'FINALIZAR E DAR BAIXA'
                            : 'FINALIZAR COM PENDÊNCIAS'}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ship.items.map((patientItem) => (
                        <div
                          key={patientItem._id}
                          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
                        >
                          <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                            <span className="font-bold text-gray-700 text-sm">
                              {patientItem.patientName}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {patientItem.medications.map((med) => {
                              const uniqueId = `${patientItem._id}-${med._id}`;
                              const isChecked = checkedItems[uniqueId];
                              const isMissing = med.status === 'falta';

                              const displayQty =
                                adjustedQuantities[uniqueId] !== undefined
                                  ? adjustedQuantities[uniqueId]
                                  : med.quantity;
                              const smartUnit = getSmartUnit(
                                displayQty,
                                med.unit
                              );

                              return (
                                <div key={uniqueId}>
                                  {activeTab === 'incoming' ? (
                                    // MODO CONFERÊNCIA
                                    <div
                                      className={`flex items-center justify-between p-2 rounded-lg border transition-all select-none ${isMissing ? 'bg-red-50 border-red-100 opacity-70' : isChecked ? 'bg-green-50 border-green-200 ring-1 ring-green-100' : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-200'}`}
                                    >
                                      <div className="flex items-center gap-3">
                                        {!isMissing && (
                                          <input
                                            type="checkbox"
                                            checked={isChecked || false}
                                            onChange={() =>
                                              toggleCheck(uniqueId)
                                            }
                                            className="w-5 h-5 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                                          />
                                        )}
                                        <div className="flex flex-col">
                                          <span
                                            className={`text-sm font-medium ${isMissing ? 'text-red-600 line-through' : 'text-gray-700'}`}
                                          >
                                            {med.name}
                                          </span>
                                          {isMissing && (
                                            <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                                              <FiAlertCircle /> ITEM EM FALTA
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {!isMissing && (
                                        <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden h-8 shadow-sm">
                                          <button
                                            onClick={() =>
                                              handleQuantityChange(
                                                uniqueId,
                                                med.quantity,
                                                -1
                                              )
                                            }
                                            className="px-2 hover:bg-gray-100 text-gray-500 cursor-pointer h-full border-r border-gray-100"
                                          >
                                            <FiMinus size={10} />
                                          </button>
                                          <div className="px-2 text-xs font-bold text-gray-700 min-w-[60px] text-center flex flex-col justify-center leading-tight">
                                            <span>{displayQty}</span>
                                            <span className="text-[9px] text-gray-400 uppercase">
                                              {smartUnit}
                                            </span>
                                          </div>
                                          <button
                                            onClick={() =>
                                              handleQuantityChange(
                                                uniqueId,
                                                med.quantity,
                                                1
                                              )
                                            }
                                            className="px-2 hover:bg-gray-100 text-blue-600 cursor-pointer h-full border-l border-gray-100"
                                          >
                                            <FiPlus size={10} />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    // MODO HISTÓRICO
                                    <div
                                      className={`flex items-center justify-between p-2 rounded-lg border ${isMissing ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}
                                    >
                                      <div className="flex flex-col">
                                        <span
                                          className={`text-sm font-medium ${isMissing ? 'text-red-600' : 'text-gray-700'}`}
                                        >
                                          {med.name}
                                        </span>
                                        {isMissing && (
                                          <span className="text-[10px] font-bold text-red-500">
                                            NÃO RECEBIDO (FALTA)
                                          </span>
                                        )}
                                      </div>
                                      {!isMissing && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                            {displayQty} {smartUnit}
                                          </span>
                                          <FiCheckCircle className="text-green-500" />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filteredShipments.length === 0 && !loading && (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                {activeTab === 'incoming' ? (
                  <FiBox size={32} />
                ) : (
                  <FiCheckCircle size={32} />
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-600">
                Nenhum registro encontrado
              </h3>
            </div>
          )}
        </div>
      </div>

      {/* --- RENDERIZAÇÃO DO MODAL DE CONFIRMAÇÃO --- */}
      {confirmation.isOpen && (
        <ConfirmModal
          title={confirmation.title}
          message={confirmation.message}
          confirmText={confirmation.confirmText}
          isDestructive={confirmation.isDestructive}
          onConfirm={executeReceive} 
          onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
        />
      )}
    </div>
  );
}
