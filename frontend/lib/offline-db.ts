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
 * Safely parse body for offline queueing. Handles JSON strings, plain text, and FormData gracefully.
 */
function safeParseBody(body: any): any {
  if (!body) return null;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return body; // plain text, keep as-is
    }
  }
  return body; // already an object
}

/**
 * Create a Response-compatible object for offline fallback.
 */
function createOfflineResponse(message: string) {
  const data = { message, offline: true };
  return new Response(JSON.stringify(data), {
    status: 200,
    statusText: 'OK (Offline)',
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Smart Fetch: Tries to fetch normally, if offline or network fails, queues for sync.
 */
export async function smartFetch(url: string, options: RequestInit) {
  if (typeof window !== 'undefined' && !navigator.onLine) {
    await queueRequestForSync(url, options.method || 'GET', safeParseBody(options.body), options.headers);
    return createOfflineResponse('Saved locally. Will sync when online.');
  }

  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    console.log("Fetch failed, queuing for offline sync", error);
    await queueRequestForSync(url, options.method || 'GET', safeParseBody(options.body), options.headers);
    return createOfflineResponse('Network failed. Saved locally.');
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
       console.log("Failed to sync item", item, error);
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
