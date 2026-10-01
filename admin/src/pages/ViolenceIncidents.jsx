import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
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
  Visibility,
  Delete
} from '@mui/icons-material';

import axios from 'axios';

const API_URL = 'http://localhost:4001';

const getImageUrl = (img) => {
  if (!img) return '';
  if (typeof img !== 'string') return '';
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  const cleanPath = img.replace(/\\/g, '/');
  if (cleanPath.startsWith('uploads/') || cleanPath.startsWith('/uploads/')) {
    const p = cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath;
    return `${API_URL}${p}`;
  }
  if (cleanPath.startsWith('upload/') || cleanPath.startsWith('/upload/')) {
    const p = cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath;
    return `${API_URL}${p}`;
  }
  return `${API_URL}/uploads/${cleanPath}`;
};

const ViolenceIncidents = () => {
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [stationFilter, setStationFilter] = useState('All');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Details Modal State
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Media Lightbox State
  const [activeMedia, setActiveMedia] = useState(null);

  // Delete Dialog State
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteReport = async () => {
    if (!deleteTargetId) return;
    try {
      setDeleting(true);
      const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
      const headers = token ? { 'auth-token': token } : {};
      await axios.delete(`${API_URL}/ViolenceReport/Delete/${deleteTargetId}`, { headers });
      setReports((prev) => prev.filter((r) => r._id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (err) {
      console.error('Error deleting report:', err);
      setError(err.response?.data?.message || 'Failed to delete report.');
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================
  // FETCH ALL VIOLENCE REPORTS (ADMIN READ-ONLY)
  // ==========================================
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('adminToken');
      const headers = token ? { 'auth-token': token } : {};

      const response = await axios.get(`${API_URL}/ViolenceReport/GetAll`, { headers });
      const reportData = response.data?.reports || [];
      setReports(reportData);
    } catch (err) {
      console.error('Error fetching violence reports:', err);
      setError(
        err.response?.data?.message ||
          'Unable to fetch violence reports. Please ensure the server is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Unique list of police stations for dropdown filter
  const policeStationsList = useMemo(() => {
    const stationsSet = new Set();
    reports.forEach((r) => {
      const name =
        typeof r.policeStationId === 'object'
          ? r.policeStationId?.stationName
          : r.policeStationId;
      if (name) stationsSet.add(name);
    });
    return Array.from(stationsSet);
  }, [reports]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = reports.length;
    const pending = reports.filter((r) => r.status === 'Pending').length;
    const assigned = reports.filter((r) => r.status === 'Assigned' || r.status === 'Dispatched' || r.status === 'Under Review').length;
    const resolved = reports.filter((r) => r.status === 'Resolved').length;
    const urgent = reports.filter(
      (r) => r.severity?.toLowerCase() === 'urgent' || r.severity?.toLowerCase() === 'high'
    ).length;
    return { total, pending, assigned, resolved, urgent };
  }, [reports]);

  // ==========================================
  // FILTER REPORTS
  // ==========================================
  const filteredReports = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return reports.filter((report) => {
      const stationName =
        typeof report.policeStationId === 'object'
          ? report.policeStationId?.stationName
          : report.policeStationId;

      const officerName =
        typeof report.assignedOfficerId === 'object'
          ? report.assignedOfficerId?.officerName
          : report.assignedOfficerId;

      const searchableValues = [
        report.incidentNumber,
        report.category,
        report.severity,
        report.location,
        report.description,
        report.status,
        stationName,
        officerName,
        report.isAnonymous ? 'anonymous' : 'identified',
        report.isInjured ? 'injured' : 'not injured'
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        normalizedSearch === '' || searchableValues.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === 'All' || report.status === statusFilter;

      const matchesSeverity =
        severityFilter === 'All' || report.severity === severityFilter;

      const matchesStation =
        stationFilter === 'All' || stationName === stationFilter;

      return matchesSearch && matchesStatus && matchesSeverity && matchesStation;
    });
  }, [reports, searchTerm, statusFilter, severityFilter, stationFilter]);

  // ==========================================
  // PAGINATION
  // ==========================================
  const paginatedReports = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredReports.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredReports, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, statusFilter, severityFilter, stationFilter]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setSeverityFilter('All');
    setStationFilter('All');
    setPage(0);
  };

  // ==========================================
  // HELPERS
  // ==========================================
  const getStatusChipColor = (status) => {
    switch (status) {
      case 'Resolved':
        return 'success';
      case 'Dispatched':
        return 'info';
      case 'Under Review':
        return 'warning';
      case 'Assigned':
        return 'primary';
      case 'Pending':
        return 'default';
      default:
        return 'default';
    }
  };

  const getSeverityChipColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'med':
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStationName = (report) => {
    if (typeof report.policeStationId === 'object') {
      return report.policeStationId?.stationName || 'Not assigned';
    }
    return report.policeStationId || 'Not assigned';
  };

  const getOfficerName = (report) => {
    if (typeof report.assignedOfficerId === 'object') {
      return report.assignedOfficerId?.officerName
        ? `${report.assignedOfficerId.officerName} (${report.assignedOfficerId.badgeNumber || 'N/A'})`
        : 'Not assigned';
    }
    return report.assignedOfficerId || 'Not assigned';
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openLocation = (report) => {
    if (report.latitude == null || report.longitude == null) return;
    const mapUrl = `https://www.google.com/maps?q=${report.latitude},${report.longitude}`;
    window.open(mapUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenDetails = (report) => {
    setSelectedReport(report);
    setDetailsOpen(true);
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    statusFilter !== 'All' ||
    severityFilter !== 'All' ||
    stationFilter !== 'All';

  return (
    <Box p={{ xs: 2, md: 3 }}>
      {/* HEADER */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -0.5 }}>
            Violence Detected (Admin View)
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Comprehensive overview of all reported violence incidents across all police stations (Read-Only).
          </Typography>
        </Box>

        <Tooltip title="Refresh reports">
          <IconButton color="primary" onClick={fetchReports} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ERROR */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* STATS CARDS */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                TOTAL INCIDENTS
              </Typography>
              <Typography variant="h4" fontWeight={800} mt={0.5}>
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                PENDING
              </Typography>
              <Typography variant="h4" fontWeight={800} color="text.secondary" mt={0.5}>
                {stats.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                ASSIGNED / IN PROGRESS
              </Typography>
              <Typography variant="h4" fontWeight={800} color="primary.main" mt={0.5}>
                {stats.assigned}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                RESOLVED
              </Typography>
              <Typography variant="h4" fontWeight={800} color="success.main" mt={0.5}>
                {stats.resolved}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                URGENT / HIGH
              </Typography>
              <Typography variant="h4" fontWeight={800} color="error.main" mt={0.5}>
                {stats.urgent}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* FILTERS */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          {/* SEARCH */}
          <TextField
            fullWidth
            size="small"
            label="Search reports"
            placeholder="Incident #, category, location, officer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          {/* STATUS */}
          <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 170 } }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="All">All Statuses</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Assigned">Assigned</MenuItem>
              <MenuItem value="Under Review">Under Review</MenuItem>
              <MenuItem value="Dispatched">Dispatched</MenuItem>
              <MenuItem value="Resolved">Resolved</MenuItem>
            </Select>
          </FormControl>

          {/* SEVERITY */}
          <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 150 } }}>
            <InputLabel>Severity</InputLabel>
            <Select
              value={severityFilter}
              label="Severity"
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <MenuItem value="All">All Severities</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="med">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>

          {/* POLICE STATION */}
          <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 180 } }}>
            <InputLabel>Police Station</InputLabel>
            <Select
              value={stationFilter}
              label="Police Station"
              onChange={(e) => setStationFilter(e.target.value)}
            >
              <MenuItem value="All">All Stations</MenuItem>
              {policeStationsList.map((st) => (
                <MenuItem key={st} value={st}>
                  {st}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* CLEAR */}
          <Button
            variant="outlined"
            startIcon={<Clear />}
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
            sx={{ whiteSpace: 'nowrap', minWidth: 140 }}
          >
            Clear Filters
          </Button>
        </Stack>
      </Paper>

      {/* TABLE */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          overflow: 'hidden'
        }}
      >
        <Box
          px={2.5}
          py={2}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          borderBottom="1px solid"
          borderColor="divider"
        >
          <Typography variant="h6" fontWeight={700}>
            Violence Incidents Log
          </Typography>
          <Chip
            label={`${filteredReports.length} report${filteredReports.length === 1 ? '' : 's'}`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader sx={{ minWidth: 1200 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Incident #</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Severity</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Police Station</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Assigned Officer</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status (Read-Only)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reported Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">
                  Action
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      Loading violence reports...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" fontWeight={600} color="text.secondary">
                      No violence reports found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try clearing or adjusting your search filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedReports.map((report) => (
                  <TableRow key={report._id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {report.incidentNumber || `#${report._id?.slice(-6)}`}
                    </TableCell>

                    <TableCell>{report.category || 'N/A'}</TableCell>

                    <TableCell>
                      <Chip
                        label={report.severity || 'Normal'}
                        size="small"
                        color={getSeverityChipColor(report.severity)}
                        sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                      />
                    </TableCell>

                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography variant="body2" noWrap title={report.location}>
                        {report.location || 'N/A'}
                      </Typography>
                      {report.latitude != null && report.longitude != null && (
                        <Button
                          size="small"
                          startIcon={<LocationOn fontSize="small" />}
                          onClick={() => openLocation(report)}
                          sx={{ textTransform: 'none', p: 0, minWidth: 0, fontSize: 12 }}
                        >
                          View Map
                        </Button>
                      )}
                    </TableCell>

                    <TableCell>{getStationName(report)}</TableCell>

                    <TableCell>{getOfficerName(report)}</TableCell>

                    <TableCell>
                      <Chip
                        label={report.status || 'Pending'}
                        size="small"
                        color={getStatusChipColor(report.status)}
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>

                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {formatDate(report.createdAt)}
                    </TableCell>

                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="View full report details">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleOpenDetails(report)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete report">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => setDeleteTargetId(report._id)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredReports.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* DETAIL MODAL DIALOG */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        {selectedReport && (
          <>
            <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  Incident {selectedReport.incidentNumber || `#${selectedReport._id?.slice(-6)}`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Reported on {formatDate(selectedReport.createdAt)}
                </Typography>
              </Box>
              <Chip
                label={selectedReport.status || 'Pending'}
                color={getStatusChipColor(selectedReport.status)}
                sx={{ fontWeight: 700 }}
              />
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ py: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    CATEGORY
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {selectedReport.category || 'N/A'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    SEVERITY
                  </Typography>
                  <Box mt={0.5}>
                    <Chip
                      label={selectedReport.severity || 'Normal'}
                      size="small"
                      color={getSeverityChipColor(selectedReport.severity)}
                      sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    ASSIGNED POLICE STATION
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {getStationName(selectedReport)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    ASSIGNED OFFICER
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {getOfficerName(selectedReport)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    IS INJURED
                  </Typography>
                  <Box mt={0.5}>
                    <Chip
                      label={selectedReport.isInjured ? 'Yes (Medical Help Required)' : 'No'}
                      color={selectedReport.isInjured ? 'error' : 'default'}
                      size="small"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    REPORTER STATUS
                  </Typography>
                  <Box mt={0.5}>
                    <Chip
                      label={selectedReport.isAnonymous ? 'Anonymous User' : 'Identified User'}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    LOCATION
                  </Typography>
                  <Typography variant="body1">{selectedReport.location || 'N/A'}</Typography>
                  {selectedReport.latitude != null && selectedReport.longitude != null && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<LocationOn />}
                      onClick={() => openLocation(selectedReport)}
                      sx={{ mt: 1, textTransform: 'none' }}
                    >
                      Open Google Maps ({selectedReport.latitude}, {selectedReport.longitude})
                    </Button>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    DESCRIPTION
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, mt: 0.5, bgcolor: 'action.hover', borderRadius: 2 }}
                  >
                    <Typography variant="body2">
                      {selectedReport.description || 'No detailed description provided.'}
                    </Typography>
                  </Paper>
                </Grid>

                {/* IMAGES / EVIDENCE */}
                {selectedReport.images && selectedReport.images.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      ATTACHED EVIDENCE / IMAGES ({selectedReport.images.length})
                    </Typography>
                    <Box display="flex" gap={1.5} flexWrap="wrap" mt={1}>
                      {selectedReport.images.map((img, idx) => {
                        const imgUrl = getImageUrl(img);
                        return (
                          <Box
                            key={idx}
                            component="img"
                            src={imgUrl}
                            alt={`Evidence ${idx + 1}`}
                            onClick={() => setActiveMedia(imgUrl)}
                            sx={{
                              width: 100,
                              height: 100,
                              objectFit: 'cover',
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              cursor: 'pointer',
                              transition: 'transform 0.2s',
                              '&:hover': { transform: 'scale(1.05)' }
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button variant="contained" onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* MEDIA LIGHTBOX DIALOG */}
      <Dialog
        open={Boolean(activeMedia)}
        onClose={() => setActiveMedia(null)}
        maxWidth="md"
      >
        <Box p={1} display="flex" justifyContent="center">
          {activeMedia && (
            <img
              src={activeMedia}
              alt="Enlarged evidence"
              style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 8 }}
            />
          )}
        </Box>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>
          Delete Violence Report
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to permanently delete this violence report? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={() => setDeleteTargetId(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDeleteReport} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ViolenceIncidents;
