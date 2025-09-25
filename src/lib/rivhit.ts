import axios from "axios";

// Client for calling our Next.js BFF routes
const api = axios.create({
  baseURL: "/api/rivhit",
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

export const rivhit = {
  customers: {
    list: (customerType?: number) =>
      api.post("/Customer.List", customerType ? { customer_type: customerType } : {}),
    create: (payload: any) => api.post("/Customer.New", payload),
    update: (customer_id: number, payload: any) => api.post("/Customer.Update", { customer_id, ...payload }),
    balance: (customer_id: number) => api.post("/Customer.Balance", { customer_id }),
    get: (payload: { customer_id?: number; email?: string; acc_ref?: string }) => api.post("/Customer.Get", payload),
  },
  items: {
    list: (item_group_id?: number) =>
      api.post("/Item.List", item_group_id ? { item_group_id } : {}),
    create: (payload: any) => api.post("/Item.New", payload),
    update: (item_id: number, payload: any) => api.post("/Item.Update", { item_id, ...payload }),
    quantity: (item_id: number, storage_id?: number) => api.post("/Item.Quantity", { item_id, storage_id }),
    groups: () => api.post("/Item.Groups", {}),
    storageList: () => api.post("/Item.StorageList", {}),
  },
  documents: {
    create: (payload: any) => api.post("/Document.New", payload),
    types: (document_type?: number) =>
      api.post("/Document.TypeList", document_type ? { document_type } : {}),
    list: (filters: any = {}) => api.post("/Document.List", filters),
  },
  receipts: {
    create: (payload: any) => api.post("/Receipt.New", payload),
    types: () => api.post("/Receipt.TypeList", {}),
    list: (filters: any = {}) => api.post("/Receipt.List", filters),
  },
  accounting: {
    vatRate: () => api.post("/Accounting.VatRate", {}),
  },
  currency: {
    list: () => api.post("/Currency.List", {}),
  },
  payment: {
    types: () => api.post("/Payment.TypeList", {}),
    banks: () => api.post("/Payment.BankList", {}),
  },
  status: {
    lastRequest: (request_reference: string, format: "JSON" | "XML" = "JSON") =>
      api.post(`/Status.LastRequest/${format}`, { request_reference }),
    allRequests: (request_reference: string, format: "JSON" | "XML" = "JSON") =>
      api.post(`/Status.AllRequests/${format}`, { request_reference }),
  },
};

export default rivhit;
