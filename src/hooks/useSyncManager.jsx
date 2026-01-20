import { useState, useEffect } from 'react';
import { getSyncQueue, removeFromQueue } from '../services/offlineStorage';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useSyncManager = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const processQueue = async () => {
    if (isSyncing) return;
    
    const queue = await getSyncQueue();
    if (queue.length === 0) return;

    setIsSyncing(true);
    const toastId = toast.loading('A recuperar conexão... Sincronizando dados...');

    let successCount = 0;

    for (const item of queue) {
      try {
        // Reconstrói a chamada à API baseada nos dados guardados
        if (item.type === 'DISPENSE_RECORD') {
           await api.post('/medications/dispense', item.payload);
        }
        //outros tipos aqui se necessário (ex: CREATE_PATIENT)

        // Se der sucesso, remove da fila local
        await removeFromQueue(item.id);
        successCount++;
      } catch (error) {
        console.error('Falha ao sincronizar item:', item.id, error);
        // Se o erro não for de rede (ex: 400 Bad Request), talvez devêssemos remover ou mover para uma fila de "erros"
      }
    }

    setIsSyncing(false);
    
    if (successCount > 0) {
      toast.success(`${successCount} registos sincronizados com sucesso!`, { id: toastId });
    } else {
      toast.dismiss(toastId);
    }
  };

  return { isOnline, processQueue, isSyncing };
};