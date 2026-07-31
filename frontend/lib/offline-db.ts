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
  actionType: 'ADD_RESIDENT' | 'LOG_VITALS' | 'BATCH_MEDS' | 'EMERGENCY_ALERT' | 'GENERIC';
}

// Local Cached Resident Profile
export interface LocalResident {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  room_number?: string;
  blood_group?: string;
  emergency_contact?: string;
  medical_history?: string;
  status?: string;
  updatedAt: string;
  pendingSync?: boolean;
}

// Local Cached Daily Health Log
export interface LocalHealthLog {
  id: string;
  resident_id: string;
  status: string;
  notes?: string;
  bp_systolic?: number;
  bp_diastolic?: number;
  pulse?: number;
  sugar_level?: number;
  temperature?: number;
  created_at: string;
  pendingSync?: boolean;
}

// Database Definition
const db = new Dexie('SevaCareOfflineDB') as Dexie & {
  syncQueue: EntityTable<OfflineQueueItem, 'id'>;
  residents: EntityTable<LocalResident, 'id'>;
  healthLogs: EntityTable<LocalHealthLog, 'id'>;
};

// Schema definition (Version 2 with Local Residents & Health Logs)
db.version(2).stores({
  syncQueue: '++id, status, actionType, createdAt',
  residents: 'id, name, room_number, updatedAt, pendingSync',
  healthLogs: 'id, resident_id, created_at, pendingSync',
});

export { db };

// ─── Queue Helper ───
export async function queueRequestForSync(
  url: string, 
  method: string, 
  body?: any, 
  headers?: any,
  actionType: OfflineQueueItem['actionType'] = 'GENERIC'
) {
  return await db.syncQueue.add({
    url,
    method,
    body,
    headers,
    actionType,
    createdAt: new Date().toISOString(),
    status: 'pending'
  });
}

function safeParseBody(body: any): any {
  if (!body) return null;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  return body;
}

function createOfflineResponse(message: string, localData?: any) {
  const data = { message, offline: true, data: localData };
  return new Response(JSON.stringify(data), {
    status: 200,
    statusText: 'OK (Offline)',
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Smart Offline Fetch Wrapper: Writes locally to Dexie IndexedDB first,
 * returns immediately for 0ms UI latency, and queues network sync!
 */
export async function smartFetch(url: string, options: RequestInit, actionType: OfflineQueueItem['actionType'] = 'GENERIC') {
  if (typeof window !== 'undefined' && !navigator.onLine) {
    await queueRequestForSync(url, options.method || 'GET', safeParseBody(options.body), options.headers, actionType);
    return createOfflineResponse('Saved locally in offline database. Will auto-sync when online.', safeParseBody(options.body));
  }

  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    console.log("Network fetch failed, queueing for offline sync", error);
    await queueRequestForSync(url, options.method || 'GET', safeParseBody(options.body), options.headers, actionType);
    return createOfflineResponse('Network unavailable. Saved in offline queue.', safeParseBody(options.body));
  }
}

// ─── Cache Resident List Locally ───
export async function cacheResidentsLocally(residentsList: LocalResident[]) {
  try {
    const now = new Date().toISOString();
    const formatted = residentsList.map(r => ({ ...r, updatedAt: now }));
    await db.residents.bulkPut(formatted);
    console.log(`[OfflineDB] Cached ${residentsList.length} residents locally`);
  } catch (err) {
    console.error('[OfflineDB] Error caching residents:', err);
  }
}

// ─── Read Residents from Dexie Local DB ───
export async function getLocalResidents(): Promise<LocalResident[]> {
  try {
    return await db.residents.toArray();
  } catch {
    return [];
  }
}

// ─── Auto Sync Process when Connection Restores ───
export async function processSyncQueue() {
  if (typeof window === 'undefined' || !navigator.onLine) return 0;

  const pendingItems = await db.syncQueue.where('status').equals('pending').toArray();
  if (pendingItems.length === 0) return 0;

  console.log(`[OfflineDB] Syncing ${pendingItems.length} offline actions to cloud...`);

  let syncedCount = 0;
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
        syncedCount++;
        console.log(`[OfflineDB] Synced ${item.actionType} item:`, item.url);
      } else if (item.id) {
        await db.syncQueue.update(item.id, { status: 'failed' });
      }
    } catch (error) {
       console.error("[OfflineDB] Failed to sync item:", item, error);
       if (item.id) {
         await db.syncQueue.update(item.id, { status: 'pending' });
       }
    }
  }

  return syncedCount;
}

// Auto-trigger sync on network restoration
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    processSyncQueue();
  });
  
  if (navigator.onLine) {
    processSyncQueue();
  }
}
