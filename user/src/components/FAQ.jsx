import { useState } from "react";
import SectionHeading from "./SectionHeading";
import React from 'react';

const faqs = [
  {
    question: "What happens immediately after I submit an emergency violence report?",
    answer: "Your report is analyzed in under 450 milliseconds by our priority routing engine, which classifies threat severity, checks for weapons, and calculates the exact GPS coordinates. The incident is immediately dispatched to the nearest police patrol cruiser and central command operators simultaneously."
  },
  {
    question: "Is anonymous reporting 100% confidential and secure?",
    answer: "Yes. When you enable 'Report anonymously', all client IP addresses, browser headers, and hardware identifiers are permanently purged at the network edge. RescueX utilizes zero-knowledge encryption to safeguard citizen whistleblowers and witnesses."
  },
  {
    question: "How does AI video surveillance protect citizen privacy in public spaces?",
    answer: "Our computer-vision neural networks run on edge processors with real-time biometric de-identification. Facial features and non-threat bystanders are obscured automatically. The system only tracks physical weapon signatures, aggressive kinetic altercation vectors, and distress gestures."
  },
  {
    question: "Can RescueX automatically dispatch trauma paramedic ambulances?",
    answer: "Yes. When 'Injured victims present' is flagged or detected, our dual-dispatch algorithm routes both tactical police units for scene security and Advanced Life Support (ALS) paramedic teams with full trauma equipment and direct hospital linkups."
  },
  {
    question: "How do I track officer arrival or request extra backup?",
    answer: "You can monitor live responder GPS coordinates in the Response Tracking section using your ticket number (#RX-8842) or speed dial our 24/7 hotline directly to request immediate tactical reinforcement."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="section faq-section" id="faq">
      <div className="container">
        <SectionHeading
          eyebrow="FREQUENTLY ASKED QUESTIONS"
          title="Clear answers on our emergency safety protocols."
          text="Learn how RescueX coordinates rapid tactical intervention, protects reporting privacy, and delivers sub-4 minute response times."
        />

        <div className="faq-container">
          <div className="faq-list">
            {faqs.map((faq, idx) => (
              <div
                className={`faq-item ${openIndex === idx ? "open" : ""}`}
                key={faq.question}
              >
                <button
                  className="faq-question"
                  onClick={() => toggle(idx)}
                  aria-expanded={openIndex === idx}
                >
                  <span>{faq.question}</span>
                  <span className="faq-toggle-icon">+</span>
                </button>
                {openIndex === idx && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
