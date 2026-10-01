import React, { useState, useEffect } from "react";
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
  MenuItem,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import axios from "axios";
import { motion } from "framer-motion";

const Officers = () => {
  const [officers, setOfficers] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const BASE_URL = "http://localhost:4001/officers";

  const [formData, setFormData] = useState({
    stationId: "",
    officerName: "",
    badgeNumber: "",
    rank: "",
    email: "",
    phone: "",
    // password: "",
    status: "Active",
  });

  

  const ranks = [
    "Constable",
    "Head Constable",
    "Sub Inspector",
    "Inspector",
    "DSP",
    "ACP",
    "DCP",
  ];

  useEffect(() => {
    fetchOfficers();
    fetchStations();
  }, []);

  const fetchOfficers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/GetAllOfficer`);
      setOfficers(res.data);
    } catch (err) {
      console.error("Fetch officers failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    try {
      const res = await axios.get(
        "http://localhost:4001/policeStation/getAllPoliceStations"
      );

      setStations(res.data.data);
    } catch (err) {
      console.error("Fetch stations failed:", err);
    }
  };

  const handleOpen = (officer = null) => {
    if (officer) {
      setEditingId(officer._id);

      setFormData({
        stationId: officer.stationId?._id || officer.stationId || "",
        officerName: officer.officerName || "",
        badgeNumber: officer.badgeNumber || "",
        rank: officer.rank || "",
        email: officer.email || "",
        phone: officer.phone || "",
        // password: "",
        status: officer.status || "Active",
      });
    } else {
      setEditingId(null);

      setFormData({
        stationId: "",
        officerName: "",
        badgeNumber: "",
        rank: "",
        email: "",
        phone: "",
        // password: "",
        status: "Active",
      });
    }

    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const onlyNumbers = value.replace(/\D/g, "");
      setFormData({ ...formData, phone: onlyNumbers });
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    if (!formData.stationId) {
      alert("Please select police station");
      return false;
    }

    if (!formData.officerName.trim()) {
      alert("Officer name is required");
      return false;
    }

    if (!formData.badgeNumber.trim()) {
      alert("Badge number is required");
      return false;
    }

    if (!formData.rank) {
      alert("Rank is required");
      return false;
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      alert("Enter valid email");
      return false;
    }

    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      alert("Enter valid 10 digit phone number");
      return false;
    }

    // if (!editingId && formData.password.length < 6) {
    //   alert("Password must be at least 6 characters");
    //   return false;
    // }

    return true;
  };

  // const handleSubmit = async () => {
  //   if (!validateForm()) return;

  //   try {
  //     const submitData = { ...formData };

  //     if (editingId && !submitData.password) {
  //       delete submitData.password;
  //     }

  //     if (editingId) {
  //       await axios.put(`${BASE_URL}/UpdateOfficer/${editingId}`, submitData);
  //     } else {
  //       await axios.post(`${BASE_URL}/InsertOfficer`, submitData);
  //     }

  //     fetchOfficers();
  //     handleClose();
  //   } catch (err) {
  //     console.error(err);
  //     alert(err.response?.data?.message || "Something went wrong");
  //   }
  // };

  
  const handleSubmit = async () => {
  if (!validateForm()) return;

  try {
    const submitData = { ...formData };

    if (editingId) {
      await axios.put(`${BASE_URL}/UpdateOfficer/${editingId}`, submitData);
    } else {
      await axios.post(`${BASE_URL}/InsertOfficer`, submitData);
    }

    fetchOfficers();
    handleClose();

    alert(
      editingId
        ? "Officer updated successfully"
        : "Officer added successfully. Security code sent to officer email."
    );
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "Something went wrong");
  }
};
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this officer?")) return;

    try {
      await axios.delete(`${BASE_URL}/DeleteOfficer/${id}`);
      fetchOfficers();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  // Stations already assigned to an officer (excluding the officer currently being edited)
const assignedStationIds = officers
  .filter((o) => o._id !== editingId)
  .map((o) => o.stationId?._id || o.stationId);

const availableStations = stations.filter(
  (station) => !assignedStationIds.includes(station._id)
);
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" className="font-bold text-primary">
          Manage Police Officers
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          Add Officer
        </Button>
      </Box>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow className="bg-black/5 dark:bg-white/5">
                  <TableCell sx={{ fontWeight: "bold" }}>Badge No</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Officer Name</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Rank</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Station Code</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {officers.map((officer) => (
                  <TableRow key={officer._id} hover>
                    <TableCell>{officer.badgeNumber}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {officer.officerName}
                    </TableCell>
                    <TableCell>{officer.rank}</TableCell>
                  <TableCell>
  {officer.stationId
    ? `${officer.stationId.stationName} - ${officer.stationId.stationCode}`
    : "-"}
</TableCell>
                    <TableCell>{officer.email}</TableCell>
                    <TableCell>{officer.phone}</TableCell>
                    <TableCell>{officer.status}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpen(officer)}
                        size="small"
                      >
                        <Edit fontSize="small" />
                      </IconButton>

                      <IconButton
                        color="error"
                        onClick={() => handleDelete(officer._id)}
                        size="small"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}

                {officers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No officers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </motion.div>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? "Edit Officer" : "Add New Officer"}
        </DialogTitle>

        <DialogContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              mt: 1,
            }}
          >
         <TextField
  select
  label="Police Station"
  name="stationId"
  value={formData.stationId}
  onChange={handleChange}
  fullWidth
  required
>
  {availableStations.map((station) => (
    <MenuItem key={station._id} value={station._id}>
      {station.stationName} - {station.stationCode}
    </MenuItem>
  ))}
</TextField>

            <TextField
              label="Officer Name"
              name="officerName"
              value={formData.officerName}
              onChange={handleChange}
              fullWidth
              required
            />

            <TextField
              label="Badge Number"
              name="badgeNumber"
              value={formData.badgeNumber}
              onChange={handleChange}
              fullWidth
              required
            />

            <TextField
              select
              label="Rank"
              name="rank"
              value={formData.rank}
              onChange={handleChange}
              fullWidth
              required
            >
              {ranks.map((rank) => (
                <MenuItem key={rank} value={rank}>
                  {rank}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              required
            />

            <TextField
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              fullWidth
              required
              slotProps={{
                htmlInput: {
                  maxLength: 10,
                },
              }}
            />

            {/* <TextField
              label={editingId ? "New Password Optional" : "Password"}
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              fullWidth
              required={!editingId}
            /> */}

            <TextField
              select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>

          <Button onClick={handleSubmit} variant="contained" color="primary">
            Save Officer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Officers;