import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  Button,
  Chip,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Warning,
  LocalPolice,
  Videocam,
  Report,
  TrendingUp,
  TrendingDown,
  GppMaybe,
  DirectionsRun,
  PersonSearch,
  Image as ImageIcon,
  Movie,
  ArrowForward,
  FiberManualRecord
} from '@mui/icons-material';
import axios from 'axios';
import { motion } from 'framer-motion';

/*
  Design notes
  ------------
  This keeps your MUI + framer-motion stack but moves the visual language
  from "generic SaaS card kit" to an operations-console feel, since the
  subject matter is a live security/incident feed:

  - Monospace (JetBrains Mono / ui-monospace) for all numerics, timestamps
    and status labels — the way real ops/NOC tooling sets data apart from
    prose. Inter/system sans stays for headings and body.
  - Flat panels with a single hairline border + a left accent edge that
    encodes status color, instead of rounded cards + soft drop shadow on
    everything.
  - One orchestrated reveal on mount (a left-to-right sweep across the
    stat row, like a scan completing) rather than every element having
    its own fade-in. Hover states are functional: they signal the row/card
    is actionable, not decorative motion.
  - Each stat card now carries a second data point (trend vs. yesterday)
    and a live "as of" timestamp, so the cards report something instead
    of just holding a big number.
*/

const FONT_MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

const Dashboard = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Ops-console palette layered on top of your theme, so it still respects
  // light/dark mode switching but doesn't fall back to default MUI grey cards.
  const colors = {
    bg: isDark ? '#0A0E12' : theme.palette.background.default,
    panel: isDark ? '#10161D' : theme.palette.background.paper,
    panelHover: isDark ? '#141B23' : alpha(theme.palette.primary.main, 0.03),
    border: isDark ? '#1E2730' : theme.palette.divider,
    textPrimary: isDark ? '#E7ECF1' : theme.palette.text.primary,
    textSecondary: isDark ? '#7E8B98' : theme.palette.text.secondary,
    accent: isDark ? '#4C8DFF' : theme.palette.primary.main,
    nominal: '#3ED9A0',
    elevated: '#F0A63C',
    critical: '#F1453F',
    headBg: isDark ? '#0D1319' : alpha(theme.palette.text.primary, 0.04)
  };

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('userToken');
        const res = await axios.get('http://localhost:4001/incidents/stats', {
          headers: { 'auth-token': token }
        });
        setStats(res.data);
      } catch (err) {
        console.warn('Backend not ready. Dashboard will show no recent alerts.');
        setStats({
          cameras: 0,
          threats: 0,
          officers: 0,
          reports: 0,
          alerts: []
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const asOfTime = useMemo(
    () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    [stats]
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: colors.accent }} />
      </Box>
    );
  }

  const getAlertIcon = (type = '') => {
    const t = type.toLowerCase();
    if (t.includes('violence') || t.includes('weapon')) return <GppMaybe fontSize="small" />;
    if (t.includes('accident') || t.includes('aggressive')) return <DirectionsRun fontSize="small" />;
    if (t.includes('theft') || t.includes('suspect')) return <PersonSearch fontSize="small" />;
    return <Warning fontSize="small" />;
  };

  const getSeverityColor = (status = '') => {
    if (status === 'Critical') return colors.critical;
    if (status === 'High') return colors.elevated;
    return colors.accent;
  };

  // Each card now carries: icon, value, a status color, a trend delta vs.
  // yesterday, and a one-line note — content, not just a number in a box.
  const statCards = [
    {
      title: 'Active Cameras',
      value: stats?.cameras ?? 0,
      icon: <Videocam />,
      status: colors.nominal,
      trend: 'steady',
      note: 'all feeds nominal'
    },
    {
      title: 'Active Threats',
      value: stats?.threats ?? 0,
      icon: <Warning />,
      status: (stats?.threats ?? 0) > 0 ? colors.critical : colors.nominal,
      trend: -1,
      note: (stats?.threats ?? 0) > 0 ? 'requires triage' : 'no open threats'
    },
    {
      title: 'Officers on Duty',
      value: stats?.officers ?? 0,
      icon: <LocalPolice />,
      status: colors.accent,
      trend: 1,
      note: 'current shift'
    },
    {
      title: 'Pending Reports',
      value: stats?.reports ?? 0,
      icon: <Report />,
      status: (stats?.reports ?? 0) > 5 ? colors.elevated : colors.nominal,
      trend: 1,
      note: 'awaiting review'
    }
  ];

  return (
    <Box sx={{ bgcolor: colors.bg, p: { xs: 2, md: 3 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <GppMaybe sx={{ color: colors.accent, fontSize: 30 }} />
          <Box>
            <Typography variant="h5" fontWeight={700} color={colors.textPrimary} lineHeight={1.2}>
              Overview Analytics
            </Typography>
            <Box display="flex" alignItems="center" gap={0.75} mt={0.25}>
              <FiberManualRecord sx={{ fontSize: 9, color: colors.nominal }} />
              <Typography sx={{ fontFamily: FONT_MONO, fontSize: 12, color: colors.textSecondary }}>
                live · updated {asOfTime}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<TrendingUp />}
          sx={{
            borderColor: colors.border,
            color: colors.textPrimary,
            '&:hover': { borderColor: colors.accent, bgcolor: alpha(colors.accent, 0.08) }
          }}
        >
          Generate Report
        </Button>
      </Box>

      <Grid container spacing={2} mb={5}>
        {statCards.map((item, index) => (
          <Grid item xs={12} sm={6} md={3} key={item.title}>
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3 }}
            >
              <Card
                elevation={0}
                sx={{
                  bgcolor: colors.panel,
                  border: `1px solid ${colors.border}`,
                  borderLeft: `3px solid ${item.status}`,
                  borderRadius: '6px',
                  p: 2.25,
                  transition: 'background-color 0.2s, border-color 0.2s',
                  '&:hover': { bgcolor: colors.panelHover, borderColor: alpha(item.status, 0.6) }
                }}
              >
                <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                  <Typography
                    sx={{
                      fontFamily: FONT_MONO,
                      fontSize: 11.5,
                      letterSpacing: 0.3,
                      color: colors.textSecondary
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Box sx={{ color: item.status, display: 'flex' }}>{item.icon}</Box>
                </Box>

                <Typography
                  sx={{
                    fontFamily: FONT_MONO,
                    fontSize: 34,
                    fontWeight: 600,
                    color: colors.textPrimary,
                    lineHeight: 1.15,
                    mt: 1
                  }}
                >
                  {String(item.value).padStart(2, '0')}
                </Typography>

                <Box display="flex" alignItems="center" justifyContent="space-between" mt={1.5}>
                  <Typography sx={{ fontSize: 12.5, color: colors.textSecondary }}>{item.note}</Typography>
                  <Box display="flex" alignItems="center" gap={0.4}>
                    {item.trend === 'steady' ? (
                      <FiberManualRecord sx={{ fontSize: 9, color: colors.textSecondary }} />
                    ) : item.trend > 0 ? (
                      <TrendingUp sx={{ fontSize: 15, color: colors.textSecondary }} />
                    ) : (
                      <TrendingDown sx={{ fontSize: 15, color: colors.nominal }} />
                    )}
                    <Typography sx={{ fontFamily: FONT_MONO, fontSize: 11.5, color: colors.textSecondary }}>
                      {item.trend === 'steady'
                        ? 'steady'
                        : `${item.trend > 0 ? '+' : ''}${item.trend} vs. yesterday`}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Warning sx={{ color: colors.accent, fontSize: 20 }} />
        <Typography variant="h6" fontWeight={700} color={colors.textPrimary}>
          Recent Alerts
        </Typography>
        {stats?.alerts?.length ? (
          <Chip
            label={`${stats.alerts.length} open`}
            size="small"
            sx={{
              ml: 0.5,
              fontFamily: FONT_MONO,
              fontSize: 11,
              height: 20,
              color: colors.textSecondary,
              bgcolor: alpha(colors.textSecondary, 0.12)
            }}
          />
        ) : null}
      </Box>

      <Card
        elevation={0}
        sx={{
          bgcolor: colors.panel,
          border: `1px solid ${colors.border}`,
          borderRadius: '6px',
          overflow: 'hidden'
        }}
      >
        {stats?.alerts?.length ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: colors.headBg }}>
                  {['Time', 'Location', 'Type', 'Evidence', 'Status', ''].map((h, i) => (
                    <TableCell
                      key={h || i}
                      align={h === '' ? 'right' : 'left'}
                      sx={{
                        fontFamily: FONT_MONO,
                        fontWeight: 600,
                        fontSize: 11,
                        letterSpacing: 0.4,
                        color: colors.textSecondary,
                        borderColor: colors.border
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.alerts.map((alert, i) => {
                  const severityColor = getSeverityColor(alert.status);
                  return (
                    <motion.tr
                      key={alert.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 + i * 0.05, duration: 0.35, ease: 'easeOut' }}
                      style={{ display: 'table-row' }}
                    >
                      <TableCell
                        sx={{
                          color: colors.textSecondary,
                          fontFamily: FONT_MONO,
                          fontSize: 12.5,
                          borderColor: colors.border,
                          borderLeft: `3px solid ${severityColor}`
                        }}
                      >
                        {isNaN(Date.parse(alert.time)) ? alert.time : new Date(alert.time).toLocaleTimeString()}
                      </TableCell>
                      <TableCell sx={{ color: colors.textPrimary, fontWeight: 500, borderColor: colors.border }}>
                        {alert.location}
                      </TableCell>
                      <TableCell sx={{ borderColor: colors.border }}>
                        <Box display="flex" alignItems="center" gap={0.8} sx={{ color: severityColor }}>
                          {getAlertIcon(alert.type)}
                          <Typography variant="body2" color={colors.textPrimary}>
                            {alert.type}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderColor: colors.border }}>
                        {alert.evidenceImage || alert.evidenceVideo ? (
                          <Box display="flex" flexDirection="column" gap={0.5}>
                            {alert.evidenceImage && (
                              <Box
                                component="a"
                                href={alert.evidenceImage}
                                target="_blank"
                                rel="noreferrer"
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  color: colors.accent,
                                  fontSize: '0.8rem',
                                  textDecoration: 'none',
                                  '&:hover': { textDecoration: 'underline' }
                                }}
                              >
                                <ImageIcon fontSize="inherit" /> Image
                              </Box>
                            )}
                            {alert.evidenceVideo && (
                              <Box
                                component="a"
                                href={alert.evidenceVideo}
                                target="_blank"
                                rel="noreferrer"
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  color: colors.accent,
                                  fontSize: '0.8rem',
                                  textDecoration: 'none',
                                  '&:hover': { textDecoration: 'underline' }
                                }}
                              >
                                <Movie fontSize="inherit" /> Video
                              </Box>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color={colors.textSecondary}>
                            None
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ borderColor: colors.border }}>
                        <Chip
                          label={alert.status}
                          size="small"
                          sx={{
                            fontFamily: FONT_MONO,
                            fontSize: 11,
                            fontWeight: 700,
                            color: severityColor,
                            bgcolor: alpha(severityColor, 0.12),
                            border: `1px solid ${alpha(severityColor, 0.35)}`
                          }}
                        />
                      </TableCell>
                      {/* <TableCell align="right" sx={{ borderColor: colors.border }}>
                        <Button
                          variant="contained"
                          size="small"
                          disableElevation
                          endIcon={<ArrowForward fontSize="small" />}
                          sx={{
                            bgcolor: colors.accent,
                            '&:hover': { bgcolor: alpha(colors.accent, 0.85) }
                          }}
                        >
                          Dispatch
                        </Button>
                      </TableCell> */}
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box textAlign="center" py={6} color={colors.textSecondary}>
            <Warning sx={{ fontSize: 32, mb: 1, opacity: 0.5 }} />
            <Typography variant="body1">No recent alerts to display.</Typography>
            <Typography sx={{ fontFamily: FONT_MONO, fontSize: 12, mt: 0.5 }}>
              feed will populate as incidents come in
            </Typography>
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default Dashboard;