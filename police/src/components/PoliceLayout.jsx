
import React, { useContext, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';


import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from "@mui/material";
import {
  Dashboard, NotificationsActive, ReportProblem, Explore, GroupAdd, CheckCircle, Assignment, Logout,
  Brightness4, Brightness7, LocalPolice as LocalPoliceIcon
} from '@mui/icons-material';
import { ThemeContext } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import NotificationMenu from './NotificationMenu';
import { Person } from '@mui/icons-material';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Alerts', icon: <NotificationsActive />, path: '/alerts' },
  { text: 'Incidents', icon: <ReportProblem />, path: '/incidents' },
  { text: 'Navigation', icon: <Explore />, path: '/navigation' },
  { text: 'Backup', icon: <GroupAdd />, path: '/backup' },
  // { text: 'Resolved', icon: <CheckCircle />, path: '/resolved' },
  { text: 'Voilation detected', icon: <Assignment />, path: '/Voilationincident' },
  {
  text: "Manage Profile",
  icon: <Person />,
  path: "/ManageProfile",
}
];

const PoliceLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useContext(ThemeContext);
const [logoutDialog, setLogoutDialog] = useState(false);
  const handleLogout = () => {
    localStorage.removeItem('policeToken');
    navigate('/login');
  };

  const isLight = mode === 'light';
  const drawerBg = isLight ? '#ffffff' : '#1e1e1e';
  const headerBg = isLight ? '#f57c00' : '#1e1e1e'; // Orange header in light mode
  const borderColor = isLight ? '#e0e0e0' : '#333333';
  const activeBg = isLight ? '#fff8e1' : 'rgba(255, 183, 77, 0.1)';
  const activeText = isLight ? '#f57c00' : '#ffb74d';
  const inactiveText = isLight ? '#666666' : '#aaaaaa';
  const hoverBg = isLight ? '#f5f5f5' : 'rgba(255, 183, 77, 0.05)';

  return (
    <Box sx={{ display: 'flex' }} className="min-h-screen">
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ 
          width: { sm: `calc(100% - ${drawerWidth}px)` }, 
          ml: { sm: `${drawerWidth}px` }, 
          bgcolor: headerBg, 
          borderBottom: isLight ? 'none' : '2px solid #ffb74d',
          transition: 'all 0.3s'
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Field Officer System
          </Typography>
          <NotificationMenu isLight={isLight} />
          <IconButton sx={{ ml: 1 }} onClick={toggleTheme} color="inherit">
            {isLight ? <Brightness4 /> : <Brightness7 />}
          </IconButton>
     <IconButton
  color="inherit"
  onClick={() => setLogoutDialog(true)}
  sx={{ ml: 1 }}
>
  <Logout />
</IconButton>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth, 
              bgcolor: drawerBg,
              borderRight: `1px solid ${borderColor}`,
              transition: 'all 0.3s'
            },
          }}
          open
        >
          <Toolbar>
            <LocalPoliceIcon sx={{ color: activeText, mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: activeText }}>
              POLICE UNIT
            </Typography>
          </Toolbar>
          <Divider sx={{ borderColor }} />
          <List>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton 
                    component={Link} 
                    to={item.path}
                    selected={isActive}
                    sx={{
                      margin: '4px 8px',
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                      '&.Mui-selected': {
                        bgcolor: activeBg,
                        color: activeText,
                      },
                      '&:hover': {
                        bgcolor: hoverBg,
                        transform: 'translateX(4px)'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: isActive ? activeText : inactiveText, minWidth: '40px' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      sx={{ color: isActive ? activeText : inactiveText, '& .MuiTypography-root': { fontWeight: isActive ? 600 : 400 } }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, bgcolor: 'background.default', minHeight: '100vh', transition: 'all 0.3s' }}
      >
        <Toolbar />
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </Box>
      <Dialog
  open={logoutDialog}
  onClose={() => setLogoutDialog(false)}
  PaperProps={{
    sx: {
      borderRadius: 3,
      p: 1,
    },
  }}
>
  <DialogTitle sx={{ fontWeight: "bold", color: "#f57c00" }}>
    Logout
  </DialogTitle>

  <DialogContent>
    <DialogContentText>
      Are you sure you want to logout from the Police Officer System?
    </DialogContentText>
  </DialogContent>

  <DialogActions sx={{ p: 2 }}>
    <Button
      variant="outlined"
      onClick={() => setLogoutDialog(false)}
    >
      Cancel
    </Button>

    <Button
      variant="contained"
      color="error"
      onClick={handleLogout}
    >
      Logout
    </Button>
  </DialogActions>
</Dialog>
    </Box>
  );
};

export default PoliceLayout;
