import React from 'react';

export default function About() {
  return (
    <section className="section about" id="about">
      <div className="container about-grid">
        {/* High-Clarity Image with Floating Badge */}
        <div className="about-image-wrap">
          <img
            src="https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1400&q=85"
            alt="RescueX Tactical & First Responder Team"
            className="about-image-main"
          />
          <div className="experience-badge">
            <strong>25+</strong>
            <span>Years of Field Experience</span>
          </div>
        </div>

        {/* Copy Column */}
        <div className="about-copy">
          <div className="eyebrow">ABOUT RESCUEX SAFETY NETWORK</div>
          <h2>Uncompromising public safety powered by human courage & AI.</h2>
          <p>
            RescueX was founded on a singular principle: no call for help should ever go unanswered or delayed. We combine veteran tactical rescue leadership with next-generation edge computer vision to build the safest urban environments in the world.
          </p>

          <div className="check-list">
            <div className="check-list-item">
              <span>✓</span>
              <div>
                <strong>24/7/365 Autonomous Threat Interception</strong>
                <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "0.85rem" }}>Continuous monitoring across 40+ metropolitan sectors.</p>
              </div>
            </div>
            <div className="check-list-item">
              <span>✓</span>
              <div>
                <strong>Triple-Certified Emergency Response Teams</strong>
                <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "0.85rem" }}>Certified in Advanced Trauma Care, Tactical Extraction, and De-escalation.</p>
              </div>
            </div>
            <div className="check-list-item">
              <span>✓</span>
              <div>
                <strong>CJIS & HIPAA Compliant End-to-End Encryption</strong>
                <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "0.85rem" }}>Complete data privacy and protection for reporting citizens.</p>
              </div>
            </div>
          </div>

          <div className="cert-badges-row">
            <div className="cert-badge">
              <span>🛡️</span>
              <span>ISO 27001 SECURED</span>
            </div>
            <div className="cert-badge">
              <span>🎖️</span>
              <span>FEMA ALIGNED</span>
            </div>
            <div className="cert-badge">
              <span>🔒</span>
              <span>CJIS COMPLIANT</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}