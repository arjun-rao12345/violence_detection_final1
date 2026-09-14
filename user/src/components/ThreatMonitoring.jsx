import { useState } from "react";
import React from 'react';

const cameras = [
  {
    id: "CAM-01",
    name: "Downtown Transit Hub",
    location: "4th Ave & Market St",
    image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80",
    alertTag: "VIOLENCE DETECTED 96.4%",
    fps: "60.0 FPS",
    latency: "14ms",
    boxStyle: { left: "32%", top: "28%", width: "220px", height: "170px" }
  },
  {
    id: "CAM-02",
    name: "Metro Concourse North",
    location: "Gate 3 Platform",
    image: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80",
    alertTag: "WEAPON THREAT 92.1%",
    fps: "59.8 FPS",
    latency: "12ms",
    boxStyle: { left: "45%", top: "35%", width: "190px", height: "160px" }
  },
  {
    id: "CAM-03",
    name: "Commercial Plaza West",
    location: "Broadway Retail Alley",
    image: "https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&w=1200&q=80",
    alertTag: "BRAWL / ALTERCATION 89.5%",
    fps: "60.2 FPS",
    latency: "15ms",
    boxStyle: { left: "25%", top: "30%", width: "240px", height: "180px" }
  },
  {
    id: "CAM-04",
    name: "Terminal Parking Deck",
    location: "Level 2 North Wing",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    alertTag: "SUSPICIOUS ACTIVITY 87.0%",
    fps: "60.0 FPS",
    latency: "11ms",
    boxStyle: { left: "40%", top: "22%", width: "200px", height: "150px" }
  }
];

const alertList = [
  {
    id: "AI-4089",
    camId: "CAM-01",
    type: "Active Physical Assault",
    location: "4th Ave & Market St",
    confidence: "96.4%",
    risk: "CRITICAL",
    time: "Just now"
  },
  {
    id: "AI-4088",
    camId: "CAM-02",
    type: "Brandished Weapon Detected",
    location: "Gate 3 Platform",
    confidence: "92.1%",
    risk: "CRITICAL",
    time: "2 mins ago"
  },
  {
    id: "AI-4087",
    camId: "CAM-03",
    type: "Group Altercation / Brawl",
    location: "Broadway Retail Alley",
    confidence: "89.5%",
    risk: "HIGH",
    time: "6 mins ago"
  },
  {
    id: "AI-4086",
    camId: "CAM-04",
    type: "Vehicle Tampering / Prowling",
    location: "Level 2 North Wing",
    confidence: "87.0%",
    risk: "MEDIUM",
    time: "12 mins ago"
  }
];

export default function ThreatMonitoring() {
  const [selectedCamIndex, setSelectedCamIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [acknowledged, setAcknowledged] = useState({});

  const currentCam = cameras[selectedCamIndex];

  const handleAcknowledge = (id, e) => {
    e.stopPropagation();
    setAcknowledged(prev => ({ ...prev, [id]: true }));
  };

  const filteredAlerts = alertList.filter(item => {
    if (activeFilter === "ALL") return true;
    return item.risk === activeFilter;
  });

  return (
    <section className="section monitoring" id="monitoring">
      <div className="container">
        {/* Section Heading */}
        <div className="monitoring-heading">
          <div>
            <div className="eyebrow light">AI VISION SURVEILLANCE</div>
            <h2>Live AI Threat Interception Hub</h2>
          </div>
          <span className="live-badge">
            <i></i> 2,400+ CAMERAS ACTIVE
          </span>
        </div>

        <div className="monitor-grid">
          {/* Left: CCTV Camera Screen */}
          <div className="camera-panel">
            <div className="camera-top">
              <div className="camera-controls-bar">
                {cameras.map((cam, idx) => (
                  <button
                    key={cam.id}
                    className={`cam-btn ${selectedCamIndex === idx ? "active" : ""}`}
                    onClick={() => setSelectedCamIndex(idx)}
                  >
                    {cam.id}
                  </button>
                ))}
              </div>
              <span>● LIVE 4K STREAM</span>
            </div>

            <div className="camera-view">
              <img src={currentCam.image} alt={currentCam.name} />
              <div className="scan-line"></div>

              {/* AI Detection Bounding Box */}
              <div className="detection-box box1" style={currentCam.boxStyle}>
                <span className="detection-tag">{currentCam.alertTag}</span>
              </div>

              {/* Camera Framing Corners */}
              <span className="camera-corner c1"></span>
              <span className="camera-corner c2"></span>
              <span className="camera-corner c3"></span>
              <span className="camera-corner c4"></span>

              {/* HUD Telemetry Overlay */}
              <div className="camera-hud-info">
                <span>{currentCam.name} • {currentCam.fps} • {currentCam.latency}</span>
              </div>
            </div>

            <div className="camera-bottom">
              <span>{currentCam.location}</span>
              <span>AI THREAT CONFIDENCE: 96.4%</span>
            </div>
          </div>

          {/* Right: Real-time Alert Feed */}
          <div>
            <div className="alert-feed-header">
              <h3>Live Threat Ingestion Feed</h3>
              <div className="alert-filter-chips">
                {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map(filter => (
                  <button
                    key={filter}
                    className={`filter-chip ${activeFilter === filter ? "active" : ""}`}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="alert-list">
              {filteredAlerts.map((alert) => {
                const isSelectedCam = currentCam.id === alert.camId;
                const isAck = acknowledged[alert.id];

                return (
                  <article
                    className={`alert-card ${isSelectedCam ? "selected" : ""}`}
                    key={alert.id}
                    onClick={() => {
                      const idx = cameras.findIndex(c => c.id === alert.camId);
                      if (idx !== -1) setSelectedCamIndex(idx);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <div className={`risk-badge risk-${alert.risk.toLowerCase()}`}>
                      {alert.risk}
                    </div>

                    <div className="alert-main">
                      <span>{alert.id} • {alert.camId} • {alert.location}</span>
                      <h4>{alert.type}</h4>
                      <p>Confidence: {alert.confidence} • {alert.time}</p>
                    </div>

                    <button
                      className="alert-btn"
                      onClick={(e) => handleAcknowledge(alert.id, e)}
                    >
                      {isAck ? "✓ DISPATCHED" : "DISPATCH"}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}