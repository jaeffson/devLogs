// src/hooks/useSystemAlerts.jsx
import React, { useMemo } from 'react';
import { AlertTriangle, Clock, Users, Package, FileText } from 'lucide-react';

export function useSystemAlerts({ user, patients, records, shipments }) {
  const alerts = useMemo(() => {
    if (!user) return [];

    const role = user?.role?.toLowerCase() || '';
    const newAlerts = [];

    const calcDaysLate = (date) => {
      if (!date) return 0;
      const diffTime = Math.abs(new Date() - new Date(date));
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const normalize = (str) => {
      if (!str) return '';
      return str
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    };

    const safePatients = patients || [];
    const safeRecords = records || [];
    const safeShipments = shipments || [];

    // ==========================================
    // 1. ALERTAS PARA PROFISSIONAL E ADMIN
    // ==========================================
    if (role === 'admin' || role === 'profissional') {
      const pacientesAtrasados = safePatients.filter(
        (p) => p.lastVisit && calcDaysLate(p.lastVisit) > 35
      );
      if (pacientesAtrasados.length > 0) {
        newAlerts.push({
          id: 'pacientes-atraso',
          title: 'Pacientes em Risco',
          message: `${pacientesAtrasados.length} paciente(s) sem retorno há mais de 35 dias.`,
          type: 'warning',
          color:
            'text-orange-600 bg-orange-100 dark:bg-orange-500/20 dark:text-orange-400',
          icon: <Users size={18} />,
          actionPath: '/patients',
          time: 'Ação Recomendada',
        });
      }

      const emConferencia = safeShipments.filter((s) => {
        const st = normalize(s.status);
        return st === 'aguardando_conferencia' || st.includes('conferencia');
      });

      if (emConferencia.length > 0) {
        newAlerts.push({
          id: 'remessas-conferencia',
          title: 'Conferência de Carga',
          message: `${emConferencia.length} remessa(s) ativa(s) aguardando conferência.`,
          type: 'critical',
          color: 'text-red-600 bg-red-100 dark:bg-red-500/20 dark:text-red-400',
          icon: <Package size={18} />,
          actionPath: '/conferencia',
          time: 'Urgente',
        });
      }
    }

    // ==========================================
    // 2. ALERTAS EXCLUSIVOS SECRETÁRIO E ADMIN
    // ==========================================
    if (role === 'admin' || role === 'secretario') {
      const remessasPendentes = safeShipments.filter((s) => {
        const st = normalize(s.status);
        return (
          st.includes('pendente') ||
          st.includes('digitacao') ||
          st.includes('abert') ||
          st.includes('aberta') ||
          st.includes('fornecedor')
          
        );
      });

      if (remessasPendentes.length > 0) {
        newAlerts.push({
          id: 'remessas-pendentes',
          title: 'Remessas Pendentes',
          message: `${remessasPendentes.length} remessa(s) precisam de envio ou revisão.`,
          type: 'info',
          color:
            'text-blue-600 bg-blue-100 dark:bg-blue-500/20 dark:text-blue-400',
          icon: <Clock size={18} />,
          actionPath: '/shipments',
          time: 'Aguardando',
        });
      }

      const registrosPendentes = safeRecords.filter(
        (r) => normalize(r.status) === 'pendente'
      );
      if (registrosPendentes.length > 0) {
        newAlerts.push({
          id: 'registros-pendentes',
          title: 'Registros Pendentes',
          message: `${registrosPendentes.length} movimentação(ões) aguardando processamento.`,
          type: 'info',
          color:
            'text-indigo-600 bg-indigo-100 dark:bg-indigo-500/20 dark:text-indigo-400',
          icon: <FileText size={18} />,
          actionPath: '/patient-history',
          time: 'Aguardando',
        });
      }
    }

    return newAlerts;
  }, [user, patients, records, shipments]);

  return {
    alerts,
    unreadCount: alerts.length,
  };
}
