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

/**
 * Smart Fetch: Tries to fetch normally, if offline or network fails, queues for sync.
 */
export async function smartFetch(url: string, options: RequestInit) {
  if (typeof window !== 'undefined' && !navigator.onLine) {
    await queueRequestForSync(url, options.method || 'GET', options.body ? JSON.parse(options.body as string) : null, options.headers);
    return { ok: true, offline: true, json: async () => ({ message: 'Saved locally. Will sync when online.' }) };
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
       // If it's a 5xx error, we might want to queue it too? 
       // For now, let's only queue on true network failure or offline state.
    }
    return response;
  } catch (error) {
    console.error("Fetch failed, queuing for offline sync", error);
    await queueRequestForSync(url, options.method || 'GET', options.body ? JSON.parse(options.body as string) : null, options.headers);
    return { ok: true, offline: true, json: async () => ({ message: 'Network failed. Saved locally.' }) };
  }
}

// Helper to sync when back online
export async function processSyncQueue() {
  if (typeof window === 'undefined' || !navigator.onLine) return;

  const pendingItems = await db.syncQueue.where('status').equals('pending').toArray();
  
  if (pendingItems.length === 0) return;

  console.log(`Attempting to sync ${pendingItems.length} items...`);

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
        await db.syncQueue.delete(item.id);
        console.log("Successfully synced item", item.url);
      } else if (item.id) {
        await db.syncQueue.update(item.id, { status: 'failed' });
      }
    } catch (error) {
       console.error("Failed to sync item", item, error);
       if (item.id) {
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
  
  // Also try to sync on initial load if online
  if (navigator.onLine) {
    processSyncQueue();
  }
}
