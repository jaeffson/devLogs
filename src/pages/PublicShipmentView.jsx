import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  FiPackage,
  FiCheckCircle,
  FiPrinter,
  FiAlertTriangle,
  FiTruck,
  FiClock,
  FiMessageSquare,
  FiPlus,
  FiMinus,
  FiFileText,
  FiInfo,
  FiArrowRight,
  FiX,
  FiUser,
  FiSearch,
  FiCheck,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../components/common/Modal';

export default function PublicShipmentView() {
  const { token } = useParams();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [observations, setObservations] = useState('');
  const [senderName, setSenderName] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  // NOVO ESTADO: Controla quais sacolas (pacientes) já foram lacradas pelo fornecedor
  const [readyBags, setReadyBags] = useState({});

  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isDestructive: false,
  });

  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const searchRef = useRef(null);
  const qtyRef = useRef(null);
  const priceRef = useRef(null);
  const missingRef = useRef(null);
  const btnRef = useRef(null);

  const API_URL =
    import.meta.env.VITE_API_URL || 'https://api.parari.medlogs.com.br/api';

  useEffect(() => {
    let isMounted = true;

    async function loadData(isFirstLoad = true) {
      try {
        const res = await axios.get(`${API_URL}/shipments/public/${token}`);
        if (!isMounted) return;

        if (isFirstLoad) {
          const dataWithMemory = res.data;
          dataWithMemory.items.forEach((p) =>
            p.medications.forEach((m) => {
              m.requestedQuantity = m.quantity;
            })
          );
          setShipment(dataWithMemory);
          if (res.data.observations) setObservations(res.data.observations);
        }

        if (res.data.status !== 'aguardando_fornecedor') {
          setFinished(true);
        }

        if (isFirstLoad) {
          const hasSeenTour = localStorage.getItem('medlogs_supplier_tour_v3');
          if (!hasSeenTour && res.data.status === 'aguardando_fornecedor') {
            setTimeout(() => setShowTour(true), 1000);
          }
        }
      } catch (error) {
        if (isFirstLoad) {
          toast.error('Erro ao carregar pedido. Link inválido ou expirado.');
        }
      } finally {
        if (isFirstLoad) setLoading(false);
      }
    }

    loadData(true);

    const interval = setInterval(() => {
      if (!finished) loadData(false);
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token, finished]);

  const tourSteps = [
    {
      title: 'Bem-vindo ao Portal!',
      text: 'Este é o seu ambiente seguro para responder às cotações. Vamos te mostrar as novidades em 5 passos rápidos.',
      target: null,
    },
    {
      title: 'Busca Inteligente 🔍',
      text: 'Digite o nome do paciente ou bipe a receita para focar apenas na sacola que você está montando agora!',
      target: searchRef,
    },
    {
      title: 'Passo 1: Quantidade e Preço',
      text: 'Ajuste a quantidade se necessário e preencha o valor. Se o sistema lembrar do seu último preço, a caixa brilha em verde.',
      target: priceRef,
    },
    {
      title: 'Passo 2: Itens em Falta',
      text: "Se você não tiver o medicamento, clique em 'Marcar Falta'. O sistema gera o saldo para entregar depois.",
      target: missingRef,
    },
    {
      title: 'NOVO: Lacrar Sacola 📦',
      text: 'Terminou de montar a sacola do paciente? Clique no botão no rodapé do paciente para "Lacrar a Sacola" e limpar a tela!',
      target: null,
    },
  ];

  const handleNextTourStep = () => {
    if (tourStep < tourSteps.length - 1) {
      setTourStep((prev) => prev + 1);
      if (
        tourSteps[tourStep + 1].target &&
        tourSteps[tourStep + 1].target.current
      ) {
        tourSteps[tourStep + 1].target.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    } else {
      closeTour();
    }
  };

  const closeTour = () => {
    setShowTour(false);
    localStorage.setItem('medlogs_supplier_tour_v3', 'true');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getSmartUnit = (quantity, unit) => {
    if (!unit) return '';
    const qty = Number(quantity);
    const u = unit.toLowerCase().trim();
    const map = {
      cx: { s: 'Caixa', p: 'Caixas' },
      fr: { s: 'Frasco', p: 'Frascos' },
      un: { s: 'Unidade', p: 'Unidades' },
      amp: { s: 'Ampola', p: 'Ampolas' },
      com: { s: 'Comp.', p: 'Comp.' },
    };
    return map[u] ? (qty > 1 ? map[u].p : map[u].s) : unit.toUpperCase();
  };

  // =========================================================================
  // MÁGICA NOVA: FUNÇÃO PARA DEIXAR SACOLA PARA DEPOIS
  // =========================================================================
  const handlePatientAction = (filteredPIndex, action) => {
    if (finished) return;
    const newShipment = { ...shipment };
    newShipment.items = JSON.parse(JSON.stringify(shipment.items));

    const filteredPatient = filteredItems[filteredPIndex];
    const originalPatientIndex = newShipment.items.findIndex(
      (p) => p._id === filteredPatient._id
    );
    const patient = newShipment.items[originalPatientIndex];

    patient.medications.forEach((med) => {
      if (action === 'parcial_total') {
        med.status = 'parcial';
        med.quantity = 0;
        med.unitPrice = 0;
        med.totalPrice = 0;
      } else if (action === 'desfazer') {
        med.status = 'disponivel';
        med.quantity = med.requestedQuantity || 1;
        med.totalPrice = 0;
      }
    });

    let total = 0;
    newShipment.items.forEach((p) => {
      p.medications.forEach((m) => {
        if (m.status !== 'falta' && m.status !== 'parcial') total += m.totalPrice || 0;
      });
    });
    newShipment.totalCost = total;
    setShipment(newShipment);
  };
  // =========================================================================

  // =========================================================================
  // SEU CÓDIGO ORIGINAL DE MUDAR ITEM (INTACTO!)
  // =========================================================================
  const handleItemChange = (patientIndex, medIndex, field, value) => {
    if (finished) return;

    const newShipment = { ...shipment };
    newShipment.items = JSON.parse(JSON.stringify(shipment.items));

    const filteredPatient = filteredItems[patientIndex];
    const originalPatientIndex = newShipment.items.findIndex(
      (p) => p._id === filteredPatient._id
    );

    const filteredMed = filteredPatient.medications[medIndex];
    const originalMedIndex = newShipment.items[
      originalPatientIndex
    ].medications.findIndex((m) => m._id === filteredMed._id);

    const item =
      newShipment.items[originalPatientIndex].medications[originalMedIndex];

    if (field === 'unitPrice') {
      let sanitizedValue = String(value).replace(',', '.');
      const numValue = parseFloat(sanitizedValue);
      item.unitPrice = isNaN(numValue) ? 0 : numValue;
      item.hasMemoryPrice = false;
    } else if (field === 'quantity') {
      let qty = parseInt(value);
      if (qty < 1) qty = 1;
      item.quantity = qty;
    } else if (field === 'status') {
      const isMissing = value;
      item.status = isMissing ? 'falta' : 'disponivel';
      if (item.status === 'falta') {
        item.unitPrice = 0;
        item.totalPrice = 0;
      }
    }

    if (item.status !== 'falta') {
      item.totalPrice = (item.unitPrice || 0) * (item.quantity || 1);
    } else {
      item.totalPrice = 0;
    }

    let total = 0;
    newShipment.items.forEach((p) => {
      p.medications.forEach((m) => {
        if (m.status === 'disponivel') total += m.totalPrice || 0;
      });
    });
    newShipment.totalCost = total;

    setShipment(newShipment);
  };

  const toggleBagReady = (pId) => {
    setReadyBags((prev) => ({
      ...prev,
      [pId]: !prev[pId],
    }));
  };

  let totalMeds = 0;
  let resolvedMeds = 0;
  if (shipment && shipment.items) {
    shipment.items.forEach((p) => {
      p.medications.forEach((m) => {
        totalMeds++;
        // AJUSTE: Considera "resolvido" se for parcial também!
        if (m.status === 'falta' || (m.status === 'parcial' && m.quantity === 0) || parseFloat(m.unitPrice) > 0) {
          resolvedMeds++;
        }
      });
    });
  }

  const progressPercent =
    totalMeds === 0 ? 0 : Math.round((resolvedMeds / totalMeds) * 100);
  const isFullyResolved = totalMeds > 0 && resolvedMeds === totalMeds;

  const handleConfirmOrderClick = () => {
    if (!senderName.trim()) {
      toast.error('Por favor, informe seu nome como responsável pelo ENVIO.', {
        icon: '👤',
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      return;
    }

    if (!isFullyResolved) {
      setConfirmation({
        isOpen: true,
        title: 'Atenção: Enviar Incompleto?',
        message: `Você preencheu apenas ${resolvedMeds} de ${totalMeds} itens. Os itens que continuam com o preço zerado NÃO SERÃO COTADOS e nem serão enviados como parcial,\n\nDeseja enviar mesmo assim?`,
        confirmText: 'Sim, Enviar Incompleto',
        isDestructive: true,
        onConfirm: processOrder,
      });
    } else {
      setConfirmation({
        isOpen: true,
        title: 'Confirmar Envio',
        message:
          'Você preencheu todos os itens! Confirma o envio definitivo deste pedido?',
        confirmText: 'Sim, Enviar Agora',
        isDestructive: false,
        onConfirm: processOrder,
      });
    }
  };

  const closeConfirmation = () =>
    setConfirmation({ ...confirmation, isOpen: false });

  const processOrder = async () => {
    try {
      const formattedObservations = `Responsável do Fornecedor: ${senderName.trim()}${observations ? `\nObservações: ${observations}` : ''}`;
      await axios.post(`${API_URL}/shipments/public/${token}/confirm`, {
        items: shipment.items,
        totalCost: shipment.totalCost,
        observations: formattedObservations,
      });
      setFinished(true);
      toast.success('Pedido enviado com sucesso!');
      window.scrollTo(0, 0);
      closeConfirmation();
    } catch (error) {
      toast.error('Erro ao enviar pedido. Tente novamente.');
      throw error;
    }
  };

  const filteredItems =
    shipment?.items
      ?.map((patientItem) => {
        const searchLower = searchTerm.toLowerCase();
        const patientMatches = patientItem.patientName
          .toLowerCase()
          .includes(searchLower);
        const matchingMeds = patientItem.medications.filter(
          (med) =>
            patientMatches ||
            (med.name && med.name.toLowerCase().includes(searchLower))
        );
        return { ...patientItem, medications: matchingMeds };
      })
      .filter((patientItem) => patientItem.medications.length > 0) || [];

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-indigo-500 animate-pulse">
        Carregando pedido seguro...
      </div>
    );
  if (!shipment)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 font-bold bg-red-50">
        Pedido não encontrado ou link expirado.
      </div>
    );

  if (finished) {
    return (
      <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl text-center max-w-lg border border-emerald-100 animate-in zoom-in-95">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle size={48} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">
            Sucesso!
          </h1>
          <p className="text-slate-600 mb-8 font-medium leading-relaxed">
            Obrigado, <strong>{shipment.supplier}</strong>.<br />A sua resposta
            foi enviada e a Secretaria de Saúde já foi notificada.
          </p>
          <button
            onClick={() => window.print()}
            className="bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-slate-800 flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-lg active:scale-95 transition-all w-full sm:w-auto"
          >
            <FiPrinter /> Imprimir Comprovante
          </button>
        </div>
      </div>
    );
  }

  const highlightStyle = {
    position: 'relative',
    zIndex: 102,
    backgroundColor: 'white',
    padding: '4px',
    borderRadius: '8px',
    boxShadow: '0 0 0 4px white, 0 0 0 6px #4f46e5',
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-[280px] md:pb-48 font-sans relative">
      {showTour && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] transition-opacity duration-500 backdrop-blur-sm"></div>
      )}

      {showTour && (
        <div
          className="fixed z-[101] w-[90%] max-w-sm bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 animate-in zoom-in-95 duration-300"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-black text-indigo-600 text-lg">
              {tourSteps[tourStep].title}
            </h3>
            <button
              onClick={closeTour}
              className="text-slate-400 hover:text-red-500 cursor-pointer p-1"
            >
              <FiX size={20} />
            </button>
          </div>
          <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6">
            {tourSteps[tourStep].text}
          </p>
          <div className="flex justify-between items-center">
            <div className="flex gap-1.5">
              {tourSteps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i === tourStep ? 'bg-indigo-600' : 'bg-slate-200'}`}
                ></div>
              ))}
            </div>
            <button
              onClick={handleNextTourStep}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
            >
              {tourStep === tourSteps.length - 1
                ? 'Entendi, Começar'
                : 'Próximo'}{' '}
              <FiArrowRight />
            </button>
          </div>
        </div>
      )}

      <header className="bg-indigo-900 text-white p-6 shadow-md print:hidden sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2 tracking-tight">
              <div className="bg-white/10 p-2 rounded-lg">
                <FiPackage className="text-indigo-300" />
              </div>{' '}
              MedLogs
            </h1>
            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">
              Portal do Fornecedor
            </p>
          </div>
          <div className="text-center md:text-right">
            <div className="font-bold text-lg">{shipment.supplier}</div>
            <div className="text-sm text-indigo-300 font-mono bg-indigo-800/50 px-3 py-0.5 rounded-full inline-block mt-1">
              Ref: {shipment.code}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto mt-8 p-4">
        <div
          className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 print:hidden sticky top-[88px] z-30"
          ref={searchRef}
          style={showTour && tourStep === 1 ? highlightStyle : {}}
        >
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <FiSearch size={20} />
            </span>
            <input
              type="text"
              placeholder="🔍 Bipar ou digitar nome do Paciente da receita..."
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-bold text-slate-700 placeholder:font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm && (
            <p className="text-xs text-indigo-600 font-bold mt-2 ml-2">
              Mostrando resultados para: "{searchTerm}"
            </p>
          )}
        </div>

        <div className="space-y-6">
          {filteredItems.map((patientItem, pIndex) => {
            const pId = patientItem._id || pIndex;
            const isBagReady = readyBags[pId];

            // INTELIGÊNCIA NOVA: Identifica se a sacola inteira foi mandada pra depois
            const isAllParcial = patientItem.medications.every(
              (m) => m.status === 'parcial' && m.quantity === 0
            );

            // Verifica se o paciente atual já teve todos os remédios preenchidos ou marcados
            const isPatientResolved = patientItem.medications.every(
              (m) => m.status === 'falta' || (m.status === 'parcial' && m.quantity === 0) || parseFloat(m.unitPrice) > 0
            );

            if (isBagReady) {
              return (
                <div
                  key={pId}
                  className="bg-emerald-50 rounded-3xl shadow-sm border border-emerald-200 p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in zoom-in-95 duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0">
                      <FiCheckCircle />
                    </div>
                    <div>
                      <h3 className="font-black text-emerald-900 text-base">
                        {patientItem.patientName}
                      </h3>
                      <p
                        className={`text-[10px] font-black tracking-widest uppercase mt-0.5 ${isPatientResolved ? 'text-emerald-600' : 'text-amber-600'}`}
                      >
                        {isPatientResolved
                          ? 'Sacola Pronta e Lacrada'
                          : 'Sacola Fechada (Com Pendências)'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleBagReady(pId)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-white text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-colors active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <FiX size={14} /> Reabrir Sacola
                  </button>
                </div>
              );
            }

            return (
              <div
                key={pId}
                className={`bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300 ${isAllParcial ? 'opacity-80 ring-2 ring-amber-200' : ''}`}
              >
                <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <h3 className="font-black text-slate-800 text-sm flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                      {patientItem.patientName.charAt(0).toUpperCase()}
                    </div>
                    {patientItem.patientName}
                  </h3>

                  {/* NOVO: BOTÃO DE DEIXAR SACOLA PARA DEPOIS */}
                  {isAllParcial ? (
                    <button
                      onClick={() => handlePatientAction(pIndex, 'desfazer')}
                      className="cursor-pointer bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                    >
                      <FiCheck size={14} /> Desfazer Envio para Depois
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePatientAction(pIndex, 'parcial_total')}
                      className="cursor-pointer bg-amber-100 text-amber-700 border border-amber-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-200 flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                    >
                      <FiClock size={14} /> Deixar pedido parcial
                    </button>
                  )}
                </div>

                <div className="w-full">
                  {/* VERSÃO DESKTOP */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                      <thead className="bg-white text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                        <tr>
                          <th className="p-5 w-1/3">Medicamento</th>
                          <th className="p-5 text-center w-32">
                            Qtd Solicitada
                          </th>
                          <th className="p-5 w-40 print:hidden text-right">
                            Valor Unit. (R$)
                          </th>
                          <th className="p-5 text-right w-32">Subtotal</th>
                          <th className="p-5 text-center w-32 print:hidden">
                            Ação / Estoque
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {patientItem.medications.map((med, mIndex) => {
                          const isFirstItem = pIndex === 0 && mIndex === 0;
                          return (
                            <tr
                              key={`desktop-${mIndex}`}
                              className={`transition-colors group ${med.status === 'falta' ? 'bg-red-50/50' : 'hover:bg-slate-50/50'}`}
                            >
                              <td className="p-5 align-top">
                                <div
                                  className={`font-bold text-sm ${med.status === 'falta' ? 'text-red-700 line-through' : 'text-slate-800'}`}
                                >
                                  {med.name || med.medicationId?.name}
                                </div>
                                {med.observation && (
                                  <div className="mt-2 inline-flex items-start gap-1.5 text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 rounded-lg max-w-full font-medium">
                                    <FiFileText
                                      className="mt-0.5 shrink-0"
                                      size={12}
                                    />{' '}
                                    Obs: {med.observation}
                                  </div>
                                )}
                                {(med.status === 'falta' ||
                                  (med.requestedQuantity > med.quantity &&
                                    med.status !== 'falta')) && (
                                  <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                                    <FiAlertTriangle size={12} />{' '}
                                    {med.status === 'falta'
                                      ? 'Pedido Parcial: Consulte novo link.'
                                      : `Pedido será enviado como parcial, será necessário pedir um novo link!`}
                                  </div>
                                )}
                                {/* AVISO DE SACOLA PARA DEPOIS */}
                                {med.status === 'parcial' && med.quantity === 0 && (
                                  <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                                    <FiClock size={12} /> Campo preço vazio não gera saldo.
                                  </div>
                                )}
                              </td>

                              <td className="p-5 text-center align-top">
                                {med.status === 'falta' || (med.status === 'parcial' && med.quantity === 0) ? (
                                  <span className="text-slate-300 font-mono font-bold">
                                    -
                                  </span>
                                ) : (
                                  <div
                                    className="flex flex-col items-center"
                                    ref={isFirstItem ? qtyRef : null}
                                    style={
                                      showTour && isFirstItem && tourStep === 2
                                        ? highlightStyle
                                        : {}
                                    }
                                  >
                                    <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden h-9 w-28 shadow-sm">
                                      <button
                                        onClick={() =>
                                          handleItemChange(
                                            pIndex,
                                            mIndex,
                                            'quantity',
                                            med.quantity - 1
                                          )
                                        }
                                        className="px-3 hover:bg-slate-100 text-slate-500 cursor-pointer h-full border-r border-slate-100"
                                      >
                                        <FiMinus size={12} />
                                      </button>
                                      <span className="flex-1 text-center text-sm font-black text-slate-800 leading-9">
                                        {med.quantity}
                                      </span>
                                      <button
                                        onClick={() =>
                                          handleItemChange(
                                            pIndex,
                                            mIndex,
                                            'quantity',
                                            med.quantity + 1
                                          )
                                        }
                                        className="px-3 hover:bg-slate-100 text-indigo-600 cursor-pointer h-full border-l border-slate-100"
                                      >
                                        <FiPlus size={12} />
                                      </button>
                                    </div>
                                    <span className="text-[10px] text-slate-400 mt-1.5 font-bold uppercase tracking-wider">
                                      {getSmartUnit(med.quantity, med.unit)}
                                    </span>
                                  </div>
                                )}
                              </td>

                              <td className="p-5 align-top print:hidden text-right">
                                <div
                                  className="relative inline-block w-full max-w-[120px]"
                                  ref={isFirstItem ? priceRef : null}
                                  style={
                                    showTour && isFirstItem && tourStep === 3
                                      ? highlightStyle
                                      : {}
                                  }
                                >
                                  <span
                                    className={`absolute left-3 top-3.5 text-sm font-bold pointer-events-none z-10 ${med.hasMemoryPrice && med.status !== 'falta' ? 'text-emerald-700' : 'text-slate-400'}`}
                                  >
                                    R$
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className={`w-full pl-8 pr-3 py-3 border-2 rounded-xl outline-none text-right font-mono font-black transition-all duration-500 relative
                                      ${med.status === 'falta' || (med.status === 'parcial' && med.quantity === 0) ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : med.hasMemoryPrice ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-[0_0_15px_rgba(52,211,153,0.4)] ring-2 ring-emerald-400/50' : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-inner'}`}
                                    placeholder="0.00"
                                    value={med.unitPrice || ''}
                                    onChange={(e) =>
                                      handleItemChange(
                                        pIndex,
                                        mIndex,
                                        'unitPrice',
                                        e.target.value
                                      )
                                    }
                                    disabled={med.status === 'falta' || (med.status === 'parcial' && med.quantity === 0)}
                                  />
                                </div>
                                {med.hasMemoryPrice &&
                                  med.status !== 'falta' && (
                                    <div className="text-[10px] text-emerald-600 font-black uppercase mt-2 tracking-widest flex items-center justify-end gap-1">
                                      <span className="relative flex h-2 w-2 mr-1">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                      </span>{' '}
                                      Preço Automático
                                    </div>
                                  )}
                              </td>

                              <td className="p-5 align-top text-right font-mono font-black text-slate-800 pt-8">
                                {med.status === 'falta' ? (
                                  <span className="text-slate-300">---</span>
                                ) : (
                                  (med.totalPrice || 0).toLocaleString(
                                    'pt-BR',
                                    { style: 'currency', currency: 'BRL' }
                                  )
                                )}
                              </td>

                              <td className="p-5 align-top text-center print:hidden">
                                <div
                                  ref={isFirstItem ? missingRef : null}
                                  style={
                                    showTour && isFirstItem && tourStep === 4
                                      ? highlightStyle
                                      : {}
                                  }
                                >
                                  <button
                                    onClick={() =>
                                      handleItemChange(
                                        pIndex,
                                        mIndex,
                                        'status',
                                        med.status !== 'falta'
                                      )
                                    }
                                    className={`w-full py-2 px-2 mt-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 ${med.status === 'falta' ? 'bg-red-50 text-red-600 border-red-200 shadow-inner' : 'bg-white text-slate-400 border-slate-200 hover:border-red-300 hover:text-red-500 hover:bg-red-50/30 shadow-sm'}`}
                                  >
                                    {med.status === 'falta' ? (
                                      <>
                                        Gerar
                                        <br />
                                        Saldo
                                      </>
                                    ) : (
                                      <>
                                        Marcar
                                        <br />
                                        Falta
                                      </>
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* VERSÃO MOBILE (CARDS) */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {patientItem.medications.map((med, mIndex) => {
                      const isFirstItem = pIndex === 0 && mIndex === 0;
                      return (
                        <div
                          key={`mobile-${mIndex}`}
                          className={`p-4 transition-colors ${med.status === 'falta' ? 'bg-red-50/30' : 'bg-white'}`}
                        >
                          <div className="mb-3">
                            <div
                              className={`font-black text-sm mb-1 ${med.status === 'falta' ? 'text-red-700 line-through' : 'text-slate-800'}`}
                            >
                              {med.name || med.medicationId?.name}
                            </div>
                            {med.observation && (
                              <div className="inline-flex items-start gap-1.5 text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg w-full font-medium">
                                <FiFileText
                                  className="mt-0.5 shrink-0"
                                  size={12}
                                />
                                <span className="leading-tight truncate">
                                  {med.observation}
                                </span>
                              </div>
                            )}
                            {(med.status === 'falta' ||
                              (med.requestedQuantity > med.quantity &&
                                med.status !== 'falta')) && (
                              <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-2 py-1.5 rounded-lg border border-amber-200 inline-flex items-center gap-1.5">
                                <FiAlertTriangle size={12} />{' '}
                                {med.status === 'falta'
                                  ? 'Pedido Parcial (Saldo)'
                                  : `Saldo pendente: ${med.requestedQuantity - med.quantity} cxs`}
                              </div>
                            )}
                            {/* AVISO DE SACOLA PARA DEPOIS MOBILE */}
                            {med.status === 'parcial' && med.quantity === 0 && (
                              <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-2 py-1.5 rounded-lg border border-amber-200 inline-flex items-center gap-1.5">
                                <FiClock size={12} /> Sacola para Depois
                              </div>
                            )}
                          </div>

                          <div className="flex items-start gap-3">
                            <div
                              className="flex flex-col gap-1"
                              ref={isFirstItem ? qtyRef : null}
                              style={
                                showTour && isFirstItem && tourStep === 2
                                  ? highlightStyle
                                  : {}
                              }
                            >
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Qtd.
                              </span>
                              {med.status === 'falta' || (med.status === 'parcial' && med.quantity === 0) ? (
                                <div className="h-10 w-[100px] flex items-center justify-center bg-slate-100 rounded-xl border border-slate-200 text-slate-400 font-black">
                                  -
                                </div>
                              ) : (
                                <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden h-10 w-[100px] shadow-sm">
                                  <button
                                    onClick={() =>
                                      handleItemChange(
                                        pIndex,
                                        mIndex,
                                        'quantity',
                                        med.quantity - 1
                                      )
                                    }
                                    className="w-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 h-full border-r border-slate-200"
                                  >
                                    <FiMinus size={14} />
                                  </button>
                                  <span className="flex-1 text-center text-sm font-black text-slate-800">
                                    {med.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleItemChange(
                                        pIndex,
                                        mIndex,
                                        'quantity',
                                        med.quantity + 1
                                      )
                                    }
                                    className="w-8 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-600 h-full border-l border-slate-200"
                                  >
                                    <FiPlus size={14} />
                                  </button>
                                </div>
                              )}
                            </div>

                            <div
                              className="flex-1 flex flex-col gap-1 relative"
                              ref={isFirstItem ? priceRef : null}
                              style={
                                showTour && isFirstItem && tourStep === 3
                                  ? highlightStyle
                                  : {}
                              }
                            >
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Valor Unit.
                              </span>
                              <div className="relative w-full">
                                <span
                                  className={`absolute left-3 top-2.5 text-xs font-bold pointer-events-none z-10 ${med.hasMemoryPrice && med.status !== 'falta' ? 'text-emerald-700' : 'text-slate-400'}`}
                                >
                                  R$
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className={`w-full pl-8 pr-3 py-2.5 border-2 rounded-xl outline-none text-right font-mono font-black text-sm transition-all duration-500 relative
                                    ${med.status === 'falta' || (med.status === 'parcial' && med.quantity === 0) ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : med.hasMemoryPrice ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-[0_0_10px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400/50' : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500 shadow-sm'}`}
                                  placeholder="0.00"
                                  value={med.unitPrice || ''}
                                  onChange={(e) =>
                                    handleItemChange(
                                      pIndex,
                                      mIndex,
                                      'unitPrice',
                                      e.target.value
                                    )
                                  }
                                  disabled={med.status === 'falta' || (med.status === 'parcial' && med.quantity === 0)}
                                />
                              </div>
                              {med.hasMemoryPrice && med.status !== 'falta' && (
                                <div className="absolute -bottom-4 right-0 text-[8px] text-emerald-600 font-black uppercase tracking-widest flex items-center justify-end gap-1">
                                  <span className="relative flex h-1.5 w-1.5 mr-0.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                  </span>{' '}
                                  Automático
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 border-dashed">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Subtotal
                              </span>
                              <span
                                className={`font-mono font-black text-base ${med.status === 'falta' ? 'text-slate-300' : 'text-slate-800'}`}
                              >
                                {med.status === 'falta'
                                  ? '---'
                                  : (med.totalPrice || 0).toLocaleString(
                                      'pt-BR',
                                      { style: 'currency', currency: 'BRL' }
                                    )}
                              </span>
                            </div>

                            <div
                              ref={isFirstItem ? missingRef : null}
                              style={
                                showTour && isFirstItem && tourStep === 4
                                  ? highlightStyle
                                  : {}
                              }
                            >
                              <button
                                onClick={() =>
                                  handleItemChange(
                                    pIndex,
                                    mIndex,
                                    'status',
                                    med.status !== 'falta'
                                  )
                                }
                                className={`py-1.5 px-4 rounded-lg text-xs font-black uppercase tracking-widest transition-all border flex items-center gap-1.5 active:scale-95 ${med.status === 'falta' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-inner' : 'bg-white text-red-500 border-red-200 hover:bg-red-50 shadow-sm'}`}
                              >
                                {med.status === 'falta' ? (
                                  <>
                                    {' '}
                                    <FiCheck size={14} /> Desfazer Falta
                                  </>
                                ) : (
                                  <>
                                    {' '}
                                    <FiX size={14} /> Marcar Falta
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-50/80 border-t border-slate-100 p-4 sm:p-5 flex justify-end">
                  <button
                    onClick={() => toggleBagReady(pId)}
                    className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-black text-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
                      isPatientResolved
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200'
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200'
                    }`}
                  >
                    {isPatientResolved ? (
                      <FiCheck size={18} />
                    ) : (
                      <FiAlertTriangle size={18} />
                    )}
                    {isPatientResolved
                      ? 'Lacrar Sacola Pronta'
                      : 'Fechar Sacola (Com Pendências)'}
                  </button>
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center">
              <FiSearch className="mx-auto text-slate-300 mb-4" size={48} />
              <h3 className="text-xl font-black text-slate-700">
                Nenhum item encontrado
              </h3>
              <p className="text-slate-500 mt-2 font-medium">
                Não achamos nada com o termo "{searchTerm}".
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
          <h3 className="font-black text-slate-800 mb-5 flex items-center gap-2 text-sm uppercase tracking-widest">
            <FiMessageSquare className="text-indigo-500" /> Finalização do
            Pedido
          </h3>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-2">
                <FiUser size={14} className="text-indigo-500" /> Seu Nome
                (Obrigatório)
              </label>
              <input
                type="text"
                className="w-full border-2 border-slate-200 bg-slate-50 rounded-2xl p-4 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold text-slate-700 transition-all shadow-sm"
                placeholder="Ex: João Silva"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
            </div>

            <div className="w-full md:w-2/3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-2">
                <FiFileText size={14} className="text-indigo-500" /> Observações
                (Opcional)
              </label>
              <textarea
                className="w-full border-2 border-slate-200 bg-slate-50 rounded-2xl p-4 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none h-24 md:h-auto resize-none text-sm font-medium text-slate-700 cursor-text transition-all shadow-sm"
                placeholder="Detalhes adicionais, condições de entrega ou qualquer informação relevante."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div
          className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 p-4 md:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-50 print:hidden"
          ref={btnRef}
        >
          <div className="max-w-5xl mx-auto">
            <div className="mb-4">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                  <FiCheckCircle
                    className={
                      isFullyResolved ? 'text-emerald-500' : 'text-slate-400'
                    }
                    size={14}
                  />
                  Progresso da Cotação
                </span>
                <span
                  className={`text-xs md:text-sm font-black ${isFullyResolved ? 'text-emerald-600' : 'text-indigo-600'}`}
                >
                  {resolvedMeds} de {totalMeds} itens ({progressPercent}%)
                </span>
              </div>
              <div className="h-2.5 md:h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full transition-all duration-700 ease-out rounded-full ${isFullyResolved ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                  style={{ width: `${progressPercent}%` }}
                >
                  {isFullyResolved && (
                    <div className="w-full h-full bg-white/20 animate-[pulse_2s_ease-in-out_infinite]"></div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex flex-col text-center sm:text-left w-full sm:w-auto">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-0.5">
                  Subtotal do Orçamento
                </span>
                <span className="text-2xl md:text-3xl font-black text-indigo-600 tracking-tight font-mono">
                  {(shipment.totalCost || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors cursor-pointer text-sm flex items-center justify-center gap-2 active:scale-95"
                >
                  <FiPrinter size={16} /> Imprimir
                </button>

                <button
                  onClick={handleConfirmOrderClick}
                  className={`px-8 py-3.5 rounded-xl font-black flex items-center justify-center gap-2 transition-all text-sm
                    ${
                      isFullyResolved
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-xl shadow-emerald-200 active:scale-95 cursor-pointer'
                        : 'bg-amber-500 text-white hover:bg-amber-600 shadow-xl shadow-amber-200 active:scale-95 cursor-pointer'
                    }
                  `}
                >
                  {isFullyResolved ? (
                    <FiTruck size={18} />
                  ) : (
                    <FiAlertTriangle size={18} />
                  )}
                  {isFullyResolved
                    ? 'ENVIAR PEDIDO AGORA'
                    : 'ENVIAR INCOMPLETO'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {confirmation.isOpen && (
        <ConfirmModal
          title={confirmation.title}
          message={confirmation.message}
          confirmText={confirmation.confirmText}
          isDestructive={confirmation.isDestructive}
          onConfirm={confirmation.onConfirm}
          onClose={closeConfirmation}
        />
      )}
    </div>
  );
}