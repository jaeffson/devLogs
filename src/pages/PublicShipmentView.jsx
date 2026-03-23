import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  FiWifiOff,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../components/common/Modal';

export default function PublicShipmentView() {
  const { token } = useParams();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [observations, setObservations] = useState('');

  // =========================================================================
  // NOVO: Controle de conexão e Cache
  // =========================================================================
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const DRAFT_KEY = `medlogs_draft_${token}`; // Chave única por pedido

  // Controle do remetente
  const [senderName, setSenderName] = useState('');
  const [isSenderLocked, setIsSenderLocked] = useState(false);
  const [lastUpdateDate, setLastUpdateDate] = useState('');

  const [daysLeft, setDaysLeft] = useState(7);
  const [isExpired, setIsExpired] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadedFromOfflineDraft, setIsLoadedFromOfflineDraft] =
    useState(false);

  // Controla quais sacolas (pacientes) já foram lacradas pelo fornecedor
  const [readyBags, setReadyBags] = useState({});

  const toggleBagReady = useCallback((pId) => {
    setReadyBags((prev) => {
      const isCurrentlyReady = prev[pId] === true;
      const newBags = { ...prev, [pId]: !isCurrentlyReady };
      setHasUnsavedChanges(true); // Marca alteração para o cache
      return newBags;
    });
  }, []);

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

  // =========================================================================
  // NOVO: Monitor de Rede e Proteção de F5
  // =========================================================================
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges && !finished) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, finished]);

  // FUNÇÃO MÁGICA: Varre tudo e garante que a soma do Orçamento está 100% correta
  const recalculateShipmentTotal = (shipmentObj) => {
    let total = 0;
    shipmentObj.items.forEach((p) => {
      p.medications.forEach((m) => {
        if (m.status === 'falta' || m.unitPrice === -1) {
          m.totalPrice = 0;
        } else if (m.status === 'parcial' || m.quantity === 0) {
          m.totalPrice = 0;
        } else {
          const price = parseFloat(m.unitPrice) || 0;
          m.totalPrice = price * (m.quantity || 1);
          total += m.totalPrice;
        }
      });
    });
    shipmentObj.totalCost = total;
    return shipmentObj;
  };

  const loadData = useCallback(
    async (isFirstLoad = true) => {
      // 1. TENTA RECUPERAR RASCUNHO LOCAL PRIMEIRO
      let draftData = null;
      try {
        const savedDraftStr = localStorage.getItem(DRAFT_KEY);
        if (savedDraftStr) {
          draftData = JSON.parse(savedDraftStr);
        }
      } catch (e) {
        console.error('Erro ao ler rascunho local', e);
      }

      try {
        const res = await axios.get(`${API_URL}/shipments/public/${token}`);
        const shipmentData = res.data;

        const isAlreadyFinished =
          shipmentData.status === 'conferido' ||
          shipmentData.status === 'finalizado';

        if (isAlreadyFinished) {
          setIsExpired(false);
          setDaysLeft(0);
          setFinished(true);
          localStorage.removeItem(DRAFT_KEY);
        } else {
          const createdAt = new Date(shipmentData.createdAt || new Date());
          const now = new Date();
          const diffDays = Math.floor(
            (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          const expired = diffDays >= 7;
          setIsExpired(expired);
          setDaysLeft(expired ? 0 : 7 - diffDays);
          setFinished(expired);
        }

        if (isFirstLoad && shipmentData.observations) {
          const nameMatch = shipmentData.observations.match(
            /\[Responsável:\s*(.*?)\]/
          );
          if (nameMatch) {
            setSenderName(nameMatch[1].trim());
            setIsSenderLocked(true);
          }
          const dateMatch = shipmentData.observations.match(
            /\[Atualizado em:\s*(.*?)\]/
          );
          if (dateMatch) setLastUpdateDate(dateMatch[1]);

          const cleanObs = shipmentData.observations
            .replace(/\[Responsável:.*?\]\n?/g, '')
            .replace(/\[Atualizado em:.*?\]\n?/g, '')
            .trim();
          setObservations(cleanObs);
        }

        const dataWithMemory = shipmentData;
        dataWithMemory.items.forEach((p) =>
          p.medications.forEach((m) => {
            m.requestedQuantity = m.quantity;

            // Lógica original de status
            if (m.unitPrice === -1) m.status = 'falta';
            else if (m.quantity === 0) m.status = 'parcial';

            m.alreadySubmitted =
              (parseFloat(m.unitPrice) > 0 && !m.hasMemoryPrice) ||
              m.status === 'falta' ||
              m.status === 'enviado';

            if (m.alreadySubmitted) {
              m.isLockedByBackend = true;
            }

            if (draftData && draftData.shipment) {
              const draftPatient = draftData.shipment.items.find(
                (dp) => dp._id === p._id
              );
              if (draftPatient) {
                const draftMed = draftPatient.medications.find(
                  (dm) => dm._id === m._id
                );
                // Só aplica o rascunho se o item NÃO estiver travado pelo backend
                if (draftMed && !m.isLockedByBackend) {
                  m.quantity = draftMed.quantity;
                  m.unitPrice = draftMed.unitPrice;
                  m.status = draftMed.status;
                  setHasUnsavedChanges(true);
                }
              }
            }
          })
        );
        // Restaura campos do rascunho (observações e estado das sacolas)
        if (draftData) {
          if (draftData.observations) setObservations(draftData.observations);
          if (draftData.senderName && !isSenderLocked)
            setSenderName(draftData.senderName);
          if (draftData.readyBags) setReadyBags(draftData.readyBags);
        }

        const finalData = recalculateShipmentTotal(dataWithMemory);
        setShipment(finalData);

        if (isFirstLoad) {
          const hasSeenTour = localStorage.getItem('medlogs_supplier_tour_v3');
          if (!hasSeenTour && shipmentData.status === 'aguardando_fornecedor') {
            setTimeout(() => setShowTour(true), 1000);
          }
        }
      } catch (error) {
        // NOVO: FALLBACK OFFLINE SÉNIOR REVISADO
        if ((!navigator.onLine || !error.response) && draftData?.shipment) {
          toast.error(
            'Carregado offline! Conecte-se à internet para enviar dados atualizados.',
            {
              icon: '📶',
              duration: 8000,
            }
          );
          setShipment(draftData.shipment);
          setObservations(draftData.observations || '');
          setSenderName(draftData.senderName || '');
          setReadyBags(draftData.readyBags || {});
          setHasUnsavedChanges(true);
          setIsLoadedFromOfflineDraft(true);
        } else {
          if (isFirstLoad) {
            setShipment(null);
          }
        }
      } finally {
        if (isFirstLoad) setLoading(false);
      }
    },
    [token, API_URL, DRAFT_KEY, isSenderLocked]
  );

  useEffect(() => {
    let isMounted = true;
    if (isMounted) loadData(true);
  }, [loadData]);

  const tourSteps = [
    {
      title: 'Bem-vindo ao Portal!',
      text: 'Este é o seu ambiente seguro para responder às cotações.',
      target: null,
    },
    {
      title: 'Busca Inteligente 🔍',
      text: 'Digite o nome do paciente para focar apenas na sacola atual!',
      target: searchRef,
    },
    {
      title: 'Passo 1: Quantidade e Preço',
      text: 'Ajuste a quantidade e preencha o valor. Se o sistema lembrar do seu último preço, a caixa brilha em verde.',
      target: priceRef,
    },
    {
      title: 'Passo 2: Itens em Falta',
      text: "Se não tiver o medicamento, clique em 'Marcar Falta'.",
      target: missingRef,
    },
    {
      title: 'NOVO: Lacrar Sacola 📦',
      text: 'Terminou de montar a sacola do paciente? Clique em "Lacrar a Sacola" e limpe a tela!',
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
      // Ignora itens já submetidos no banco
      if (med.alreadySubmitted) return;

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
    const finalShipment = recalculateShipmentTotal(newShipment);
    setShipment(finalShipment);
    newShipment.items.forEach((p) =>
      p.medications.forEach((m) => {
        if (m.status !== 'falta' && m.status !== 'parcial')
          total += m.totalPrice || 0;
      })
    );
    newShipment.totalCost = total;
    setShipment(newShipment);
  };

  const handleItemChange = (filteredPIndex, medIndex, field, value) => {
    if (finished) return;

    const newShipment = { ...shipment };
    newShipment.items = JSON.parse(JSON.stringify(shipment.items));

    const filteredPatient = filteredItems[filteredPIndex];
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
        item.unitPrice = -1; // Código secreto para o backend
      } else {
        item.unitPrice = 0; // Desfez a falta, zera pra digitar de novo
      }
    }

    // Passa na nossa calculadora e atualiza a tela na hora!
    const finalShipment = recalculateShipmentTotal(newShipment);
    setShipment(finalShipment);
  };

  let totalMeds = 0;
  let resolvedMeds = 0;
  if (shipment && shipment.items) {
    shipment.items.forEach((p) => {
      p.medications.forEach((m) => {
        totalMeds++;
        if (
          m.alreadySubmitted ||
          m.status === 'falta' ||
          (m.status === 'parcial' && m.quantity === 0) ||
          parseFloat(m.unitPrice) > 0
        ) {
          resolvedMeds++;
        }
      });
    });
  }

  const progressPercent =
    totalMeds === 0 ? 0 : Math.round((resolvedMeds / totalMeds) * 100);
  const isFullyResolved = totalMeds > 0 && resolvedMeds === totalMeds;

  // =========================================================================
  // 2. AUTO-SAVE: Guardar no LocalStorage sempre que houver mudanças
  // =========================================================================
  useEffect(() => {
    // Só guarda se houver o shipment carregado, se não estiver finalizado e se houve alguma alteração
    if (shipment && !finished && hasUnsavedChanges) {
      const draftToSave = {
        shipment,
        observations,
        senderName,
        readyBags,
        timestamp: Date.now(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftToSave));
    }
  }, [
    shipment,
    observations,
    senderName,
    readyBags,
    finished,
    hasUnsavedChanges,
    DRAFT_KEY,
  ]);

  // =========================================================================
  // CARREGAMENTO INICIAL
  // =========================================================================
  useEffect(() => {
    loadData();
  }, [loadData]);

  // =========================================================================
  // HANDLERS DE INTERAÇÃO (Com gatilho para o Auto-Save)
  // =========================================================================

  const handleQuantityChange = (patientId, medId, newQuantity) => {
    if (finished) return;
    setHasUnsavedChanges(true); // <--- ATIVA O AUTO-SAVE
    setShipment((prev) => {
      const newShipment = { ...prev };
      const pIndex = newShipment.items.findIndex((p) => p._id === patientId);
      if (pIndex === -1) return prev;

      const mIndex = newShipment.items[pIndex].medications.findIndex(
        (m) => m._id === medId
      );
      if (mIndex === -1) return prev;

      newShipment.items[pIndex].medications[mIndex].quantity =
        Number(newQuantity);

      // Lógica de ajuste automático de status com base na quantidade
      if (Number(newQuantity) === 0) {
        newShipment.items[pIndex].medications[mIndex].status = 'parcial';
      } else if (
        newShipment.items[pIndex].medications[mIndex].status === 'parcial'
      ) {
        newShipment.items[pIndex].medications[mIndex].status = 'enviado';
      }

      return recalculateShipmentTotal(newShipment);
    });
  };

  const handleUnitPriceChange = (patientId, medId, newPrice) => {
    if (finished) return;
    setHasUnsavedChanges(true); // <--- ATIVA O AUTO-SAVE
    setShipment((prev) => {
      const newShipment = { ...prev };
      const pIndex = newShipment.items.findIndex((p) => p._id === patientId);
      if (pIndex === -1) return prev;

      const mIndex = newShipment.items[pIndex].medications.findIndex(
        (m) => m._id === medId
      );
      if (mIndex === -1) return prev;

      newShipment.items[pIndex].medications[mIndex].unitPrice =
        parseFloat(newPrice) || 0;
      return recalculateShipmentTotal(newShipment);
    });
  };

  const handleStatusChange = (patientId, medId, newStatus) => {
    if (finished) return;
    setHasUnsavedChanges(true); // <--- ATIVA O AUTO-SAVE
    setShipment((prev) => {
      const newShipment = { ...prev };
      const pIndex = newShipment.items.findIndex((p) => p._id === patientId);
      if (pIndex === -1) return prev;

      const mIndex = newShipment.items[pIndex].medications.findIndex(
        (m) => m._id === medId
      );
      if (mIndex === -1) return prev;

      newShipment.items[pIndex].medications[mIndex].status = newStatus;

      if (newStatus === 'falta') {
        newShipment.items[pIndex].medications[mIndex].quantity = 0;
        newShipment.items[pIndex].medications[mIndex].unitPrice = -1;
      }

      return recalculateShipmentTotal(newShipment);
    });
  };

  // =========================================================================
  // FINALIZAÇÃO E ENVIo
  // =========================================================================

  const handleConfirmOrderClick = () => {
    if (!senderName.trim()) {
      toast.error('Por favor, informe seu nome como responsável pelo ENVIO.', {
        icon: '👤',
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

      return;
    }

    // PROTEÇÃO SÉNIOR: Se não houver internet, bloqueia o envio mas avisa que está tudo seguro
    if (!isOnline) {
      toast.error(
        'Você está offline! Aguarde a ligação voltar para finalizar. Os seus dados estão a salvo no dispositivo.',
        { icon: '📶', duration: 6000 }
      );
      return;
    }

    if (!isFullyResolved) {
      setConfirmation({
        isOpen: true,
        title: 'Enviar Parcialmente?',
        message: `Você preencheu ${resolvedMeds} de ${totalMeds} itens. Os itens restantes continuarão pendentes neste link para preencher depois.\n\nDeseja enviar os preenchidos agora para a conferência?`,
        confirmText: 'Sim, Salvar e Enviar Parcial',
        isDestructive: true,
        onConfirm: processOrder,
      });
    } else {
      setConfirmation({
        isOpen: true,
        title: 'Finalizar Cotação Completa',
        message:
          'Você preencheu todos os itens! Confirma o envio definitivo deste pedido?',
        confirmText: 'Sim, Finalizar Cotação',
        isDestructive: false,
        onConfirm: processOrder,
      });
    }
  };

  const closeConfirmation = () =>
    setConfirmation((prev) => ({ ...prev, isOpen: false }));
  const processOrder = async () => {
    try {
      const dataAtual = new Date().toLocaleString('pt-BR');

      const formattedObservations = `[Responsável: ${senderName.trim()}]\n[Atualizado em: ${dataAtual}]\n${observations}`;

      await axios.post(`${API_URL}/shipments/public/${token}/confirm`, {
        items: shipment.items,
        totalCost: shipment.totalCost,
        observations: formattedObservations,
        isFullyResolved: isFullyResolved,
      });

      if (isFullyResolved) {
        setFinished(true);
        toast.success('Cotação finalizada e enviada com sucesso!');
      } else {
        toast.success(
          'Itens confirmados foram enviados! O link continua ativo.',
          { duration: 5000 }
        );
        await loadData(false);
      }

      // SUCESSO: Limpa as variáveis de rascunho
      setHasUnsavedChanges(false);
      localStorage.removeItem(DRAFT_KEY);

      closeConfirmation();
      window.scrollTo(0, 0);
    } catch (error) {
      console.error(
        'Erro detalhado do Backend:',
        error.response?.data || error.message
      );
      if (!navigator.onLine) {
        toast.error(
          'A ligação falhou durante o envio. Os seus dados estão a salvo, tente novamente.',
          { duration: 5000 }
        );
      } else {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          'Erro de conexão com o servidor. Tente novamente.';
        toast.error(`Falha no envio: ${errorMessage}`);
      }
      closeConfirmation();
    }
  };

  // DIVISÃO VISUAL ESTRITA: PENDENTES VS COMPLETOS
  const pendingPatients = [];
  const completedPatients = []; // Lista estritamente de leitura (somente consulta)

  filteredItems.forEach((patientItem, filteredIndex) => {
    // Só vai para a lista de concluídos se TODOS os remédios vieram do backend com "alreadySubmitted"
    const isTotallySubmittedFromDb = patientItem.medications.every(
      (m) => m.alreadySubmitted
    );

    if (isTotallySubmittedFromDb) {
      completedPatients.push({ ...patientItem, filteredIndex });
    } else {
      pendingPatients.push({ ...patientItem, filteredIndex });
    }
  });

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-indigo-500 animate-pulse">
        Carregando pedido seguro...
      </div>
    );

  // TELA PREMIUM DE LINK INVÁLIDO
  if (!shipment || (isExpired && !shipment)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Efeitos de fundo (Glow) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-rose-100/40 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-orange-100/40 rounded-full blur-3xl"></div>
        </div>

        {/* Cartão Central */}
        <div className="bg-white p-10 md:p-14 rounded-[2.5rem] shadow-2xl max-w-lg w-full text-center border border-slate-100 relative z-10 animate-in fade-in zoom-in duration-500">
          {/* Ícone de Alerta */}
          <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-rose-100">
            <FiAlertTriangle className="text-rose-500" size={48} />
          </div>

          <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">
            Acesso Indisponível
          </h2>

          <p className="text-slate-500 text-lg font-medium leading-relaxed mb-8">
            Não conseguimos carregar os dados desta solicitação. O link pode ter{' '}
            <strong>expirado</strong>, sido <strong>cancelado</strong>, ou a sua
            ligação falhou.
          </p>

          {/* Dicas de Resolução */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8 text-left space-y-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <FiInfo className="text-indigo-500" /> O que fazer agora?
            </h3>
            <ul className="text-sm text-slate-600 space-y-3 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold mt-0.5">•</span>
                Verifique se copiou o link inteiro sem cortar nenhuma letra.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold mt-0.5">•</span>
                Verifique a sua ligação à internet.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold mt-0.5">•</span>
                Se o erro persistir, solicite um novo link à secretaria.
              </li>
            </ul>
          </div>

          {/* Botão de Tentar Novamente */}
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <FiClock /> Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl text-center max-w-lg border border-emerald-100 animate-in zoom-in-95">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle size={48} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">
            {isExpired ? 'Link Expirado' : 'Sucesso!'}
          </h1>
          <p className="text-slate-600 mb-8 font-medium leading-relaxed">
            {isExpired ? (
              'O prazo de 7 dias para este link encerrou e ele não está mais disponível para preenchimento.'
            ) : (
              <>
                Obrigado, <strong>{shipment.supplier}</strong>.<br />A sua
                resposta foi enviada e a Secretaria já foi notificada.
              </>
            )}
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
          <div className="text-center md:text-right flex flex-col md:items-end items-center">
            <div className="font-bold text-lg">{shipment.supplier}</div>
            <div className="flex gap-2 mt-1">
              <div className="text-sm text-indigo-300 font-mono bg-indigo-800/50 px-3 py-0.5 rounded-full inline-block">
                Ref: {shipment.code}
              </div>
              <div className="text-sm font-bold bg-amber-500/20 text-amber-200 px-3 py-0.5 rounded-full inline-flex items-center gap-1 border border-amber-500/30">
                <FiClock size={14} /> Expira em: {daysLeft} dias
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto mt-8 p-4">
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl mb-6 flex items-start gap-3 shadow-sm print:hidden">
          <FiInfo className="mt-0.5 shrink-0 text-blue-600" size={18} />
          <div>
            <p className="font-bold text-sm">
              Este link ficará ativo por até 7 dias!
            </p>
            <p className="text-xs mt-1 text-blue-700">
              Você pode preencher as receitas parcialmente e enviar. O link
              continuará válido para os itens restantes até ser finalizado por
              completo.
            </p>
          </div>
        </div>

        <div
          className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 print:hidden sticky top-[88px] z-30"
          ref={searchRef}
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
        </div>

        {/* ================= SESSÃO 1: RECEITAS PENDENTES ================= */}
        {pendingPatients.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-black text-slate-700 mb-4 flex items-center gap-2">
              <FiClock className="text-amber-500" /> Receitas Pendentes
            </h2>
            <div className="space-y-6">
              {pendingPatients.map((patientItem) => {
                const pIndex = patientItem.filteredIndex;
                const pId = patientItem._id || pIndex;
                const isAllParcial = patientItem.medications.every(
                  (m) => m.status === 'parcial' && m.quantity === 0
                );

                // Se a sacola foi lacrada pelo usuário agora, minimiza ela.
                const isBagReady = readyBags[pId];

                if (isBagReady) {
                  return (
                    <div
                      key={pId}
                      className="bg-slate-100 rounded-3xl shadow-sm border border-slate-200 p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in zoom-in-95 duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-200 text-slate-500 rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0">
                          <FiPackage />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-700 text-base">
                            {patientItem.patientName}
                          </h3>
                          <p className="text-[10px] font-black tracking-widest uppercase mt-0.5 text-slate-500">
                            Sacola Pronta (Aguardando Envio)
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleBagReady(pId)}
                        className="w-full sm:w-auto px-5 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold text-xs hover:bg-slate-50 transition-colors active:scale-95 cursor-pointer flex items-center justify-center gap-2"
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
                      {isAllParcial ? (
                        <button
                          onClick={() =>
                            handlePatientAction(pIndex, 'desfazer')
                          }
                          className="cursor-pointer bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 flex items-center justify-center gap-2 active:scale-95"
                        >
                          <FiCheck size={14} /> Desfazer Envio para Depois
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            handlePatientAction(pIndex, 'parcial_total')
                          }
                          className="cursor-pointer bg-amber-100 text-amber-700 border border-amber-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-200 flex items-center justify-center gap-2 active:scale-95"
                        >
                          <FiClock size={14} /> Deixar pedido parcial
                        </button>
                      )}
                    </div>

                    <div className="w-full">
                      {/* DESKTOP TABLE */}
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
                                Ação
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {patientItem.medications.map((med, mIndex) => {
                              // Se o item já foi submetido parcialmente antes (ex: 1 remédio de 3 já foi enviado)
                              if (med.alreadySubmitted) {
                                return (
                                  <tr
                                    key={`desktop-${mIndex}`}
                                    className="bg-slate-50/50 opacity-60"
                                  >
                                    <td className="p-5">
                                      <div className="font-bold text-sm text-slate-600">
                                        {med.name || med.medicationId?.name}
                                      </div>
                                      <div className="text-[10px] text-emerald-600 font-bold uppercase mt-1 flex items-center gap-1">
                                        <FiCheck /> Já Enviado
                                      </div>
                                    </td>
                                    <td className="p-5 text-center font-bold text-slate-500">
                                      {med.quantity}
                                    </td>
                                    <td className="p-5 text-right font-mono font-bold text-slate-500">
                                      {med.status === 'falta'
                                        ? 'FALTA'
                                        : `R$ ${med.unitPrice}`}
                                    </td>
                                    <td className="p-5 text-right font-mono font-bold text-slate-500">
                                      {med.status === 'falta'
                                        ? '---'
                                        : `R$ ${med.totalPrice}`}
                                    </td>
                                    <td className="p-5 text-center"></td>
                                  </tr>
                                );
                              }

                              return (
                                <tr
                                  key={`desktop-${mIndex}`}
                                  className={`transition-colors ${med.status === 'falta' ? 'bg-red-50/50' : 'hover:bg-slate-50/50'}`}
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
                                  </td>
                                  <td className="p-5 text-center align-top">
                                    {med.status === 'falta' ||
                                    (med.status === 'parcial' &&
                                      med.quantity === 0) ? (
                                      <span className="text-slate-300 font-mono font-bold">
                                        -
                                      </span>
                                    ) : (
                                      <div className="flex flex-col items-center">
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
                                    <div className="relative inline-block w-full max-w-[120px]">
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
                                          ${med.status === 'falta' || (med.status === 'parcial' && med.quantity === 0) ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : med.hasMemoryPrice ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-[0_0_15px_rgba(52,211,153,0.4)] ring-2 ring-emerald-400/50' : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500'}`}
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
                                        disabled={
                                          med.status === 'falta' ||
                                          (med.status === 'parcial' &&
                                            med.quantity === 0)
                                        }
                                      />
                                    </div>
                                    {med.hasMemoryPrice &&
                                      med.status !== 'falta' && (
                                        <div className="text-[10px] text-emerald-600 font-black uppercase mt-2 tracking-widest flex items-center justify-end gap-1">
                                          Preço Automático
                                        </div>
                                      )}
                                  </td>
                                  <td className="p-5 align-top text-right font-mono font-black text-slate-800 pt-8">
                                    {med.status === 'falta' ? (
                                      <span className="text-slate-300">
                                        ---
                                      </span>
                                    ) : (
                                      (med.totalPrice || 0).toLocaleString(
                                        'pt-BR',
                                        { style: 'currency', currency: 'BRL' }
                                      )
                                    )}
                                  </td>
                                  <td className="p-5 align-top text-center print:hidden">
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
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* MOBILE VIEW */}
                      <div className="md:hidden divide-y divide-slate-100">
                        {patientItem.medications.map((med, mIndex) => {
                          if (med.alreadySubmitted) return null; // Pula os submetidos no mobile para simplificar

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
                                    />{' '}
                                    <span className="leading-tight truncate">
                                      {med.observation}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Qtd.
                                  </span>
                                  {med.status === 'falta' ||
                                  (med.status === 'parcial' &&
                                    med.quantity === 0) ? (
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
                                <div className="flex-1 flex flex-col gap-1 relative">
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
                                      disabled={
                                        med.status === 'falta' ||
                                        (med.status === 'parcial' &&
                                          med.quantity === 0)
                                      }
                                    />
                                  </div>
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
                                      <FiCheck size={14} /> Desfazer Falta
                                    </>
                                  ) : (
                                    <>
                                      <FiX size={14} /> Marcar Falta
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-slate-50/80 border-t border-slate-100 p-4 sm:p-5 flex justify-end">
                      <button
                        onClick={() => toggleBagReady(pId)}
                        className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-black text-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-sm bg-slate-800 text-white hover:bg-slate-900 border border-slate-700"
                      >
                        <FiCheck size={18} /> Lacrar Sacola e Ocultar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= SESSÃO 2: JÁ ENVIADOS (SOMENTE CONSULTA) ================= */}
        {completedPatients.length > 0 && (
          <div className="mt-12 pt-8 border-t-2 border-slate-200 border-dashed print:hidden">
            <h2 className="text-lg font-black text-emerald-700 mb-4 flex items-center gap-2">
              <FiCheckCircle className="text-emerald-500" /> Pacientes Já
              Enviados (Consulta)
            </h2>
            <p className="text-xs text-slate-500 mb-6 font-medium">
              Os itens abaixo já foram enviados em acessos anteriores e estão em
              conferência na secretaria. Não é possível alterá-los.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedPatients.map((patientItem) => {
                const pId = patientItem._id || patientItem.filteredIndex;

                return (
                  <div
                    key={pId}
                    className="bg-emerald-50/50 rounded-2xl shadow-sm border border-emerald-100 p-4 opacity-90"
                  >
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-emerald-100/50">
                      <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-lg shrink-0">
                        <FiCheck />
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="font-black text-slate-700 text-sm truncate">
                          {patientItem.patientName}
                        </h3>
                      </div>
                    </div>

                    <ul className="space-y-2">
                      {patientItem.medications.map((med, idx) => (
                        <li
                          key={idx}
                          className="flex justify-between items-center text-[11px]"
                        >
                          <span
                            className={`truncate pr-2 font-bold ${med.status === 'falta' ? 'text-red-500 line-through' : 'text-slate-600'}`}
                          >
                            {med.quantity}{' '}
                            {getSmartUnit(med.quantity, med.unit)} -{' '}
                            {med.name || med.medicationId?.name}
                          </span>
                          <span className="font-mono text-emerald-700 font-black shrink-0">
                            {med.status === 'falta'
                              ? 'FALTA'
                              : `R$ ${med.unitPrice}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {filteredItems.length === 0 && (
          <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center mt-6">
            <FiSearch className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-xl font-black text-slate-700">
              Nenhum item encontrado
            </h3>
            <p className="text-slate-500 mt-2 font-medium">
              Não achamos nada com o termo "{searchTerm}".
            </p>
          </div>
        )}

        {/* FOOTER DOS DADOS - BLOQUEIO DE NOME AQUI */}
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
                disabled={isSenderLocked}
                className={`w-full border-2 border-slate-200 rounded-2xl p-4 outline-none text-sm font-bold transition-all shadow-sm
                  ${
                    isSenderLocked
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-300'
                      : 'bg-slate-50 text-slate-700 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500'
                  }`}
                placeholder="Ex: João Silva"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
              {isSenderLocked && (
                <div className="mt-2 flex flex-col gap-1">
                  <span className="text-[10px] text-emerald-600 font-bold inline-flex items-center gap-1">
                    <FiCheckCircle /> Identidade confirmada
                  </span>
                  {lastUpdateDate && (
                    <span className="text-[10px] text-slate-500 font-bold inline-flex items-center gap-1">
                      <FiClock /> Último salvamento: {lastUpdateDate}
                    </span>
                  )}
                </div>
              )}
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

        {/* BOTTOM BAR DE SUBMISSÃO */}
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
                    ${isFullyResolved ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-xl shadow-emerald-200 active:scale-95 cursor-pointer' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200 active:scale-95 cursor-pointer'}
                  `}
                >
                  {isFullyResolved ? (
                    <FiTruck size={18} />
                  ) : (
                    <FiPackage size={18} />
                  )}
                  {isFullyResolved
                    ? 'FINALIZAR COTAÇÃO COMPLETA'
                    : 'SALVAR E ENVIAR PARCIAL'}
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
