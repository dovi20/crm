"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Avatar,
  Container,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Inventory as InventoryIcon,
  Login as LoginIcon,
} from "@mui/icons-material";
import authStore from "@/state/authStore";

export default function LoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (authStore.isLoggedIn()) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleInputChange = (field: "username" | "password") => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError("נא למלא את כל השדות");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const success = authStore.login(credentials.username, credentials.password);
      
      if (success) {
        router.push("/dashboard");
      } else {
        setError("שם משתמש או סיסמה שגויים");
      }
    } catch (err) {
      setError("שגיאה בתהליך הכניסה");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const form = event.currentTarget.form;
      if (form) {
        const formEvent = new Event('submit', { bubbles: true, cancelable: true });
        Object.defineProperty(formEvent, 'target', { value: form });
        Object.defineProperty(formEvent, 'currentTarget', { value: form });
        handleSubmit(formEvent as unknown as React.FormEvent);
      }
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
        }}
      >
        <Card
          sx={{
            width: "100%",
            maxWidth: 400,
            boxShadow: 3,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header with logo */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mb: 4,
              }}
            >
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: "primary.main",
                  mb: 2,
                }}
              >
                <InventoryIcon fontSize="large" />
              </Avatar>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: "bold",
                  textAlign: "center",
                  mb: 1,
                }}
              >
                מערכת ניהול מלאי
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                התחברות למערכת
              </Typography>
            </Box>

            {/* Error message */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Login form */}
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="שם משתמש"
                value={credentials.username}
                onChange={handleInputChange("username")}
                onKeyPress={handleKeyPress}
                margin="normal"
                autoComplete="username"
                autoFocus
                disabled={loading}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="סיסמה"
                type={showPassword ? "text" : "password"}
                value={credentials.password}
                onChange={handleInputChange("password")}
                onKeyPress={handleKeyPress}
                margin="normal"
                autoComplete="current-password"
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={loading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={<LoginIcon />}
                sx={{ 
                  py: 1.5,
                  fontSize: "1.1rem",
                }}
              >
                {loading ? "מתחבר..." : "התחבר"}
              </Button>
            </Box>

            {/* Default credentials hint for development */}
            {process.env.NODE_ENV === "development" && (
              <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  פיתוח: שם משתמש: admin, סיסמה: 123456
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}