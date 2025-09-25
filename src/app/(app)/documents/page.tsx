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
  Description as DescriptionIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import rivhit from "@/lib/rivhit";

interface DocumentRow {
  document_type: number;
  document_number: number;
  document_date: string;
  document_time: string;
  amount: number;
  customer_id: number;
  agent_id: number;
}

interface DocumentType {
  document_type: number;
  document_name: string;
  is_invoice_receipt: boolean;
  is_accounting: boolean;
  price_include_vat: boolean;
}

const MIN_CUSTOMER_ID = 64;

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<number | "">("");

  useEffect(() => {
    loadTypes();
  }, []);

  useEffect(() => {
    loadDocuments(selectedType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType]);

  const loadDocuments = async (type?: number | "") => {
    try {
      setLoading(true);
      setError(null);
      const filters: any = { from_customer_id: MIN_CUSTOMER_ID };
      if (type !== "" && type !== undefined) {
        filters.from_document_type = type;
        filters.to_document_type = type;
      }
      const res = await rivhit.documents.list(filters);
      if (res.data && res.data.data) {
        setDocuments(res.data.data.document_list || []);
      } else {
        setDocuments([]);
      }
    } catch (e) {
      console.error("Error loading documents:", e);
      setError("שגיאה בטעינת מסמכים");
    } finally {
      setLoading(false);
    }
  };

  const loadTypes = async () => {
    try {
      const res = await rivhit.documents.types();
      if (res.data && res.data.data) {
        setTypes(res.data.data.document_type_list || []);
      }
    } catch (e) {
      console.error("Error loading document types:", e);
    }
  };

  const filteredDocuments = useMemo(() => {
    const q = (searchTerm || "").toLowerCase().trim();
    return (documents || []).filter((doc) => {
      if ((doc?.customer_id ?? 0) < MIN_CUSTOMER_ID) return false;
      const matchesSearch =
        String(doc.document_number).includes(q) || String(doc.customer_id).includes(q);
      const matchesType = selectedType === "" || doc.document_type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [documents, searchTerm, selectedType]);

  const getTypeName = (dt: number) =>
    types.find((t) => t.document_type === dt)?.document_name || "לא ידוע";

  const getTypeColor = (dt: number) => {
    const t = types.find((x) => x.document_type === dt);
    if (t?.is_invoice_receipt) return "warning";
    if (t?.is_accounting) return "primary";
    return "default";
  };

  const formatDate = (dateStr: string) => dateStr; // Already DD/MM/YYYY per spec
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
        ניהול מסמכים
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
              placeholder="חיפוש מסמכים..."
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
              <InputLabel>סוג מסמך</InputLabel>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as number | "")}
                label="סוג מסמך"
              >
                <MenuItem value="">הכל</MenuItem>
                {types.map((t) => (
                  <MenuItem key={t.document_type} value={t.document_type}>
                    {t.document_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>מספר מסמך</TableCell>
                  <TableCell>סוג מסמך</TableCell>
                  <TableCell>תאריך</TableCell>
                  <TableCell>שעה</TableCell>
                  <TableCell>סכום</TableCell>
                  <TableCell>לקוח</TableCell>
                  <TableCell align="center">פעולות</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDocuments.map((document) => (
                  <TableRow key={`${document.document_type}-${document.document_number}`} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <DescriptionIcon sx={{ color: "primary.main" }} />
                        <Typography variant="body2" fontWeight="bold">
                          {document.document_number}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getTypeName(document.document_type)}
                        size="small"
                        color={getTypeColor(document.document_type) as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatDate(document.document_date)}</TableCell>
                    <TableCell>{formatTime(document.document_time)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        ₪{Number(document.amount || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>{document.customer_id}</TableCell>
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

          {filteredDocuments.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="textSecondary">
                {searchTerm || selectedType ? "לא נמצאו מסמכים התואמים לחיפוש" : "אין מסמכים להציג"}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
