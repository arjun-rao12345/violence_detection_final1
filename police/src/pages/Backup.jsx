import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, TextField, Alert, Snackbar, CircularProgress, Button } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { Security, Search, Phone, Room } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const Backup = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const colors = {
    textPrimary: theme.palette.text.primary,
    textSecondary: theme.palette.text.secondary,
    accent: theme.palette.primary.main,
    inputBg: isDark ? alpha(theme.palette.common.black, 0.4) : theme.palette.background.paper,
    inputBorder: theme.palette.divider,
    cardBg: theme.palette.background.paper,
    cardBorder: theme.palette.divider,
    cardShadow: isDark
      ? '0 8px 32px rgba(0,0,0,0.3)'
      : '0 8px 32px rgba(15,23,42,0.08)'
  };

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const incidentId = queryParams.get('incidentId');

  const [stations, setStations] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestingId, setRequestingId] = useState(null);

  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:4001/policeStation/getAllPoliceStations');
      if (response.data.success) {
        setStations(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
      setToast({ open: true, message: 'Failed to fetch police stations.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestBackup = async (stationId) => {
    setRequestingId(stationId);
    try {
      const token = localStorage.getItem('policeToken');

      if (incidentId) {
        await axios.post(
          'http://localhost:4001/backups',
          { incidentId },
          { headers: { 'auth-token': token } }
        );
      }

      const response = await axios.post(
        `http://localhost:4001/policeStation/${stationId}/request-support`,
        {},
        { headers: { 'auth-token': token } }
      );
      if (response.data.success) {
        setToast({ open: true, message: response.data.message, severity: 'success' });
      } else {
        setToast({ open: true, message: 'Failed to send support request.', severity: 'error' });
      }
    } catch (error) {
      console.error('Error requesting backup:', error);
      setToast({ open: true, message: error.response?.data?.message || 'Error requesting backup.', severity: 'error' });
    } finally {
      setRequestingId(null);
    }
  };

  const filteredStations = stations.filter(station => {
    const term = filterText.toLowerCase();
    return (
      station.stationName?.toLowerCase().includes(term) ||
      station.address?.toLowerCase().includes(term) ||
      station.city?.toLowerCase().includes(term) ||
      station.state?.toLowerCase().includes(term)
    );
  });

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" color={colors.textPrimary} mb={2}>
        Request Support & Backup
      </Typography>
      <Typography variant="body1" color={colors.textSecondary} mb={6}>
        Need assistance? Request emergency backup from nearby police stations and precincts. Emails will be broadcast to all officers active at the selected station.
      </Typography>

      <Box display="flex" alignItems="center" gap={2} mb={4} sx={{ maxWidth: '600px' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Filter by address, city, or station name..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ color: colors.textSecondary, mr: 1 }} />,
            style: { color: colors.textPrimary, borderRadius: '12px', backgroundColor: colors.inputBg }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: colors.inputBorder },
              '&:hover fieldset': { borderColor: colors.accent },
              '&.Mui-focused fieldset': { borderColor: colors.accent }
            }
          }}
        />
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" my={5}>
          <CircularProgress color="primary" />
        </Box>
      ) : filteredStations.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: '12px' }}>
          No police stations match your search.
        </Alert>
      ) : (
        <Box
          sx={{
            display: 'grid',
            // Fills as many equal-width columns as fit, min 320px each
            // => 3 per row on wide screens, 2 on medium, 1 on small
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 3,
          }}
        >
          {filteredStations.map((station) => (
            <Card
              key={station._id}
              sx={{
                width: '100%',
                height: 330,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: colors.cardBg,
                backdropFilter: 'blur(10px)',
                color: colors.textPrimary,
                border: `1px solid ${colors.cardBorder}`,
                borderRadius: '16px',
                boxShadow: colors.cardShadow,
                overflow: 'hidden'
              }}
            >
              <CardContent
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  p: 3,
                  '&:last-child': { pb: 3 }
                }}
              >
                <Box display="flex" alignItems="flex-start" gap={1.5} mb={2} sx={{ minHeight: 62 }}>
                  <Security sx={{ color: '#ef4444', flexShrink: 0, mt: 0.4 }} />
                  <Box minWidth={0} width="100%">
                    <Typography
                      variant="h6"
                      fontWeight={600}
                      color={colors.textPrimary}
                      sx={{
                        lineHeight: 1.3,
                        height: 48,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {station.stationName || 'Unnamed Police Station'}
                    </Typography>
                    <Typography variant="caption" color={colors.accent} fontWeight={600} noWrap display="block">
                      {station.stationCode || 'Code unavailable'}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="flex-start" gap={1} mb={2} sx={{ minHeight: 48 }}>
                  <Room sx={{ color: colors.textSecondary, fontSize: '1.1rem', flexShrink: 0, mt: 0.3 }} />
                  <Typography
                    variant="body2"
                    color={colors.textSecondary}
                    title={`${station.address || ''}, ${station.city || ''}`}
                    sx={{
                      lineHeight: 1.5,
                      height: 42,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      wordBreak: 'break-word'
                    }}
                  >
                    {station.address || 'Address unavailable'}
                    {station.city ? `, ${station.city}` : ''}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="flex-start" gap={1} mb={2} sx={{ minHeight: 44 }}>
                  <Phone sx={{ color: colors.textSecondary, fontSize: '1.1rem', flexShrink: 0, mt: 0.3 }} />
                  <Box minWidth={0}>
                    <Typography variant="body2" color={colors.textSecondary} noWrap title={station.contactNumber || ''}>
                      {station.contactNumber || 'Phone unavailable'}
                    </Typography>
                    <Typography variant="caption" color={colors.textSecondary} noWrap display="block" title={station.inchargeName || ''}>
                      Incharge: {station.inchargeName || 'Not assigned'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ flexGrow: 1 }} />

                <Button
                  variant="contained"
                  color="error"
                  fullWidth
                  disabled={requestingId === station._id}
                  onClick={() => handleRequestBackup(station._id)}
                  sx={{
                    minHeight: 46,
                    borderRadius: '12px',
                    py: 1.2,
                    fontWeight: 'bold',
                    textTransform: 'none',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: '#dc2626', boxShadow: '0 0 15px rgba(239,68,68,0.5)' }
                  }}
                >
                  {requestingId === station._id ? 'Sending Alert...' : 'Request Emergency Backup'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setToast({ ...toast, open: false })} severity={toast.severity} sx={{ width: '100%', borderRadius: '12px' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Backup;