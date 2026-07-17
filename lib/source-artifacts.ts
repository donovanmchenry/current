export type StoredSourceArtifact = {
  id: string;
  name: string;
  type: string;
  size: number;
  blob: Blob;
};

const databaseName = "current-source-artifacts-v1";
const storeName = "files";

function openArtifactDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("File storage is unavailable in this browser."));
      return;
    }
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("File storage could not be opened."));
  });
}

function transactionComplete(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("File storage transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("File storage transaction was cancelled."));
  });
}

export async function storeSourceArtifacts(artifacts: Array<{ id: string; file: File }>) {
  if (!artifacts.length) return;
  const database = await openArtifactDatabase();
  const transaction = database.transaction(storeName, "readwrite");
  const store = transaction.objectStore(storeName);
  for (const { id, file } of artifacts) {
    store.put({ id, name: file.name, type: file.type || "application/octet-stream", size: file.size, blob: file } satisfies StoredSourceArtifact);
  }
  await transactionComplete(transaction);
  database.close();
}

export async function readSourceArtifact(id: string) {
  const database = await openArtifactDatabase();
  const transaction = database.transaction(storeName, "readonly");
  const completed = transactionComplete(transaction);
  const request = transaction.objectStore(storeName).get(id);
  const artifact = await new Promise<StoredSourceArtifact | null>((resolve, reject) => {
    request.onsuccess = () => resolve((request.result as StoredSourceArtifact | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("The file could not be opened."));
  });
  await completed;
  database.close();
  return artifact;
}

export async function removeSourceArtifacts(ids: string[]) {
  if (!ids.length) return;
  try {
    const database = await openArtifactDatabase();
    const transaction = database.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    ids.forEach((id) => store.delete(id));
    await transactionComplete(transaction);
    database.close();
  } catch {
    // Removing a path must still succeed when local file storage is unavailable.
  }
}

export async function clearSourceArtifacts() {
  try {
    const database = await openArtifactDatabase();
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).clear();
    await transactionComplete(transaction);
    database.close();
  } catch {
    // Resetting the demo must still succeed when local file storage is unavailable.
  }
}
