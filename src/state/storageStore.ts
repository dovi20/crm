/* Local storages (warehouses) management
   - Pure client-side management persisted in localStorage
   - IDs are strings that start with "L" (e.g. "L1", "L2"...)
   - Safe for SSR (guards for window)
*/

export type LocalStorageId = string; // e.g. "L1"
export type StorageId = number | LocalStorageId;

export type LocalStorageRow = {
  storage_id: LocalStorageId;
  storage_name: string;
  isLocal: true;
};

type PersistShape = {
  seq: number; // incremental counter for generating new IDs
  list: Array<{ id: LocalStorageId; name: string }>;
};

const KEY = "custom_storages";

function hasWindow() {
  return typeof window !== "undefined";
}

function load(): PersistShape {
  if (!hasWindow()) return { seq: 0, list: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { seq: 0, list: [] };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      const seq = Number(parsed.seq ?? 0) || 0;
      const list = Array.isArray(parsed.list) ? parsed.list : [];
      return { seq, list };
    }
  } catch {
    // ignore
  }
  return { seq: 0, list: [] };
}

function save(state: PersistShape) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function nextId(seq: number): LocalStorageId {
  return `L${seq + 1}`;
}

export const storageStore = {
  list(): LocalStorageRow[] {
    const { list } = load();
    return list.map((r) => ({
      storage_id: r.id,
      storage_name: r.name,
      isLocal: true,
    }));
  },

  create(name: string): LocalStorageRow {
    const trimmed = String(name || "").trim();
    if (!trimmed) {
      throw new Error("Storage name is required");
    }
    const st = load();
    const id = nextId(st.seq);
    st.seq = st.seq + 1;
    st.list.push({ id, name: trimmed });
    save(st);
    return { storage_id: id, storage_name: trimmed, isLocal: true };
  },

  rename(id: StorageId, newName: string) {
    const trimmed = String(newName || "").trim();
    if (!trimmed) {
      throw new Error("New storage name is required");
    }
    const st = load();
    const idx = st.list.findIndex((r) => r.id === String(id));
    if (idx === -1) {
      throw new Error("Local storage not found");
    }
    st.list[idx].name = trimmed;
    save(st);
  },

  remove(id: StorageId) {
    const st = load();
    const before = st.list.length;
    st.list = st.list.filter((r) => r.id !== String(id));
    if (st.list.length === before) {
      throw new Error("Local storage not found");
    }
    save(st);
  },
};

export default storageStore;
