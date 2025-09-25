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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Search as SearchIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import rivhit from "@/lib/rivhit";
import inventoryStore from "@/state/inventoryStore";

interface Item {
  item_id: number;
  item_name: string;
  item_part_num: string;
  barcode: string;
  item_group_id: number;
  storage_id: number;
  quantity: number;
  cost_nis: number;
  sale_nis: number;
  currency_id: number;
  cost_mtc: number;
  sale_mtc: number;
  picture_link: string;
}

interface ItemGroup {
  item_group_id: number;
  item_group_name: string;
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [groups, setGroups] = useState<ItemGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<number | "">("");
  const [storages, setStorages] = useState<{ storage_id: number; storage_name: string }[]>([]);
  const [allocOpen, setAllocOpen] = useState(false);
  const [allocItem, setAllocItem] = useState<Item | null>(null);
  const [allocs, setAllocs] = useState<Record<number, number>>({});

  useEffect(() => {
    // initial load
    loadGroups();
  }, []);

  useEffect(() => {
    // reload items when group changes
    loadItems(selectedGroup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup]);

  const loadItems = async (group?: number | "") => {
    try {
      setLoading(true);
      setError(null);
      const res = await rivhit.items.list(group === "" ? undefined : (group as number));
      if (res.data && res.data.data) {
        setItems(res.data.data.item_list || []);
      } else {
        setItems([]);
      }
    } catch (e) {
      console.error("Error loading items:", e);
      setError("שגיאה בטעינת פריטים");
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const res = await rivhit.items.groups();
      if (res.data && res.data.data) {
        setGroups(res.data.data.item_group_list || []);
      }
    } catch (e) {
      console.error("Error loading item groups:", e);
    }
  };

  const openAlloc = async (item: Item) => {
    try {
      if (storages.length === 0) {
        const res = await rivhit.items.storageList();
        const list = res?.data?.data?.storage_list || [];
        setStorages(list);
      }
    } catch (e) {
      console.error("Error loading storages:", e);
    }
    const current = inventoryStore.getAllForItem(item.item_id);
    const init: Record<number, number> = {};
    Object.entries(current).forEach(([k, v]) => {
      init[Number(k)] = Number(v as any) || 0;
    });
    setAllocs(init);
    setAllocItem(item);
    setAllocOpen(true);
  };

  const handleAllocSave = () => {
    if (!allocItem) return;
    storages.forEach((s) => {
      const val = Number(allocs[s.storage_id] || 0);
      inventoryStore.set(allocItem.item_id, s.storage_id, val);
    });
    setAllocOpen(false);
  };

  const allocTotal = useMemo(() => {
    return Object.values(allocs).reduce((sum, v) => sum + Number(v || 0), 0);
  }, [allocs]);

  const filteredItems = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return (items || []).filter((it) => {
      const match =
        (it?.item_name || "").toLowerCase().includes(q) ||
        (it?.item_part_num || "").toLowerCase().includes(q) ||
        (it?.barcode || "").toLowerCase().includes(q);
      const matchGroup = selectedGroup === "" || it?.item_group_id === selectedGroup;
      return match && matchGroup;
    });
  }, [items, searchTerm, selectedGroup]);

  const getGroupName = (id: number) => groups.find((g) => g.item_group_id === id)?.item_group_name || "לא ידוע";

  const getStockStatus = (quantity: number) => {
    if (!quantity) return { text: "אזל", color: "error" as const, icon: <WarningIcon fontSize="small" /> };
    if (quantity < 10) return { text: "מלאי נמוך", color: "warning" as const, icon: <WarningIcon fontSize="small" /> };
    return { text: "במלאי", color: "success" as const, icon: null };
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
      <Typography variant="h4" component="h1" gutterBottom>
        ניהול פריטים
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
              placeholder="חיפוש פריטים..."
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
              <InputLabel>קבוצת פריטים</InputLabel>
              <Select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value as number | "")}
                label="קבוצת פריטים"
              >
                <MenuItem value="">הכל</MenuItem>
                {groups.map((g) => (
                  <MenuItem key={g.item_group_id} value={g.item_group_id}>
                    {g.item_group_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>פריט</TableCell>
                  <TableCell>קוד פריט</TableCell>
                  <TableCell>ברקוד</TableCell>
                  <TableCell>קבוצה</TableCell>
                  <TableCell>מלאי</TableCell>
                  <TableCell>מחיר עלות</TableCell>
                  <TableCell>מחיר מכירה</TableCell>
                  <TableCell>רווח</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.map((item) => {
                  const qty = Number(item.quantity ?? 0);
                  const cost = Number(item.cost_nis ?? 0);
                  const sale = Number(item.sale_nis ?? 0);
                  const profit = sale - cost;
                  const margin = cost > 0 ? ((profit / cost) * 100).toFixed(1) : "0";
                  const stock = getStockStatus(qty);

                  return (
                    <TableRow key={item.item_id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
                            <InventoryIcon fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {item.item_name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              ID: {item.item_id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{item.item_part_num}</TableCell>
                      <TableCell>
                        <Tooltip title={item.barcode || ""}>
                          <span>{item.barcode}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip label={getGroupName(item.item_group_id)} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2">{qty}</Typography>
                          <Chip
                            label={stock.text}
                            size="small"
                            color={stock.color}
                            icon={stock.icon || undefined}
                          />
                          <Chip
                            label={`מוקצה: ${inventoryStore.totalForItem(item.item_id)}`}
                            size="small"
                            color="info"
                          />
                          {inventoryStore.totalForItem(item.item_id) !== qty && (
                            <Chip label="פער" size="small" color="warning" />
                          )}
                          <Button size="small" variant="outlined" onClick={() => openAlloc(item)}>
                            הקצאה
                          </Button>
                        </Box>
                      </TableCell>
                      <TableCell>₪{cost.toFixed(2)}</TableCell>
                      <TableCell>₪{sale.toFixed(2)}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="baseline" gap={1}>
                          <Typography variant="body2" color={profit >= 0 ? "success.main" : "error.main"}>
                            ₪{profit.toFixed(2)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {margin}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredItems.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="textSecondary">
                {searchTerm || selectedGroup ? "לא נמצאו פריטים התואמים לחיפוש" : "אין פריטים להציג"}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={allocOpen} onClose={() => setAllocOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>הקצאת מלאי לפי מחסן</DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" gutterBottom>
            פריט: {allocItem?.item_name} (ID: {allocItem?.item_id})
          </Typography>
          {storages.length === 0 ? (
            <Typography color="text.secondary">אין מחסנים זמינים</Typography>
          ) : (
            <Box display="grid" gridTemplateColumns="1fr 160px" gap={1.5}>
              {storages.map((s) => (
                <React.Fragment key={s.storage_id}>
                  <Box display="flex" alignItems="center" pr={1}>
                    {s.storage_name} (#{s.storage_id})
                  </Box>
                  <TextField
                    type="number"
                    inputProps={{ min: 0 }}
                    value={allocs[s.storage_id] ?? 0}
                    onChange={(e) =>
                      setAllocs((prev) => ({
                        ...prev,
                        [s.storage_id]: Math.max(0, Number(e.target.value)),
                      }))
                    }
                  />
                </React.Fragment>
              ))}
            </Box>
          )}
          <Box mt={2} display="flex" gap={2}>
            <Chip label={`סה״כ מוקצה: ${allocTotal}`} color="info" size="small" />
            {allocItem && (
              <Chip
                label={`כמות מערכת: ${Number(allocItem.quantity ?? 0)}`}
                size="small"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAllocOpen(false)}>ביטול</Button>
          <Button variant="contained" onClick={handleAllocSave}>
            שמירה
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
