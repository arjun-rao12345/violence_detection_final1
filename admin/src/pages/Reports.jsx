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
  Typography,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

import {
  Search,
  FilterAltOff,
  Delete,
  Refresh,
  Visibility,
  LocationOn,
  ReportProblem,
  Videocam,
  CheckCircle,
  HourglassEmpty,
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

const Reports = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
  const colors = {
    cardBg: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(17, 34, 64, 0.85)',
    border: isLight ? '#e2e8f0' : '#1e293b',
    textPrimary: isLight ? '#0f172a' : '#f8fafc',
    textSecondary: isLight ? '#64748b' : '#94a3b8',
    tableHeaderBg: isLight ? '#f8fafc' : '#0f172a',
  };

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters state
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
useEffect(() => {
  if (fromDate && toDate && toDate < fromDate) {
    setToDate(fromDate);
  }
}, [fromDate]);
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Detail Modal & Lightbox state
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeMedia, setActiveMedia] = useState(null);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);
// Replace the two onChange handlers with these:
const handleFromDateChange = (e) => {
  const value = e.target.value;
  if (value && value > today) return; // block future dates outright
  setFromDate(value);
  if (toDate && value && toDate < value) {
    setToDate(value); // pull toDate up if it's now before fromDate
  }
};

const handleToDateChange = (e) => {
  const value = e.target.value;
  if (value && value > today) return; // block future dates outright
  if (fromDate && value && value < fromDate) return; // block dates before fromDate
  setToDate(value);
};
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
      const headers = token ? { 'auth-token': token } : {};

      const [incidentsRes, violenceReportsRes] = await Promise.allSettled([
        axios.get(`${API_URL}/incidents`, { headers }),
        axios.get(`${API_URL}/ViolenceReport/GetAll`, { headers })
      ]);

      let allReports = [];

      // Format AI Surveillance Incidents
      if (incidentsRes.status === 'fulfilled') {
        const data = incidentsRes.value.data;
        const incidentList = Array.isArray(data) ? data : data?.incidents || [];
        const formattedIncidents = incidentList.map((item) => ({
          _id: item._id,
          reportSource: 'AI Surveillance',
          incidentNumber: `AI-${item._id?.slice(-6)?.toUpperCase()}`,
          category: item.type || item.category || 'AI Incident',
          severity: item.severity || 'high',
          location: item.address || item.location?.address || item.location || 'N/A',
          latitude: item.latitude,
          longitude: item.longitude,
          cameraName: item.cameraName || item.cameraId?.cameraName || 'Surveillance Cam',
          assignedOfficer: item.assignedOfficerId?.officerName || 'System Monitored',
          stationName: 'Command Center',
          status: item.status || 'Pending',
          responseStatus: item.responseStatus || 'Pending',
          description: item.description || `AI detected ${item.type || 'suspicious activity'}`,
          createdAt: item.timestamp || item.createdAt,
          images: item.evidenceImage ? [item.evidenceImage] : [],
          rawItem: item,
        }));
        allReports.push(...formattedIncidents);
      }

      // Format Public Violence Reports
      if (violenceReportsRes.status === 'fulfilled') {
        const data = violenceReportsRes.value.data;
        const reportList = Array.isArray(data) ? data : data?.reports || [];
        const formattedReports = reportList.map((item) => ({
          _id: item._id,
          reportSource: 'Public Report',
          incidentNumber: item.incidentNumber || `VR-${item._id?.slice(-6)?.toUpperCase()}`,
          category: item.category || 'Violence Incident',
          severity: item.severity || 'high',
          location: item.location || 'N/A',
          latitude: item.latitude,
          longitude: item.longitude,
          cameraName: 'Public Mobile App',
          assignedOfficer: item.assignedOfficerId?.officerName
            ? `${item.assignedOfficerId.officerName} (${item.assignedOfficerId.badgeNumber || 'N/A'})`
            : 'Unassigned',
          stationName: item.policeStationId?.stationName || 'Unassigned Station',
          status: item.status || 'Pending',
          responseStatus: item.status || 'Pending',
          description: item.description || 'Public violence report submitted',
          createdAt: item.createdAt,
          images: item.images || [],
          isAnonymous: item.isAnonymous,
          isInjured: item.isInjured,
          rawItem: item,
        }));
        allReports.push(...formattedReports);
      }

      // Sort newest first
      allReports.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

      setReports(allReports);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setError(
        err.response?.data?.message || 'Unable to load incident reports. Ensure server is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Categories list for dropdown
  const categoriesList = useMemo(() => {
    const setList = new Set();
    reports.forEach((r) => {
      if (r.category) setList.add(r.category);
    });
    return Array.from(setList);
  }, [reports]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = reports.length;
    const publicCount = reports.filter((r) => r.reportSource === 'Public Report').length;
    const aiCount = reports.filter((r) => r.reportSource === 'AI Surveillance').length;
    const resolved = reports.filter((r) => r.status === 'Resolved').length;
    const active = total - resolved;
    return { total, publicCount, aiCount, resolved, active };
  }, [reports]);

  // Filtering logic including Date Range
  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      const searchText = search.trim().toLowerCase();

      const searchableString = [
        item.incidentNumber,
        item.category,
        item.severity,
        item.location,
        item.cameraName,
        item.assignedOfficer,
        item.stationName,
        item.description,
        item.status,
        item.reportSource,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !searchText || searchableString.includes(searchText);

      const matchesSource =
        sourceFilter === 'All' || item.reportSource === sourceFilter;

      const matchesCategory =
        categoryFilter === 'All' || item.category === categoryFilter;

      const matchesStatus =
        statusFilter === 'All' || item.status === statusFilter;

      // Date Range Filter (fromDate to toDate)
      let matchesFromDate = true;
      let matchesToDate = true;

      if (item.createdAt) {
        const itemDate = new Date(item.createdAt);

        if (fromDate) {
          const selectedFrom = new Date(fromDate);
          selectedFrom.setHours(0, 0, 0, 0);
          matchesFromDate = itemDate >= selectedFrom;
        }

        if (toDate) {
          const selectedTo = new Date(toDate);
          selectedTo.setHours(23, 59, 59, 999);
          matchesToDate = itemDate <= selectedTo;
        }
      } else if (fromDate || toDate) {
        matchesFromDate = false;
        matchesToDate = false;
      }

      return (
        matchesSearch &&
        matchesSource &&
        matchesCategory &&
        matchesStatus &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [reports, search, sourceFilter, categoryFilter, statusFilter, fromDate, toDate]);

  // Paginated list
  const paginatedReports = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredReports.slice(start, start + rowsPerPage);
  }, [filteredReports, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [search, sourceFilter, categoryFilter, statusFilter, fromDate, toDate]);

  const resetFilters = () => {
    setSearch('');
    setSourceFilter('All');
    setCategoryFilter('All');
    setStatusFilter('All');
    setFromDate('');
    setToDate('');
    setPage(0);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
      const headers = token ? { 'auth-token': token } : {};

      if (deleteTarget.reportSource === 'Public Report' || deleteTarget.incidentNumber?.startsWith('VR')) {
        await axios.delete(`${API_URL}/ViolenceReport/Delete/${deleteTarget._id}`, { headers });
      } else {
        await axios.delete(`${API_URL}/incidents/${deleteTarget._id}`, { headers });
      }

      setReports((prev) => prev.filter((r) => r._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete failed:', err);
      setError(err.response?.data?.message || 'Delete operation failed.');
    } finally {
      setDeleting(false);
    }
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
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'dispatched':
      case 'under review':
      case 'assigned':
        return 'info';
      default:
        return 'default';
    }
  };

  const getSeverityColor = (severity) => {
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

  const openGoogleMaps = (item) => {
    if (item.latitude == null || item.longitude == null) return;
    window.open(
      `https://www.google.com/maps?q=${item.latitude},${item.longitude}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const hasActiveFilters =
    search !== '' ||
    sourceFilter !== 'All' ||
    categoryFilter !== 'All' ||
    statusFilter !== 'All' ||
    fromDate !== '' ||
    toDate !== '';

  return (
    <Box p={{ xs: 2, md: 3 }}>
      {/* Page Title */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -0.5, color: colors.textPrimary }}>
            Incident & Violence Reports
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Comprehensive overview & date range filtering of all public reports and AI surveillance detections.
          </Typography>
        </Box>

        <Tooltip title="Refresh Reports">
          <IconButton color="primary" onClick={fetchReports} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Summary KPI Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: 3,
              bgcolor: colors.cardBg,
              border: `1px solid ${colors.border}`,
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              TOTAL REPORTS
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ color: colors.textPrimary, mt: 0.5 }}>
              {stats.total}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: 3,
              bgcolor: colors.cardBg,
              border: `1px solid ${colors.border}`,
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              PUBLIC VIOLENCE
            </Typography>
            <Typography variant="h4" fontWeight={800} color="warning.main" mt={0.5}>
              {stats.publicCount}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: 3,
              bgcolor: colors.cardBg,
              border: `1px solid ${colors.border}`,
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              AI SURVEILLANCE
            </Typography>
            <Typography variant="h4" fontWeight={800} color="primary.main" mt={0.5}>
              {stats.aiCount}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: 3,
              bgcolor: colors.cardBg,
              border: `1px solid ${colors.border}`,
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              RESOLVED
            </Typography>
            <Typography variant="h4" fontWeight={800} color="success.main" mt={0.5}>
              {stats.resolved}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: 3,
              bgcolor: colors.cardBg,
              border: `1px solid ${colors.border}`,
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              ACTIVE / PENDING
            </Typography>
            <Typography variant="h4" fontWeight={800} color="error.main" mt={0.5}>
              {stats.active}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Control Box */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3,
          bgcolor: colors.cardBg,
          border: `1px solid ${colors.border}`,
        }}
      >
        <Stack spacing={2}>
          {/* Row 1: Search, Source, Category, Status */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <TextField
              fullWidth
              size="small"
              label="Search all reports"
              placeholder="Incident #, location, camera, officer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 170 } }}>
              <InputLabel>Report Source</InputLabel>
              <Select
                value={sourceFilter}
                label="Report Source"
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <MenuItem value="All">All Sources</MenuItem>
                <MenuItem value="Public Report">Public Reports</MenuItem>
                <MenuItem value="AI Surveillance">AI Surveillance</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 160 } }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="All">All Categories</MenuItem>
                {categoriesList.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 150 } }}>
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
          </Stack>

          {/* Row 2: Date Range Filter (From Date to To Date) + Reset */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <Box sx={{ width: '100%' }}>
              <Typography
                variant="caption"
                fontWeight={600}
                color="text.secondary"
                sx={{ display: 'block', mb: 0.5 }}
              >
                From Date
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="date"
                value={fromDate}
                onChange={handleFromDateChange}
                inputProps={{ max: today }}
              />
            </Box>

            <Box sx={{ width: '100%' }}>
              <Typography
                variant="caption"
                fontWeight={600}
                color="text.secondary"
                sx={{ display: 'block', mb: 0.5 }}
              >
                To Date
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="date"
                value={toDate}
                onChange={handleToDateChange}
                inputProps={{ min: fromDate || undefined, max: today }}
              />
            </Box>

            <Button
              variant="outlined"
              color="inherit"
              startIcon={<FilterAltOff />}
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              sx={{ whiteSpace: 'nowrap', minWidth: 150, height: 40 }}
            >
              Reset Filters
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Main Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          bgcolor: colors.cardBg,
          border: `1px solid ${colors.border}`,
          overflow: 'hidden',
        }}
      >
        <Box
          px={2.5}
          py={2}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          borderBottom={`1px solid ${colors.border}`}
        >
          <Typography variant="h6" fontWeight={700} sx={{ color: colors.textPrimary }}>
            Incident & Violence Reports Log
          </Typography>
          <Chip
            label={`${filteredReports.length} report${filteredReports.length === 1 ? '' : 's'}`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader sx={{ minWidth: 1100 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: colors.tableHeaderBg }}>
                <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Incident #</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Category / Severity</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Station / Officer / Cam</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reported Date</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      Loading incident reports...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" fontWeight={600} color="text.secondary">
                      No reports match your filters
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                      Try clearing search terms or date range filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedReports.map((item) => (
                  <TableRow key={item._id} hover>
                    <TableCell>
                      <Chip
                        icon={item.reportSource === 'AI Surveillance' ? <Videocam fontSize="small" /> : <ReportProblem fontSize="small" />}
                        label={item.reportSource}
                        size="small"
                        color={item.reportSource === 'AI Surveillance' ? 'primary' : 'warning'}
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>{item.incidentNumber}</TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {item.category}
                      </Typography>
                      <Chip
                        label={item.severity}
                        size="small"
                        color={getSeverityColor(item.severity)}
                        sx={{ textTransform: 'capitalize', mt: 0.3, fontSize: 11, height: 20 }}
                      />
                    </TableCell>

                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography variant="body2" noWrap title={item.location}>
                        {item.location}
                      </Typography>
                      {item.latitude != null && item.longitude != null && (
                        <Button
                          size="small"
                          startIcon={<LocationOn fontSize="small" />}
                          onClick={() => openGoogleMaps(item)}
                          sx={{ textTransform: 'none', p: 0, fontSize: 12, minWidth: 0 }}
                        >
                          View Map
                        </Button>
                      )}
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {item.stationName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {item.reportSource === 'AI Surveillance' ? item.cameraName : item.assignedOfficer}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={item.status}
                        size="small"
                        color={getStatusColor(item.status)}
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>

                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(item.createdAt)}</TableCell>

                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="View full report details">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => {
                              setSelectedItem(item);
                              setDetailsOpen(true);
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete report">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Delete fontSize="small" />
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
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
        />
      </Paper>

      {/* Details Modal */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1, bgcolor: colors.cardBg } }}
      >
        {selectedItem && (
          <>
            <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  {selectedItem.incidentNumber} - {selectedItem.category}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Source: {selectedItem.reportSource} • Date: {formatDate(selectedItem.createdAt)}
                </Typography>
              </Box>
              <Chip
                label={selectedItem.status}
                color={getStatusColor(selectedItem.status)}
                sx={{ fontWeight: 700 }}
              />
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ py: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    CATEGORY & SEVERITY
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {selectedItem.category} ({selectedItem.severity})
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    ASSIGNED STATION / OFFICER
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedItem.stationName} — {selectedItem.assignedOfficer}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    LOCATION
                  </Typography>
                  <Typography variant="body1">{selectedItem.location}</Typography>
                  {selectedItem.latitude != null && selectedItem.longitude != null && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<LocationOn />}
                      onClick={() => openGoogleMaps(selectedItem)}
                      sx={{ mt: 1, textTransform: 'none' }}
                    >
                      Open in Google Maps ({selectedItem.latitude}, {selectedItem.longitude})
                    </Button>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    DESCRIPTION
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 0.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                    <Typography variant="body2">{selectedItem.description}</Typography>
                  </Paper>
                </Grid>

                {selectedItem.images && selectedItem.images.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      EVIDENCE ATTACHMENTS ({selectedItem.images.length})
                    </Typography>
                    <Box display="flex" gap={1.5} flexWrap="wrap" mt={1}>
                      {selectedItem.images.map((img, idx) => {
                        const imgUrl = getImageUrl(img);
                        return (
                          <Box
                            key={idx}
                            component="img"
                            src={imgUrl}
                            alt={`Evidence ${idx + 1}`}
                            onClick={() => setActiveMedia(imgUrl)}
                            sx={{
                              width: 110,
                              height: 110,
                              objectFit: 'cover',
                              borderRadius: 2,
                              border: `1px solid ${colors.border}`,
                              cursor: 'pointer',
                              transition: 'transform 0.2s',
                              '&:hover': { transform: 'scale(1.05)' },
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

      {/* Lightbox Dialog */}
      <Dialog open={Boolean(activeMedia)} onClose={() => setActiveMedia(null)} maxWidth="md">
        <Box p={1} display="flex" justifyContent="center">
          {activeMedia && (
            <img
              src={activeMedia}
              alt="Enlarged Evidence"
              style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 8 }}
            />
          )}
        </Box>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>
          Delete Report
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this report ({deleteTarget?.incidentNumber})? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reports;