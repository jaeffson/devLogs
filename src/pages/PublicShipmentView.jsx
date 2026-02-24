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

  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isDestructive: false,
  });

  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
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
          const hasSeenTour = localStorage.getItem('medlogs_supplier_tour');
          if (!hasSeenTour && res.data.status === 'aguardando_fornecedor') {
            setTimeout(() => setShowTour(true), 1000);
          }
        }
      } catch (error) {
        if (isFirstLoad) {
          console.error('Erro ao carregar:', error);
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
      title: 'Bem-vindo ao Portal do Fornecedor!',
      text: 'Este é o seu ambiente seguro para responder às cotações do MedLogs. Vamos te mostrar como preencher a proposta em 4 passos rápidos.',
      target: null,
    },
    {
      title: 'Passo 1: Ajuste de Quantidade',
      text: 'Caso a caixa venha com uma quantidade diferente da solicitada ou você só possa entregar uma parte, altere a quantidade usando os botões de + e -.',
      target: qtyRef,
    },
    {
      title: 'Passo 2: Preço Unitário',
      text: 'Preencha o valor de cada unidade aqui. O sistema calculará o subtotal e o valor total do orçamento automaticamente no rodapé.',
      target: priceRef,
    },
    {
      title: 'Passo 3: Itens em Falta',
      text: "Se você não tiver este medicamento no estoque, clique no botão 'Marcar Falta'. O item será transferido para um saldo futuro automaticamente.",
      target: missingRef,
    },
    {
      title: 'Passo 4: Envio Final',
      text: 'Após preencher tudo (e informar o seu nome), clique aqui para enviar o pedido. O hospital será notificado na hora!',
      target: btnRef,
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
    localStorage.setItem('medlogs_supplier_tour', 'true');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    return map[u] ? (qty > 1 ? map[u].p : map[u].s) : unit.toUpperCase();
  };

  const handleItemChange = (patientIndex, medIndex, field, value) => {
    if (finished) return;

    const newShipment = { ...shipment };
    newShipment.items = JSON.parse(JSON.stringify(shipment.items));
    const item = newShipment.items[patientIndex].medications[medIndex];

    if (field === 'unitPrice') {
      let sanitizedValue = value.replace(',', '.');
      const numValue = parseFloat(sanitizedValue);
      item.unitPrice = isNaN(numValue) ? 0 : numValue;
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

  const handleConfirmOrderClick = () => {
    if (!senderName.trim()) {
      toast.error(
        'Por favor, informe seu nome como responsável pelo preenchimento.',
        {
          icon: '👤',
          style: { borderRadius: '10px', background: '#333', color: '#fff' },
        }
      );
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      return;
    }

    setConfirmation({
      isOpen: true,
      title: 'Confirmar Envio do Orçamento',
      message:
        'Confirma o envio deste pedido? Essa ação não pode ser desfeita e o valor será registrado no sistema.',
      confirmText: 'Sim, Enviar Agora',
      isDestructive: false,
      onConfirm: processOrder,
    });
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
  const getExpirationDate = () => {
    if (!shipment || !shipment.closedAt) return null;
    const date = new Date(shipment.closedAt);
    date.setDate(date.getDate() + 5);
    return date.toLocaleDateString('pt-BR');
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-gray-500 animate-pulse">
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
            foi enviada e a Secretaria de Saúde já foi notificada. A janela já
            pode ser fechada.
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

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans relative">
      {showTour && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] transition-opacity duration-500 backdrop-blur-sm"></div>
      )}

      {showTour && (
        <div
          className="fixed z-[101] w-[90%] max-w-sm bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 animate-in zoom-in-95 duration-300"
          style={
            tourSteps[tourStep].target && tourSteps[tourStep].target.current
              ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
              : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
          }
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
        <div className="bg-amber-50 border border-amber-200 p-5 mb-6 rounded-2xl shadow-sm print:hidden flex gap-4 items-start">
          <div className="bg-amber-100 p-2 rounded-xl text-amber-600 shrink-0">
            <FiClock size={20} />
          </div>
        <div>
            <h3 className="font-black text-amber-800 text-base">
              Atenção: Envio Único e Faturamento Parcial
            </h3>
            <p className="text-sm text-amber-700 mt-1 font-medium">
              Este link é de <strong>uso único e será desativado após o envio</strong>. Caso não tenha o estoque completo, informe apenas o que pode entregar agora ou marque "Falta". O sistema criará o pedido de saldo automaticamente para a Secretaria.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 print:hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-black text-amber-800 text-base">
              Importante: Regras de Preenchimento
            </h3>
            <p className="text-sm text-amber-700 mt-1 font-medium">
              Confira os valores com atenção! Após clicar em enviar, <strong>este link será encerrado definitivamente</strong>. Qualquer item com entrega parcial ou marcado como "Falta" será transferido para um saldo futuro pela nossa equipe.
            </p>
          </div>
          <button
            onClick={() => {
              setTourStep(0);
              setShowTour(true);
            }}
            className="text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer shrink-0"
          >
            Rever Tutorial
          </button>
        </div>

        <div className="space-y-6">
          {shipment.items.map((patientItem, pIndex) => (
            <div
              key={patientItem._id || pIndex}
              className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100">
                <h3 className="font-black text-slate-800 text-sm flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                    {patientItem.patientName.charAt(0).toUpperCase()}
                  </div>
                  {patientItem.patientName}
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-white text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="p-5 w-1/3">Medicamento</th>
                      <th className="p-5 text-center w-32">Qtd Solicitada</th>
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
                          key={mIndex}
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
                                />
                                <span className="leading-tight break-words whitespace-normal">
                                  Obs: {med.observation}
                                </span>
                              </div>
                            )}


                            {(med.status === 'falta' ||
                              (med.requestedQuantity > med.quantity &&
                                med.status !== 'falta')) && (
                              <div className="mt-2 inline-flex items-center gap-1.9 text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                                <FiAlertTriangle size={12} />
                                {med.status === 'falta'
                                  ? 'Pedido Parcial: Favor, consulte um novo link para esses itens.'
                                  : `Saldo pendente: ${med.requestedQuantity - med.quantity} caixas`}
                              </div>
                            )}
                          </td>

                          <td className="p-5 text-center align-top">
                            {med.status === 'falta' ? (
                              <span className="text-slate-300 font-mono font-bold">
                                -
                              </span>
                            ) : (
                              <div
                                className="flex flex-col items-center"
                                ref={isFirstItem ? qtyRef : null}
                                style={
                                  showTour && isFirstItem && tourStep === 1
                                    ? {
                                        position: 'relative',
                                        zIndex: 102,
                                        backgroundColor: 'white',
                                        padding: '4px',
                                        borderRadius: '8px',
                                        boxShadow:
                                          '0 0 0 4px white, 0 0 0 6px #4f46e5',
                                      }
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
                                    className="px-3 hover:bg-slate-100 text-slate-500 cursor-pointer h-full border-r border-slate-100 transition-colors"
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
                                    className="px-3 hover:bg-slate-100 text-indigo-600 cursor-pointer h-full border-l border-slate-100 transition-colors"
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
                                showTour && isFirstItem && tourStep === 2
                                  ? {
                                      position: 'relative',
                                      zIndex: 102,
                                      backgroundColor: 'white',
                                      padding: '4px',
                                      borderRadius: '8px',
                                      boxShadow:
                                        '0 0 0 4px white, 0 0 0 6px #4f46e5',
                                    }
                                  : {}
                              }
                            >
                              <span className="absolute left-3 top-3.5 text-slate-400 text-sm font-bold">
                                R$
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className={`w-full pl-8 pr-3 py-3 border-2 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-right font-mono font-black transition-all shadow-inner ${med.status === 'falta' ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white'}`}
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
                                disabled={med.status === 'falta'}
                              />
                            </div>
                          </td>

                          <td className="p-5 align-top text-right font-mono font-black text-slate-800 pt-8">
                            {med.status === 'falta' ? (
                              <span className="text-slate-300">---</span>
                            ) : (
                              (med.totalPrice || 0).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })
                            )}
                          </td>

                          {/* NOVO: BOTÃO DE MARCAR FALTA / GERAR SALDO */}
                          <td className="p-5 align-top text-center print:hidden">
                            <div
                              ref={isFirstItem ? missingRef : null}
                              style={
                                showTour && isFirstItem && tourStep === 3
                                  ? {
                                      position: 'relative',
                                      zIndex: 102,
                                      backgroundColor: 'white',
                                      padding: '4px',
                                      borderRadius: '8px',
                                      boxShadow:
                                        '0 0 0 4px white, 0 0 0 6px #4f46e5',
                                    }
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
                                className={`w-full py-2 px-2 mt-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                                  med.status === 'falta'
                                    ? 'bg-red-50 text-red-600 border-red-200 shadow-inner'
                                    : 'bg-white text-slate-400 border-slate-200 hover:border-red-300 hover:text-red-500 hover:bg-red-50/30 shadow-sm'
                                }`}
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
            </div>
          ))}
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
                className="w-full border-2 border-slate-200 bg-slate-50 rounded-2xl p-4 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none h-14 md:h-auto resize-none text-sm font-medium text-slate-700 cursor-text transition-all shadow-sm"
                placeholder="Detalhes adicionais, condições de entrega ou qualquer informação relevante."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div
          className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 p-4 md:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-50 print:hidden"
          ref={btnRef}
          style={
            showTour && tourStep === 4
              ? { zIndex: 102, position: 'relative' }
              : {}
          }
        >
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-col text-center sm:text-left">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">
                Subtotal do Orçamento
              </span>
              <span className="text-3xl font-black text-indigo-600 tracking-tight font-mono">
                {(shipment.totalCost || 0).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => window.print()}
                className="flex-1 sm:flex-none px-5 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-95 text-sm"
              >
                <FiPrinter size={18} />{' '}
                <span className="hidden sm:inline">Imprimir Rascunho</span>
              </button>
              <button
                onClick={handleConfirmOrderClick}
                className="flex-1 sm:flex-none px-8 py-3.5 bg-emerald-500 text-white rounded-xl font-black hover:bg-emerald-600 shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer text-sm"
              >
                <FiTruck size={20} /> ENVIAR PEDIDO AGORA
              </button>
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
