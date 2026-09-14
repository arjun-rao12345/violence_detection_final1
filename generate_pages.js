const fs = require('fs');
const path = require('path');

const adminPages = [
  'Login', 'Dashboard', 'Officers', 'Cameras', 'Monitoring', 'Detection',
  'Alerts', 'Reports', 'Evidence', 'ResponseStatus', 'Map'
];

const policePages = [
  'Login', 'Dashboard', 'Alerts', 'Incidents', 'Navigation', 'Backup',
  'Resolved', 'AssignedCases'
];

function createPages(appDir, pages) {
  const pagesDir = path.join(appDir, 'src', 'pages');
  if (!fs.existsSync(pagesDir)) {
    fs.mkdirSync(pagesDir, { recursive: true });
  }

  pages.forEach(page => {
    const filePath = path.join(pagesDir, `${page}.jsx`);
    const content = `import React from 'react';
import { Box, Typography } from '@mui/material';

const ${page} = () => {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        ${page} Page
      </Typography>
      <Typography variant="body1">
        This is a placeholder for the ${page} page.
      </Typography>
    </Box>
  );
};

export default ${page};
`;
    fs.writeFileSync(filePath, content);
  });
}

createPages(path.join(__dirname, 'admin'), adminPages);
createPages(path.join(__dirname, 'police'), policePages);
console.log('Pages generated successfully!');
