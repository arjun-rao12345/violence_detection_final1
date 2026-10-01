import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Officers from './pages/Officers';
import Cameras from './pages/Cameras';
import Monitoring from './pages/Monitoring';
import Detection from './pages/Detection';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Evidence from './pages/Evidence';
import ResponseStatus from './pages/ResponseStatus';
import Map from './pages/Map';
import PoliceStations from './pages/PoliceStations';
import ViolenceIncidents from './pages/ViolenceIncidents';

import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>

          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />

            <Route path="dashboard" element={<Dashboard />} />
            <Route path="officers" element={<Officers />} />
            <Route path="PoliceStations" element={<PoliceStations />} />
            <Route path="cameras" element={<Cameras />} />
            <Route path="monitoring" element={<Monitoring />} />
            <Route path="detection" element={<Detection />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="reports" element={<Reports />} />
            <Route path="violence-incidents" element={<ViolenceIncidents />} />
            <Route path="Voilationincident" element={<ViolenceIncidents />} />
            <Route path="evidence" element={<Evidence />} />
            <Route path="response-status" element={<ResponseStatus />} />
            <Route path="map" element={<Map />} />
          </Route>

          {/* Invalid URLs */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;



// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import AdminLayout from './components/AdminLayout';
// import Login from './pages/Login';
// import Dashboard from './pages/Dashboard';
// import Officers from './pages/Officers';
// import Cameras from './pages/Cameras';
// import Monitoring from './pages/Monitoring';
// import Detection from './pages/Detection';
// import Alerts from './pages/Alerts';
// import Reports from './pages/Reports';
// import Evidence from './pages/Evidence';
// import ResponseStatus from './pages/ResponseStatus';
// import Map from './pages/Map';
// import { ThemeProvider } from './context/ThemeContext';
// import PoliceStations from './pages/PoliceStations';

// function App() {
//   return (
//     <ThemeProvider>
//       <Router>
//       <Routes>
//         <Route path="/login" element={<Login />} />
        
//         <Route path="/" element={<AdminLayout />}>
//           <Route index element={<Navigate to="/dashboard" replace />} />
//           <Route path="dashboard" element={<Dashboard />} />
//           <Route path="officers" element={<Officers />} />
//           <Route path="cameras" element={<Cameras />} />
//           <Route path="monitoring" element={<Monitoring />} />
//           <Route path="detection" element={<Detection />} />
//           <Route path="alerts" element={<Alerts />} />
//           <Route path="reports" element={<Reports />} />
//           <Route path="evidence" element={<Evidence />} />
//           <Route path="response-status" element={<ResponseStatus />} />
//           <Route path="map" element={<Map />} />
//           <Route path="PoliceStations" element={<PoliceStations />} />
//         </Route>
//       </Routes>
//     </Router>
//     </ThemeProvider>
//   );
// }

// export default App;
