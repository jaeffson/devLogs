import { openDB } from 'idb';

const DB_NAME = 'medlogs-db';
const STORE_NAME = 'sync-queue';

// Inicializa o banco de dados
export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

// Adiciona uma requisição à fila
export const addToSyncQueue = async (requestData) => {
  const db = await initDB();
  return db.add(STORE_NAME, {
    ...requestData,
    timestamp: Date.now(),
  });
};

// Obtém todos os itens da fila
export const getSyncQueue = async () => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

// Remove um item da fila (após sucesso)
export const removeFromQueue = async (id) => {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
};

// Conta quantos itens pendentes existem (útil para UI)
export const getQueueCount = async () => {
  const db = await initDB();
  return db.count(STORE_NAME);
};