// import React, { useContext } from 'react';
// import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
// import {
//   Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton,
//   ListItem, ListItemButton, ListItemIcon, ListItemText, CssBaseline
// } from '@mui/material';
// import {
//   Dashboard, LocalPolice, Videocam, Warning, RemoveRedEye,
//   Report, InsertPhoto, DirectionsCar, Map, Logout, NotificationsActive,
//   Brightness4, Brightness7
// } from '@mui/icons-material';
// import { ThemeContext } from '../context/ThemeContext';
// import { motion } from 'framer-motion';

// const drawerWidth = 280;

// const menuItems = [
//   { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
//     { text: 'Police Stations', icon: <LocalPolice />, path: '/PoliceStations' },
//   { text: 'Officers', icon: <LocalPolice />, path: '/officers' },

//   { text: 'Cameras', icon: <Videocam />, path: '/cameras' },
//   { text: 'Monitoring', icon: <RemoveRedEye />, path: '/monitoring' },
//   { text: 'Detection', icon: <Warning />, path: '/detection' },
//   { text: 'Alerts', icon: <NotificationsActive />, path: '/alerts' },
//   { text: 'Reports', icon: <Report />, path: '/reports' },
//   { text: 'Evidence', icon: <InsertPhoto />, path: '/evidence' },
//   { text: 'Response Status', icon: <DirectionsCar />, path: '/response-status' },
//   { text: 'Map', icon: <Map />, path: '/map' },
// ];

// const AdminLayout = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { mode, toggleTheme } = useContext(ThemeContext);

//   const handleLogout = () => {
//     localStorage.removeItem('userToken');
//     navigate('/login');
//   };

//   const isLight = mode === 'light';
//   const drawerBg = isLight ? '#ffffff' : '#0a192f';
//   const headerBg = isLight ? '#1976d2' : '#112240';
//   const borderColor = isLight ? '#e0e0e0' : '#233554';
//   const activeBg = isLight ? '#e3f2fd' : '#172a45';
//   const activeText = isLight ? '#1976d2' : '#64ffda';
//   const inactiveText = isLight ? '#666666' : '#8892b0';

//   return (
//     <Box sx={{ display: 'flex' }} className="min-h-screen">
//       <CssBaseline />
//       <AppBar
//         position="fixed"
//         sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px`, bgcolor: headerBg, transition: 'all 0.3s' }}
//       >
//         <Toolbar>
//           <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
//             Command Center
//           </Typography>
//           <IconButton sx={{ ml: 1 }} onClick={toggleTheme} color="inherit">
//             {isLight ? <Brightness4 /> : <Brightness7 />}
//           </IconButton>
//           <IconButton color="inherit" onClick={handleLogout} sx={{ ml: 1 }}>
//             <Logout />
//           </IconButton>
//         </Toolbar>
//       </AppBar>
//       <Drawer
//         sx={{
//           width: drawerWidth,
//           flexShrink: 0,
//           '& .MuiDrawer-paper': {
//             width: drawerWidth,
//             boxSizing: 'border-box',
//             bgcolor: drawerBg,
//             borderRight: `1px solid ${borderColor}`,
//             transition: 'all 0.3s'
//           },
//         }}
//         variant="permanent"
//         anchor="left"
//       >
//         <Toolbar>
//           <Typography variant="h6" sx={{ fontWeight: 'bold', color: activeText, textAlign: 'center', width: '100%' }}>
//             VIOLATION ADMIN
//           </Typography>
//         </Toolbar>
//         <Divider sx={{ borderColor }} />
//         <List>
//           {menuItems.map((item) => {
//             const isActive = location.pathname === item.path;
//             return (
//               <ListItem key={item.text} disablePadding>
//                 <ListItemButton
//                   component={Link}
//                   to={item.path}
//                   selected={isActive}
//                   sx={{
//                     margin: '4px 8px',
//                     borderRadius: '8px',
//                     transition: 'all 0.2s',
//                     '&.Mui-selected': {
//                       bgcolor: activeBg,
//                       color: activeText,
//                     },
//                     '&:hover': {
//                       bgcolor: isLight ? '#f5f5f5' : '#172a45',
//                       transform: 'translateX(4px)'
//                     }
//                   }}
//                 >
//                   <ListItemIcon sx={{ color: isActive ? activeText : inactiveText, minWidth: '40px' }}>
//                     {item.icon}
//                   </ListItemIcon>
//                   <ListItemText
//                     primary={item.text}
//                     sx={{ color: isActive ? activeText : inactiveText, '& .MuiTypography-root': { fontWeight: isActive ? 600 : 400 } }}
//                   />
//                 </ListItemButton>
//               </ListItem>
//             );
//           })}
//         </List>
//       </Drawer>
//       <Box
//         component="main"
//         sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3, width: `calc(100% - ${drawerWidth}px)`, minHeight: '100vh', transition: 'all 0.3s' }}
//       >
//         <Toolbar />
//         <motion.div
//           key={location.pathname}
//           initial={{ opacity: 0, y: 10 }}
//           animate={{ opacity: 1, y: 0 }}
//           exit={{ opacity: 0, y: -10 }}
//           transition={{ duration: 0.3 }}
//         >
//           <Outlet />
//         </motion.div>
//       </Box>
//     </Box>
//   );
// };

// export default AdminLayout;
import React, { useContext } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton,
  ListItem, ListItemButton, ListItemIcon, ListItemText, CssBaseline, Paper
} from '@mui/material';
import {
  Dashboard, LocalPolice, Videocam, Warning, RemoveRedEye,
  Report, InsertPhoto, DirectionsCar, Map, Logout, NotificationsActive,
  Brightness4, Brightness7, Shield, Assignment
} from '@mui/icons-material';
import { ThemeContext } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import NotificationMenu from './NotificationMenu';

const drawerWidth = 290;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Police Stations', icon: <LocalPolice />, path: '/PoliceStations' },
  { text: 'Officers', icon: <LocalPolice />, path: '/officers' },
  { text: 'Cameras', icon: <Videocam />, path: '/cameras' },
  // { text: 'Monitoring', icon: <RemoveRedEye />, path: '/monitoring' },
  { text: 'Violence Detected', icon: <Assignment />, path: '/violence-incidents' },
  { text: 'Alerts', icon: <NotificationsActive />, path: '/alerts' },
  { text: 'Reports', icon: <Report />, path: '/reports' },
  { text: 'Evidence', icon: <InsertPhoto />, path: '/evidence' },
  // { text: 'Response Status', icon: <DirectionsCar />, path: '/response-status' },
  // { text: 'Map', icon: <Map />, path: '/map' },
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useContext(ThemeContext);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userToken');
    localStorage.removeItem('adminData');
    navigate('/login');
  };

  const isLight = mode === 'light';

  const colors = {
    appBg: isLight ? '#f5f7fb' : '#07111f',
    drawerBg: isLight ? 'rgba(255,255,255,0.82)' : 'rgba(10,18,35,0.82)',
    appBarBg: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(10,18,35,0.72)',
    cardBg: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(15,23,42,0.72)',
    border: isLight ? '#dbe3ee' : '#22314a',
    textPrimary: isLight ? '#0f172a' : '#e2e8f0',
    textSecondary: isLight ? '#64748b' : '#94a3b8',
    accent: '#f97316',
    accentSoft: isLight ? '#fff4eb' : '#1e293b',
    hoverBg: isLight ? '#eef5ff' : '#111c33',
    activeBg: isLight
      ? 'linear-gradient(135deg, #fff7ed 0%, #ffe4c7 100%)'
      : 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
    danger: '#ef4444',
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: colors.appBg }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          bgcolor: colors.appBarBg,
          backdropFilter: 'blur(18px)',
          borderBottom: `1px solid ${colors.border}`,
          color: colors.textPrimary,
          transition: 'all 0.35s ease',
        }}
      >
        <Toolbar sx={{ minHeight: 72 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4, flexGrow: 1 }}>
            <Paper
              sx={{
                width: 44,
                height: 44,
                borderRadius: 3,
                display: 'grid',
                placeItems: 'center',
                bgcolor: colors.accent,
                color: '#fff',
                boxShadow: '0 12px 30px rgba(249,115,22,0.35)',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                '&:hover': {
                  transform: 'rotate(6deg) scale(1.05)',
                  boxShadow: '0 16px 36px rgba(249,115,22,0.45)',
                },
              }}
            >
              <Shield fontSize="small" />
            </Paper>

            <Box>
              <Typography variant="caption" sx={{ color: colors.textSecondary, letterSpacing: 1.5 }}>
                VIOLATION DETECTION SYSTEM
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                Admin Control Center
              </Typography>
            </Box>
          </Box>

          <NotificationMenu isLight={isLight} />

          <IconButton
            onClick={toggleTheme}
            sx={{
              mr: 1.2,
              color: colors.textPrimary,
              bgcolor: colors.accentSoft,
              border: `1px solid ${colors.border}`,
              transition: 'all 0.25s ease',
              '&:hover': {
                bgcolor: colors.hoverBg,
                transform: 'translateY(-2px)',
              },
            }}
          >
            {isLight ? <Brightness4 /> : <Brightness7 />}
          </IconButton>

          <IconButton
            onClick={handleLogout}
            sx={{
              color: '#fff',
              bgcolor: colors.danger,
              borderRadius: 2,
              px: 1.5,
              transition: 'all 0.25s ease',
              '&:hover': {
                bgcolor: '#dc2626',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        anchor="left"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: colors.drawerBg,
            color: colors.textPrimary,
            borderRight: `1px solid ${colors.border}`,
            backdropFilter: 'blur(18px)',
            transition: 'all 0.35s ease',
          },
        }}
      >
        <Box sx={{ px: 2.2, pt: 2.2, pb: 1.5 }}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 4,
              bgcolor: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.9)',
              border: `1px solid ${colors.border}`,
              boxShadow: 'none',
              transition: 'transform 0.25s ease, background 0.25s ease',
              '&:hover': { transform: 'translateY(-2px)' },
            }}
          >
            <Typography variant="overline" sx={{ color: colors.textSecondary, letterSpacing: 1.5 }}>
              Security Suite
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, color: colors.accent, lineHeight: 1.1 }}>
              VIOLATION ADMIN
            </Typography>
            <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.5 }}>
              Detect, monitor, alert, and respond.
            </Typography>
          </Paper>
        </Box>

        <Divider sx={{ borderColor: colors.border }} />

        <List sx={{ px: 1.2, py: 1.2 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.8 }}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={isActive}
                  sx={{
                    borderRadius: 3,
                    px: 1.8,
                    py: 1.2,
                    transition: 'all 0.28s ease',
                    border: `1px solid ${isActive ? colors.accent : 'transparent'}`,
                    bgcolor: isActive ? colors.activeBg : 'transparent',
                    boxShadow: isActive ? '0 12px 30px rgba(0,0,0,0.12)' : 'none',
                    '&.Mui-selected': {
                      bgcolor: colors.activeBg,
                    },
                    '&:hover': {
                      bgcolor: colors.hoverBg,
                      transform: 'translateX(6px)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 42,
                      color: isActive ? colors.accent : colors.textSecondary,
                      transition: 'all 0.25s ease',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 800 : 500,
                      fontSize: 14.5,
                      color: isActive ? colors.textPrimary : colors.textSecondary,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: colors.appBg,
          p: 3,
          minHeight: '100vh',
          width: `calc(100% - ${drawerWidth}px)`,
        }}
      >
        <Toolbar />
        <Box
          sx={{
            border: `1px solid ${colors.border}`,
            borderRadius: 4,
            bgcolor: colors.cardBg,
            backdropFilter: 'blur(18px)',
            minHeight: 'calc(100vh - 120px)',
            p: 3,
            boxShadow: '0 18px 50px rgba(0,0,0,0.10)',
            transition: 'all 0.35s ease',
          }}
        >
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;