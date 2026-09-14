import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Chip, Alert, IconButton, Tooltip } from '@mui/material';
import { Delete } from '@mui/icons-material';
import axios from 'axios';
import socket from '../lib/socket';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('policeToken');
    axios.get('http://localhost:4001/alerts', { headers: { 'auth-token': token } }).then((res) => setAlerts(res.data || [])).catch(() => {});

    socket.connect();
    socket.on('alert:created', (payload) => setAlerts(prev => [payload.alert, ...prev]));
    return () => socket.disconnect();
  }, []);

  const handleDeleteAlert = async (id) => {
    if (!window.confirm("Are you sure you want to delete this alert?")) return;
    try {
      const token = localStorage.getItem('policeToken');
      await axios.delete(`http://localhost:4001/alerts/${id}`, { headers: { 'auth-token': token } });
      setAlerts((prev) => prev.filter((a) => (a._id || a.id) !== id));
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Emergency Alerts</Typography>
      {alerts.length === 0 ? <Alert severity="info">No alert updates yet.</Alert> : alerts.map((alert) => {
        const alertId = alert._id || alert.id;
        return (
          <Card key={alertId} sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6">{alert.message}</Typography>
                  <Chip label={alert.priority || alert.severity || 'High'} color="error" size="small" />
                </Box>
                <Tooltip title="Delete Alert">
                  <IconButton color="error" size="small" onClick={() => handleDeleteAlert(alertId)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Status: {alert.status || 'Active'} • Severity: {alert.severity || 'Critical'}
            </Typography>
            {(alert.evidenceImageUrl || alert.evidenceImage) && (
              <Box mt={2} mb={1}>
                <Typography variant="subtitle2" gutterBottom>Image Evidence:</Typography>
                <img 
                  src={alert.evidenceImageUrl || alert.evidenceImage} 
                  alt="Incident Evidence" 
                  style={{ maxWidth: '100%', maxHeight: '240px', borderRadius: '8px', border: '1px solid #444' }} 
                />
              </Box>
            )}
            {(alert.evidenceVideoUrl || alert.evidenceVideo) && (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>Recorded Video Evidence:</Typography>
                <video 
                  src={alert.evidenceVideoUrl || alert.evidenceVideo} 
                  controls 
                  style={{ maxWidth: '100%', maxHeight: '240px', borderRadius: '8px', border: '1px solid #444' }} 
                />
              </Box>
            )}
          </CardContent>
        </Card>
        );
      })}
    </Box>
  );
};

export default Alerts;
