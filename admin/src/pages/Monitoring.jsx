import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Chip, Alert } from '@mui/material';
import { useTheme, alpha, keyframes } from '@mui/material/styles';
import {
  Videocam,
  Warning,
  AccessTime,
  Speed,
  Email,
  FiberManualRecord,
  Shield
} from '@mui/icons-material';
import axios from 'axios';
import socket from '../lib/socket';

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.55); }
  70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
`;

const Monitoring = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const colors = {
    textPrimary: theme.palette.text.primary,
    textSecondary: theme.palette.text.secondary,
    accent: theme.palette.primary.main,
    cardBg: theme.palette.background.paper,
    cardBorder: theme.palette.divider,
    cardShadow: isDark
      ? '0 8px 32px rgba(0,0,0,0.3)'
      : '0 8px 32px rgba(15,23,42,0.08)',
    cardShadowHover: isDark
      ? '0 16px 35px rgba(0,0,0,0.4)'
      : '0 16px 35px rgba(15,23,42,0.14)',
    monoBg: isDark ? alpha('#000000', 0.35) : alpha(theme.palette.text.primary, 0.04)
  };

  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    axios.get('http://localhost:4001/incidents', { headers: { 'auth-token': token } }).then((res) => setEvents(res.data || [])).catch(() => {});

    socket.connect();
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('detection:prediction', handleEvent);
    socket.on('violence:detected', handleEvent);
    socket.on('incident:created', handleEvent);
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('detection:prediction', handleEvent);
      socket.off('violence:detected', handleEvent);
      socket.off('incident:created', handleEvent);
      socket.disconnect();
    };
  }, []);

  const handleEvent = (payload) => {
    setEvents(prev => [{ ...payload, timestamp: payload.timestamp || new Date().toISOString() }, ...prev].slice(0, 8));
  };

  const getSeverityColor = (isCritical) => (isCritical ? '#ef4444' : colors.accent);

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={1}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Shield sx={{ color: colors.accent, fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700} color={colors.textPrimary}>
            Real-Time Threat Monitoring
          </Typography>
        </Box>

        <Chip
          icon={
            <FiberManualRecord
              sx={{
                fontSize: 12,
                color: connected ? '#22c55e' : '#94a3b8',
                animation: connected ? `${pulse} 1.8s infinite` : 'none'
              }}
            />
          }
          label={connected ? 'LIVE FEED CONNECTED' : 'CONNECTING…'}
          sx={{
            fontFamily: 'monospace',
            fontWeight: 700,
            letterSpacing: 0.5,
            color: connected ? '#22c55e' : colors.textSecondary,
            backgroundColor: connected ? alpha('#22c55e', 0.12) : alpha(colors.textSecondary, 0.12),
            border: `1px solid ${connected ? alpha('#22c55e', 0.35) : theme.palette.divider}`
          }}
        />
      </Box>

      <Typography variant="body2" color={colors.textSecondary} mb={3}>
        Streaming detections from all active camera feeds. Showing the most recent {events.length ? Math.min(events.length, 8) : 0} events.
      </Typography>

      <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
        Live threat feed is active and updates from the backend detection process.
      </Alert>

      {events.length === 0 ? (
        <Box
          sx={{
            border: `1px dashed ${colors.cardBorder}`,
            borderRadius: 3,
            py: 6,
            textAlign: 'center',
            color: colors.textSecondary
          }}
        >
          <Videocam sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
          <Typography variant="body1">Waiting for detection events…</Typography>
          <Typography variant="caption">Nothing to show yet — feed will populate automatically.</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)'
            },
            gap: 3
          }}
        >
          {events.map((event, index) => {
            const isCritical = event.label === 'Violence' || event.type === 'violence';
            const severityColor = getSeverityColor(isCritical);

            return (
              <Box key={index} sx={{ display: 'flex', height: 360 }}>
                <Card
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: colors.cardBg,
                    border: `1px solid ${colors.cardBorder}`,
                    borderTop: `4px solid ${severityColor}`,
                    borderRadius: 3,
                    boxShadow: colors.cardShadow,
                    overflow: 'hidden',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: colors.cardShadowHover,
                      borderColor: alpha(severityColor, 0.5)
                    }
                  }}
                >
                  <CardContent
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      p: 2.5,
                      '&:last-child': { pb: 2.5 }
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1.5} mb={2}>
                      <Box display="flex" alignItems="flex-start" gap={1.2} minWidth={0}>
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            backgroundColor: alpha(severityColor, 0.12),
                            border: `1px solid ${alpha(severityColor, 0.3)}`
                          }}
                        >
                          <Videocam sx={{ color: severityColor, fontSize: 20 }} />
                        </Box>

                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          color={colors.textPrimary}
                          sx={{
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: 1.3
                          }}
                        >
                          {event.cameraName || event.cameraId || 'Camera'}
                        </Typography>
                      </Box>

                      <Chip
                        icon={isCritical ? <Warning sx={{ fontSize: 16 }} /> : undefined}
                        label={event.label || event.type || 'Threat'}
                        color={isCritical ? 'error' : 'info'}
                        size="small"
                        sx={{ flexShrink: 0, fontWeight: 600 }}
                      />
                    </Box>

                    <Box
                      sx={{
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.2,
                        overflow: 'hidden'
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <Speed sx={{ fontSize: 16, color: colors.textSecondary, flexShrink: 0 }} />
                        <Typography variant="caption" color={colors.textSecondary} sx={{ flexShrink: 0 }}>
                          Confidence
                        </Typography>
                        <Box
                          sx={{
                            ml: 'auto',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            px: 1,
                            py: 0.2,
                            borderRadius: 1,
                            backgroundColor: colors.monoBg,
                            color: colors.textPrimary
                          }}
                        >
                          {event.confidence ? `${(event.confidence * 100).toFixed(1)}%` : 'N/A'}
                        </Box>
                      </Box>

                      <Box display="flex" alignItems="center" gap={1}>
                        <AccessTime sx={{ fontSize: 16, color: colors.textSecondary, flexShrink: 0 }} />
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: 'monospace',
                            color: colors.textSecondary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'Pending'}
                        </Typography>
                      </Box>

                      <Box display="flex" alignItems="center" gap={1}>
                        <FiberManualRecord sx={{ fontSize: 10, color: severityColor, flexShrink: 0 }} />
                        <Typography variant="caption" fontWeight={600} color={severityColor}>
                          {isCritical ? 'CRITICAL — Response required' : 'Monitoring'}
                        </Typography>
                      </Box>

                      {event.alertRecipient ? (
                        <Box
                          sx={{
                            mt: 'auto',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1,
                            pt: 1.2,
                            borderTop: `1px solid ${colors.cardBorder}`
                          }}
                        >
                          <Email sx={{ fontSize: 16, color: colors.textSecondary, flexShrink: 0, mt: 0.2 }} />
                          <Typography
                            variant="caption"
                            color={colors.textSecondary}
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}
                          >
                            Alert sent to{' '}
                            <Box component="span" sx={{ color: colors.textPrimary, fontWeight: 600 }}>
                              {event.alertRecipient.inchargeName || event.alertRecipient.stationName || 'Police Station'}
                            </Box>
                            {event.alertRecipient.email ? ` (${event.alertRecipient.email})` : ''}
                          </Typography>
                        </Box>
                      ) : null}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default Monitoring;