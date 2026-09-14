import React, { useEffect, useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button
} from '@mui/material';
import {
  Notifications,
  Warning,
  Mail,
  LocalPolice,
  Circle
} from '@mui/icons-material';
import socket from '../lib/socket';

const NotificationMenu = ({ isLight }) => {
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  // Load saved notifications from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('notifications_police');
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  // Sync to localStorage
  const saveNotifications = (updated) => {
    setNotifications(updated);
    localStorage.setItem('notifications_police', JSON.stringify(updated));
  };

  useEffect(() => {
    const handleViolence = (payload) => {
      const newNotif = {
        id: Date.now() + Math.random().toString(),
        type: 'violence',
        title: 'Violence Detected',
        message: `Critical threat detected by camera ${payload.cameraName || 'Camera'}!`,
        time: new Date().toLocaleTimeString(),
        timestamp: new Date().toISOString(),
        read: false
      };
      saveNotifications([newNotif, ...notifications].slice(0, 50));
    };

    const handleBackup = (payload) => {
      const newNotif = {
        id: Date.now() + Math.random().toString(),
        type: 'backup',
        title: 'Backup Requested',
        message: `${payload.fromOfficerName || 'Officer'} from ${payload.fromStationName || 'Station'} requested backup under ${payload.targetStationName || 'Station'}.`,
        time: new Date().toLocaleTimeString(),
        timestamp: new Date().toISOString(),
        read: false
      };
      saveNotifications([newNotif, ...notifications].slice(0, 50));
    };

    const handleEmail = (payload) => {
      const newNotif = {
        id: Date.now() + Math.random().toString(),
        type: 'email',
        title: 'Email Alert Sent',
        message: `Notification email sent to ${payload.name} (${payload.email})`,
        time: new Date().toLocaleTimeString(),
        timestamp: new Date().toISOString(),
        read: false
      };
      saveNotifications([newNotif, ...notifications].slice(0, 50));
    };

    socket.connect();
    socket.on('violence:detected', handleViolence);
    socket.on('support:requested', handleBackup);
    socket.on('email:sent', handleEmail);

    return () => {
      socket.off('violence:detected', handleViolence);
      socket.off('support:requested', handleBackup);
      socket.off('email:sent', handleEmail);
    };
  }, [notifications]);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const clearAll = () => {
    saveNotifications([]);
    handleClose();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type) => {
    switch (type) {
      case 'violence':
        return <Warning sx={{ color: '#ef4444' }} />;
      case 'backup':
        return <LocalPolice sx={{ color: '#f57c00' }} />;
      case 'email':
        return <Mail sx={{ color: '#3b82f6' }} />;
      default:
        return <Notifications sx={{ color: '#ffb74d' }} />;
    }
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={{
          mr: 1.5,
          color: '#fff',
          bgcolor: isLight ? 'rgba(255,255,255,0.15)' : 'rgba(255,183,77,0.1)',
          border: `1px solid ${isLight ? 'rgba(255,255,255,0.25)' : '#333333'}`,
          transition: 'all 0.25s ease',
          '&:hover': {
            bgcolor: isLight ? 'rgba(255,255,255,0.25)' : 'rgba(255,183,77,0.2)',
            transform: 'translateY(-2px)',
          },
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <Notifications />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            borderRadius: 4,
            mt: 1.5,
            bgcolor: isLight ? '#ffffff' : '#1e1e1e',
            border: `1px solid ${isLight ? '#e0e0e0' : '#333333'}`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Activity Feed
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={markAllRead} sx={{ fontSize: 12 }}>
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />

        <List sx={{ p: 0, overflowY: 'auto', maxHeight: 380 }}>
          {notifications.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                No recent activity.
              </Typography>
            </Box>
          ) : (
            notifications.map((notif) => (
              <MenuItem
                key={notif.id}
                onClick={() => {
                  const updated = notifications.map(n => n.id === notif.id ? { ...n, read: true } : n);
                  saveNotifications(updated);
                }}
                sx={{
                  whiteSpace: 'normal',
                  py: 1.5,
                  px: 2,
                  bgcolor: notif.read ? 'transparent' : (isLight ? '#f9f9f9' : '#292929'),
                  borderBottom: `1px solid ${isLight ? '#e0e0e0' : '#2d2d2d'}`,
                  '&:hover': {
                    bgcolor: isLight ? '#f5f5f5' : '#3a3a3a',
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {getIcon(notif.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {notif.title}
                      </Typography>
                      {!notif.read && (
                        <Circle sx={{ fontSize: 8, color: '#3b82f6' }} />
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="caption" display="block" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        {notif.message}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 10, display: 'block', mt: 0.5 }}>
                        {notif.time}
                      </Typography>
                    </>
                  }
                />
              </MenuItem>
            ))
          )}
        </List>

        <Divider />
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
          <Button size="small" fullWidth color="inherit" onClick={clearAll} sx={{ fontSize: 12 }}>
            Clear All
          </Button>
        </Box>
      </Menu>
    </>
  );
};

export default NotificationMenu;
