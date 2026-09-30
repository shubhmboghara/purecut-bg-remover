/**
 * High-Scale IndexedDB Storage Engine for PureCut Batch Studio
 * Stores up to 10,000+ completed cutouts directly on the user's SSD/HDD
 * without exhausting the browser's JavaScript V8 heap limit.
 */

const DB_NAME = 'purecut_batch_db';
const DB_VERSION = 1;
const STORE_NAME = 'cutouts';

let dbInstance = null;

function getDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject(event.target.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Save a completed image Blob to IndexedDB
 */
export async function saveBatchBlob(id, blob, metadata = {}) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record = {
        id,
        blob,
        size: blob.size,
        type: blob.type,
        timestamp: Date.now(),
        ...metadata
      };
      const req = store.put(record);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[BatchStorage] Failed to save blob for ${id}:`, err);
    return false;
  }
}

/**
 * Retrieve a single Blob by item ID
 */
export async function getBatchBlob(id) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        resolve(req.result ? req.result.blob : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[BatchStorage] Failed to get blob for ${id}:`, err);
    return null;
  }
}

/**
 * Delete a single Blob by ID
 */
export async function deleteBatchBlob(id) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    return false;
  }
}

/**
 * Clear all stored batch cutouts from IndexedDB
 */
export async function clearBatchStorage() {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    return false;
  }
}

/**
 * Get count and total storage size consumed
 */
export async function getBatchStorageStats() {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.openCursor();
      let totalBytes = 0;
      let count = 0;

      req.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          count++;
          totalBytes += cursor.value.size || 0;
          cursor.continue();
        } else {
          resolve({ count, totalBytes });
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    return { count: 0, totalBytes: 0 };
  }
}

/**
 * Stream blobs one by one using a cursor to prevent heap allocation spikes
 */
export async function iterateBatchBlobs(onBlobCallback) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.openCursor();

    req.onsuccess = async (event) => {
      const cursor = event.target.result;
      if (cursor) {
        await onBlobCallback(cursor.value.id, cursor.value.blob, cursor.value);
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
  });
}
