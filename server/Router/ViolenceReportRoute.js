const express = require("express");
const router = express.Router();

const {
  Insert,
  GetAll,
  GetById,
  GetReportsByStation,
  UpdateStatus,
  Delete,
  GetMyAssignedReports,
  GetMyReports
} = require("../Controller/ViolenceReportController");

const upload = require("../Config/Multer");
const auth = require("../Middleware/auth"); // <-- change path if needed
const fetchOfficer = require("../Middleware/fetchOfficer"); // <-- change path if needed


// CREATE REPORT
router.post(
  "/Insert",
  auth,
  upload.array("images", 5),
  Insert
);


// GET ALL REPORTS
router.get(
  "/GetAll",
  GetAll
);


// GET REPORT BY ID
router.get(
  "/GetById/:id",
  GetById
);


// GET REPORTS FOR PARTICULAR POLICE STATION
router.get(
  "/GetByStation/:stationId",
  GetReportsByStation
);


// UPDATE STATUS
router.put(
  "/UpdateStatus/:id",
    auth,
  UpdateStatus
);


// DELETE REPORT
router.delete(
  "/Delete/:id",
  Delete
);
// GET MY REPORTS (FOR LOGGED-IN USER)
router.get(
  "/GetMyReports",
  auth,
  GetMyReports
);

router.get("/GetMyAssigned", fetchOfficer, GetMyAssignedReports);
module.exports = router;