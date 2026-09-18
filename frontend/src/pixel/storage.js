import { uid } from "./model";

const DATABASE = "wallcraft-pixel-studio";
let database;
const session = uid();
const revisions = new Map();
function open() {
  if (!database)
    database = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE, 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("projects");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        database = undefined;
        reject(request.error);
      };
    });
  return database;
}
export async function readProject() {
  const db = await open();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction("projects")
      .objectStore("projects")
      .get("current");
    request.onsuccess = () => {
      const stored = request.result;
      if (stored?.project) {
        for (const [key, revision] of Object.entries(
          stored.cloudRevisions || {},
        ))
          revisions.set(key, revision);
      }
      resolve(stored?.project || stored);
    };
    request.onerror = () => reject(request.error);
  });
}
export async function saveProject(project) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("projects", "readwrite");
    // Keep the base revisions beside this browser snapshot. Another tab must
    // never borrow a newer revision and overwrite work it has not loaded.
    tx.objectStore("projects").put(
      {
        project,
        session,
        cloudRevisions: Object.fromEntries(
          [...revisions].filter(([key]) => key.endsWith(`:${project.id}`)),
        ),
      },
      "current",
    );
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("Saving was interrupted."));
  });
}

export async function readCloudRevision(account, id) {
  return revisions.get(`${account}:${id}`) || 0;
}

export async function saveCloudRevision(account, id, revision) {
  const key = `${account}:${id}`;
  revisions.set(key, revision);
  try {
    const db = await open();
    await new Promise((resolve, reject) => {
      const tx = db.transaction("projects", "readwrite");
      const records = tx.objectStore("projects");
      const request = records.get("current");
      request.onsuccess = () => {
        const stored = request.result;
        if (stored?.session === session && stored.project.id === id) {
          stored.cloudRevisions[key] = revision;
          records.put(stored, "current");
        }
      };
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () =>
        reject(tx.error || new Error("Saving sync status was interrupted."));
    });
  } catch {
    // Account saving remains available when the browser cannot store data.
    // The editor separately reports local-storage failures.
  }
}
