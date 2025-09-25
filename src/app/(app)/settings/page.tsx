"use client";

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  Divider,
  Chip,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Save as SaveIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import authStore from "@/state/authStore";

export default function SettingsPage() {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const currentUser = authStore.getUser();
  const sessionRemaining = authStore.getSessionRemainingTime();
  const hoursRemaining = Math.floor(sessionRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((sessionRemaining % (1000 * 60 * 60)) / (1000 * 60));

  const handlePasswordChange = (field: keyof typeof passwordForm) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    // Clear message when user starts typing
    if (message) setMessage(null);
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => () => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "נא למלא את כל השדות" });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "הסיסמאות החדשות אינן זהות" });
      return;
    }

    if (passwordForm.newPassword.length < 4) {
      setMessage({ type: "error", text: "הסיסמה החדשה חייבת להכיל לפחות 4 תווים" });
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setMessage({ type: "error", text: "הסיסמה החדשה זהה לסיסמה הנוכחית" });
      return;
    }

    setLoading(true);

    try {
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const success = authStore.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      
      if (success) {
        setMessage({ type: "success", text: "הסיסמה שונתה בהצלחה!" });
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setMessage({ type: "error", text: "הסיסמה הנוכחית שגויה" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "שגיאה בשינוי הסיסמה" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm("האם אתה בטוח שברצונך לאפס לסיסמת ברירת המחדל? פעולה זו תחליף את הסיסמה הנוכחית.")) {
      authStore.resetToDefault();
      setMessage({ type: "success", text: "הסיסמה אופסה לברירת מחדל (123456)" });
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        הגדרות
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* User info card */}
        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <PersonIcon sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h6">פרטי המשתמש</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  שם משתמש
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                  {currentUser?.username || "לא זמין"}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  זמן כניסה
                </Typography>
                <Typography variant="body1">
                  {currentUser?.loginTime 
                    ? new Date(currentUser.loginTime).toLocaleString("he-IL")
                    : "לא זמין"
                  }
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  זמן נותר בסשן
                </Typography>
                <Chip
                  label={`${hoursRemaining} שעות, ${minutesRemaining} דקות`}
                  color={hoursRemaining < 1 ? "warning" : "success"}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Change password card */}
        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <SecurityIcon sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h6">שינוי סיסמה</Typography>
              </Box>

              {message && (
                <Alert severity={message.type} sx={{ mb: 2 }}>
                  {message.text}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="סיסמה נוכחית"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange("currentPassword")}
                  margin="normal"
                  autoComplete="current-password"
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={togglePasswordVisibility("current")}
                          edge="end"
                          disabled={loading}
                        >
                          {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="סיסמה חדשה"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange("newPassword")}
                  margin="normal"
                  autoComplete="new-password"
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={togglePasswordVisibility("new")}
                          edge="end"
                          disabled={loading}
                        >
                          {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="אישור סיסמה חדשה"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange("confirmPassword")}
                  margin="normal"
                  autoComplete="new-password"
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={togglePasswordVisibility("confirm")}
                          edge="end"
                          disabled={loading}
                        >
                          {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  startIcon={<SaveIcon />}
                  sx={{ mb: 2 }}
                >
                  {loading ? "משנה סיסמה..." : "שמור סיסמה חדשה"}
                </Button>

                {process.env.NODE_ENV === "development" && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Button
                      variant="outlined"
                      color="warning"
                      fullWidth
                      startIcon={<RefreshIcon />}
                      onClick={handleResetToDefault}
                      disabled={loading}
                    >
                      איפוס לסיסמת ברירת מחדל
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                      פיתוח: איפוס לשם משתמש &quot;admin&quot; וסיסמה &quot;123456&quot;
                    </Typography>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}