
import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Avatar,
  Divider,
  Stack,
  Chip,
} from "@mui/material";

import {
  Visibility,
  VisibilityOff,
  LockReset,
  Security,
  CheckCircle,
  Shield,
  Person,
} from "@mui/icons-material";

import axios from "axios";

const ManageProfile = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const BASE_URL = "http://localhost:4001/officers";

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setFieldErrors((previousErrors) => ({
      ...previousErrors,
      [name]: "",
    }));

    setError("");
    setSuccess("");
  };

  const handleTogglePassword = (fieldName) => {
    setShowPassword((previousState) => ({
      ...previousState,
      [fieldName]: !previousState[fieldName],
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.currentPassword.trim()) {
      errors.currentPassword =
        "Current password or security code is required";
    }

    if (!formData.newPassword) {
      errors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 6) {
      errors.newPassword =
        "New password must contain at least 6 characters";
    } else if (!/[A-Z]/.test(formData.newPassword)) {
      errors.newPassword =
        "Password must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(formData.newPassword)) {
      errors.newPassword =
        "Password must contain at least one lowercase letter";
    } else if (!/[0-9]/.test(formData.newPassword)) {
      errors.newPassword =
        "Password must contain at least one number";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (
      formData.newPassword !== formData.confirmPassword
    ) {
      errors.confirmPassword =
        "New password and confirm password do not match";
    }

    if (
      formData.currentPassword &&
      formData.newPassword &&
      formData.currentPassword === formData.newPassword
    ) {
      errors.newPassword =
        "New password must be different from the current password";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("policeToken");

      if (!token) {
        setError("Your login session has expired. Please log in again.");
        return;
      }

      const response = await axios.put(
        `${BASE_URL}/change-password`,
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        },
        {
          headers: {
            "auth-token": token,
          },
        }
      );

      setSuccess(
        response.data?.message ||
          "Your password has been updated successfully"
      );

      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setFieldErrors({});
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update the password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const passwordRules = [
    {
      label: "At least 6 characters",
      valid: formData.newPassword.length >= 6,
    },
    {
      label: "One uppercase letter",
      valid: /[A-Z]/.test(formData.newPassword),
    },
    {
      label: "One lowercase letter",
      valid: /[a-z]/.test(formData.newPassword),
    },
    {
      label: "One number",
      valid: /[0-9]/.test(formData.newPassword),
    },
  ];

  const getPasswordField = ({
    label,
    name,
    placeholder,
    autoComplete,
  }) => (
    <TextField
      label={label}
      name={name}
      type={showPassword[name] ? "text" : "password"}
      value={formData[name]}
      onChange={handleChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      fullWidth
      required
      error={Boolean(fieldErrors[name])}
      helperText={fieldErrors[name]}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Security
              sx={{
                color: fieldErrors[name]
                  ? "error.main"
                  : "primary.main",
              }}
            />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={() => handleTogglePassword(name)}
              edge="end"
              aria-label={
                showPassword[name]
                  ? "Hide password"
                  : "Show password"
              }
            >
              {showPassword[name] ? (
                <VisibilityOff />
              ) : (
                <Visibility />
              )}
            </IconButton>
          </InputAdornment>
        ),
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: 2.5,
          transition: "all 0.25s ease",
          "&:hover": {
            boxShadow: (theme) =>
              `0 0 0 3px ${theme.palette.primary.main}12`,
          },
          "&.Mui-focused": {
            boxShadow: (theme) =>
              `0 0 0 3px ${theme.palette.primary.main}18`,
          },
        },
      }}
    />
  );

  return (
    <Box
      sx={{
        minHeight: "100%",
        p: {
          xs: 2,
          sm: 3,
          md: 4,
        },
      }}
    >
      {/* Page heading */}
      <Box sx={{ mb: 3 }}>
        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "flex-start",
            sm: "center",
          }}
          spacing={2}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: "text.primary",
                mb: 0.5,
              }}
            >
              Manage Profile
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
            >
              Manage your account security and update your password.
            </Typography>
          </Box>

          <Chip
            icon={<Shield />}
            label="Protected Account"
            color="primary"
            variant="outlined"
            sx={{
              fontWeight: 600,
              borderRadius: 2,
              px: 0.5,
            }}
          />
        </Stack>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 1fr) 320px",
          },
          gap: 3,
          alignItems: "start",
          maxWidth: 1050,
        }}
      >
        {/* Password form card */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
            boxShadow: (theme) =>
              theme.palette.mode === "dark"
                ? "0 12px 40px rgba(0,0,0,0.25)"
                : "0 12px 40px rgba(15,23,42,0.08)",
          }}
        >
          {/* Card header */}
          <Box
            sx={{
              p: {
                xs: 2.5,
                sm: 3,
              },
              background: (theme) =>
                `linear-gradient(
                  135deg,
                  ${theme.palette.primary.main},
                  ${theme.palette.primary.dark}
                )`,
              color: "primary.contrastText",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={2}
            >
              <Avatar
                sx={{
                  width: 58,
                  height: 58,
                  bgcolor: "rgba(255,255,255,0.18)",
                  border: "2px solid rgba(255,255,255,0.35)",
                }}
              >
                <LockReset sx={{ fontSize: 32 }} />
              </Avatar>

              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700 }}
                >
                  Change Password
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.9,
                    mt: 0.3,
                  }}
                >
                  Choose a secure password for your account.
                </Typography>
              </Box>
            </Stack>
          </Box>

          <CardContent
            sx={{
              p: {
                xs: 2.5,
                sm: 3.5,
              },
              "&:last-child": {
                pb: {
                  xs: 2.5,
                  sm: 3.5,
                },
              },
            }}
          >
            {success && (
              <Alert
                severity="success"
                icon={<CheckCircle />}
                onClose={() => setSuccess("")}
                sx={{
                  mb: 3,
                  borderRadius: 2.5,
                  alignItems: "center",
                }}
              >
                {success}
              </Alert>
            )}

            {error && (
              <Alert
                severity="error"
                onClose={() => setError("")}
                sx={{
                  mb: 3,
                  borderRadius: 2.5,
                  alignItems: "center",
                }}
              >
                {error}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
            >
              <Stack spacing={2.5}>
                {getPasswordField({
                  label: "Current Password / Security Code",
                  name: "currentPassword",
                  placeholder:
                    "Enter your current password or security code",
                  autoComplete: "current-password",
                })}

                <Divider>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      px: 1,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                    }}
                  >
                    New password
                  </Typography>
                </Divider>

                {getPasswordField({
                  label: "New Password",
                  name: "newPassword",
                  placeholder: "Enter a new secure password",
                  autoComplete: "new-password",
                })}

                {formData.newPassword && (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: "action.hover",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        mb: 1.3,
                      }}
                    >
                      Password requirements
                    </Typography>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "1fr 1fr",
                        },
                        gap: 1,
                      }}
                    >
                      {passwordRules.map((rule) => (
                        <Stack
                          key={rule.label}
                          direction="row"
                          alignItems="center"
                          spacing={0.8}
                        >
                          <CheckCircle
                            sx={{
                              fontSize: 17,
                              color: rule.valid
                                ? "success.main"
                                : "text.disabled",
                            }}
                          />

                          <Typography
                            variant="caption"
                            color={
                              rule.valid
                                ? "success.main"
                                : "text.secondary"
                            }
                            sx={{ fontWeight: 500 }}
                          >
                            {rule.label}
                          </Typography>
                        </Stack>
                      ))}
                    </Box>
                  </Box>
                )}

                {getPasswordField({
                  label: "Confirm New Password",
                  name: "confirmPassword",
                  placeholder: "Enter the new password again",
                  autoComplete: "new-password",
                })}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  startIcon={
                    !loading ? <LockReset /> : undefined
                  }
                  sx={{
                    mt: 1,
                    minHeight: 50,
                    borderRadius: 2.5,
                    textTransform: "none",
                    fontSize: "1rem",
                    fontWeight: 700,
                    boxShadow: (theme) =>
                      `0 8px 20px ${theme.palette.primary.main}35`,
                    "&:hover": {
                      transform: "translateY(-1px)",
                      boxShadow: (theme) =>
                        `0 10px 25px ${theme.palette.primary.main}45`,
                    },
                    "&:disabled": {
                      transform: "none",
                    },
                    transition: "all 0.25s ease",
                  }}
                >
                  {loading ? (
                    <>
                      <CircularProgress
                        size={21}
                        color="inherit"
                        sx={{ mr: 1 }}
                      />
                      Updating Password...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {/* Information card */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            position: {
              md: "sticky",
            },
            top: {
              md: 24,
            },
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Avatar
              sx={{
                width: 50,
                height: 50,
                bgcolor: "primary.main",
                mb: 2,
              }}
            >
              <Person />
            </Avatar>

            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 0.7,
              }}
            >
              Account Security
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                lineHeight: 1.7,
                mb: 2.5,
              }}
            >
              Protect your police account by using a strong and
              unique password.
            </Typography>

            <Divider sx={{ mb: 2.5 }} />

            <Stack spacing={2}>
              {[
                "Do not share your password or security code.",
                "Avoid using your badge number as a password.",
                "Use a different password from other accounts.",
                "Log out when using a shared device.",
              ].map((item) => (
                <Stack
                  key={item}
                  direction="row"
                  spacing={1.2}
                  alignItems="flex-start"
                >
                  <CheckCircle
                    sx={{
                      color: "primary.main",
                      fontSize: 19,
                      mt: 0.2,
                    }}
                  />

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.5 }}
                  >
                    {item}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ManageProfile;