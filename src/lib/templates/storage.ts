import type { TemplateProfile } from "./types";
const DB = "ns-shipping-templates";
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("profiles", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new Error("브라우저에서 양식 저장소를 열 수 없습니다."));
    request.onblocked = () =>
      reject(new Error("다른 탭을 닫고 다시 시도해주세요."));
  });
}
async function transaction<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("profiles", mode);
    const request = run(tx.objectStore("profiles"));
    tx.oncomplete = () => {
      db.close();
      resolve(request.result);
    };
    tx.onerror = tx.onabort = () => {
      db.close();
      reject(
        new Error(
          "양식을 저장하지 못했습니다. 저장 공간과 브라우저 설정을 확인해주세요.",
        ),
      );
    };
  });
}
export async function listProfiles(): Promise<TemplateProfile[]> {
  const rows = await transaction("readonly", (store) => store.getAll());
  return rows.filter(
    (p: TemplateProfile) =>
      p.version === 1 &&
      p.workbook instanceof ArrayBuffer &&
      Array.isArray(p.columns),
  );
}
export async function saveProfile(profile: TemplateProfile) {
  await transaction("readwrite", (store) => store.put(profile));
}
export async function deleteProfile(id: string) {
  await transaction("readwrite", (store) => store.delete(id));
}
