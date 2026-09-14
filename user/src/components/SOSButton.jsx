import React, { useState } from "react";
import { API_URL } from "../apiConfig.js";

const SOSButton = () => {
  const [loading, setLoading] = useState(false);
  const [sosResult, setSosResult] = useState(null);

  const handleSOS = () => {
    const token = localStorage.getItem("userToken");
    if (!token) {
      alert("You must be logged in to send an SOS alert.");
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(`${API_URL}/sos/trigger`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "auth-token": token,
            },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          });
          const json = await response.json();
          if (json.success) {
            setSosResult({
              message: json.message,
              nearestStation: json.nearestStation || null,
            });
          } else {
            alert(json.message || "Failed to trigger SOS");
          }
        } catch (error) {
          console.error("SOS Error:", error);
          alert("Error sending SOS");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        alert("Unable to retrieve your location");
        console.error(error);
      }
    );
  };

  const closeModal = () => setSosResult(null);

  return (
    <>
      <button
        onClick={handleSOS}
        disabled={loading}
        aria-label="Send SOS Alert"
        style={{
          position: "fixed",
          bottom: "24px",
          left: "24px",
          zIndex: 9999,
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: loading ? "#ccc" : "linear-gradient(135deg, #ef4444, #dc2626)",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(220, 38, 38, 0.5)",
          color: "white",
          fontWeight: "bold",
          fontSize: "18px",
          animation: loading ? "none" : "pulse 2s infinite",
        }}
      >
        {loading ? "..." : "SOS"}
      </button>

      {sosResult && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "12px",
              maxWidth: "420px",
              width: "90%",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 12px" }}>{sosResult.message}</h3>
            {sosResult.nearestStation ? (
              <div>
                <p><strong>Police Station:</strong> {sosResult.nearestStation.stationName}</p>
                <p><strong>Address:</strong> {sosResult.nearestStation.address}</p>
                <p><strong>Phone:</strong> {sosResult.nearestStation.phone}</p>
                {sosResult.nearestStation.distance && (
                  <p><strong>Distance:</strong> {sosResult.nearestStation.distance}</p>
                )}
              </div>
            ) : (
              <p>No police station was found nearby.</p>
            )}
            <button
              onClick={closeModal}
              style={{
                marginTop: "16px",
                padding: "8px 16px",
                background: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SOSButton;
