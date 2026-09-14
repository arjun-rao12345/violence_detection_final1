import React, { useState } from "react";
import { QRCodeSVG as QRCode } from "qrcode.react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import ThreatMonitoring from "./components/ThreatMonitoring";
import ReportViolence from "./components/ReportViolence";
import Strength from "./components/Strength";
import About from "./components/About";
import Stats from "./components/Stats";
import ResponseTracking from "./components/ResponseTracking";
import SafetyMap from "./components/SafetyMap";
import FAQ from "./components/FAQ";
import Testimonials from "./components/Testimonials";
import Team from "./components/Team";
import Blog from "./components/Blog";
import CTA from "./components/CTA";
import Footer from "./components/Footer";

import Register from "./components/Register";
import Login from "./components/Login";
import MyReports from "./components/MyReports";
import SOSButton from "./components/SOSButton";


// ==========================================
// QR MODAL — uses real LAN IP for mobile
// ==========================================
function QrModal({ onClose }) {
  // Your PC's local network IP — phones on same WiFi can reach this
  // const LAN_IP = "192.168.1.40";
  const LAN_IP = "192.168.31.48";
  const port = window.location.port || "5173";
  const networkUrl = `http://${LAN_IP}:${port}`;


  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.65)",
        zIndex: 10000,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: "16px",
          padding: "28px 24px", textAlign: "center",
          maxWidth: "340px", width: "92%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <h3 style={{ margin: "0 0 6px", color: "#1e3a8a", fontSize: "18px", fontWeight: 700 }}>
          Open on Mobile 📱
        </h3>

        <p style={{ margin: "0 0 12px", color: "#16a34a", fontSize: "13px", background: "#f0fdf4", borderRadius: "8px", padding: "8px" }}>
          ✅ Make sure your phone is on the <strong>same WiFi</strong> as this PC
        </p>

        <p style={{ margin: "0 0 14px", color: "#555", fontSize: "13px" }}>
          Scan with your phone camera to open this website on mobile.
        </p>

        <div style={{
          display: "inline-block", padding: "12px",
          background: "#f8faff", borderRadius: "12px",
          border: "2px solid #dbeafe",
        }}>
          <QRCode
            value={networkUrl}
            size={200}
            bgColor="#f8faff"
            fgColor="#1e3a8a"
            level="M"
          />
        </div>

        <p style={{ marginTop: "10px", color: "#2563eb", fontSize: "13px", fontWeight: 600, wordBreak: "break-all" }}>
          {networkUrl}
        </p>

        <button
          onClick={onClose}
          style={{
            marginTop: "14px", padding: "8px 28px",
            background: "#1e3a8a", color: "#fff",
            border: "none", borderRadius: "8px",
            cursor: "pointer", fontSize: "14px", fontWeight: 600,
          }}
        >
          Close
        </button>
      </div>
    </div>
  );

}

// ==========================================
// LAYOUT
// ==========================================
function Layout() {

  const [showQr, setShowQr] = useState(false);
  const location = useLocation();

  // Pages where Navbar/Footer should NOT appear
  const hideNavbar =
    location.pathname === "/login" ||
    location.pathname === "/register";

  return (
    <>
      {!hideNavbar && <Navbar />}

      <main>
        <Routes>

          {/* =================================
              HOME / LANDING PAGE
          ================================= */}

          <Route
            path="/"
            element={
              <>
                <Hero />
                <Services />
                <ThreatMonitoring />
                <ReportViolence />
                <Strength />
                <About />
                <Stats />
                <SafetyMap />
                <FAQ />
                <Testimonials />
                {/* <Team /> */}
                {/* <Blog /> */}
                <CTA />
              </>
            }
          />


          {/* =================================
              INDIVIDUAL PAGES
          ================================= */}

          <Route path="/hero" element={<Hero />} />
          <Route path="/services" element={<Services />} />
          <Route path="/threat-monitoring" element={<ThreatMonitoring />} />
          <Route path="/report-violence" element={<ReportViolence />} />
          <Route path="/strength" element={<Strength />} />
          <Route path="/about" element={<About />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/response-tracking/:id" element={<ResponseTracking />} />
          <Route path="/safety-map" element={<SafetyMap />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/team" element={<Team />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/cta" element={<CTA />} />

          {/* =================================
              AUTH
          ================================= */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/my-reports" element={<MyReports />} />

        </Routes>
      </main>

      {!hideNavbar && <Footer />}

      {/* ===== FLOATING SOS BUTTON ===== */}
      <SOSButton />

      {/* ===== FLOATING QR CODE BUTTON ===== */}
      <button
        onClick={() => setShowQr(true)}
        aria-label="Show QR code to open on mobile"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(37,99,235,0.5)",
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3h7v7H3V3zm2 2v3h3V5H5zm9-2h7v7h-7V3zm2 2v3h3V5h-3zM3 14h7v7H3v-7zm2 2v3h3v-3H5zm11 1h2v2h-2v-2zm-2-3h2v2h-2v-2zm2 0h2v2h-2v-2zm2 2h2v2h-2v-2zm-4 2h2v2h-2v-2zm2 0h2v2h-2v-2zm2 2h2v2h-2v-2z"/>
        </svg>
      </button>

      {/* ===== QR CODE MODAL ===== */}
      {showQr && (
        <QrModal onClose={() => setShowQr(false)} />
      )}

    </>
  );
}



// ==========================================
// APP
// ==========================================

export default function App() {

  return (

    <BrowserRouter>

      <Layout />

    </BrowserRouter>

  );

}