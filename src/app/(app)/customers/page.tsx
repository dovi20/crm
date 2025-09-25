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
  Avatar,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";
import { Search as SearchIcon, Phone as PhoneIcon, Email as EmailIcon } from "@mui/icons-material";
import rivhit from "@/lib/rivhit";
import { useRouter } from "next/navigation";

interface Customer {
  customer_id: number;
  last_name: string;
  first_name: string;
  street: string;
  city: string;
  zipcode: string;
  phone: string;
  fax: string;
  email: string;
  id_number: number;
  vat_number: number;
  customer_type: number;
  price_list_id: number;
  agent_id: number;
  discount_percent: number;
  acc_ref: string;
  comments: string;
}

const MIN_CUSTOMER_ID = 64;

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await rivhit.customers.list();
      if (response.data && response.data.data) {
        setCustomers(response.data.data.customer_list || []);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error("Error loading customers:", err);
      setError("שגיאה בטעינת לקוחות");
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return (customers || []).filter((c) => {
      if ((c?.customer_id ?? 0) < MIN_CUSTOMER_ID) return false;
      if ((c?.comments || "").toLowerCase().includes("[archived]")) return false;
      return (
        (c?.first_name || "").toLowerCase().includes(q) ||
        (c?.last_name || "").toLowerCase().includes(q) ||
        (c?.email || "").toLowerCase().includes(q) ||
        (c?.phone || "").includes(searchTerm)
      );
    });
  }, [customers, searchTerm]);

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
        ניהול לקוחות
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box mb={3} display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              fullWidth
              variant="outlined"
              placeholder="חיפוש לקוחות..."
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
            <Button variant="contained" color="primary" onClick={() => router.push("/customers/new")}>
              לקוח חדש
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>שם לקוח</TableCell>
                  <TableCell>טלפון</TableCell>
                  <TableCell>אימייל</TableCell>
                  <TableCell>עיר</TableCell>
                  <TableCell>סוג לקוח</TableCell>
                  <TableCell>אחוז הנחה</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow
                    key={customer.customer_id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => router.push(`/customers/${customer.customer_id}`)}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: "primary.main" }}>
                          {(customer.first_name || "?").charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {customer.first_name} {customer.last_name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {customer.acc_ref}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PhoneIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                        {customer.phone}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <EmailIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                        {customer.email}
                      </Box>
                    </TableCell>
                    <TableCell>{customer.city}</TableCell>
                    <TableCell>
                      <Chip
                        label={
                          customer.customer_type === 1
                            ? "פרטי"
                            : customer.customer_type === 2
                            ? "עסק"
                            : customer.customer_type === 3
                            ? "חברה"
                            : "לא ידוע"
                        }
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {customer.discount_percent > 0 && (
                        <Chip label={`${customer.discount_percent}%`} size="small" color="success" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredCustomers.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="textSecondary">
                {searchTerm ? "לא נמצאו לקוחות התואמים לחיפוש" : "אין לקוחות להציג"}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
