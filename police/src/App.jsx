import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import PoliceLayout from './components/PoliceLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import Incidents from './pages/Incidents';
import Navigation from './pages/Navigation';
import Backup from './pages/Backup';
import Resolved from './pages/Resolved';
import AssignedCases from './pages/AssignedCases';
import ManageProfile from './pages/ManageProfile';

import { ThemeProvider } from './context/ThemeContext';
import Voilationincident from './pages/voilationincident';

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
                <PoliceLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="incidents" element={<Incidents />} />
            <Route path="navigation" element={<Navigation />} />
            <Route path="backup" element={<Backup />} />
            <Route path="resolved" element={<Resolved />} />
            <Route path="assigned-cases" element={<AssignedCases />} />
            <Route path="ManageProfile" element={<ManageProfile />} />
            <Route path="Voilationincident" element={<Voilationincident />} />
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
// import PoliceLayout from './components/PoliceLayout';
// import Login from './pages/Login';
// import Dashboard from './pages/Dashboard';
// import Alerts from './pages/Alerts';
// import Incidents from './pages/Incidents';
// import Navigation from './pages/Navigation';
// import Backup from './pages/Backup';
// import Resolved from './pages/Resolved';
// import AssignedCases from './pages/AssignedCases';
// import { ThemeProvider } from './context/ThemeContext';
// import ManageProfile from './pages/ManageProfile';

// function App() {
//   return (
//     <ThemeProvider>
//       <Router>
//       <Routes>
//         <Route path="/login" element={<Login />} />
        
//         <Route path="/" element={<PoliceLayout />}>
//           <Route index element={<Navigate to="/dashboard" replace />} />
//           <Route path="dashboard" element={<Dashboard />} />
//           <Route path="alerts" element={<Alerts />} />
//           <Route path="incidents" element={<Incidents />} />
//           <Route path="navigation" element={<Navigation />} />
//           <Route path="backup" element={<Backup />} />
//           <Route path="resolved" element={<Resolved />} />
//           <Route path="assigned-cases" element={<AssignedCases />} />
//           <Route path="ManageProfile" element={<ManageProfile />} />
//         </Route>
//       </Routes>
//     </Router>
//     </ThemeProvider>
//   );
// }

// export default App;
