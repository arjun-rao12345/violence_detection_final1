// const nodemailer = require("nodemailer");

// const sendOfficerSecurityCode = async (
//   email,
//   officerName,
//   badgeNumber,
//   stationCode,
//   securityCode
// ) => {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: "Police Portal Security Code",
//     html: `
//       <h3>Hello ${officerName},</h3>

//       <p>Your police portal account has been created.</p>

//       <p><b>Badge Number:</b> ${badgeNumber}</p>
//       <p><b>Station Code:</b> ${stationCode}</p>

//       <h2>Security Code: ${securityCode}</h2>

//       <p>Please use this code to login for the first time.</p>
//       <p>After login, change your password immediately.</p>

//       <br/>
//       <p>Regards,<br/>Police Admin</p>
//     `,
//   });
// };

// module.exports = sendOfficerSecurityCode;

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOfficerSecurityCode = async (
  email,
  officerName,
  badgeNumber,
  securityCode
) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Police Portal Security Code",
    html: `
      <h2>Welcome ${officerName}</h2>
      <p>Your account has been created successfully.</p>
      <p><b>Badge Number :</b> ${badgeNumber}</p>
      <p><b>Temporary Security Code :</b></p>
      <h1 style="color:blue">${securityCode}</h1>
      <p>Please login using this security code.</p>
    `,
  });
};

const fs = require('fs');
const path = require('path');

function resolveLocalPath(fileUrlOrPath) {
  if (!fileUrlOrPath || typeof fileUrlOrPath !== 'string') return null;
  if (fs.existsSync(fileUrlOrPath)) return fileUrlOrPath;

  const uploadsDir = path.resolve(__dirname, '..', 'uploads');
  const directCheck = path.resolve(uploadsDir, fileUrlOrPath);
  if (fs.existsSync(directCheck)) return directCheck;

  const match = fileUrlOrPath.match(/\/(?:upload|download)\/(.+)$/);
  if (match && match[1]) {
    const resolved = path.resolve(uploadsDir, match[1]);
    if (fs.existsSync(resolved)) return resolved;
  }
  return null;
}

const sendIncidentAlertEmail = async (
  email,
  officerName,
  alertMessage,
  cameraName,
  location,
  evidenceVideoUrl,
  evidenceImageUrl,
  incidentDetails = {},
  stationName = '',
  localImagePath = null,
  localVideoPath = null
) => {
  const attachments = [];
  const resolvedImg = resolveLocalPath(localImagePath) || resolveLocalPath(evidenceImageUrl);
  const resolvedVid = resolveLocalPath(localVideoPath) || resolveLocalPath(evidenceVideoUrl);

  let hasImageAttachment = false;
  let hasVideoAttachment = false;

  if (resolvedImg && fs.existsSync(resolvedImg)) {
    attachments.push({
      filename: path.basename(resolvedImg),
      path: resolvedImg,
      cid: 'incident_snapshot'
    });
    hasImageAttachment = true;
  }

  if (resolvedVid && fs.existsSync(resolvedVid)) {
    attachments.push({
      filename: path.basename(resolvedVid),
      path: resolvedVid,
      contentType: 'video/mp4'
    });
    hasVideoAttachment = true;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Emergency Alert: ${alertMessage}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #dc2626; margin-top: 0;">EMERGENCY ALERT</h2>
        <p>Hello <strong>${officerName}</strong>,</p>
        <p>An emergency incident has been detected by camera <strong>${cameraName}</strong> at <strong>${location}</strong>.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          ${stationName ? `<tr><td style="padding: 6px 0; color: #4b5563;"><strong>Station:</strong></td><td>${stationName}</td></tr>` : ''}
          <tr><td style="padding: 6px 0; color: #4b5563;"><strong>Alert:</strong></td><td><span style="color: #dc2626; font-weight: bold;">${alertMessage}</span></td></tr>
          <tr><td style="padding: 6px 0; color: #4b5563;"><strong>Detection Type:</strong></td><td>${incidentDetails.detectionType || 'Violence'}</td></tr>
          <tr><td style="padding: 6px 0; color: #4b5563;"><strong>Confidence:</strong></td><td>${typeof incidentDetails.confidence === 'number' ? (incidentDetails.confidence * 100).toFixed(1) + '%' : (incidentDetails.confidence || 'N/A')}</td></tr>
          <tr><td style="padding: 6px 0; color: #4b5563;"><strong>Incident Time:</strong></td><td>${incidentDetails.timestamp || new Date().toLocaleString()}</td></tr>
        </table>

        ${hasImageAttachment ? `
          <div style="margin: 20px 0; padding: 10px; background-color: #f8fafc; border-radius: 6px; text-align: center;">
            <p style="font-weight: bold; margin-bottom: 8px; color: #1e293b;">Incident Snapshot</p>
            <img src="cid:incident_snapshot" alt="Evidence Snapshot" style="max-width: 100%; height: auto; border-radius: 6px; border: 1px solid #cbd5e1;" />
          </div>
        ` : ''}

        <div style="background-color: #eff6ff; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; margin: 20px 0;">
          <h4 style="margin: 0 0 8px 0; color: #1e40af;">Evidence Download & Mobile Access</h4>
          ${(hasImageAttachment || hasVideoAttachment) ? `
            <p style="margin: 0 0 10px 0; color: #1e3a8a; font-size: 14px;">
              &#10004; <strong>Evidence files are attached directly to this email!</strong><br/>
              On mobile (iPhone/Android), open or download the attached photo and MP4 video directly in your email app. No direct network access to the server is required.
            </p>
          ` : ''}
          <div style="margin-top: 10px;">
            ${evidenceImageUrl ? `<p style="margin: 5px 0;"><strong>Web Image:</strong> <a href="${evidenceImageUrl.replace('/upload/', '/download/')}" style="color: #2563eb; text-decoration: underline;" download>Download image</a></p>` : ''}
            ${evidenceVideoUrl ? `<p style="margin: 5px 0;"><strong>Web Video:</strong> <a href="${evidenceVideoUrl.replace('/upload/', '/download/')}" style="color: #2563eb; text-decoration: underline;" download>Download video</a></p>` : ''}
          </div>
        </div>

        <p style="color: #dc2626; font-weight: bold; margin-top: 20px;">Please respond immediately.</p>
      </div>
    `,
    attachments
  });
};

const sendSupportRequestEmail = async (
  email,
  officerName,
  fromOfficerName,
  fromStationName
) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `URGENT Backup Requested: Support needed by ${fromOfficerName}`,
    html: `
      <h2>Hello ${officerName},</h2>
      <p>Officer <strong>${fromOfficerName}</strong> from station <strong>${fromStationName}</strong> has requested emergency backup/support!</p>
      <p>Please respond or contact them immediately.</p>
      <br/>
      <p>Regards,<br/>Emergency Dispatch System</p>
    `,
  });
};

module.exports = {
  sendOfficerSecurityCode,
  sendIncidentAlertEmail,
  sendSupportRequestEmail
};