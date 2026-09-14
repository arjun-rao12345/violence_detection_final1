import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../apiConfig";

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("userToken");

  const fetchMyReports = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${API_URL}/ViolenceReport/GetMyReports`, {
        headers: {
          "auth-token": token,
        },
      });

      if (response.data?.success) {
        setReports(response.data.reports || []);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.error("Fetch reports error:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("userToken");
        setError("Your session has expired. Please log in again.");
      } else {
        setError(err.response?.data?.message || "Failed to load your reports. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return "badge-resolved";
      case "dispatched":
        return "badge-dispatched";
      case "assigned":
      case "under review":
        return "badge-assigned";
      default:
        return "badge-pending";
    }
  };

  const getSeverityBadgeClass = (sev) => {
    switch (sev?.toLowerCase()) {
      case "urgent":
      case "critical":
        return "sev-urgent";
      case "high":
        return "sev-high";
      case "med":
        return "sev-med";
      default:
        return "sev-low";
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchesStatus =
      selectedStatus === "All" ||
      r.status?.toLowerCase() === selectedStatus.toLowerCase();

    const matchesSearch =
      searchQuery.trim() === "" ||
      r.incidentNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    All: reports.length,
    Pending: reports.filter((r) => r.status === "Pending").length,
    Assigned: reports.filter((r) => r.status === "Assigned" || r.status === "Under Review").length,
    Dispatched: reports.filter((r) => r.status === "Dispatched").length,
    Resolved: reports.filter((r) => r.status === "Resolved").length,
  };

  // If user is not logged in
  if (!token) {
    return (
      <section className="section my-reports-section">
        <div className="container" style={{ maxWidth: "600px", textAlign: "center", padding: "60px 20px" }}>
          <div style={{ background: "#fff", padding: "40px 24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 10px 25px rgba(0,0,0,0.06)" }}>
            <div style={{ width: "64px", height: "64px", background: "rgba(229, 46, 46, 0.1)", borderRadius: "50%", display: "grid", placeItems: "center", margin: "0 auto 16px", color: "var(--primary-red)" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "8px", fontWeight: 700 }}>Login Required</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "24px", fontSize: "0.95rem" }}>
              Please login to your citizen account to view your past incident reports and live officer dispatch status.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/login" className="btn btn-primary" style={{ padding: "10px 28px" }}>
                Login to Account
              </Link>
              <Link to="/register" className="btn btn-dark" style={{ padding: "10px 28px" }}>
                Register
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section my-reports-section">
      <div className="container">
        {/* Page Header */}
        <div className="my-reports-header">
          <div>
            <div className="eyebrow" style={{ color: "var(--primary-red)", fontWeight: 800 }}>
              CITIZEN INCIDENT DISPATCH ARCHIVE
            </div>
            <h1 className="my-reports-title">My Submitted Reports</h1>
            <p className="my-reports-subtitle">
              Review incident details, verified attachments, assigned police stations, and live response progress for all alerts you have transmitted.
            </p>
          </div>
          <div>
            <Link to="/report-violence" className="btn btn-primary new-report-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Report Violence</span>
            </Link>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="my-reports-controls">
          <div className="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#94a3b8" }}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search by ticket #, location, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={{ color: "#94a3b8", fontSize: "14px", padding: "4px" }}>
                ✕
              </button>
            )}
          </div>

          <div className="status-filter-tabs">
            {["All", "Pending", "Assigned", "Dispatched", "Resolved"].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`status-tab ${selectedStatus === status ? "active" : ""}`}
              >
                <span>{status}</span>
                <span className="status-count-pill">{statusCounts[status] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="reports-loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your incident records...</p>
          </div>
        )}

        {error && !loading && (
          <div className="reports-error-state">
            <p>{error}</p>
            <button onClick={fetchMyReports} className="btn btn-dark btn-sm">
              Retry
            </button>
          </div>
        )}

        {/* Reports List */}
        {!loading && !error && filteredReports.length === 0 && (
          <div className="reports-empty-state">
            <div className="empty-icon">📂</div>
            <h3>No reports found</h3>
            <p>
              {reports.length === 0
                ? "You have not filed any violence or emergency reports yet."
                : "No reports match the selected filters."}
            </p>
            {reports.length === 0 ? (
              <Link to="/report-violence" className="btn btn-primary" style={{ marginTop: "14px" }}>
                File Emergency Report
              </Link>
            ) : (
              <button
                onClick={() => {
                  setSelectedStatus("All");
                  setSearchQuery("");
                }}
                className="btn btn-dark btn-sm"
                style={{ marginTop: "14px" }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {!loading && !error && filteredReports.length > 0 && (
          <div className="reports-cards-grid">
            {filteredReports.map((report) => {
              const dateStr = new Date(report.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });

              return (
                <div key={report._id} className="report-history-card">
                  {/* Card Header */}
                  <div className="report-card-header">
                    <div className="ticket-group">
                      <span className="ticket-tag">#{report.incidentNumber || "RX-INC"}</span>
                      <span className={`status-pill ${getStatusBadgeClass(report.status)}`}>
                        {report.status || "Pending"}
                      </span>
                    </div>
                    <div className="report-date-text">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span>{dateStr}</span>
                    </div>
                  </div>

                  {/* Card Category & Badges */}
                  <div className="report-category-row">
                    <h3 className="report-cat-title">{report.category}</h3>
                    <div className="badges-group">
                      <span className={`severity-tag ${getSeverityBadgeClass(report.severity)}`}>
                        {report.severity ? report.severity.toUpperCase() : "HIGH"}
                      </span>
                      {report.isInjured && (
                        <span className="injured-tag">🚑 INJURED VICTIMS</span>
                      )}
                      {report.isAnonymous && (
                        <span className="anon-tag">🔒 ANONYMOUS</span>
                      )}
                    </div>
                  </div>

                  {/* Location & Description */}
                  <div className="report-location-box">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--primary-red)", flexShrink: 0, marginTop: "2px" }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>{report.location || "Location Coordinates Provided"}</span>
                  </div>

                  <p className="report-desc-text">{report.description}</p>

                  {/* Station & Officer Dispatch info */}
                  <div className="dispatch-info-panel">
                    <div className="dispatch-col">
                      <span className="info-label">Police Station:</span>
                      <strong className="info-val">
                        {report.policeStationId?.stationName || "Central Dispatch Headquarters"}
                      </strong>
                      {report.distanceFromStation && (
                        <span className="info-sub">({report.distanceFromStation} km away)</span>
                      )}
                    </div>

                    <div className="dispatch-col">
                      <span className="info-label">Assigned Officer:</span>
                      {report.assignedOfficerId ? (
                        <div className="officer-badge-info">
                          <strong className="info-val">{report.assignedOfficerId.officerName}</strong>
                          <span className="info-sub">
                            {report.assignedOfficerId.rank || "Officer"} • Badge #{report.assignedOfficerId.badgeNumber}
                          </span>
                        </div>
                      ) : (
                        <span className="info-pending">
                          {report.status === "Pending" ? "Awaiting unit assignment..." : "Station Dispatch Team"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Attached Images */}
                  {report.images && report.images.length > 0 && (
                    <div className="report-images-section">
                      <span className="images-label">Attached Photos ({report.images.length}):</span>
                      <div className="report-images-strip">
                        {report.images.map((img, idx) => {
                          const cleanPath = img.replace(/\\/g, "/");
                          const imgUrl = cleanPath.startsWith("http")
                            ? cleanPath
                            : `${API_URL}/${cleanPath.startsWith("uploads/") ? cleanPath : "uploads/" + cleanPath}`;

                          return (
                            <img
                              key={idx}
                              src={imgUrl}
                              alt={`Evidence photo ${idx + 1}`}
                              className="thumb-img"
                              onClick={() => setSelectedImage(imgUrl)}
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Card Footer Actions */}
                  <div className="report-card-footer">
                    <Link
                      to={`/response-tracking/${report._id}`}
                      className="btn btn-primary track-btn"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                      </svg>
                      <span>Track Dispatch Live</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="image-modal-backdrop" onClick={() => setSelectedImage(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Full evidence view" className="full-modal-img" />
            <button className="modal-close-btn" onClick={() => setSelectedImage(null)}>
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
