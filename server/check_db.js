const mongoose = require('mongoose');
require('dotenv').config();

const Incident = require('./Models/Incident');
const EmergencyAlert = require('./Models/EmergencyAlert');
const Camera = require('./Models/Camera');
const Officer = require('./Models/Officer');

const mongoURL = process.env.URI || "mongodb://127.0.0.1/voilation";

async function check() {
  await mongoose.connect(mongoURL);
  console.log('--- CAMERAS ---');
  const cameras = await Camera.find().lean();
  console.log(cameras);

  console.log('--- OFFICERS ---');
  const officers = await Officer.find().lean();
  console.log(officers);

  console.log('--- INCIDENTS ---');
  const incidents = await Incident.find().lean();
  console.log(incidents);

  console.log('--- ALERTS ---');
  const alerts = await EmergencyAlert.find().lean();
  console.log(alerts);

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
