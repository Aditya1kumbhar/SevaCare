import Dexie, { type EntityTable } from 'dexie';

// Define the interface for the local queue item
export interface OfflineQueueItem {
  id?: number;
  url: string;
  method: string;
  body?: any;
  headers?: any;
  createdAt: string;
  status: 'pending' | 'syncing' | 'failed';
}

// Define local cache for read data (e.g., patient logs, tasks)
export interface PatientCache {
  id: string;
  patientId: string;
  data: any;
  updatedAt: string;
}

const db = new Dexie('SevaCareOfflineDB') as Dexie & {
  syncQueue: EntityTable<OfflineQueueItem, 'id'>;
  patientCache: EntityTable<PatientCache, 'id'>;
};

// Schema definition
db.version(1).stores({
  syncQueue: '++id, status, createdAt',
  patientCache: 'id, patientId, updatedAt',
});

export { db };

// Helper to add failed requests to the queue when offline
export async function queueRequestForSync(url: string, method: string, body?: any, headers?: any) {
  return await db.syncQueue.add({
    url,
    method,
    body,
    headers,
    createdAt: new Date().toISOString(),
    status: 'pending'
  });
}

// Helper to sync when back online
export async function processSyncQueue() {
  if (!navigator.onLine) return;

  const pendingItems = await db.syncQueue.where('status').equals('pending').toArray();
  
  if (pendingItems.length === 0) return;

  for (const item of pendingItems) {
    try {
      if (item.id) {
        await db.syncQueue.update(item.id, { status: 'syncing' });
      }

      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers || { 'Content-Type': 'application/json' },
        body: item.body ? JSON.stringify(item.body) : undefined
      });

      if (response.ok && item.id) {
        // Success - remove from queue
        await db.syncQueue.delete(item.id);
      } else if (item.id) {
        // Failed - mark as failed
        await db.syncQueue.update(item.id, { status: 'failed' });
      }
    } catch (error) {
       console.error("Failed to sync item", item, error);
       if (item.id) {
         // Keep pending if it was a network error so it retries later
         await db.syncQueue.update(item.id, { status: 'pending' });
       }
    }
  }
}

// Set up online event listener to trigger sync automatically
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    processSyncQueue();
  });
}
