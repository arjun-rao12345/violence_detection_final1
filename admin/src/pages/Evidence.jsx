import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Chip, CircularProgress, IconButton } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Videocam,
  Image as ImageIcon,
  Movie,
  AccessTime,
  FolderOff,
  OpenInNew,
  Delete
} from '@mui/icons-material';
import axios from 'axios';

const Evidence = () => {
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
    mediaBg: isDark ? alpha('#000000', 0.4) : alpha(theme.palette.text.primary, 0.04)
  };

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    axios
      .get('http://localhost:4001/incidents', { headers: { 'auth-token': token } })
      .then((res) => setIncidents(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const evidenceItems = incidents.filter((incident) => incident.evidenceImage || incident.evidenceVideo);

  const formatTime = (incident) => {
    const value = incident.timestamp || incident.createdAt || incident.detectedAt;
    if (!value) return 'Time unavailable';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Time unavailable' : date.toLocaleString();
  };

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" gap={1.5} mb={1}>
        <FolderOff sx={{ color: colors.accent, fontSize: 32, display: evidenceItems.length ? 'none' : 'inline-flex' }} />
        <Videocam sx={{ color: colors.accent, fontSize: 32, display: evidenceItems.length ? 'inline-flex' : 'none' }} />
        <Typography variant="h4" fontWeight={700} color={colors.textPrimary}>
          Evidence
        </Typography>
      </Box>
      <Typography variant="body2" color={colors.textSecondary} mb={3}>
        Captured images and video clips attached to logged incidents.
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : evidenceItems.length === 0 ? (
        <Box
          sx={{
            border: `1px dashed ${colors.cardBorder}`,
            borderRadius: 3,
            py: 6,
            textAlign: 'center',
            color: colors.textSecondary
          }}
        >
          <FolderOff sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
          <Typography variant="body1">No evidence captured yet.</Typography>
          <Typography variant="caption">Images and videos from detections will appear here.</Typography>
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
          {evidenceItems.map((incident) => (
            <Box key={incident._id} sx={{ display: 'flex', height: 380 }}>
              <Card
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: colors.cardBg,
                  border: `1px solid ${colors.cardBorder}`,
                  borderTop: `4px solid ${theme.palette.error.main}`,
                  borderRadius: 3,
                  boxShadow: colors.cardShadow,
                  overflow: 'hidden',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: colors.cardShadowHover
                  }
                }}
              >
                {incident.evidenceImage ? (
                  <Box
                    component="img"
                    src={incident.evidenceImage}
                    alt={incident.cameraName || 'Evidence'}
                    sx={{
                      width: '100%',
                      height: 140,
                      objectFit: 'cover',
                      flexShrink: 0,
                      bgcolor: colors.mediaBg
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: 140,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: colors.mediaBg,
                      color: colors.textSecondary
                    }}
                  >
                    <Movie sx={{ fontSize: 36, opacity: 0.6 }} />
                  </Box>
                )}

                <CardContent
                  sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    p: 2.5,
                    '&:last-child': { pb: 2.5 }
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1} mb={1.5}>
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
                      {incident.cameraName || 'Evidence'}
                    </Typography>

                    <Box display="flex" alignItems="center" gap={0.5} flexShrink={0}>
                      <Chip label="Captured" color="error" size="small" sx={{ fontWeight: 600 }} />
                      <IconButton 
                        size="small" 
                        color="error"
                        title="Delete Evidence"
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this evidence?')) {
                            try {
                              const token = localStorage.getItem('adminToken');
                              await axios.delete(`http://localhost:4001/incidents/${incident._id}`, {
                                headers: { 'auth-token': token }
                              });
                              setIncidents(prev => prev.filter(item => item._id !== incident._id));
                            } catch (error) {
                              console.error('Failed to delete evidence:', error);
                              alert('Failed to delete evidence');
                            }
                          }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <AccessTime sx={{ fontSize: 16, color: colors.textSecondary, flexShrink: 0 }} />
                    <Typography variant="caption" color={colors.textSecondary} sx={{ fontFamily: 'monospace' }}>
                      {formatTime(incident)}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                    {incident.evidenceImage ? (
                      <Box
                        component="a"
                        href={incident.evidenceImage}
                        target="_blank"
                        rel="noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.8,
                          color: colors.accent,
                          fontSize: '0.85rem',
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        <ImageIcon fontSize="small" /> View image <OpenInNew sx={{ fontSize: 14 }} />
                      </Box>
                    ) : (
                      <Box display="flex" alignItems="center" gap={0.8} color={colors.textSecondary} fontSize="0.85rem">
                        <ImageIcon fontSize="small" /> No image
                      </Box>
                    )}

                    {incident.evidenceVideo ? (
                      <Box
                        component="a"
                        href={incident.evidenceVideo}
                        target="_blank"
                        rel="noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.8,
                          color: colors.accent,
                          fontSize: '0.85rem',
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        <Movie fontSize="small" /> View video <OpenInNew sx={{ fontSize: 14 }} />
                      </Box>
                    ) : (
                      <Box display="flex" alignItems="center" gap={0.8} color={colors.textSecondary} fontSize="0.85rem">
                        <Movie fontSize="small" /> No video
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default Evidence;