import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

import {
  CameraAlt,
  CheckCircle,
  FilterAlt,
  LocationOn,
  MapOutlined,
  MyLocation,
  OpenInNew,
  Refresh,
  Search,
  Videocam,
  VideocamOff,
  WarningAmber,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = 'http://localhost:4001/cameras';

const hasValidLocation = (camera) => {
  const latitude = Number(camera?.latitude);
  const longitude = Number(camera?.longitude);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

const buildGoogleMapUrl = (camera) => {
  if (!hasValidLocation(camera)) {
    return null;
  }
  const latitude = Number(camera.latitude);
  const longitude = Number(camera.longitude);

  return `https://maps.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`;
};

const buildGoogleNavigationUrl = (camera) => {
  if (!hasValidLocation(camera)) {
    return '#';
  }
  return `https://www.google.com/maps/search/?api=1&query=${camera.latitude},${camera.longitude}`;
};

const normalizeStatus = (status = '') => status.toLowerCase().trim();

const isActiveCamera = (camera) =>
  normalizeStatus(camera?.status) === 'active';

const Map = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  const colors = {
    pageBg: isLight
      ? 'radial-gradient(circle at 0% 0%, #eef2ff 0%, transparent 45%), linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
      : 'radial-gradient(circle at 0% 0%, #1e293b 0%, transparent 45%), linear-gradient(135deg, #0a192f 0%, #0b1329 100%)',
    cardBg: isLight ? '#ffffff' : '#112240',
    cardHeaderBg: isLight
      ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
      : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    border: isLight ? '#e2e8f0' : '#1e293b',
    inputBg: isLight ? '#f8fafc' : '#0f172a',
    textPrimary: isLight ? '#0f172a' : '#e6f1ff',
    textSecondary: isLight ? '#64748b' : '#8892b0',
    badgeBg: isLight ? '#e0e7ff' : '#1e293b',
    badgeText: isLight ? '#3730a3' : '#818cf8',
  };

  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [mapError, setMapError] = useState('');

  const fetchCameras = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');
      setMapError('');

      const token = localStorage.getItem('adminToken');

      const response = await axios.get(API_URL, {
        headers: {
          'auth-token': token,
        },
      });

      const cameraData = Array.isArray(response.data)
        ? response.data
        : response.data?.cameras || [];

      setCameras(cameraData);

      setSelectedCamera((currentCamera) => {
        if (!cameraData.length) return null;

        const existingCamera = cameraData.find(
          (camera) =>
            (camera._id || camera.id) ===
            (currentCamera?._id || currentCamera?.id)
        );

        if (existingCamera && hasValidLocation(existingCamera)) {
          return existingCamera;
        }

        return (
          cameraData.find((camera) => hasValidLocation(camera)) ||
          cameraData[0]
        );
      });
    } catch (err) {
      console.error('Unable to load cameras for map:', err);
      if (err.response?.status === 401) {
        setError('Your login session has expired. Please log in again.');
      } else {
        setError(
          err.response?.data?.message ||
            'Unable to load camera locations. Please try again.'
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  const filteredCameras = useMemo(() => {
    return cameras.filter((camera) => {
      const searchableText = [
        camera.cameraName,
        camera.address,
        camera.ipAddress,
        camera.status,
        camera.resolution,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = searchableText.includes(
        searchTerm.toLowerCase().trim()
      );

      const matchesStatus =
        statusFilter === 'All' ||
        normalizeStatus(camera.status) === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [cameras, searchTerm, statusFilter]);

  const statistics = useMemo(() => {
    const active = cameras.filter(isActiveCamera).length;
    const inactive = cameras.length - active;
    const mapped = cameras.filter(hasValidLocation).length;

    return {
      total: cameras.length,
      active,
      inactive,
      mapped,
    };
  }, [cameras]);

  const mapUrl = useMemo(
    () => buildGoogleMapUrl(selectedCamera),
    [selectedCamera]
  );

  const handleSelectCamera = (camera) => {
    setSelectedCamera(camera);
    setMapError('');
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleRefresh = () => {
    fetchCameras(true);
  };

  const statCards = [
    {
      title: 'Total Cameras',
      value: statistics.total,
      icon: <CameraAlt />,
      description: 'Registered devices',
      accent: '#2563eb',
      bg: isLight ? '#dbeafe' : 'rgba(37, 99, 235, 0.2)',
    },
    {
      title: 'Active Cameras',
      value: statistics.active,
      icon: <Videocam />,
      description: 'Currently available',
      accent: '#16a34a',
      bg: isLight ? '#dcfce7' : 'rgba(22, 163, 74, 0.2)',
    },
    {
      title: 'Inactive Cameras',
      value: statistics.inactive,
      icon: <VideocamOff />,
      description: 'Require attention',
      accent: '#dc2626',
      bg: isLight ? '#fee2e2' : 'rgba(220, 38, 38, 0.2)',
    },
    {
      title: 'Mapped Cameras',
      value: statistics.mapped,
      icon: <LocationOn />,
      description: 'Valid map locations',
      accent: '#9333ea',
      bg: isLight ? '#f3e8ff' : 'rgba(147, 51, 234, 0.2)',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        p: { xs: 2, md: 3 },
        background: colors.pageBg,
      }}
    >
      {/* Page Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          mb: 3,
          borderRadius: 5,
          color: '#ffffff',
          background:
            'linear-gradient(120deg, #0b1120 0%, #1e3a8a 45%, #2563eb 85%, #3b82f6 100%)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 45px rgba(29, 78, 216, 0.28)',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
          position="relative"
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                width: 60,
                height: 60,
                bgcolor: 'rgba(255,255,255,0.16)',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              <MapOutlined fontSize="large" />
            </Avatar>

            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '-0.5px',
                  lineHeight: 1.2,
                }}
              >
                Surveillance Map View
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                Real-time geographic positioning & camera status monitoring.
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="contained"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            startIcon={
              refreshing ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <Refresh />
              )
            }
            sx={{
              bgcolor: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(8px)',
              color: '#fff',
              borderRadius: 3,
              px: 2.5,
              py: 1,
              fontWeight: 700,
              textTransform: 'none',
              border: '1px solid rgba(255,255,255,0.3)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.28)',
              },
            }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Map'}
          </Button>
        </Stack>
      </Paper>

      {/* KPI Stats */}
      <Grid container spacing={2.5} mb={3}>
        {statCards.map((item) => (
          <Grid item xs={12} sm={6} lg={3} key={item.title}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                borderRadius: 3.5,
                border: `1px solid ${colors.border}`,
                position: 'relative',
                overflow: 'hidden',
                bgcolor: colors.cardBg,
                transition: 'all 0.28s ease',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: item.accent,
                },
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 24px ${item.accent}26`,
                  borderColor: item.accent,
                },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography
                      color="text.secondary"
                      fontWeight={700}
                      variant="body2"
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontSize: '0.72rem',
                      }}
                    >
                      {item.title}
                    </Typography>

                    <Typography
                      variant="h4"
                      fontWeight={800}
                      sx={{ color: colors.textPrimary, mt: 0.5 }}
                    >
                      {item.value}
                    </Typography>

                    <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                      {item.description}
                    </Typography>
                  </Box>

                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      background: item.bg,
                      color: item.accent,
                      border: `1px solid ${item.accent}44`,
                    }}
                  >
                    {item.icon}
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Paper
          elevation={0}
          sx={{
            minHeight: 400,
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${colors.border}`,
            bgcolor: colors.cardBg,
          }}
        >
          <CircularProgress size={44} thickness={4} />
          <Typography mt={2} fontWeight={600} sx={{ color: colors.textPrimary }}>
            Loading camera locations...
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Active Selected Camera Map Card */}
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              borderRadius: 4,
              overflow: 'hidden',
              border: `1px solid ${colors.border}`,
              bgcolor: colors.cardBg,
            }}
          >
            <Box
              sx={{
                p: 2.5,
                background: colors.cardHeaderBg,
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'flex-start', md: 'center' },
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    color: '#fff',
                    width: 46,
                    height: 46,
                  }}
                >
                  <MyLocation />
                </Avatar>

                <Box>
                  <Typography variant="h6" fontWeight={800} sx={{ color: colors.textPrimary }}>
                    {selectedCamera?.cameraName || 'Select a Camera'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedCamera?.address || 'Choose a camera below to view location on map.'}
                  </Typography>
                </Box>
              </Stack>

              {selectedCamera && hasValidLocation(selectedCamera) && (
                <Button
                  variant="contained"
                  startIcon={<OpenInNew />}
                  component="a"
                  href={buildGoogleNavigationUrl(selectedCamera)}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    borderRadius: 2.5,
                    textTransform: 'none',
                    fontWeight: 700,
                  }}
                >
                  Open in Google Maps
                </Button>
              )}
            </Box>

            <Divider />

            <Box
              sx={{
                minHeight: 480,
                bgcolor: 'action.hover',
                position: 'relative',
              }}
            >
              {mapError ? (
                <Box
                  minHeight={480}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  p={3}
                >
                  <Alert severity="error">{mapError}</Alert>
                </Box>
              ) : mapUrl ? (
                <iframe
                  key={mapUrl}
                  title={selectedCamera?.cameraName || 'Camera location map'}
                  src={mapUrl}
                  width="100%"
                  height="480"
                  style={{ border: 0, display: 'block' }}
                  allowFullScreen
                  loading="lazy"
                />
              ) : (
                <Box
                  minHeight={480}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  textAlign="center"
                  p={3}
                >
                  <LocationOn sx={{ fontSize: 64, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="h6" fontWeight={700} sx={{ color: colors.textPrimary }}>
                    Location not available
                  </Typography>
                  <Typography color="text.secondary" mt={0.5}>
                    This camera does not have valid GPS coordinates.
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Search & Filter Controls */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3,
              borderRadius: 3.5,
              border: `1px solid ${colors.border}`,
              bgcolor: colors.cardBg,
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by camera name, address, IP address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Camera Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FilterAlt />
                      </InputAdornment>
                    ),
                  }}
                >
                  <MenuItem value="All">All Cameras</MenuItem>
                  <MenuItem value="Active">Active Cameras</MenuItem>
                  <MenuItem value="Inactive">Inactive Cameras</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Paper>

          {/* Registered Cameras Grid */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={1}
            mb={2.5}
          >
            <Box>
              <Typography variant="h5" fontWeight={800} sx={{ color: colors.textPrimary }}>
                Registered Cameras
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select any camera card to focus its coordinates on the live map.
              </Typography>
            </Box>

            <Chip
              label={`${filteredCameras.length} camera${filteredCameras.length !== 1 ? 's' : ''}`}
              sx={{
                fontWeight: 700,
                bgcolor: colors.badgeBg,
                color: colors.badgeText,
              }}
            />
          </Stack>

          {filteredCameras.length === 0 ? (
            <Alert severity="warning" sx={{ borderRadius: 2.5 }}>
              No cameras match your current search or status filter.
            </Alert>
          ) : (
            <Box
  sx={{
    display: 'grid',
    gridTemplateColumns: {
      xs: '1fr',
      sm: 'repeat(2, 1fr)',
      md: 'repeat(3, 1fr)',
    },
    gap: 2.5,
  }}
>
  {filteredCameras.map((camera) => {
    const cameraId = camera._id || camera.id;
    const selectedCameraId = selectedCamera?._id || selectedCamera?.id;
    const isSelected = cameraId === selectedCameraId;
    const isActive = isActiveCamera(camera);

    return (
      <Card
        key={cameraId}
        elevation={0}
        onClick={() => handleSelectCamera(camera)}
        sx={{
          width: '100%',
          height: 220, // fixed height — every card matches exactly
          cursor: 'pointer',
          borderRadius: 3.5,
          position: 'relative',
          overflow: 'hidden',
          bgcolor: colors.cardBg,
          border: isSelected
            ? '2px solid #2563eb'
            : `1px solid ${colors.border}`,
          transition: 'all 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            background: isActive
              ? 'linear-gradient(90deg, #16a34a, #4ade80)'
              : 'linear-gradient(90deg, #dc2626, #f87171)',
          },
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
            borderColor: '#2563eb',
          },
        }}
      >
        <CardContent
          sx={{
            p: 2.5,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 0, // lets children shrink instead of overflowing
            '&:last-child': { pb: 2.5 },
          }}
        >
          <Box sx={{ minHeight: 0 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography
                variant="h6"
                fontWeight={800}
                noWrap
                sx={{ color: colors.textPrimary, flex: 1, mr: 1 }}
              >
                {camera.cameraName}
              </Typography>
              <Chip
                label={camera.status || 'Active'}
                color={isActive ? 'success' : 'error'}
                size="small"
                sx={{ fontWeight: 700, flexShrink: 0 }}
              />
            </Box>

            <Divider sx={{ mb: 1.5 }} />

            <Box display="flex" alignItems="flex-start" gap={1} sx={{ height: 40 }}>
              <LocationOn color="action" fontSize="small" sx={{ mt: 0.2, flexShrink: 0 }} />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {camera.address || 'Address not configured'}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center" mt={1.5}>
            <Typography variant="caption" color="text.secondary" noWrap>
              IP: <strong>{camera.ipAddress || '—'}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              Res: <strong>{camera.resolution || '1080p'}</strong>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  })}
</Box>
          )}
        </>
      )}
    </Box>
  );
};

export default Map;