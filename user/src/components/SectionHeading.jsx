import React from 'react';

export default function SectionHeading({ eyebrow, title, text, light = false, center = false }) {
  return (
    <div className={`section-heading ${light ? "light" : ""} ${center ? "center" : ""}`}>
      {eyebrow && <div className={`eyebrow ${light ? "light" : ""}`}>{eyebrow}</div>}
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}