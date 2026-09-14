const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const PoliceStation = require('./Models/policeStation');
const Officer = require('./Models/Officer');
const Camera = require('./Models/Camera');

const mongoURL = process.env.URI || "mongodb://127.0.0.1/voilation";

const seed = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(mongoURL);
    console.log('Connected to MongoDB.');

    // 1. Create or get Police Station
    let station = await PoliceStation.findOne({ stationCode: 'CPS001' });
    if (!station) {
      station = new PoliceStation({
        stationName: "Central Police Station",
        stationCode: "CPS001",
        address: "123 Main Street, Downtown",
        city: "Metro City",
        state: "Metro State",
        pincode: "123456",
        contactNumber: "9876543210",
        email: process.env.EMAIL_USER || "central_police@example.com",
        inchargeName: "Chief John Doe",
        inchargePhone: "9876543211",
        latitude: "12.9716",
        longitude: "77.5946",
        status: "Active"
      });
      await station.save();
      console.log('Created Police Station: CPS001');
    } else {
      console.log('Police Station CPS001 already exists.');
    }

    // 2. Create or get Officer
    let officer = await Officer.findOne({ badgeNumber: 'BADGE123' });
    const hashedPassword = await bcrypt.hash('password123', 10);
    if (!officer) {
      officer = new Officer({
        stationId: station._id,
        officerName: "Officer Smith",
        badgeNumber: "BADGE123",
        rank: "Inspector",
        email: process.env.EMAIL_USER || "humansafetysystem@gmail.com",
        phone: "9876543212",
        password: hashedPassword,
        status: "Active",
        firstLogin: false
      });
      await officer.save();
      console.log('Created Officer: BADGE123 / password123');
    } else {
      officer.password = hashedPassword;
      officer.firstLogin = false;
      officer.email = process.env.EMAIL_USER || "humansafetysystem@gmail.com";
      await officer.save();
      console.log('Updated Officer: BADGE123 / password123');
    }

    // 3. Create or get Camera
    let camera = await Camera.findOne({ cameraName: 'Test Live Camera' });
    if (!camera) {
      camera = new Camera({
        cameraName: "Test Live Camera",
        latitude: 12.9716,
        longitude: 77.5946,
        address: "CCTV Pole #14, Main Road Crossroads",
        streamUrl: "0", // Default to webcam
        ipAddress: "192.168.1.100",
        policeStationId: station._id,
        status: "Active",
        resolution: "1080p",
        nightVision: true,
        alertsCount: 0
      });
      await camera.save();
      console.log('Created Camera: Test Live Camera');
    } else {
      camera.policeStationId = station._id;
      camera.streamUrl = "0"; // Make sure it points to default source (0 is local webcam)
      await camera.save();
      console.log('Updated Camera: Test Live Camera');
    }

    console.log('Database seeding successfully completed.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();
