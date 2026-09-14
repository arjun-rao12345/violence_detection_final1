import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, CircularProgress, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { LocalPolice } from '@mui/icons-material';

const Login = () => {
  const [credentials, setCredentials] = useState({ badgeId: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    const res = await axios.post(
      "http://localhost:4001/officers/login",
      credentials
    );

    // Login successful
    if (res.data.success && (res.data.authtoken || res.data.token)) {
      localStorage.setItem(
        "policeToken",
        res.data.authtoken || res.data.token
      );
      if (res.data.loggedInOfficer) {
        localStorage.setItem(
          "loggedInOfficer",
          JSON.stringify(res.data.loggedInOfficer)
        );
      }

      navigate("/dashboard");
    } else {
      setError(res.data.message || "Invalid Badge ID or Password");

      // Remove any existing token
      localStorage.removeItem("policeToken");
    }
  } catch (err) {
    console.error(err);

    // Remove any existing token
    localStorage.removeItem("policeToken");

    if (err.response) {
      // Backend returned an error
      setError(err.response.data.message || "Invalid Badge ID or Password");
    } else {
      // Network error
      setError("Unable to connect to the server.");
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
      borderColor: "#38BDF8",
    },

    "&.Mui-focused fieldset": {
      borderColor: "#0EA5E9",
      borderWidth: "2px",
    },
  },

  "& .MuiInputLabel-root": {
    color: "#94A3B8",
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#38BDF8",
  },

  "& input::placeholder": {
    color: "#64748B",
    opacity: 1,
  },
};
  return (
  <Box
    sx={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background:
        "radial-gradient(circle at top left, #123B63 0%, transparent 30%), linear-gradient(135deg, #020617 0%, #071827 50%, #0B1120 100%)",
      position: "relative",
      overflow: "hidden",
      px: 2,
    }}
  >
    {/* Police Light Effect */}
    <Box
      sx={{
        position: "absolute",
        top: 0,
        width: "100%",
        height: "6px",
        background:
          "linear-gradient(90deg, #1565C0, #29B6F6, #D32F2F, #FF1744)",
        boxShadow: "0 0 25px rgba(41,182,246,.8)",
      }}
    />

    <Box
      sx={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)",
        backgroundSize: "45px 45px",
      }}
    />

    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6 }}
      style={{ zIndex: 2 }}
    >
      <Card
        sx={{
          width: { xs: 350, sm: 430 },
          borderRadius: "28px",
          background: "rgba(8, 20, 38, 0.88)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(56,189,248,.25)",
          boxShadow:
            "0 30px 80px rgba(0,0,0,.65), 0 0 35px rgba(14,165,233,.18)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            height: 8,
            background:
              "linear-gradient(90deg, #0EA5E9, #2563EB, #DC2626)",
          }}
        />

        <CardContent sx={{ p: { xs: 4, sm: 5 }, textAlign: "center" }}>
          <Avatar
            sx={{
              width: 92,
              height: 92,
              mx: "auto",
              mb: 2.5,
              background:
                "linear-gradient(145deg, #0EA5E9, #1D4ED8)",
              border: "3px solid rgba(255,255,255,.25)",
              boxShadow: "0 0 35px rgba(14,165,233,.55)",
            }}
          >
            <LocalPolice sx={{ fontSize: 54, color: "#fff" }} />
          </Avatar>

          <Typography
            variant="h4"
            sx={{
              color: "#F8FAFC",
              fontWeight: 800,
              letterSpacing: ".5px",
            }}
          >
            Police Login
          </Typography>

          <Typography
            sx={{
              color: "#94A3B8",
              mt: 1,
              mb: 4,
              fontSize: "0.95rem",
            }}
          >
            Smart Violation Detection & Emergency Response Portal
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 3,
                textAlign: "left",
                backgroundColor: "rgba(211,47,47,.15)",
                color: "#FECACA",
                border: "1px solid rgba(248,113,113,.35)",
                "& .MuiAlert-icon": {
                  color: "#F87171",
                },
              }}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Badge ID"
              name="badgeId"
              fullWidth
              required
              value={credentials.badgeId}
              onChange={handleChange}
              placeholder="Enter your badge ID"
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
              placeholder="Enter your password"
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
                background:
                  "linear-gradient(135deg, #0EA5E9, #2563EB)",
                boxShadow: "0 12px 30px rgba(37,99,235,.4)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #0284C7, #1D4ED8)",
                  boxShadow: "0 16px 40px rgba(14,165,233,.5)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "ACCESS CONTROL ROOM"
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
            Authorized Police Personnel Only
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  </Box>
);
};

export default Login;
