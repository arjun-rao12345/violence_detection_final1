import SectionHeading from "./SectionHeading";
import React from 'react';

const members = [
  {
    name: "Commander James Wilson",
    role: "Chief Incident Commander",
    specialty: "22 Years Tactical Special Operations & Urban Rescue",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=85"
  },
  {
    name: "Captain Olivia Brown",
    role: "Director of Emergency Dispatch",
    specialty: "Former Metropolitan SWAT Lead & Critical Incident Trainer",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=85"
  },
  {
    name: "Dr. Daniel Miller",
    role: "Lead AI Threat Systems Architect",
    specialty: "Ph.D. in Computer Vision & Real-Time Edge Video Analytics",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=85"
  }
];

export default function Team() {
  return (
    <section className="section team" id="team">
      <div className="container">
        <SectionHeading
          eyebrow="COMMAND LEADERSHIP"
          title="Battle-tested responders & AI engineers on one mission."
          text="Our multidisciplinary command team unites decades of elite tactical rescue leadership with cutting-edge artificial intelligence researchers."
        />

        <div className="team-grid">
          {members.map((person) => (
            <article className="team-card" key={person.name}>
              <div className="team-image-wrap">
                <img src={person.image} alt={person.name} />
                <span className="team-badge-icon">↗</span>
              </div>
              <div className="team-info">
                <h3>{person.name}</h3>
                <p>{person.role}</p>
                <span>{person.specialty}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}