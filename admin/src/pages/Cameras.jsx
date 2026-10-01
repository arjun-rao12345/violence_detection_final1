

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  IconButton,
  MenuItem,
  Divider,
  Alert
} from '@mui/material';

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents
} from 'react-leaflet';

import L from 'leaflet';

import LocationOnIcon from '@mui/icons-material/LocationOn';
import MyLocationIcon from '@mui/icons-material/MyLocation';
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
});

import {
  Add,
  Edit,
  Delete,
  Videocam,
  VideocamOff,
  PlayArrow,
  Stop,
  Fullscreen,
  Close
} from '@mui/icons-material';

import axios from 'axios';
import { motion } from 'framer-motion';
import socket from '../lib/socket';

const LocalWebcamPreview = ({ cameraName, fullScreen = false }) => {
  const videoRef = React.useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let stream;
    let cancelled = false;

    const startWebcam = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Local webcam is not supported by this browser.');
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((e) => console.error('Play error:', e));
          };
        }
      } catch (webcamError) {
        console.error('Unable to access local webcam:', webcamError);
        setError(
          webcamError.name === 'NotAllowedError'
            ? 'Camera permission was denied.'
            : 'Unable to access the local webcam.'
        );
      }
    };

    startWebcam();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  if (error) {
    return (
      <Box textAlign="center" color="text.secondary" px={2}>
        <VideocamOff sx={{ fontSize: 42, color: 'text.disabled' }} />
        <Typography variant="caption" display="block">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      aria-label={`${cameraName} local webcam preview`}
      style={{
        width: '100%',
        height: '100%',
        objectFit: fullScreen ? 'contain' : 'cover',
        backgroundColor: '#111'
      }}
    />
  );
};

const initialFormData = {
  cameraName: '',
  latitude: '',
  longitude: '',
  address: '',
  streamUrl: '',
  ipAddress: '',
  resolution: '1080p',
  nightVision: true,
  status: 'Active',
  policeStationId: ''
};

const CARD_WIDTH = 340;
const CARD_HEIGHT = 650;

const Cameras = () => {
  const [cameras, setCameras] = useState([]);
  const [open, setOpen] = useState(false);
  const defaultMapCenter = [12.9141, 74.856];

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  const selectedPosition = useMemo(() => {
    const latitude = Number(formData.latitude);
    const longitude = Number(formData.longitude);

    const isValid =
      formData.latitude !== '' &&
      formData.longitude !== '' &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180;

    return isValid ? [latitude, longitude] : null;
  }, [formData.latitude, formData.longitude]);

  const [editingId, setEditingId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [policeStations, setPoliceStations] = useState([]);

  const [message, setMessage] = useState('');
  const [messageSeverity, setMessageSeverity] = useState('info');
const [previewOpen, setPreviewOpen] = useState(false);
const [previewCameraId, setPreviewCameraId] = useState(null);
  useEffect(() => {
    fetchCameras();

    socket.connect();

    fetchPoliceStations();

    socket.on('detection:prediction', handlePrediction);
    socket.on('camera:error', handleError);
    socket.on('camera:started', handleStarted);
    socket.on('camera:stopped', handleStopped);
    socket.on('camera:preview', handlePreview);
    socket.on('violence:detected', handleViolence);

    return () => {
      socket.off('detection:prediction', handlePrediction);
      socket.off('camera:error', handleError);
      socket.off('camera:started', handleStarted);
      socket.off('camera:stopped', handleStopped);
      socket.off('camera:preview', handlePreview);
      socket.off('violence:detected', handleViolence);

      socket.disconnect();
    };
  }, []);

  const handleMapLocationSelect = ({ latitude, longitude }) => {
    setFormData((previousData) => ({
      ...previousData,
      latitude,
      longitude
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      latitude: '',
      longitude: ''
    }));
  };

  const handleAddressSelect = (address) => {
    setFormData((previousData) => ({
      ...previousData,
      address
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      address: ''
    }));
  };

  const showMessage = (text, severity = 'info') => {
    setMessage(text);
    setMessageSeverity(severity);
  };

  // FIX #1: only stamp a new cache-busting timestamp when a preview frame
  // actually arrives for THIS camera — not on every render/socket event.
  const handlePrediction = (payload) => {
    setCameras((previousCameras) =>
      previousCameras.map((camera) =>
        camera._id === payload.cameraId
          ? {
              ...camera,
              detectionStatus: payload.label,
              lastDetectionConfidence: payload.confidence,
              lastDetectionTime: payload.timestamp,
              lastError: ''
            }
          : camera
      )
    );
  };

  const handlePreview = (payload) => {
    setCameras((previousCameras) =>
      previousCameras.map((camera) =>
        camera._id === payload.cameraId
          ? {
              ...camera,
              previewUrl: payload.imageUrl,
              previewUpdatedAt: Date.now() // <-- stamped ONLY here
            }
          : camera
      )
    );
  };

  const handleError = (payload) => {
    setCameras((previousCameras) =>
      previousCameras.map((camera) =>
        camera._id === payload.cameraId
          ? {
              ...camera,
              status: 'Error',
              lastError: payload.message
            }
          : camera
      )
    );

    showMessage(payload.message || 'Camera error occurred.', 'error');
  };

  const handleStarted = (payload) => {
    setCameras((previousCameras) =>
      previousCameras.map((camera) =>
        camera._id === payload.cameraId
          ? {
              ...camera,
              status: 'Active',
              detectionStatus: 'Running',
              lastError: ''
            }
          : camera
      )
    );

    showMessage(
      `Detection started for ${payload.cameraName || payload.cameraId}.`,
      'success'
    );
  };

  const handleStopped = (payload) => {
    setCameras((previousCameras) =>
      previousCameras.map((camera) =>
        camera._id === payload.cameraId
          ? {
              ...camera,
              status: 'Inactive',
              detectionStatus: 'Idle',
              lastDetectionConfidence: 0,
              lastError: ''
            }
          : camera
      )
    );

    showMessage(
      `Detection stopped for ${payload.cameraName || payload.cameraId}.`,
      'info'
    );
  };

  const handleViolence = (payload) => {
    setCameras((previousCameras) =>
      previousCameras.map((camera) =>
        camera._id === payload.cameraId
          ? {
              ...camera,
              detectionStatus: 'Critical',
              lastDetectionConfidence: payload.confidence || 0,
              lastDetectionTime: payload.timestamp
            }
          : camera
      )
    );

    showMessage(
      `Violence confirmed for ${payload.cameraName || payload.cameraId}.`,
      'error'
    );
  };

  const fetchCameras = async () => {
    try {
      const token = localStorage.getItem('adminToken');

      const response = await axios.get('http://localhost:4001/cameras', {
        headers: { 'auth-token': token }
      });

      const cameraData = Array.isArray(response.data)
        ? response.data
        : response.data.cameras || [];

      setCameras(cameraData);
    } catch (error) {
      console.error('Camera fetch error:', error);
      setCameras([]);
      showMessage('Unable to load camera list from the backend.', 'error');
    }
  };

  const fetchPoliceStations = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        'http://localhost:4001/policeStation/getAllPoliceStations',
        { headers: { 'auth-token': token } }
      );
      setPoliceStations(response.data.data || []);
    } catch (error) {
      console.error('Police station fetch error:', error);
      setPoliceStations([]);
      showMessage(
        'Unable to load police stations for camera assignment.',
        'error'
      );
    }
  };

  const handleOpen = (camera = null) => {
    setErrors({});
    setMessage('');

    if (camera) {
      setEditingId(camera._id);

      setFormData({
        cameraName: camera.cameraName || '',
        latitude:
          camera.latitude !== undefined && camera.latitude !== null
            ? String(camera.latitude)
            : '',
        longitude:
          camera.longitude !== undefined && camera.longitude !== null
            ? String(camera.longitude)
            : '',
        address: camera.address || '',
        streamUrl: camera.streamUrl || '',
        ipAddress: camera.ipAddress || '',
        resolution: camera.resolution || '1080p',
        nightVision:
          camera.nightVision !== undefined ? camera.nightVision : true,
        status: camera.status || 'Active',
        policeStationId:
          camera.policeStationId?._id || camera.policeStationId || ''
      });
    } else {
      setEditingId(null);
      setFormData(initialFormData);
    }

    setOpen(true);
  };

  const handleClose = () => {
    if (saving) return;

    setOpen(false);
    setEditingId(null);
    setErrors({});
    setFormData(initialFormData);
  };

  const validateCameraName = (cameraName) => {
    const value = cameraName.trim();

    if (!value) return 'Camera name is required.';
    if (value.length < 3) return 'Camera name must contain at least 3 characters.';
    if (value.length > 50) return 'Camera name must not exceed 50 characters.';

    const cameraNamePattern = /^[A-Za-z0-9][A-Za-z0-9\s._()-]*$/;
    if (!cameraNamePattern.test(value)) {
      return 'Use letters, numbers, spaces, hyphens, dots, brackets or underscores only.';
    }

    const duplicateCamera = cameras.find(
      (camera) =>
        camera.cameraName?.trim().toLowerCase() === value.toLowerCase() &&
        camera._id !== editingId
    );

    if (duplicateCamera) return 'A camera with this name already exists.';

    return '';
  };

  const validateAddress = (address) => {
    const value = address.trim();

    if (!value) return 'Camera address is required.';
    if (value.length < 5) return 'Address must contain at least 5 characters.';
    if (value.length > 150) return 'Address must not exceed 150 characters.';

    const addressPattern = /^[A-Za-z0-9\s,./#()-]+$/;
    if (!addressPattern.test(value)) {
      return 'Address contains unsupported special characters.';
    }

    return '';
  };

  const validateLatitude = (latitude) => {
    if (latitude === '' || latitude === null || latitude === undefined) {
      return 'Latitude is required.';
    }

    const value = Number(latitude);
    if (Number.isNaN(value)) return 'Latitude must be a valid number.';
    if (value < -90 || value > 90) return 'Latitude must be between -90 and 90.';

    return '';
  };

  const validateLongitude = (longitude) => {
    if (longitude === '' || longitude === null || longitude === undefined) {
      return 'Longitude is required.';
    }

    const value = Number(longitude);
    if (Number.isNaN(value)) return 'Longitude must be a valid number.';
    if (value < -180 || value > 180) return 'Longitude must be between -180 and 180.';

    return '';
  };

  const validateIPAddress = (ipAddress) => {
    const value = ipAddress.trim();
    if (!value) return '';

    const ipv4Pattern =
      /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

    if (!ipv4Pattern.test(value)) {
      return 'Enter a valid IPv4 address, for example 192.168.1.10.';
    }

    return '';
  };

  const validateStreamUrl = (streamUrl) => {
    const value = streamUrl.trim();
    if (!value) return '';

    const streamUrlPattern = /^(https?:\/\/|rtsp:\/\/|rtmp:\/\/)[^\s]+$/i;

    if (!streamUrlPattern.test(value)) {
      return 'Enter a valid HTTP, HTTPS, RTSP or RTMP stream URL.';
    }

    return '';
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'cameraName':
        return validateCameraName(value);
      case 'address':
        return validateAddress(value);
      case 'latitude':
        return validateLatitude(value);
      case 'longitude':
        return validateLongitude(value);
      case 'ipAddress':
        return validateIPAddress(value);
      case 'streamUrl':
        return validateStreamUrl(value);
      case 'policeStationId':
        return '';
      case 'resolution':
        return value ? '' : 'Resolution is required.';
      case 'status':
        return value ? '' : 'Status is required.';
      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors = {
      cameraName: validateCameraName(formData.cameraName),
      address: validateAddress(formData.address),
      latitude: validateLatitude(formData.latitude),
      longitude: validateLongitude(formData.longitude),
      streamUrl: validateStreamUrl(formData.streamUrl),
      ipAddress: validateIPAddress(formData.ipAddress),
      policeStationId: validateField('policeStationId', formData.policeStationId),
      resolution: formData.resolution ? '' : 'Resolution is required.',
      status: formData.status ? '' : 'Status is required.'
    };

    Object.keys(newErrors).forEach((key) => {
      if (!newErrors[key]) delete newErrors[key];
    });

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }));

    if (errors[name]) {
      const errorMessage = validateField(name, value);

      setErrors((previousErrors) => ({
        ...previousErrors,
        [name]: errorMessage
      }));
    }
  };

  const handleSwitchChange = (event) => {
    setFormData((previousData) => ({
      ...previousData,
      nightVision: event.target.checked
    }));
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    const errorMessage = validateField(name, value);

    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: errorMessage
    }));
  };

  const handleSubmit = async () => {
    const isValid = validateForm();

    if (!isValid) {
      showMessage('Please correct the highlighted fields before saving.', 'error');
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem('adminToken');
      const headers = { 'auth-token': token };

      const data = {
        cameraName: formData.cameraName.trim(),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        address: formData.address.trim(),
        streamUrl: formData.streamUrl.trim(),
        ipAddress: formData.ipAddress.trim(),
        resolution: formData.resolution,
        nightVision: formData.nightVision,
        status: formData.status,
        policeStationId: formData.policeStationId || null
      };

      if (editingId) {
        const response = await axios.put(
          `http://localhost:4001/cameras/${editingId}`,
          data,
          { headers }
        );

        const updatedCamera = response.data.camera || {
          _id: editingId,
          ...data
        };

        setCameras((previousCameras) =>
          previousCameras.map((camera) =>
            camera._id === editingId ? { ...camera, ...updatedCamera } : camera
          )
        );

        showMessage('Camera updated successfully.', 'success');
      } else {
        const response = await axios.post('http://localhost:4001/cameras', data, {
          headers
        });

        const createdCamera = response.data.camera || {
          _id: Date.now().toString(),
          detectionStatus: 'Idle',
          ...data
        };

        setCameras((previousCameras) => [...previousCameras, createdCamera]);

        showMessage('Camera added successfully.', 'success');
      }

      setOpen(false);
      setEditingId(null);
      setErrors({});
      setFormData(initialFormData);
    } catch (error) {
      console.error('Camera save error:', error);

      const backendErrors = error.response?.data?.errors;

      if (backendErrors && typeof backendErrors === 'object') {
        setErrors(backendErrors);
      }

      showMessage(
        error.response?.data?.message ||
          'Unable to save camera. Please check the backend connection.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this camera?');
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('adminToken');

      await axios.delete(`http://localhost:4001/cameras/${id}`, {
        headers: { 'auth-token': token }
      });

      setCameras((previousCameras) =>
        previousCameras.filter((camera) => camera._id !== id)
      );

      showMessage('Camera deleted successfully.', 'success');
    } catch (error) {
      console.error('Camera delete error:', error);
      showMessage(error.response?.data?.message || 'Unable to delete the camera.', 'error');
    }
  };

  // const handleStart = async (camera) => {
  //   try {
  //     setLoadingId(camera._id);

  //     const token = localStorage.getItem('adminToken');

  //     const response = await axios.post(
  //       `http://localhost:4001/cameras/${camera._id}/start`,
  //       {},
  //       { headers: { 'auth-token': token } }
  //     );

  //     showMessage(response.data.message || 'Detection started.', 'success');

  //     setCameras((previousCameras) =>
  //       previousCameras.map((item) =>
  //         item._id === camera._id
  //           ? { ...item, status: 'Active', detectionStatus: 'Running', lastError: '' }
  //           : item
  //       )
  //     );
  //   } catch (error) {
  //     showMessage(
  //       error.response?.data?.message || 'Unable to start camera detection.',
  //       'error'
  //     );
  //   } finally {
  //     setLoadingId(null);
  //   }
  // };



  const handleStart = async (camera) => {
  try {
    setLoadingId(camera._id);

    const token = localStorage.getItem('adminToken');

    console.log('START CAMERA:', {
      id: camera._id,
      cameraName: camera.cameraName,
      streamUrl: camera.streamUrl,
      ipAddress: camera.ipAddress,
      status: camera.status
    });

    const response = await axios.post(
      `http://localhost:4001/cameras/${camera._id}/start`,
      {},
      {
        headers: {
          'auth-token': token
        }
      }
    );

    console.log('START RESPONSE:', response.data);

    showMessage(
      response.data.message || 'Detection started.',
      'success'
    );

    setCameras((previousCameras) =>
      previousCameras.map((item) =>
        item._id === camera._id
          ? {
              ...item,
              status: 'Active',
              detectionStatus: 'Running',
              lastError: ''
            }
          : item
      )
    );
  } catch (error) {
    console.error('START CAMERA ERROR:', error);
    console.error('STATUS:', error.response?.status);
    console.error('DATA:', error.response?.data);

    showMessage(
      error.response?.data?.message ||
        error.response?.data?.error ||
        'Unable to start camera detection.',
      'error'
    );
  } finally {
    setLoadingId(null);
  }
};
  const handleStop = async (camera) => {
    try {
      setLoadingId(camera._id);

      const token = localStorage.getItem('adminToken');

      const response = await axios.post(
        `http://localhost:4001/cameras/${camera._id}/stop`,
        {},
        { headers: { 'auth-token': token } }
      );

      showMessage(response.data.message || 'Detection stopped.', 'info');

      setCameras((previousCameras) =>
        previousCameras.map((item) =>
          item._id === camera._id
            ? {
                ...item,
                status: 'Inactive',
                detectionStatus: 'Idle',
                lastDetectionConfidence: 0,
                lastError: ''
              }
            : item
        )
      );
    } catch (error) {
      showMessage(
        error.response?.data?.message || 'Unable to stop camera detection.',
        'error'
      );
    } finally {
      setLoadingId(null);
    }
  };

  const handleMockAlert = async (camera) => {
    try {
      setLoadingId(camera._id);
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `http://localhost:4001/cameras/${camera._id}/mock-alert`,
        { detectionType: 'Violence', confidence: 0.96 },
        { headers: { 'auth-token': token } }
      );
      showMessage(response.data.message || 'Mock alert triggered successfully!', 'success');
    } catch (error) {
      showMessage(error.response?.data?.message || 'Unable to trigger mock alert.', 'error');
    } finally {
      setLoadingId(null);
    }
  };
const handleOpenPreview = (camera) => {
  setPreviewCameraId(camera._id);
  setPreviewOpen(true);
};

const handleClosePreview = () => {
  setPreviewOpen(false);
  setPreviewCameraId(null);
};

const previewCamera = cameras.find((camera) => camera._id === previewCameraId) || null;
const CARD_WIDTH = 340;
const CARD_MIN_HEIGHT = 650; // was CARD_HEIGHT — now a floor, not a ceiling
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" className="font-bold text-primary">
          Surveillance Cameras
        </Typography>

        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Add Camera
        </Button>
      </Box>

      {message && (
        <Alert severity={messageSeverity} sx={{ mb: 3 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      {/* FIX #2: CSS Grid with a fixed min column width guarantees every
          card renders at the same width AND height, regardless of content
          length or how many cards are in the last row. */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_WIDTH}px, 1fr))`,
          gap: 3,
          width: '100%'
        }}
      >
        {cameras.map((camera, index) => {
          const policeStationName = camera.policeStationId
            ? typeof camera.policeStationId === 'string'
              ? policeStations.find((station) => station._id === camera.policeStationId)
                  ?.stationName || 'Assigned'
              : camera.policeStationId.stationName || 'Assigned'
            : 'Not assigned';

          const hasLocation =
            camera.latitude !== undefined &&
            camera.latitude !== null &&
            camera.longitude !== undefined &&
            camera.longitude !== null;

          const handleViewLocation = () => {
            if (!hasLocation) {
              alert('Location coordinates are not available.');
              return;
            }

            const mapUrl = `https://www.google.com/maps?q=${camera.latitude},${camera.longitude}`;
            window.open(mapUrl, '_blank', 'noopener,noreferrer');
          };

          return (
            <motion.div
              key={camera._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              style={{ width: '100%', height: '100%' }}
            >
              <Card
  sx={{
    width: '100%',
    minHeight: CARD_MIN_HEIGHT,   // was: height: CARD_HEIGHT
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 3,
    overflow: 'visible',          // was: 'hidden' — this was clipping/overlapping content
    boxShadow: '0 4px 14px rgba(0,0,0,0.10)',
    borderTop:
      camera.status === 'Active'
        ? '4px solid #4caf50'
        : camera.status === 'Error'
          ? '4px solid #f44336'
          : '4px solid #ff9800'
  }}
>
                <CardContent
                  sx={{
                    p: 2.2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:last-child': { pb: 2.2 }
                  }}
                >
                  {/* Camera heading */}
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    gap={1}
                    mb={2}
                    sx={{ minHeight: 36 }}
                  >
                    <Box display="flex" alignItems="center" gap={1} minWidth={0} flex={1}>
                      {camera.status === 'Active' ? (
                        <Videocam color="success" sx={{ flexShrink: 0 }} />
                      ) : (
                        <VideocamOff color="warning" sx={{ flexShrink: 0 }} />
                      )}

                      <Typography
                        variant="h6"
                        fontWeight={700}
                        noWrap
                        title={camera.cameraName}
                        sx={{ minWidth: 0 }}
                      >
                        {camera.cameraName}
                      </Typography>
                    </Box>

                    <Chip
                      label={camera.status}
                      size="small"
                      color={
                        camera.status === 'Active'
                          ? 'success'
                          : camera.status === 'Error'
                            ? 'error'
                            : 'warning'
                      }
                      sx={{ flexShrink: 0 }}
                    />
                  </Box>

                  {/* Camera details */}
                  <Box sx={{ minHeight: 245 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      mb={1}
                      title={camera.address || ''}
                      sx={{
                        minHeight: 42,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      <strong>Address:</strong> {camera.address || 'Not provided'}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" mb={1} noWrap>
                      <strong>Coordinates:</strong>{' '}
                      {hasLocation ? `${camera.latitude}, ${camera.longitude}` : 'Not provided'}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" mb={1} noWrap>
                      <strong>IP Address:</strong> {camera.ipAddress || 'Not provided'}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" mb={1}>
                      <strong>Resolution:</strong> {camera.resolution || 'Not provided'}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" mb={1}>
                      <strong>Night Vision:</strong>{' '}
                      {camera.nightVision ? 'Supported' : 'Not supported'}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      mb={1}
                      noWrap
                      title={policeStationName}
                    >
                      <strong>Police Station:</strong> {policeStationName}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" mb={1}>
                      <strong>Detection:</strong> {camera.detectionStatus || 'Idle'}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" mb={1}>
                      <strong>Confidence:</strong>{' '}
                      {camera.lastDetectionConfidence !== undefined &&
                      camera.lastDetectionConfidence !== null &&
                      camera.lastDetectionConfidence !== 0
                        ? `${(camera.lastDetectionConfidence * 100).toFixed(1)}%`
                        : 'N/A'}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" mb={1} noWrap>
                      <strong>Last Detection:</strong>{' '}
                      {camera.lastDetectionTime
                        ? new Date(camera.lastDetectionTime).toLocaleString()
                        : 'None'}
                    </Typography>
                  </Box>

                  {/* Camera preview — FIX #1 applied here */}
                  {/* <Box
                    sx={{
                      height: 180,
                      minHeight: 180,
                      mb: 2,
                      borderRadius: 2,
                      overflow: 'hidden',
                      bgcolor: '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {camera.previewUrl ? (
                      <img
                        src={`${camera.previewUrl}?t=${camera.previewUpdatedAt || camera._id}`}
                        alt={`${camera.cameraName} live preview`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <Box textAlign="center">
                        <VideocamOff sx={{ fontSize: 42, color: 'text.disabled' }} />
                        <Typography variant="caption" display="block" color="text.secondary">
                          No live preview
                        </Typography>
                      </Box>
                    )}
                  </Box> */}
<Box
  sx={{
    height: 180,
    minHeight: 180,
    mb: 2,
    borderRadius: 2,
    overflow: 'hidden',
    bgcolor: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    cursor: 'pointer',
    '&:hover .preview-fullscreen-btn': {
      opacity: 1
    }
  }}
  onClick={() => handleOpenPreview(camera)}
>
  {camera.previewUrl ? (
    <>
      <img
        src={`${camera.previewUrl}?t=${camera.previewUpdatedAt || camera._id}`}
        alt={`${camera.cameraName} live preview`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          bgcolor: 'rgba(0,0,0,0.65)',
          color: camera.detectionStatus === 'Violence' || camera.detectionStatus === 'Weaponized' || camera.detectionStatus === 'Critical' ? '#ff5252' : '#69f0ae',
          px: 1,
          py: 0.5,
          borderRadius: 1,
          fontSize: '0.75rem',
          fontWeight: 700,
          zIndex: 1
        }}
      >
        {camera.detectionStatus || 'Idle'}
        {camera.lastDetectionConfidence > 0 && ` - ${(camera.lastDetectionConfidence * 100).toFixed(1)}%`}
      </Box>
    </>
  ) : (
    <Box textAlign="center">
      <VideocamOff sx={{ fontSize: 42, color: 'text.disabled' }} />
      <Typography variant="caption" display="block" color="text.secondary">
        {camera.status === 'Active' ? 'Waiting for stream...' : 'No live preview'}
      </Typography>
    </Box>
  )}

  <IconButton
    className="preview-fullscreen-btn"
    size="small"
    onClick={(event) => {
      event.stopPropagation();
      handleOpenPreview(camera);
    }}
    sx={{
      position: 'absolute',
      top: 8,
      right: 8,
      bgcolor: 'rgba(0,0,0,0.55)',
      color: '#fff',
      opacity: { xs: 1, sm: 0 },
      transition: 'opacity 0.2s',
      '&:hover': {
        bgcolor: 'rgba(0,0,0,0.75)'
      }
    }}
  >
    <Fullscreen fontSize="small" />
  </IconButton>
</Box>
                  {/* Error message */}
                  <Box sx={{ minHeight: camera.lastError ? 38 : 0 }}>
                    {camera.lastError && (
                      <Typography
                        variant="body2"
                        color="error"
                        mb={1}
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {camera.lastError}
                      </Typography>
                    )}
                  </Box>

                  {/* Push buttons to bottom */}
                  <Box sx={{ flexGrow: 1 }} />

                  <Divider sx={{ mb: 1.5 }} />

                  {/* View location */}
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    startIcon={<LocationOnIcon />}
                    onClick={handleViewLocation}
                    disabled={!hasLocation}
                    fullWidth
                    sx={{ mb: 1.5, textTransform: 'none', fontWeight: 600 }}
                  >
                    View Location on Map
                  </Button>

                  {/* Camera actions */}
                <Box
  display="flex"
  justifyContent="space-between"
  alignItems="center"
  gap={0.6}
  sx={{ minHeight: 40, flexWrap: 'nowrap', width: '100%' }}
>
  <Button
    size="small"
    variant="contained"
    color="success"
    startIcon={<PlayArrow />}
    onClick={() => handleStart(camera)}
    disabled={loadingId === camera._id}
    sx={{
      minWidth: 0,
      px: 1,
      flex: '1.2 1 0',
      whiteSpace: 'nowrap',
      borderRadius: 2,
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.75rem',
      boxShadow: 'none',
      '& .MuiButton-startIcon': { mr: 0.4 },
      '&:hover': {
        boxShadow: '0 2px 8px rgba(76, 175, 80, 0.35)'
      }
    }}
  >
    {loadingId === camera._id ? '...' : 'Start'}
  </Button>

  <Button
    size="small"
    variant="outlined"
    color="warning"
    startIcon={<Stop />}
    onClick={() => handleStop(camera)}
    disabled={loadingId === camera._id}
    sx={{
      minWidth: 0,
      px: 1,
      flex: '1.2 1 0',
      margin:1,
        margin:1,
      whiteSpace: 'nowrap',
      borderRadius: 2,
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.75rem',
      borderWidth: 1.5,
      '& .MuiButton-startIcon': { mr: 0.4 },
      '&:hover': {
        borderWidth: 1.5,
        bgcolor: 'rgba(255, 152, 0, 0.08)'
      }
    }}
  >
    Stop
  </Button>

  <Button
    size="small"
    variant="outlined"
    color="primary"
    startIcon={<Edit fontSize="small" />}
    onClick={() => handleOpen(camera)}
    sx={{
      minWidth: 0,
      px: 1,
      flex: '1 1 0',  margin:1,
      whiteSpace: 'nowrap',
      borderRadius: 2,
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.75rem',
      borderWidth: 1.5,
      '& .MuiButton-startIcon': { mr: 0.4 },
      '&:hover': {
        borderWidth: 1.5,
        bgcolor: 'rgba(25, 118, 210, 0.08)'
      }
    }}
  >
    Edit
  </Button>

  <Button
    size="small"
    variant="outlined"
    color="error"
    startIcon={<Delete fontSize="small" />}
    onClick={() => handleDelete(camera._id)}
    sx={{
      minWidth: 0,
      px: 1,
      flex: '1 1 0',
      whiteSpace: 'nowrap',
      borderRadius: 2,  margin:1,
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.75rem',
      borderWidth: 1.5,
      '& .MuiButton-startIcon': { mr: 0.4 },
      '&:hover': {
        borderWidth: 1.5,
        bgcolor: 'rgba(211, 47, 47, 0.08)'
      }
    }}
  >
    Delete
  </Button>
</Box>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Camera Parameters' : 'Add New Camera'}</DialogTitle>

        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} mt={1}>
            <TextField
              label="Camera Name"
              name="cameraName"
              value={formData.cameraName}
              onChange={handleInputChange}
              onBlur={handleBlur}
              fullWidth
              required
              error={Boolean(errors.cameraName)}
              helperText={errors.cameraName || 'Example: Main Gate Camera 01'}
              inputProps={{
                minLength: 3,
                maxLength: 50,
                pattern: '[A-Za-z0-9][A-Za-z0-9\\s._()\\-]*'
              }}
            />

            <TextField
              label="Camera Address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              onBlur={handleBlur}
              fullWidth
              required
              multiline
              rows={2}
              error={Boolean(errors.address)}
              helperText={errors.address || 'Automatically detected from the selected map location'}
            />

            <Box>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                mb={1}
                display="flex"
                alignItems="center"
                gap={1}
              >
                <LocationOnIcon color="primary" />
                Select Camera Location
              </Typography>

              <Alert severity="info" icon={<MyLocationIcon />} sx={{ mb: 2, borderRadius: 2 }}>
                Click anywhere on the map to select the camera location. Latitude,
                longitude and address will be filled automatically.
              </Alert>

              <Box
                sx={{
                  height: { xs: 320, sm: 400 },
                  width: '100%',
                  overflow: 'hidden',
                  borderRadius: 3,
                  border:
                    errors.latitude || errors.longitude
                      ? '2px solid #d32f2f'
                      : '1px solid #dbe2ea',
                  boxShadow: '0 5px 18px rgba(15, 23, 42, 0.08)',
                  mb: 2
                }}
              >
                <MapContainer
                  center={selectedPosition || defaultMapCenter}
                  zoom={selectedPosition ? 16 : 13}
                  scrollWheelZoom
                  style={{ width: '100%', height: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <LocationSelector
                    position={selectedPosition}
                    onLocationSelect={handleMapLocationSelect}
                    onAddressSelect={handleAddressSelect}
                  />
                </MapContainer>
              </Box>

              {(errors.latitude || errors.longitude) && (
                <Typography variant="caption" color="error" display="block" mb={2}>
                  {errors.latitude || errors.longitude}
                </Typography>
              )}

              <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                <TextField
                  label="Latitude"
                  name="latitude"
                  value={formData.latitude}
                  fullWidth
                  required
                  error={Boolean(errors.latitude)}
                  helperText={errors.latitude || 'Automatically selected from the map'}
                  InputProps={{ readOnly: true }}
                />

                <TextField
                  label="Longitude"
                  name="longitude"
                  value={formData.longitude}
                  fullWidth
                  required
                  error={Boolean(errors.longitude)}
                  helperText={errors.longitude || 'Automatically selected from the map'}
                  InputProps={{ readOnly: true }}
                />
              </Box>
            </Box>

            <TextField
              label="Camera IP Address"
              name="ipAddress"
              value={formData.ipAddress}
              onChange={handleInputChange}
              onBlur={handleBlur}
              fullWidth
              error={Boolean(errors.ipAddress)}
              helperText={errors.ipAddress || 'Optional. Example: 192.168.1.10'}
              placeholder="192.168.1.10"
              inputProps={{
                maxLength: 15,
                pattern:
                  '^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}$'
              }}
            />

            <TextField
              label="Camera Stream URL"
              name="streamUrl"
              value={formData.streamUrl}
              onChange={handleInputChange}
              onBlur={handleBlur}
              fullWidth
              error={Boolean(errors.streamUrl)}
              helperText={errors.streamUrl || 'Optional. Supports HTTP, HTTPS, RTSP and RTMP.'}
              placeholder="rtsp://192.168.1.10:554/stream"
            />

            <TextField
              label="Resolution"
              name="resolution"
              select
              value={formData.resolution}
              onChange={handleInputChange}
              onBlur={handleBlur}
              fullWidth
              required
              error={Boolean(errors.resolution)}
              helperText={errors.resolution}
            >
              <MenuItem value="720p">720p HD</MenuItem>
              <MenuItem value="1080p">1080p Full HD</MenuItem>
              <MenuItem value="4K">4K Ultra HD</MenuItem>
            </TextField>

            <TextField
              label="Police Station"
              name="policeStationId"
              select
              value={formData.policeStationId}
              onChange={handleInputChange}
              onBlur={handleBlur}
              fullWidth
              error={Boolean(errors.policeStationId)}
              helperText={
                errors.policeStationId ||
                'Assign a police station for alerting when violence is detected.'
              }
            >
              <MenuItem value="">Select Police Station</MenuItem>
              {policeStations.map((station) => (
                <MenuItem key={station._id} value={station._id}>
                  {station.stationName} ({station.stationCode})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Status"
              name="status"
              select
              value={formData.status}
              onChange={handleInputChange}
              onBlur={handleBlur}
              fullWidth
              required
              error={Boolean(errors.status)}
              helperText={errors.status}
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
              <MenuItem value="Maintenance">Maintenance</MenuItem>
            </TextField>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.nightVision}
                  onChange={handleSwitchChange}
                  color="primary"
                />
              }
              label="Infrared Night Vision Support"
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} color="inherit" disabled={saving}>
            Cancel
          </Button>

          <Button onClick={handleSubmit} variant="contained" color="primary" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update Camera' : 'Save Camera'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
  open={previewOpen}
  onClose={handleClosePreview}
  fullScreen
  PaperProps={{
    sx: {
      bgcolor: '#000'
    }
  }}
>
  <Box
    sx={{
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    <IconButton
      onClick={handleClosePreview}
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 2,
        bgcolor: 'rgba(255,255,255,0.15)',
        color: 'black',
        '&:hover': {
          bgcolor: 'rgba(255,255,255,0.3)'
        }
      }}
    >
      <Close />
    </IconButton>

    {previewCamera && (
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 2,
          color: '#fff',
          bgcolor: 'rgba(0,0,0,0.65)',
          px: 2,
          py: 1,
          borderRadius: 2
        }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          {previewCamera.cameraName}
        </Typography>
        <Typography 
          variant="body2" 
          fontWeight={700}
          sx={{ 
            color: previewCamera.detectionStatus === 'Violence' || previewCamera.detectionStatus === 'Weaponized' || previewCamera.detectionStatus === 'Critical' ? '#ff5252' : '#69f0ae'
          }}
        >
          {previewCamera.detectionStatus || 'Idle'}
          {previewCamera.lastDetectionConfidence > 0 && ` - ${(previewCamera.lastDetectionConfidence * 100).toFixed(1)}%`}
        </Typography>
      </Box>
    )}

    {previewCamera?.previewUrl ? (
      <img
        src={`${previewCamera.previewUrl}?t=${previewCamera.previewUpdatedAt || previewCamera._id}`}
        alt={`${previewCamera.cameraName} full screen preview`}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain'
        }}
      />
    ) : (
      <Box textAlign="center" color="rgba(255,255,255,0.7)">
        <VideocamOff sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant="h6">
          {previewCamera?.status === 'Active' ? 'Waiting for stream...' : 'No live preview'}
        </Typography>
      </Box>
    )}
  </Box>
</Dialog>
    </Box>
  );
};

export default Cameras;

const LocationSelector = ({ position, onLocationSelect, onAddressSelect }) => {
  const map = useMapEvents({
    async click(event) {
      const { lat, lng } = event.latlng;

      onLocationSelect({
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6)
      });

      map.flyTo([lat, lng], Math.max(map.getZoom(), 16));

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
          { headers: { Accept: 'application/json' } }
        );

        if (!response.ok) throw new Error('Unable to retrieve address');

        const data = await response.json();

        if (data?.display_name) {
          onAddressSelect(data.display_name);
        }
      } catch (error) {
        console.error('Reverse geocoding failed:', error);
      }
    }
  });

  return position ? (
    <Marker position={position}>
      <Popup>
        <strong>Selected Camera Location</strong>
        <br />
        Latitude: {position[0]}
        <br />
        Longitude: {position[1]}
      </Popup>
    </Marker>
  ) : null;
};