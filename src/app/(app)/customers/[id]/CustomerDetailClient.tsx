"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Snackbar,
  Chip,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
} from "@mui/material";
import { Save as SaveIcon, Archive as ArchiveIcon } from "@mui/icons-material";
import rivhit from "@/lib/rivhit";
import { useRouter } from "next/navigation";

type CustomerForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  zipcode: string;
  comments: string;
  customer_type: number; // 1=פרטי, 2=עסק, 3=חברה
};

type DocumentRow = {
  document_type: number;
  document_number: number;
  document_date: string;
  document_time: string;
  amount: number;
  customer_id: number;
  agent_id?: number;
};

type ReceiptRow = {
  receipt_type: number;
  receipt_number: number;
  receipt_date: string;
  receipt_time: string;
  amount: number;
  customer_id: number;
};

const MIN_CUSTOMER_ID = 64;

export default function CustomerDetailClient({ id }: { id: number }) {
  const router = useRouter();
  const customerId = Number(id);

  const [form, setForm] = useState<CustomerForm>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    zipcode: "",
    comments: "",
    customer_type: 1,
  });
  const [loading, setLoading] = useState(true);
  const [originalForm, setOriginalForm] = useState<CustomerForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [orders, setOrders] = useState<DocumentRow[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);

  useEffect(() => {
    if (!customerId) return;
    loadCustomer();
    loadRelated();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const setField = (key: keyof CustomerForm, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isArchived = useMemo(
    () => (form.comments || "").toLowerCase().includes("[archived]"),
    [form.comments]
  );

  const loadCustomer = async () => {
    try {
      setLoading(true);
      setError(null);
      if (isNaN(customerId) || customerId < MIN_CUSTOMER_ID) {
        setError("לקוח אינו מוצג (מתחת לסף המינימלי)");
        setLoading(false);
        return;
      }
      const res = await rivhit.customers.get({ customer_id: customerId });
      const data = res?.data?.data;
      if (!data || !data.customer_id) {
        setError("לא נמצא לקוח");
        setLoading(false);
        return;
      }
      const nextForm: CustomerForm = {
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        phone: data.phone || "",
        street: data.street || data.address || "",
        city: data.city || "",
        zipcode: String(data.zipcode || ""),
        comments: data.comments || "",
        customer_type: Number(data.customer_type || 1),
      };
      setForm(nextForm);
      setOriginalForm(nextForm);
    } catch (e: any) {
      console.error("Error loading customer:", e);
      const msg =
        e?.response?.data?.client_message ||
        e?.response?.data?.debug_message ||
        "שגיאה בטעינת פרטי לקוח";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadRelated = async () => {
    try {
      setRelatedLoading(true);
      const [ordersRes, docsRes, recRes] = await Promise.all([
        rivhit.documents.list({
          from_customer_id: customerId,
          to_customer_id: customerId,
          from_document_type: 10,
          to_document_type: 10,
        }),
        rivhit.documents.list({
          from_customer_id: customerId,
          to_customer_id: customerId,
        }),
        rivhit.receipts.list({
          from_customer_id: customerId,
          to_customer_id: customerId,
        }),
      ]);
      setOrders(ordersRes?.data?.data?.document_list || []);
      setDocuments(docsRes?.data?.data?.document_list || []);
      setReceipts(recRes?.data?.data?.receipt_list || []);
    } catch (e) {
      console.error("Error loading related lists:", e);
    } finally {
      setRelatedLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.last_name && !form.first_name) {
      setError("יש להזין שם פרטי או שם משפחה/עסק");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const payload: any = {
        last_name: form.last_name || form.first_name || "לקוח",
        first_name: form.first_name || "",
        email: form.email || "",
        phone: form.phone || "",
        address: form.street || "",
        city: form.city || "",
        zipcode: form.zipcode ? Number(form.zipcode) : undefined,
        comments: form.comments || "",
        customer_type: Number(form.customer_type || 1),
      };
      const res = await rivhit.customers.update(customerId, payload);
      const ok = res?.data?.data?.update_success;
      if (ok) {
        setSuccess("פרטי הלקוח עודכנו בהצלחה");
        setOriginalForm(form);
      } else {
        setError("עדכון הלקוח לא הצליח");
      }
    } catch (e: any) {
      console.error("Error updating customer:", e);
      const msg =
        e?.response?.data?.client_message ||
        e?.response?.data?.debug_message ||
        "שגיאה בעדכון לקוח";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm("לארכב את הלקוח? (אין מחיקה אמיתית ב-API, תתווסף תגית [ARCHIVED])")) return;
    try {
      setSaving(true);
      setError(null);
      const comments = form.comments || "";
      const nextComments = comments.includes("[ARCHIVED]") ? comments : comments + " [ARCHIVED]";
      const res = await rivhit.customers.update(customerId, { comments: nextComments });
      const ok = res?.data?.data?.update_success;
      if (ok) {
        setForm((prev) => ({ ...prev, comments: nextComments }));
        setOriginalForm((prev) => ({ ...(prev || form), comments: nextComments }));
        setSuccess("הלקוח נארכב");
      } else {
        setError("ארכוב הלקוח נכשל");
      }
    } catch (e: any) {
      console.error("Error archiving customer:", e);
      const msg =
        e?.response?.data?.client_message ||
        e?.response?.data?.debug_message ||
        "שגיאה בארכוב לקוח";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalForm) {
      setForm(originalForm);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h4" component="h1">
            פרטי לקוח #{customerId}
          </Typography>
          {isArchived && <Chip label="[ARCHIVED]" color="warning" size="small" />}
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button variant="text" color="inherit" onClick={() => router.push("/customers")}>
            חזרה
          </Button>
          <Button variant="outlined" color="inherit" onClick={handleCancel} disabled={saving}>
            ביטול
          </Button>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<ArchiveIcon />}
            onClick={handleArchive}
            disabled={saving || isArchived}
          >
            ארכוב
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            שמירה
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            <Box>
              <TextField
                fullWidth
                label="שם פרטי"
                value={form.first_name}
                onChange={(e) => setField("first_name", e.target.value)}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="שם משפחה / שם עסק (חובה)"
                value={form.last_name}
                onChange={(e) => setField("last_name", e.target.value)}
                required
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="אימייל"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                type="email"
              />
            </Box>

            <Box>
              <TextField
                fullWidth
                label="טלפון"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="רחוב"
                value={form.street}
                onChange={(e) => setField("street", e.target.value)}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="עיר"
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="מיקוד"
                value={form.zipcode}
                onChange={(e) => setField("zipcode", e.target.value)}
                inputProps={{ inputMode: "numeric" }}
              />
            </Box>

            <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' } }}>
              <TextField
                fullWidth
                label="הערות"
                value={form.comments}
                onChange={(e) => setField("comments", e.target.value)}
                multiline
                rows={3}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            הזמנות אחרונות
          </Typography>
          {relatedLoading ? (
            <CircularProgress size={24} />
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>מס' מסמך</TableCell>
                    <TableCell>תאריך</TableCell>
                    <TableCell>שעה</TableCell>
                    <TableCell>סכום</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={`o-${o.document_number}`}>
                      <TableCell>{o.document_number}</TableCell>
                      <TableCell>{o.document_date}</TableCell>
                      <TableCell>{(o.document_time || "").substring(0, 5)}</TableCell>
                      <TableCell>₪{Number(o.amount || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {orders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        אין הזמנות להצגה
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            מסמכים קשורים
          </Typography>
          {relatedLoading ? (
            <CircularProgress size={24} />
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>סוג</TableCell>
                    <TableCell>מס' מסמך</TableCell>
                    <TableCell>תאריך</TableCell>
                    <TableCell>סכום</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents.map((d) => (
                    <TableRow key={`d-${d.document_type}-${d.document_number}`}>
                      <TableCell>{d.document_type}</TableCell>
                      <TableCell>{d.document_number}</TableCell>
                      <TableCell>{d.document_date}</TableCell>
                      <TableCell>₪{Number(d.amount || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {documents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        אין מסמכים להצגה
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            קבלות קשורות
          </Typography>
          {relatedLoading ? (
            <CircularProgress size={24} />
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>מס' קבלה</TableCell>
                    <TableCell>תאריך</TableCell>
                    <TableCell>שעה</TableCell>
                    <TableCell>סכום</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {receipts.map((r) => (
                    <TableRow key={`r-${r.receipt_type}-${r.receipt_number}`}>
                      <TableCell>{r.receipt_number}</TableCell>
                      <TableCell>{r.receipt_date}</TableCell>
                      <TableCell>{(r.receipt_time || "").substring(0, 5)}</TableCell>
                      <TableCell>₪{Number(r.amount || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {receipts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        אין קבלות להצגה
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess(null)} message={success || ""} />
    </Box>
  );
}
