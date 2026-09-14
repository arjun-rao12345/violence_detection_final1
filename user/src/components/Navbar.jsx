import { useState, useEffect } from "react";
import React from "react";
import { Link, useNavigate } from "react-router-dom";

const menuItems = [
  // {
  //   label: "Services",
  //   children: [
  //     { name: "Tactical & Active Threat", href: "/services" },
  //     { name: "Rapid Police Dispatch", href: "/services" },
  //     { name: "Fire & Hazardous Rescue", href: "/services" },
  //     { name: "Paramedic Trauma Response", href: "/services" },
  //   ],
  // },

  // {
  //   label: "Tracking & Safety",
  //   children: [
  //     { name: "Live Dispatch Timeline", href: "/response-tracking" },
  //     { name: "Operational Strength", href: "/strength" },
  //     { name: "Emergency Protocols FAQ", href: "/faq" },
  //   ],
  // },
  // {
  //   label: "About & Team",
  //   children: [
  //     { name: "About RescueX", href: "/about" },
  //     { name: "Response Commanders", href: "/team" },
  //     { name: "Safety Field Guides", href: "/blog" },
  //   ],
  // },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const navigate = useNavigate();

  // CHECK LOGIN
  const token = localStorage.getItem("userToken");

  // SCROLL
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // DROPDOWN
  const toggleDropdown = (index) => {
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  // CLOSE MENUS
  const closeMenus = () => {
    setMobileOpen(false);
    setActiveDropdown(null);
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("user");
    closeMenus();
    navigate("/login");
  };

  return (
    <header className={`navbar ${isScrolled ? "scrolled" : ""}`}>
      <div className="nav-inner">

        {/* BRAND */}
        <Link className="logo" to="/" onClick={closeMenus}>
          <div className="logo-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <path d="M12 8v8"></path>
              <path d="M8 12h8"></path>
            </svg>
          </div>
          <span>
            Rescue<span className="logo-text-accent">X</span>
          </span>
        </Link>

        {/* NAVIGATION */}
        <nav className={`nav-menu ${mobileOpen ? "open" : ""}`}>
               <Link className="logo" to="/" onClick={closeMenus}>
           <button className="nav-link" onClick={closeMenus} aria-expanded={activeDropdown === null}>
                <span>Home</span>
                {/* <span className="chevron">▾</span> */}
              </button>
              </Link>
                   <Link className="logo" to="/about" onClick={closeMenus}>
           <button className="nav-link" onClick={closeMenus} aria-expanded={activeDropdown === null}>
                <span>AboutUs</span>
                {/* <span className="chevron">▾</span> */}
              </button>
              </Link>
                 <Link className="logo" to="/services" onClick={closeMenus}>
           <button className="nav-link" onClick={closeMenus} aria-expanded={activeDropdown === null}>
                <span>Services</span>
                {/* <span className="chevron">▾</span> */}
              </button>
              </Link>
          {menuItems.map((item, index) => (
            <div className={`nav-item ${activeDropdown === index ? "active" : ""}`} key={item.label}>
              <button className="nav-link" onClick={() => toggleDropdown(index)} aria-expanded={activeDropdown === index}>
                <span>{item.label}</span>
                <span className="chevron">▾</span>
              </button>

              <div className={`dropdown ${activeDropdown === index ? "show" : ""}`}>
                {item.children.map((child) => (
                  <Link to={child.href} key={child.name} onClick={closeMenus}>
                    <span>{child.name}</span>
                    <span>→</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* EMERGENCY */}
          <Link className="nav-link" to="/cta" onClick={closeMenus}>
            Emergency Hotline
          </Link>
        </nav>

        {/* NAV ACTIONS */}
        <div className="nav-actions">

          {/* LIVE STATUS */}
          {/* <div className="nav-status-pill">
            <span className="live-dot"></span>
            <span>AI GRID LIVE</span>
          </div> */}

          {/* PHONE */}
          <a className="nav-call" href="tel:112" title="Emergency 24/7 Speed Dial">
            <div className="nav-call-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </div>
            <div className="nav-call-info">
              <span>Emergency 24/7</span>
              <strong>112</strong>
            </div>
          </a>

          {/* LOGGED IN / NOT LOGGED IN */}
          {token ? (
            <>
              <Link to="/my-reports" className="nav-report-btn" onClick={closeMenus}>
                <span>MY REPORTS</span>
              </Link>

              <button className="nav-report-btn" onClick={handleLogout}>
                <span>LOGOUT</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-login-btn nav-report-btn" onClick={closeMenus}>
                LOGIN
              </Link>

              <Link to="/register" className="nav-register-btn nav-report-btn" onClick={closeMenus}>
                REGISTER
              </Link>
            </>
          )}

          {/* REPORT VIOLENCE */}
          <Link to="/report-violence" className="nav-report-btn" onClick={closeMenus}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            <span>REPORT VIOLENCE</span>
          </Link>

          {/* MOBILE */}
          <button className="menu-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation menu">
            <span></span>
            <span></span>
            <span></span>
          </button>

        </div>
      </div>
    </header>
  );
}