import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
export default function Hero() {
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState('');
  return (
    <section className="hero" id="home">
      <div className="container hero-content">
        {/* Top Badges */}
        <div className="hero-badge-row">
          <div className="hero-pill">
            <span className="pulse-radar"></span>
            <span>NEXT-GEN PUBLIC SAFETY & AI THREAT INTERCEPTION</span>
          </div>
        </div>

        {/* Hero Title */}
        <h1>
          Instant Emergency Response.<br />
          <em>Detect. Intercept. Protect.</em>
        </h1>

        {/* Hero Subtitle */}
        <p>
          RescueX integrates advanced computer-vision threat monitoring with real-time violence reporting
          and automated dispatch coordination to protect communities and save critical seconds.
        </p>

        {/* Hero Actions */}
        <div className="hero-buttons">
          <a href="#report" className="btn btn-primary">
            <span>REPORT VIOLENCE NOW</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </a>
          <a href="#monitoring" className="btn btn-outline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="10 8 16 12 10 16 10 8"></polygon>
            </svg>
            <span>VIEW LIVE THREAT RADAR</span>
          </a>
          {/* <a href="#" className="btn btn-outline" onClick={(e)=>{e.preventDefault(); setShowScanner(true);}}>
            <span>SCAN QR CODE</span>
          </a> */}
        </div>
        {showScanner && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-4 rounded max-w-sm w-full">
              <button className="btn btn-sm btn-outline mb-2" onClick={() => setShowScanner(false)}>Close</button>
              <Scanner
                constraints={{ facingMode: "environment" }}
                onScan={(detectedCodes) => {
                  if (detectedCodes && detectedCodes.length > 0) {
                    const url = detectedCodes[0]?.rawValue;
                    if (url) {
                      setScanResult(url);
                      setShowScanner(false);
                      window.open(url, "_blank");
                    }
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Live Operational Metrics Strip */}
        <div className="hero-metric-strip">
          <div className="hero-metric">
            <strong>&lt; 3.8 min</strong>
            <span>Avg Police & Tactical Arrival</span>
          </div>
          <div className="hero-metric">
            <strong>99.4%</strong>
            <span>Threat Detection Accuracy</span>
          </div>
          <div className="hero-metric">
            <strong>450+ Units</strong>
            <span>Active Patrols & Medics</span>
          </div>
        </div>
      </div>

      {/* Bottom Ticker */}
      <div className="hero-bottom">
        <span>AI VIDEO THREAT ANALYSIS</span>
        <span className="sep">•</span>
        <span>ANONYMOUS VIOLENCE REPORTING</span>
        <span className="sep">•</span>
        <span>TACTICAL SWAT & POLICE DISPATCH</span>
        <span className="sep">•</span>
        <span>TRAUMA MEDICAL CARE</span>
      </div>
    </section>
  );
}