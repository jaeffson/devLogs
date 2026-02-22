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
  FiAlertTriangle,
  FiCheck,
} from 'react-icons/fi';
import { generateShipmentPDF } from '../utils/pdfGenerator';
import { ConfirmModal } from '../components/common/Modal';

export default function ShipmentConferencePage() {
  const [activeTab, setActiveTab] = useState('incoming');
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [expandedId, setExpandedId] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [adjustedQuantities, setAdjustedQuantities] = useState({});

  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    isDestructive: false,
    data: null,
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
        setShipments(all.filter((s) => s.status === 'aguardando_conferencia'));
      } else {
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

  const handleQuantityChange = (id, currentVal, delta, e) => {
    e.stopPropagation(); // Impede que clicar no botão de quantidade marque/desmarque o item
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

  const handleVerifyReceive = (ship) => {
    const progress = getProgress(ship);
    const hasPendingItems = progress.checked < progress.total;

    if (hasPendingItems) {
      setConfirmation({
        isOpen: true,
        title: 'Conferência Incompleta!',
        message: `Atenção: Você conferiu apenas ${progress.checked} de ${progress.total} itens. Os itens NÃO marcados serão registrados como faltantes e não entrarão no estoque. Deseja finalizar mesmo assim?`,
        confirmText: 'Sim, Finalizar Parcialmente',
        isDestructive: true,
        data: ship._id,
      });
    } else {
      setConfirmation({
        isOpen: true,
        title: 'Finalizar Entrada',
        message:
          'Todos os itens foram conferidos. Confirmar a entrada no estoque e fechar a remessa?',
        confirmText: 'Confirmar Entrada Total',
        isDestructive: false,
        data: ship._id,
      });
    }
  };

  const executeReceive = async () => {
    const shipmentId = confirmation.data;
    try {
      await api.post('/shipments/receive', {
        shipmentId,
        receivedQuantities: adjustedQuantities,
      });

      toast.success('Estoque atualizado e conferência finalizada!');
      setExpandedId(null);
      setAdjustedQuantities({});
      setConfirmation({ ...confirmation, isOpen: false });
      fetchShipments();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar entrada. Tente novamente.');
      throw error;
    }
  };

  const filteredShipments = shipments.filter(
    (s) =>
      s.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans text-slate-800 pb-24 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                <FiCheckSquare size={26} />
              </div>
              Conferência de Carga
            </h1>
            <p className="text-slate-500 mt-2 text-sm font-medium">
              Realize a bipagem ou marcação dos itens recebidos para dar entrada
              no estoque.
            </p>
          </div>
          <div className="relative w-full md:w-80 group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por fornecedor ou código..."
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm outline-none transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        {/* ABAS */}
        <div className="flex bg-slate-200/60 p-1.5 rounded-2xl w-fit mb-8 shadow-inner border border-slate-200/50">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'incoming'
                ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <FiPackage size={16} /> A Receber (
            {activeTab === 'incoming' ? shipments.length : ''})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <FiCheckCircle size={16} /> Histórico Finalizado
          </button>
        </div>

        {/* LISTA DE REMESSAS */}
        <div className="space-y-6">
          {filteredShipments.map((ship) => {
            const { checked, total, percent } = getProgress(ship);
            const isExpanded = expandedId === ship._id;
            const isComplete = checked === total && total > 0;

            return (
              <div
                key={ship._id}
                className={`bg-white rounded-3xl transition-all overflow-hidden ${
                  isExpanded
                    ? 'shadow-xl border-indigo-200 ring-1 ring-indigo-100'
                    : 'shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                {/* CABEÇALHO DO CARD (Sempre Visível) */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : ship._id)}
                  className="p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between cursor-pointer gap-4"
                >
                  <div className="flex items-center gap-5">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner ${activeTab === 'incoming' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}
                    >
                      <FiTruck />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-lg md:text-xl tracking-tight mb-1">
                        {ship.supplier}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                        <span className="font-mono bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 tracking-wider">
                          REF: {ship.code}
                        </span>
                        {activeTab === 'history' ? (
                          <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                            <FiCheckCircle size={12} /> Finalizado em:{' '}
                            {new Date(ship.receivedAt).toLocaleDateString(
                              'pt-BR'
                            )}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                            <FiClock size={12} /> Enviado em:{' '}
                            {new Date(ship.updatedAt).toLocaleDateString(
                              'pt-BR'
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    {activeTab === 'incoming' && (
                      <div className="text-right flex-1 md:flex-none bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center mb-1.5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Progresso
                          </p>
                          <span
                            className={`text-xs font-black ${percent === 100 ? 'text-emerald-600' : 'text-indigo-600'}`}
                          >
                            {checked} / {total}
                          </span>
                        </div>
                        <div className="w-full md:w-32 h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${percent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    {activeTab === 'history' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          generateShipmentPDF(ship, 'conference');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95"
                      >
                        <FiPrinter size={16} /> Relatório PDF
                      </button>
                    )}
                    <div
                      className={`p-2 rounded-full transition-all duration-300 ${isExpanded ? 'rotate-180 bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}
                    >
                      <FiChevronDown size={20} />
                    </div>
                  </div>
                </div>

                {/* DETALHES EXPANDIDOS (Área de Conferência) */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-5 md:p-8 animate-in slide-in-from-top-2 duration-300">
                    <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                          <span className="text-indigo-500">
                            <FiPackage size={18} />
                          </span>{' '}
                          Resumo da Carga
                        </h4>
                        <p className="text-xs text-slate-500 mt-1.5 font-medium max-w-lg leading-relaxed">
                          {activeTab === 'incoming'
                            ? 'Clique na linha do medicamento para confirmar o recebimento. Ajuste a quantidade caso a caixa venha violada ou com número menor.'
                            : ship.observations
                              ? `Obs: "${ship.observations}"`
                              : 'Carga conferida e finalizada com sucesso.'}
                        </p>
                      </div>

                      {/* BOTÃO FINALIZAR GIGANTE E INTELIGENTE */}
                      {activeTab === 'incoming' && (
                        <button
                          onClick={() => handleVerifyReceive(ship)}
                          className={`w-full md:w-auto px-6 py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-95 ${
                            isComplete
                              ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200 ring-2 ring-emerald-500 ring-offset-2'
                              : 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200'
                          }`}
                        >
                          {isComplete ? (
                            <FiCheckCircle size={20} />
                          ) : (
                            <FiAlertTriangle size={20} />
                          )}
                          {isComplete
                            ? 'FINALIZAR E DAR BAIXA'
                            : 'FINALIZAR COM FALTAS'}
                        </button>
                      )}
                    </div>

                    {/* GRID DE PACIENTES E MEDICAMENTOS */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                      {ship.items.map((patientItem) => (
                        <div
                          key={patientItem._id}
                          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col"
                        >
                          <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm">
                              {patientItem.patientName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-black text-slate-800 text-base tracking-tight">
                              {patientItem.patientName}
                            </span>
                          </div>

                          <div className="space-y-3 flex-1">
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
                                    /* --- MODO CONFERÊNCIA (ÁREA DE CLIQUE EXPANDIDA) --- */
                                    <div
                                      onClick={() =>
                                        !isMissing && toggleCheck(uniqueId)
                                      }
                                      className={`group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl border-2 transition-all select-none ${
                                        isMissing
                                          ? 'bg-red-50 border-red-100 opacity-60 cursor-not-allowed'
                                          : isChecked
                                            ? 'bg-emerald-50/50 border-emerald-400 shadow-sm shadow-emerald-100 cursor-pointer'
                                            : 'bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-white hover:shadow-sm cursor-pointer'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3 w-full sm:w-auto mb-3 sm:mb-0">
                                        {!isMissing && (
                                          <div
                                            className={`w-6 h-6 rounded flex items-center justify-center border-2 shrink-0 transition-colors ${isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300 group-hover:border-indigo-400'}`}
                                          >
                                            {isChecked && (
                                              <FiCheck
                                                size={16}
                                                strokeWidth={3}
                                              />
                                            )}
                                          </div>
                                        )}
                                        <div className="flex flex-col">
                                          <span
                                            className={`text-sm font-bold ${isMissing ? 'text-red-700 line-through' : isChecked ? 'text-emerald-900' : 'text-slate-700'}`}
                                          >
                                            {med.name}
                                          </span>
                                          {isMissing && (
                                            <span className="text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center gap-1 mt-0.5">
                                              <FiAlertCircle size={12} /> FALTA
                                              NA ORIGEM
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* CONTROLE DE QUANTIDADE */}
                                      {!isMissing && (
                                        <div
                                          className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden h-9 shadow-sm shrink-0 ml-9 sm:ml-0"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <button
                                            onClick={(e) =>
                                              handleQuantityChange(
                                                uniqueId,
                                                med.quantity,
                                                -1,
                                                e
                                              )
                                            }
                                            className="w-10 flex items-center justify-center hover:bg-slate-100 text-slate-500 cursor-pointer h-full border-r border-slate-100 active:bg-slate-200 transition-colors"
                                          >
                                            <FiMinus size={14} />
                                          </button>
                                          <div className="px-3 text-sm font-black text-slate-800 min-w-[70px] text-center flex flex-col justify-center leading-none">
                                            <span>{displayQty}</span>
                                            <span className="text-[9px] text-slate-400 uppercase mt-0.5 tracking-wider">
                                              {smartUnit}
                                            </span>
                                          </div>
                                          <button
                                            onClick={(e) =>
                                              handleQuantityChange(
                                                uniqueId,
                                                med.quantity,
                                                1,
                                                e
                                              )
                                            }
                                            className="w-10 flex items-center justify-center hover:bg-slate-100 text-indigo-600 cursor-pointer h-full border-l border-slate-100 active:bg-slate-200 transition-colors"
                                          >
                                            <FiPlus size={14} />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    /* --- MODO HISTÓRICO (SOMENTE LEITURA) --- */
                                    <div
                                      className={`flex items-center justify-between p-3.5 rounded-xl border ${isMissing ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}
                                    >
                                      <div className="flex flex-col">
                                        <span
                                          className={`text-sm font-bold ${isMissing ? 'text-red-600 line-through' : 'text-slate-700'}`}
                                        >
                                          {med.name}
                                        </span>
                                        {isMissing && (
                                          <span className="text-[10px] font-black uppercase tracking-widest text-red-500 mt-0.5">
                                            NÃO RECEBIDO
                                          </span>
                                        )}
                                      </div>
                                      {!isMissing && (
                                        <div className="flex items-center gap-3">
                                          <span className="text-xs font-black font-mono text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
                                            {displayQty} {smartUnit}
                                          </span>
                                          <FiCheckCircle
                                            size={18}
                                            className="text-emerald-500"
                                          />
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

          {/* EMPTY STATE */}
          {filteredShipments.length === 0 && !loading && (
            <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-sm flex flex-col items-center justify-center">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 border border-slate-100">
                {activeTab === 'incoming' ? (
                  <FiBox size={36} className="text-slate-300" />
                ) : (
                  <FiCheckCircle size={36} className="text-slate-300" />
                )}
              </div>
              <h3 className="text-xl font-black text-slate-700 tracking-tight">
                Nenhuma Carga Encontrada
              </h3>
              <p className="text-sm font-medium text-slate-500 mt-2 max-w-sm">
                Não há remessas correspondentes à sua busca ou na aba
                selecionada no momento.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO */}
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
