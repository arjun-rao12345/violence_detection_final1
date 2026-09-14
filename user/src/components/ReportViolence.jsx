
  import { useState, useRef, useEffect } from "react";
  import React from 'react';
  import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import axios from 'axios';
  import { API_URL } from '../apiConfig';
  // Fix Leaflet default marker icons (same fix as PoliceStations.jsx)
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
  });

  const DEFAULT_MAP_CENTER = [12.9141, 74.856]; // Mangaluru default, same as reference

  const MAX_IMAGES = 5;
  const MAX_IMAGE_SIZE_MB = 10;
  const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  const categories = [
    "Physical Assault",
    "Weapon Threat",
    "Fight / Brawl",
    "Robbery / Mugging",
    "Domestic Violence",
    "Vandalism / Riot",
    "Stalking / Harassment",
    "Suspicious Activity",
    "Other Threat"
  ];

  // Re-centers the map when position changes (e.g. after GPS button)
  const ChangeMapView = ({ position }) => {
    const map = useMap();
    React.useEffect(() => {
      if (position) {
        map.flyTo(position, 16, { duration: 1 });
      }
    }, [position, map]);
    return null;
  };

  // Handles click-to-select + reverse geocoding, same pattern as PoliceStations.jsx
  const LocationSelector = ({ position, onLocationSelect, onAddressLoading, onLocationError }) => {
    const map = useMapEvents({
      async click(event) {
        const { lat, lng } = event.latlng;
        const latitude = lat.toFixed(6);
        const longitude = lng.toFixed(6);

        onLocationError('');
        map.flyTo([lat, lng], 16, { duration: 1 });

        // Show coordinates immediately, then fill in the readable address
        onLocationSelect({ position: [lat, lng], text: `Lat ${latitude}, Long ${longitude}` });

        try {
          onAddressLoading(true);

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
            { headers: { Accept: 'application/json' } }
          );

          if (!response.ok) {
            throw new Error('Unable to retrieve address');
          }

          const data = await response.json();

          onLocationSelect({
            position: [lat, lng],
            text: data.display_name || `Lat ${latitude}, Long ${longitude}`
          });
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          onLocationError('Location pinned, but the address could not be looked up. You can still edit the text field manually.');
        } finally {
          onAddressLoading(false);
        }
      }
    });

    if (!position) {
      return null;
    }

    return <Marker position={position} />;
  };

  export default function ReportViolence() {
    const [submitted, setSubmitted] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("Physical Assault");
    const [severity, setSeverity] = useState("high");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isInjured, setIsInjured] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [incidentId, setIncidentId] = useState("RX-8842");
  const [nearbyStations, setNearbyStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState("");
  const [stationsLoading, setStationsLoading] = useState(false);
  const [stationsError, setStationsError] = useState("");
    // Map location selection state
    const [mapPosition, setMapPosition] = useState(null); // [lat, lng] or null
    const [addressLoading, setAddressLoading] = useState(false);
    const [locationError, setLocationError] = useState("");
    const [showMap, setShowMap] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Image upload state: [{ id, file, previewUrl }]
    const [images, setImages] = useState([]);
    const [imageError, setImageError] = useState("");
    const fileInputRef = useRef(null);

    const handleMapLocationSelect = ({ position, text }) => {
      setMapPosition(position);
      setLocation(text);
    };
  const fetchNearbyStations = async (lat, lng) => {
    setStationsLoading(true);
    setStationsError("");
    try {
      const response = await axios.get(`${API_URL}/policeStation/getAllPoliceStations`);
      const stations = response.data?.data || [];

      const withDistance = stations
        .filter((s) => s.latitude != null && s.longitude != null)
        .map((s) => ({
          ...s,
          distanceKm: calculateDistanceKm(lat, lng, Number(s.latitude), Number(s.longitude))
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm);

      setNearbyStations(withDistance);
      setSelectedStationId(withDistance.length > 0 ? withDistance[0]._id : "");

      if (withDistance.length === 0) {
        setStationsError("No police stations with location data found.");
      }
    } catch (error) {
      console.error("Failed to load nearby police stations:", error);
      setStationsError("Couldn't load nearby police stations. You can still submit — the system will auto-assign one.");
      setNearbyStations([]);
      setSelectedStationId("");
    } finally {
      setStationsLoading(false);
    }
  };
  useEffect(() => {
    if (mapPosition) {
      fetchNearbyStations(mapPosition[0], mapPosition[1]);
    } else {
      setNearbyStations([]);
      setSelectedStationId("");
    }
  }, [mapPosition]);
    const getLocation = () => {
      setGpsLoading(true);
      setLocationError("");

      if (!navigator.geolocation) {
        setGpsLoading(false);
        setLocationError("Geolocation isn't supported by this browser. Pick a point on the map or type the location manually.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setMapPosition([latitude, longitude]);
          setLocation(`Lat ${latitude.toFixed(4)}, Long ${longitude.toFixed(4)}`);
          setShowMap(true);

          try {
            setAddressLoading(true);
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`,
              { headers: { Accept: 'application/json' } }
            );
            if (response.ok) {
              const data = await response.json();
              if (data.display_name) {
                setLocation(data.display_name);
              }
            }
          } catch (error) {
            console.error('Reverse geocoding failed:', error);
          } finally {
            setAddressLoading(false);
            setGpsLoading(false);
          }
        },
        () => {
          setGpsLoading(false);
          setLocationError("Couldn't get your GPS location. Allow location access, pick a point on the map, or type it manually.");
        }
      );
    };

    // ---- Image upload handlers ----
    const handleFilesSelected = (fileList) => {
      setImageError("");
      const incoming = Array.from(fileList || []);

      if (incoming.length === 0) return;

      const remainingSlots = MAX_IMAGES - images.length;
      if (remainingSlots <= 0) {
        setImageError(`You can attach up to ${MAX_IMAGES} images.`);
        return;
      }

      const accepted = [];
      let rejectedType = false;
      let rejectedSize = false;

      incoming.slice(0, remainingSlots).forEach((file) => {
        if (!file.type.startsWith("image/")) {
          rejectedType = true;
          return;
        }
        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          rejectedSize = true;
          return;
        }
        accepted.push({
          id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          previewUrl: URL.createObjectURL(file)
        });
      });

      if (incoming.length > remainingSlots) {
        setImageError(`Only ${remainingSlots} more image(s) could be added (max ${MAX_IMAGES}).`);
      } else if (rejectedType) {
        setImageError("Only image files are supported.");
      } else if (rejectedSize) {
        setImageError(`Each image must be under ${MAX_IMAGE_SIZE_MB}MB.`);
      }

      if (accepted.length > 0) {
        setImages((prev) => [...prev, ...accepted]);
      }
    };

    const handleFileInputChange = (e) => {
      handleFilesSelected(e.target.files);
      e.target.value = ""; // allow re-selecting the same file
    };

    const handleDrop = (e) => {
      e.preventDefault();
      handleFilesSelected(e.dataTransfer.files);
    };

    const removeImage = (id) => {
      setImages((prev) => {
        const target = prev.find((img) => img.id === id);
        if (target) URL.revokeObjectURL(target.previewUrl);
        return prev.filter((img) => img.id !== id);
      });
    };

    const clearAllImages = () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      setImages([]);
      setImageError("");
    };



  const resetAll = () => {
    setSubmitted(false);
    setDescription("");
    setLocation("");
    setMapPosition(null);
    setShowMap(false);
    setNearbyStations([]);
    setSelectedStationId("");
    clearAllImages();
  };
  // const submit = async (e) => {

  //   e.preventDefault();

  //   try {

  //     const formData = new FormData();


  //     const randomId =
  //       "RX-" +
  //       Math.floor(
  //         1000 + Math.random() * 9000
  //       );


  //     formData.append(
  //       "incidentNumber",
  //       randomId
  //     );

  //     formData.append(
  //       "category",
  //       selectedCategory
  //     );

  //     formData.append(
  //       "severity",
  //       severity
  //     );

  //     formData.append(
  //       "location",
  //       location
  //     );

  //     formData.append(
  //       "latitude",
  //       mapPosition ? mapPosition[0] : ""
  //     );

  //     formData.append(
  //       "longitude",
  //       mapPosition ? mapPosition[1] : ""
  //     );

  //     formData.append(
  //       "description",
  //       description
  //     );

  //     formData.append(
  //       "isAnonymous",
  //       isAnonymous
  //     );

  //     formData.append(
  //       "isInjured",
  //       isInjured
  //     );


  //     // Add images

  //     images.forEach((image) => {

  //       formData.append(
  //         "images",
  //         image.file
  //       );

  //     });


  //     // const response = await axios.post(

  //     //   "http://localhost:4001/ViolenceReport/Insert",

  //     //   formData

  //     // );
  // const token = localStorage.getItem("userToken");

  // if (!token) {
  //   alert("Please login before submitting a violence report");
  //   return;
  // }

  // const response = await axios.post(
  //   "http://localhost:4001/ViolenceReport/Insert",
  //   formData,
  //   {
  //     headers: {
  //       "auth-token": token
  //     }
  //   }
  // );

  //     console.log(response.data);


  //     setIncidentId(randomId);

  //     setSubmitted(true);


  //   } catch (error) {

  //     console.error(
  //       error.response?.data || error
  //     );

  //     alert(
  //       "Error submitting violence report"
  //     );

  //   }

  // };
    
  const submit = async (e) => {

    e.preventDefault();

    try {

      // ==========================================
      // GET LOGIN TOKEN
      // ==========================================

      const token = localStorage.getItem("userToken");


      // ==========================================
      // CHECK LOGIN
      // ==========================================

      if (!token) {

        alert("Please login before submitting a violence report");

        return;

      }


      const formData = new FormData();


      // ==========================================
      // GENERATE INCIDENT NUMBER
      // ==========================================

      const randomId =
        "RX-" +
        Math.floor(
          1000 + Math.random() * 9000
        );


      formData.append(
        "incidentNumber",
        randomId
      );


      formData.append(
        "category",
        selectedCategory
      );
  formData.append("policeStationId", selectedStationId || "");

      formData.append(
        "severity",
        severity
      );


      formData.append(
        "location",
        location
      );


      const finalLat = mapPosition ? mapPosition[0] : 12.9141;
      const finalLng = mapPosition ? mapPosition[1] : 74.8560;

      formData.append(
        "latitude",
        finalLat
      );

      formData.append(
        "longitude",
        finalLng
      );

      formData.append(
        "description",
        description
      );

      formData.append(
        "isAnonymous",
        isAnonymous
      );

      formData.append(
        "isInjured",
        isInjured
      );

      // ==========================================
      // ADD IMAGES
      // ==========================================
      images.forEach((image) => {
        formData.append(
          "images",
          image.file
        );
      });

      // ==========================================
      // SEND REQUEST
      // ==========================================
      setSubmitting(true);

      const response = await axios.post(
        `${API_URL}/ViolenceReport/Insert`,
        formData,
        {
          headers: {
            "auth-token": token
          }
        }
      );

      console.log(
        "Report submitted:",
        response.data
      );

      // ==========================================
      // SET INCIDENT ID
      // ==========================================
      setIncidentId(randomId);
      setSubmitted(true);

    } catch (error) {

      console.error(
        "Submit error:",
        error.response?.data || error
      );

      if (
        error.response?.status === 401
      ) {
        alert(
          "Your login session has expired. Please login again."
        );
        localStorage.removeItem("userToken");
        return;
      }

      alert(
        error.response?.data?.message ||
        "Error submitting violence report"
      );

    } finally {
      setSubmitting(false);
    }

  };
  return (
      <section className="section report-section" id="report">
        <div className="container report-grid">
          {/* Left Explanation Column */}
          <div className="report-copy">
            <div className="eyebrow">EMERGENCY REPORTING PORTAL</div>
            <h2>Witnessed violence or danger? Report immediately.</h2>
            <p>
              Your report is instantly transmitted to authorized emergency dispatch operators, nearest police patrol cruisers, and rapid paramedic response units within 450 milliseconds.
            </p>

            <div className="report-points">
              <div className="report-point-item">
                <div className="report-point-icon">✓</div>
                <span>Instant AI-Priority Routing to 911 / Police Dispatch</span>
              </div>
              <div className="report-point-item">
                <div className="report-point-icon">✓</div>
                <span>Encrypted Anonymous Mode with Zero Identity Leakage</span>
              </div>
              <div className="report-point-item">
                <div className="report-point-icon">✓</div>
                <span>Automated GPS Geotagging & Rapid Unit Assignment</span>
              </div>
              <div className="report-point-item">
                <div className="report-point-icon">✓</div>
                <span>Live Response Tracking & Real-Time Officer ETA</span>
              </div>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="report-card-wrap">
            {submitted ? (
              <div className="success-ticket-box">
                <div className="success-icon-badge">✓</div>
                <h3>Emergency Alert Dispatched</h3>
                <p>
                  Your report for <strong>{selectedCategory}</strong> has been received by Central Command. Emergency units are currently being assigned.
                </p>

                <div className="ticket-number-pill">
                  INCIDENT TICKET: #{incidentId}
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "10px" }}>
                  <a href="#tracking" className="btn btn-primary btn-sm">
                    Track Response Live ↗
                  </a>
                  <button
                    type="button"
                    className="btn btn-dark btn-sm"
                    onClick={resetAll}
                  >
                    File Another Report
                  </button>
                </div>
              </div>
            ) : (
              <form className="report-form" onSubmit={submit}>
                {/* Category Chips */}
                <div className="form-group">
                  <label>1. Select Threat Category</label>
                  <div className="category-chips-grid">
                    {categories.map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        className={`category-chip-btn ${selectedCategory === cat ? "active" : ""}`}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location Input with Map picker */}
                <div className="form-group">
                  <label>2. Incident Location</label>
                  <div className="location-input-group">
                    <input
                      type="text"
                      className="form-input"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Enter street, landmark, use GPS, or pick on map..."
                      required
                    />

                    <button
                      type="button"
                      className="gps-btn"
                      onClick={() => setShowMap((prev) => !prev)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span>{showMap ? "Hide Map" : "Pick on Map"}</span>
                    </button>
                  </div>

                  {locationError && (
                    <p style={{ color: "#B3261E", fontSize: "13px", marginTop: "6px" }}>
                      {locationError}
                    </p>
                  )}

                  {showMap && (
                    <div
                      style={{
                        marginTop: "10px",
                        height: "320px",
                        width: "100%",
                        borderRadius: "10px",
                        overflow: "hidden",
                        border: "1px solid #D8DEE8",
                        position: "relative"
                      }}
                    >
                      <MapContainer
                        center={mapPosition || DEFAULT_MAP_CENTER}
                        zoom={mapPosition ? 16 : 13}
                        scrollWheelZoom
                        style={{ width: "100%", height: "100%" }}
                      >
                        <TileLayer
                          attribution="&copy; OpenStreetMap contributors"
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <ChangeMapView position={mapPosition} />
                        <LocationSelector
                          position={mapPosition}
                          onLocationSelect={handleMapLocationSelect}
                          onAddressLoading={setAddressLoading}
                          onLocationError={setLocationError}
                        />
                      </MapContainer>

                      {addressLoading && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 1000,
                            background: "rgba(255,255,255,0.65)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            pointerEvents: "none"
                          }}
                        >
                          <div
                            style={{
                              background: "#fff",
                              padding: "8px 14px",
                              borderRadius: "8px",
                              boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                              fontSize: "13px",
                              fontWeight: 600
                            }}
                          >
                            Finding address...
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
  {mapPosition && (
    <div className="form-group">
      <label>3. Select Police Station</label>
      {stationsLoading ? (
        <p style={{ fontSize: "13px", color: "#8A93A3" }}>Finding nearby police stations...</p>
      ) : (
        <select
          className="form-input"
          value={selectedStationId}
          onChange={(e) => setSelectedStationId(e.target.value)}
        >
          <option value="">{nearbyStations.length > 0 ? "Auto-assign nearest station (or select)" : "Auto-assign nearest station"}</option>
          {nearbyStations.map((station) => (
            <option key={station._id} value={station._id}>
              {station.stationName} — {station.distanceKm.toFixed(2)} km away
            </option>
          ))}
        </select>
      )}
      {stationsError && (
        <p style={{ color: "#B3261E", fontSize: "13px", marginTop: "6px" }}>{stationsError}</p>
      )}
    </div>
  )}
                {/* Severity Level */}
                <div className="form-group">
                  <label>3. Threat Severity Level</label>
                  <div className="severity-selector">
                    <button
                      type="button"
                      className={`severity-btn ${severity === "low" ? "selected-low" : ""}`}
                      onClick={() => setSeverity("low")}
                    >
                      Low
                    </button>
                    <button
                      type="button"
                      className={`severity-btn ${severity === "med" ? "selected-med" : ""}`}
                      onClick={() => setSeverity("med")}
                    >
                      Moderate
                    </button>
                    <button
                      type="button"
                      className={`severity-btn ${severity === "high" ? "selected-high" : ""}`}
                      onClick={() => setSeverity("high")}
                    >
                      High
                    </button>
                    <button
                      type="button"
                      className={`severity-btn ${severity === "urgent" ? "selected-urgent" : ""}`}
                      onClick={() => setSeverity("urgent")}
                    >
                      CRITICAL
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label>4. Incident Details & Description</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe weapons, suspects, clothing, vehicle plate numbers, or immediate hazards..."
                    required
                  ></textarea>
                </div>

                {/* Image Upload */}
                <div className="form-group">
                  <label>5. Attach Photos (optional)</label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: "2px dashed #D8DEE8",
                      borderRadius: "10px",
                      padding: "16px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: "#FAFBFD"
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileInputChange}
                      style={{ display: "none" }}
                    />
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "6px" }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>
                      Click to upload or drag & drop images
                    </div>
                    <div style={{ fontSize: "12px", color: "#8A93A3", marginTop: "2px" }}>
                      Up to {MAX_IMAGES} images, {MAX_IMAGE_SIZE_MB}MB each
                    </div>
                  </div>

                  {imageError && (
                    <p style={{ color: "#B3261E", fontSize: "13px", marginTop: "6px" }}>
                      {imageError}
                    </p>
                  )}

                  {images.length > 0 && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                        gap: "10px",
                        marginTop: "12px"
                      }}
                    >
                      {images.map((img) => (
                        <div
                          key={img.id}
                          style={{
                            position: "relative",
                            borderRadius: "8px",
                            overflow: "hidden",
                            border: "1px solid #D8DEE8",
                            aspectRatio: "1 / 1"
                          }}
                        >
                          <img
                            src={img.previewUrl}
                            alt={img.file.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(img.id);
                            }}
                            aria-label="Remove image"
                            style={{
                              position: "absolute",
                              top: "4px",
                              right: "4px",
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              border: "none",
                              background: "rgba(0,0,0,0.65)",
                              color: "#fff",
                              fontSize: "12px",
                              lineHeight: "20px",
                              padding: 0,
                              cursor: "pointer"
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Checkbox Options */}
                <div style={{ display: "grid", gap: "10px" }}>
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                    />
                    <span>Report anonymously (Strip all device metadata)</span>
                  </label>

                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={isInjured}
                      onChange={(e) => setIsInjured(e.target.checked)}
                    />
                    <span>Injured victims present (Requires immediate paramedic dispatch)</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn btn-primary submit-report-btn"
                  disabled={submitting}
                  style={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? "not-allowed" : "pointer" }}
                >
                  <span>{submitting ? "TRANSMITTING EMERGENCY REPORT..." : "TRANSMIT EMERGENCY REPORT"}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    );
  }