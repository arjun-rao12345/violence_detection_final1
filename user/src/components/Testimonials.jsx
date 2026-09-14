import { useState } from "react";
import SectionHeading from "./SectionHeading";
import React from 'react';

const testimonials = [
  {
    quote: "When an active armed altercation occurred near our downtown transit hub, RescueX AI detected the brandished weapon and dispatched tactical officers in under 2 minutes. Lives were indisputably saved.",
    name: "Ava Green",
    role: "Metropolitan Transit Safety Director",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    verified: "Verified Safety Authority"
  },
  {
    quote: "The seamless integration between citizen anonymous reporting and instantaneous police cruiser telemetry is unlike anything we've seen. False alarms dropped by 68% while true threat response speeds doubled.",
    name: "Noah Smith",
    role: "Lead Systems Engineer, Urban Safety Coalition",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    verified: "Verified Partner"
  },
  {
    quote: "As an emergency trauma physician, getting pre-arrival incident telemetry and immediate ALS paramedic handoffs via RescueX allows us to prepare our surgical teams before the ambulance even reaches the bay.",
    name: "Dr. Mia Carter",
    role: "Chief of Trauma Surgery, City General Hospital",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80",
    verified: "Verified Healthcare Director"
  }
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const item = testimonials[index];

  const handlePrev = () => {
    setIndex((index - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setIndex((index + 1) % testimonials.length);
  };

  return (
    <section className="section testimonials">
      <div className="container">
        <SectionHeading
          eyebrow="COMMUNITY TRUST & VALIDATION"
          title="Tested and proven during the most critical moments."
          light={true}
        />

        <div className="testimonial-card">
          <div className="quote-mark">“</div>

          <div className="stars-rating">
            <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
          </div>

          <p className="quote-text">{item.quote}</p>

          <div className="author-wrap">
            <div className="author-info">
              <img src={item.avatar} alt={item.name} className="author-avatar" />
              <div className="author-meta">
                <h4>{item.name}</h4>
                <span>{item.role} • {item.verified}</span>
              </div>
            </div>

            <div className="slider-controls-group">
              <button onClick={handlePrev} aria-label="Previous testimonial">←</button>
              <span className="slider-counter">
                {String(index + 1).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}
              </span>
              <button onClick={handleNext} aria-label="Next testimonial">→</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}