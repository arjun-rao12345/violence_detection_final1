import SectionHeading from "./SectionHeading";
import React from 'react';

const cards = [
  {
    number: "01",
    title: "Sub-4 Minute Dispatch Guarantee",
    text: "Algorithmic nearest-unit dispatch routing reduces emergency responder transit times by 42% across urban and suburban zones.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    )
  },
  {
    number: "02",
    title: "Computer-Vision Threat Detection",
    text: "Deep neural networks trained on over 25 million hours of real-world CCTV feeds to detect violent altercations and weapons in 45ms.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    )
  },
  {
    number: "03",
    title: "Certified Tactical & Trauma Elite",
    text: "All personnel maintain active credentials in Advanced Trauma Life Support (ATLS), SWAT tactical rescue, and non-violent de-escalation.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
    )
  },
  {
    number: "04",
    title: "Integrated Public Safety Grid",
    text: "Full interoperability bridging 911 dispatch, municipal emergency services, transit authorities, and hospital trauma centers seamlessly.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
        <line x1="6" y1="6" x2="6.01" y2="6"></line>
        <line x1="6" y1="18" x2="6.01" y2="18"></line>
      </svg>
    )
  }
];

export default function Strength() {
  return (
    <section className="section strength" id="strength">
      <div className="container">
        <SectionHeading
          eyebrow="CORE ADVANTAGES"
          title="Why cities and citizens trust our emergency network."
          text="When critical emergencies unfold, every millisecond counts. We engineer the fastest, most reliable safety infrastructure available."
        />

        <div className="strength-grid">
          {cards.map((card) => (
            <article className="strength-card" key={card.number}>
              <span className="strength-watermark">{card.number}</span>
              <div className="strength-icon-wrap">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              <a href="#services" className="strength-link">
                <span>Explore capability</span>
                <span>→</span>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}