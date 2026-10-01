import React, { useEffect, useState } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Delete, VideocamOutlined, ImageOutlined } from '@mui/icons-material';
import axios from 'axios';
import socket from '../lib/socket';

// -- Design tokens -----------------------------------------------------
// Two token sets - one per mode - so the alert feed follows whatever
// theme.palette.mode the app is already running in, instead of forcing
// its own light or dark look.
const lightTokens = {
  bg: '#F5F7F8',
  surface: '#FFFFFF',
  surfaceHover: '#F0F3F5',
  border: '#DEE3E7',
  textPrimary: '#161F27',
  textSecondary: '#54636F',
  textFaint: '#8B99A3',
  critical: '#D93A32',
  high: '#B96A00',
  medium: '#0C7DA6',
  resolved: '#1B8F5E',
};

const darkTokens = {
  bg: '#0B0F13',
  surface: '#141B21',
  surfaceHover: '#182029',
  border: '#232D36',
  textPrimary: '#EDF2F4',
  textSecondary: '#8CA0AC',
  textFaint: '#5C6C77',
  critical: '#FF5A52',
  high: '#FFA53E',
  medium: '#4FC3E8',
  resolved: '#3FBF83',
};

const getPriorityStyle = (colors, priority) => {
  const styles = {
    Critical: { color: colors.critical, label: 'Critical' },
    High: { color: colors.high, label: 'High' },
    Medium: { color: colors.medium, label: 'Medium' },
    Low: { color: colors.textSecondary, label: 'Low' },
  };
  return styles[priority] || styles.High;
};

const formatConfidence = (confidence) => {
  if (confidence == null || Number.isNaN(Number(confidence))) return null;
  const value = Number(confidence);
  const pct = value <= 1 ? value * 100 : value;
  return `${Math.round(pct)}%`;
};

const formatTime = (timestamp) => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// A small "label: value" unit used throughout the meta row. Kept as a
// single reusable primitive so every alert reads the same way.
const MetaItem = ({ label, children, colors }) => {
  if (!children) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
      <Typography
        sx={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '10.5px',
          letterSpacing: '0.04em',
          color: colors.textFaint,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '12.5px',
          color: colors.textSecondary,
        }}
      >
        {children}
      </Typography>
    </Box>
  );
};

const Divider = ({ colors }) => (
  <Box sx={{ width: '1px', height: '12px', background: colors.border }} />
);

const Alerts = () => {
  const theme = useTheme();
  const colors = theme.palette.mode === 'dark' ? darkTokens : lightTokens;

  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
    axios
      .get('http://localhost:4001/alerts', { headers: { 'auth-token': token } })
      .then((res) => setAlerts(res.data || []))
      .catch(() => {});

    socket.connect();
    socket.on('alert:created', (payload) => setAlerts((prev) => [payload.alert, ...prev]));
    return () => socket.disconnect();
  }, []);

  const handleDeleteAlert = async (id) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) return;
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
      await axios.delete(`http://localhost:4001/alerts/${id}`, { headers: { 'auth-token': token } });
      setAlerts((prev) => prev.filter((a) => (a._id || a.id) !== id));
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  const activeCount = alerts.filter((a) => (a.status || 'Active') === 'Active').length;

  return (
    <Box sx={{ background: colors.bg, minHeight: '100%', p: { xs: 2, md: 4 } }}>
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.85); }
        }
      `}</style>

      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography
            sx={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontWeight: 600,
              fontSize: '22px',
              color: colors.textPrimary,
              letterSpacing: '-0.01em',
            }}
          >
            Emergency Alerts
          </Typography>
          <Typography sx={{ color: colors.textSecondary, fontSize: '13px', mt: 0.5 }}>
            {activeCount > 0
              ? `${activeCount} alert${activeCount === 1 ? '' : 's'} requiring attention`
              : 'All alerts cleared'}
          </Typography>
        </Box>

        {activeCount > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: colors.critical,
                animation: 'pulse-dot 1.6s ease-in-out infinite',
              }}
            />
            <Typography
              sx={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '12px',
                color: colors.critical,
              }}
            >
              LIVE
            </Typography>
          </Box>
        )}
      </Box>

      {alerts.length === 0 ? (
        <Box
          sx={{
            border: `1px dashed ${colors.border}`,
            borderRadius: '6px',
            p: 5,
            textAlign: 'center',
          }}
        >
          <Typography sx={{ color: colors.textPrimary, fontSize: '15px', mb: 0.5 }}>
            No active alerts
          </Typography>
          <Typography sx={{ color: colors.textFaint, fontSize: '13px' }}>
            New detections will appear here in real time.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {alerts.map((alertItem) => {
            const camera = alertItem.incidentId?.cameraId || {};
            const incident = alertItem.incidentId || {};
            const alertId = alertItem._id || alertItem.id;
            const priority = getPriorityStyle(colors, alertItem.priority || alertItem.severity);
            const status = alertItem.status || 'Active';
            const isActive = status === 'Active';
            const confidence = formatConfidence(incident.confidence);
            const time = formatTime(incident.timestamp);

            return (
              <Box
                key={alertId}
                sx={{
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderLeft: `3px solid ${priority.color}`,
                  borderRadius: '4px',
                  px: 2.5,
                  py: 2,
                  transition: 'background 0.15s ease',
                  '&:hover': { background: colors.surfaceHover },
                }}
              >
                {/* Header row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
                  {isActive && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: priority.color,
                        animation: 'pulse-dot 1.6s ease-in-out infinite',
                        flexShrink: 0,
                      }}
                    />
                  )}

                  <Typography
                    sx={{
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontWeight: 600,
                      fontSize: '14.5px',
                      color: colors.textPrimary,
                      flexGrow: 1,
                    }}
                  >
                    {alertItem.message}
                  </Typography>

                  <Typography
                    sx={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '11px',
                      fontWeight: 600,
                      color: priority.color,
                      letterSpacing: '0.03em',
                    }}
                  >
                    {priority.label}
                  </Typography>

                  {time && (
                    <Typography
                      sx={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '11.5px',
                        color: colors.textFaint,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {time}
                    </Typography>
                  )}

                  <Tooltip title="Delete alert">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteAlert(alertId)}
                      sx={{
                        color: colors.textFaint,
                        '&:hover': {
                          color: colors.critical,
                          background:
                            theme.palette.mode === 'dark'
                              ? 'rgba(255,90,82,0.08)'
                              : 'rgba(217,58,50,0.08)',
                        },
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Meta row */}
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.25, mb: alertItem.evidenceImageUrl || alertItem.evidenceVideoUrl || alertItem.notifiedStations?.length ? 1 : 0 }}>
                  <MetaItem label="STATUS" colors={colors}>{status}</MetaItem>
                  <Divider colors={colors} />
                  <MetaItem label="TYPE" colors={colors}>{incident.detectionType || incident.type || 'Unknown'}</MetaItem>
                  <Divider colors={colors} />
                  <MetaItem label="CAMERA" colors={colors}>{camera.cameraName || incident.cameraName || 'Unknown'}</MetaItem>
                  <Divider colors={colors} />
                  <MetaItem label="LOCATION" colors={colors}>{incident.address || camera.address || 'Unknown'}</MetaItem>
                  {confidence && (
                    <>
                      <Divider colors={colors} />
                      <MetaItem label="CONFIDENCE" colors={colors}>{confidence}</MetaItem>
                    </>
                  )}
                </Box>

                {/* Evidence + stations */}
                {(alertItem.evidenceImageUrl || alertItem.evidenceVideoUrl || alertItem.notifiedStations?.length > 0) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, pt: 1, borderTop: `1px solid ${colors.border}` }}>
                    {alertItem.evidenceImageUrl && (
                      <Box
                        component="a"
                        href={alertItem.evidenceImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          fontSize: '12px',
                          color: colors.medium,
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        <ImageOutlined sx={{ fontSize: 14 }} />
                        Image evidence
                      </Box>
                    )}

                    {alertItem.evidenceVideoUrl && (
                      <Box
                        component="a"
                        href={alertItem.evidenceVideoUrl}
                        target="_blank"
                        rel="noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          fontSize: '12px',
                          color: colors.medium,
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        <VideocamOutlined sx={{ fontSize: 14 }} />
                        Video evidence
                      </Box>
                    )}

                    {alertItem.notifiedStations?.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                        <Typography sx={{ fontSize: '11.5px', color: colors.textFaint }}>
                          Notified:
                        </Typography>
                        {alertItem.notifiedStations.map((station, idx) => (
                          <Box
                            key={station._id || station.stationName || idx}
                            sx={{
                              fontSize: '11px',
                              color: colors.textSecondary,
                              border: `1px solid ${colors.border}`,
                              borderRadius: '3px',
                              px: 0.75,
                              py: 0.15,
                            }}
                          >
                            {station.stationName}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default Alerts;