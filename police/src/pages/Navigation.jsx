

//   import React, { useEffect, useMemo, useState } from 'react';
// import {
//   Alert,
//   Box,
//   Button,
//   Card,
//   CardContent,
//   Chip,
//   CircularProgress,
//   Grid,
//   Stack,
//   Typography
// } from '@mui/material';

// import {
//   AccessTime,
//   LocationOn,
//   MyLocation,
//   Navigation as NavigationIcon,
//   Refresh,
//   Videocam,
//   Warning
// } from '@mui/icons-material';

// import axios from 'axios';

// const API_URL = 'http://localhost:4001';

// const buildGoogleMapUrl = (incidents) => {
//   if (!Array.isArray(incidents) || incidents.length === 0) {
//     return null;
//   }

//   const validIncidents = incidents.filter(
//     (incident) =>
//       incident.latitude !== null &&
//       incident.latitude !== undefined &&
//       incident.longitude !== null &&
//       incident.longitude !== undefined &&
//       !Number.isNaN(Number(incident.latitude)) &&
//       !Number.isNaN(Number(incident.longitude))
//   );

//   if (validIncidents.length === 0) {
//     return null;
//   }

//   const centerLatitude =
//     validIncidents.reduce(
//       (total, incident) => total + Number(incident.latitude),
//       0
//     ) / validIncidents.length;

//   const centerLongitude =
//     validIncidents.reduce(
//       (total, incident) => total + Number(incident.longitude),
//       0
//     ) / validIncidents.length;

//   const markers = validIncidents
//     .map(
//       (incident) =>
//         `${Number(incident.latitude)},${Number(incident.longitude)}`
//     )
//     .join('|');

//   return `https://maps.google.com/maps?q=${encodeURIComponent(
//     markers
//   )}&center=${centerLatitude},${centerLongitude}&z=13&output=embed`;
// };

// const Navigation = () => {
//   const [incidents, setIncidents] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState('');
//   const [mapError, setMapError] = useState('');

//   const fetchIncidents = async (isRefresh = false) => {
//     try {
//       if (isRefresh) {
//         setRefreshing(true);
//       } else {
//         setLoading(true);
//       }

//       setError('');
//       setMapError('');

//       const token = localStorage.getItem('policeToken');

//       const response = await axios.get(`${API_URL}/incidents`, {
//         headers: {
//           'auth-token': token
//         }
//       });

//       const incidentData = Array.isArray(response.data)
//         ? response.data
//         : response.data?.incidents || [];

//       const activeIncidents = incidentData.filter(
//         (incident) => incident.status !== 'Resolved'
//       );

//       setIncidents(activeIncidents);
//     } catch (err) {
//       console.error(
//         'Unable to load incidents for navigation map:',
//         err
//       );

//       setError(
//         err.response?.data?.message ||
//           'Unable to load active incident locations. Please try again.'
//       );
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   useEffect(() => {
//     fetchIncidents();
//   }, []);

//   const mapUrl = useMemo(
//     () => buildGoogleMapUrl(incidents),
//     [incidents]
//   );

//   const handleOpenNavigation = (incident) => {
//     const hasCoordinates =
//       incident.latitude !== null &&
//       incident.latitude !== undefined &&
//       incident.longitude !== null &&
//       incident.longitude !== undefined;

//     let navigationUrl;

//     if (hasCoordinates) {
//       navigationUrl =
//         `https://www.google.com/maps/dir/?api=1` +
//         `&destination=${incident.latitude},${incident.longitude}`;
//     } else {
//       const address =
//         incident.address ||
//         incident.location ||
//         'Incident location';

//       navigationUrl =
//         `https://www.google.com/maps/search/?api=1` +
//         `&query=${encodeURIComponent(address)}`;
//     }

//     window.open(
//       navigationUrl,
//       '_blank',
//       'noopener,noreferrer'
//     );
//   };

//   const getIncidentColor = (type = '') => {
//     const normalizedType = type.toLowerCase();

//     if (
//       normalizedType.includes('weapon') ||
//       normalizedType.includes('violence')
//     ) {
//       return '#ef4444';
//     }

//     if (
//       normalizedType.includes('accident') ||
//       normalizedType.includes('aggressive')
//     ) {
//       return '#f59e0b';
//     }

//     return '#38bdf8';
//   };

//   const getSeverityColor = (severity) => {
//     switch (severity) {
//       case 'Critical':
//         return 'error';

//       case 'High':
//         return 'warning';

//       case 'Medium':
//         return 'info';

//       case 'Low':
//         return 'success';

//       default:
//         return 'default';
//     }
//   };

//   const getCameraName = (incident) => {
//     if (incident.cameraName) {
//       return incident.cameraName;
//     }

//     if (
//       incident.cameraId &&
//       typeof incident.cameraId === 'object'
//     ) {
//       return (
//         incident.cameraId.cameraName ||
//         incident.cameraId.name ||
//         'Unknown camera'
//       );
//     }

//     return incident.cameraId || 'Unknown camera';
//   };

//   const formatIncidentDate = (incident) => {
//     const dateValue =
//       incident.timestamp ||
//       incident.createdAt ||
//       incident.detectedAt;

//     if (!dateValue) {
//       return 'Time unavailable';
//     }

//     const date = new Date(dateValue);

//     if (Number.isNaN(date.getTime())) {
//       return 'Time unavailable';
//     }

//     return date.toLocaleString('en-IN', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const formatCoordinates = (incident) => {
//     const hasCoordinates =
//       incident.latitude !== null &&
//       incident.latitude !== undefined &&
//       incident.longitude !== null &&
//       incident.longitude !== undefined;

//     if (!hasCoordinates) {
//       return 'Coordinates unavailable';
//     }

//     const latitude = Number(incident.latitude);
//     const longitude = Number(incident.longitude);

//     if (
//       Number.isNaN(latitude) ||
//       Number.isNaN(longitude)
//     ) {
//       return 'Coordinates unavailable';
//     }

//     return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
//   };

//   return (
//     <Box
//       p={{ xs: 2, md: 3 }}
//       sx={{
//         minHeight: '100vh'
//       }}
//     >
//       <Box
//         display="flex"
//         justifyContent="space-between"
//         alignItems={{ xs: 'flex-start', sm: 'center' }}
//         flexDirection={{ xs: 'column', sm: 'row' }}
//         gap={2}
//         mb={3}
//       >
//         <Box>
//           <Typography
//             variant="h4"
//             fontWeight={700}
//             color="#f8fafc"
//           >
//             Active Incident Maps & Navigation
//           </Typography>

//           <Typography
//             variant="body1"
//             color="#94a3b8"
//             mt={0.5}
//           >
//             View active emergencies and open GPS directions
//             to each incident location.
//           </Typography>
//         </Box>

//         <Button
//           variant="outlined"
//           startIcon={
//             refreshing ? (
//               <CircularProgress
//                 size={18}
//                 color="inherit"
//               />
//             ) : (
//               <Refresh />
//             )
//           }
//           disabled={refreshing}
//           onClick={() => fetchIncidents(true)}
//           sx={{
//             color: '#38bdf8',
//             borderColor: 'rgba(56, 189, 248, 0.5)',
//             borderRadius: 2,
//             textTransform: 'none',
//             fontWeight: 600,
//             whiteSpace: 'nowrap',
//             '&:hover': {
//               borderColor: '#38bdf8',
//               backgroundColor:
//                 'rgba(56, 189, 248, 0.08)'
//             }
//           }}
//         >
//           {refreshing ? 'Refreshing...' : 'Refresh Locations'}
//         </Button>
//       </Box>

//       {loading ? (
//         <Box
//           display="flex"
//           flexDirection="column"
//           justifyContent="center"
//           alignItems="center"
//           minHeight={400}
//           gap={2}
//         >
//           <CircularProgress />

//           <Typography color="#94a3b8">
//             Loading active incident locations...
//           </Typography>
//         </Box>
//       ) : error ? (
//         <Alert
//           severity="error"
//           sx={{ borderRadius: 3 }}
//           action={
//             <Button
//               color="inherit"
//               size="small"
//               onClick={() => fetchIncidents()}
//             >
//               Retry
//             </Button>
//           }
//         >
//           {error}
//         </Alert>
//       ) : incidents.length === 0 ? (
//         <Alert
//           severity="info"
//           sx={{
//             borderRadius: 3,
//             alignItems: 'center'
//           }}
//         >
//           No active incidents reported. The navigation map
//           is currently idle.
//         </Alert>
//       ) : (
//         <>
//           <Box
//             mb={4}
//             sx={{
//               borderRadius: 4,
//               overflow: 'hidden',
//               backgroundColor: 'rgba(30, 41, 59, 0.7)',
//               boxShadow:
//                 '0 8px 32px rgba(0, 0, 0, 0.3)',
//               border:
//                 '1px solid rgba(148, 163, 184, 0.15)'
//             }}
//           >
//             <Box
//               px={{ xs: 2, md: 3 }}
//               py={2}
//               display="flex"
//               justifyContent="space-between"
//               alignItems="center"
//               gap={2}
//             >
//               <Box
//                 display="flex"
//                 alignItems="center"
//                 gap={1}
//               >
//                 <MyLocation sx={{ color: '#38bdf8' }} />

//                 <Typography
//                   variant="h6"
//                   color="#f8fafc"
//                   fontWeight={600}
//                 >
//                   Live Incident Map
//                 </Typography>
//               </Box>

//               <Chip
//                 label={`${incidents.length} active ${
//                   incidents.length === 1
//                     ? 'incident'
//                     : 'incidents'
//                 }`}
//                 size="small"
//                 sx={{
//                   color: '#38bdf8',
//                   backgroundColor:
//                     'rgba(56, 189, 248, 0.12)',
//                   border:
//                     '1px solid rgba(56, 189, 248, 0.25)',
//                   fontWeight: 600
//                 }}
//               />
//             </Box>

//             {mapError ? (
//               <Alert severity="error">
//                 {mapError}
//               </Alert>
//             ) : mapUrl ? (
//               <iframe
//                 title="Active emergencies navigation map"
//                 src={mapUrl}
//                 width="100%"
//                 height="450"
//                 style={{
//                   display: 'block',
//                   border: 0
//                 }}
//                 allowFullScreen
//                 loading="lazy"
//                 referrerPolicy="no-referrer-when-downgrade"
//                 onError={() =>
//                   setMapError(
//                     'Unable to load Google Map. Please try again.'
//                   )
//                 }
//               />
//             ) : (
//               <Alert severity="warning">
//                 Active incidents were found, but valid
//                 coordinates are unavailable.
//               </Alert>
//             )}
//           </Box>

//           <Box mb={2}>
//             <Typography
//               variant="h5"
//               color="#f8fafc"
//               fontWeight={700}
//             >
//               Active Incident Locations
//             </Typography>

//             <Typography
//               variant="body2"
//               color="#94a3b8"
//               mt={0.5}
//             >
//               Select an incident to open turn-by-turn GPS
//               directions.
//             </Typography>
//           </Box>

//           <Grid
//             container
//             spacing={3}
//             alignItems="stretch"
//           >
//             {incidents.map((incident) => {
//               const incidentColor =
//                 getIncidentColor(incident.type);

//               return (
//                 <Grid
//                   item
//                   xs={12}
//                   sm={6}
//                   lg={4}
//                   key={incident._id}
//                   sx={{
//                     display: 'flex'
//                   }}
//                 >
//                   <Card
//                     sx={{
//                       width: '100%',
//                       height: '100%',
//                       minHeight: 350,
//                       display: 'flex',
//                       flexDirection: 'column',
//                       color: '#f8fafc',
//                       background:
//                         'linear-gradient(145deg, rgba(30,41,59,0.92), rgba(15,23,42,0.92))',
//                       backdropFilter: 'blur(12px)',
//                       border:
//                         '1px solid rgba(148,163,184,0.14)',
//                       borderTop: `4px solid ${incidentColor}`,
//                       borderRadius: 4,
//                       overflow: 'hidden',
//                       transition:
//                         'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
//                       '&:hover': {
//                         transform: 'translateY(-5px)',
//                         boxShadow:
//                           '0 16px 35px rgba(0,0,0,0.35)',
//                         borderColor:
//                           'rgba(56,189,248,0.35)'
//                       }
//                     }}
//                   >
//                     <CardContent
//                       sx={{
//                         p: 3,
//                         height: '100%',
//                         display: 'flex',
//                         flexDirection: 'column',
//                         '&:last-child': {
//                           pb: 3
//                         }
//                       }}
//                     >
//                       <Box
//                         display="flex"
//                         justifyContent="space-between"
//                         alignItems="flex-start"
//                         gap={2}
//                         mb={2}
//                       >
//                         <Box
//                           display="flex"
//                           alignItems="flex-start"
//                           gap={1.2}
//                           minWidth={0}
//                         >
//                           <Box
//                             sx={{
//                               width: 42,
//                               height: 42,
//                               borderRadius: 2.5,
//                               display: 'flex',
//                               alignItems: 'center',
//                               justifyContent: 'center',
//                               flexShrink: 0,
//                               backgroundColor: `${incidentColor}18`,
//                               border: `1px solid ${incidentColor}40`
//                             }}
//                           >
//                             <Warning
//                               sx={{
//                                 color: incidentColor
//                               }}
//                             />
//                           </Box>

//                           <Box minWidth={0}>
//                             <Typography
//                               variant="h6"
//                               fontWeight={700}
//                               sx={{
//                                 lineHeight: 1.3,
//                                 overflow: 'hidden',
//                                 textOverflow: 'ellipsis',
//                                 display: '-webkit-box',
//                                 WebkitLineClamp: 2,
//                                 WebkitBoxOrient: 'vertical'
//                               }}
//                             >
//                               {incident.type ||
//                                 'Unknown Incident'}
//                             </Typography>

//                             <Typography
//                               variant="caption"
//                               color="#94a3b8"
//                             >
//                               Incident ID:{' '}
//                               {incident._id
//                                 ?.slice(-6)
//                                 .toUpperCase() || 'N/A'}
//                             </Typography>
//                           </Box>
//                         </Box>

//                         <Chip
//                           label={
//                             incident.severity || 'Active'
//                           }
//                           color={getSeverityColor(
//                             incident.severity
//                           )}
//                           size="small"
//                           sx={{
//                             flexShrink: 0,
//                             fontWeight: 600
//                           }}
//                         />
//                       </Box>

//                       <Stack
//                         spacing={1.5}
//                         sx={{
//                           flexGrow: 1
//                         }}
//                       >
//                         <Box
//                           display="flex"
//                           alignItems="flex-start"
//                           gap={1.2}
//                         >
//                           <LocationOn
//                             sx={{
//                               color: '#38bdf8',
//                               fontSize: 21,
//                               mt: 0.1,
//                               flexShrink: 0
//                             }}
//                           />

//                           <Box minWidth={0}>
//                             <Typography
//                               variant="caption"
//                               color="#94a3b8"
//                             >
//                               Location
//                             </Typography>

//                             <Typography
//                               variant="body2"
//                               color="#e2e8f0"
//                               fontWeight={500}
//                               sx={{
//                                 minHeight: 40,
//                                 overflow: 'hidden',
//                                 display: '-webkit-box',
//                                 WebkitLineClamp: 2,
//                                 WebkitBoxOrient: 'vertical'
//                               }}
//                             >
//                               {incident.address ||
//                                 incident.location ||
//                                 'Location unavailable'}
//                             </Typography>
//                           </Box>
//                         </Box>

//                         <Box
//                           display="flex"
//                           alignItems="flex-start"
//                           gap={1.2}
//                         >
//                           <MyLocation
//                             sx={{
//                               color: '#38bdf8',
//                               fontSize: 20,
//                               mt: 0.1,
//                               flexShrink: 0
//                             }}
//                           />

//                           <Box minWidth={0}>
//                             <Typography
//                               variant="caption"
//                               color="#94a3b8"
//                             >
//                               Coordinates
//                             </Typography>

//                             <Typography
//                               variant="body2"
//                               color="#cbd5e1"
//                             >
//                               {formatCoordinates(incident)}
//                             </Typography>
//                           </Box>
//                         </Box>

//                         <Box
//                           display="flex"
//                           alignItems="flex-start"
//                           gap={1.2}
//                         >
//                           <Videocam
//                             sx={{
//                               color: '#38bdf8',
//                               fontSize: 20,
//                               mt: 0.1,
//                               flexShrink: 0
//                             }}
//                           />

//                           <Box minWidth={0}>
//                             <Typography
//                               variant="caption"
//                               color="#94a3b8"
//                             >
//                               Camera
//                             </Typography>

//                             <Typography
//                               variant="body2"
//                               color="#cbd5e1"
//                               noWrap
//                             >
//                               {getCameraName(incident)}
//                             </Typography>
//                           </Box>
//                         </Box>

//                         <Box
//                           display="flex"
//                           alignItems="flex-start"
//                           gap={1.2}
//                         >
//                           <AccessTime
//                             sx={{
//                               color: '#38bdf8',
//                               fontSize: 20,
//                               mt: 0.1,
//                               flexShrink: 0
//                             }}
//                           />

//                           <Box minWidth={0}>
//                             <Typography
//                               variant="caption"
//                               color="#94a3b8"
//                             >
//                               Reported time
//                             </Typography>

//                             <Typography
//                               variant="body2"
//                               color="#cbd5e1"
//                             >
//                               {formatIncidentDate(
//                                 incident
//                               )}
//                             </Typography>
//                           </Box>
//                         </Box>
//                       </Stack>

//                       <Button
//                         variant="contained"
//                         fullWidth
//                         startIcon={<NavigationIcon />}
//                         onClick={() =>
//                           handleOpenNavigation(incident)
//                         }
//                         sx={{
//                           mt: 3,
//                           minHeight: 44,
//                           borderRadius: 2.5,
//                           textTransform: 'none',
//                           fontWeight: 700,
//                           background:
//                             'linear-gradient(135deg, #0284c7, #2563eb)',
//                           boxShadow:
//                             '0 8px 20px rgba(37, 99, 235, 0.25)',
//                           '&:hover': {
//                             background:
//                               'linear-gradient(135deg, #0369a1, #1d4ed8)',
//                             boxShadow:
//                               '0 10px 24px rgba(37, 99, 235, 0.35)'
//                           }
//                         }}
//                       >
//                         Open GPS Directions
//                       </Button>
//                     </CardContent>
//                   </Card>
//                 </Grid>
//               );
//             })}
//           </Grid>
//         </>
//       )}
//     </Box>
//   );
// };

// export default Navigation;
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

import {
  AccessTime,
  LocationOn,
  MyLocation,
  Navigation as NavigationIcon,
  Refresh,
  Videocam,
  Warning
} from '@mui/icons-material';

import axios from 'axios';

const API_URL = 'http://localhost:4001';

const buildGoogleMapUrl = (incidents) => {
  if (!Array.isArray(incidents) || incidents.length === 0) {
    return null;
  }

  const validIncidents = incidents.filter(
    (incident) =>
      incident.latitude !== null &&
      incident.latitude !== undefined &&
      incident.longitude !== null &&
      incident.longitude !== undefined &&
      !Number.isNaN(Number(incident.latitude)) &&
      !Number.isNaN(Number(incident.longitude))
  );

  if (validIncidents.length === 0) {
    return null;
  }

  const centerLatitude =
    validIncidents.reduce(
      (total, incident) => total + Number(incident.latitude),
      0
    ) / validIncidents.length;

  const centerLongitude =
    validIncidents.reduce(
      (total, incident) => total + Number(incident.longitude),
      0
    ) / validIncidents.length;

  const markers = validIncidents
    .map(
      (incident) =>
        `${Number(incident.latitude)},${Number(incident.longitude)}`
    )
    .join('|');

  return `https://maps.google.com/maps?q=${encodeURIComponent(
    markers
  )}&center=${centerLatitude},${centerLongitude}&z=13&output=embed`;
};

const Navigation = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const colors = {
    textPrimary: theme.palette.text.primary,
    textSecondary: theme.palette.text.secondary,
    accent: theme.palette.primary.main,
    accentBorder: alpha(theme.palette.primary.main, 0.5),
    accentBorderStrong: alpha(theme.palette.primary.main, 0.35),
    accentHoverBg: alpha(theme.palette.primary.main, 0.08),
    accentChipBg: alpha(theme.palette.primary.main, 0.12),
    accentChipBorder: alpha(theme.palette.primary.main, 0.25),
    panelBg: theme.palette.background.paper,
    panelBorder: theme.palette.divider,
    cardBg: isDark
      ? 'linear-gradient(145deg, rgba(30,41,59,0.92), rgba(15,23,42,0.92))'
      : 'linear-gradient(145deg, #ffffff, #f8fafc)',
    cardBorder: theme.palette.divider,
    cardShadowHover: isDark
      ? '0 16px 35px rgba(0,0,0,0.35)'
      : '0 16px 35px rgba(15,23,42,0.12)',
    panelShadow: isDark
      ? '0 8px 32px rgba(0, 0, 0, 0.3)'
      : '0 8px 32px rgba(15, 23, 42, 0.08)'
  };

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [mapError, setMapError] = useState('');

  const fetchIncidents = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');
      setMapError('');

      const token = localStorage.getItem('policeToken');

      const response = await axios.get(`${API_URL}/incidents`, {
        headers: {
          'auth-token': token
        }
      });

      const incidentData = Array.isArray(response.data)
        ? response.data
        : response.data?.incidents || [];

      const activeIncidents = incidentData.filter(
        (incident) => incident.status !== 'Resolved'
      );

      setIncidents(activeIncidents);
    } catch (err) {
      console.error(
        'Unable to load incidents for navigation map:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Unable to load active incident locations. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const mapUrl = useMemo(
    () => buildGoogleMapUrl(incidents),
    [incidents]
  );

  const handleOpenNavigation = (incident) => {
    const hasCoordinates =
      incident.latitude !== null &&
      incident.latitude !== undefined &&
      incident.longitude !== null &&
      incident.longitude !== undefined;

    let navigationUrl;

    if (hasCoordinates) {
      navigationUrl =
        `https://www.google.com/maps/dir/?api=1` +
        `&destination=${incident.latitude},${incident.longitude}`;
    } else {
      const address =
        incident.address ||
        incident.location ||
        'Incident location';

      navigationUrl =
        `https://www.google.com/maps/search/?api=1` +
        `&query=${encodeURIComponent(address)}`;
    }

    window.open(
      navigationUrl,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const getIncidentColor = (type = '') => {
    const normalizedType = type.toLowerCase();

    if (
      normalizedType.includes('weapon') ||
      normalizedType.includes('violence')
    ) {
      return '#ef4444';
    }

    if (
      normalizedType.includes('accident') ||
      normalizedType.includes('aggressive')
    ) {
      return '#f59e0b';
    }

    return '#38bdf8';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical':
        return 'error';

      case 'High':
        return 'warning';

      case 'Medium':
        return 'info';

      case 'Low':
        return 'success';

      default:
        return 'default';
    }
  };

  const getCameraName = (incident) => {
    if (incident.cameraName) {
      return incident.cameraName;
    }

    if (
      incident.cameraId &&
      typeof incident.cameraId === 'object'
    ) {
      return (
        incident.cameraId.cameraName ||
        incident.cameraId.name ||
        'Unknown camera'
      );
    }

    return incident.cameraId || 'Unknown camera';
  };

  const formatIncidentDate = (incident) => {
    const dateValue =
      incident.timestamp ||
      incident.createdAt ||
      incident.detectedAt;

    if (!dateValue) {
      return 'Time unavailable';
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return 'Time unavailable';
    }

    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCoordinates = (incident) => {
    const hasCoordinates =
      incident.latitude !== null &&
      incident.latitude !== undefined &&
      incident.longitude !== null &&
      incident.longitude !== undefined;

    if (!hasCoordinates) {
      return 'Coordinates unavailable';
    }

    const latitude = Number(incident.latitude);
    const longitude = Number(incident.longitude);

    if (
      Number.isNaN(latitude) ||
      Number.isNaN(longitude)
    ) {
      return 'Coordinates unavailable';
    }

    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  };

  return (
    <Box
      p={{ xs: 2, md: 3 }}
      sx={{
        minHeight: '100vh'
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={2}
        mb={3}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
            color={colors.textPrimary}
          >
            Active Incident Maps & Navigation
          </Typography>

          <Typography
            variant="body1"
            color={colors.textSecondary}
            mt={0.5}
          >
            View active emergencies and open GPS directions
            to each incident location.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={
            refreshing ? (
              <CircularProgress
                size={18}
                color="inherit"
              />
            ) : (
              <Refresh />
            )
          }
          disabled={refreshing}
          onClick={() => fetchIncidents(true)}
          sx={{
            color: colors.accent,
            borderColor: colors.accentBorder,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            '&:hover': {
              borderColor: colors.accent,
              backgroundColor: colors.accentHoverBg
            }
          }}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Locations'}
        </Button>
      </Box>

      {loading ? (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight={400}
          gap={2}
        >
          <CircularProgress />

          <Typography color={colors.textSecondary}>
            Loading active incident locations...
          </Typography>
        </Box>
      ) : error ? (
        <Alert
          severity="error"
          sx={{ borderRadius: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => fetchIncidents()}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : incidents.length === 0 ? (
        <Alert
          severity="info"
          sx={{
            borderRadius: 3,
            alignItems: 'center'
          }}
        >
          No active incidents reported. The navigation map
          is currently idle.
        </Alert>
      ) : (
        <>
          <Box
            mb={4}
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              backgroundColor: colors.panelBg,
              boxShadow: colors.panelShadow,
              border: `1px solid ${colors.panelBorder}`
            }}
          >
            <Box
              px={{ xs: 2, md: 3 }}
              py={2}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              gap={2}
            >
              <Box
                display="flex"
                alignItems="center"
                gap={1}
              >
                <MyLocation sx={{ color: colors.accent }} />

                <Typography
                  variant="h6"
                  color={colors.textPrimary}
                  fontWeight={600}
                >
                  Live Incident Map
                </Typography>
              </Box>

              <Chip
                label={`${incidents.length} active ${
                  incidents.length === 1
                    ? 'incident'
                    : 'incidents'
                }`}
                size="small"
                sx={{
                  color: colors.accent,
                  backgroundColor: colors.accentChipBg,
                  border: `1px solid ${colors.accentChipBorder}`,
                  fontWeight: 600
                }}
              />
            </Box>

            {mapError ? (
              <Alert severity="error">
                {mapError}
              </Alert>
            ) : mapUrl ? (
              <iframe
                title="Active emergencies navigation map"
                src={mapUrl}
                width="100%"
                height="450"
                style={{
                  display: 'block',
                  border: 0
                }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                onError={() =>
                  setMapError(
                    'Unable to load Google Map. Please try again.'
                  )
                }
              />
            ) : (
              <Alert severity="warning">
                Active incidents were found, but valid
                coordinates are unavailable.
              </Alert>
            )}
          </Box>

          <Box mb={2}>
            <Typography
              variant="h5"
              color={colors.textPrimary}
              fontWeight={700}
            >
              Active Incident Locations
            </Typography>

            <Typography
              variant="body2"
              color={colors.textSecondary}
              mt={0.5}
            >
              Select an incident to open turn-by-turn GPS
              directions.
            </Typography>
          </Box>

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
            {incidents.map((incident) => {
              const incidentColor =
                getIncidentColor(incident.type);

              return (
                <Box
                  key={incident._id}
                  sx={{
                    display: 'flex',
                    height: 400
                  }}
                >
                  <Card
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      color: colors.textPrimary,
                      background: colors.cardBg,
                      backdropFilter: 'blur(12px)',
                      border: `1px solid ${colors.cardBorder}`,
                      borderTop: `4px solid ${incidentColor}`,
                      borderRadius: 4,
                      overflow: 'hidden',
                      transition:
                        'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: colors.cardShadowHover,
                        borderColor: colors.accentBorderStrong
                      }
                    }}
                  >
                    <CardContent
                      sx={{
                        p: 3,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        '&:last-child': {
                          pb: 3
                        }
                      }}
                    >
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        gap={2}
                        mb={2}
                      >
                        <Box
                          display="flex"
                          alignItems="flex-start"
                          gap={1.2}
                          minWidth={0}
                        >
                          <Box
                            sx={{
                              width: 42,
                              height: 42,
                              borderRadius: 2.5,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              backgroundColor: `${incidentColor}18`,
                              border: `1px solid ${incidentColor}40`
                            }}
                          >
                            <Warning
                              sx={{
                                color: incidentColor
                              }}
                            />
                          </Box>

                          <Box minWidth={0}>
                            <Typography
                              variant="h6"
                              fontWeight={700}
                              sx={{
                                lineHeight: 1.3,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}
                            >
                              {incident.type ||
                                'Unknown Incident'}
                            </Typography>

                            <Typography
                              variant="caption"
                              color={colors.textSecondary}
                            >
                              Incident ID:{' '}
                              {incident._id
                                ?.slice(-6)
                                .toUpperCase() || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>

                        <Chip
                          label={
                            incident.severity || 'Active'
                          }
                          color={getSeverityColor(
                            incident.severity
                          )}
                          size="small"
                          sx={{
                            flexShrink: 0,
                            fontWeight: 600
                          }}
                        />
                      </Box>

                      <Stack
                        spacing={1.5}
                        sx={{
                          flexGrow: 1,
                          overflow: 'hidden'
                        }}
                      >
                        <Box
                          display="flex"
                          alignItems="flex-start"
                          gap={1.2}
                        >
                          <LocationOn
                            sx={{
                              color: colors.accent,
                              fontSize: 21,
                              mt: 0.1,
                              flexShrink: 0
                            }}
                          />

                          <Box minWidth={0}>
                            <Typography
                              variant="caption"
                              color={colors.textSecondary}
                            >
                              Location
                            </Typography>

                            <Typography
                              variant="body2"
                              color={colors.textPrimary}
                              fontWeight={500}
                              sx={{
                                height: 40,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                wordBreak: 'break-word'
                              }}
                            >
                              {incident.address ||
                                incident.location ||
                                'Location unavailable'}
                            </Typography>
                          </Box>
                        </Box>

                        <Box
                          display="flex"
                          alignItems="flex-start"
                          gap={1.2}
                        >
                          <MyLocation
                            sx={{
                              color: colors.accent,
                              fontSize: 20,
                              mt: 0.1,
                              flexShrink: 0
                            }}
                          />

                          <Box minWidth={0}>
                            <Typography
                              variant="caption"
                              color={colors.textSecondary}
                            >
                              Coordinates
                            </Typography>

                            <Typography
                              variant="body2"
                              color={colors.textSecondary}
                            >
                              {formatCoordinates(incident)}
                            </Typography>
                          </Box>
                        </Box>

                        <Box
                          display="flex"
                          alignItems="flex-start"
                          gap={1.2}
                        >
                          <Videocam
                            sx={{
                              color: colors.accent,
                              fontSize: 20,
                              mt: 0.1,
                              flexShrink: 0
                            }}
                          />

                          <Box minWidth={0}>
                            <Typography
                              variant="caption"
                              color={colors.textSecondary}
                            >
                              Camera
                            </Typography>

                            <Typography
                              variant="body2"
                              color={colors.textSecondary}
                              noWrap
                            >
                              {getCameraName(incident)}
                            </Typography>
                          </Box>
                        </Box>

                        <Box
                          display="flex"
                          alignItems="flex-start"
                          gap={1.2}
                        >
                          <AccessTime
                            sx={{
                              color: colors.accent,
                              fontSize: 20,
                              mt: 0.1,
                              flexShrink: 0
                            }}
                          />

                          <Box minWidth={0}>
                            <Typography
                              variant="caption"
                              color={colors.textSecondary}
                            >
                              Reported time
                            </Typography>

                            <Typography
                              variant="body2"
                              color={colors.textSecondary}
                            >
                              {formatIncidentDate(
                                incident
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      </Stack>

                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<NavigationIcon />}
                        onClick={() =>
                          handleOpenNavigation(incident)
                        }
                        sx={{
                          mt: 3,
                          minHeight: 44,
                          borderRadius: 2.5,
                          textTransform: 'none',
                          fontWeight: 700,
                          background:
                            'linear-gradient(135deg, #0284c7, #2563eb)',
                          boxShadow:
                            '0 8px 20px rgba(37, 99, 235, 0.25)',
                          '&:hover': {
                            background:
                              'linear-gradient(135deg, #0369a1, #1d4ed8)',
                            boxShadow:
                              '0 10px 24px rgba(37, 99, 235, 0.35)'
                          }
                        }}
                      >
                        Open GPS Directions
                      </Button>
                    </CardContent>
                  </Card>
                </Box>
              );
            })}
          </Box>
        </>
      )}
    </Box>
  );
};

export default Navigation;