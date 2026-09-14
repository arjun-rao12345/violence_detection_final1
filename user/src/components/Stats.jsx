import React from 'react';

const stats = [
  {
    value: "18.4K",
    unit: "+",
    label: "Incidents Intercepted",
    trend: "↑ +34% Threat Reduction"
  },
  {
    value: "99.8",
    unit: "%",
    label: "Resolution Success Rate",
    trend: "★ Top 1% Response Quality"
  },
  {
    value: "450",
    unit: "+",
    label: "Active Field Units",
    trend: "● 24/7 Rapid Patrol"
  },
  {
    value: "< 3.8",
    unit: "m",
    label: "Average Arrival Time",
    trend: "⚡ 42% Faster than standard"
  }
];

export default function Stats() {
  return (
    <section className="stats">
      <div className="container stats-grid">
        {stats.map((stat) => (
          <div className="stat-item" key={stat.label}>
            <strong>
              {stat.value}<em>{stat.unit}</em>
            </strong>
            <span>{stat.label}</span>
            <div className="stat-trend">{stat.trend}</div>
          </div>
        ))}
      </div>
    </section>
  );
}