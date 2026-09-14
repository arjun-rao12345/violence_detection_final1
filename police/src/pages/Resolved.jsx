import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Stack,
  Avatar,
  Divider,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";

import {
  CheckCircle,
  Room,
  CameraAlt,
  AccessTime,
  Refresh,
  TaskAlt,
  Description,
  Shield,
  Delete,
} from "@mui/icons-material";

import axios from "axios";

const Resolved = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const BASE_URL = "http://localhost:4001/incidents";

  const handleDeleteIncident = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resolved incident?")) return;
    try {
      await axios.delete(`${BASE_URL}/${id}`);
      setIncidents((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete incident.");
    }
  };

  useEffect(() => {
    fetchResolvedIncidents();
  }, []);

  const fetchResolvedIncidents = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("policeToken");

      if (!token) {
        setError("Your login session has expired. Please log in again.");
        return;
      }

      const response = await axios.get(BASE_URL, {
        headers: {
          "auth-token": token,
        },
      });

      const allIncidents = Array.isArray(response.data)
        ? response.data
        : response.data?.incidents || [];

      const officer = JSON.parse(
        localStorage.getItem("loggedInOfficer") || "{}"
      );

      const officerStationId =
        officer.stationId?._id || officer.stationId;

      const resolvedIncidents = allIncidents.filter((incident) => {
        if (incident.status !== "Resolved") {
          return false;
        }

        if (!officerStationId) {
          return true;
        }

        const cameraStationId =
          incident.cameraId?.policeStationId?._id ||
          incident.cameraId?.policeStationId;

        return (
          cameraStationId &&
          cameraStationId.toString() ===
            officerStationId.toString()
        );
      });

      // Display recently resolved incidents first
      resolvedIncidents.sort((a, b) => {
        const firstDate = new Date(
          a.resolvedAt || a.updatedAt || a.timestamp
        );

        const secondDate = new Date(
          b.resolvedAt || b.updatedAt || b.timestamp
        );

        return secondDate - firstDate;
      });

      setIncidents(resolvedIncidents);
    } catch (err) {
      console.error("Error fetching resolved incidents:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load resolved cases. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return "Not available";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "Critical":
        return "error";

      case "High":
        return "warning";

      case "Medium":
        return "info";

      case "Low":
        return "success";

      default:
        return "default";
    }
  };

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
      {/* Page Header */}
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
        sx={{ mb: 3 }}
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
            Resolved Cases
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              maxWidth: 750,
              lineHeight: 1.7,
            }}
          >
            View the history of emergency threats and incidents
            successfully resolved by your police station.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchResolvedIncidents}
          disabled={loading}
          sx={{
            borderRadius: 2.5,
            px: 2.5,
            py: 1,
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          Refresh Cases
        </Button>
      </Stack>

      {/* Summary Card */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 12px 40px rgba(0,0,0,0.25)"
              : "0 12px 40px rgba(15,23,42,0.08)",
        }}
      >
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
                <TaskAlt sx={{ fontSize: 32 }} />
              </Avatar>

              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700 }}
                >
                  Completed Incident History
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.9,
                    mt: 0.3,
                  }}
                >
                  Cases that have been reviewed and marked as
                  resolved.
                </Typography>
              </Box>
            </Stack>

            <Chip
              icon={<Shield />}
              label={`${incidents.length} Resolved ${
                incidents.length === 1 ? "Case" : "Cases"
              }`}
              sx={{
                bgcolor: "rgba(255,255,255,0.18)",
                color: "inherit",
                border: "1px solid rgba(255,255,255,0.3)",
                fontWeight: 700,
                "& .MuiChip-icon": {
                  color: "inherit",
                },
              }}
            />
          </Stack>
        </Box>
      </Card>

      {/* Loading */}
      {loading && (
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <CardContent>
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={2}
              sx={{ minHeight: 240 }}
            >
              <CircularProgress />

              <Typography color="text.secondary">
                Loading resolved cases...
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {!loading && error && (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={fetchResolvedIncidents}
              sx={{
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              Retry
            </Button>
          }
          sx={{
            borderRadius: 3,
            alignItems: "center",
          }}
        >
          {error}
        </Alert>
      )}

      {/* Empty Cases */}
      {!loading && !error && incidents.length === 0 && (
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <CardContent>
            <Stack
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              spacing={1.5}
              sx={{
                minHeight: 280,
                px: 2,
              }}
            >
              <Avatar
                sx={{
                  width: 68,
                  height: 68,
                  bgcolor: "action.hover",
                  color: "primary.main",
                }}
              >
                <CheckCircle sx={{ fontSize: 38 }} />
              </Avatar>

              <Typography
                variant="h6"
                sx={{ fontWeight: 700 }}
              >
                No Resolved Cases
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 430 }}
              >
                No resolved cases have been recorded for your
                police station.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Incident Cards */}
      {!loading && !error && incidents.length > 0 && (
        <Grid container spacing={3}>
          {incidents.map((incident) => (
            <Grid
              item
              xs={12}
              md={6}
              xl={4}
              key={incident._id}
              sx={{ display: "flex" }}
            >
              <Card
                elevation={0}
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: "divider",
                  overflow: "hidden",
                  transition:
                    "transform 0.25s ease, box-shadow 0.25s ease",
                  boxShadow: (theme) =>
                    theme.palette.mode === "dark"
                      ? "0 10px 30px rgba(0,0,0,0.22)"
                      : "0 10px 30px rgba(15,23,42,0.07)",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: (theme) =>
                      theme.palette.mode === "dark"
                        ? "0 16px 40px rgba(0,0,0,0.32)"
                        : "0 16px 40px rgba(15,23,42,0.12)",
                  },
                }}
              >
                {/* Card Top Border */}
                <Box
                  sx={{
                    height: 5,
                    bgcolor: "success.main",
                  }}
                />

                <CardContent
                  sx={{
                    p: 3,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    "&:last-child": {
                      pb: 3,
                    },
                  }}
                >
                  {/* Incident Header */}
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={2}
                    sx={{ mb: 2 }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      sx={{
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 42,
                          height: 42,
                          bgcolor: "success.main",
                        }}
                      >
                        <CheckCircle />
                      </Avatar>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="h6"
                          title={incident.type}
                          sx={{
                            fontWeight: 700,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {incident.type || "Incident"}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Incident ID:{" "}
                          {incident._id
                            ?.toString()
                            .slice(-8)
                            .toUpperCase()}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label="Resolved"
                        color="success"
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                      <Tooltip title="Delete incident">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDeleteIncident(incident._id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mb: 2 }}
                  >
                    {incident.severity && (
                      <Chip
                        label={incident.severity}
                        color={getSeverityColor(
                          incident.severity
                        )}
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    )}

                    {incident.confidence !== undefined && (
                      <Chip
                        label={`${Math.round(
                          Number(incident.confidence) <= 1
                            ? Number(incident.confidence) * 100
                            : Number(incident.confidence)
                        )}% confidence`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Stack>

                  <Divider sx={{ mb: 2.5 }} />

                  {/* Incident Information */}
                  <Stack spacing={2}>
                    <Stack
                      direction="row"
                      spacing={1.3}
                      alignItems="flex-start"
                    >
                      <Room
                        sx={{
                          color: "primary.main",
                          fontSize: 21,
                          mt: 0.2,
                          flexShrink: 0,
                        }}
                      />

                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          LOCATION
                        </Typography>

                        <Typography
                          variant="body2"
                          title={
                            incident.address ||
                            incident.location ||
                            "Location not available"
                          }
                          sx={{
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {incident.address ||
                            incident.location ||
                            "Location not available"}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={1.3}
                      alignItems="flex-start"
                    >
                      <CameraAlt
                        sx={{
                          color: "primary.main",
                          fontSize: 21,
                          mt: 0.2,
                          flexShrink: 0,
                        }}
                      />

                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          CAMERA SOURCE
                        </Typography>

                        <Typography
                          variant="body2"
                          title={
                            incident.cameraName ||
                            incident.cameraId?.cameraName ||
                            "Unknown camera"
                          }
                          sx={{
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {incident.cameraName ||
                            incident.cameraId?.cameraName ||
                            "Unknown camera"}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={1.3}
                      alignItems="flex-start"
                    >
                      <AccessTime
                        sx={{
                          color: "primary.main",
                          fontSize: 21,
                          mt: 0.2,
                          flexShrink: 0,
                        }}
                      />

                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          REPORTED
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500 }}
                        >
                          {formatDate(
                            incident.timestamp ||
                              incident.createdAt
                          )}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={1.3}
                      alignItems="flex-start"
                    >
                      <TaskAlt
                        sx={{
                          color: "success.main",
                          fontSize: 21,
                          mt: 0.2,
                          flexShrink: 0,
                        }}
                      />

                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          RESOLVED AT
                        </Typography>

                        <Typography
                          variant="body2"
                          color="success.main"
                          sx={{ fontWeight: 700 }}
                        >
                          {formatDate(
                            incident.resolvedAt ||
                              incident.updatedAt
                          )}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>

                  {/* Description */}
                  <Box
                    sx={{
                      mt: "auto",
                      pt: 2,
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.8,
                        borderRadius: 2.5,
                        bgcolor: "action.hover",
                        border: "1px solid",
                        borderColor: "divider",
                        overflow: "hidden",
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="flex-start"
                      >
                        <Description
                          sx={{
                            color: "text.secondary",
                            fontSize: 19,
                            mt: 0.1,
                            flexShrink: 0,
                          }}
                        />

                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            DESCRIPTION
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            title={
                              incident.description ||
                              "No description provided"
                            }
                            sx={{
                              mt: 0.2,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              lineHeight: 1.5,
                            }}
                          >
                            {incident.description ||
                              "No description provided"}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Resolved;