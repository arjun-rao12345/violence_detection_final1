import React, { useEffect, useMemo, useState } from 'react';
import {
Alert,
Box,
Button,
Chip,
CircularProgress,
FormControl,
IconButton,
InputAdornment,
InputLabel,
MenuItem,
Paper,
Select,
Stack,
Table,
TableBody,
TableCell,
TableContainer,
TableHead,
TablePagination,
TableRow,
TextField,
Tooltip,
Typography
} from '@mui/material';

import {
Clear,
LocationOn,
Refresh,
Search,
Delete
} from '@mui/icons-material';

import axios from 'axios';

const API_URL = 'http://localhost:4001';

const getImageUrl = (img) => {
  if (!img) return '';
  if (typeof img !== 'string') return '';
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  const cleanPath = img.replace(/\\/g, '/');
  if (cleanPath.startsWith('uploads/') || cleanPath.startsWith('/uploads/')) {
    const p = cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath;
    return `${API_URL}${p}`;
  }
  if (cleanPath.startsWith('upload/') || cleanPath.startsWith('/upload/')) {
    const p = cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath;
    return `${API_URL}${p}`;
  }
  return `${API_URL}/uploads/${cleanPath}`;
};

const Voilationincident = () => {
const [reports, setReports] = useState([]);

const [searchTerm, setSearchTerm] = useState('');
const [statusFilter, setStatusFilter] = useState('All');
const [severityFilter, setSeverityFilter] = useState('All');

const [page, setPage] = useState(0);
const [rowsPerPage, setRowsPerPage] = useState(10);

const [loading, setLoading] = useState(true);
const [updatingId, setUpdatingId] = useState(null);
const [error, setError] = useState('');

// ==========================================
// GET TOKEN
// ==========================================

const getToken = () => {
return localStorage.getItem('policeToken');
};

// ==========================================
// FETCH VIOLENCE REPORTS
// ==========================================

// ==========================================
// FETCH VIOLENCE REPORTS (ASSIGNED TO ME)
// ==========================================

const fetchReports = async () => {
  try {
    setLoading(true);
    setError('');

    const token = getToken();

    const response = await axios.get(
      `${API_URL}/ViolenceReport/GetMyAssigned`,   // <-- changed from GetAll
      {
        headers: {
          'auth-token': token
        }
      }
    );

    const reportData =
      response.data?.reports || [];

    setReports(reportData);

  } catch (error) {
    console.error(
      'Error fetching violence reports:',
      error
    );

    setError(
      error.response?.data?.message ||
      'Unable to fetch violence reports. Please try again.'
    );

  } finally {
    setLoading(false);
  }
};
useEffect(() => {
fetchReports();
}, []);

// ==========================================
// UPDATE REPORT STATUS
// ==========================================

const updateReportStatus = async (
reportId,
newStatus
) => {
try {
setUpdatingId(reportId);
setError('');

const token = getToken();

const response = await axios.put(
`${API_URL}/ViolenceReport/UpdateStatus/${reportId}`,
{
status: newStatus
},
{
headers: {
'auth-token': token
}
}
);

const updatedReport =
response.data?.report;

setReports((previousReports) =>
previousReports.map((report) =>
report._id === reportId
? {
...report,
...(updatedReport || {}),
status: newStatus
}
: report
)
);

} catch (error) {
console.error(
'Error updating report status:',
error
);

setError(
error.response?.data?.message ||
'Unable to update report status.'
);

} finally {
setUpdatingId(null);
}
};

const handleDeleteReport = async (reportId) => {
  if (!window.confirm("Are you sure you want to delete this violence report?")) return;
  try {
    setUpdatingId(reportId);
    setError('');
    const token = getToken();
    await axios.delete(`${API_URL}/ViolenceReport/Delete/${reportId}`, {
      headers: { 'auth-token': token }
    });
    setReports((prev) => prev.filter((r) => r._id !== reportId));
  } catch (error) {
    console.error('Error deleting report:', error);
    setError(error.response?.data?.message || 'Unable to delete report.');
  } finally {
    setUpdatingId(null);
  }
};

// ==========================================
// FILTER REPORTS
// ==========================================

const filteredReports = useMemo(() => {
const normalizedSearch =
searchTerm.trim().toLowerCase();

return reports.filter((report) => {

const stationName =
typeof report.policeStationId === 'object'
? report.policeStationId?.stationName
: report.policeStationId;

const searchableValues = [
report.incidentNumber,
report.category,
report.severity,
report.location,
report.description,
report.status,
stationName,
report.isAnonymous ? 'anonymous' : 'identified',
report.isInjured ? 'injured' : 'not injured'
]
.filter(Boolean)
.join(' ')
.toLowerCase();

const matchesSearch =
normalizedSearch === '' ||
searchableValues.includes(normalizedSearch);

const matchesStatus =
statusFilter === 'All' ||
report.status === statusFilter;

const matchesSeverity =
severityFilter === 'All' ||
report.severity === severityFilter;

return (
matchesSearch &&
matchesStatus &&
matchesSeverity
);
});

}, [
reports,
searchTerm,
statusFilter,
severityFilter
]);

// ==========================================
// PAGINATION
// ==========================================

const paginatedReports = useMemo(() => {

const startIndex =
page * rowsPerPage;

return filteredReports.slice(
startIndex,
startIndex + rowsPerPage
);

}, [
filteredReports,
page,
rowsPerPage
]);

useEffect(() => {
setPage(0);
}, [
searchTerm,
statusFilter,
severityFilter
]);

// ==========================================
// CLEAR FILTERS
// ==========================================

const handleClearFilters = () => {

setSearchTerm('');
setStatusFilter('All');
setSeverityFilter('All');
setPage(0);

};

// ==========================================
// PAGINATION HANDLERS
// ==========================================

const handleChangePage = (
event,
newPage
) => {
setPage(newPage);
};

const handleChangeRowsPerPage = (
event
) => {

setRowsPerPage(
Number(event.target.value)
);

setPage(0);
};

// ==========================================
// STATUS COLOR
// ==========================================

const getStatusChipColor = (status) => {

  switch (status) {

    case 'Resolved':
      return 'success';

    case 'Dispatched':
      return 'info';

    case 'Under Review':
      return 'warning';

    case 'Assigned':
      return 'primary';

    case 'Pending':
      return 'default';

    default:
      return 'default';
  }
};

// ==========================================
// SEVERITY COLOR
// ==========================================

const getSeverityChipColor = (
severity
) => {

switch (
severity?.toLowerCase()
) {

case 'urgent':
return 'error';

case 'high':
return 'warning';

case 'med':
return 'info';

case 'low':
return 'success';

default:
return 'default';
}
};

// ==========================================
// STATION NAME
// ==========================================

const getStationName = (
report
) => {

if (
typeof report.policeStationId ===
'object'
) {

return (
report.policeStationId
?.stationName ||
'Not assigned'
);
}

return (
report.policeStationId ||
'Not assigned'
);
};

// ==========================================
// FORMAT DATE
// ==========================================

const formatDate = (
dateValue
) => {

if (!dateValue) {
return 'N/A';
}

const date =
new Date(dateValue);

if (
Number.isNaN(
date.getTime()
)
) {
return 'N/A';
}

return date.toLocaleString(
'en-IN',
{
day: '2-digit',
month: 'short',
year: 'numeric',
hour: '2-digit',
minute: '2-digit'
}
);
};

// ==========================================
// OPEN LOCATION
// ==========================================

const openLocation = (
report
) => {

if (
report.latitude == null ||
report.longitude == null
) {
return;
}

const mapUrl =
`https://www.google.com/maps?q=${report.latitude},${report.longitude}`;

window.open(
mapUrl,
'_blank',
'noopener,noreferrer'
);
};

const hasActiveFilters =
searchTerm !== '' ||
statusFilter !== 'All' ||
severityFilter !== 'All';

// ==========================================
// UI
// ==========================================

return (
<Box p={{ xs: 2, md: 3 }}>

    {/* HEADER */}

    <Box display="flex" justifyContent="space-between" alignItems={{
          xs: 'flex-start',
          sm: 'center'
        }} flexDirection={{
          xs: 'column',
          sm: 'row'
        }} gap={2} mb={3}>

        <Box>

            <Typography variant="h4" fontWeight={700}>
                Violence Report Requests
            </Typography>

            <Typography variant="body2" color="text.secondary">
                View, review and manage violence
                reports assigned to the police station.
            </Typography>

        </Box>

        <Tooltip title="Refresh reports">

            <IconButton color="primary" onClick={fetchReports} disabled={loading}>
                <Refresh />
            </IconButton>

        </Tooltip>

    </Box>

    {/* ERROR */}

    {error && (
    <Alert severity="error" sx={{ mb: 2 }} onClose={()=>
        setError('')
        }
        >
        {error}
    </Alert>
    )}

    {/* FILTERS */}

    <Paper elevation={0} sx={{
          p: 2,
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2
        }}>

        <Stack direction={{
            xs: 'column',
            md: 'row'
          }} spacing={2} alignItems={{
            xs: 'stretch',
            md: 'center'
          }}>

            {/* SEARCH */}

            <TextField fullWidth size="small" label="Search reports"
                placeholder="Search incident number, category, location..." value={searchTerm} onChange={(event)=>
                setSearchTerm(
                event.target.value
                )
                }
                InputProps={{
              startAdornment: (
                <InputAdornment
                  position="start"
                >
                  <Search />
                </InputAdornment>
              ),

              endAdornment:
                searchTerm && (
                  <InputAdornment
                    position="end"
                  >
                    <IconButton
                      size="small"
                      onClick={() =>
                        setSearchTerm('')
                      }
                    >
                      <Clear fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
            }}
                />

                {/* STATUS */}

                <FormControl size="small" sx={{
              minWidth: {
                xs: '100%',
                md: 190
              }
            }}>

                    <InputLabel>
                        Status
                    </InputLabel>

                   <Select
  value={statusFilter}
  label="Status"
  onChange={(event) =>
    setStatusFilter(event.target.value)
  }
>

  <MenuItem value="All">
    All statuses
  </MenuItem>

  <MenuItem value="Pending">
    Pending
  </MenuItem>

  <MenuItem value="Assigned">
    Assigned
  </MenuItem>

  <MenuItem value="Under Review">
    Under Review
  </MenuItem>

  <MenuItem value="Dispatched">
    Dispatched
  </MenuItem>

  <MenuItem value="Resolved">
    Resolved
  </MenuItem>

</Select>

                </FormControl>

                {/* SEVERITY */}

                <FormControl size="small" sx={{
              minWidth: {
                xs: '100%',
                md: 160
              }
            }}>

                    <InputLabel>
                        Severity
                    </InputLabel>

                    <Select value={severityFilter} label="Severity" onChange={(event)=>
                        setSeverityFilter(
                        event.target.value
                        )
                        }
                        >

                        <MenuItem value="All">
                        All severity
                        </MenuItem>

                        <MenuItem value="urgent">
                        Urgent
                        </MenuItem>

                        <MenuItem value="high">
                        High
                        </MenuItem>

                        <MenuItem value="med">
                        Medium
                        </MenuItem>

                        <MenuItem value="low">
                        Low
                        </MenuItem>

                    </Select>

                </FormControl>

                {/* CLEAR */}

                <Button variant="outlined" startIcon={<Clear />}
                onClick={
                handleClearFilters
                }
                disabled={
                !hasActiveFilters
                }
                sx={{
              whiteSpace: 'nowrap',
              minWidth: 140
            }}
                >
                Clear filters
                </Button>

        </Stack>

    </Paper>

    {/* TABLE */}

    <Paper elevation={0} sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden'
        }}>

        {/* TABLE HEADER */}

        <Box px={2} py={1.5} display="flex" justifyContent="space-between" alignItems="center" borderBottom="1px solid"
            borderColor="divider">

            <Typography variant="subtitle1" fontWeight={600}>
                Violence Report Requests
            </Typography>

            <Chip label={`${filteredReports.length} report${ filteredReports.length===1 ? '' : 's' }`} size="small"
                color="primary" variant="outlined" />

        </Box>

        <TableContainer sx={{
            maxHeight: 650
          }}>

            <Table stickyHeader sx={{
              minWidth: 1500
            }}>

                <TableHead>

                    <TableRow>

                        <TableCell sx={{
                    fontWeight: 700
                  }}>
                            Incident
                        </TableCell>

                        <TableCell sx={{
                    fontWeight: 700
                  }}>
                            Category
                        </TableCell>

                        <TableCell sx={{
                    fontWeight: 700
                  }}>
                            Location
                        </TableCell>

                        <TableCell sx={{
                    fontWeight: 700
                  }}>
                            Police Station
                        </TableCell>

                        <TableCell sx={{
                    fontWeight: 700
                  }}>
                            Distance
                        </TableCell>

                        <TableCell sx={{
                    fontWeight: 700
                  }}>
                            Severity
                        </TableCell>

                        <TableCell sx={{
                    fontWeight: 700
                  }}>
                            Report Details
                        </TableCell>

                        <TableCell sx={{
                    fontWeight: 700
                  }}>
                            Status
                        </TableCell>

                        <TableCell sx={{
                    fontWeight: 700
                  }}>
                            Reported Date
                        </TableCell>

                        <TableCell align="center" sx={{
                    fontWeight: 700,
                    minWidth: 250
                  }}>
                            Actions
                        </TableCell>

                    </TableRow>

                </TableHead>

                <TableBody>

                    {/* LOADING */}

                    {loading ? (

                    <TableRow>

                        <TableCell colSpan={10} align="center">

                            <Box py={6} display="flex" flexDirection="column" alignItems="center" gap={2}>

                                <CircularProgress size={32} />

                                <Typography color="text.secondary">
                                    Loading violence reports...
                                </Typography>

                            </Box>

                        </TableCell>

                    </TableRow>

                    ) : paginatedReports.length === 0 ? (

                    /* EMPTY */

                    <TableRow>

                        <TableCell colSpan={10} align="center">

                            <Box py={6}>

                                <Typography variant="h6" color="text.secondary">
                                    No violence reports found
                                </Typography>

                                <Typography variant="body2" color="text.secondary" mt={1}>
                                    Try changing the search
                                    text or filters.
                                </Typography>

                            </Box>

                        </TableCell>

                    </TableRow>

                    ) : (

                    /* REPORTS */

                    paginatedReports.map(
                    (report) => {

                    const isUpdating =
                    updatingId ===
                    report._id;

                    const isResolved =
                    report.status ===
                    'Resolved';

                    const isRejected =
                    report.status ===
                    'Rejected';

                    const canOpenLocation =
                    report.latitude != null &&
                    report.longitude != null;

                    return (

                    <TableRow key={report._id} hover sx={{
                          '&:last-child td': {
                            borderBottom: 0
                          }
                        }}>

                        {/* INCIDENT NUMBER */}

                        <TableCell>

                            <Typography variant="body2" fontWeight={600}>
                                {report.incidentNumber ||
                                'N/A'}
                            </Typography>

                        </TableCell>

                        {/* CATEGORY */}

                        <TableCell>

                            <Typography variant="body2">
                                {report.category ||
                                'Unknown'}
                            </Typography>

                        </TableCell>

                        {/* LOCATION */}

                        <TableCell sx={{
                            maxWidth: 240
                          }}>

                            <Typography variant="body2" sx={{
                              whiteSpace:
                                'normal',
                              wordBreak:
                                'break-word'
                            }}>
                                {report.location ||
                                'Location unavailable'}
                            </Typography>

                            {canOpenLocation && (

                            <Button size="small" startIcon={ <LocationOn />
                            }
                            onClick={() =>
                            openLocation(
                            report
                            )
                            }
                            sx={{
                                mt: 0.5,
                                px: 0
                              }}
                            >
                            View map
                            </Button>

                            )}

                        </TableCell>

                        {/* POLICE STATION */}

                        <TableCell>

                            <Typography variant="body2" fontWeight={600}>
                                {getStationName(
                                report
                                )}
                            </Typography>

                            {typeof report.policeStationId ===
                            'object' &&
                            report.policeStationId
                            ?.address && (

                            <Typography variant="caption" color="text.secondary">
                                {
                                report
                                .policeStationId
                                .address
                                }
                            </Typography>

                            )}

                        </TableCell>

                        {/* DISTANCE */}

                        <TableCell>

                            {report.distanceFromStation !=
                            null ? (

                            <Chip size="small" label={`${report.distanceFromStation} KM`} color="info"
                                variant="outlined" />

                            ) : (

                            <Typography variant="body2" color="text.secondary">
                                N/A
                            </Typography>

                            )}

                        </TableCell>

                        {/* SEVERITY */}

                        <TableCell>

                            <Chip size="small" label={ report.severity || 'N/A' } color={ getSeverityChipColor(
                                report.severity ) } variant="outlined" />

                        </TableCell>

                        {/* REPORT DETAILS */}

                        <TableCell sx={{
                            maxWidth: 280
                          }}>

                            <Typography variant="body2" sx={{
                              whiteSpace:
                                'normal',
                              wordBreak:
                                'break-word',
                              mb: 1
                            }}>
                                {report.description ||
                                'No description'}
                            </Typography>

                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>

                                {report.isAnonymous && (

                                <Chip label="Anonymous" size="small" variant="outlined" />

                                )}

                                {report.isInjured && (

                                <Chip label="Injured" size="small" color="error" variant="outlined" />

                                )}

                            </Stack>

                            {report.images && report.images.length > 0 && (
                              <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                                {report.images.map((img, idx) => (
                                  <a key={idx} href={getImageUrl(img)} target="_blank" rel="noreferrer">
                                    <img
                                      src={getImageUrl(img)}
                                      alt={`Evidence ${idx + 1}`}
                                      style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid #ccc' }}
                                    />
                                  </a>
                                ))}
                              </Stack>
                            )}

                        </TableCell>

                        {/* STATUS */}

                        <TableCell>

                            <Chip size="small" label={ report.status || 'Pending' } color={ getStatusChipColor(
                                report.status || 'Pending' ) } />

                        </TableCell>

                        {/* DATE */}

                        <TableCell>

                            <Typography variant="body2">
                                {formatDate(
                                report.createdAt
                                )}
                            </Typography>

                        </TableCell>

                        {/* ACTIONS */}

<TableCell align="center">

  <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
    {isResolved ? (

      <Chip
        label="Report resolved"
        color="success"
        size="small"
      />

    ) : (

      <Stack
        direction="row"
        spacing={1}
        justifyContent="center"
        flexWrap="wrap"
        useFlexGap
      >

        {/* PENDING → ASSIGNED */}

        {report.status === 'Pending' && (

          <Button
            variant="outlined"
            size="small"
            disabled={isUpdating}
            onClick={() =>
              updateReportStatus(
                report._id,
                'Assigned'
              )
            }
          >
            Assign
          </Button>

        )}

        {/* ASSIGNED → UNDER REVIEW */}

        {report.status === 'Assigned' && (

          <Button
            variant="outlined"
            size="small"
            color="warning"
            disabled={isUpdating}
            onClick={() =>
              updateReportStatus(
                report._id,
                'Under Review'
              )
            }
          >
            Review
          </Button>

        )}

        {/* UNDER REVIEW → DISPATCHED */}

        {report.status === 'Under Review' && (

          <Button
            variant="outlined"
            size="small"
            color="info"
            disabled={isUpdating}
            onClick={() =>
              updateReportStatus(
                report._id,
                'Dispatched'
              )
            }
          >
            Dispatch
          </Button>

        )}

        {/* DISPATCHED → RESOLVED */}

        {report.status === 'Dispatched' && (

          <Button
            variant="contained"
            size="small"
            color="success"
            disabled={isUpdating}
            onClick={() =>
              updateReportStatus(
                report._id,
                'Resolved'
              )
            }
          >
            Resolve
          </Button>

        )}

      </Stack>

    )}

    <Tooltip title="Delete report">
      <IconButton
        color="error"
        size="small"
        disabled={isUpdating}
        onClick={() => handleDeleteReport(report._id)}
      >
        <Delete fontSize="small" />
      </IconButton>
    </Tooltip>
  </Stack>

  {isUpdating && (

    <Typography
      variant="caption"
      color="text.secondary"
      display="block"
      mt={1}
    >
      Updating...
    </Typography>

  )}

</TableCell>

                    </TableRow>

                    );
                    }
                    )

                    )}

                </TableBody>

            </Table>

        </TableContainer>

        {/* PAGINATION */}

        <TablePagination component="div" count={ filteredReports.length } page={page} onPageChange={ handleChangePage }
            rowsPerPage={ rowsPerPage } onRowsPerPageChange={ handleChangeRowsPerPage } rowsPerPageOptions={[ 5, 10, 25,
            50 ]} labelRowsPerPage="Rows per page" />

    </Paper>

</Box>
);
};

export default Voilationincident;