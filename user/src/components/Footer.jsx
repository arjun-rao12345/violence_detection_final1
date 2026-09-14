import React from 'react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        {/* Brand Column */}
        <div className="footer-brand">
          <a className="logo" href="#home">
            <div className="logo-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="M12 8v8"></path>
                <path d="M8 12h8"></path>
              </svg>
            </div>
            <span>Rescue<span className="logo-text-accent">X</span></span>
          </a>
          <p>
            Autonomous AI threat interception, emergency violence reporting, and 24/7 rapid tactical responder coordination network.
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>● ISO 27001 Certified</span>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>● CJIS Compliant</span>
          </div>
        </div>

        {/* Incident Center */}
        <div>
          <h4>Incident Center</h4>
          <div className="footer-links">
            <a href="#monitoring">Live CCTV Radar</a>
            <a href="#report">Report Violence / Threat</a>
            <a href="#tracking">Response Tracker</a>
            <a href="#map">Sector Safety Map</a>
            <a href="#faq">Emergency FAQs</a>
          </div>
        </div>

        {/* Services Directory */}
        <div>
          <h4>Core Services</h4>
          <div className="footer-links">
            <a href="#services">Tactical SWAT Response</a>
            <a href="#services">AI Weapon Detection</a>
            <a href="#services">Fire & Hazmat Rescue</a>
            <a href="#services">ALS Paramedic Care</a>
            <a href="#services">Campus Safe-Walk</a>
          </div>
        </div>

        {/* Emergency Speed Dial */}
        <div>
          <h4>Emergency 24/7</h4>
          <div className="footer-emergency-box">
            <a href="tel:911">Call 911 / 112</a>
            <p>Direct priority line to Central Command & Emergency Dispatch</p>
          </div>
          <p style={{ marginTop: "12px", color: "#94a3b8", fontSize: "0.8rem" }}>
            Non-Emergency: <a href="tel:311" style={{ color: "#fff", textDecoration: "underline" }}>311</a>
          </p>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© 2026 RescueX Public Safety Network. All rights reserved.</span>
        <span>Zero-Knowledge Privacy Policy &nbsp; • &nbsp; Terms of Service &nbsp; • &nbsp; Compliance</span>
      </div>
    </footer>
  );
}