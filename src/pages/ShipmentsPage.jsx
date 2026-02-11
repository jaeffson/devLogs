import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { shipmentService } from '../services/api'; // Mantendo seus imports originais
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
  FiChevronDown,
  FiPrinter,
  FiAlertCircle,
  FiClock,
  FiCheckCircle,
  FiSearch,
  FiShare2,
  FiExternalLink,
  FiRefreshCw, // <--- ÍCONE NOVO IMPORTADO
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

  // Estado para controlar qual linha do histórico está expandida
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  // Estados dos Modais
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  // Estado para abrir o modal de sucesso após fechar remessa
  const [successModalData, setSuccessModalData] = useState(null);

  useEffect(() => {
    if (activeTab === 'current') fetchOpenShipments();
    if (activeTab === 'history') fetchHistory();
  }, [activeTab]);

  const fetchOpenShipments = async () => {
    setLoading(true);
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
      console.error(error);
      toast.error('Não foi possível carregar as remessas abertas.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await shipmentService.getHistory();
      setHistory(res.data);
    } catch (error) {
      toast.error('Erro ao carregar histórico de pedidos.');
    } finally {
      setLoading(false);
    }
  };

  // Toast de confirmação para fechar remessa
  const handleCloseShipment = async () => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <span className="font-bold">Encerrar e Gerar Link?</span>
          <span className="text-sm">
            Isso fechará o pedido e permitirá enviar ao fornecedor.
          </span>
          <div className="flex gap-2 mt-2">
            <button
              className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold cursor-pointer hover:bg-green-700"
              onClick={() => {
                toast.dismiss(t.id);
                confirmClose();
              }}
            >
              Confirmar
            </button>
            <button
              className="bg-gray-200 px-3 py-1 rounded text-sm cursor-pointer hover:bg-gray-300"
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

  // Função Real que fecha a remessa
const confirmClose = async () => {
    try {
      const res = await api.put('/shipments/close', {
        shipmentId: selectedShipment._id,
      });

      // --- CORREÇÃO BLINDADA ---
      // Verifica se os dados vieram em 'res.data' (padrão) ou direto em 'res' (interceptor)
      const responseData = res.data || res;
      
      console.log("📦 DADOS RECEBIDOS:", responseData);

      // Tenta pegar o token de todas as formas possíveis
      const tokenReal = responseData.token || (responseData.shipment && responseData.shipment.accessToken);

      if (!tokenReal) {
          console.error("❌ ERRO: Token sumiu!", responseData);
          toast.error("Erro: Servidor não retornou o link. Tente atualizar a página.");
          return;
      }

      const successData = {
          ...responseData.shipment,
          token: tokenReal,
          link: `${window.location.origin}/pedidos/ver/${tokenReal}`
      };

      toast.success('Sucesso! O link para o fornecedor foi gerado.');

      setSelectedShipment(null);
      fetchOpenShipments();
      setActiveTab('history');
      setSuccessModalData(successData);
      
    } catch (error) {
      console.error("❌ ERRO AO FECHAR:", error);
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
      fetchOpenShipments();
    } catch (error) {
      toast.error('Erro ao cancelar.');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Remover este paciente da lista?')) return;
    try {
      await shipmentService.removeItem(itemId);
      toast.success('Paciente removido da remessa.');
      fetchOpenShipments();
    } catch (e) {
      toast.error('Erro ao excluir item.');
    }
  };

  const toggleHistoryExpand = (id) => {
    if (expandedHistoryId === id) setExpandedHistoryId(null);
    else setExpandedHistoryId(id);
  };

  // --- NOVA LÓGICA: RE-COMPRA INTELIGENTE (BACKORDER) ---
  const handleReorderMissingItems = async (oldShipment) => {
    // 1. Filtra apenas o que faltou
    const missingItems = oldShipment.items
      .map((item) => {
        const missingMeds = item.medications.filter(
          (m) => m.status === 'falta'
        );
        if (missingMeds.length === 0) return null;

        return {
          patientId: item.patient?._id || item.patient, // Garante ID
          patientName: item.patientName,
          medications: missingMeds.map((m) => ({
            medicationId: m.medicationId?._id || m.medicationId,
            // Mantém a quantidade original que faltou
            quantity: m.quantity,
          })),
        };
      })
      .filter((i) => i !== null);

    if (missingItems.length === 0) {
      toast.error('Não há itens em falta neste pedido para reprocessar.');
      return;
    }

    if (
      !window.confirm(
        `Existem itens em falta para ${missingItems.length} pacientes. Deseja criar um NOVO pedido automaticamente para eles?`
      )
    )
      return;

    const toastId = toast.loading('Criando novo pedido de sobra...');

    try {
      // 2. Cria a nova remessa vazia com o mesmo fornecedor
      const createRes = await api.post('/shipments/create', {
        supplier: oldShipment.supplier,
      });
      const newShipment = createRes.data;

      // 3. Adiciona os itens que faltaram na nova remessa
      for (const item of missingItems) {
        await api.post('/shipments/add-item', {
          shipmentId: newShipment._id,
          patientId: item.patientId,
          patientName: item.patientName,
          medications: item.medications,
        });
      }

      toast.success('Novo pedido criado com os itens pendentes!', {
        id: toastId,
      });

      // 4. Redireciona para a aba de abertos
      setActiveTab('current');
      fetchOpenShipments();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar pedido de sobra.', { id: toastId });
    }
  };

  // Verifica se o histórico tem itens em falta para mostrar o botão
  const hasMissingItems = (shipment) => {
    return shipment.items.some((item) =>
      item.medications.some((m) => m.status === 'falta')
    );
  };
  // -------------------------------------------------------

  // Filtro do Histórico
  const filteredHistory = history.filter(
    (h) =>
      h.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-800">
      {/* HEADER MODERNO */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-200">
              <FiPackage size={24} />
            </div>
            Gestão de Compras
          </h1>
          <p className="text-gray-500 mt-1 ml-1 text-sm font-medium">
            Controle de pedidos, links externos e conferência.
          </p>
        </div>

        {activeTab === 'current' && !selectedShipment && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="group bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black flex items-center gap-3 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 cursor-pointer"
          >
            <FiPlusCircle className="group-hover:rotate-90 transition-transform duration-300" />
            Iniciar Nova Remessa
          </button>
        )}
      </header>

      {/* ABAS ESTILIZADAS */}
      <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-fit mb-8">
        <button
          onClick={() => {
            setActiveTab('current');
            setSelectedShipment(null);
          }}
          className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'current' ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <FiTruck /> Em Aberto (Rascunhos)
        </button>
        <button
          onClick={() => {
            setActiveTab('history');
            setSelectedShipment(null);
          }}
          className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'history' ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <FiArchive /> Histórico & Status
        </button>
      </div>

      {/* ================================================================================= */}
      {/* AREA: RASCUNHOS (EM ABERTO) */}
      {/* ================================================================================= */}
      {activeTab === 'current' && !selectedShipment && (
        <div className="animate-fade-in-up">
          {openShipments.length === 0 && !loading && (
            <div className="text-center py-24 border-2 border-dashed border-gray-300 rounded-2xl bg-white opacity-75">
              <FiTruck className="mx-auto text-6xl text-gray-200 mb-4" />
              <h3 className="text-xl font-bold text-gray-400">
                Nenhum rascunho pendente
              </h3>
              <p className="text-gray-400 mb-6 text-sm">
                Crie uma nova remessa para começar a adicionar medicamentos.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Criar agora
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {openShipments.map((ship) => (
              <div
                key={ship._id}
                onClick={() => setSelectedShipment(ship)}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <div className="flex justify-between items-start mb-4 pl-2">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">
                      {ship.supplier}
                    </h3>
                    <span className="text-[10px] tracking-wider uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                      {ship.code}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FiEdit3 size={14} />
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500 mt-6 pt-4 border-t border-dashed border-gray-100">
                  <span className="flex items-center gap-1">
                    <FiPackage /> {ship.items?.length || 0} Pacientes
                  </span>
                  <span className="text-xs">
                    {new Date(ship.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================================= */}
      {/* AREA: DETALHES DO RASCUNHO (EDITAR) */}
      {/* ================================================================================= */}
      {activeTab === 'current' && selectedShipment && (
        <div className="animate-fade-in">
          <button
            onClick={() => setSelectedShipment(null)}
            className="mb-6 text-sm font-medium text-gray-500 hover:text-blue-600 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <div className="p-1 rounded-full bg-gray-200 hover:bg-blue-100">
              <FiArrowLeft />
            </div>
            Voltar para lista
          </button>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row justify-between md:items-center gap-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
                {selectedShipment.supplier}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-mono font-bold">
                  {selectedShipment.code}
                </span>
                <span className="text-gray-400 text-sm flex items-center gap-1">
                  <FiClock size={12} /> Criado em{' '}
                  {new Date(selectedShipment.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => {
                  setItemToEdit(null);
                  setIsAddModalOpen(true);
                }}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2 cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <FiPlusCircle /> Adicionar Itens
              </button>
              <button
                onClick={handleCancelShipment}
                className="text-red-500 hover:bg-red-50 border border-red-100 hover:border-red-200 px-4 py-2.5 rounded-xl font-bold cursor-pointer transition-colors"
              >
                <FiTrash2 />
              </button>
              <button
                onClick={handleCloseShipment}
                className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 flex items-center gap-2 cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <FiCheck /> Fechar Pedido
              </button>
            </div>
          </div>

          {selectedShipment.items.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-gray-400 mb-2">A lista está vazia.</p>
              <p className="text-sm text-gray-300">
                Use o botão "Adicionar Itens" para incluir pacientes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...selectedShipment.items]
                .sort((a, b) => a.patientName.localeCompare(b.patientName))
                .map((item) => (
                  <div
                    key={item._id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 relative group hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToEdit(item);
                          setIsAddModalOpen(true);
                        }}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer"
                      >
                        <FiEdit3 />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item._id);
                        }}
                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                    <h3 className="font-bold text-gray-800 mb-3 text-lg">
                      {item.patientName}
                    </h3>
                    <ul className="text-sm space-y-2 text-gray-600">
                      {item.medications.map((med, i) => (
                        <li
                          key={i}
                          className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100"
                        >
                          <span className="font-medium">{med.name}</span>
                          <strong className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">
                            {med.quantity} {med.unit}
                          </strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================================= */}
      {/* AREA: HISTÓRICO (DASHBOARD FINANCEIRO/STATUS) */}
      {/* ================================================================================= */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200 animate-fade-in flex flex-col">
          {/* Barra de Filtros */}
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <FiSearch className="text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por fornecedor ou código..."
              className="w-full outline-none text-sm text-gray-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="p-5 border-b font-semibold">
                    Status do Pedido
                  </th>
                  <th className="p-5 border-b font-semibold">Fornecedor</th>
                  <th className="p-5 border-b font-semibold">Ref.</th>
                  <th className="p-5 border-b font-semibold">Atualização</th>
                  <th className="p-5 border-b font-semibold">Valor Total</th>
                  <th className="p-5 border-b text-center font-semibold">
                    Detalhes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((h) => (
                    <React.Fragment key={h._id}>
                      {/* === LINHA PRINCIPAL DA TABELA === */}
                      <tr
                        onClick={() => toggleHistoryExpand(h._id)}
                        className={`group hover:bg-blue-50/30 transition-colors cursor-pointer ${
                          expandedHistoryId === h._id ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        {/* COLUNA 1: STATUS VISUAL (BADGES) */}
                        <td className="p-5">
                          {(() => {
                            switch (h.status) {
                              case 'finalizado':
                                return (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 shadow-sm">
                                    <FiCheckCircle /> Finalizado
                                  </span>
                                );
                              case 'aguardando_conferencia':
                                return (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 shadow-sm">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                    </span>
                                    Aguardando Conferência
                                  </span>
                                );
                              default:
                                return (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
                                    <FiClock /> Aguardando Fornecedor
                                  </span>
                                );
                            }
                          })()}
                        </td>

                        <td className="p-5 font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                          {h.supplier}
                        </td>
                        <td className="p-5 font-mono text-xs text-gray-500">
                          {h.code}
                        </td>
                        <td className="p-5 text-sm text-gray-600">
                          {new Date(
                            h.updatedAt || h.closedAt
                          ).toLocaleDateString()}
                        </td>
                        <td className="p-5 font-bold text-gray-800 font-mono">
                          {(h.totalCost || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </td>
                        <td className="p-5 text-center">
                          <div
                            className={`transition-transform duration-300 ${
                              expandedHistoryId === h._id
                                ? 'rotate-180 text-blue-600'
                                : 'text-gray-400'
                            }`}
                          >
                            <FiChevronDown size={20} />
                          </div>
                        </td>
                      </tr>

                      {/* === DETALHES EXPANDIDOS === */}
                      {expandedHistoryId === h._id && (
                        <tr>
                          <td
                            colSpan="6"
                            className="p-0 border-b border-blue-100 bg-gray-50/50 animate-fade-in-down"
                          >
                            <div className="p-8 border-l-4 border-blue-500 ml-4 my-2 rounded-r-xl bg-white shadow-inner">
                              {/* --- LINHA DO TEMPO (Mantida igual) --- */}
                              <div className="mb-8 px-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                                  Linha do Tempo do Pedido
                                </h4>
                                <div className="flex items-center w-full">
                                  {/* Passo 1 */}
                                  <div className="flex flex-col items-center relative z-10">
                                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                                      1
                                    </div>
                                    <span className="text-xs font-bold text-green-600 mt-2">
                                      Enviado
                                    </span>
                                  </div>
                                  <div
                                    className={`flex-1 h-1 mx-2 rounded ${h.status === 'aguardando_conferencia' || h.status === 'finalizado' ? 'bg-green-500' : 'bg-gray-200'}`}
                                  ></div>

                                  {/* Passo 2 */}
                                  <div className="flex flex-col items-center relative z-10">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-colors ${h.status === 'aguardando_conferencia' || h.status === 'finalizado' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                                    >
                                      2
                                    </div>
                                    <span
                                      className={`text-xs font-bold mt-2 ${h.status === 'aguardando_conferencia' ? 'text-blue-600 animate-pulse' : h.status === 'finalizado' ? 'text-green-600' : 'text-gray-400'}`}
                                    >
                                      {h.status === 'aguardando_fornecedor'
                                        ? 'Aguardando...'
                                        : 'Respondido'}
                                    </span>
                                  </div>
                                  <div
                                    className={`flex-1 h-1 mx-2 rounded ${h.status === 'finalizado' ? 'bg-green-500' : 'bg-gray-200'}`}
                                  ></div>

                                  {/* Passo 3 */}
                                  <div className="flex flex-col items-center relative z-10">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-colors ${h.status === 'finalizado' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                                    >
                                      3
                                    </div>
                                    <span
                                      className={`text-xs font-bold mt-2 ${h.status === 'finalizado' ? 'text-green-600' : 'text-gray-400'}`}
                                    >
                                      Conferido
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* CABEÇALHO DO DETALHE E BOTÕES */}
                              <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
                                <div>
                                  <h4 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                                    <FiPackage className="text-blue-500" />{' '}
                                    Detalhamento
                                  </h4>

                                  {h.status !== 'finalizado' && (
                                    <div className="mt-2 text-sm text-blue-600 flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 w-fit">
                                      <FiExternalLink />
                                      <a
                                        href={`${window.location.origin}/pedidos/ver/${h.accessToken}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="underline font-bold cursor-pointer"
                                      >
                                        Link do Fornecedor (Ativo)
                                      </a>
                                    </div>
                                  )}
                                </div>

                                <div className="flex gap-2">
                                  {/* --- BOTÃO DE RE-COMPRA INTELIGENTE (BACKORDER) --- */}
                                  {hasMissingItems(h) && (
                                    <button
                                      onClick={() =>
                                        handleReorderMissingItems(h)
                                      }
                                      className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-bold text-xs border border-orange-200 animate-pulse cursor-pointer transition-colors"
                                      title="Gerar nova remessa com os itens que faltaram"
                                    >
                                      <FiRefreshCw /> Gerar Pedido de Sobra
                                    </button>
                                  )}
                                  {/* ------------------------------------------------ */}

                                  <button
                                    onClick={() =>
                                      generateShipmentPDF(h, 'vendor')
                                    }
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-bold text-xs cursor-pointer"
                                  >
                                    <FiPrinter /> PDF Simples
                                  </button>
                                  <button
                                    onClick={() =>
                                      generateShipmentPDF(h, 'conference')
                                    }
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black font-bold text-xs cursor-pointer"
                                  >
                                    <FiPrinter /> PDF Conferência
                                  </button>
                                </div>
                              </div>

                              {/* GRID DE ITENS */}
                              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                {[...h.items].map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
                                  >
                                    <div className="font-bold text-gray-800 border-b border-gray-100 pb-2 mb-3 flex justify-between items-center">
                                      <span className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>{' '}
                                        {item.patientName}
                                      </span>
                                    </div>
                                    <table className="w-full text-sm">
                                      <tbody className="text-gray-600">
                                        {item.medications.map((med, mIdx) => (
                                          <tr
                                            key={mIdx}
                                            className="border-b border-gray-50 last:border-0"
                                          >
                                            <td className="py-2 pl-2">
                                              {med.status === 'falta' ? (
                                                <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-0.5 rounded border border-red-100">
                                                  EM FALTA: {med.name}
                                                </span>
                                              ) : (
                                                med.name
                                              )}
                                            </td>
                                            <td className="py-2 text-right font-mono font-bold text-gray-800">
                                              {med.status !== 'falta' &&
                                                (
                                                  med.totalPrice || 0
                                                ).toLocaleString('pt-BR', {
                                                  style: 'currency',
                                                  currency: 'BRL',
                                                })}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-16 text-center text-gray-400">
                      Nenhum histórico encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAIS (Mantidos funcionais) */}
      {isCreateModalOpen && (
        <CreateShipmentModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            fetchOpenShipments();
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
            fetchOpenShipments();
            toast.success('Item salvo com sucesso!');
          }}
        />
      )}

      {/* MODAL DE SUCESSO AUTOMÁTICO */}
      <ShipmentSuccessModal
        isOpen={!!successModalData}
        shipment={successModalData}
        onClose={() => setSuccessModalData(null)}
      />
    </div>
  );
}
