import type { ScrapRecord } from './scrap';

/** 스크랩을 기기(IndexedDB)에 저장해요. 앱을 다시 열어도 유지돼요. */
const DB_NAME = 'onmedia';
const STORE = 'scraps';

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE, { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        t.oncomplete = () => resolve(req ? req.result : undefined);
        t.onerror = () => reject(t.error);
      }),
  );
}

export const scrapDB = {
  all: async () => ((await tx<ScrapRecord[]>('readonly', (s) => s.getAll() as IDBRequest<ScrapRecord[]>)) ?? []),
  put: (r: ScrapRecord) => tx('readwrite', (s) => s.put(r)).catch((e) => console.error('db put', e)),
  remove: (id: string) => tx('readwrite', (s) => s.delete(id)).catch((e) => console.error('db delete', e)),
};
