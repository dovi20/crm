"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  Select,
  MenuItem,
  TextField,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  UploadFile as UploadFileIcon,
  DeleteSweep as DeleteSweepIcon,
  SwapHoriz as SwapHorizIcon,
  Visibility as VisibilityIcon,
  Inventory2 as Inventory2Icon,
  AddCircleOutline as AddCircleOutlineIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  DeleteForever as DeleteForeverIcon,
} from "@mui/icons-material";
import rivhit from "@/lib/rivhit";
import inventoryStore from "@/state/inventoryStore";
import storageStore from "@/state/storageStore";

type StorageRow = {
  storage_id: string | number;
  storage_name: string;
  isLocal?: boolean;
};

type ServerStorage = {
  storage_id: string | number;
  storage_name: string;
};

export default function StoragesPage() {
  const [storages, setStorages] = useState<StorageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Transfer form state
  const [transferItemId, setTransferItemId] = useState<string>("");
  const [fromStorage, setFromStorage] = useState<string | number | "">("");
  const [toStorage, setToStorage] = useState<string | number | "">("");
  const [transferAmount, setTransferAmount] = useState<number>(0);

  // Create/rename local storage
  const [newStorageName, setNewStorageName] = useState("");
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editingName, setEditingName] = useState("");

  // Details toggle
  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});

  // File inputs refs per storage
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    loadStorages();
  }, []);

  const loadStorages = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await rivhit.items.storageList();
      const list = res?.data?.data?.storage_list ?? [];
      const serverList: StorageRow[] = list.map((s: ServerStorage) => ({
        storage_id: s.storage_id,
        storage_name: s.storage_name,
        isLocal: false,
      }));
      const localList: StorageRow[] = storageStore.list(); // { storage_id: "L1", storage_name: "...", isLocal: true }
      setStorages([...serverList, ...localList]);
    } catch (e) {
      console.error("Error loading storages:", e);
      setError("שגיאה בטעינת רשימת מחסנים");
    } finally {
      setLoading(false);
    }
  };

  const totalsByStorage = useMemo(() => {
    const out: Record<string, number> = {};
    for (const st of storages) {
      const key = String(st.storage_id);
      out[key] = inventoryStore.totalForStorage(st.storage_id);
    }
    return out;
  }, [storages]); // recompute after operations

  const handleImportJson = async (storageId: string | number, file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      inventoryStore.importForStorage(storageId, data);
      setSuccess(`ייבוא JSON בוצע בהצלחה למחסן #${storageId}`);
    } catch (e: unknown) {
      console.error("Failed to import JSON:", e);
      setError("ייבוא JSON נכשל - ודא מבנה תקין");
    }
  };

  const handleClearStorage = (storageId: string | number) => {
    if (!confirm(`לנקות את כל הכמויות במחסן #${storageId}?`)) return;
    inventoryStore.clearStorage(storageId);
    setSuccess(`המחסן #${storageId} נוקה`);
  };

  const handleTransfer = () => {
    if (!transferItemId || fromStorage === "" || toStorage === "") {
      setError("יש למלא פריט, מחסן מקור ומחסן יעד");
      return;
    }
    if (fromStorage === toStorage) {
      setError("מחסן מקור ויעד חייבים להיות שונים");
      return;
    }
    if (transferAmount <= 0) {
      setError("הכמות להעברה חייבת להיות חיובית");
      return;
    }
    inventoryStore.transfer(transferItemId, fromStorage, toStorage, transferAmount);
    setSuccess(`הועבר מלאי של פריט ${transferItemId} ממחסן #${fromStorage} אל מחסן #${toStorage}`);
    setTransferAmount(0);
  };

  const handleCreateLocal = () => {
    try {
      const created = storageStore.create(newStorageName);
      setNewStorageName("");
      setSuccess(`נוסף מחסן חדש: ${created.storage_name} (${created.storage_id})`);
      loadStorages();
    } catch (e: unknown) {
      setError((e as Error)?.message || "שגיאה בהוספת מחסן");
    }
  };

  const beginRename = (s: StorageRow) => {
    if (!s.isLocal) return;
    setEditingId(s.storage_id);
    setEditingName(s.storage_name);
  };
  const saveRename = () => {
    if (editingId == null) return;
    try {
      storageStore.rename(editingId, editingName);
      setEditingId(null);
      setEditingName("");
      setSuccess("שם המחסן עודכן");
      loadStorages();
    } catch (e: unknown) {
      setError((e as Error)?.message || "שגיאה בעדכון שם המחסן");
    }
  };
  const cancelRename = () => {
    setEditingId(null);
    setEditingName("");
  };
  const deleteLocal = (s: StorageRow) => {
    if (!s.isLocal) return;
    if (!confirm(`למחוק את המחסן ${s.storage_name} (${s.storage_id})? פעולה זו תמחק גם את ההקצאות הלוקאליות למחסן זה.`)) return;
    try {
      storageStore.remove(s.storage_id);
      inventoryStore.clearStorage(s.storage_id);
      setSuccess(`המחסן ${s.storage_name} נמחק`);
      loadStorages();
    } catch (e: unknown) {
      setError((e as Error)?.message || "שגיאה במחיקת מחסן");
    }
  };

  const renderStorageDetails = (storageId: string | number) => {
    const entries = inventoryStore.entriesForStorage(storageId);
    if (entries.length === 0) {
      return (
        <Box px={2} py={1} color="text.secondary">
          אין פריטים במחסן זה
        </Box>
      );
    }
    return (
      <TableContainer component={Paper} sx={{ mt: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>מזהה פריט</TableCell>
              <TableCell>כמות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((row) => (
              <TableRow key={`${String(storageId)}-${row.item_id}`}>
                <TableCell>{row.item_id}</TableCell>
                <TableCell>{row.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
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
        מחסנים והקצאת מלאי
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Transfer card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            העברת מלאי בין מחסנים
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 3fr 3fr 2fr 1fr' }, gap: 2, alignItems: 'start' }}>
            <Box>
              <TextField
                fullWidth
                label="מזהה פריט (item_id)"
                value={transferItemId}
                onChange={(e) => setTransferItemId(e.target.value)}
                placeholder="לדוגמה: 1001"
              />
            </Box>
            <Box>
              <Select
                fullWidth
                displayEmpty
                value={fromStorage}
                onChange={(e) => setFromStorage(e.target.value)}
              >
                <MenuItem value="">
                  <em>מחסן מקור</em>
                </MenuItem>
                {storages.map((s) => (
                  <MenuItem key={String(s.storage_id)} value={s.storage_id}>
                    {s.storage_name} (#{String(s.storage_id)})
                  </MenuItem>
                ))}
              </Select>
            </Box>
            <Box>
              <Select
                fullWidth
                displayEmpty
                value={toStorage}
                onChange={(e) => setToStorage(e.target.value)}
              >
                <MenuItem value="">
                  <em>מחסן יעד</em>
                </MenuItem>
                {storages.map((s) => (
                  <MenuItem key={String(s.storage_id)} value={s.storage_id}>
                    {s.storage_name} (#{String(s.storage_id)})
                  </MenuItem>
                ))}
              </Select>
            </Box>
            <Box>
              <TextField
                fullWidth
                type="number"
                label="כמות להעברה"
                inputProps={{ min: 1 }}
                value={transferAmount}
                onChange={(e) => setTransferAmount(Number(e.target.value))}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<SwapHorizIcon />}
                onClick={handleTransfer}
              >
                העבר
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Local storages management */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ניהול מחסנים (לוקאליים)
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '8fr 4fr' }, gap: 2, alignItems: 'center' }}>
            <Box>
              <TextField
                fullWidth
                label="שם מחסן חדש"
                value={newStorageName}
                onChange={(e) => setNewStorageName(e.target.value)}
                placeholder="לדוגמה: מחסן חנות דיזנגוף"
              />
            </Box>
            <Box>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AddCircleOutlineIcon />}
                onClick={handleCreateLocal}
              >
                הוסף מחסן
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Storages list */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6">רשימת מחסנים</Typography>
            <Chip
              size="small"
              icon={<Inventory2Icon />}
              label={`סה\"כ מחסנים: ${storages.length}`}
              color="default"
            />
          </Box>
          <Divider sx={{ mb: 2 }} />

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>מחסן</TableCell>
                  <TableCell>מזהה</TableCell>
                  <TableCell>סוג</TableCell>
                  <TableCell align="right">סה״כ כמות (לוקאלי)</TableCell>
                  <TableCell align="right">פעולות</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {storages.map((s) => {
                  const key = String(s.storage_id);
                  const isEditing = editingId === s.storage_id;
                  return (
                    <React.Fragment key={key}>
                      <TableRow hover>
                        <TableCell sx={{ minWidth: 220 }}>
                          {isEditing ? (
                            <TextField
                              size="small"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                            />
                          ) : (
                            s.storage_name
                          )}
                        </TableCell>
                        <TableCell>#{key}</TableCell>
                        <TableCell>
                          {s.isLocal ? (
                            <Chip label="לוקאלי" size="small" color="info" variant="outlined" />
                          ) : (
                            <Chip label="שרת" size="small" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={(totalsByStorage[key] ?? 0).toLocaleString()}
                            color="info"
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {/* Hidden file input */}
                          <input
                            type="file"
                            accept="application/json"
                            style={{ display: "none" }}
                            ref={(el) => {
                              fileInputs.current[key] = el;
                            }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImportJson(s.storage_id, file);
                                // reset input so same file can be chosen again
                                e.currentTarget.value = "";
                              }
                            }}
                          />
                          {/* Edit/Save/Cancel for local storages */}
                          {s.isLocal ? (
                            isEditing ? (
                              <>
                                <Tooltip title="שמירה">
                                  <span>
                                    <IconButton color="primary" onClick={saveRename} disabled={!editingName.trim()}>
                                      <SaveIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="ביטול">
                                  <span>
                                    <IconButton onClick={cancelRename}>
                                      <CloseIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </>
                            ) : (
                              <Tooltip title="שנה שם">
                                <span>
                                  <IconButton color="default" onClick={() => beginRename(s)}>
                                    <EditIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )
                          ) : (
                            <Tooltip title="אי אפשר לשנות שם למחסן שרת">
                              <span>
                                <IconButton disabled>
                                  <EditIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                          {/* Import JSON */}
                          <Tooltip title="ייבוא JSON למחסן">
                            <span>
                              <IconButton
                                color="primary"
                                onClick={() => fileInputs.current[key]?.click()}
                              >
                                <UploadFileIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                          {/* Clear local allocations for this storage */}
                          <Tooltip title="ניקוי כל הכמויות במחסן (לוקאלי)">
                            <span>
                              <IconButton color="warning" onClick={() => handleClearStorage(s.storage_id)}>
                                <DeleteSweepIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                          {/* Delete local storage */}
                          {s.isLocal ? (
                            <Tooltip title="מחק מחסן">
                              <span>
                                <IconButton color="error" onClick={() => deleteLocal(s)}>
                                  <DeleteForeverIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          ) : (
                            <Tooltip title="אי אפשר למחוק מחסן שרת">
                              <span>
                                <IconButton disabled>
                                  <DeleteForeverIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                          {/* Show items */}
                          <Tooltip title="הצג פריטים במחסן">
                            <span>
                              <IconButton
                                onClick={() =>
                                  setOpenDetails((prev) => ({
                                    ...prev,
                                    [key]: !prev[key],
                                  }))
                                }
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                      {openDetails[key] && (
                        <TableRow>
                          <TableCell colSpan={5}>{renderStorageDetails(s.storage_id)}</TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Snackbar
        open={!!success}
        autoHideDuration={3500}
        onClose={() => setSuccess(null)}
        message={success || ""}
      />
    </Box>
  );
}
