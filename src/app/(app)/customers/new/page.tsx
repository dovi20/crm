"use client";

import React, { useState } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Snackbar,
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { Save as SaveIcon, ArrowBack, Close } from "@mui/icons-material";
import rivhit from "@/lib/rivhit";
import { useRouter } from "next/navigation";

export default function NewCustomerPage() {
  const router = useRouter();
  const initialForm = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    zipcode: "",
    comments: "",
    customer_type: 1, // 1=פרטי, 2=עסק, 3=חברה
  };
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const setField = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.last_name && !form.first_name) {
      setError("יש להזין שם פרטי או שם משפחה");
      return;
    }
    try {
      setSaving(true);
      setError(null);

      // Customer.New expects 'last_name' required; we'll ensure at least last_name set
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

      const res = await rivhit.customers.create(payload);
      const newId = res?.data?.data?.customer_id;
      setSuccess("לקוח נוצר בהצלחה");
      if (newId) {
        // ניווט למסך הלקוח החדש
        router.push(`/customers/${newId}`);
      } else {
        // fallback: חזרה לרשימת לקוחות
        router.push("/customers");
      }
    } catch (e: any) {
      console.error("Error creating customer:", e);
      const msg =
        e?.response?.data?.client_message ||
        e?.response?.data?.debug_message ||
        "שגיאה ביצירת לקוח";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(initialForm);
    setError(null);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          לקוח חדש
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<ArrowBack />}
            onClick={() => router.push("/customers")}
            disabled={saving}
          >
            חזרה
          </Button>
          <Button
            variant="text"
            color="secondary"
            startIcon={<Close />}
            onClick={handleCancel}
            disabled={saving}
          >
            ביטול
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

      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid xs={12} md={4}>
              <TextField
                fullWidth
                label="שם פרטי"
                value={form.first_name}
                onChange={(e) => setField("first_name", e.target.value)}
              />
            </Grid>
            <Grid xs={12} md={4}>
              <TextField
                fullWidth
                label="שם משפחה / שם עסק (חובה)"
                value={form.last_name}
                onChange={(e) => setField("last_name", e.target.value)}
                required
              />
            </Grid>
            <Grid xs={12} md={4}>
              <TextField
                fullWidth
                label="אימייל"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                type="email"
              />
            </Grid>

            <Grid xs={12} md={4}>
              <TextField
                fullWidth
                label="טלפון"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </Grid>
            <Grid xs={12} md={4}>
              <TextField
                fullWidth
                label="רחוב"
                value={form.street}
                onChange={(e) => setField("street", e.target.value)}
              />
            </Grid>
            <Grid xs={12} md={2}>
              <TextField
                fullWidth
                label="עיר"
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
              />
            </Grid>
            <Grid xs={12} md={2}>
              <TextField
                fullWidth
                label="מיקוד"
                value={form.zipcode}
                onChange={(e) => setField("zipcode", e.target.value)}
                inputProps={{ inputMode: "numeric" }}
              />
            </Grid>

            <Grid xs={12}>
              <TextField
                fullWidth
                label="הערות"
                value={form.comments}
                onChange={(e) => setField("comments", e.target.value)}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess(null)} message={success || ""} />
    </Box>
  );
}
