import SectionHeading from "./SectionHeading";
import React from 'react';

const posts = [
  {
    category: "Tactical Protocols",
    readTime: "4 min read",
    title: "Active Threat Response Protocols: What Citizens Must Know",
    image: "https://images.unsplash.com/photo-1508847154043-be5407fcaa5a?auto=format&fit=crop&w=1000&q=80"
  },
  {
    category: "AI Safety Tech",
    readTime: "6 min read",
    title: "How Edge Computer Vision Intercepts Violence in Transit Corridors",
    image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=1000&q=80"
  },
  {
    category: "Community Shield",
    readTime: "5 min read",
    title: "De-escalation Science: Resolving Volatile Encounters Without Harm",
    image: "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=1000&q=80"
  }
];

export default function Blog() {
  return (
    <section className="section blog" id="blog">
      <div className="container">
        <SectionHeading
          eyebrow="SAFETY GUIDANCE & FIELD INSIGHTS"
          title="Essential knowledge for resilient, protected communities."
          text="Explore tactical field guides, computer vision breakthroughs, and life-saving public safety guidelines prepared by our emergency commanders."
        />

        <div className="blog-grid">
          {posts.map((post) => (
            <article className="blog-card" key={post.title}>
              <div className="blog-image-wrap">
                <img src={post.image} alt={post.title} />
              </div>
              <div className="blog-body">
                <div className="blog-meta-row">
                  <span className="blog-category-pill">{post.category}</span>
                  <span className="blog-read-time">{post.readTime}</span>
                </div>
                <h3>{post.title}</h3>
                <a href="#contact" className="blog-card-link">
                  <span>Read Field Guide</span>
                  <span>→</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}