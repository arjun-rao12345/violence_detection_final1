import { useState } from "react";
import SectionHeading from "./SectionHeading";
import React from 'react';

const services = [
  {
    number: "01",
    title: "Active Violence & Threat Intervention",
    description: "Rapid tactical deployment and precision de-escalation units mobilized instantly during active assaults, brawls, and critical armed disturbances.",
    tags: ["SWAT Integration", "Zero-Latency Dispatch", "Geo-Fence Lockdown"],
    image: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1400&q=85"
  },
  {
    number: "02",
    title: "AI Video Surveillance & Weapon Detection",
    description: "Deep-learning computer vision monitoring streams that detect brandished firearms, bladed weapons, and violent physical scuffles in milliseconds.",
    tags: ["Real-Time Alerts", "Privacy Masking", "Edge AI Processing"],
    image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=1400&q=85"
  },
  {
    number: "03",
    title: "Emergency Fire & Hazardous Rescue",
    description: "Elite fire rescue battalions and specialized hazmat teams equipped with aerial thermal scanning drones and high-velocity suppression systems.",
    tags: ["Thermal Drone Mapping", "Hazmat Containment", "Structural Extraction"],
    image: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=1400&q=85"
  },
  {
    number: "04",
    title: "Trauma Care & Paramedic Quick Response",
    description: "Advanced Life Support (ALS) paramedic ambulances equipped with emergency telemetry, blood banks, and instant hospital trauma ward linkups.",
    tags: ["Mobile ICU", "Immediate Triage", "Direct Hospital Link"],
    image: "https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&w=1400&q=85"
  },
  {
    number: "05",
    title: "Community Safe-Walk & Escort Network",
    description: "On-demand virtual and in-person safety escorts connecting university campuses, transit corridors, and late-night workers with 24/7 guardian monitoring.",
    tags: ["Live GPS Breadcrumbs", "Silent SOS Ping", "Vetted Escorts"],
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1400&q=85"
  },
  {
    number: "06",
    title: "Crisis De-escalation & Mental Health Support",
    description: "Specialized crisis negotiators and psychiatric trauma specialists who co-respond with field officers to resolve acute conflicts peacefully.",
    tags: ["Conflict Negotiators", "Trauma-Informed Care", "Non-Lethal Strategy"],
    image: "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=1400&q=85"
  },
  // {
  //   number: "07",
  //   title: "Drone View",
  //   description: "Aerial drone surveillance providing real-time situational awareness for rapid response.",
  //   tags: ["Aerial Surveillance", "Live Feed", "Remote Monitoring"],
  //   image: "https://images.unsplash.com/photo-1505238680356-667803448bb6?auto=format&fit=crop&w=1400&q=85"
  // }
];

export default function Services() {
  const [selected, setSelected] = useState(0);
  const currentService = services[selected];

  return (
    <section className="section services" id="services">
      <div className="container">
        <SectionHeading
          eyebrow="EMERGENCY CAPABILITIES"
          title="Engineered to protect lives across every critical scenario."
          text="From instant computer-vision threat detection to tactical street deployment and trauma care, our response network operates with zero compromise."
        />

        <div className="service-tabs">
          {/* Tabs Column */}
          <div className="service-list">
            {services.map((service, index) => (
              <button
                key={service.number}
                className={`service-tab ${selected === index ? "active" : ""}`}
                onMouseEnter={() => setSelected(index)}
                onClick={() => setSelected(index)}
              >
                <span className="service-number">{service.number}</span>
                <span className="service-title">{service.title}</span>
                <span className="service-arrow">↗</span>
              </button>
            ))}
          </div>

          {/* High-Clarity Image Display */}
          <div className="service-image-wrap">
            <img src={currentService.image} alt={currentService.title} />
            <div className="image-caption">
              <span>{currentService.number}</span>
              <div>
                <strong>{currentService.title}</strong>
                <p>{currentService.description}</p>
                <div className="service-features-list">
                  {currentService.tags.map((tag) => (
                    <span key={tag} className="service-feature-tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}