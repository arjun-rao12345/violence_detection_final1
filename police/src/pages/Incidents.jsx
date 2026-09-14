import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';

import {
  Clear,
  LocationOn,
  Refresh,
  Search,
  Delete
} from '@mui/icons-material';

import axios from 'axios';
import socket from '../lib/socket';

const API_URL = 'http://localhost:4001';

// Ordered process for the response status. A row can only move FORWARD
// through this list - once a stage is passed, it's removed from the
// dropdown options for that row so the user can't go back to it.
const RESPONSE_STATUS_FLOW = ['Pending', 'Dispatched', 'On Site', 'Resolved'];

// Maps a responseStatus value to the corresponding top-level incident status.
const mapResponseToStatus = (responseStatus) => {
  if (responseStatus === 'Resolved') return 'Resolved';
  if (responseStatus === 'Pending') return 'Pending';
  return 'Dispatched';
};

const Incidents = () => {
  const [incidents, setIncidents] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [responseFilter, setResponseFilter] = useState('All');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');

  const getToken = () => localStorage.getItem('policeToken');

  const handleDeleteIncident = async (id) => {
    if (!window.confirm("Are you sure you want to delete this incident?")) return;
    try {
      setUpdatingId(id);
      await axios.delete(`${API_URL}/incidents/${id}`);
      setIncidents((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error(err);
      setError("Failed to delete incident.");
    } finally {
      setUpdatingId(null);
    }
  };

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getToken();

      const response = await axios.get(`${API_URL}/incidents`, {
        headers: {
          'auth-token': token
        }
      });

      const incidentData = Array.isArray(response.data)
        ? response.data
        : response.data?.incidents || [];

      setIncidents(incidentData);
    } catch (error) {
      console.error('Error fetching incidents:', error);

      setError(
        error.response?.data?.message ||
          'Unable to fetch incidents. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();

    socket.connect();

    const handleIncidentCreated = (payload) => {
      const newIncident = payload?.incident || payload;

      if (!newIncident?._id) {
        return;
      }

      setIncidents((previousIncidents) => {
        const alreadyExists = previousIncidents.some(
          (incident) => incident._id === newIncident._id
        );

        if (alreadyExists) {
          return previousIncidents;
        }

        return [newIncident, ...previousIncidents];
      });
    };

    const handleIncidentUpdated = (payload) => {
      const updatedIncident = payload?.incident || payload;

      if (!updatedIncident?._id) {
        return;
      }

      setIncidents((previousIncidents) =>
        previousIncidents.map((incident) =>
          incident._id === updatedIncident._id
            ? { ...incident, ...updatedIncident }
            : incident
        )
      );
    };

    socket.on('incident:created', handleIncidentCreated);
    socket.on('incident:updated', handleIncidentUpdated);

    return () => {
      socket.off('incident:created', handleIncidentCreated);
      socket.off('incident:updated', handleIncidentUpdated);
      socket.disconnect();
    };
  }, []);

  const updateIncidentStatus = async (
    incidentId,
    newStatus,
    newResponseStatus
  ) => {
    try {
      setUpdatingId(incidentId);
      setError('');

      const token = getToken();

      const response = await axios.put(
        `${API_URL}/incidents/${incidentId}`,
        {
          status: newStatus,
          responseStatus: newResponseStatus
        },
        {
          headers: {
            'auth-token': token
          }
        }
      );

      const updatedIncident =
        response.data?.incident ||
        response.data?.data ||
        response.data;

      setIncidents((previousIncidents) =>
        previousIncidents.map((incident) =>
          incident._id === incidentId
            ? {
                ...incident,
                ...(updatedIncident?._id ? updatedIncident : {}),
                status: newStatus || incident.status,
                responseStatus:
                  newResponseStatus || incident.responseStatus
              }
            : incident
        )
      );
    } catch (error) {
      console.error('Error updating incident status:', error);

      setError(
        error.response?.data?.message ||
          'Unable to update incident status.'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Handler for the process dropdown - only ever moves forward through
  // RESPONSE_STATUS_FLOW, and asks for confirmation since the move can't
  // be undone from the UI once it's made.
  const handleResponseStatusChange = (incident, newResponseStatus) => {
    if (newResponseStatus === incident.responseStatus) return;

    const confirmed = window.confirm(
      `Move this incident to "${newResponseStatus}"? This cannot be undone from here.`
    );

    if (!confirmed) return;

    updateIncidentStatus(
      incident._id,
      mapResponseToStatus(newResponseStatus),
      newResponseStatus
    );
  };

  const filteredIncidents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return incidents.filter((incident) => {
      const cameraValue =
        typeof incident.cameraId === 'object'
          ? incident.cameraId?.cameraName ||
            incident.cameraId?.name ||
            incident.cameraId?._id
          : incident.cameraId;

      const searchableValues = [
        incident.type,
        incident.address,
        incident.cameraName,
        cameraValue,
        incident.status,
        incident.responseStatus,
        incident.severity,
        incident.detectionType
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        normalizedSearch === '' ||
        searchableValues.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === 'All' ||
        incident.status === statusFilter;

      const incidentResponseStatus =
        incident.responseStatus || 'Pending';

      const matchesResponse =
        responseFilter === 'All' ||
        incidentResponseStatus === responseFilter;

      return matchesSearch && matchesStatus && matchesResponse;
    });
  }, [
    incidents,
    searchTerm,
    statusFilter,
    responseFilter
  ]);

  const paginatedIncidents = useMemo(() => {
    const startIndex = page * rowsPerPage;

    return filteredIncidents.slice(
      startIndex,
      startIndex + rowsPerPage
    );
  }, [filteredIncidents, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, statusFilter, responseFilter]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setResponseFilter('All');
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number(event.target.value));
    setPage(0);
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'Resolved':
        return 'success';

      case 'Dispatched':
        return 'info';

      case 'Pending':
        return 'warning';

      default:
        return 'default';
    }
  };

  const getResponseChipColor = (responseStatus) => {
    switch (responseStatus) {
      case 'Resolved':
        return 'success';

      case 'On Site':
        return 'warning';

      case 'Dispatched':
        return 'info';

      case 'Pending':
        return 'default';

      default:
        return 'default';
    }
  };

  const getSeverityChipColor = (severity) => {
    switch (severity) {
      case 'Critical':
        return 'error';

      case 'High':
        return 'warning';

      case 'Medium':
        return 'info';

      case 'Low':
        return 'success';

      default:
        return 'default';
    }
  };

  const getCameraName = (incident) => {
    if (incident.cameraName) {
      return incident.cameraName;
    }

    if (typeof incident.cameraId === 'object') {
      return (
        incident.cameraId?.cameraName ||
        incident.cameraId?.name ||
        incident.cameraId?._id ||
        'Unknown'
      );
    }

    return incident.cameraId || 'Unknown';
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return 'N/A';
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return 'N/A';
    }

    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openLocation = (incident) => {
    if (incident.latitude == null || incident.longitude == null) {
      return;
    }

    const mapUrl = `https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`;

    window.open(mapUrl, '_blank', 'noopener,noreferrer');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    statusFilter !== 'All' ||
    responseFilter !== 'All';

  return (
    <Box p={{ xs: 2, md: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Assigned Incidents
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Search, filter and update assigned incident records.
          </Typography>
        </Box>

        <Tooltip title="Refresh incidents">
          <IconButton
            color="primary"
            onClick={fetchIncidents}
            disabled={loading}
          >
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <TextField
            fullWidth
            size="small"
            label="Search incidents"
            placeholder="Search type, address, camera or status"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchTerm('')}
                  >
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <FormControl
            size="small"
            sx={{ minWidth: { xs: '100%', md: 180 } }}
          >
            <InputLabel>Incident status</InputLabel>

            <Select
              value={statusFilter}
              label="Incident status"
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <MenuItem value="All">All statuses</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Dispatched">Dispatched</MenuItem>
              <MenuItem value="Resolved">Resolved</MenuItem>
            </Select>
          </FormControl>

          <FormControl
            size="small"
            sx={{ minWidth: { xs: '100%', md: 190 } }}
          >
            <InputLabel>Response status</InputLabel>

            <Select
              value={responseFilter}
              label="Response status"
              onChange={(event) =>
                setResponseFilter(event.target.value)
              }
            >
              <MenuItem value="All">All responses</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Dispatched">Dispatched</MenuItem>
              <MenuItem value="On Site">On Site</MenuItem>
              <MenuItem value="Resolved">Resolved</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<Clear />}
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
            sx={{
              whiteSpace: 'nowrap',
              minWidth: 140
            }}
          >
            Clear filters
          </Button>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <Box
          px={2}
          py={1.5}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          borderBottom="1px solid"
          borderColor="divider"
        >
          <Typography variant="subtitle1" fontWeight={600}>
            Incident records
          </Typography>

          <Chip
            label={`${filteredIncidents.length} incident${
              filteredIncidents.length === 1 ? '' : 's'
            }`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        <TableContainer sx={{ maxHeight: 650 }}>
          <Table stickyHeader sx={{ minWidth: 1250 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>
                  Incident
                </TableCell>

                <TableCell sx={{ fontWeight: 700 }}>
                  Location
                </TableCell>

                <TableCell sx={{ fontWeight: 700 }}>
                  Camera
                </TableCell>

                <TableCell sx={{ fontWeight: 700 }}>
                  Severity
                </TableCell>

                <TableCell sx={{ fontWeight: 700 }}>
                  Status
                </TableCell>

                <TableCell sx={{ fontWeight: 700 }}>
                  Response
                </TableCell>

                <TableCell sx={{ fontWeight: 700 }}>
                  Reported date
                </TableCell>

                <TableCell
                  align="center"
                  sx={{ fontWeight: 700, minWidth: 260 }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Box
                      py={6}
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      gap={2}
                    >
                      <CircularProgress size={32} />

                      <Typography color="text.secondary">
                        Loading incidents...
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : paginatedIncidents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Box py={6}>
                      <Typography
                        variant="h6"
                        color="text.secondary"
                      >
                        No incidents found
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        mt={1}
                      >
                        Try changing the search text or filters.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedIncidents.map((incident) => {
                  const responseStatus =
                    incident.responseStatus || 'Pending';

                  const isUpdating =
                    updatingId === incident._id;

                  const isResolved =
                    incident.status === 'Resolved' ||
                    responseStatus === 'Resolved';

                  const canOpenLocation =
                    incident.latitude != null &&
                    incident.longitude != null;

                  // Only stages from the current one onward are offered,
                  // so the dropdown can only move the process forward.
                  const currentStageIndex = Math.max(
                    RESPONSE_STATUS_FLOW.indexOf(responseStatus),
                    0
                  );

                  const availableStages = RESPONSE_STATUS_FLOW.slice(
                    currentStageIndex
                  );

                  return (
                    <TableRow
                      key={incident._id}
                      hover
                      sx={{
                        '&:last-child td': {
                          borderBottom: 0
                        }
                      }}
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                        >
                          {incident.type || 'Unknown incident'}
                        </Typography>

                        {incident.detectionType && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Detection: {incident.detectionType}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell sx={{ maxWidth: 240 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            whiteSpace: 'normal',
                            wordBreak: 'break-word'
                          }}
                        >
                          {incident.address || 'Address unavailable'}
                        </Typography>

                        {canOpenLocation && (
                          <Button
                            size="small"
                            startIcon={<LocationOn />}
                            onClick={() => openLocation(incident)}
                            sx={{ mt: 0.5, px: 0 }}
                          >
                            View map
                          </Button>
                        )}
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {getCameraName(incident)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={incident.severity || 'N/A'}
                          color={getSeverityChipColor(
                            incident.severity
                          )}
                          variant="outlined"
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={incident.status || 'Pending'}
                          color={getStatusChipColor(
                            incident.status || 'Pending'
                          )}
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={responseStatus}
                          color={getResponseChipColor(
                            responseStatus
                          )}
                          variant="outlined"
                        />
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(
                            incident.createdAt ||
                              incident.detectedAt ||
                              incident.incidentDate
                          )}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="center"
                          alignItems="center"
                          flexWrap="wrap"
                          useFlexGap
                        >
                          {isResolved ? (
                            <Chip
                              label="Incident resolved"
                              color="success"
                              size="small"
                            />
                          ) : (
                            <FormControl
                              size="small"
                              sx={{ minWidth: 150 }}
                              disabled={isUpdating}
                            >
                              <Select
                                value={responseStatus}
                                onChange={(event) =>
                                  handleResponseStatusChange(
                                    incident,
                                    event.target.value
                                  )
                                }
                              >
                                {availableStages.map((stage) => (
                                  <MenuItem key={stage} value={stage}>
                                    {isUpdating &&
                                    stage === responseStatus
                                      ? 'Updating...'
                                      : stage}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}

                          <Tooltip title="Delete incident">
                            <IconButton
                              color="error"
                              size="small"
                              disabled={isUpdating}
                              onClick={() =>
                                handleDeleteIncident(incident._id)
                              }
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredIncidents.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Rows per page"
        />
      </Paper>
    </Box>
  );
};

export default Incidents;