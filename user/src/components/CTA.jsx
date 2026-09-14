import React from 'react';

export default function CTA() {
  return (
    <section className="cta" id="contact">
      <div className="container cta-inner">
        <div>
          <div className="eyebrow light">IMMEDIATE THREAT INTERVENTION</div>
          <h2>See something dangerous? Act immediately.</h2>
          <p style={{ color: "rgba(255,255,255,0.85)", marginTop: "12px", maxWidth: "600px", fontSize: "1.05rem" }}>
            Every report empowers emergency responders to reach incidents in minutes. Your action can save lives.
          </p>
        </div>

        <div className="cta-actions">
          <a href="#report" className="btn btn-light">
            <span>REPORT VIOLENCE NOW</span>
            <span>↗</span>
          </a>
          <a href="tel:911" className="btn btn-outline">
            <span>SPEED DIAL 911 / 112</span>
          </a>
        </div>
      </div>
    </section>
  );
}