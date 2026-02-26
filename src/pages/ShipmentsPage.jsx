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
  FiChevronRight,
  FiPrinter,
  FiAlertCircle,
  FiClock,
  FiCheckCircle,
  FiSearch,
  FiExternalLink,
  FiRefreshCw,
  FiEye,
  FiCopy,
  FiFilter,
  FiArrowRight,
  FiMessageSquare, // NOVO ÍCONE ADICIONADO
  FiInfo, // NOVO ÍCONE ADICIONADO
} from 'react-icons/fi';

import AddShipmentItemModal from '../components/common/AddShipmentItemModal';
import CreateShipmentModal from '../components/common/CreateShipmentModal';
import ShipmentSuccessModal from '../components/common/ShipmentSuccessModal';
import { generateShipmentPDF } from '../utils/pdfGenerator';

export default function ShipmentsPage() {
  const [activeTab, setActiveTab] = useState('current');
  const [openShipments, setOpenShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtros Inteligentes e Visão Detalhada
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [selectedHistoryShipment, setSelectedHistoryShipment] = useState(null);

  // Estados dos Modais
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [successModalData, setSuccessModalData] = useState(null);

  // Auto-Refresh Inteligente (Polling)
  useEffect(() => {
    if (activeTab === 'current') fetchOpenShipments(false);
    if (activeTab === 'history') fetchHistory(false);

    const interval = setInterval(() => {
      if (activeTab === 'current') fetchOpenShipments(true);
      if (activeTab === 'history') fetchHistory(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchOpenShipments = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
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
      if (!isBackground) setLoading(false);
    }
  };

  const fetchHistory = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await shipmentService.getHistory();
      setHistory(res.data);

      if (selectedHistoryShipment) {
        const updated = res.data.find(
          (s) => s._id === selectedHistoryShipment._id
        );
        if (updated) setSelectedHistoryShipment(updated);
      }
    } catch (error) {
      if (!isBackground) toast.error('Erro ao carregar histórico de pedidos.');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // --- NOVA FUNÇÃO: COPIAR LINK ---
  const handleCopyLink = (token, e) => {
    if (e) e.stopPropagation();
    const link = `${window.location.origin}/pedidos/ver/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para a área de transferência!', {
      icon: '📋',
      style: { borderRadius: '10px', background: '#333', color: '#fff' },
    });
  };

  // --- FUNÇÕES DE NEGÓCIO ORIGINAIS PRESERVADAS ---
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
              className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer hover:bg-emerald-600 active:scale-95 transition-all w-full"
              onClick={() => {
                toast.dismiss(t.id);
                confirmClose();
              }}
            >
              Confirmar
            </button>
            <button
              className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer hover:bg-slate-200 active:scale-95 transition-all w-full"
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
        toast.error(
          'Erro: Servidor não retornou o link. Tente atualizar a página.'
        );
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
      console.error('❌ ERRO AO FECHAR:', error);
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
    if (!window.confirm('Remover este paciente da lista?')) return;
    try {
      await shipmentService.removeItem(itemId);
      toast.success('Paciente removido da remessa.');
      fetchOpenShipments(true);
    } catch (e) {
      toast.error('Erro ao excluir item.');
    }
  };

  const hasMissingItems = (shipment) => {
    return shipment.items.some((item) =>
      item.medications.some((m) => m.status === 'falta')
    );
  };

  const filteredHistory = history.filter((h) => {
    const matchesSearch =
      h.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.code.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'Aguardando')
      matchesStatus = h.status === 'aguardando_fornecedor';
    if (statusFilter === 'Conferência')
      matchesStatus = h.status === 'aguardando_conferencia';
    if (statusFilter === 'Finalizado')
      matchesStatus = h.status === 'finalizado';

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] p-4 md:p-6 font-sans text-slate-800 animate-in fade-in duration-500 w-full relative">
      {/* ========================================================================= */}
      {/* HEADER FIXO */}
      {/* ========================================================================= */}
      <div className="shrink-0 mb-6">
        <header className="mb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                <FiPackage size={26} />
              </div>
              Gestão de Compras
            </h1>
            <p className="text-slate-500 mt-2 text-sm font-medium">
              Controle completo de requisições logísticas, envios e
              conferências.
            </p>
          </div>

          {activeTab === 'current' && !selectedShipment && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="group bg-slate-900 text-white w-full md:w-auto px-6 py-3.5 rounded-xl font-black hover:bg-indigo-600 flex items-center justify-center gap-3 shadow-xl shadow-slate-200 hover:shadow-indigo-200 transition-all transform active:scale-95 cursor-pointer text-sm tracking-wide"
            >
              <FiPlusCircle className="group-hover:rotate-90 transition-transform duration-300 text-lg" />
              Iniciar Nova Remessa
            </button>
          )}
        </header>

        <div className="flex bg-slate-200/60 p-1.5 rounded-2xl w-full sm:w-fit shadow-inner border border-slate-200/50">
          <button
            onClick={() => {
              setActiveTab('current');
              setSelectedShipment(null);
              setSelectedHistoryShipment(null);
            }}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${activeTab === 'current' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            <FiTruck size={16} /> Em Aberto{' '}
            <span className="hidden sm:inline">(Rascunhos)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              setSelectedShipment(null);
              setSelectedHistoryShipment(null);
            }}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            <FiArchive size={16} /> Histórico{' '}
            <span className="hidden sm:inline">& Status</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ÁREA FLUIDA DE CONTEÚDO (Onde rola) */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-0 flex flex-col relative w-full">
        {/* ========================================================================= */}
        {/* ABA 1: RASCUNHOS EM ABERTO */}
        {/* ========================================================================= */}
        {activeTab === 'current' && !selectedShipment && (
          <div className="absolute inset-0 overflow-y-auto custom-scrollbar pr-2 animate-in slide-in-from-bottom-4 duration-500">
            {openShipments.length === 0 && !loading ? (
              <div className="text-center py-24 border-2 border-dashed border-slate-300 rounded-3xl bg-white shadow-sm flex flex-col items-center justify-center h-full max-h-[400px]">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                  <FiTruck className="text-4xl text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-700 tracking-tight">
                  Nenhum rascunho pendente
                </h3>
                <p className="text-slate-500 mt-2 font-medium max-w-sm">
                  Crie uma nova remessa para começar a agrupar medicamentos e
                  pacientes.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-6 text-indigo-600 font-bold hover:text-indigo-800 transition-colors cursor-pointer flex items-center gap-1 bg-indigo-50 px-4 py-2 rounded-xl active:scale-95"
                >
                  <FiPlusCircle /> Criar Primeira Remessa
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
                {openShipments.map((ship) => (
                  <div
                    key={ship._id}
                    onClick={() => setSelectedShipment(ship)}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:border-indigo-400 transition-all cursor-pointer group flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl active:scale-95"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <FiPackage size={20} />
                        </div>
                        <span className="text-[10px] tracking-widest uppercase font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                          {ship.code}
                        </span>
                      </div>
                      <h3
                        className="font-black text-lg text-slate-800 group-hover:text-indigo-700 transition-colors mb-1 truncate"
                        title={ship.supplier}
                      >
                        {ship.supplier}
                      </h3>
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                        <FiClock size={12} /> Aberto em:{' '}
                        {new Date(ship.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                        {ship.items?.length || 0} Pacientes
                      </span>
                      <div className="text-indigo-600 font-black text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                        EDITAR <FiArrowLeft className="rotate-180" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 1.1: DETALHES DO RASCUNHO (Edição em Tela Cheia) */}
        {/* ========================================================================= */}
        {activeTab === 'current' && selectedShipment && (
          <div className="absolute inset-0 overflow-y-auto custom-scrollbar pr-2 animate-in slide-in-from-right-4 duration-300">
            <button
              onClick={() => setSelectedShipment(null)}
              className="mb-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 flex items-center gap-2 cursor-pointer transition-colors active:scale-95 w-fit bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
            >
              <FiArrowLeft size={16} /> Voltar aos Rascunhos
            </button>

            <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between md:items-center gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-[100px] pointer-events-none"></div>
              <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">
                  {selectedShipment.supplier}
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-black tracking-widest uppercase border border-indigo-100">
                    Ref: {selectedShipment.code}
                  </span>
                  <span className="text-slate-500 text-xs font-bold flex items-center gap-1.5">
                    <FiClock size={14} /> Criado em{' '}
                    {new Date(selectedShipment.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 relative z-10 w-full md:w-auto">
                <button
                  onClick={() => {
                    setItemToEdit(null);
                    setIsAddModalOpen(true);
                  }}
                  className="flex-1 md:flex-none bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-4 py-3 rounded-xl font-black shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all text-sm"
                >
                  <FiPlusCircle size={18} /> Adicionar Paciente
                </button>
                <button
                  onClick={handleCancelShipment}
                  className="bg-white text-red-500 border border-slate-200 hover:border-red-200 hover:bg-red-50 px-4 py-3 rounded-xl font-bold cursor-pointer active:scale-95 transition-all flex items-center justify-center shadow-sm"
                  title="Excluir Rascunho"
                >
                  <FiTrash2 size={20} />
                </button>
                <button
                  onClick={handleCloseShipment}
                  className="flex-1 md:flex-none bg-emerald-500 text-white px-6 py-3 rounded-xl font-black hover:bg-emerald-600 shadow-md shadow-emerald-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all text-sm"
                >
                  <FiCheck size={18} /> Enviar Pedido
                </button>
              </div>
            </div>

            {/* NOVO: QUADRO DE OBSERVAÇÕES NO RASCUNHO (Aviso de Saldo) */}
            {selectedShipment.observations && (
              <div className="mb-6 bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex gap-4 items-start shadow-sm w-full shrink-0">
                <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600 shrink-0">
                  <FiInfo size={20} />
                </div>
                <div className="flex-1">
                  <h5 className="text-xs font-black uppercase tracking-widest text-indigo-800 mb-1">
                    Aviso do Sistema / Observações
                  </h5>
                  <p className="text-sm font-medium text-indigo-700 whitespace-pre-wrap leading-relaxed">
                    {selectedShipment.observations}
                  </p>
                </div>
              </div>
            )}

            {selectedShipment.items.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
                <p className="text-slate-700 font-black text-lg mb-2">
                  Remessa Vazia
                </p>
                <p className="text-sm font-medium text-slate-500 mb-6">
                  Nenhum paciente ou medicamento foi adicionado a este pedido
                  ainda.
                </p>
                <button
                  onClick={() => {
                    setItemToEdit(null);
                    setIsAddModalOpen(true);
                  }}
                  className="bg-indigo-50 text-indigo-600 font-black px-6 py-3 rounded-xl cursor-pointer hover:bg-indigo-100 active:scale-95 transition-all text-sm"
                >
                  + Adicionar Primeiro Paciente
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-6">
                {[...selectedShipment.items]
                  .sort((a, b) => a.patientName.localeCompare(b.patientName))
                  .map((item) => (
                    <div
                      key={item._id}
                      className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 relative group hover:border-indigo-300 hover:shadow-md transition-all flex flex-col"
                    >
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemToEdit(item);
                            setIsAddModalOpen(true);
                          }}
                          className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl cursor-pointer active:scale-95 transition-transform"
                          title="Editar"
                        >
                          <FiEdit3 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteItem(item._id);
                          }}
                          className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl cursor-pointer active:scale-95 transition-transform"
                          title="Remover Paciente"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                      <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-black text-lg">
                          {item.patientName.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="font-black text-slate-800 text-sm max-w-[180px] truncate">
                          {item.patientName}
                        </h3>
                      </div>
                      <ul className="text-sm space-y-2 flex-1">
                        {item.medications.map((med, i) => (
                          <li
                            key={i}
                            className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100"
                          >
                            <span className="font-bold text-slate-600 truncate mr-2 text-xs">
                              {med.name}
                            </span>
                            <span className="font-black text-indigo-700 bg-indigo-100/50 px-2 py-1 rounded-lg text-[10px] shrink-0 border border-indigo-100 uppercase">
                              {med.quantity} {med.unit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 2: HISTÓRICO GERAL (LISTA DE TABELA) */}
        {/* ========================================================================= */}
        {activeTab === 'history' && !selectedHistoryShipment && (
          <div className="absolute inset-0 flex flex-col bg-white rounded-3xl shadow-sm border border-slate-200 animate-in fade-in overflow-hidden w-full">
            <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0">
              <div className="relative w-full xl:w-96 group">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Buscar fornecedor ou código..."
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full xl:w-auto pb-1 xl:pb-0 custom-scrollbar">
                <FiFilter className="text-slate-400 shrink-0 mr-1" />
                {['Todos', 'Aguardando', 'Conferência', 'Finalizado'].map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${statusFilter === status ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {status}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="flex-1 relative overflow-hidden bg-slate-50/30">
              <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
                <table className="min-w-full text-left border-collapse">
                  <thead className="bg-slate-100/80 text-slate-500 text-[10px] uppercase font-black tracking-widest sticky top-0 z-20 backdrop-blur-md border-b border-slate-200">
                    <tr>
                      <th className="p-4">Status</th>
                      <th className="p-4">Fornecedor</th>
                      <th className="p-4">Código Ref.</th>
                      <th className="p-4 hidden sm:table-cell">Atualização</th>
                      <th className="p-4 text-right">Valor Total</th>
                      <th className="p-4 text-center">Ações Rápidas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredHistory.length > 0 ? (
                      filteredHistory.slice(0, 100).map((h) => (
                        <tr
                          key={h._id}
                          onClick={() => setSelectedHistoryShipment(h)}
                          className="group transition-colors cursor-pointer hover:bg-indigo-50/30"
                        >
                          <td className="p-4">
                            {(() => {
                              switch (h.status) {
                                case 'finalizado':
                                  return (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
                                      <FiCheckCircle size={12} /> Finalizado
                                    </span>
                                  );
                                case 'aguardando_conferencia':
                                  return (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm">
                                      <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                      </span>{' '}
                                      Conferência
                                    </span>
                                  );
                                default:
                                  return (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
                                      <FiClock size={12} /> Aguardando
                                      fornecedor
                                    </span>
                                  );
                              }
                            })()}
                          </td>
                          <td className="p-4 font-black text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                            {h.supplier}
                          </td>
                          <td className="p-4 font-mono text-xs font-bold text-slate-400 bg-slate-50 rounded px-2 w-fit">
                            {h.code}
                          </td>
                          <td className="p-4 text-sm font-bold text-slate-600 hidden sm:table-cell">
                            {new Date(
                              h.updatedAt || h.closedAt
                            ).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="p-4 font-black text-slate-800 font-mono text-sm text-right">
                            {(h.totalCost || 0).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </td>

                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {h.status !== 'finalizado' && h.accessToken && (
                                <button
                                  onClick={(e) =>
                                    handleCopyLink(h.accessToken, e)
                                  }
                                  className="p-2 bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer shadow-sm"
                                  title="Copiar Link do Fornecedor"
                                >
                                  <FiCopy size={16} />
                                </button>
                              )}
                              <button className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm">
                                Abrir <FiArrowRight size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          className="p-16 text-center text-slate-400 font-bold"
                        >
                          Nenhum histórico encontrado com este filtro.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 2.1: DETALHES DO HISTÓRICO (VISÃO TELA CHEIA) */}
        {/* ========================================================================= */}
        {activeTab === 'history' && selectedHistoryShipment && (
          <div className="absolute inset-0 flex flex-col bg-slate-50/50 rounded-3xl animate-in slide-in-from-right-4 duration-300 w-full z-10 overflow-y-auto custom-scrollbar">
            <div className="mb-4 shrink-0 px-2">
              <button
                onClick={() => setSelectedHistoryShipment(null)}
                className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 flex items-center gap-2 cursor-pointer transition-colors active:scale-95 w-fit bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
              >
                <FiArrowLeft size={16} /> Voltar ao Histórico
              </button>
            </div>

            <div className="bg-white p-4 md:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col flex-1 mb-6">
              {/* LINHA DO TEMPO */}
              <div className="mb-10 max-w-3xl mx-auto px-4 w-full shrink-0 hidden sm:block">
                <div className="flex items-center w-full">
                  {/* PASSO 1: ENVIADO */}
                  <div className="flex flex-col items-center relative z-10">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-black shadow-md border-2 border-white ring-4 ring-emerald-100">
                      <FiCheck size={20} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-600 mt-3">
                      Enviado
                    </span>

                    {/* NOME DO RESPONSÁVEL E DATA - ENVIADO */}
                    <div className="flex flex-col items-center gap-0.5 mt-1">
                      {(selectedHistoryShipment.closedByName ||
                        selectedHistoryShipment.closedBy?.name ||
                        selectedHistoryShipment.createdByName) && (
                        <span className="text-[10px] font-bold text-slate-500 capitalize text-center bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                          por{' '}
                          {(() => {
                            const name =
                              selectedHistoryShipment.closedByName ||
                              selectedHistoryShipment.closedBy?.name ||
                              selectedHistoryShipment.createdByName ||
                              '';
                            return name.split(' ')[0];
                          })()}
                        </span>
                      )}

                      {(selectedHistoryShipment.closedAt ||
                        selectedHistoryShipment.createdAt) && (
                        <span className="text-[9px] font-bold text-slate-400">
                          {new Date(
                            selectedHistoryShipment.closedAt ||
                              selectedHistoryShipment.createdAt
                          ).toLocaleDateString('pt-BR')}{' '}
                          às{' '}
                          {new Date(
                            selectedHistoryShipment.closedAt ||
                              selectedHistoryShipment.createdAt
                          ).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`flex-1 h-2 mx-2 rounded-full transition-colors duration-500 ${selectedHistoryShipment.status === 'aguardando_conferencia' || selectedHistoryShipment.status === 'finalizado' ? 'bg-emerald-400' : 'bg-slate-200'}`}
                  ></div>

                  {/* PASSO 2: RESPONDIDO / AGUARDANDO */}
                  <div className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shadow-md border-2 border-white transition-all duration-500 ${selectedHistoryShipment.status === 'aguardando_conferencia' || selectedHistoryShipment.status === 'finalizado' ? 'bg-emerald-500 text-white ring-4 ring-emerald-100' : 'bg-slate-200 text-slate-400'}`}
                    >
                      {selectedHistoryShipment.status ===
                        'aguardando_conferencia' ||
                      selectedHistoryShipment.status === 'finalizado' ? (
                        <FiCheck size={20} />
                      ) : (
                        '2'
                      )}
                    </div>
                    <span
                      className={`text-xs font-black uppercase tracking-widest mt-3 transition-colors duration-500 ${selectedHistoryShipment.status === 'aguardando_conferencia' ? 'text-indigo-600 animate-pulse' : selectedHistoryShipment.status === 'finalizado' ? 'text-emerald-600' : 'text-slate-400'}`}
                    >
                      {selectedHistoryShipment.status ===
                      'aguardando_fornecedor'
                        ? 'Aguardando fornecedor'
                        : 'Respondido'}
                    </span>
                    {/* NOME DO RESPONSÁVEL E DATA - RESPONDIDO */}
                    {selectedHistoryShipment.status !==
                      'aguardando_fornecedor' &&
                      selectedHistoryShipment.observations &&
                      selectedHistoryShipment.observations.includes(
                        'Responsável do Fornecedor:'
                      ) && (
                        <div className="flex flex-col items-center gap-0.5 mt-1">
                          <span className="text-[10px] font-bold text-slate-500 capitalize text-center bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                            por{' '}
                            {
                              selectedHistoryShipment.observations
                                .split('Responsável do Fornecedor:')[1]
                                .split('\n')[0]
                                .trim()
                                .split(' ')[0]
                            }
                          </span>
                          {selectedHistoryShipment.updatedAt && (
                            <span className="text-[9px] font-bold text-slate-400">
                              {new Date(
                                selectedHistoryShipment.updatedAt
                              ).toLocaleDateString('pt-BR')}{' '}
                              às{' '}
                              {new Date(
                                selectedHistoryShipment.updatedAt
                              ).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                      )}
                  </div>

                  <div
                    className={`flex-1 h-2 mx-2 rounded-full transition-colors duration-500 ${selectedHistoryShipment.status === 'finalizado' ? 'bg-emerald-400' : 'bg-slate-200'}`}
                  ></div>

                  {/* PASSO 3: CONFERIDO */}
                  <div className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shadow-md border-2 border-white transition-all duration-500 ${selectedHistoryShipment.status === 'finalizado' ? 'bg-emerald-500 text-white ring-4 ring-emerald-100' : 'bg-slate-200 text-slate-400'}`}
                    >
                      {selectedHistoryShipment.status === 'finalizado' ? (
                        <FiCheck size={20} />
                      ) : (
                        '3'
                      )}
                    </div>
                    <span
                      className={`text-xs font-black uppercase tracking-widest mt-3 transition-colors duration-500 ${selectedHistoryShipment.status === 'finalizado' ? 'text-emerald-600' : 'text-slate-400'}`}
                    >
                      Conferido
                    </span>
                    {/* NOME DO CONFERENTE E DATA - CONFERIDO */}
                    {selectedHistoryShipment.status === 'finalizado' &&
                      (selectedHistoryShipment.receivedByName ||
                        selectedHistoryShipment.receivedBy?.name) && (
                        <div className="flex flex-col items-center gap-0.5 mt-1">
                          <span className="text-[10px] font-bold text-slate-500 capitalize text-center bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                            por{' '}
                            {selectedHistoryShipment.receivedByName
                              ? selectedHistoryShipment.receivedByName.split(
                                  ' '
                                )[0]
                              : selectedHistoryShipment.receivedBy.name.split(
                                  ' '
                                )[0]}
                          </span>
                          {(selectedHistoryShipment.closedAt ||
                            selectedHistoryShipment.updatedAt) && (
                            <span className="text-[9px] font-bold text-slate-400">
                              {new Date(
                                selectedHistoryShipment.closedAt ||
                                  selectedHistoryShipment.updatedAt
                              ).toLocaleDateString('pt-BR')}{' '}
                              às{' '}
                              {new Date(
                                selectedHistoryShipment.closedAt ||
                                  selectedHistoryShipment.updatedAt
                              ).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* CABEÇALHO INTERNO COM OS BOTÕES REFORMULADOS */}
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6 bg-slate-50 p-5 md:p-6 rounded-2xl border border-slate-100 shrink-0 w-full">
                <div className="w-full xl:w-auto">
                  <h4 className="font-black text-xl text-slate-800 flex flex-wrap items-center gap-3 mb-2">
                    <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
                      <FiPackage size={20} />
                    </div>
                    {selectedHistoryShipment.supplier}
                    <span className="text-xs font-mono font-bold bg-white text-slate-500 px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                      REF: {selectedHistoryShipment.code}
                    </span>
                  </h4>

                  {selectedHistoryShipment.status !== 'finalizado' &&
                    selectedHistoryShipment.accessToken && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <a
                          href={`${window.location.origin}/pedidos/ver/${selectedHistoryShipment.accessToken}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2.5 rounded-xl border border-indigo-200 font-bold text-xs transition-colors cursor-pointer"
                        >
                          <FiExternalLink size={14} /> Abrir Link Público
                        </a>
                        <button
                          onClick={() =>
                            handleCopyLink(selectedHistoryShipment.accessToken)
                          }
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 text-white hover:bg-slate-900 px-4 py-2.5 rounded-xl shadow-md font-bold text-xs transition-transform active:scale-95 cursor-pointer"
                        >
                          <FiCopy size={14} /> Copiar Link (WhatsApp)
                        </button>
                      </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                  {/* BOTÃO DE RECOMPRA OCULTADO (O sistema já faz isso automático agora) */}
                  {/*
                  {hasMissingItems(selectedHistoryShipment) && (
                    <button
                      onClick={() =>
                        handleReorderMissingItems(selectedHistoryShipment)
                      }
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 font-black text-xs md:text-sm border border-amber-200 transition-all cursor-pointer active:scale-95 shadow-sm"
                    >
                      <FiRefreshCw /> RECOMPRA
                    </button>
                  )}
                  */}

                  <button
                    onClick={() =>
                      generateShipmentPDF(selectedHistoryShipment, 'vendor')
                    }
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-white text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-xs md:text-sm cursor-pointer active:scale-95 shadow-sm transition-all"
                  >
                    <FiPrinter /> PDF Pedido
                  </button>
                  <button
                    onClick={() =>
                      generateShipmentPDF(selectedHistoryShipment, 'conference')
                    }
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold text-xs md:text-sm cursor-pointer active:scale-95 shadow-sm transition-all border border-slate-200"
                  >
                    <FiPrinter /> PDF Conferência
                  </button>
                </div>
              </div>

              {/* NOVO: QUADRO DE OBSERVAÇÕES / RESPONSÁVEL NO HISTÓRICO */}
              {selectedHistoryShipment.observations && (
                <div className="mb-6 bg-amber-50 border border-amber-200 p-5 rounded-2xl flex gap-4 items-start shadow-sm w-full shrink-0">
                  <div className="bg-amber-100 p-2 rounded-xl text-amber-600 shrink-0">
                    <FiMessageSquare size={20} />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-xs font-black uppercase tracking-widest text-amber-800 mb-1">
                      Responsável / Observações
                    </h5>
                    <p className="text-sm font-medium text-amber-700 whitespace-pre-wrap leading-relaxed">
                      {selectedHistoryShipment.observations}
                    </p>
                  </div>
                </div>
              )}

              {/* LISTAGEM DOS PACIENTES DO HISTÓRICO TOTALMENTE RECUPERADA */}
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-6 w-full pb-4">
                {[...selectedHistoryShipment.items].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-all hover:border-indigo-200"
                  >
                    <div className="font-black text-slate-800 border-b border-slate-100 pb-4 mb-5 flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-lg shadow-inner">
                        {item.patientName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-base truncate">
                        {item.patientName}
                      </span>
                    </div>
                    <ul className="space-y-3 flex-1">
                      {item.medications.map((med, mIdx) => (
                        <li
                          key={mIdx}
                          className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100"
                        >
                          <span className="font-bold text-sm flex items-center gap-2 truncate pr-2">
                            {med.status === 'falta' ? (
                              <span className="text-red-600 flex items-center gap-2 truncate">
                                <span className="w-2 h-2 bg-red-500 rounded-full shrink-0"></span>{' '}
                                {med.name}
                              </span>
                            ) : (
                              <span className="text-slate-700 flex items-center gap-2 truncate">
                                <span className="w-2 h-2 bg-indigo-500 rounded-full shrink-0"></span>{' '}
                                {med.name}
                              </span>
                            )}
                          </span>
                          {med.status === 'falta' ? (
                            <span className="text-[10px] font-black uppercase bg-red-100 text-red-700 px-2 py-1.5 rounded-lg shrink-0">
                              Falta
                            </span>
                          ) : (
                            <span className="font-black font-mono text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs shadow-sm shrink-0">
                              {(med.totalPrice || 0).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAIS (MANTIDOS INALTERADOS) */}
      {/* ========================================================================= */}
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
