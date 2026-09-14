// import React, { useEffect, useState } from 'react';
// import { Box, Typography, Grid, Card, CardContent, Button, List, ListItem, ListItemText, ListItemIcon, CircularProgress, Chip } from '@mui/material';
// import { Warning, Assignment, Navigation as NavigationIcon, NotificationsActive, Help } from '@mui/icons-material';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';

// const Dashboard = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [stats, setStats] = useState({ threats: 0, assigned: 0 });
//   const [activeIncidents, setActiveIncidents] = useState([]);
//   const [backupRequests, setBackupRequests] = useState([]);

//   useEffect(() => {
//     fetchDashboardData();
//   }, []);

//   const fetchDashboardData = async () => {
//     setLoading(true);
//     try {
//       const token = localStorage.getItem('policeToken');
//       const headers = { 'auth-token': token };

//       // 1. Fetch incidents
//       const incidentsRes = await axios.get('http://localhost:4001/incidents', { headers });
//       const allIncidents = incidentsRes.data || [];
//       const active = allIncidents.filter(inc => inc.status !== 'Resolved');
//       setActiveIncidents(active);

//       // 2. Fetch backup requests
//       const backupsRes = await axios.get('http://localhost:4001/backups', { headers });
//       const activeBackups = (backupsRes.data || []).filter(req => req.status !== 'Completed');
//       setBackupRequests(activeBackups);

//       // Set counts
//       setStats({
//         threats: active.length,
//         assigned: allIncidents.length
//       });
//     } catch (error) {
//       console.error('Error fetching dashboard data:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleNavigate = (incident) => {
//     if (incident.latitude && incident.longitude) {
//       window.open(`https://www.google.com/maps/dir/?api=1&destination=${incident.latitude},${incident.longitude}`, '_blank');
//     } else {
//       window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(incident.address || incident.location)}`, '_blank');
//     }
//   };

//   const handleUpdateBackupStatus = async (requestId, newStatus) => {
//     try {
//       const token = localStorage.getItem('policeToken');
//       await axios.put(
//         `http://localhost:4001/backups/${requestId}/status`,
//         { status: newStatus },
//         { headers: { 'auth-token': token } }
//       );
//       // Refresh list
//       fetchDashboardData();
//     } catch (error) {
//       console.error('Error updating backup status:', error);
//     }
//   };

//   if (loading) {
//     return (
//       <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
//         <CircularProgress />
//       </Box>
//     );
//   }

//   return (
//     <Box>
//       <Typography variant="h4" className="mb-6 font-bold text-amber-400">
//         Officer Dashboard
//       </Typography>
      
//       <Grid container spacing={3} className="mb-8">
//         <Grid item xs={12} sm={6}>
//           <Card sx={{ bgcolor: '#1e1e1e', borderLeft: '4px solid #f44336' }}>
//             <CardContent>
//               <Box display="flex" alignItems="center" justifyContent="space-between">
//                 <Typography color="textSecondary" gutterBottom>Active Threats</Typography>
//                 <NotificationsActive sx={{ color: '#f44336' }} />
//               </Box>
//               <Typography variant="h3" sx={{ color: '#fff' }}>{stats.threats}</Typography>
//             </CardContent>
//           </Card>
//         </Grid>
//         <Grid item xs={12} sm={6}>
//           <Card sx={{ bgcolor: '#1e1e1e', borderLeft: '4px solid #ffb74d' }}>
//             <CardContent>
//               <Box display="flex" alignItems="center" justifyContent="space-between">
//                 <Typography color="textSecondary" gutterBottom>Total Cases Logged</Typography>
//                 <Assignment sx={{ color: '#ffb74d' }} />
//               </Box>
//               <Typography variant="h3" sx={{ color: '#fff' }}>{stats.assigned}</Typography>
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>

//       <Grid container spacing={3}>
//         <Grid item xs={12} md={8}>
//           <Typography variant="h5" className="mb-4 text-gray-300">
//             Active Incidents
//           </Typography>
//           <div className="bg-[#1e1e1e] p-4 rounded-lg mb-6">
//             {activeIncidents.length === 0 ? (
//               <Typography color="textSecondary" align="center" py={3}>
//                 No active incidents reported.
//               </Typography>
//             ) : (
//               <List>
//                 {activeIncidents.map((incident) => (
//                   <ListItem key={incident._id} sx={{ borderBottom: '1px solid #333', flexWrap: 'wrap', gap: 1, justifyContent: 'space-between' }}>
//                     <Box display="flex" alignItems="center">
//                       <ListItemIcon>
//                         <Warning sx={{ color: incident.type.includes('Weapon') ? '#f44336' : '#ffb74d' }} />
//                       </ListItemIcon>
//                       <ListItemText 
//                         primary={<Typography variant="h6" color={incident.type.includes('Weapon') ? 'error' : 'warning'}>{incident.type}</Typography>}
//                         secondary={<Typography color="textSecondary">{incident.address} • {new Date(incident.timestamp).toLocaleTimeString()}</Typography>}
//                       />
//                     </Box>
//                     <Box display="flex" gap={1}>
//                       <Button 
//                         variant="contained" 
//                         color="primary" 
//                         size="small"
//                         startIcon={<NavigationIcon />}
//                         onClick={() => handleNavigate(incident)}
//                       >
//                         Navigate
//                       </Button>
//                       <Button 
//                         variant="contained" 
//                         color="error" 
//                         size="small"
//                         onClick={() => navigate(`/backup?incidentId=${incident._id}`)}
//                       >
//                         Request Backup
//                       </Button>
//                     </Box>
//                   </ListItem>
//                 ))}
//               </List>
//             )}
//           </div>

//           <Typography variant="h5" className="mb-4 text-gray-300">
//             Active Backup Requests
//           </Typography>
//           <div className="bg-[#1e1e1e] p-4 rounded-lg">
//             {backupRequests.length === 0 ? (
//               <Typography color="textSecondary" align="center" py={3}>
//                 No active backup requests from other officers.
//               </Typography>
//             ) : (
//               <List>
//                 {backupRequests.map((req) => (
//                   <ListItem key={req._id} sx={{ borderBottom: '1px solid #333', flexWrap: 'wrap', gap: 1, justifyContent: 'space-between' }}>
//                     <Box display="flex" alignItems="center">
//                       <ListItemIcon>
//                         <Help sx={{ color: '#38bdf8' }} />
//                       </ListItemIcon>
//                       <ListItemText 
//                         primary={
//                           <Typography variant="h6" color="#38bdf8">
//                             Backup requested by {req.requestingOfficerId?.officerName || 'Officer'} ({req.requestingOfficerId?.badgeNumber || 'N/A'})
//                           </Typography>
//                         }
//                         secondary={
//                           <Typography color="textSecondary">
//                             Incident: {req.incidentId?.type || 'Violence'} at {req.incidentId?.address || 'Unknown'} • Status: {req.status}
//                           </Typography>
//                         }
//                       />
//                     </Box>
//                     <Box display="flex" gap={1} alignItems="center">
//                       {req.status === 'Pending' ? (
//                         <Button 
//                           variant="contained" 
//                           color="success" 
//                           size="small"
//                           onClick={() => handleUpdateBackupStatus(req._id, 'Dispatched')}
//                         >
//                           Accept
//                         </Button>
//                       ) : (
//                         <Chip label="Accepted" color="success" size="small" sx={{ mr: 1 }} />
//                       )}
                      
//                       <Button 
//                         variant="outlined" 
//                         color="error" 
//                         size="small"
//                         onClick={() => handleUpdateBackupStatus(req._id, 'Completed')}
//                       >
//                         Resolve
//                       </Button>
//                     </Box>
//                   </ListItem>
//                 ))}
//               </List>
//             )}
//           </div>
//         </Grid>
        
//         <Grid item xs={12} md={4}>
//           <Typography variant="h5" className="mb-4 text-gray-300">
//             Quick Actions
//           </Typography>
//           <Card sx={{ bgcolor: '#1e1e1e' }}>
//             <CardContent className="flex flex-col gap-4">
//               <Button variant="contained" color="error" fullWidth size="large" onClick={() => navigate('/backup')}>
//                 REQUEST BACKUP
//               </Button>
//               <Button variant="outlined" color="primary" fullWidth onClick={() => navigate('/incidents')}>
//                 Mark Status: En Route
//               </Button>
//               <Button variant="outlined" color="primary" fullWidth onClick={() => navigate('/alerts')}>
//                 View Live Alerts
//               </Button>
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>
//     </Box>
//   );
// };

// export default Dashboard;
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Chip,
  Stack,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Warning,
  Assignment,
  Navigation as NavigationIcon,
  NotificationsActive,
  Help,
  LocalPolice,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ threats: 0, assigned: 0 });
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [backupRequests, setBackupRequests] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('policeToken');
      const headers = { 'auth-token': token };

      // 1. Fetch incidents
      const incidentsRes = await axios.get('http://localhost:4001/incidents', { headers });
      const allIncidents = incidentsRes.data || [];
      const active = allIncidents.filter(inc => inc.status !== 'Resolved');
      setActiveIncidents(active);

      // 2. Fetch backup requests
      const backupsRes = await axios.get('http://localhost:4001/backups', { headers });
      const activeBackups = (backupsRes.data || []).filter(req => req.status !== 'Completed');
      setBackupRequests(activeBackups);

      // Set counts
      setStats({
        threats: active.length,
        assigned: allIncidents.length
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (incident) => {
    if (incident.latitude && incident.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${incident.latitude},${incident.longitude}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(incident.address || incident.location)}`, '_blank');
    }
  };

  const handleUpdateBackupStatus = async (requestId, newStatus) => {
    try {
      const token = localStorage.getItem('policeToken');
      await axios.put(
        `http://localhost:4001/backups/${requestId}/status`,
        { status: newStatus },
        { headers: { 'auth-token': token } }
      );
      // Refresh list
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating backup status:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100%', p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Page heading */}
      <Box sx={{ mb: 3 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
              Officer Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Live overview of incidents and backup requests in your area.
            </Typography>
          </Box>

          <Chip
            icon={<LocalPolice />}
            label="On Duty"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600, borderRadius: 2, px: 0.5 }}
          />
        </Stack>
      </Box>

      {/* Stat cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              boxShadow: (theme) =>
                theme.palette.mode === 'dark'
                  ? '0 12px 40px rgba(0,0,0,0.25)'
                  : '0 12px 40px rgba(15,23,42,0.08)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Active Threats
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: 'error.main' }}>
                    {stats.threats}
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    width: 54,
                    height: 54,
                    bgcolor: 'error.main',
                    boxShadow: (theme) => `0 8px 20px ${theme.palette.error.main}35`,
                  }}
                >
                  <NotificationsActive />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              boxShadow: (theme) =>
                theme.palette.mode === 'dark'
                  ? '0 12px 40px rgba(0,0,0,0.25)'
                  : '0 12px 40px rgba(15,23,42,0.08)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Total Cases Logged
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    {stats.assigned}
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    width: 54,
                    height: 54,
                    bgcolor: 'primary.main',
                    boxShadow: (theme) => `0 8px 20px ${theme.palette.primary.main}35`,
                  }}
                >
                  <Assignment />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 320px' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        {/* Left column: incidents + backups */}
        <Stack spacing={3}>
          {/* Active Incidents */}
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              boxShadow: (theme) =>
                theme.palette.mode === 'dark'
                  ? '0 12px 40px rgba(0,0,0,0.25)'
                  : '0 12px 40px rgba(15,23,42,0.08)',
            }}
          >
            <Box
              sx={{
                p: { xs: 2.5, sm: 3 },
                background: (theme) =>
                  `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
                color: 'error.contrastText',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar
                  sx={{
                    width: 50,
                    height: 50,
                    bgcolor: 'rgba(255,255,255,0.18)',
                    border: '2px solid rgba(255,255,255,0.35)',
                  }}
                >
                  <Warning />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Active Incidents
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.3 }}>
                    Incidents currently requiring attention.
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              {activeIncidents.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                  No active incidents reported.
                </Typography>
              ) : (
                <List sx={{ p: 0 }}>
                  {activeIncidents.map((incident) => (
                    <ListItem
                      key={incident._id}
                      sx={{
                        borderRadius: 2.5,
                        mb: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        flexWrap: 'wrap',
                        gap: 1.5,
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease',
                        '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                        '&:last-child': { mb: 0 },
                      }}
                    >
                      <Box display="flex" alignItems="center">
                        <ListItemIcon sx={{ minWidth: 44 }}>
                          <Avatar
                            sx={{
                              width: 38,
                              height: 38,
                              bgcolor: incident.type.includes('Weapon') ? 'error.main' : 'warning.main',
                            }}
                          >
                            <Warning sx={{ fontSize: 20 }} />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 700 }}
                              color={incident.type.includes('Weapon') ? 'error.main' : 'warning.main'}
                            >
                              {incident.type}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {incident.address} • {new Date(incident.timestamp).toLocaleTimeString()}
                            </Typography>
                          }
                        />
                      </Box>
                      <Box display="flex" gap={1}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<NavigationIcon />}
                          onClick={() => handleNavigate(incident)}
                          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                        >
                          Navigate
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() => navigate(`/backup?incidentId=${incident._id}`)}
                          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                        >
                          Request Backup
                        </Button>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Active Backup Requests */}
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              boxShadow: (theme) =>
                theme.palette.mode === 'dark'
                  ? '0 12px 40px rgba(0,0,0,0.25)'
                  : '0 12px 40px rgba(15,23,42,0.08)',
            }}
          >
            <Box
              sx={{
                p: { xs: 2.5, sm: 3 },
                background: (theme) =>
                  `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                color: 'info.contrastText',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar
                  sx={{
                    width: 50,
                    height: 50,
                    bgcolor: 'rgba(255,255,255,0.18)',
                    border: '2px solid rgba(255,255,255,0.35)',
                  }}
                >
                  <Help />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Active Backup Requests
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.3 }}>
                    Requests from other officers awaiting response.
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              {backupRequests.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                  No active backup requests from other officers.
                </Typography>
              ) : (
                <List sx={{ p: 0 }}>
                  {backupRequests.map((req) => (
                    <ListItem
                      key={req._id}
                      sx={{
                        borderRadius: 2.5,
                        mb: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        flexWrap: 'wrap',
                        gap: 1.5,
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease',
                        '&:hover': { borderColor: 'info.main', bgcolor: 'action.hover' },
                        '&:last-child': { mb: 0 },
                      }}
                    >
                      <Box display="flex" alignItems="center">
                        <ListItemIcon sx={{ minWidth: 44 }}>
                          <Avatar sx={{ width: 38, height: 38, bgcolor: 'info.main' }}>
                            <Help sx={{ fontSize: 20 }} />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }} color="info.main">
                              Backup requested by {req.requestingOfficerId?.officerName || 'Officer'} (
                              {req.requestingOfficerId?.badgeNumber || 'N/A'})
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              Incident: {req.incidentId?.type || 'Violence'} at {req.incidentId?.address || 'Unknown'} • Status: {req.status}
                            </Typography>
                          }
                        />
                      </Box>
                      <Box display="flex" gap={1} alignItems="center">
                        {req.status === 'Pending' ? (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => handleUpdateBackupStatus(req._id, 'Dispatched')}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                          >
                            Accept
                          </Button>
                        ) : (
                          <Chip label="Accepted" color="success" size="small" sx={{ fontWeight: 600 }} />
                        )}
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleUpdateBackupStatus(req._id, 'Completed')}
                          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                        >
                          Resolve
                        </Button>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Stack>

        {/* Right column: quick actions */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            position: { md: 'sticky' },
            top: { md: 24 },
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Avatar sx={{ width: 50, height: 50, bgcolor: 'primary.main', mb: 2 }}>
              <LocalPolice />
            </Avatar>

            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.7 }}>
              Quick Actions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 2.5 }}>
              Common actions for officers in the field.
            </Typography>

            <Divider sx={{ mb: 2.5 }} />

            <Stack spacing={1.75}>
              <Button
                variant="contained"
                color="error"
                fullWidth
                size="large"
                onClick={() => navigate('/backup')}
                sx={{
                  minHeight: 50,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 700,
                  boxShadow: (theme) => `0 8px 20px ${theme.palette.error.main}35`,
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: (theme) => `0 10px 25px ${theme.palette.error.main}45`,
                  },
                  transition: 'all 0.25s ease',
                }}
              >
                Request Backup
              </Button>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={() => navigate('/incidents')}
                sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, py: 1.2 }}
              >
                Mark Status: En Route
              </Button>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={() => navigate('/alerts')}
                sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, py: 1.2 }}
              >
                View Live Alerts
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Dashboard;