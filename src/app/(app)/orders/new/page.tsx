"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,
  Divider,
  Alert,
  Snackbar,
  Autocomplete,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon } from "@mui/icons-material";
import rivhit from "@/lib/rivhit";

type CustomerOption = { label: string; id: number };

type OrderItem = {
  item_id?: number;
  description: string;
  quantity: number;
  price_nis: number;
};

type ItemOption = {
  id: number;
  label: string;
  sale_nis: number;
};

type CustomerData = {
  customer_id: number;
  first_name?: string;
  last_name?: string;
};

type ItemData = {
  item_id: number;
  item_name: string;
  item_part_num?: string;
  sale_nis?: number;
};

type DocumentTypeData = {
  document_type: number;
  document_name?: string;
  price_include_vat?: boolean;
};

const MIN_CUSTOMER_ID = 64;

export default function NewOrderPage() {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [items, setItems] = useState<OrderItem[]>([{ description: "", quantity: 1, price_nis: 0 }]);
  const [itemOptions, setItemOptions] = useState<ItemOption[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [orderDocType, setOrderDocType] = useState<number | null>(null);
  const [docPriceIncludeVat, setDocPriceIncludeVat] = useState<boolean>(true);

  const invalidItems = useMemo(() => {
    return (
      items.length === 0 ||
      items.some((it) => {
        const hasRef = Boolean(it.item_id) || Boolean((it.description || "").trim());
        const qtyOk = Number(it.quantity) > 0;
        const priceOk = Number(it.price_nis) > 0;
        return !hasRef || !qtyOk || !priceOk;
      })
    );
  }, [items]);

  const canSave = useMemo(() => {
    return Boolean(selectedCustomer?.id) && !invalidItems && Boolean(orderDocType) && !saving;
  }, [selectedCustomer, invalidItems, orderDocType, saving]);

  useEffect(() => {
    loadCustomers();
    // pre-load items for selection
    loadItemOptions();
    // load document type for "order" dynamically
    loadOrderDocType();
  }, []);

  const loadCustomers = async () => {
    try {
      const res = await rivhit.customers.list();
      if (res.data && res.data.data) {
        const list = (res.data.data.customer_list || []) as CustomerData[];
        setCustomers(
          list
            .filter((c: CustomerData) => Number(c?.customer_id ?? 0) >= MIN_CUSTOMER_ID)
            .map((c: CustomerData) => ({
              id: c.customer_id,
              label: `${c.first_name || ""} ${c.last_name || ""} (#${c.customer_id})`.trim(),
            }))
        );
      }
    } catch (e) {
      console.error("Error loading customers:", e);
      setError("שגיאה בטעינת לקוחות");
    }
  };

  const total = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.quantity || 0) * Number(it.price_nis || 0)), 0),
    [items]
  );

  const loadItemOptions = async () => {
    try {
      setItemsLoading(true);
      const res = await rivhit.items.list();
      const list = res.data?.data?.item_list || [];
      setItemOptions(
        list.map((it: ItemData) => ({
          id: it.item_id,
          label: `${it.item_name}${it.item_part_num ? ` (${it.item_part_num})` : ""}`,
          sale_nis: Number(it.sale_nis ?? 0),
        }))
      );
    } catch (e) {
      console.error("Error loading items:", e);
      // לא נכשלים בגלל זה; ניתן לבחור פריט חופשי בטקסט
    } finally {
      setItemsLoading(false);
    }
  };

  const loadOrderDocType = async () => {
    try {
      const res = await rivhit.documents.types();
      const list = res.data?.data?.document_type_list || [];
      // Prefer by name (Hebrew/English), fallback to known code 10 or first
      const byName = list.find((d: DocumentTypeData) => {
        const name = String(d.document_name || "").toLowerCase();
        return name.includes("הזמנה") || name.includes("order");
      });
      let doc: DocumentTypeData | undefined = byName;
      if (!doc) {
        doc = list.find((d: DocumentTypeData) => Number(d.document_type) === 10) || list[0];
      }
      if (doc) {
        setOrderDocType(Number(doc.document_type));
        setDocPriceIncludeVat(Boolean(doc.price_include_vat ?? true));
      }
    } catch (e) {
      console.error("Error loading document types:", e);
      // Sensible defaults
      setOrderDocType(10);
      setDocPriceIncludeVat(true);
    }
  };

  const setItem = (idx: number, patch: Partial<OrderItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, { description: "", quantity: 1, price_nis: 0 }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!selectedCustomer?.id) {
      setError("יש לבחור לקוח");
      return;
    }
    const invalid =
      items.length === 0 ||
      items.some((it) => {
        const hasRef = Boolean(it.item_id) || Boolean((it.description || "").trim());
        const qtyOk = Number(it.quantity) > 0;
        const priceOk = Number(it.price_nis) > 0;
        return !hasRef || !qtyOk || !priceOk;
      });
    if (invalid) {
      setError("יש למלא לפחות שורת פריט אחת עם פריט/תיאור, כמות ומחיר חיוביים");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      // יצירת הזמנה – לפי המסמך, Document.New עם document_type של “הזמנה”
      // בהגדרה מצאנו mock על 10; בעולם אמיתי עדיף לשאול Document.TypeList ולאתר את הקוד.
      const payload = {
        document_type: orderDocType ?? 10,
        customer_id: selectedCustomer.id,
        price_include_vat: docPriceIncludeVat,
        items: items.map((it) => {
          const base: Partial<{ item_id: number; description: string; quantity: number; price_nis: number }> = {
            quantity: Number(it.quantity),
            price_nis: Number(it.price_nis),
          };
          // אם נבחר פריט מרשימה – נשלח item_id, אחרת description חופשי
          if (it.item_id) {
            base.item_id = it.item_id;
          } else {
            base.description = it.description;
          }
          return base;
        }),
      };
      const res = await rivhit.documents.create(payload);
      const data = res.data?.data || {};
      setSuccess(`הזמנה נוצרה בהצלחה: #${data.document_number || "—"}`);
      // reset
      setSelectedCustomer(null);
      setItems([{ description: "", quantity: 1, price_nis: 0 }]);
    } catch (e: unknown) {
      console.error("Error creating order:", e);
      const error = e as { response?: { data?: { client_message?: string; debug_message?: string } } };
      const msg =
        error?.response?.data?.client_message ||
        error?.response?.data?.debug_message ||
        "שגיאה ביצירת הזמנה";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          הזמנה חדשה
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!canSave}
        >
          {saving ? "שומר..." : "שמירה"}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            פרטי לקוח
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
            <Box>
              <Autocomplete
                options={customers}
                value={selectedCustomer}
                onChange={(_, v) => setSelectedCustomer(v)}
                renderInput={(params) => <TextField {...params} label="לקוח" placeholder="בחר לקוח..." />}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6">פריטים</Typography>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={addItem}>
              הוסף פריט
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 2fr 2fr 2fr 1fr' }, gap: 2, alignItems: 'start' }}>
            {items.map((it, idx) => (
              <React.Fragment key={idx}>
                <Box>
                  <Autocomplete
                    loading={itemsLoading}
                    options={itemOptions}
                    value={
                      it.item_id
                        ? itemOptions.find((opt) => opt.id === it.item_id) || null
                        : null
                    }
                    onChange={(_, v) => {
                      if (v) {
                        setItem(idx, {
                          item_id: v.id,
                          description: v.label, // נשמור תיאור לתצוגה/גיבוי
                          price_nis: it.price_nis || v.sale_nis || 0,
                        });
                      } else {
                        setItem(idx, { item_id: undefined });
                      }
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="בחר פריט מהרשימה" placeholder="שם/קוד..." />
                    )}
                  />
                  <Box mt={1}>
                    <TextField
                      fullWidth
                      label="תיאור פריט (מותאם אישית)"
                      value={it.description}
                      onChange={(e) => setItem(idx, { description: e.target.value })}
                      helperText="ניתן להשאיר כפי שנבחר מהרשימה או להתאים ידנית"
                    />
                  </Box>
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="כמות"
                    type="number"
                    inputProps={{ min: 1 }}
                    value={it.quantity}
                    onChange={(e) => setItem(idx, { quantity: Number(e.target.value) })}
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="מחיר ליח' (₪)"
                    type="number"
                    inputProps={{ min: 0, step: "0.01" }}
                    value={it.price_nis}
                    onChange={(e) => setItem(idx, { price_nis: Number(e.target.value) })}
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="סה״כ שורה (₪)"
                    value={(Number(it.quantity || 0) * Number(it.price_nis || 0)).toFixed(2)}
                    InputProps={{ readOnly: true }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <IconButton color="error" onClick={() => removeItem(idx)} disabled={items.length === 1}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </React.Fragment>
            ))}
          </Box>

          <Divider sx={{ my: 2 }} />
          <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2}>
            <Typography variant="subtitle1">סך הכל:</Typography>
            <Typography variant="h6">₪{total.toFixed(2)}</Typography>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
        message={success || ""}
      />
    </Box>
  );
}
