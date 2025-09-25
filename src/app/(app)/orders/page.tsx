"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";
import { Search as SearchIcon, Description as DescriptionIcon, Add as AddIcon } from "@mui/icons-material";
import Link from "next/link";
import rivhit from "@/lib/rivhit";

interface DocRow {
  document_type: number;
  document_number: number;
  document_date: string;
  document_time: string;
  amount: number;
  customer_id: number;
  agent_id: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      // Filter explicitly to Rivhit "Order" document type (assumed 10 here per mock; in real data use the right code you get from Document.TypeList)
      const filters = { from_document_type: 10, to_document_type: 10 };
      const res = await rivhit.documents.list(filters);
      if (res.data && res.data.data) {
        setOrders(res.data.data.document_list || []);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.error("Error loading orders:", e);
      setError("שגיאה בטעינת הזמנות");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = (searchTerm || "").toLowerCase().trim();
    return (orders || []).filter(
      (o) => String(o.document_number).includes(q) || String(o.customer_id).includes(q)
    );
  }, [orders, searchTerm]);

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
        <Typography variant="h4" component="h1">
          ניהול הזמנות
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          href="/orders/new"
        >
          הזמנה חדשה
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box display="flex" gap={2} mb={3}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="חיפוש הזמנות..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>מספר הזמנה</TableCell>
                  <TableCell>תאריך</TableCell>
                  <TableCell>שעה</TableCell>
                  <TableCell>סכום</TableCell>
                  <TableCell>לקוח</TableCell>
                  <TableCell>סטטוס</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((order) => (
                  <TableRow key={`${order.document_type}-${order.document_number}`} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <DescriptionIcon sx={{ color: "primary.main" }} />
                        <Typography variant="body2" fontWeight="bold">
                          {order.document_number}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{order.document_date}</TableCell>
                    <TableCell>{(order.document_time || "").substring(0, 5)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        ₪{Number(order.amount || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>{order.customer_id}</TableCell>
                    <TableCell>
                      <Chip label="פתוחה" size="small" color="warning" variant="outlined" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filtered.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="textSecondary">
                {searchTerm ? "לא נמצאו הזמנות התואמות לחיפוש" : "אין הזמנות להציג"}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
