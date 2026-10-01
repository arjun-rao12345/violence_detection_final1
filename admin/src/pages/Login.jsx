import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: 'admin@gmail.com',
    password: 'admin',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(
        'http://localhost:4001/admin/login',
        credentials
      );

      if (res.data.success) {
        // Store admin tokens
        const token = res.data.adminToken;
        localStorage.setItem('adminToken', token);
        localStorage.setItem('userToken', token);

        // Optional: Store admin details
        localStorage.setItem(
          'adminData',
          JSON.stringify(res.data.loggedInUser)
        );

        const destination = location.state?.from || '/dashboard';
        navigate(destination, { replace: true });
      } else {
        setError(res.data.message || 'Login failed');
      }
    } catch (err) {
      console.error(err);

      if (err.response) {
        setError(err.response.data.message || 'Login failed');
      } else {
        setError('Server not responding');
      }
    } finally {
      setLoading(false);
    }
  };
const fieldStyle = {
  "& .MuiOutlinedInput-root": {
    color: "#F8FAFC",
    borderRadius: "14px",
    backgroundColor: "rgba(15,23,42,.75)",

    "& fieldset": {
      borderColor: "rgba(148,163,184,.35)",
    },

    "&:hover fieldset": {
      borderColor: "#F59E0B",
    },

    "&.Mui-focused fieldset": {
      borderColor: "#F59E0B",
      borderWidth: "2px",
    },
  },

  "& .MuiInputLabel-root": {
    color: "#94A3B8",
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#F59E0B",
  },
};
  return (
  <Box
    sx={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      px: 2,
      background:
        "radial-gradient(circle at top right, rgba(245,158,11,.25), transparent 28%), radial-gradient(circle at bottom left, rgba(37,99,235,.22), transparent 30%), linear-gradient(135deg, #020617 0%, #0F172A 55%, #111827 100%)",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
      }}
    />

    <motion.div
      initial={{ opacity: 0, y: 35, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6 }}
      style={{ zIndex: 2 }}
    >
      <Card
        sx={{
          width: { xs: 350, sm: 440 },
          borderRadius: "28px",
          background: "rgba(15, 23, 42, 0.88)",
          backdropFilter: "blur(18px)",
          border: "1px solid rgba(245,158,11,.28)",
          boxShadow:
            "0 30px 80px rgba(0,0,0,.65), 0 0 40px rgba(245,158,11,.16)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            height: 8,
            background: "linear-gradient(90deg, #F59E0B, #2563EB, #06B6D4)",
          }}
        />

        <CardContent sx={{ p: { xs: 4, sm: 5 }, textAlign: "center" }}>
          <Box
            sx={{
              width: 86,
              height: 86,
              mx: "auto",
              mb: 2.5,
              borderRadius: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(145deg, #F59E0B, #D97706)",
              boxShadow: "0 0 35px rgba(245,158,11,.45)",
              color: "#fff",
              fontSize: 42,
              fontWeight: 900,
            }}
          >
            A
          </Box>

          <Typography
            variant="h4"
            sx={{
              color: "#F8FAFC",
              fontWeight: 900,
              letterSpacing: ".4px",
            }}
          >
            Admin Control Center
          </Typography>

          <Typography
            sx={{
              color: "#94A3B8",
              mt: 1,
              mb: 4,
              fontSize: "0.95rem",
            }}
          >
            Manage officers, alerts, incidents and surveillance activity
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 3,
                textAlign: "left",
                backgroundColor: "rgba(220,38,38,.14)",
                color: "#FECACA",
                border: "1px solid rgba(248,113,113,.35)",
                "& .MuiAlert-icon": { color: "#F87171" },
              }}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Email Address"
              name="email"
              type="email"
              fullWidth
              required
              value={credentials.email}
              onChange={handleChange}
              margin="normal"
              sx={fieldStyle}
            />

            <TextField
              label="Password"
              name="password"
              type="password"
              fullWidth
              required
              value={credentials.password}
              onChange={handleChange}
              margin="normal"
              sx={fieldStyle}
            />

            <Button
              type="submit"
              fullWidth
              disabled={loading}
              sx={{
                mt: 4,
                py: 1.7,
                borderRadius: "14px",
                color: "#fff",
                fontWeight: 800,
                letterSpacing: "1px",
                background: "linear-gradient(135deg, #F59E0B, #2563EB)",
                boxShadow: "0 12px 30px rgba(245,158,11,.3)",
                "&:hover": {
                  background: "linear-gradient(135deg, #D97706, #1D4ED8)",
                  boxShadow: "0 16px 40px rgba(37,99,235,.42)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "LOGIN TO ADMIN PANEL"
              )}
            </Button>
          </form>

          <Typography
            sx={{
              mt: 4,
              color: "#64748B",
              fontSize: "0.78rem",
              letterSpacing: ".8px",
              textTransform: "uppercase",
            }}
          >
            Restricted Administrative Access
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  </Box>
);
};

export default Login;