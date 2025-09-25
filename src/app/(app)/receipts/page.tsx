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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Payment as PaymentIcon,
} from "@mui/icons-material";
import rivhit from "@/lib/rivhit";

interface ReceiptRow {
  receipt_type: number;
  receipt_number: number;
  receipt_date: string;
  receipt_time: string;
  amount: number;
  customer_id: number;
}

interface ReceiptType {
  receipt_type: number;
  receipt_name: string;
  is_invoice_receipt: boolean;
}

const MIN_CUSTOMER_ID = 64;

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [types, setTypes] = useState<ReceiptType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<number | "">("");

  useEffect(() => {
    loadTypes();
  }, []);

  useEffect(() => {
    loadReceipts(selectedType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType]);

  const loadReceipts = async (type?: number | "") => {
    try {
      setLoading(true);
      setError(null);
      const filters: { from_customer_id: number; from_receipt_type?: number; to_receipt_type?: number } = { from_customer_id: MIN_CUSTOMER_ID };
      if (type !== "" && type !== undefined) {
        filters.from_receipt_type = type;
        filters.to_receipt_type = type;
      }
      const res = await rivhit.receipts.list(filters);
      if (res.data && res.data.data) {
        setReceipts(res.data.data.receipt_list || []);
      } else {
        setReceipts([]);
      }
    } catch (e) {
      console.error("Error loading receipts:", e);
      setError("שגיאה בטעינת קבלות");
    } finally {
      setLoading(false);
    }
  };

  const loadTypes = async () => {
    try {
      const res = await rivhit.receipts.types();
      if (res.data && res.data.data) {
        setTypes(res.data.data.receipt_type_list || []);
      }
    } catch (e) {
      console.error("Error loading receipt types:", e);
    }
  };

  const filteredReceipts = useMemo(() => {
    const q = (searchTerm || "").toLowerCase().trim();
    return (receipts || []).filter((r) => {
      if ((r?.customer_id ?? 0) < MIN_CUSTOMER_ID) return false;
      const matchesSearch =
        String(r.receipt_number).includes(q) || String(r.customer_id).includes(q);
      const matchesType = selectedType === "" || r.receipt_type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [receipts, searchTerm, selectedType]);

  const getTypeName = (rt: number) =>
    types.find((t) => t.receipt_type === rt)?.receipt_name || "לא ידוע";

  const getTypeColor = (rt: number) => {
    const t = types.find((x) => x.receipt_type === rt);
    if (t?.is_invoice_receipt) return "warning";
    return "success";
  };

  const formatDate = (dateStr: string) => dateStr; // Already DD/MM/YYYY
  const formatTime = (timeStr: string) => (timeStr || "").substring(0, 5);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        ניהול קבלות
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box display="flex" gap={2} mb={3} flexWrap="wrap">
            <TextField
              sx={{ flex: 1, minWidth: 240 }}
              variant="outlined"
              placeholder="חיפוש קבלות..."
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

            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel>סוג קבלה</InputLabel>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as number | "")}
                label="סוג קבלה"
              >
                <MenuItem value="">הכל</MenuItem>
                {types.map((t) => (
                  <MenuItem key={t.receipt_type} value={t.receipt_type}>
                    {t.receipt_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>מספר קבלה</TableCell>
                  <TableCell>סוג קבלה</TableCell>
                  <TableCell>תאריך</TableCell>
                  <TableCell>שעה</TableCell>
                  <TableCell>סכום</TableCell>
                  <TableCell>לקוח</TableCell>
                  <TableCell align="center">פעולות</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReceipts.map((receipt) => (
                  <TableRow key={`${receipt.receipt_type}-${receipt.receipt_number}`} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <ReceiptIcon sx={{ color: "success.main" }} />
                        <Typography variant="body2" fontWeight="bold">
                          {receipt.receipt_number}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getTypeName(receipt.receipt_type)}
                        size="small"
                        color={getTypeColor(receipt.receipt_type) as "default" | "success" | "warning"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatDate(receipt.receipt_date)}</TableCell>
                    <TableCell>{formatTime(receipt.receipt_time)}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PaymentIcon sx={{ color: "success.main" }} fontSize="small" />
                        <Typography variant="body2" fontWeight="bold">
                          ₪{Number(receipt.amount || 0).toLocaleString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{receipt.customer_id}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="הדפס">
                        <span>
                          <IconButton size="small" color="info">
                            <PrintIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="הורד PDF">
                        <span>
                          <IconButton size="small" color="success">
                            <DownloadIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredReceipts.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="textSecondary">
                {searchTerm || selectedType ? "לא נמצאו קבלות התואמות לחיפוש" : "אין קבלות להציג"}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
