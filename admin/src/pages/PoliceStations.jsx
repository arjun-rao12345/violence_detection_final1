

import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Box,
  Typography,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  InputAdornment,
  Alert
} from '@mui/material';

import {
  Add,
  Edit,
  Delete,
  Close,
  LocationOn,
  Phone,
  Email,
  Badge,
  CheckCircle,
  Cancel,
  MyLocation,
  Search
} from '@mui/icons-material';

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents
} from 'react-leaflet';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import axios from 'axios';
import { motion } from 'framer-motion';

const BASE_URL = 'http://localhost:4001/policeStation';

const DEFAULT_MAP_CENTER = [12.9141, 74.856];

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',

  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',

  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
});

// ---------- Validation patterns ----------
const PATTERNS = {
  stationName: /^[A-Za-z][A-Za-z\s.'-]{2,59}$/,

  stationCode: /^[A-Z]{2,5}-?\d{2,5}$/,

  address: /^.{5,250}$/,

  city: /^[A-Za-z][A-Za-z\s.'-]{1,49}$/,

  state: /^[A-Za-z][A-Za-z\s.'-]{1,49}$/,

  pincode: /^[1-9][0-9]{5}$/,

  phone: /^[6-9]\d{9}$/,

  email:
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  inchargeName: /^[A-Za-z][A-Za-z\s.'-]{2,59}$/,

  latitude: /^-?([1-8]?\d(\.\d+)?|90(\.0+)?)$/,

  longitude:
    /^-?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/
};

const FIELD_RULES = {
  stationName: {
    required: true,
    pattern: PATTERNS.stationName,
    message:
      'Enter a valid station name using 3 to 60 characters'
  },

  stationCode: {
    required: true,
    pattern: PATTERNS.stationCode,
    message:
      'Use 2-5 uppercase letters and 2-5 digits, for example KA-1023'
  },

  address: {
    required: true,
    pattern: PATTERNS.address,
    message:
      'Address must contain between 5 and 250 characters'
  },

  city: {
    required: true,
    pattern: PATTERNS.city,
    message: 'Enter a valid city name'
  },

  state: {
    required: true,
    pattern: PATTERNS.state,
    message: 'Enter a valid state name'
  },

  pincode: {
    required: true,
    pattern: PATTERNS.pincode,
    message: 'Enter a valid 6-digit pincode'
  },

  contactNumber: {
    required: true,
    pattern: PATTERNS.phone,
    message:
      'Enter a valid 10-digit Indian mobile number'
  },

  email: {
    required: false,
    pattern: PATTERNS.email,
    message: 'Enter a valid email address'
  },

  inchargeName: {
    required: true,
    pattern: PATTERNS.inchargeName,
    message: 'Enter a valid incharge name'
  },

  inchargePhone: {
    required: true,
    pattern: PATTERNS.phone,
    message:
      'Enter a valid 10-digit Indian mobile number'
  },

  latitude: {
    required: true,
    pattern: PATTERNS.latitude,
    message: 'Latitude must be between -90 and 90'
  },

  longitude: {
    required: true,
    pattern: PATTERNS.longitude,
    message: 'Longitude must be between -180 and 180'
  }
};

const emptyForm = {
  stationName: '',
  stationCode: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  contactNumber: '',
  email: '',
  inchargeName: '',
  inchargePhone: '',
  latitude: '',
  longitude: '',
  status: 'Active'
};

const validateField = (name, value) => {
  const rule = FIELD_RULES[name];

  if (!rule) {
    return '';
  }

  const trimmedValue =
    value === null || value === undefined
      ? ''
      : String(value).trim();

  if (!trimmedValue) {
    return rule.required
      ? 'This field is required'
      : '';
  }

  if (
    rule.pattern &&
    !rule.pattern.test(trimmedValue)
  ) {
    return rule.message;
  }

  return '';
};

const validateAll = (formData) => {
  const validationErrors = {};

  Object.keys(FIELD_RULES).forEach((fieldName) => {
    const error = validateField(
      fieldName,
      formData[fieldName]
    );

    if (error) {
      validationErrors[fieldName] = error;
    }
  });

  return validationErrors;
};

// Moves map when editing an existing station
const ChangeMapView = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, {
        duration: 1
      });
    }
  }, [position, map]);

  return null;
};

// Handles click selection and reverse geocoding
const StationLocationSelector = ({
  position,
  onLocationSelect,
  onAddressLoading,
  onLocationError
}) => {
  const map = useMapEvents({
    async click(event) {
      const { lat, lng } = event.latlng;

      const latitude = lat.toFixed(6);
      const longitude = lng.toFixed(6);

      onLocationError('');

      // Immediately set latitude and longitude
      onLocationSelect({
        latitude,
        longitude
      });

      map.flyTo([lat, lng], 16, {
        duration: 1
      });

      try {
        onAddressLoading(true);

        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
          {
            headers: {
              Accept: 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(
            'Unable to retrieve address'
          );
        }

        const data = await response.json();
        const location = data.address || {};

        const city =
          location.city ||
          location.town ||
          location.village ||
          location.municipality ||
          location.county ||
          '';

        const state = location.state || '';

        const pincode = location.postcode
          ? String(location.postcode)
              .replace(/\s/g, '')
              .slice(0, 6)
          : '';

        onLocationSelect({
          latitude,
          longitude,
          address: data.display_name || '',
          city,
          state,
          pincode
        });
      } catch (error) {
        console.error(
          'Reverse geocoding failed:',
          error
        );

        onLocationError(
          'Coordinates were selected, but the address could not be detected. Enter the address manually.'
        );
      } finally {
        onAddressLoading(false);
      }
    }
  });

  if (!position) {
    return null;
  }

  return (
    <Marker position={position}>
      <Popup>
        <strong>
          Selected Police Station Location
        </strong>

        <br />

        Latitude: {position[0]}

        <br />

        Longitude: {position[1]}
      </Popup>
    </Marker>
  );
};

const PoliceStations = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] =
    useState(null);

  const [submitting, setSubmitting] =
    useState(false);

  const [addressLoading, setAddressLoading] =
    useState(false);

  const [locationError, setLocationError] =
    useState('');

  const [formData, setFormData] =
    useState(emptyForm);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [searchText, setSearchText] =
    useState('');

  useEffect(() => {
    fetchStations();
  }, []);

  const selectedPosition = useMemo(() => {
    const latitude = Number(formData.latitude);
    const longitude = Number(
      formData.longitude
    );

    const isValid =
      formData.latitude !== '' &&
      formData.longitude !== '' &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180;

    return isValid
      ? [latitude, longitude]
      : null;
  }, [
    formData.latitude,
    formData.longitude
  ]);

  const filteredStations = useMemo(() => {
    const query = searchText
      .trim()
      .toLowerCase();

    if (!query) {
      return stations;
    }

    return stations.filter((station) => {
      return [
        station.stationName,
        station.stationCode,
        station.city,
        station.state,
        station.contactNumber,
        station.inchargeName
      ].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(query)
      );
    });
  }, [stations, searchText]);

  const getHeaders = () => {
    const token =
      localStorage.getItem('adminToken');

    return {
      headers: {
        'auth-token': token
      }
    };
  };

  const fetchStations = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${BASE_URL}/getAllPoliceStations`,
        getHeaders()
      );

      setStations(response.data.data || []);
    } catch (error) {
      console.error(
        'Police station fetch error:',
        error
      );

      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setErrors({});
    setTouched({});
    setAddressLoading(false);
    setLocationError('');
  };

  const handleOpen = (station = null) => {
    setLocationError('');
    setAddressLoading(false);

    if (station) {
      setEditingId(station._id);

      setFormData({
        stationName:
          station.stationName || '',

        stationCode:
          station.stationCode || '',

        address: station.address || '',

        city: station.city || '',

        state: station.state || '',

        pincode: station.pincode || '',

        contactNumber:
          station.contactNumber || '',

        email: station.email || '',

        inchargeName:
          station.inchargeName || '',

        inchargePhone:
          station.inchargePhone || '',

        latitude:
          station.latitude !== undefined &&
          station.latitude !== null
            ? String(station.latitude)
            : '',

        longitude:
          station.longitude !== undefined &&
          station.longitude !== null
            ? String(station.longitude)
            : '',

        status: station.status || 'Active'
      });

      setErrors({});
      setTouched({});
    } else {
      setEditingId(null);
      resetForm();
    }

    setOpen(true);
  };

  const handleClose = () => {
    if (submitting) {
      return;
    }

    setOpen(false);
    setEditingId(null);
    resetForm();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }));

    if (touched[name]) {
      setErrors((previousErrors) => ({
        ...previousErrors,
        [name]: validateField(name, value)
      }));
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;

    setTouched((previousTouched) => ({
      ...previousTouched,
      [name]: true
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: validateField(name, value)
    }));
  };

  const handleStatusChange = (
    _event,
    newStatus
  ) => {
    if (newStatus) {
      setFormData((previousData) => ({
        ...previousData,
        status: newStatus
      }));
    }
  };

  const handleMapLocationSelect = (
    locationData
  ) => {
    setFormData((previousData) => ({
      ...previousData,
      ...locationData
    }));

    const updatedFields =
      Object.keys(locationData);

    setTouched((previousTouched) => {
      const newTouched = {
        ...previousTouched
      };

      updatedFields.forEach((fieldName) => {
        newTouched[fieldName] = true;
      });

      return newTouched;
    });

    setErrors((previousErrors) => {
      const newErrors = {
        ...previousErrors
      };

      updatedFields.forEach((fieldName) => {
        const error = validateField(
          fieldName,
          locationData[fieldName]
        );

        if (error) {
          newErrors[fieldName] = error;
        } else {
          delete newErrors[fieldName];
        }
      });

      return newErrors;
    });
  };

  const handleSubmit = async () => {
    const validationErrors =
      validateAll(formData);

    setErrors(validationErrors);

    const allTouched = {};

    Object.keys(FIELD_RULES).forEach(
      (fieldName) => {
        allTouched[fieldName] = true;
      }
    );

    setTouched(allTouched);

    if (
      Object.keys(validationErrors).length > 0
    ) {
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        stationName:
          formData.stationName.trim(),

        stationCode:
          formData.stationCode
            .trim()
            .toUpperCase(),

        address: formData.address.trim(),

        city: formData.city.trim(),

        state: formData.state.trim(),

        pincode: formData.pincode.trim(),

        contactNumber:
          formData.contactNumber.trim(),

        email: formData.email
          .trim()
          .toLowerCase(),

        inchargeName:
          formData.inchargeName.trim(),

        inchargePhone:
          formData.inchargePhone.trim(),

        latitude: Number(
          formData.latitude
        ),

        longitude: Number(
          formData.longitude
        ),

        status: formData.status
      };

      if (editingId) {
        await axios.put(
          `${BASE_URL}/updatePoliceStation/${editingId}`,
          payload,
          getHeaders()
        );
      } else {
        await axios.post(
          `${BASE_URL}/addPoliceStation`,
          payload,
          getHeaders()
        );
      }

      handleClose();
      await fetchStations();
    } catch (error) {
      console.error(
        'Police station save error:',
        error
      );

      alert(
        error.response?.data?.message ||
          'Unable to save police station'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this police station?'
    );

    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(
        `${BASE_URL}/deletePoliceStation/${id}`,
        getHeaders()
      );

      await fetchStations();
    } catch (error) {
      console.error(
        'Police station delete error:',
        error
      );

      alert(
        error.response?.data?.message ||
          'Delete failed'
      );
    }
  };

  const renderField = (
    name,
    label,
    options = {}
  ) => {
    const showError =
      Boolean(touched[name]) &&
      Boolean(errors[name]);

    return (
      <TextField
        label={label}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        onBlur={handleBlur}
        error={showError}
        helperText={
          showError
            ? errors[name]
            : options.helper || ' '
        }
        required={
          FIELD_RULES[name]?.required
        }
        fullWidth
        size="small"
        multiline={options.multiline}
        minRows={options.minRows}
        InputProps={{
          readOnly:
            options.readOnly || false,

          startAdornment: options.icon ? (
            <InputAdornment position="start">
              {options.icon}
            </InputAdornment>
          ) : undefined,

          endAdornment:
            options.endAdornment || undefined
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            transition:
              'box-shadow 0.15s ease',
            backgroundColor: '#fff',

            '&.Mui-focused': {
              boxShadow:
                '0 0 0 3px rgba(11,61,145,0.12)'
            }
          },

          '& .MuiInputBase-input': {
            color: '#1A1D29 !important',
            WebkitTextFillColor:
              '#1A1D29'
          },

          '& .MuiInputLabel-root': {
            color: '#5B6472'
          },

          '& .MuiInputLabel-root.Mui-focused':
            {
              color: '#0B3D91'
            },

          '& .MuiFormHelperText-root': {
            color: '#8A93A3'
          },

          '& .MuiFormHelperText-root.Mui-error':
            {
              color: '#B3261E'
            }
        }}
      />
    );
  };

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        mt={10}
        gap={2}
      >
        <CircularProgress
          sx={{ color: '#0B3D91' }}
        />

        <Typography color="text.secondary">
          Loading police stations...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        fontFamily: 'inherit',
        color: '#1A1D29'
      }}
    >
      {/* Page heading */}
      <Box
        display="flex"
        flexDirection={{
          xs: 'column',
          md: 'row'
        }}
        justifyContent="space-between"
        alignItems={{
          xs: 'stretch',
          md: 'center'
        }}
        gap={2}
        mb={4}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: '#0B3D91',
              letterSpacing: '-0.02em'
            }}
          >
            Manage Police Stations
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: '#5B6472',
              mt: 0.5
            }}
          >
            {stations.length} station
            {stations.length !== 1 ? 's' : ''}{' '}
            registered
          </Typography>
        </Box>

        <Box
          display="flex"
          flexDirection={{
            xs: 'column',
            sm: 'row'
          }}
          gap={1.5}
        >
          <TextField
            size="small"
            placeholder="Search stations..."
            value={searchText}
            onChange={(event) =>
              setSearchText(event.target.value)
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              )
            }}
            sx={{
              minWidth: {
                xs: '100%',
                sm: 250
              },

              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                bgcolor: '#fff'
              }
            }}
          />

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen()}
            sx={{
              bgcolor: '#0B3D91',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              px: 2.5,
              whiteSpace: 'nowrap',
              boxShadow:
                '0 4px 12px rgba(11,61,145,0.25)',

              '&:hover': {
                bgcolor: '#092e6e'
              }
            }}
          >
            Add Police Station
          </Button>
        </Box>
      </Box>

      {/* Station table */}
      <motion.div
        initial={{
          opacity: 0,
          y: 10
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
      >
        <Card
          sx={{
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow:
              '0 2px 16px rgba(0,0,0,0.06)'
          }}
        >
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor:
                      'rgba(11,61,145,0.06)'
                  }}
                >
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color:
                        '#0B3D91 !important'
                    }}
                  >
                    Station Code
                  </TableCell>

                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color:
                        '#0B3D91 !important'
                    }}
                  >
                    Station Name
                  </TableCell>

                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color:
                        '#0B3D91 !important'
                    }}
                  >
                    City
                  </TableCell>

                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color:
                        '#0B3D91 !important'
                    }}
                  >
                    Contact
                  </TableCell>

                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color:
                        '#0B3D91 !important'
                    }}
                  >
                    Incharge
                  </TableCell>

                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color:
                        '#0B3D91 !important'
                    }}
                  >
                    Status
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 700,
                      color:
                        '#0B3D91 !important'
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredStations.map(
                  (station) => (
                    <TableRow
                      key={station._id}
                      hover
                    >
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color:
                            '#1A1D29 !important'
                        }}
                      >
                        {station.stationCode}
                      </TableCell>

                      <TableCell
                        sx={{
                          color:
                            '#1A1D29 !important'
                        }}
                      >
                        {station.stationName}
                      </TableCell>

                      <TableCell
                        sx={{
                          color:
                            '#1A1D29 !important'
                        }}
                      >
                        {station.city}
                      </TableCell>

                      <TableCell
                        sx={{
                          color:
                            '#1A1D29 !important'
                        }}
                      >
                        {station.contactNumber}
                      </TableCell>

                      <TableCell
                        sx={{
                          color:
                            '#1A1D29 !important'
                        }}
                      >
                        {station.inchargeName}
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          icon={
                            station.status ===
                            'Inactive' ? (
                              <Cancel
                                sx={{
                                  fontSize: 16
                                }}
                              />
                            ) : (
                              <CheckCircle
                                sx={{
                                  fontSize: 16
                                }}
                              />
                            )
                          }
                          label={
                            station.status ||
                            'Active'
                          }
                          sx={{
                            fontWeight: 600,

                            color:
                              station.status ===
                              'Inactive'
                                ? '#B3261E'
                                : '#1B7A3D',

                            bgcolor:
                              station.status ===
                              'Inactive'
                                ? 'rgba(179,38,30,0.1)'
                                : 'rgba(27,122,61,0.1)',

                            '& .MuiChip-icon': {
                              color:
                                station.status ===
                                'Inactive'
                                  ? '#B3261E'
                                  : '#1B7A3D'
                            }
                          }}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() =>
                            handleOpen(station)
                          }
                        >
                          <Edit fontSize="small" />
                        </IconButton>

                        <IconButton
                          color="error"
                          onClick={() =>
                            handleDelete(
                              station._id
                            )
                          }
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                )}

                {filteredStations.length ===
                  0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      align="center"
                      sx={{
                        py: 5,
                        color:
                          '#5B6472 !important'
                      }}
                    >
                      No police stations found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Card>
      </motion.div>

      {/* Add/Edit dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: '#0B3D91',
            color: '#fff',
            py: 2
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700 }}
            >
              {editingId
                ? 'Edit Police Station'
                : 'Add Police Station'}
            </Typography>

            <Typography
              variant="caption"
              sx={{ opacity: 0.85 }}
            >
              Fields marked * are required
            </Typography>
          </Box>

          <IconButton
            onClick={handleClose}
            disabled={submitting}
            sx={{ color: '#fff' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            bgcolor: '#F7F9FC',
            pb: 1
          }}
        >
          {/* Status */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: {
                xs: 'column',
                sm: 'row'
              },
              alignItems: {
                xs: 'stretch',
                sm: 'center'
              },
              justifyContent:
                'space-between',
              gap: 2,
              bgcolor: '#fff',
              border:
                '1px solid #E3E8EF',
              borderRadius: '12px',
              px: 2.5,
              py: 1.5,
              mt: 2,
              mb: 3
            }}
          >
            <Box
              display="flex"
              alignItems="center"
              gap={1}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',

                  bgcolor:
                    formData.status ===
                    'Active'
                      ? '#1B7A3D'
                      : '#B3261E',

                  boxShadow:
                    formData.status ===
                    'Active'
                      ? '0 0 0 4px rgba(27,122,61,0.15)'
                      : '0 0 0 4px rgba(179,38,30,0.15)'
                }}
              />

              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: '#0B3D91'
                }}
              >
                Station Status
              </Typography>
            </Box>

            <ToggleButtonGroup
              value={formData.status}
              exclusive
              onChange={handleStatusChange}
              size="small"
              sx={{
                '& .MuiToggleButton-root':
                  {
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 2,
                    border:
                      '1px solid #E3E8EF'
                  }
              }}
            >
              <ToggleButton
                value="Active"
                sx={{
                  '&.Mui-selected': {
                    bgcolor:
                      'rgba(27,122,61,0.12)',
                    color: '#1B7A3D',

                    '&:hover': {
                      bgcolor:
                        'rgba(27,122,61,0.18)'
                    }
                  }
                }}
              >
                <CheckCircle
                  sx={{
                    fontSize: 16,
                    mr: 0.5
                  }}
                />

                Active
              </ToggleButton>

              <ToggleButton
                value="Inactive"
                sx={{
                  '&.Mui-selected': {
                    bgcolor:
                      'rgba(179,38,30,0.12)',
                    color: '#B3261E',

                    '&:hover': {
                      bgcolor:
                        'rgba(179,38,30,0.18)'
                    }
                  }
                }}
              >
                <Cancel
                  sx={{
                    fontSize: 16,
                    mr: 0.5
                  }}
                />

                Inactive
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Station basic details */}
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: '#0B3D91',
              mb: 1.5
            }}
          >
            Station Details
          </Typography>

          <Box
            display="grid"
            gridTemplateColumns={{
              xs: '1fr',
              md: 'repeat(2, 1fr)'
            }}
            gap={2.5}
          >
            {renderField(
              'stationName',
              'Station Name',
              {
                icon: (
                  <Badge fontSize="small" />
                )
              }
            )}

            {renderField(
              'stationCode',
              'Station Code',
              {
                helper: 'Example: KA-1023'
              }
            )}

            <Box
              sx={{
                gridColumn: {
                  xs: '1',
                  md: '1 / -1'
                }
              }}
            >
              {renderField(
                'address',
                'Station Address',
                {
                  icon: (
                    <LocationOn fontSize="small" />
                  ),

                  helper:
                    'Automatically filled after selecting a location on the map',

                  multiline: true,
                  minRows: 2,

                  endAdornment:
                    addressLoading ? (
                      <InputAdornment position="end">
                        <CircularProgress
                          size={18}
                        />
                      </InputAdornment>
                    ) : undefined
                }
              )}
            </Box>

            {renderField('city', 'City')}

            {renderField('state', 'State')}

            {renderField(
              'pincode',
              'Pincode',
              {
                helper:
                  'Enter a 6-digit pincode'
              }
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Map selection */}
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: '#0B3D91',
              mb: 1.5
            }}
          >
            Police Station Location
          </Typography>

          <Box
            sx={{
              bgcolor: '#fff',
              border:
                '1px solid #E3E8EF',
              borderRadius: '14px',
              p: 2
            }}
          >
            <Alert
              severity="info"
              icon={<MyLocation />}
              sx={{
                mb: 2,
                borderRadius: '10px'
              }}
            >
              Click anywhere on the map.
              Address, city, state, pincode,
              latitude and longitude will be
              filled automatically.
            </Alert>

            {locationError && (
              <Alert
                severity="warning"
                onClose={() =>
                  setLocationError('')
                }
                sx={{
                  mb: 2,
                  borderRadius: '10px'
                }}
              >
                {locationError}
              </Alert>
            )}

            <Box
              sx={{
                height: {
                  xs: 320,
                  md: 420
                },
                width: '100%',
                overflow: 'hidden',
                borderRadius: '12px',
                border:
                  errors.latitude ||
                  errors.longitude
                    ? '2px solid #B3261E'
                    : '1px solid #D8DEE8',
                position: 'relative'
              }}
            >
              <MapContainer
                center={
                  selectedPosition ||
                  DEFAULT_MAP_CENTER
                }
                zoom={
                  selectedPosition ? 16 : 13
                }
                scrollWheelZoom
                style={{
                  width: '100%',
                  height: '100%'
                }}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <ChangeMapView
                  position={selectedPosition}
                />

                <StationLocationSelector
                  position={selectedPosition}
                  onLocationSelect={
                    handleMapLocationSelect
                  }
                  onAddressLoading={
                    setAddressLoading
                  }
                  onLocationError={
                    setLocationError
                  }
                />
              </MapContainer>

              {addressLoading && (
                <Box
                  sx={{
                    position: 'absolute',
                    zIndex: 1000,
                    inset: 0,
                    bgcolor:
                      'rgba(255,255,255,0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent:
                      'center',
                    pointerEvents: 'none'
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: '#fff',
                      px: 2,
                      py: 1.5,
                      borderRadius: 2,
                      boxShadow: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5
                    }}
                  >
                    <CircularProgress
                      size={22}
                    />

                    <Typography
                      variant="body2"
                      fontWeight={600}
                    >
                      Finding address...
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>

            {(errors.latitude ||
              errors.longitude) && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  color: '#B3261E',
                  mt: 1
                }}
              >
                {errors.latitude ||
                  errors.longitude}
              </Typography>
            )}

            <Box
              display="grid"
              gridTemplateColumns={{
                xs: '1fr',
                md: 'repeat(2, 1fr)'
              }}
              gap={2.5}
              mt={2.5}
            >
              {renderField(
                'latitude',
                'Latitude',
                {
                  icon: (
                    <MyLocation fontSize="small" />
                  ),

                  helper:
                    'Selected automatically from the map',

                  readOnly: true
                }
              )}

              {renderField(
                'longitude',
                'Longitude',
                {
                  icon: (
                    <LocationOn fontSize="small" />
                  ),

                  helper:
                    'Selected automatically from the map',

                  readOnly: true
                }
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Contact information */}
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: '#0B3D91',
              mb: 1.5
            }}
          >
            Contact Information
          </Typography>

          <Box
            display="grid"
            gridTemplateColumns={{
              xs: '1fr',
              md: 'repeat(2, 1fr)'
            }}
            gap={2.5}
            pb={2}
          >
            {renderField(
              'contactNumber',
              'Contact Number',
              {
                icon: (
                  <Phone fontSize="small" />
                ),

                helper:
                  'Enter a 10-digit mobile number'
              }
            )}

            {renderField('email', 'Email', {
              icon: (
                <Email fontSize="small" />
              ),

              helper: 'Optional email address'
            })}

            {renderField(
              'inchargeName',
              'Incharge Name',
              {
                icon: (
                  <Badge fontSize="small" />
                )
              }
            )}

            {renderField(
              'inchargePhone',
              'Incharge Phone',
              {
                icon: (
                  <Phone fontSize="small" />
                ),

                helper:
                  'Enter a 10-digit mobile number'
              }
            )}
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: 3,
            bgcolor: '#F7F9FC'
          }}
        >
          <Button
            onClick={handleClose}
            disabled={submitting}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '10px',
              color: '#3B4252'
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              submitting || addressLoading
            }
            sx={{
              bgcolor: '#0B3D91',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '10px',
              px: 3,

              '&:hover': {
                bgcolor: '#092e6e'
              }
            }}
          >
            {submitting ? (
              <CircularProgress
                size={20}
                sx={{ color: '#fff' }}
              />
            ) : editingId ? (
              'Update Station'
            ) : (
              'Save Station'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PoliceStations;
