// import { useState } from "react";
// import React from 'react';

// const initialSteps = [
//   { id: 1, title: "Emergency Report Submitted", time: "10:32:10 AM", status: "completed" },
//   { id: 2, title: "AI Verified & Dispatch Operator Acknowledged", time: "10:32:45 AM", status: "completed" },
//   { id: 3, title: "Tactical Officer Raj (Unit 14) Assigned", time: "10:33:15 AM", status: "completed" },
//   { id: 4, title: "Officer En Route (Cruiser GPS Active)", time: "10:34:20 AM", status: "current", eta: "ETA 1.8 mins" },
//   { id: 5, title: "On-Scene Intervention & Safe Extraction", time: "Pending", status: "pending" },
//   { id: 6, title: "Threat Resolved & Citizen Report Closed", time: "Pending", status: "pending" }
// ];

// export default function ResponseTracking() {
//   const [steps, setSteps] = useState(initialSteps);
//   const [backupRequested, setBackupRequested] = useState(false);

//   const requestBackup = () => {
//     setBackupRequested(true);
//   };

//   return (
//     <section className="section tracking" id="tracking">
//       <div className="container tracking-grid">
//         {/* Left Incident Overview */}
//         <div>
//           <div className="eyebrow">LIVE TELEMETRY TRACKER</div>
//           <h2>Real-Time Emergency Dispatch Response</h2>
//           <p>
//             Monitor every second of the emergency lifecycle—from citizen reporting and AI classification to vehicle GPS navigation and safe on-scene resolution.
//           </p>

//           <div className="incident-summary">
//             <div className="incident-summary-card">
//               <b>Incident Number</b>
//               <span>#RX-8842</span>
//             </div>
//             <div className="incident-summary-card">
//               <b>Threat Category</b>
//               <span>Weapon Threat</span>
//             </div>
//             <div className="incident-summary-card">
//               <b>Priority Level</b>
//               <span><em>CRITICAL</em></span>
//             </div>
//             <div className="incident-summary-card">
//               <b>Assigned Patrol</b>
//               <span>Unit 14 (Officer Raj)</span>
//             </div>
//           </div>
//         </div>

//         {/* Right Timeline */}
//         <div>
//           <div className="timeline">
//             {steps.map((step) => (
//               <div
//                 className={`timeline-item ${step.status}`}
//                 key={step.id}
//               >
//                 <div className="timeline-dot">
//                   {step.status === "completed" ? "✓" : step.status === "current" ? "●" : "○"}
//                 </div>
//                 <div>
//                   <strong>{step.title}</strong>
//                   <span>{step.time}</span>
//                 </div>
//                 {step.eta && (
//                   <span className="timeline-eta-pill">{step.eta}</span>
//                 )}
//               </div>
//             ))}
//           </div>

//           <div className="tracking-actions">
//             <button
//               className="btn btn-primary btn-sm"
//               onClick={requestBackup}
//             >
//               {backupRequested ? "✓ BACKUP UNIT DISPATCHED" : "REQUEST EXTRA BACKUP"}
//             </button>
//             <a href="#map" className="btn btn-dark btn-sm">
//               VIEW LIVE MAP RADAR ↗
//             </a>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../apiConfig";

export default function ResponseTracking() {

  const { id } = useParams();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [backupRequested, setBackupRequested] = useState(false);

  // ==========================================
  // FETCH REPORT
  // ==========================================

  const fetchReport = async () => {

    try {

      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("userToken");

      const response = await axios.get(
        `${API_URL}/ViolenceReport/GetById/${id}`,
        {
          headers: {
            "auth-token": token
          }
        }
      );

      setReport(response.data?.report);

    } catch (error) {

      console.error(
        "Error fetching report:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to load response tracking details."
      );

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    if (id) {
      fetchReport();
    }

  }, [id]);


  // ==========================================
  // REQUEST BACKUP
  // ==========================================

  const requestBackup = () => {

    setBackupRequested(true);

  };


  // ==========================================
  // REFRESH STATUS
  // ==========================================

  useEffect(() => {

    if (!id) return;

    const interval = setInterval(() => {
      fetchReport();
    }, 10000);

    return () => clearInterval(interval);

  }, [id]);


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (
      <section className="section tracking">

        <div className="container">

          <div className="eyebrow">
            RESPONSE TRACKING
          </div>

          <h2>
            Loading Emergency Response...
          </h2>

          <p>
            Please wait while we retrieve the
            latest response information.
          </p>

        </div>

      </section>
    );

  }


  // ==========================================
  // ERROR
  // ==========================================

  if (error) {

    return (
      <section className="section tracking">

        <div className="container">

          <div className="eyebrow">
            RESPONSE TRACKING
          </div>

          <h2>
            Unable to Load Request
          </h2>

          <p>
            {error}
          </p>

          <button
            className="btn btn-primary btn-sm"
            onClick={fetchReport}
          >
            TRY AGAIN
          </button>

        </div>

      </section>
    );

  }


  if (!report) {
    return null;
  }


  // ==========================================
  // REPORT DATA
  // ==========================================

  const station =
    typeof report.policeStationId === "object"
      ? report.policeStationId
      : null;


  const status =
    report.status || "Pending";


  // ==========================================
  // STATUS HELPERS
  // ==========================================

  const isPending =
    status === "Pending";

  const isUnderReview =
    status === "Under Review";

  const isDispatched =
    status === "Dispatched";

  const isResolved =
    status === "Resolved";

  const isRejected =
    status === "Rejected";


  // ==========================================
  // BUILD TIMELINE
  // ==========================================

  const steps = [

    {
      id: 1,

      title:
        "Violence Report Submitted",

      time:
        formatDate(report.createdAt),

      status:
        "completed"
    },

    {
      id: 2,

      title:
        "Request Received by Police System",

      time:
        isPending
          ? "Processing"
          : "Completed",

      status:
        isPending
          ? "current"
          : "completed"
    },

    {
      id: 3,

      title:
        station
          ? `Nearest Police Station Assigned - ${station.stationName}`
          : "Police Station Assignment Pending",

      time:
        station
          ? "Station Assigned"
          : "Pending",

      status:
        station
          ? "completed"
          : "pending"
    },

    {
      id: 4,

      title:
        isDispatched || isResolved
          ? "Police Officer Dispatched"
          : "Police Response Pending",

      time:
        isDispatched || isResolved
          ? "Dispatched"
          : "Pending",

      status:
        isDispatched || isResolved
          ? "completed"
          : isUnderReview
          ? "current"
          : "pending"
    },

    {
      id: 5,

      title:
        isResolved
          ? "Police Response Completed"
          : "Officer Response / On-Scene Action",

      time:
        isResolved
          ? "Completed"
          : "Pending",

      status:
        isResolved
          ? "completed"
          : isDispatched
          ? "current"
          : "pending"
    },

    {
      id: 6,

      title:
        isRejected
          ? "Citizen Report Rejected"
          : "Threat Resolved & Citizen Report Closed",

      time:
        isResolved || isRejected
          ? "Completed"
          : "Pending",

      status:
        isResolved || isRejected
          ? "completed"
          : "pending"
    }

  ];


  return (

    <section
      className="section tracking"
      id="tracking"
    >

      <div className="container tracking-grid">


        {/* =====================================
            LEFT SIDE
        ===================================== */}

        <div>

          <div className="eyebrow">
            LIVE RESPONSE TRACKER
          </div>

          <h2>
            Real-Time Violence Report Response
          </h2>

          <p>
            Track your submitted violence report,
            assigned police station, request status
            and emergency response progress.
          </p>


          {/* =================================
              INCIDENT SUMMARY
          ================================= */}

          <div className="incident-summary">


            {/* INCIDENT NUMBER */}

            <div className="incident-summary-card">

              <b>
                Incident Number
              </b>

              <span>
                #{report.incidentNumber}
              </span>

            </div>


            {/* CATEGORY */}

            <div className="incident-summary-card">

              <b>
                Threat Category
              </b>

              <span>
                {report.category}
              </span>

            </div>


            {/* SEVERITY */}

            <div className="incident-summary-card">

              <b>
                Priority Level
              </b>

              <span>

                <em>
                  {report.severity?.toUpperCase()}
                </em>

              </span>

            </div>


            {/* REQUEST STATUS */}

            <div className="incident-summary-card">

              <b>
                Request Status
              </b>

              <span>
                {status}
              </span>

            </div>


            {/* LOCATION */}

            <div className="incident-summary-card">

              <b>
                Incident Location
              </b>

              <span>
                {report.location}
              </span>

            </div>


            {/* POLICE STATION */}

            <div className="incident-summary-card">

              <b>
                Assigned Police Station
              </b>

              <span>
                {station
                  ? station.stationName
                  : "Not Assigned"}
              </span>

            </div>


            {/* DISTANCE */}

            <div className="incident-summary-card">

              <b>
                Distance From Station
              </b>

              <span>

                {report.distanceFromStation != null
                  ? `${report.distanceFromStation} KM`
                  : "N/A"}

              </span>

            </div>


            {/* INJURED */}

            <div className="incident-summary-card">

              <b>
                Injury Reported
              </b>

              <span>
                {report.isInjured
                  ? "YES"
                  : "NO"}
              </span>

            </div>


          </div>


          {/* =================================
              POLICE STATION DETAILS
          ================================= */}

          {station && (

            <div
              className="incident-summary"
              style={{
                marginTop: "20px"
              }}
            >

              <div
                style={{
                  gridColumn:
                    "1 / -1"
                }}
              >

                <div className="eyebrow">
                  ASSIGNED POLICE STATION
                </div>

                <h3>
                  {station.stationName}
                </h3>

                <p>
                  {station.address}
                </p>


                {/* STATION LOCATION */}

                {station.latitude != null &&
                  station.longitude != null && (

                    <a
                      href={`https://www.google.com/maps?q=${station.latitude},${station.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-dark btn-sm"
                    >
                      VIEW POLICE STATION LOCATION ↗
                    </a>

                  )}

              </div>

            </div>

          )}


          {/* =================================
              REPORT DESCRIPTION
          ================================= */}

          <div
            className="incident-summary"
            style={{
              marginTop: "20px"
            }}
          >

            <div
              style={{
                gridColumn:
                  "1 / -1"
              }}
            >

              <div className="eyebrow">
                REPORT DETAILS
              </div>

              <p>
                {report.description}
              </p>

              <div>

                <strong>
                  Submitted:
                </strong>{" "}

                {formatDate(
                  report.createdAt
                )}

              </div>

            </div>

          </div>

        </div>


        {/* =====================================
            RIGHT SIDE TIMELINE
        ===================================== */}

        <div>

          <div className="timeline">

            {steps.map((step) => (

              <div
                className={`timeline-item ${step.status}`}
                key={step.id}
              >

                <div className="timeline-dot">

                  {step.status ===
                  "completed"
                    ? "✓"
                    : step.status ===
                      "current"
                    ? "●"
                    : "○"}

                </div>


                <div>

                  <strong>
                    {step.title}
                  </strong>

                  <span>
                    {step.time}
                  </span>

                </div>

              </div>

            ))}

          </div>


          {/* =================================
              CURRENT STATUS
          ================================= */}

          <div
            className="incident-summary"
            style={{
              marginTop: "25px"
            }}
          >

            <div
              style={{
                gridColumn:
                  "1 / -1"
              }}
            >

              <div className="eyebrow">
                CURRENT REQUEST STATUS
              </div>

              <h3>
                {status}
              </h3>

              {isPending && (

                <p>
                  Your violence report has been
                  submitted successfully and is
                  waiting for police review.
                </p>

              )}

              {isUnderReview && (

                <p>
                  Your report is currently being
                  reviewed by the assigned police
                  station.
                </p>

              )}

              {isDispatched && (

                <p>
                  Police response has been
                  dispatched to the incident
                  location.
                </p>

              )}

              {isResolved && (

                <p>
                  The police response has been
                  completed and the report has been
                  resolved.
                </p>

              )}

              {isRejected && (

                <p>
                  This report has been rejected by
                  the police department.
                </p>

              )}

            </div>

          </div>


          {/* =================================
              ACTIONS
          ================================= */}

          <div className="tracking-actions">

            {/* {!isResolved &&
              !isRejected && (

                <button
                  className="btn btn-primary btn-sm"
                  onClick={
                    requestBackup
                  }
                >

                  {backupRequested
                    ? "✓ BACKUP REQUEST SENT"
                    : "REQUEST EXTRA BACKUP"}

                </button>

              )} */}


            {report.latitude != null &&
              report.longitude != null && (

                <a
                  href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-dark btn-sm"
                >
                  VIEW INCIDENT LOCATION ↗
                </a>

              )}

          </div>

        </div>

      </div>

    </section>

  );
}


function formatDate(dateValue) {

  if (!dateValue) {
    return "N/A";
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "N/A";
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  );

}

