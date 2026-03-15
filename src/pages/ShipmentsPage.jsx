import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { shipmentService } from '../services/api';
import api from '../services/api';
import {
  FiPackage,
  FiTruck,
  FiPlusCircle,
  FiArchive,
  FiEdit3,
  FiTrash2,
  FiCheck,
  FiArrowLeft,
  FiPrinter,
  FiClock,
  FiCheckCircle,
  FiSearch,
  FiExternalLink,
  FiCopy,
  FiFilter,
  FiArrowRight,
  FiMessageSquare,
  FiCheckSquare,
  FiCalendar,
  FiChevronRight,
  FiRefreshCw,
} from 'react-icons/fi';

import AddShipmentItemModal from '../components/common/AddShipmentItemModal';
import CreateShipmentModal from '../components/common/CreateShipmentModal';
import ShipmentSuccessModal from '../components/common/ShipmentSuccessModal';
import { generateShipmentPDF } from '../utils/pdfGenerator';

export default function ShipmentsPage() {
  // =========================================================================
  // 📦 ESTADOS GLOBAIS DA TELA
  // =========================================================================
  const [activeTab, setActiveTab] = useState('current'); // Controla a aba (não usamos currentView aqui)
  const [openShipments, setOpenShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [history, setHistory] = useState([]);

  // Estados de Loading e Sincronização em Tempo Real
  const [loading, setLoading] = useState(false);
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);

  // Estados de Busca e Filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [selectedHistoryShipment, setSelectedHistoryShipment] = useState(null);

  // Estados dos Modais
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [successModalData, setSuccessModalData] = useState(null);

  // =========================================================================
  // 🌟 FUNÇÕES DE TRATAMENTO DE DADOS
  // =========================================================================

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Data não registrada';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date
      .toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      .replace(', ', ' às ');
  };

  const parseSupplierData = (obsString, shipment) => {
    let name = shipment?.supplier || 'Fornecedor';
    let date = formatDateTime(shipment?.updatedAt || shipment?.createdAt);
    let text = 'Sem observações adicionais.';

    if (obsString) {
      const nameMatchNew = obsString.match(/\[Responsável:\s*(.*?)\]/);
      const nameMatchOld = obsString.match(
        /Responsável do Fornecedor:\s*(.*?)(?:\n|$)/
      );

      if (nameMatchNew) name = nameMatchNew[1];
      else if (nameMatchOld) name = nameMatchOld[1];

      const dateMatch = obsString.match(/\[Atualizado em:\s*(.*?)\]/);
      if (dateMatch) date = formatDateTime(dateMatch[1]);

      const cleanedText = obsString
        .replace(/\[Responsável:.*?\]\n?/g, '')
        .replace(/\[Atualizado em:.*?\]\n?/g, '')
        .replace(/Responsável do Fornecedor:.*?\n?/g, '')
        .replace(/Observações:\s*/g, '')
        .trim();

      if (cleanedText) text = cleanedText;
    }

    return { name, date, text };
  };

  const getShipmentProgress = (shipment) => {
    let total = 0;
    let resolved = 0;
    shipment?.items?.forEach((p) => {
      p.medications?.forEach((m) => {
        total++;
        if (
          parseFloat(m.unitPrice) > 0 ||
          m.unitPrice === -1 ||
          m.status === 'falta'
        ) {
          resolved++;
        }
      });
    });
    const percent = total === 0 ? 0 : Math.round((resolved / total) * 100);
    return { total, resolved, percent };
  };

  // =========================================================================
  // 🔄 LIFECYCLE E FETCHES (COM ATUALIZAÇÃO EM TEMPO REAL)
  // =========================================================================

  useEffect(() => {
    if (activeTab === 'current') fetchOpenShipments(false);
    if (activeTab === 'history') fetchHistory(false);

    // Motor de Atualização Silenciosa a cada 15s
    const interval = setInterval(() => {
      if (activeTab === 'current') fetchOpenShipments(true);
      if (activeTab === 'history') fetchHistory(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchOpenShipments = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsBackgroundSyncing(true);

    try {
      const res = await shipmentService.getOpen();
      const data = Array.isArray(res.data)
        ? res.data
        : res.data
          ? [res.data]
          : [];
      setOpenShipments(data);

      if (selectedShipment) {
        const updated = data.find((s) => s._id === selectedShipment._id);
        if (updated) setSelectedShipment(updated);
        else setSelectedShipment(null);
      }
    } catch (error) {
      if (!isBackground)
        toast.error('Não foi possível carregar as remessas abertas.');
    } finally {
      setLoading(false);
      setIsBackgroundSyncing(false);
    }
  };

  const fetchHistory = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsBackgroundSyncing(true);

    try {
      const res = await shipmentService.getHistory();

      const historyData = Array.isArray(res.data) ? res.data : [];
      setHistory(historyData);

      if (selectedHistoryShipment) {
        const updated = historyData.find(
          (s) => s._id === selectedHistoryShipment._id
        );
        if (updated) setSelectedHistoryShipment(updated);
      }
    } catch (error) {
      if (!isBackground) toast.error('Erro ao carregar histórico de pedidos.');
    } finally {
      setLoading(false);
      setIsBackgroundSyncing(false);
    }
  };

  // =========================================================================
  // ⚡ AÇÕES E EVENTOS
  // =========================================================================

  const handleCopyLink = (token, e) => {
    if (e) e.stopPropagation();
    const link = `${window.location.origin}/pedidos/ver/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!', {
      style: { borderRadius: '10px', background: '#333', color: '#fff' },
    });
  };

  const handleCloseShipment = async () => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3 p-1">
          <span className="font-black text-slate-800 text-base">
            Encerrar e Gerar Link?
          </span>
          <span className="text-sm text-slate-600 font-medium">
            Isso fechará o pedido e permitirá enviar ao fornecedor.
          </span>
          <div className="flex gap-2 mt-2">
            <button
              className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-600 active:scale-95 transition-all w-full"
              onClick={() => {
                toast.dismiss(t.id);
                confirmClose();
              }}
            >
              Confirmar
            </button>
            <button
              className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 active:scale-95 transition-all w-full"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancelar
            </button>
          </div>
        </div>
      ),
      { duration: 5000, icon: '🔒' }
    );
  };

  const confirmClose = async () => {
    try {
      const res = await api.put('/shipments/close', {
        shipmentId: selectedShipment._id,
      });
      const responseData = res.data || res;
      const tokenReal =
        responseData.token ||
        (responseData.shipment && responseData.shipment.accessToken);

      if (!tokenReal) {
        toast.error('Erro: Servidor não retornou o link.');
        return;
      }

      const successData = {
        ...responseData.shipment,
        token: tokenReal,
        link: `${window.location.origin}/pedidos/ver/${tokenReal}`,
      };

      toast.success('Sucesso! O link para o fornecedor foi gerado.');
      setSelectedShipment(null);
      fetchOpenShipments(false);
      setActiveTab('history');
      setSuccessModalData(successData);
    } catch (error) {
      toast.error('Erro ao processar fechamento.');
    }
  };

  const handleCancelShipment = async () => {
    if (!window.confirm('ATENÇÃO: Isso excluirá todo o rascunho. Tem certeza?'))
      return;
    try {
      await api.delete('/shipments/cancel', {
        data: { shipmentId: selectedShipment._id },
      });
      toast.success('Rascunho descartado.');
      setSelectedShipment(null);
      fetchOpenShipments(false);
    } catch (error) {
      toast.error('Erro ao cancelar.');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Remover este paciente?')) return;
    try {
      await shipmentService.removeItem(itemId);
      toast.success('Paciente removido da remessa.');
      fetchOpenShipments(true);
    } catch (e) {
      toast.error('Erro ao excluir item.');
    }
  };

  // Filtro de Histórico
  const filteredHistory = Array.isArray(history)
    ? history.filter((h) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          (h.supplier || '').toLowerCase().includes(searchLower) ||
          (h.code || '').toLowerCase().includes(searchLower);

        let matchesStatus = true;
        if (statusFilter === 'Aguardando')
          matchesStatus = h.status === 'aguardando_fornecedor';
        if (statusFilter === 'Conferência')
          matchesStatus = h.status === 'aguardando_conferencia';
        if (statusFilter === 'Finalizado')
          matchesStatus = h.status === 'finalizado';

        return matchesSearch && matchesStatus;
      })
    : [];

  // =========================================================================
  // 🎨 RENDERIZAÇÃO PRINCIPAL (100% TELA CHEIA)
  // =========================================================================

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col font-sans text-slate-800 overflow-hidden">
      {/* ================= HEADER SUPERIOR ================= */}
      <div className="bg-white border-b border-slate-200 shrink-0 px-6 py-5 shadow-sm z-30 relative">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                <FiPackage size={26} />
              </div>
              Gestão de Compras
            </h1>
            <p className="text-slate-500 mt-1 text-sm font-medium flex items-center gap-2">
              Controle de requisições, envios para fornecedores e conferências.
              {isBackgroundSyncing && (
                <span className="text-indigo-500 flex items-center gap-1 text-xs bg-indigo-50 px-2 py-0.5 rounded-md animate-pulse border border-indigo-100">
                  <FiRefreshCw className="animate-spin" size={10} />{' '}
                  Sincronizando...
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-fit shadow-inner border border-slate-200/50">
              <button
                onClick={() => {
                  setActiveTab('current');
                  setSelectedShipment(null);
                  setSelectedHistoryShipment(null);
                }}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${activeTab === 'current' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
              >
                <FiTruck size={16} /> Em Aberto
              </button>
              <button
                onClick={() => {
                  setActiveTab('history');
                  setSelectedShipment(null);
                  setSelectedHistoryShipment(null);
                }}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
              >
                <FiArchive size={16} /> Histórico
              </button>
            </div>

            {activeTab === 'current' && !selectedShipment && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="group bg-indigo-600 text-white w-full md:w-auto px-6 py-3 rounded-xl font-black hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all transform active:scale-95 cursor-pointer text-sm"
              >
                <FiPlusCircle className="group-hover:rotate-90 transition-transform duration-300 text-lg" />
                Nova Remessa
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= ÁREA DE CONTEÚDO ================= */}
      <div className="flex-1 min-h-0 w-full max-w-[1600px] mx-auto p-6 flex flex-col relative overflow-hidden">
        {/* ABA 1: RASCUNHOS EM ABERTO */}
        {activeTab === 'current' && !selectedShipment && (
          <div className="absolute inset-x-6 inset-y-6 overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-4 duration-500 pb-10">
            {openShipments.length === 0 && !loading ? (
              <div className="text-center py-32 border-2 border-dashed border-slate-300 rounded-3xl bg-white shadow-sm flex flex-col items-center justify-center max-w-2xl mx-auto">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                  <FiTruck className="text-5xl text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                  Nenhuma remessa em aberto
                </h3>
                <p className="text-slate-500 mt-2 font-medium">
                  Inicie uma nova remessa para agrupar medicamentos e gerar o
                  pedido.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-8 text-white font-bold bg-slate-800 hover:bg-slate-900 px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 active:scale-95 shadow-lg shadow-slate-200"
                >
                  <FiPlusCircle size={20} /> Criar Primeira Remessa
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {openShipments.map((ship) => (
                  <div
                    key={ship._id}
                    onClick={() => setSelectedShipment(ship)}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-400 hover:shadow-xl transition-all cursor-pointer group flex flex-col overflow-hidden hover:-translate-y-1"
                  >
                    <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-white to-slate-50">
                      <div className="flex justify-between items-start mb-3">
                        <div className="bg-indigo-100 text-indigo-600 p-2.5 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                          <FiTruck size={20} />
                        </div>
                        <span className="text-[10px] tracking-widest uppercase font-black text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
                          {ship.code}
                        </span>
                      </div>
                      <h3
                        className="font-black text-xl text-slate-800 group-hover:text-indigo-700 transition-colors line-clamp-2 leading-tight"
                        title={ship.supplier}
                      >
                        {ship.supplier}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-3 text-xs font-bold text-slate-400">
                        <FiCalendar size={12} className="text-slate-300" />
                        Criado:{' '}
                        {formatDateTime(ship.createdAt).split(' às ')[0]}
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between bg-white">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                            Pacientes Inclusos
                          </span>
                          <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                            {ship.items?.length || 0}
                          </span>
                        </div>
                        {ship.items && ship.items.length > 0 ? (
                          <div className="flex -space-x-2 overflow-hidden mt-2 py-1">
                            {ship.items.slice(0, 5).map((item, idx) => (
                              <div
                                key={idx}
                                className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600 shadow-sm"
                                title={item.patientName}
                              >
                                {item.patientName.substring(0, 2).toUpperCase()}
                              </div>
                            ))}
                            {ship.items.length > 5 && (
                              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-200">
                                +{ship.items.length - 5}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs font-medium text-slate-400 italic mt-2">
                            Remessa vazia
                          </p>
                        )}
                      </div>
                      <div className="mt-6 flex justify-between items-center text-sm font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        ABRIR RASCUNHO <FiChevronRight size={18} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA 1.1: DETALHES DO RASCUNHO */}
        {activeTab === 'current' && selectedShipment && (
          <div className="absolute inset-x-6 inset-y-6 flex flex-col animate-in slide-in-from-right-4 duration-300 pb-2">
            <button
              onClick={() => setSelectedShipment(null)}
              className="mb-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 flex items-center gap-2 cursor-pointer transition-colors active:scale-95 w-fit bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm shrink-0"
            >
              <FiArrowLeft size={16} /> Voltar ao Painel
            </button>

            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 mb-6 flex flex-col lg:flex-row justify-between lg:items-center gap-6 relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/5 rounded-bl-[150px] pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md text-xs font-black tracking-widest uppercase border border-indigo-200">
                    Ref: {selectedShipment.code}
                  </span>
                  <span className="text-slate-500 text-sm font-bold flex items-center gap-1.5">
                    <FiClock size={14} /> Aberto em{' '}
                    {formatDateTime(selectedShipment.createdAt)}
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                  {selectedShipment.supplier}
                </h2>
              </div>

              <div className="flex flex-wrap gap-3 relative z-10 w-full lg:w-auto">
                <button
                  onClick={() => {
                    setItemToEdit(null);
                    setIsAddModalOpen(true);
                  }}
                  className="flex-1 lg:flex-none bg-white text-indigo-600 border-2 border-indigo-200 hover:border-indigo-600 hover:bg-indigo-50 px-5 py-3 rounded-xl font-black shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  <FiPlusCircle size={20} /> Adicionar Paciente
                </button>
                <button
                  onClick={handleCancelShipment}
                  className="bg-white text-red-500 border-2 border-slate-200 hover:border-red-500 hover:bg-red-50 px-5 py-3 rounded-xl font-bold cursor-pointer active:scale-95 transition-all flex items-center justify-center shadow-sm"
                  title="Excluir Rascunho"
                >
                  <FiTrash2 size={20} />
                </button>
                <button
                  onClick={handleCloseShipment}
                  className="flex-1 lg:flex-none bg-emerald-500 text-white px-8 py-3 rounded-xl font-black hover:bg-emerald-600 shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  <FiCheck size={20} /> Fechar & Gerar Link
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2 pb-4">
              {selectedShipment.items.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
                  <p className="text-slate-800 font-black text-2xl mb-2">
                    Remessa Vazia
                  </p>
                  <p className="text-base font-medium text-slate-500 mb-8 max-w-md mx-auto">
                    Nenhum paciente ou medicamento foi adicionado a este pedido
                    ainda. Comece adicionando o primeiro item.
                  </p>
                  <button
                    onClick={() => {
                      setItemToEdit(null);
                      setIsAddModalOpen(true);
                    }}
                    className="bg-indigo-600 text-white font-black px-8 py-4 rounded-xl cursor-pointer hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200"
                  >
                    + Adicionar Paciente
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[...selectedShipment.items]
                    .sort((a, b) => a.patientName.localeCompare(b.patientName))
                    .map((item) => (
                      <div
                        key={item._id}
                        className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 relative group hover:border-indigo-400 hover:shadow-lg transition-all flex flex-col"
                      >
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemToEdit(item);
                              setIsAddModalOpen(true);
                            }}
                            className="p-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl cursor-pointer active:scale-95 transition-transform"
                            title="Editar"
                          >
                            <FiEdit3 size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItem(item._id);
                            }}
                            className="p-2.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl cursor-pointer active:scale-95 transition-transform"
                            title="Remover"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                        <div className="flex items-center gap-4 mb-5 pr-20">
                          <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-black text-xl border border-slate-200">
                            {item.patientName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-800 text-lg leading-tight">
                              {item.patientName}
                            </h4>
                            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mt-1">
                              {item.medications?.length} Medicamento(s)
                            </p>
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4 flex-1 border border-slate-100">
                          <ul className="space-y-3">
                            {item.medications?.map((m, idx) => (
                              <li
                                key={idx}
                                className="flex justify-between items-start text-sm border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                              >
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-700">
                                    {m.name}
                                  </span>
                                  {m.observation && (
                                    <span className="text-[11px] text-slate-500 font-medium italic mt-0.5">
                                      Obs: {m.observation}
                                    </span>
                                  )}
                                </div>
                                <span className="font-black bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 whitespace-nowrap ml-3">
                                  {m.quantity} {m.unit || 'UN'}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA 2: HISTÓRICO GERAL DE REMESSAS */}
        {activeTab === 'history' && !selectedHistoryShipment && (
          <div className="absolute inset-x-6 inset-y-6 flex flex-col animate-in fade-in duration-300 pb-2">
            <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6 shrink-0 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="relative flex-1 max-w-2xl">
                <FiSearch
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Buscar por fornecedor ou código..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 custom-scrollbar">
                <FiFilter className="text-slate-400 shrink-0 mr-2" />
                {['Todos', 'Aguardando', 'Conferência', 'Finalizado'].map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${statusFilter === status ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {status}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="flex-1 relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
                <table className="min-w-full text-left border-collapse w-full">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-black tracking-widest sticky top-0 z-20 border-b border-slate-200 shadow-sm">
                    <tr>
                      <th className="p-5 whitespace-nowrap">
                        Status / Progresso
                      </th>
                      <th className="p-5">Fornecedor</th>
                      <th className="p-5">Código Ref.</th>
                      <th className="p-5 hidden sm:table-cell">Atualização</th>
                      <th className="p-5 text-right">Valor Total</th>
                      <th className="p-5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHistory.length > 0 ? (
                      filteredHistory.map((h) => (
                        <tr
                          key={h._id}
                          onClick={() => setSelectedHistoryShipment(h)}
                          className="group transition-colors cursor-pointer hover:bg-indigo-50/50"
                        >
                          <td className="p-5">
                            {(() => {
                              const progress = getShipmentProgress(h);
                              if (h.status === 'finalizado') {
                                return (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
                                    <FiCheckCircle size={14} /> FINALIZADO
                                  </span>
                                );
                              }
                              if (h.status === 'aguardando_conferencia') {
                                return (
                                  <div className="flex flex-col gap-1.5 w-32">
                                    <span className="text-[10px] font-black uppercase text-amber-600 flex justify-between">
                                      CONFERÊNCIA{' '}
                                      <span>{progress.percent}%</span>
                                    </span>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                                      <div
                                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                                        style={{
                                          width: `${progress.percent}%`,
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-blue-50 text-blue-600 border border-blue-100">
                                  <FiClock size={14} /> AGUARDANDO
                                </span>
                              );
                            })()}
                          </td>
                          <td className="p-5 font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                            {h.supplier}
                          </td>
                          <td className="p-5">
                            <span className="font-mono text-xs bg-slate-100 px-2.5 py-1 rounded border border-slate-200 text-slate-500">
                              {h.code}
                            </span>
                          </td>
                          <td className="p-5 hidden sm:table-cell text-sm text-slate-500 font-medium">
                            {formatDateTime(h.updatedAt || h.createdAt)}
                          </td>
                          <td className="p-5 text-right font-black text-slate-700">
                            {h.totalCost === undefined || h.totalCost === 0 ? (
                              <span className="text-slate-300">-</span>
                            ) : (
                              <span className="text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                {(h.totalCost || 0).toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                })}
                              </span>
                            )}
                          </td>
                          <td className="p-5 text-center">
                            <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 group-hover:bg-indigo-600 text-slate-600 group-hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm">
                              Abrir <FiChevronRight size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          className="p-20 text-center text-slate-400 font-bold text-lg"
                        >
                          Nenhum histórico encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ABA 2.1: DETALHES DO HISTÓRICO E TIMELINE */}
        {activeTab === 'history' && selectedHistoryShipment && (
          <div className="absolute inset-x-6 inset-y-6 flex flex-col bg-white rounded-3xl animate-in slide-in-from-right-4 duration-300 z-10 overflow-hidden shadow-xl border border-slate-200 pb-2">
            <div className="bg-white z-20 border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
              <button
                onClick={() => setSelectedHistoryShipment(null)}
                className="text-xs font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 flex items-center gap-2 cursor-pointer transition-colors active:scale-95 bg-slate-100 hover:bg-slate-200 px-5 py-2.5 rounded-xl"
              >
                <FiArrowLeft size={16} /> Voltar ao Histórico
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => generateShipmentPDF(selectedHistoryShipment)}
                  className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-5 py-2.5 rounded-xl font-black text-xs transition-colors cursor-pointer border border-indigo-200"
                >
                  <FiPrinter size={16} /> IMPRIMIR PDF
                </button>
              </div>
            </div>

            <div className="p-6 md:p-10 flex flex-col flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              <div className="mb-12 max-w-4xl mx-auto w-full shrink-0">
                <h3 className="text-center text-sm font-black uppercase tracking-widest text-slate-400 mb-8">
                  Rastreamento do Pedido
                </h3>

                <div className="flex items-start w-full relative">
                  <div className="flex flex-col items-center relative z-10 flex-1">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-4 border-white ring-4 ring-emerald-50 mb-3">
                      <FiCheck size={24} />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest text-emerald-700">
                      Enviado
                    </span>
                    <div className="flex flex-col items-center mt-2 w-full px-2 text-center">
                      <span
                        className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 w-full truncate"
                        title={
                          selectedHistoryShipment.closedByName ||
                          selectedHistoryShipment.closedBy?.name ||
                          selectedHistoryShipment.createdByName ||
                          'Sistema'
                        }
                      >
                        {selectedHistoryShipment.closedByName ||
                          selectedHistoryShipment.closedBy?.name ||
                          selectedHistoryShipment.createdByName ||
                          'Sistema'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 mt-1.5 flex items-center gap-1">
                        <FiClock size={10} />{' '}
                        {formatDateTime(
                          selectedHistoryShipment.closedAt ||
                            selectedHistoryShipment.createdAt
                        )}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`absolute top-6 left-[16.66%] right-[50%] h-1.5 -translate-y-1/2 rounded-full transition-colors duration-500 ${selectedHistoryShipment.status !== 'aguardando_fornecedor' ? 'bg-emerald-400' : 'bg-slate-200'}`}
                  ></div>

                  <div className="flex flex-col items-center relative z-10 flex-1">
                    {(() => {
                      const supplierInfo = parseSupplierData(
                        selectedHistoryShipment.observations,
                        selectedHistoryShipment
                      );
                      const isResponded =
                        selectedHistoryShipment.status !==
                        'aguardando_fornecedor';
                      return (
                        <>
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-4 border-white transition-all duration-500 mb-3 ${isResponded ? 'bg-emerald-500 text-white ring-4 ring-emerald-50' : 'bg-slate-200 text-slate-400'}`}
                          >
                            {isResponded ? (
                              <FiCheck size={24} />
                            ) : (
                              <span className="font-black text-lg">2</span>
                            )}
                          </div>
                          <span
                            className={`text-sm font-black uppercase tracking-widest transition-colors duration-500 ${isResponded ? 'text-emerald-700' : 'text-slate-400'}`}
                          >
                            Respondido
                          </span>

                          {isResponded ? (
                            <div className="flex flex-col items-center mt-2 w-full px-2 text-center animate-in zoom-in duration-300">
                              <span
                                className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 w-full truncate"
                                title={supplierInfo.name}
                              >
                                {supplierInfo.name}
                              </span>
                              <span className="text-[11px] font-bold text-slate-500 mt-1.5 flex items-center gap-1">
                                <FiClock size={10} /> {supplierInfo.date}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] font-bold text-slate-400 mt-4 px-4 text-center">
                              Aguardando Fornecedor...
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  <div
                    className={`absolute top-6 left-[50%] right-[16.66%] h-1.5 -translate-y-1/2 rounded-full transition-colors duration-500 ${selectedHistoryShipment.status === 'finalizado' ? 'bg-emerald-400' : 'bg-slate-200'}`}
                  ></div>

                  <div className="flex flex-col items-center relative z-10 flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-4 border-white transition-all duration-500 mb-3 ${selectedHistoryShipment.status === 'finalizado' ? 'bg-emerald-500 text-white ring-4 ring-emerald-50' : 'bg-slate-200 text-slate-400'}`}
                    >
                      {selectedHistoryShipment.status === 'finalizado' ? (
                        <FiCheck size={24} />
                      ) : (
                        <span className="font-black text-lg">3</span>
                      )}
                    </div>
                    <span
                      className={`text-sm font-black uppercase tracking-widest transition-colors duration-500 ${selectedHistoryShipment.status === 'finalizado' ? 'text-emerald-700' : 'text-slate-400'}`}
                    >
                      Conferido
                    </span>

                    {selectedHistoryShipment.status === 'finalizado' && (
                      <div className="flex flex-col items-center mt-2 w-full px-2 text-center animate-in zoom-in duration-300">
                        <span
                          className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 w-full truncate"
                          title={
                            selectedHistoryShipment.receivedByName ||
                            selectedHistoryShipment.receivedBy?.name ||
                            'Usuário'
                          }
                        >
                          {selectedHistoryShipment.receivedByName ||
                            selectedHistoryShipment.receivedBy?.name ||
                            'Usuário'}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600 mt-1.5 flex items-center gap-1">
                          <FiClock size={10} />{' '}
                          {formatDateTime(
                            selectedHistoryShipment.receivedAt ||
                              selectedHistoryShipment.updatedAt
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 shrink-0">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-white text-slate-600 px-3 py-1 rounded-md text-xs font-black tracking-widest uppercase border border-slate-200 shadow-sm">
                      Ref: {selectedHistoryShipment.code}
                    </span>
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md text-xs font-black tracking-widest uppercase border border-indigo-200 shadow-sm">
                      {selectedHistoryShipment.items?.length || 0} Pacientes
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900">
                    {selectedHistoryShipment.supplier}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                  {selectedHistoryShipment.status !== 'finalizado' && (
                    <>
                      <a
                        href={`${window.location.origin}/pedidos/ver/${selectedHistoryShipment.accessToken}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-white text-indigo-600 border border-slate-200 hover:border-indigo-300 px-5 py-3 rounded-xl font-bold text-sm shadow-sm transition-all"
                      >
                        <FiExternalLink size={18} /> Abrir Link Fornecedor
                      </a>
                      <button
                        onClick={() =>
                          handleCopyLink(selectedHistoryShipment.accessToken)
                        }
                        className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-slate-800 text-white hover:bg-slate-900 px-5 py-3 rounded-xl shadow-md font-bold text-sm transition-transform active:scale-95 cursor-pointer"
                      >
                        <FiCopy size={18} /> Copiar Link
                      </button>
                    </>
                  )}
                  {selectedHistoryShipment.status ===
                    'aguardando_conferencia' && (
                    <a
                      href={`/conferencia/${selectedHistoryShipment._id}`}
                      className="w-full xl:w-auto flex items-center justify-center gap-2 bg-emerald-500 text-white hover:bg-emerald-600 px-8 py-3 rounded-xl shadow-lg font-black text-sm transition-transform active:scale-95 cursor-pointer"
                    >
                      <FiCheckSquare size={20} /> Iniciar Conferência
                    </a>
                  )}
                </div>
              </div>

              {(() => {
                const supplierInfo = parseSupplierData(
                  selectedHistoryShipment.observations,
                  selectedHistoryShipment
                );
                if (
                  supplierInfo.text &&
                  supplierInfo.text !== 'Sem observações adicionais.'
                ) {
                  return (
                    <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl mb-8 shrink-0">
                      <h3 className="font-black text-amber-800 text-sm mb-2 flex items-center gap-2">
                        <FiMessageSquare /> Mensagem / Observação do Fornecedor
                      </h3>
                      <p className="text-sm font-medium text-amber-900 whitespace-pre-wrap bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
                        {supplierInfo.text}
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="shrink-0">
                <h3 className="font-black text-lg text-slate-800 mb-4 border-b border-slate-200 pb-2">
                  Detalhes dos Itens
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedHistoryShipment.items.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-indigo-200 transition-colors"
                    >
                      <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white text-slate-700 rounded-full flex items-center justify-center font-black text-xl border border-slate-200 shadow-sm">
                          {item.patientName.charAt(0).toUpperCase()}
                        </div>
                        <h4 className="font-black text-lg text-slate-800">
                          {item.patientName}
                        </h4>
                      </div>
                      <div className="p-0">
                        <table className="w-full text-left text-sm">
                          <tbody className="divide-y divide-slate-100">
                            {item.medications?.map((med, mIndex) => {
                              const isMissing =
                                med.status === 'falta' || med.unitPrice === -1;
                              const isPriced = parseFloat(med.unitPrice) > 0;
                              return (
                                <tr
                                  key={mIndex}
                                  className={
                                    isMissing
                                      ? 'bg-red-50/50'
                                      : 'hover:bg-slate-50'
                                  }
                                >
                                  <td className="p-4 py-3">
                                    <div className="font-bold text-slate-700">
                                      {med.name}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium">
                                      {med.quantity} {med.unit}{' '}
                                      {med.observation
                                        ? `• ${med.observation}`
                                        : ''}
                                    </div>
                                  </td>
                                  <td className="p-4 py-3 text-right">
                                    {isMissing ? (
                                      <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border border-red-200">
                                        Em Falta
                                      </span>
                                    ) : isPriced ? (
                                      <div className="flex flex-col items-end">
                                        <span className="font-black text-slate-800">
                                          {(
                                            parseFloat(med.unitPrice) *
                                            med.quantity
                                          ).toLocaleString('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL',
                                          })}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-bold">
                                          {parseFloat(
                                            med.unitPrice
                                          ).toLocaleString('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL',
                                          })}
                                          /un
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                        -
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAIS ================= */}
      {isCreateModalOpen && (
        <CreateShipmentModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            fetchOpenShipments(false);
          }}
        />
      )}

      {isAddModalOpen && (
        <AddShipmentItemModal
          onClose={() => setIsAddModalOpen(false)}
          initialData={itemToEdit}
          currentShipmentId={selectedShipment?._id}
          onSuccess={() => {
            setIsAddModalOpen(false);
            setItemToEdit(null);
            fetchOpenShipments(false);
            toast.success('Item salvo com sucesso!');
          }}
        />
      )}

      <ShipmentSuccessModal
        isOpen={!!successModalData}
        shipment={successModalData}
        onClose={() => setSuccessModalData(null)}
      />
    </div>
  );
}
