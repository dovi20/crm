/* Client-side inventory distribution store (per storage)
   - Persisted in localStorage under key "inv_by_storage"
   - Shape: { [itemId: string]: { [storageId: string]: number } }
   - Safe on SSR: guards on typeof window
*/

export type ItemId = number | string;
export type StorageId = number | string;

type PerStorage = Record<string, number>;
type InventoryByStorage = Record<string, PerStorage>;

const KEY = "inv_by_storage";

function hasWindow() {
  return typeof window !== "undefined";
}

function load(): InventoryByStorage {
  if (!hasWindow()) return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as InventoryByStorage;
    }
  } catch {
    // ignore
  }
  return {};
}

function save(state: InventoryByStorage) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function toKey(x: ItemId | StorageId) {
  return String(x);
}

function clampNonNeg(n: unknown) {
  const v = Number(n);
  return isFinite(v) && v > 0 ? v : 0;
}

const api = {
  getAll(): InventoryByStorage {
    return load();
  },

  clearAll() {
    if (!hasWindow()) return;
    window.localStorage.removeItem(KEY);
  },

  // Per item
  getAllForItem(itemId: ItemId): PerStorage {
    const s = load();
    return s[toKey(itemId)] || {};
  },

  get(itemId: ItemId, storageId: StorageId): number {
    const per = api.getAllForItem(itemId);
    return clampNonNeg(per[toKey(storageId)] || 0);
  },

  set(itemId: ItemId, storageId: StorageId, qty: number) {
    const s = load();
    const iKey = toKey(itemId);
    const stKey = toKey(storageId);
    if (!s[iKey]) s[iKey] = {};
    const v = clampNonNeg(qty);
    if (v === 0) {
      delete s[iKey][stKey];
      if (Object.keys(s[iKey]).length === 0) delete s[iKey];
    } else {
      s[iKey][stKey] = v;
    }
    save(s);
  },

  add(itemId: ItemId, storageId: StorageId, delta: number) {
    const cur = api.get(itemId, storageId);
    api.set(itemId, storageId, Math.max(0, cur + Number(delta || 0)));
  },

  totalForItem(itemId: ItemId): number {
    const per = api.getAllForItem(itemId);
    return Object.values(per).reduce((sum, v) => sum + clampNonNeg(v), 0);
  },

  // Per storage
  entriesForStorage(storageId: StorageId): Array<{ item_id: string; quantity: number }> {
    const s = load();
    const stKey = toKey(storageId);
    const out: Array<{ item_id: string; quantity: number }> = [];
    for (const iKey of Object.keys(s)) {
      const qty = clampNonNeg(s[iKey]?.[stKey] ?? 0);
      if (qty > 0) out.push({ item_id: iKey, quantity: qty });
    }
    return out;
  },

  totalForStorage(storageId: StorageId): number {
    return api
      .entriesForStorage(storageId)
      .reduce((sum, row) => sum + clampNonNeg(row.quantity), 0);
  },

  clearStorage(storageId: StorageId) {
    const s = load();
    const stKey = toKey(storageId);
    let changed = false;
    for (const iKey of Object.keys(s)) {
      if (s[iKey] && stKey in s[iKey]) {
        delete s[iKey][stKey];
        changed = true;
        if (Object.keys(s[iKey]).length === 0) delete s[iKey];
      }
    }
    if (changed) save(s);
  },

  // Transfer between storages for same item
  transfer(itemId: ItemId, fromId: StorageId, toId: StorageId, amount: number) {
    const amt = clampNonNeg(amount);
    if (amt <= 0) return;
    const fromQty = api.get(itemId, fromId);
    const mov = Math.min(fromQty, amt);
    if (mov <= 0) return;
    api.set(itemId, fromId, fromQty - mov);
    api.add(itemId, toId, mov);
  },

  // Import JSON for a specific storage
  // Accepts:
  //  - Array<{ item_id: number|string, quantity: number }>
  //  - Record<item_id, quantity>
  importForStorage(storageId: StorageId, data: unknown) {
    if (!data) return;
    if (Array.isArray(data)) {
      for (const row of data) {
        if (!row || typeof row !== "object") continue;
        const rowObj = row as Record<string, unknown>;
        const id = toKey((rowObj.item_id as ItemId) ?? (rowObj.id as ItemId));
        const qty = clampNonNeg(rowObj.quantity ?? rowObj.qty);
        if (!id) continue;
        api.set(id, storageId, qty);
      }
      return;
    }
    if (typeof data === "object" && data !== null) {
      for (const [id, qty] of Object.entries(data as Record<string, unknown>)) {
        api.set(id, storageId, clampNonNeg(qty));
      }
    }
  },
};

export const inventoryStore = api;

export default inventoryStore;
