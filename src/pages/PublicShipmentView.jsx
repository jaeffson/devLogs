import React, { useState, useEffect } from 'react';
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
  FiFileText // Ícone para a observação
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../components/common/Modal'; // Importando o Modal Moderno

export default function PublicShipmentView() {
  const { token } = useParams();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [observations, setObservations] = useState('');

  // Estado para controlar o Modal de Confirmação
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isDestructive: false,
  });
 const API_URL = import.meta.env.VITE_API_URL || 'https://api.parari.medlogs.com.br/api';
  useEffect(() => {
    async function load() {
      try {
        const res = await axios.get(`${API_URL}/shipments/public/${token}`);
        setShipment(res.data);
        if (res.data.observations) setObservations(res.data.observations);

        // Se já não estiver aguardando o fornecedor, bloqueia a tela
        if (res.data.status !== 'aguardando_fornecedor') {
          setFinished(true);
        }
      } catch (error) {
        console.error('Erro ao carregar:', error);
        toast.error('Erro ao carregar pedido. Link inválido ou expirado.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

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

    // Recalcula o Subtotal da Linha (Preço * Quantidade)
    if (item.status !== 'falta') {
      item.totalPrice = (item.unitPrice || 0) * (item.quantity || 1);
    } else {
      item.totalPrice = 0;
    }

    // Recalcula Total Geral
    let total = 0;
    newShipment.items.forEach((p) => {
      p.medications.forEach((m) => {
        if (m.status === 'disponivel') {
          total += m.totalPrice || 0;
        }
      });
    });
    newShipment.totalCost = total;

    setShipment(newShipment);
  };

  // --- NOVA LÓGICA DE CONFIRMAÇÃO COM MODAL ---
  
  // 1. Abre o Modal
  const handleConfirmOrderClick = () => {
    setConfirmation({
      isOpen: true,
      title: 'Confirmar Envio do Orçamento',
      message: 'Confirma o envio deste pedido? Essa ação não pode ser desfeita e o valor será registrado no sistema.',
      confirmText: 'Sim, Enviar Agora',
      isDestructive: false,
      onConfirm: processOrder // Chama a função real ao confirmar
    });
  };

  // 2. Fecha o Modal
  const closeConfirmation = () => {
    setConfirmation({ ...confirmation, isOpen: false });
  };

  // 3. Executa o Envio (Chamada pela Modal)
  const processOrder = async () => {
    try {
      await axios.post(`${API_URL}/shipments/public/${token}/confirm`, {
        items: shipment.items,
        totalCost: shipment.totalCost,
        observations: observations,
      });
      
      setFinished(true);
      toast.success('Pedido enviado com sucesso!');
      window.scrollTo(0, 0);
      closeConfirmation();
      
    } catch (error) {
      console.error('Erro ao enviar:', error);
      toast.error('Erro ao enviar pedido. Tente novamente.');
      // Importante: Lançar o erro para o Modal saber que falhou e parar o spinner
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
      <div className="p-10 text-center font-bold text-gray-500">
        Carregando pedido...
      </div>
    );
  if (!shipment)
    return (
      <div className="p-10 text-center text-red-600 font-bold">
        Pedido não encontrado ou link expirado.
      </div>
    );

  if (finished) {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-lg border border-green-100">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle size={40} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Remessa enviada com Sucesso!
          </h1>
          <p className="text-gray-600 mb-6">
            Obrigado, <strong>{shipment.supplier}</strong>.<br />
            Os dados foram recebidos e o valor registrado no sistema.
          </p>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 mx-auto cursor-pointer shadow-md transition-transform hover:scale-105"
          >
            <FiPrinter /> Imprimir Comprovante
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-32 font-sans">
      <header className="bg-blue-900 text-white p-6 shadow-md print:hidden sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <FiPackage className="text-blue-300" /> MedLogs Pedidos
            </h1>
            <p className="text-blue-200 text-sm opacity-80">
              Portal do Fornecedor
            </p>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg">{shipment.supplier}</div>
            <div className="text-sm text-blue-200 font-mono">
              Ref: {shipment.code}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto mt-8 p-4">
        {/* AVISO DE 5 DIAS */}
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6 rounded-r shadow-sm print:hidden flex gap-3 items-start animate-fade-in">
          <FiClock className="text-orange-600 text-2xl mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-orange-800 text-lg">
              Atenção: Validade do Link
            </h3>
            <p className="text-sm text-orange-800 mt-1">
              Este formulário expira em <strong>5 dias corridos</strong> após a
              emissão.
              <br />
              Data limite para preenchimento:{' '}
              <strong>{getExpirationDate()}</strong>.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 print:hidden">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
            <FiAlertTriangle className="text-blue-500" /> Instruções de
            Preenchimento:
          </h3>
          <ul className="text-sm text-gray-600 list-disc ml-5 space-y-2">
            <li>
              Preencha o <strong>Valor Unitário</strong> e ajuste a{' '}
              <strong>Quantidade</strong> se necessário.
            </li>
            <li>
              Se não tiver o item em estoque, marque <strong>"Em Falta"</strong>
              .
            </li>
            <li>
              Use o campo de <strong>Observações</strong> para detalhes de
              entrega.
            </li>
          </ul>
        </div>

        <div className="space-y-6">
          {shipment.items.map((patientItem, pIndex) => (
            <div
              key={patientItem._id || pIndex}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h3 className="font-bold text-gray-700 uppercase tracking-wide text-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>{' '}
                  {patientItem.patientName}
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-white text-gray-500 text-xs uppercase font-semibold border-b">
                    <tr>
                      <th className="p-4 w-1/3">Medicamento</th>
                      <th className="p-4 text-center w-32">Qtd Enviada</th>
                      <th className="p-4 w-40 print:hidden">
                        Valor Unit. (R$)
                      </th>
                      <th className="p-4 text-right w-32">Subtotal</th>
                      <th className="p-4 text-center w-24 print:hidden">
                        Em Falta?
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {patientItem.medications.map((med, mIndex) => (
                      <tr
                        key={mIndex}
                        className={`transition-colors ${med.status === 'falta' ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                      >
                        <td className="p-4 align-top">
                          <div className="font-bold text-gray-800">
                            {med.name || med.medicationId?.name}
                          </div>
                          
                          {/* --- EXIBIÇÃO DA OBSERVAÇÃO --- */}
                          {med.observation && (
                            <div className="mt-2 inline-flex items-start gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1.5 rounded-md max-w-full">
                                <FiFileText className="mt-0.5 flex-shrink-0" size={12} />
                                <span className="font-semibold uppercase leading-tight break-words whitespace-normal">
                                  Obs: {med.observation}
                                </span>
                            </div>
                          )}
                          {/* ----------------------------- */}

                          {med.status === 'falta' && (
                            <span className="inline-block mt-2 text-[10px] text-red-600 font-bold bg-red-100 px-2 py-0.5 rounded border border-red-200">
                              INDISPONÍVEL
                            </span>
                          )}
                        </td>

                        {/* COLUNA DE QUANTIDADE EDITÁVEL */}
                        <td className="p-4 text-center align-top">
                          {med.status === 'falta' ? (
                            <span className="text-gray-400 font-mono">-</span>
                          ) : (
                            <div className="flex flex-col items-center">
                              <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden h-8 w-24 shadow-sm print:border-none">
                                {/* Botão Menos */}
                                <button
                                  onClick={() =>
                                    handleItemChange(
                                      pIndex,
                                      mIndex,
                                      'quantity',
                                      med.quantity - 1
                                    )
                                  }
                                  className="px-2 hover:bg-gray-100 text-gray-500 cursor-pointer h-full border-r border-gray-300 print:hidden"
                                >
                                  <FiMinus size={10} />
                                </button>

                                {/* Valor */}
                                <span className="flex-1 text-center text-sm font-bold text-gray-800 leading-8">
                                  {med.quantity}
                                </span>

                                {/* Botão Mais */}
                                <button
                                  onClick={() =>
                                    handleItemChange(
                                      pIndex,
                                      mIndex,
                                      'quantity',
                                      med.quantity + 1
                                    )
                                  }
                                  className="px-2 hover:bg-gray-100 text-blue-600 cursor-pointer h-full border-l border-gray-300 print:hidden"
                                >
                                  <FiPlus size={10} />
                                </button>
                              </div>
                              <span className="text-[10px] text-gray-500 mt-1 font-mono uppercase">
                                {getSmartUnit(med.quantity, med.unit)}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="p-4 align-top print:hidden">
                          <div className="relative group">
                            <span className="absolute left-3 top-3 text-gray-400 text-sm">
                              R$
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 text-right font-mono text-gray-700 font-bold cursor-pointer"
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
                        <td className="p-4 align-top text-right font-mono font-bold text-gray-700 pt-5">
                          {med.status === 'falta' ? (
                            <span className="text-gray-400">---</span>
                          ) : (
                            (med.totalPrice || 0).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })
                          )}
                        </td>
                        <td className="p-4 align-top text-center pt-5 print:hidden">
                          <input
                            type="checkbox"
                            className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer transition-transform hover:scale-110"
                            checked={med.status === 'falta'}
                            onChange={(e) =>
                              handleItemChange(
                                pIndex,
                                mIndex,
                                'status',
                                e.target.checked
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <FiMessageSquare className="text-blue-500" /> Observações do
            Fornecedor
          </h3>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none text-sm text-gray-700 cursor-text"
            placeholder="Informe aqui prazos de entrega..."
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50 print:hidden">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-col text-center sm:text-left">
              <span className="text-xs text-gray-500 uppercase font-bold tracking-wide">
                Valor Total do Orçamento
              </span>
              <span className="text-3xl font-bold text-blue-600 tracking-tight">
                {(shipment.totalCost || 0).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => window.print()}
                className="flex-1 sm:flex-none px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <FiPrinter /> <span className="hidden sm:inline">Imprimir</span>
              </button>

              <button
                onClick={handleConfirmOrderClick} // Usa a nova função do Modal
                className="flex-1 sm:flex-none px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg hover:shadow-green-200 flex items-center justify-center gap-2 text-lg transition-all active:scale-95 cursor-pointer"
              >
                <FiTruck className="text-xl" /> CONCLUIR E ENVIAR
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- RENDERIZAÇÃO DO MODAL DE CONFIRMAÇÃO --- */}
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