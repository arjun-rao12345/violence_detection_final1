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
    const saved = localStorage.getItem('notifications_admin');
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
    localStorage.setItem('notifications_admin', JSON.stringify(updated));
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
        message: `Notification sent to ${payload.name} (${payload.email}) - ${payload.stationName}`,
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
        return <Notifications sx={{ color: '#94a3b8' }} />;
    }
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={{
          mr: 1.5,
          color: isLight ? '#0f172a' : '#e2e8f0',
          bgcolor: isLight ? '#eef5ff' : '#111c33',
          border: `1px solid ${isLight ? '#dbe3ee' : '#22314a'}`,
          transition: 'all 0.25s ease',
          '&:hover': {
            bgcolor: isLight ? '#e2efff' : '#1a294d',
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
            bgcolor: isLight ? '#ffffff' : '#0f172a',
            border: `1px solid ${isLight ? '#dbe3ee' : '#22314a'}`,
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
                  bgcolor: notif.read ? 'transparent' : (isLight ? '#f8fafc' : '#1e293b'),
                  borderBottom: `1px solid ${isLight ? '#f1f5f9' : '#1e293b'}`,
                  '&:hover': {
                    bgcolor: isLight ? '#f1f5f9' : '#334155',
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
