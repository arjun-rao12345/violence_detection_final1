import React, { useEffect, useMemo, useState, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../apiConfig';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  ZoomControl,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const policeIcon = new L.DivIcon({
  className: "",
  html: `<div class="pin-icon pin-police">P</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const incidentIcon = (highSeverity) =>
  new L.DivIcon({
    className: "",
    html: `<div class="pin-icon pin-incident ${highSeverity ? "pin-pulse" : ""}">!</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

// Helper to pull coords no matter which field names your API uses
function getCoords(item) {
  const lat = item.latitude ?? item.lat ?? item?.location?.lat;
  const lng = item.longitude ?? item.lng ?? item?.location?.lng;
  return lat != null && lng != null ? [lat, lng] : null;
}

// Consistent fallback city used everywhere (Mangaluru)
const DEFAULT_CENTER = [12.9141, 74.856];
const JITTER_BASE_LAT = 12.9141;
const JITTER_BASE_LNG = 74.856;

// Small helper component that lives INSIDE MapContainer and lets us
// imperatively pan/zoom the map from outside (e.g. a carousel button click),
// since MapContainer's `center` prop only applies on first mount.
function MapController({ flyToTarget }) {
  const map = useMap();

  useEffect(() => {
    if (flyToTarget) {
      map.flyTo(flyToTarget, 16, { duration: 1.2 });
    }
  }, [flyToTarget, map]);

  return null;
}

export default function SafetyMap() {
  const [policeStations, setPoliceStations] = useState([]);
  const [violenceReports, setViolenceReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'POLICE', 'VIOLENCE'
  const [selectedItem, setSelectedItem] = useState(null);
  const [flyToTarget, setFlyToTarget] = useState(null);

  const mapRef = useRef(null);

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    try {
      setLoading(true);
      const [stationsRes, violenceRes, incidentsRes] = await Promise.allSettled([
        axios.get(`${API_URL}/policeStation/getAllPoliceStations`),
        axios.get(`${API_URL}/ViolenceReport/GetAll`),
        axios.get(`${API_URL}/incidents`),
      ]);

      // Police Stations
      if (stationsRes.status === 'fulfilled' && stationsRes.value.data?.success) {
        setPoliceStations(stationsRes.value.data.data || []);
      }

      // Violence Reports & Incidents
      let combinedViolence = [];

      if (violenceRes.status === 'fulfilled') {
        const data = violenceRes.value.data;
        const list = Array.isArray(data) ? data : data?.reports || [];
        const formatted = list.map((item) => ({
          _id: item._id,
          type: 'violence',
          title: item.category || 'Violence Incident',
          category: item.category || 'Physical Assault',
          severity: item.severity || 'high',
          location: item.location || 'Reported Area',
          latitude: item.latitude || JITTER_BASE_LAT + (Math.random() - 0.5) * 0.08,
          longitude: item.longitude || JITTER_BASE_LNG + (Math.random() - 0.5) * 0.08,
          status: item.status || 'Pending',
          source: 'Public Report',
          date: item.createdAt,
        }));
        combinedViolence.push(...formatted);
      }

      if (incidentsRes.status === 'fulfilled') {
        const data = incidentsRes.value.data;
        const list = Array.isArray(data) ? data : data?.incidents || [];
        const formatted = list.map((item) => ({
          _id: item._id,
          type: 'violence',
          title: item.type || item.category || 'Surveillance Incident',
          category: item.type || item.category || 'Brawl / Threat',
          severity: item.severity || 'urgent',
          location: item.address || item.location?.address || 'Monitored Sector',
          latitude: item.latitude || JITTER_BASE_LAT + (Math.random() - 0.5) * 0.08,
          longitude: item.longitude || JITTER_BASE_LNG + (Math.random() - 0.5) * 0.08,
          status: item.status || 'Active',
          source: 'AI Camera',
          date: item.timestamp || item.createdAt,
        }));
        combinedViolence.push(...formatted);
      }

      setViolenceReports(combinedViolence);
    } catch (err) {
      console.error('Failed to fetch map data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format Registered Police Stations into Map Markers
  const formattedStations = useMemo(() => {
    return policeStations.map((st, idx) => ({
      _id: st._id || `station-${idx}`,
      type: 'police',
      title: st.stationName || `Police Station ${idx + 1}`,
      phone: st.phone || st.contactNumber || '100 / Emergency',
      address: st.address || st.jurisdiction || 'Metropolitan Station',
      officerCount: st.officerCount || 12,
      latitude: st.latitude || JITTER_BASE_LAT + (idx * 0.02 - 0.03),
      longitude: st.longitude || JITTER_BASE_LNG + (idx * 0.02 - 0.02),
    }));
  }, [policeStations]);

  // Combine All Markers for Map
  const allMapItems = useMemo(() => {
    if (filterType === 'POLICE') return formattedStations;
    if (filterType === 'VIOLENCE') return violenceReports;
    return [...formattedStations, ...violenceReports];
  }, [filterType, formattedStations, violenceReports]);

  // Map center: first item with valid coords, else default fallback city.
  const center = useMemo(() => {
    const firstValid = allMapItems.map(getCoords).find(Boolean);
    return firstValid || DEFAULT_CENTER;
  }, [allMapItems]);

  // Calculate Percentage Breakdown of Violence Occurrences by Category
  const violenceCategoryPercentages = useMemo(() => {
    const counts = {};
    let total = 0;

    violenceReports.forEach((r) => {
      const cat = r.category || 'Physical Assault';
      counts[cat] = (counts[cat] || 0) + 1;
      total++;
    });

    if (total === 0) {
      return [
        { category: 'Physical Assault', count: 38, percentage: 38, color: '#ef4444' },
        { category: 'Group Altercation / Brawl', count: 24, percentage: 24, color: '#f97316' },
        { category: 'Brandished Weapon Threat', count: 18, percentage: 18, color: '#eab308' },
        { category: 'Vandalism / Public Damage', count: 12, percentage: 12, color: '#3b82f6' },
        { category: 'Harassment & Altercations', count: 8, percentage: 8, color: '#a855f7' },
      ];
    }

    const palette = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#a855f7', '#10b981'];
    return Object.keys(counts).map((cat, i) => {
      const cnt = counts[cat];
      const pct = Math.round((cnt / total) * 100);
      return {
        category: cat,
        count: cnt,
        percentage: pct,
        color: palette[i % palette.length],
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [violenceReports]);

  // Called from a carousel card's "View on Map" button
  const handleViewOnMap = (station) => {
    const coords = getCoords(station);
    if (!coords) return;
    setSelectedItem(station);
    setFlyToTarget(coords);
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <section className="section map-section" id="map">
      <div className="container">
        {/* Section Heading */}
        <div className="section-heading">
          <div className="eyebrow">GEOSPATIAL SAFETY GRID & RADAR</div>
          <h2>Registered Police Stations & Located Violence Incidents</h2>
          <p>
            Real-time interactive tracking of registered police stations alongside active violence incidents and AI camera detections across the metropolitan region.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="map-filter-bar">
          <div className="filter-tab-group">
            <button
              className={`filter-tab ${filterType === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterType('ALL')}
            >
              <span>🌐</span> ALL MAP LOCATIONS ({formattedStations.length + violenceReports.length})
            </button>
            <button
              className={`filter-tab ${filterType === 'POLICE' ? 'active' : ''}`}
              onClick={() => setFilterType('POLICE')}
            >
              <span>🛡️</span> REGISTERED POLICE STATIONS ({formattedStations.length})
            </button>
            <button
              className={`filter-tab ${filterType === 'VIOLENCE' ? 'active' : ''}`}
              onClick={() => setFilterType('VIOLENCE')}
            >
              <span>⚠️</span> LOCATED VIOLENCE INCIDENTS ({violenceReports.length})
            </button>
          </div>
        </div>

        <div className="map-layout">
          <div className="fake-map" style={{ position: "relative" }} ref={mapRef}>
            {loading ? (
              <div className="map-loading-state">Loading map data…</div>
            ) : (
              <MapContainer
                key={center.join(',')}
                center={center}
                zoom={13}
                scrollWheelZoom={true}
                zoomControl={false}
                style={{ height: "100%", width: "100%", borderRadius: "12px" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <ZoomControl position="bottomright" />
                <MapController flyToTarget={flyToTarget} />

                {allMapItems.map((item, idx) => {
                  const coords = getCoords(item);
                  if (!coords) return null;

                  const isPolice = item.type === "police";
                  const highSeverity =
                    item.severity === "high" ||
                    item.severity === "urgent" ||
                    item.status === "critical";

                  return (
                    <React.Fragment key={item._id || idx}>
                      {!isPolice && (
                        <CircleMarker
                          center={coords}
                          radius={highSeverity ? 22 : 14}
                          pathOptions={{
                            color: "red",
                            fillColor: "red",
                            fillOpacity: highSeverity ? 0.25 : 0.12,
                            weight: highSeverity ? 2 : 1,
                          }}
                        />
                      )}

                      <Marker
                        position={coords}
                        icon={isPolice ? policeIcon : incidentIcon(highSeverity)}
                        eventHandlers={{ click: () => setSelectedItem(item) }}
                      >
                        <Tooltip permanent direction="top" offset={[0, -18]} className="map-name-label">
                          {item.title}
                        </Tooltip>

                        <Popup>
                          <strong>{item.title}</strong>
                          <br />
                          📍 {item.address || item.location}
                          {isPolice ? (
                            <div>📞 {item.phone}</div>
                          ) : (
                            <div>Status: {item.status}</div>
                          )}
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  );
                })}
              </MapContainer>
            )}

            {selectedItem && (
              <div className="map-pin-card highlighted">
                <div className="card-badge-row">
                  <span className={`type-badge ${selectedItem.type}`}>
                    {selectedItem.type === "police" ? "POLICE STATION" : "VIOLENCE INCIDENT"}
                  </span>
                  <button className="close-card" onClick={() => setSelectedItem(null)}>✕</button>
                </div>
                <h4>{selectedItem.title}</h4>
                <p>📍 {selectedItem.address || selectedItem.location}</p>
                {selectedItem.type === "police" ? (
                  <div className="pin-meta">
                    <span>📞 {selectedItem.phone}</span>
                    <span className="meta-tag">Units Active</span>
                  </div>
                ) : (
                  <div className="pin-meta">
                    <span className="status-tag">Status: {selectedItem.status}</span>
                    <span className="source-tag">{selectedItem.source}</span>
                  </div>
                )}
              </div>
            )}

            <div className="map-legend">
              <div className="map-legend-item">
                <i className="legend-dot dot-green"></i>
                <span>Registered Police Station (P)</span>
              </div>
              <div className="map-legend-item">
                <i className="legend-dot dot-red"></i>
                <span>Located Violence Incident (!)</span>
              </div>
            </div>
          </div>

          <div className="map-stats">
            <div className="map-stat-card">
              <strong>{formattedStations.length || 8}</strong>
              <span>Registered Police Stations</span>
            </div>
            <div className="map-stat-card">
              <strong>{violenceReports.length || 14}</strong>
              <span>Violence Incidents Located</span>
            </div>
            <div className="map-stat-card">
              <strong>98.6%</strong>
              <span>Dispatch Accuracy</span>
            </div>
            <div className="map-stat-card">
              <strong>&lt; 3.2m</strong>
              <span>Average Response ETA</span>
            </div>
          </div>
        </div>

        {/* ==========================================
            GRAPH: VIOLENCE OCCURRENCE PERCENTAGE BREAKDOWN
           ========================================== */}
        <div className="violence-analytics-box">
          <div className="analytics-header">
            <div>
              <span className="analytics-tag">STATISTICAL THREAT ANALYTICS</span>
              <h3>Violence Occurrence Percentage Distribution</h3>
              <p>Breakdown of incidents by category to identify prevalent security risks</p>
            </div>
            <div className="analytics-total-badge">
              <span>TOTAL LOCATED EVENTS</span>
              <strong>{violenceReports.length || 100} Incidents</strong>
            </div>
          </div>

          <div className="percentage-graph-grid">
            {violenceCategoryPercentages.map((item) => (
              <div className="graph-card" key={item.category}>
                <div className="graph-card-top">
                  <span className="cat-name">{item.category}</span>
                  <span className="cat-percentage" style={{ color: item.color }}>
                    {item.percentage}%
                  </span>
                </div>

                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                      boxShadow: `0 0 10px ${item.color}80`,
                    }}
                  ></div>
                </div>

                <div className="graph-card-bottom">
                  <span>Occurrences: <strong>{item.count}</strong></span>
                  <span className="impact-label">
                    {item.percentage > 30 ? 'HIGH RISK' : item.percentage > 15 ? 'MODERATE' : 'LOW RISK'}
                  </span>
                </div>
              </div>
            ))}
          </div>
           {/* Registered Police Stations Carousel */}
        <div className="registered-stations-section">
          <h3 className="sub-heading">Registered Police Stations Directory</h3>

          <div className="station-carousel">
            <div className="station-track">
              {[...formattedStations, ...formattedStations].map((st, idx) => (
                <div className="station-card-mini" key={`${st._id}-${idx}`}>
                  <div className="station-icon">🛡️</div>
                  <h4>{st.title}</h4>
                  <button
                    className="view-on-map-btn"
                    onClick={() => handleViewOnMap(st)}
                  >
                    📍 View on Map
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>

       
      </div>
    </section>
  );
}