import React, { useState, useEffect } from 'react';
import api, { shipmentService } from '../services/api';
import toast from 'react-hot-toast';
import {
  FiTruck,
  FiCheckSquare,
  FiBox,
  FiSearch,
  FiCheckCircle,
  FiChevronDown,
  FiPrinter,
  FiAlertCircle,
  FiAlertTriangle,
  FiCheck,
  FiInfo,
  FiFilter,
  FiClock,
} from 'react-icons/fi';
import { generateShipmentPDF } from '../utils/pdfGenerator';
import { ConfirmModal } from '../components/common/Modal';

// ATENÇÃO: Adicionámos a prop "onGlobalUpdate" que vem do App.jsx
export default function ShipmentConferencePage({ onGlobalUpdate }) {
  const [activeTab, setActiveTab] = useState('incoming');
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [hideChecked, setHideChecked] = useState(false);

  const [expandedId, setExpandedId] = useState(null);
  const [adjustedQuantities, setAdjustedQuantities] = useState({});
  const [checkedBags, setCheckedBags] = useState({});

  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    isDestructive: false,
    onConfirm: () => {},
  });

  // =========================================================================
  // 🌟 UTILITÁRIOS INTELIGENTES
  // =========================================================================

  const getSmartUnitDisplay = (qty, unit) => {
    if (!unit) return qty <= 1 ? 'UNID' : 'UNIDS';
    const u = String(unit).toUpperCase();
    const q = Number(qty) || 1;
    if (u === 'CX' || u === 'CAIXA') return q > 1 ? 'CAIXAS' : 'CAIXA';
    if (u === 'FR' || u === 'FRASCO') return q > 1 ? 'FRASCOS' : 'FRASCO';
    if (u === 'TB' || u === 'TUBO') return q > 1 ? 'TUBOS' : 'TUBO';
    if (u === 'UN' || u === 'UND') return q > 1 ? 'UNIDADES' : 'UNIDADE';
    if (u === 'AMP') return q > 1 ? 'AMPOLAS' : 'AMPOLA';
    if (u === 'CART' || u === 'CARTELA') return q > 1 ? 'CARTELAS' : 'CARTELA';
    if (u === 'BISNAGA' || u === 'BIS') return q > 1 ? 'BISNAGAS' : 'BISNAGA';
    if (u === 'PCT' || u === 'PACOTE') return q > 1 ? 'PACOTES' : 'PACOTE';
    if (u === 'LATA') return q > 1 ? 'LATAS' : 'LATA';
    if (u === 'COMP') return q > 1 ? 'COMPRIMIDOS' : 'COMPRIMIDO';
    return u;
  };

  const parseSupplierData = (obsString, shipment) => {
    let name = shipment?.supplier || 'Fornecedor';
    let date = new Date(
      shipment?.updatedAt || shipment?.createdAt
    ).toLocaleString('pt-BR');

    if (obsString) {
      const nameMatch =
        obsString.match(/\[Responsável:\s*(.*?)\]/) ||
        obsString.match(/Responsável do Fornecedor:\s*(.*?)(?:\n|$)/);
      if (nameMatch) name = nameMatch[1];
      const dateMatch = obsString.match(/\[Atualizado em:\s*(.*?)\]/);
      if (dateMatch) date = dateMatch[1];
    }
    return { name, date };
  };

  const getConferenceItems = (items) => {
    return items.map((item) => ({
      ...item,
      medsToConfer: item.medications || [],
    }));
  };

  const checkItemHasPhysicalDelivery = (item) => {
    return item.medsToConfer.some((med) => {
      const isFalta =
        med.unitPrice === -1 || med.status?.toLowerCase() === 'falta';
      const isPendente =
        !isFalta && (!med.unitPrice || parseFloat(med.unitPrice) === 0);
      return !isFalta && !isPendente;
    });
  };

  const checkIsPerfectDelivery = (confItems) => {
    if (!confItems || confItems.length === 0) return false;
    let hasIssue = false;
    confItems.forEach((item) => {
      item.medsToConfer.forEach((med) => {
        const isFalta =
          med.unitPrice === -1 || med.status?.toLowerCase() === 'falta';
        const isPendente =
          !isFalta && (!med.unitPrice || parseFloat(med.unitPrice) === 0);
        const isParcial = med.status?.toLowerCase() === 'parcial';

        if (isFalta || isPendente || isParcial) {
          hasIssue = true;
        }
      });
    });
    return !hasIssue;
  };

  useEffect(() => {
    fetchShipments();
    const interval = setInterval(fetchShipments, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchShipments = async () => {
    try {
      // Adicionamos um timestamp para forçar o navegador a não usar Cache antigo
      const res = await api
        .get(`/shipments/history?t=${new Date().getTime()}`)
        .catch(() => shipmentService.getHistory());
      const validShipments = (res.data || []).filter(
        (s) => s.status !== 'cancelado'
      );
      validShipments.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setShipments(validShipments);
    } catch (error) {
      toast.error('Erro ao carregar remessas para conferência.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = (shipmentId) => {
    if (expandedId === shipmentId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(shipmentId);
    setPatientSearchTerm('');
    setHideChecked(false);

    const shipment = shipments.find((s) => s._id === shipmentId);
    if (shipment) {
      const initial = {};
      const initialChecked = {};

      const confItems = getConferenceItems(shipment.items);
      confItems.forEach((item) => {
        initialChecked[item._id] = false;
        item.medsToConfer.forEach((med) => {
          const key = `${item._id}-${med._id}`;
          const isFalta =
            med.unitPrice === -1 || med.status?.toLowerCase() === 'falta';
          const isPendente =
            !isFalta && (!med.unitPrice || parseFloat(med.unitPrice) === 0);

          if (isFalta || isPendente) {
            initial[key] = 0;
          } else {
            initial[key] =
              med.receivedQuantity !== undefined
                ? med.receivedQuantity
                : med.quantity || 0;
          }
        });
      });
      setAdjustedQuantities(initial);
      setCheckedBags(initialChecked);
    }
  };

  const handleQtyChange = (itemId, medId, isBloqueado, value) => {
    if (isBloqueado) return;
    setAdjustedQuantities((prev) => ({
      ...prev,
      [`${itemId}-${medId}`]: Math.max(0, parseInt(value) || 0),
    }));
  };

  const toggleBagCheck = (itemId, hasPhysicalDelivery) => {
    if (!hasPhysicalDelivery) return;
    setCheckedBags((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const markAllBags = (validItemsForCheck, val) => {
    const newChecked = { ...checkedBags };
    validItemsForCheck.forEach((item) => {
      newChecked[item._id] = val;
    });
    setCheckedBags(newChecked);
  };

  const confirmReceive = (shipment, confItems, validItemsForCheck) => {
    const allChecked = validItemsForCheck.every(
      (item) => checkedBags[item._id]
    );

    setConfirmation({
      isOpen: true,
      title: 'Finalizar Conferência?',
      message: allChecked
        ? 'Excelente! Todas as sacolas físicas foram conferidas. O estoque será atualizado e as pendências mantidas no sistema.'
        : 'Atenção: Existem sacolas FÍSICAS que não foram marcadas como conferidas. Tem certeza que deseja finalizar agora?',
      confirmText: 'Confirmar e Atualizar Estoque',
      isDestructive: !allChecked,
      onConfirm: () => executeReceive(shipment),
    });
  };

  // =========================================================================
  // ⚡ A MÁGICA: ATUALIZAÇÃO OTIMISTA (SEM PRECISAR DE F5)
  // =========================================================================
  const executeReceive = async (shipment) => {
    const loadingToast = toast.loading('A guardar conferência no sistema...');

    try {
      const payloadItems = shipment.items.map((item) => ({
        _id: item._id,
        patientName: item.patientName,
        medications: item.medications.map((med) => {
          const key = `${item._id}-${med._id}`;
          const isFalta =
            med.unitPrice === -1 || med.status?.toLowerCase() === 'falta';
          const isPendente =
            !isFalta && (!med.unitPrice || parseFloat(med.unitPrice) === 0);

          let finalQty = 0;
          if (isFalta || isPendente) {
            finalQty = 0;
          } else {
            finalQty =
              adjustedQuantities[key] !== undefined
                ? adjustedQuantities[key]
                : med.quantity || 0;
          }

          return { ...med, receivedQuantity: finalQty };
        }),
      }));

      // 1. Manda a API guardar os dados
      await api.put(`/shipments/${shipment._id}/receive`, {
        items: payloadItems,
      });

      // 2. ATUALIZAÇÃO OTIMISTA: Força a remessa a ficar como 'finalizado' instantaneamente na memória da tela!
      setShipments((prevShipments) =>
        prevShipments.map((s) =>
          s._id === shipment._id ? { ...s, status: 'finalizado' } : s
        )
      );

      // 3. Limpa os modais e muda de aba imediatamente, para dar a sensação de velocidade
      setConfirmation({ ...confirmation, isOpen: false });
      setExpandedId(null);
      setActiveTab('completed');

      toast.success('Conferência realizada com sucesso!', { id: loadingToast });

      // 4. Dá 1,5 segundos para o Banco de Dados terminar de calcular o stock no fundo
      // E só então manda o App.jsx e a página atualizar os dados verdadeiros silenciosamente
      setTimeout(() => {
        fetchShipments(); // Atualiza a página atual em silêncio
        if (typeof onGlobalUpdate === 'function') {
          onGlobalUpdate(); // Atualiza o App.jsx inteiro em silêncio
        }
      }, 1500);
    } catch (error) {
      toast.error('Erro ao registrar conferência.', { id: loadingToast });
      setConfirmation({ ...confirmation, isOpen: false });
    }
  };

// --- FILTRO BLINDADO DE REMESSAS ---
  const filteredShipments = shipments.filter((s) => {
    // 1. Força o status para minúsculo para evitar bugs de digitação do banco de dados
    const status = String(s.status || '').toLowerCase();
    
    // 2. Agrupa tudo que significa "Aberto" na aba incoming
    const isTabMatch =
      activeTab === 'incoming'
        ? ['aguardando_conferencia', 'parcial', 'pendente', 'aguardando'].includes(status)
        : ['finalizado', 'concluido', 'entregue', 'recebido'].includes(status);

    const matchesSearch =
      (s.supplier || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.code || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    return isTabMatch && matchesSearch;
  });
  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col font-sans text-slate-800 overflow-hidden">
      {/* HEADER FIXO SUPERIOR */}
      <div className="bg-white border-b border-slate-200 shrink-0 px-6 py-5 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-200">
                <FiCheckSquare size={26} />
              </div>
              Conferência de Recebimento
            </h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">
              Conferência rápida, bipagem e controlo de stock físico.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-fit shadow-inner border border-slate-200/50">
              <button
                onClick={() => {
                  setActiveTab('incoming');
                  setExpandedId(null);
                }}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'incoming'
                    ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                <FiTruck size={16} /> Pendentes
              </button>
              <button
                onClick={() => {
                  setActiveTab('completed');
                  setExpandedId(null);
                }}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'completed'
                    ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                <FiCheckCircle size={16} /> Histórico
              </button>
            </div>

            <div className="relative w-full md:w-80">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar fornecedor ou código..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ÁREA DE ROLAGEM DE CONTEÚDO */}
      <div className="flex-1 min-h-0 w-full max-w-[1600px] mx-auto p-6 flex flex-col relative overflow-hidden">
        <div className="absolute inset-x-6 inset-y-6 overflow-y-auto custom-scrollbar pr-2 pb-10">
          {filteredShipments.map((shipment) => {
            const isExpanded = expandedId === shipment._id;
            const supplierInfo = parseSupplierData(
              shipment.observations,
              shipment
            );
            const confItems = getConferenceItems(shipment.items);

            const validItemsForCheck = confItems.filter(
              checkItemHasPhysicalDelivery
            );
            const checkedCount = validItemsForCheck.filter(
              (i) => checkedBags[i._id]
            ).length;
            const pendingCount = validItemsForCheck.length - checkedCount;
            const isAllChecked =
              checkedCount === validItemsForCheck.length &&
              validItemsForCheck.length > 0;
            const isPerfectDelivery = checkIsPerfectDelivery(confItems);

            return (
              <div
                key={shipment._id}
                className={`mb-4 bg-white rounded-2xl border transition-all duration-300 ${isExpanded ? 'border-emerald-400 shadow-xl shadow-emerald-500/5' : 'border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md'}`}
              >
                {/* CABEÇALHO DO CARD */}
                <div
                  onClick={() => handleExpand(shipment._id)}
                  className="p-5 md:p-6 flex flex-col md:flex-row justify-between md:items-center gap-4 cursor-pointer select-none relative overflow-hidden group bg-gradient-to-br from-white to-slate-50 rounded-t-2xl"
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shadow-sm ${
                        activeTab === 'completed'
                          ? 'bg-emerald-100 text-emerald-600'
                          : isExpanded
                            ? 'bg-emerald-500 text-white shadow-emerald-200'
                            : 'bg-white border border-slate-200 text-slate-400 group-hover:border-emerald-300 group-hover:text-emerald-500'
                      }`}
                    >
                      {activeTab === 'completed' ? (
                        <FiCheckCircle size={28} />
                      ) : (
                        <FiBox size={28} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none group-hover:text-emerald-700 transition-colors">
                        {shipment.supplier}
                      </h3>

                      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                        <span className="bg-white text-slate-600 px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border border-slate-200 shadow-sm">
                          Ref: {shipment.code}
                        </span>

                        {activeTab === 'incoming' &&
                          validItemsForCheck.length > 0 && (
                            <span
                              className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md border shadow-sm ${
                                isAllChecked
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                              }`}
                            >
                              {pendingCount} Pendentes
                            </span>
                          )}

                        {activeTab === 'completed' && (
                          <span
                            className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md border shadow-sm flex items-center gap-1.5 ${
                              isPerfectDelivery
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}
                          >
                            {isPerfectDelivery ? (
                              <>
                                <FiCheck size={12} /> ENTREGA TOTAL
                              </>
                            ) : (
                              <>
                                <FiAlertCircle size={12} /> TEVE PENDÊNCIAS
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 relative z-10">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">
                        Progresso Físico
                      </p>
                      <p className="font-black text-slate-800 text-2xl leading-none">
                        {checkedCount}
                        <span className="text-slate-300 text-lg">
                          /{validItemsForCheck.length}
                        </span>
                      </p>
                    </div>
                    <div
                      className={`p-2.5 rounded-full transition-all duration-300 ${
                        isExpanded
                          ? 'rotate-180 bg-emerald-100 text-emerald-600 shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-400 group-hover:bg-slate-50'
                      }`}
                    >
                      <FiChevronDown size={20} />
                    </div>
                  </div>
                </div>

                {/* CONTEÚDO EXPANDIDO */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 p-4 md:p-6 rounded-b-2xl animate-in slide-in-from-top-2 duration-300 relative">
                    {/* BARRA DE AÇÕES */}
                    {activeTab === 'incoming' && confItems.length > 0 && (
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex flex-1 sm:flex-none gap-3">
                          {validItemsForCheck.length > 0 ? (
                            <button
                              onClick={() =>
                                markAllBags(validItemsForCheck, !isAllChecked)
                              }
                              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer active:scale-95 ${
                                isAllChecked
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              {isAllChecked
                                ? 'Desmarcar Todos'
                                : 'Marcar Todos como OK'}
                            </button>
                          ) : (
                            <span className="text-sm font-bold text-amber-600 flex items-center gap-2 px-2">
                              <FiClock size={16} /> Apenas pendências
                              informativas
                            </span>
                          )}
                        </div>
                        <div className="flex flex-1 sm:flex-none items-center gap-3">
                          {validItemsForCheck.length > 0 && (
                            <button
                              onClick={() => setHideChecked(!hideChecked)}
                              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95 ${
                                hideChecked
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <FiFilter size={14} />
                              {hideChecked
                                ? 'Mostrando só Pendentes'
                                : 'Ocultar Conferidos'}
                            </button>
                          )}
                          <button
                            onClick={() =>
                              generateShipmentPDF(shipment, 'conference')
                            }
                            className="bg-slate-800 text-white hover:bg-slate-900 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer active:scale-95"
                          >
                            <FiPrinter size={16} /> Imprimir Relatório
                          </button>
                        </div>
                      </div>
                    )}

                    {/* BARRA DE AÇÃO HISTÓRICO */}
                    {activeTab === 'completed' && (
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Remessa Finalizada
                          </span>
                          <p className="text-sm font-bold text-slate-700">
                            A visualizar dados do histórico original
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            generateShipmentPDF(shipment, 'conference')
                          }
                          className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer active:scale-95"
                        >
                          <FiPrinter size={18} /> Descarregar Relatório Original
                        </button>
                      </div>
                    )}

                    {/* BUSCA INTERNA DE PACIENTE */}
                    {activeTab === 'incoming' && confItems.length > 0 && (
                      <div className="relative w-full mb-6">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Buscar paciente na lista (para bipagem rápida)..."
                          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
                          value={patientSearchTerm}
                          onChange={(e) => setPatientSearchTerm(e.target.value)}
                          autoFocus
                        />
                      </div>
                    )}

                    {/* LISTAGEM DE ITENS */}
                    {confItems.length === 0 ? (
                      <div className="text-center py-10">
                        <p className="font-black text-slate-500 text-lg">
                          Lista vazia.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {confItems
                          .filter((item) =>
                            item.patientName
                              .toLowerCase()
                              .includes(patientSearchTerm.toLowerCase())
                          )
                          .filter((item) => {
                            if (!hideChecked) return true;
                            const hasPhysicalDelivery =
                              checkItemHasPhysicalDelivery(item);
                            if (!hasPhysicalDelivery) return true;
                            return !checkedBags[item._id];
                          })
                          .map((item) => {
                            const hasPhysicalDelivery =
                              checkItemHasPhysicalDelivery(item);
                            const isChecked = checkedBags[item._id];

                            return (
                              <div
                                key={item._id}
                                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                                  !hasPhysicalDelivery
                                    ? 'border-amber-200 bg-amber-50/20 shadow-none'
                                    : isChecked
                                      ? 'border-emerald-300 shadow-sm opacity-70 hover:opacity-100'
                                      : 'border-slate-200 shadow-md hover:border-emerald-400'
                                }`}
                              >
                                <div
                                  className={`px-5 py-4 flex items-center justify-between transition-colors ${
                                    !hasPhysicalDelivery
                                      ? 'bg-amber-50'
                                      : isChecked
                                        ? 'bg-emerald-50'
                                        : 'bg-white hover:bg-slate-50'
                                  }`}
                                  onClick={() =>
                                    activeTab === 'incoming' &&
                                    toggleBagCheck(
                                      item._id,
                                      hasPhysicalDelivery
                                    )
                                  }
                                  style={{
                                    cursor:
                                      hasPhysicalDelivery &&
                                      activeTab === 'incoming'
                                        ? 'pointer'
                                        : 'default',
                                  }}
                                >
                                  <div className="flex items-center gap-4">
                                    {activeTab === 'incoming' &&
                                      (hasPhysicalDelivery ? (
                                        <div
                                          className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all shadow-sm ${
                                            isChecked
                                              ? 'bg-emerald-500 border-emerald-500 text-white'
                                              : 'bg-white border-slate-300 text-transparent'
                                          }`}
                                        >
                                          <FiCheck
                                            size={16}
                                            className="stroke-[3px]"
                                          />
                                        </div>
                                      ) : (
                                        <div className="w-6 h-6 flex items-center justify-center text-amber-500">
                                          <FiClock size={20} />
                                        </div>
                                      ))}
                                    <h4
                                      className={`font-black text-base md:text-lg ${
                                        !hasPhysicalDelivery
                                          ? 'text-amber-900'
                                          : isChecked
                                            ? 'text-emerald-900'
                                            : 'text-slate-800'
                                      }`}
                                    >
                                      {item.patientName}
                                    </h4>
                                  </div>

                                  {activeTab === 'incoming' &&
                                    (!hasPhysicalDelivery ? (
                                      <span className="text-[10px] font-black text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-md uppercase tracking-widest flex items-center gap-1 shadow-sm">
                                        100% PENDENTE
                                      </span>
                                    ) : !isChecked ? (
                                      <span className="text-[10px] font-black text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm">
                                        Aguardar Bipagem
                                      </span>
                                    ) : null)}
                                </div>

                                <div
                                  className={`px-5 pb-4 overflow-x-auto ${!hasPhysicalDelivery ? 'opacity-80' : ''}`}
                                >
                                  <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead
                                      className={`text-[10px] font-black uppercase tracking-widest border-b ${
                                        !hasPhysicalDelivery
                                          ? 'text-amber-600/60 border-amber-200'
                                          : 'text-slate-400 border-slate-100'
                                      }`}
                                    >
                                      <tr>
                                        <th className="py-3 pl-2">
                                          Medicamento
                                        </th>
                                        <th className="py-3 text-center">
                                          Status Físico
                                        </th>
                                        <th className="py-3 pr-2 text-right">
                                          Qtd Solicitada / Recebida
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                      {item.medsToConfer.map((med, idx) => {
                                        const isFalta =
                                          med.unitPrice === -1 ||
                                          med.status?.toLowerCase() === 'falta';
                                        const isPendente =
                                          !isFalta &&
                                          (!med.unitPrice ||
                                            parseFloat(med.unitPrice) === 0);
                                        const isBloqueado =
                                          isFalta || isPendente;
                                        const key = `${item._id}-${med._id}`;
                                        const currentQty =
                                          adjustedQuantities[key];

                                        return (
                                          <tr
                                            key={idx}
                                            className={`${isFalta ? 'bg-red-50/30' : isPendente ? 'bg-amber-50/30' : 'hover:bg-slate-50/50 transition-colors'}`}
                                          >
                                            <td className="py-3 pl-2">
                                              <div
                                                className={`font-bold text-base ${isFalta ? 'text-red-500 line-through' : isPendente ? 'text-amber-700' : 'text-slate-700'}`}
                                              >
                                                {med.name}
                                              </div>
                                              {med.observation && (
                                                <div className="text-xs font-medium text-slate-500 mt-0.5">
                                                  <FiInfo className="inline mr-1" />{' '}
                                                  {med.observation}
                                                </div>
                                              )}
                                            </td>

                                            <td className="py-3 text-center">
                                              {isFalta ? (
                                                <span className="bg-white border border-red-200 text-red-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-sm">
                                                  Falta Declarada
                                                </span>
                                              ) : isPendente ? (
                                                <span className="bg-white border border-amber-200 text-amber-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-sm">
                                                  Pendente Fornecedor
                                                </span>
                                              ) : (
                                                <span className="bg-white border border-emerald-200 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-sm">
                                                  Recebido (Caixa)
                                                </span>
                                              )}
                                            </td>

                                            <td className="py-3 pr-2 text-right flex items-center justify-end gap-3">
                                              <span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider bg-slate-100 border border-slate-200 px-2 py-1 rounded-md shadow-sm">
                                                Sol: {med.quantity}{' '}
                                                {getSmartUnitDisplay(
                                                  med.quantity,
                                                  med.unit
                                                )}
                                              </span>

                                              <input
                                                type="number"
                                                min="0"
                                                disabled={
                                                  isBloqueado ||
                                                  activeTab === 'completed'
                                                }
                                                value={
                                                  currentQty !== undefined
                                                    ? currentQty
                                                    : ''
                                                }
                                                onChange={(e) =>
                                                  handleQtyChange(
                                                    item._id,
                                                    med._id,
                                                    isBloqueado,
                                                    e.target.value
                                                  )
                                                }
                                                className={`w-16 text-center font-black rounded-lg py-1.5 border outline-none transition-all shadow-inner ${
                                                  isFalta
                                                    ? 'bg-red-50 text-red-300 border-red-100 cursor-not-allowed'
                                                    : isPendente
                                                      ? 'bg-amber-50 text-amber-300 border-amber-100 cursor-not-allowed'
                                                      : activeTab ===
                                                          'completed'
                                                        ? 'bg-slate-50 text-slate-600 border-slate-200 cursor-default'
                                                        : currentQty <
                                                            med.quantity
                                                          ? 'bg-amber-50 text-amber-700 border-amber-300 focus:ring-2 focus:ring-amber-500/20'
                                                          : 'bg-white text-emerald-700 border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                                                }`}
                                              />

                                              <span className="text-indigo-600 font-black text-[11px] uppercase tracking-widest w-20 text-left bg-indigo-50 border border-indigo-100 px-2 py-1.5 rounded-md text-center shadow-sm">
                                                {getSmartUnitDisplay(
                                                  currentQty,
                                                  med.unit
                                                )}
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}

                    {/* BOTÃO FINALIZAR (STICKY E DESTACADO) */}
                    {activeTab === 'incoming' && confItems.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end sticky bottom-0 bg-slate-50/80 backdrop-blur-md pb-2 z-20">
                        <button
                          onClick={() =>
                            confirmReceive(
                              shipment,
                              confItems,
                              validItemsForCheck
                            )
                          }
                          className={`px-8 py-3.5 rounded-xl font-black text-sm transition-all shadow-lg flex items-center gap-3 cursor-pointer active:scale-95 ${
                            isAllChecked
                              ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/30'
                              : 'bg-slate-800 text-white hover:bg-slate-900 shadow-slate-800/20'
                          }`}
                        >
                          {isAllChecked ? (
                            <FiCheckCircle size={20} />
                          ) : (
                            <FiAlertTriangle
                              size={20}
                              className="text-amber-400"
                            />
                          )}
                          Guardar e Atualizar Stock
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filteredShipments.length === 0 && !loading && (
            <div className="text-center py-28 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm flex flex-col items-center justify-center max-w-2xl mx-auto mt-10">
              <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                {activeTab === 'incoming' ? (
                  <FiBox size={40} className="text-slate-300" />
                ) : (
                  <FiCheckCircle size={40} className="text-slate-300" />
                )}
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                Nenhuma Remessa Encontrada
              </h3>
              <p className="text-slate-500 mt-2 font-medium max-w-sm">
                A aba atual está vazia ou a sua busca não retornou nenhum
                resultado compatível.
              </p>
            </div>
          )}
        </div>
      </div>

      {confirmation.isOpen && (
        <ConfirmModal
          title={confirmation.title}
          message={confirmation.message}
          confirmText={confirmation.confirmText}
          isDestructive={confirmation.isDestructive}
          onConfirm={confirmation.onConfirm}
          onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
          onCancel={() => setConfirmation({ ...confirmation, isOpen: false })}
        />
      )}
    </div>
  );
}
