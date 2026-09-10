"use client";

export type QueuedSet = { id: string; path: string; body: string };

const databaseName = "cwfitness-workout-outbox";
const storeName = "sets";

function store(mode: IDBTransactionMode) {
  return new Promise<IDBObjectStore>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName, { keyPath: "id" });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result.transaction(storeName, mode).objectStore(storeName));
  });
}

export async function enqueueSet(item: QueuedSet) { (await store("readwrite")).put(item); }
export async function queuedSets() {
  const source = await store("readonly");
  return new Promise<QueuedSet[]>((resolve, reject) => { const request = source.getAll(); request.onsuccess = () => resolve(request.result as QueuedSet[]); request.onerror = () => reject(request.error); });
}
export async function removeQueuedSet(id: string) { (await store("readwrite")).delete(id); }
