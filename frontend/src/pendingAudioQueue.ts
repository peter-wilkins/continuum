import type { AudioCaptureChunk } from './audioCapture.js';

export type PendingAudioStatus = 'pending' | 'processing' | 'failed';

export type PendingAudioItem = {
  id: string;
  blob: Blob;
  createdAt: string;
  durationMs: number;
  sizeBytes: number;
  mimeType: string;
  status: PendingAudioStatus;
  attemptCount: number;
  lastAttemptAt: string | null;
  lastError: string | null;
};

export type PendingAudioSummary = {
  total: number;
  pending: number;
  processing: number;
  failed: number;
  totalSizeBytes: number;
};

const DATABASE_NAME = 'continuum-offline-queue';
const DATABASE_VERSION = 1;
const STORE_NAME = 'pending-audio';

let openPromise: Promise<IDBDatabase> | null = null;

export async function enqueuePendingAudio(chunk: AudioCaptureChunk): Promise<PendingAudioItem> {
  const item: PendingAudioItem = {
    ...chunk,
    status: 'pending',
    attemptCount: 0,
    lastAttemptAt: null,
    lastError: null,
  };

  const database = await openDatabase();
  await runStoreRequest(database, 'readwrite', (store) => store.put(item));
  return item;
}

export async function listPendingAudio(): Promise<PendingAudioItem[]> {
  const database = await openDatabase();
  const items = await runStoreRequest<PendingAudioItem[]>(
    database,
    'readonly',
    (store) => store.getAll(),
  );

  return items.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export async function getPendingAudioSummary(): Promise<PendingAudioSummary> {
  const items = await listPendingAudio();

  return {
    total: items.length,
    pending: items.filter((item) => item.status === 'pending').length,
    processing: items.filter((item) => item.status === 'processing').length,
    failed: items.filter((item) => item.status === 'failed').length,
    totalSizeBytes: items.reduce((total, item) => total + item.sizeBytes, 0),
  };
}

export async function markPendingAudioProcessing(id: string): Promise<void> {
  await updatePendingAudio(id, (item) => ({
    ...item,
    status: 'processing',
    attemptCount: item.attemptCount + 1,
    lastAttemptAt: new Date().toISOString(),
    lastError: null,
  }));
}

export async function markPendingAudioFailed(id: string, error: string): Promise<void> {
  await updatePendingAudio(id, (item) => ({
    ...item,
    status: 'failed',
    lastError: error,
  }));
}

export async function deletePendingAudio(id: string): Promise<void> {
  const database = await openDatabase();
  await runStoreRequest(database, 'readwrite', (store) => store.delete(id));
}

async function updatePendingAudio(
  id: string,
  update: (item: PendingAudioItem) => PendingAudioItem,
): Promise<void> {
  const database = await openDatabase();

  await runTransaction(database, 'readwrite', (store) => {
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const item = getRequest.result as PendingAudioItem | undefined;
      if (!item) return;
      store.put(update(item));
    };
  });
}

function openDatabase(): Promise<IDBDatabase> {
  if (openPromise) return openPromise;

  openPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open pending audio queue'));
  });

  return openPromise;
}

function runStoreRequest<T>(
  database: IDBDatabase,
  mode: IDBTransactionMode,
  requestFactory: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = requestFactory(transaction.objectStore(STORE_NAME));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Pending audio queue request failed'));
    transaction.onerror = () => reject(transaction.error ?? new Error('Pending audio queue failed'));
  });
}

function runTransaction(
  database: IDBDatabase,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    action(transaction.objectStore(STORE_NAME));

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Pending audio queue failed'));
  });
}
