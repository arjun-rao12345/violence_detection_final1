const mongoose = require('mongoose');
require('dotenv').config();

const PoliceStation = require('./Models/policeStation');
const Camera = require('./Models/Camera');

const mongoURL = process.env.URI || "mongodb://127.0.0.1/voilation";

const policeStationsData = [
  {
    stationName: "Downtown Police Station",
    stationCode: "DPS101",
    address: "456 Broadway Ave",
    city: "Metro City",
    state: "Metro State",
    pincode: "100001",
    contactNumber: "9110002001",
    email: process.env.EMAIL_USER || "downtown@example.com",
    inchargeName: "Capt. Allison Vance",
    inchargePhone: "9110003001",
    latitude: "40.7128",
    longitude: "-74.0060",
    status: "Active"
  },
  {
    stationName: "Northside Police Precinct",
    stationCode: "NPP102",
    address: "789 Elm Boulevard",
    city: "Metro City",
    state: "Metro State",
    pincode: "100002",
    contactNumber: "9110002002",
    email: process.env.EMAIL_USER || "northside@example.com",
    inchargeName: "Capt. Raymond Holt",
    inchargePhone: "9110003002",
    latitude: "40.7829",
    longitude: "-73.9654",
    status: "Active"
  },
  {
    stationName: "South River Precinct",
    stationCode: "SRP103",
    address: "102 Harbor Drive",
    city: "Metro City",
    state: "Metro State",
    pincode: "100003",
    contactNumber: "9110002003",
    email: process.env.EMAIL_USER || "southriver@example.com",
    inchargeName: "Capt. Olivia Benson",
    inchargePhone: "9110003003",
    latitude: "40.6782",
    longitude: "-73.9442",
    status: "Active"
  },
  {
    stationName: "Eastside Police Station",
    stationCode: "EPS104",
    address: "333 Express Way",
    city: "Metro City",
    state: "Metro State",
    pincode: "100004",
    contactNumber: "9110002004",
    email: process.env.EMAIL_USER || "eastside@example.com",
    inchargeName: "Capt. Frank Reagan",
    inchargePhone: "9110003004",
    latitude: "40.7259",
    longitude: "-73.9808",
    status: "Active"
  },
  {
    stationName: "Westside Police Station",
    stationCode: "WPS105",
    address: "888 Sunset Blvd",
    city: "Metro City",
    state: "Metro State",
    pincode: "100005",
    contactNumber: "9110002005",
    email: process.env.EMAIL_USER || "westside@example.com",
    inchargeName: "Capt. David Aceveda",
    inchargePhone: "9110003005",
    latitude: "40.7589",
    longitude: "-73.9851",
    status: "Active"
  }
];

const camerasData = [
  {
    cameraName: "Downtown Main Entrance Cam",
    latitude: 40.7128,
    longitude: -74.0060,
    address: "456 Broadway Ave (Main Entrance Gate)",
    streamUrl: "0", // Default to webcam for local testing
    ipAddress: "192.168.10.11",
    resolution: "1080p",
    nightVision: true
  },
  {
    cameraName: "Broadway Shopping Alley Cam",
    latitude: 40.7135,
    longitude: -74.0055,
    address: "Intersection of Broadway & Wall St",
    streamUrl: "0",
    ipAddress: "192.168.10.12",
    resolution: "1080p",
    nightVision: true
  },
  {
    cameraName: "Northside Central Park Cam",
    latitude: 40.7829,
    longitude: -73.9654,
    address: "Central Park West Pedestrian Path",
    streamUrl: "0",
    ipAddress: "192.168.20.11",
    resolution: "1080p",
    nightVision: true
  },
  {
    cameraName: "Northside Subway Exit Cam",
    latitude: 40.7850,
    longitude: -73.9680,
    address: "86th St Subway Station Exit A",
    streamUrl: "0",
    ipAddress: "192.168.20.12",
    resolution: "1080p",
    nightVision: true
  },
  {
    cameraName: "South River Harbor Cam",
    latitude: 40.6782,
    longitude: -73.9442,
    address: "Harbor Promenade, Pole #8",
    streamUrl: "0",
    ipAddress: "192.168.30.11",
    resolution: "1080p",
    nightVision: true
  },
  {
    cameraName: "South River Bridge Entry Cam",
    latitude: 40.6750,
    longitude: -73.9490,
    address: "Brooklyn Bridge South Pedestrian Entrance",
    streamUrl: "0",
    ipAddress: "192.168.30.12",
    resolution: "1080p",
    nightVision: true
  },
  {
    cameraName: "Eastside Square Market Cam",
    latitude: 40.7259,
    longitude: -73.9808,
    address: "Eastside Square Central Market Area",
    streamUrl: "0",
    ipAddress: "192.168.40.11",
    resolution: "1080p",
    nightVision: true
  },
  {
    cameraName: "Eastside Main Highway Cam",
    latitude: 40.7280,
    longitude: -73.9780,
    address: "FDR Drive Exit Ramp Lane 1",
    streamUrl: "0",
    ipAddress: "192.168.40.12",
    resolution: "1080p",
    nightVision: true
  },
  {
    cameraName: "Westside Times Square Cam",
    latitude: 40.7589,
    longitude: -73.9851,
    address: "Times Square Broadway Crossing Pedestrian Zone",
    streamUrl: "0",
    ipAddress: "192.168.50.11",
    resolution: "1080p",
    nightVision: true
  },
  {
    cameraName: "Westside Parking Lot Cam",
    latitude: 40.7610,
    longitude: -73.9880,
    address: "8th Ave Multi-storey Parking Lot Level 2",
    streamUrl: "0",
    ipAddress: "192.168.50.12",
    resolution: "1080p",
    nightVision: true
  }
];

const seedBulk = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(mongoURL);
    console.log('Connected to MongoDB.');

    // 1. Insert Police Stations
    const stationsMap = {};
    for (const stationInfo of policeStationsData) {
      let station = await PoliceStation.findOne({ stationCode: stationInfo.stationCode });
      if (!station) {
        station = new PoliceStation(stationInfo);
        await station.save();
        console.log(`Created Police Station: ${station.stationName}`);
      } else {
        console.log(`Station ${stationInfo.stationName} already exists.`);
      }
      stationsMap[stationInfo.stationCode] = station._id;
    }

    // 2. Insert Cameras linked to the Stations
    const stationMapping = {
      0: "DPS101", // Downtown
      1: "DPS101",
      2: "NPP102", // Northside
      3: "NPP102",
      4: "SRP103", // South River
      5: "SRP103",
      6: "EPS104", // Eastside
      7: "EPS104",
      8: "WPS105", // Westside
      9: "WPS105"
    };

    for (let i = 0; i < camerasData.length; i++) {
      const cameraInfo = camerasData[i];
      let camera = await Camera.findOne({ cameraName: cameraInfo.cameraName });
      const targetStationCode = stationMapping[i];
      const stationId = stationsMap[targetStationCode];

      if (!camera) {
        camera = new Camera({
          ...cameraInfo,
          policeStationId: stationId,
          status: "Inactive" // Start as inactive so user can trigger in dashboard
        });
        await camera.save();
        console.log(`Created Camera: ${camera.cameraName}`);
      } else {
        camera.policeStationId = stationId;
        await camera.save();
        console.log(`Camera ${cameraInfo.cameraName} already exists and updated station.`);
      }
    }

    console.log('Bulk seeding successfully completed!');
    process.exit(0);
  } catch (error) {
    console.error('Bulk seeding error:', error);
    process.exit(1);
  }
};

seedBulk();
