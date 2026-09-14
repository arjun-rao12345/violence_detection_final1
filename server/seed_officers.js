const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const PoliceStation = require('./Models/policeStation');
const Officer = require('./Models/Officer');

const mongoURL = process.env.URI || "mongodb://127.0.0.1/voilation";

const officersData = [
  {
    officerName: "Officer Vance",
    badgeNumber: "BADGE_DPS",
    rank: "Inspector",
    phone: "9876543001",
    stationCode: "DPS101"
  },
  {
    officerName: "Officer Raymond",
    badgeNumber: "BADGE_NPP",
    rank: "Inspector",
    phone: "9876543002",
    stationCode: "NPP102"
  },
  {
    officerName: "Officer Benson",
    badgeNumber: "BADGE_SRP",
    rank: "Inspector",
    phone: "9876543003",
    stationCode: "SRP103"
  },
  {
    officerName: "Officer Reagan",
    badgeNumber: "BADGE_EPS",
    rank: "Inspector",
    phone: "9876543004",
    stationCode: "EPS104"
  },
  {
    officerName: "Officer Aceveda",
    badgeNumber: "BADGE_WPS",
    rank: "Inspector",
    phone: "9876543005",
    stationCode: "WPS105"
  }
];

const seedOfficers = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(mongoURL);
    console.log('Connected to MongoDB.');

    const hashedPassword = await bcrypt.hash('password123', 10);
    const defaultEmail = process.env.EMAIL_USER || 'humansafetysystem@gmail.com';

    for (const officerInfo of officersData) {
      const station = await PoliceStation.findOne({ stationCode: officerInfo.stationCode });
      if (!station) {
        console.warn(`Station with code ${officerInfo.stationCode} not found. Skipping officer.`);
        continue;
      }

      let officer = await Officer.findOne({ badgeNumber: officerInfo.badgeNumber });
      if (!officer) {
        officer = new Officer({
          stationId: station._id,
          officerName: officerInfo.officerName,
          badgeNumber: officerInfo.badgeNumber,
          rank: officerInfo.rank,
          email: `${officerInfo.badgeNumber.toLowerCase()}@example.com`, // Custom email to avoid duplicates
          phone: officerInfo.phone,
          password: hashedPassword,
          status: "Active",
          firstLogin: false
        });
        await officer.save();
        console.log(`Created Officer: ${officerInfo.officerName} (Badge: ${officerInfo.badgeNumber})`);
      } else {
        officer.password = hashedPassword;
        officer.firstLogin = false;
        await officer.save();
        console.log(`Officer ${officerInfo.officerName} (Badge: ${officerInfo.badgeNumber}) already exists, password updated to password123.`);
      }
    }

    console.log('Officer seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Officer seeding error:', error);
    process.exit(1);
  }
};

seedOfficers();
