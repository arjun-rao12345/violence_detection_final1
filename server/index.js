const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const app = express();
require('dotenv').config();

const cors = require('cors');
app.use(express.json());
app.use(cors());

const connectToMongo = require('./DB.js');
connectToMongo();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

global.io = io;

app.use('/admin', require('./Router/adminRouter.js'));
app.use('/log', require('./Router/logRouter.js'));
// app.use('/upload', express.static('./uploads'));
const uploadsPath = path.join(__dirname, 'uploads');

app.use('/upload', express.static(uploadsPath));
app.use('/uploads', express.static(uploadsPath));

console.log('Uploads directory:', uploadsPath);
app.get(/^\/download\/(.+)$/, (req, res) => {
  const fileRelativePath = req.params[0];
  const filePath = path.resolve(__dirname, 'uploads', fileRelativePath);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  res.download(filePath, path.basename(filePath), (err) => {
    if (err) {
      if (!res.headersSent) {
        res.status(500).send('Error downloading file');
      }
    }
  });
});

// Violation System Routers
app.use('/officers', require('./Router/officerRouter.js'));
app.use('/cameras', require('./Router/cameraRouter.js'));
app.use('/incidents', require('./Router/incidentRouter.js'));
app.use('/alerts', require('./Router/alertRouter.js'));
app.use('/backups', require('./Router/backupRouter.js'));
app.use('/policeStation', require('./Router/policeStationRoute.js'));
app.use("/ViolenceReport",require('./Router/ViolenceReportRoute.js'));
app.use("/User",require('./Router/userRouter.js'));
app.use("/sos", require('./Router/SOSRouter.js'));

io.on('connection', (socket) => {
  socket.on('join-room', (room) => {
    socket.join(room);
  });
});

const port = process.env.PORT || 4001;

const { stopAllDetections } = require('./services/violenceProcessManager');

server.listen(port,'0.0.0.0', () => {
  console.log('-------------------------');
  console.log('Server is running on port:' + port);
});

process.on('SIGINT', async () => {
  await stopAllDetections();
  server.close(() => process.exit(0));
});

process.on('SIGTERM', async () => {
  await stopAllDetections();
  server.close(() => process.exit(0));
});
