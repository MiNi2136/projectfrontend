import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../config/api";
import "../styles/StudentDashboard.css";
import { useNavigate } from "react-router-dom";
import StudentForm from "./StudentForm";
import QRScanner from "../components/QRScanner";
import SideNav from "../components/SideNav";
const queryParameters = new URLSearchParams(window.location.search);

const Dashboard = () => {
  //eslint-disable-next-line
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  // eslint-disable-next-line
  const [sessionList, setSessionList] = useState([]);
  const [isSessionDisplay, setSessionDisplay] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [currentSessions, setCurrentSessions] = useState([]);
  const [showMobileNav, setShowMobileNav] = useState(false);
  // New states for manual QR input
  const [showManualInput, setShowManualInput] = useState(false); // to show manual input
  const [manualURL, setManualURL] = useState(""); // store the input URL
  const navigate = useNavigate();

  function handleCurrentSessionScan(sessionData) {
    // Set session data and open scanner for current running session
    localStorage.setItem("session_id", sessionData.session_id);
    localStorage.setItem("teacher_email", sessionData.teacher_email);
    setShowQRScanner(true);
  }

  function getStudentSessions() {
    axios
      .post(`${API_BASE_URL}/sessions/getStudentSessions`, {
        token: token,
      })
      .then((response) => {
        setSessionList(response.data.sessions);
      })
      .catch((error) => {
        console.log(error);
        if (error.response && error.response.status === 401) {
          // Token expired or invalid, redirect to login
          localStorage.removeItem('token');
          navigate('/login');
        }
      });
  }

  function getCurrentSessions() {
    axios
      .post(`${API_BASE_URL}/sessions/getCurrentSessions`, {
        token: token,
      })
      .then((response) => {
        setCurrentSessions(response.data.sessions || []);
      })
      .catch((error) => {
        console.log("Error fetching current sessions:", error);
        if (error.response && error.response.status === 401) {
          // Token expired or invalid, redirect to login
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          // If API doesn't exist or other error, show empty current sessions
          setCurrentSessions([]);
        }
      });
  }

  function toggleStudentForm(action) {
    if (action === "open") {
      setSessionDisplay(true);
    } else {
      localStorage.removeItem("session_id");
      localStorage.removeItem("teacher_email");
      setSessionDisplay(false);
      navigate("/student-dashboard");
    }
  }

  function getDistance(distance, radius) {
    return {
      distance,
      color: distance <= parseFloat(radius) ? "green" : "red",
    };
  }

  // Updated handleQRScan to show manual input on failure
  const handleQRScan = (scannedData) => {
    let sessionId = null;
    let teacherEmail = null;
    try {
      // Try to parse as URL
      const url = new URL(scannedData);
      sessionId = url.searchParams.get("session_id");
      teacherEmail = url.searchParams.get("email");
    } catch (e) {
      // If not a valid URL, try to parse as query string
      if (scannedData.includes("session_id") && scannedData.includes("email")) {
        const params = new URLSearchParams(scannedData.split('?')[1] || scannedData);
        sessionId = params.get("session_id");
        teacherEmail = params.get("email");
      }
    }
    if (sessionId && teacherEmail) {
      localStorage.setItem("session_id", sessionId);
      localStorage.setItem("teacher_email", teacherEmail);
      setShowQRScanner(false);       // close the QR scanner
      setShowManualInput(false);     // hide manual input if open
      toggleStudentForm("open");    // open the student form
    } else {
      // If QR scan fails, show error and do not proceed
      setShowQRScanner(false);
      setShowManualInput(false);
      window.alert("Invalid QR code. Please try again or enter the URL manually.");
    }
  };

  useEffect(() => {
    if (token === "" || token === undefined) {
      navigate("/login");
    } else {
      // Check if user is actually a student
      const userType = localStorage.getItem("type");
      if (userType === "teacher") {
        // If user is a teacher, redirect to teacher dashboard
        navigate("/teacher-dashboard");
        return;
      }
      getStudentSessions();
      getCurrentSessions();
      try {
        if (
          queryParameters.get("session_id") !== null &&
          queryParameters.get("email") !== null
        ) {
          localStorage.setItem("session_id", queryParameters.get("session_id"));
          localStorage.setItem("teacher_email", queryParameters.get("email"));
        }
        if (
          localStorage.getItem("session_id") == null &&
          localStorage.getItem("teacher_email") == null
        ) {
          toggleStudentForm("close");
        } else {
          toggleStudentForm("open");
        }
      } catch (err) {
        console.log(err);
      }
    }
  }, [token]);

  return (
    <>
      {/* Mobile Navigation Header */}
      <div className="mobile-header">
        <div className="mobile-header-content">
          <h1>👨‍🎓 Student Dashboard</h1>
          <button 
            className="mobile-nav-toggle"
            onClick={() => setShowMobileNav(!showMobileNav)}
          >
            {showMobileNav ? '✕' : '☰'}
          </button>
        </div>
        
        {/* Mobile Navigation Dropdown */}
        {showMobileNav && (
          <div className="mobile-nav-dropdown">
            <button onClick={() => { navigate("/student-dashboard"); setShowMobileNav(false); }}>
              🏠 Dashboard
            </button>
            <button onClick={() => { navigate("/reports"); setShowMobileNav(false); }}>
              📊 My Reports  
            </button>
            <button onClick={() => { setShowQRScanner(true); setShowMobileNav(false); }}>
              📱 Scan QR Code
            </button>
            <button onClick={() => { navigate("/logout"); setShowMobileNav(false); }}>
              🚪 Logout
            </button>
          </div>
        )}
      </div>

      <div className="app-container">
        {/* Desktop Side Navigation - Hidden on mobile */}
        <div className="desktop-nav">
          <SideNav userType="student" />
        </div>
        
        <div className="main-content-area">
          <div className="dashboard-main">
          {!isSessionDisplay && (
            <>
              {/* Current Running Sessions */}
            {currentSessions.length > 0 && (
            <div className="current-sessions">
              <h2>📍 Currently Active Sessions</h2>
              <div className="current-sessions-grid">
                {currentSessions.map((session, index) => (
                  <div key={`current-${index}`} className={`current-session-card ${session.status || 'active'}`}>
                    <div className="session-status-badge">
                      {session.status === 'starting_soon' ? '🕒 Starting Soon' : '🟢 Active Now'}
                    </div>
                    <div className="session-info">
                      <h3>{session.name}</h3>
                      <p>📅 {session.date?.split("T")[0]}</p>
                      <p>🕒 {session.time}</p>
                      <p>⏱️ Duration: {session.duration || '60 min'}</p>
                      <p>📍 {session.location}</p>
                      <p className="teacher-name">👨‍🏫 {session.teacher_name}</p>
                    </div>
                    <div className="qr-section">
                      {session.qr_code && (
                        <img 
                          src={session.qr_code} 
                          alt="QR Code" 
                          className="session-qr"
                        />
                      )}
                      <button 
                        className="scan-btn"
                        onClick={() => handleCurrentSessionScan(session)}
                      >
                        📱 Mark Attendance
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scan QR Button if no current sessions */}
          {currentSessions.length === 0 && (
            <div className="scan-section">
              <h2>📱 Mark Attendance</h2>
              <button 
                className="scan-qr-main-btn"
                onClick={() => setShowQRScanner(true)}
              >
                🔍 Scan QR Code for Attendance
              </button>
              <p className="scan-instruction">Ask your teacher to show the QR code for the current session</p>
            </div>
          )}

          {/* Recent Attendance List */}
          <div className="attendance-section">
            <div className="section-header">
              <h2>📚 Recent Attendance</h2>
              <span className="attendance-count">{sessionList.length} sessions attended</span>
            </div>
            
            {sessionList.length > 0 ? (
              <div className="attendance-list">
                {sessionList.slice(0, 5).map((session, index) => (
                  <div key={index} className="attendance-card">
                    <div className="card-header">
                      <div className="course-info">
                        <h3 className="course-name">{session.name}</h3>
                        <div className="session-meta">
                          <span className="date">📅 {new Date(session.date).toLocaleDateString()}</span>
                          <span className="time">⏰ {session.time}</span>
                          <span className="duration">⏱️ {session.duration}</span>
                        </div>
                      </div>
                      <div className="attendance-status">
                        <span className={`status-badge ${
                          getDistance(session.distance, session.radius).color === 'green' 
                            ? 'present' 
                            : 'late'
                        }`}>
                          {getDistance(session.distance, session.radius).color === 'green' 
                            ? '✅ Present' 
                            : '⚠️ Late'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="card-details">
                      <div className="detail-item">
                        <span className="label">Distance:</span>
                        <span className={`value distance-value ${
                          getDistance(session.distance, session.radius).color
                        }`}>
                          {session.distance}m (Limit: {session.radius}m)
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Photo:</span>
                        <img 
                          src={session.image} 
                          alt="Attendance proof" 
                          className="attendance-photo"
                          onClick={() => window.open(session.image, '_blank')}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {sessionList.length > 5 && (
                  <div className="view-all-container">
                    <button className="view-all-btn">
                      View All {sessionList.length} Sessions →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-attendance">
                <div className="no-attendance-icon">📋</div>
                <h3>No attendance records yet</h3>
                <p>Your attendance history will appear here once you start marking attendance</p>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* QR Scanner */}
      <QRScanner 
        isOpen={showQRScanner}
        onScan={handleQRScan}
        onClose={() => setShowQRScanner(false)}
      />

      {/* Manual URL Input for QR fallback */}
      {showManualInput && (
        <div className="manual-url-input" style={{ margin: '20px 0', textAlign: 'center' }}>
          <h3>Enter QR Code URL Manually</h3>
          <input
            type="text"
            placeholder="Paste QR code URL here"
            value={manualURL}
            onChange={(e) => setManualURL(e.target.value)}
            style={{ width: '80%', padding: '8px', marginRight: '8px' }}
          />
          <button
            onClick={() => {
              if (manualURL.trim() !== "") {
                handleQRScan(manualURL.trim()); // use same QR scan logic
              }
            }}
          >
            Submit
          </button>
          <button
            onClick={() => {
              setShowManualInput(false);
              setManualURL("");
            }}
            style={{ marginLeft: '8px' }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Student Form */}
      {isSessionDisplay && (
        <div className="popup-overlay">
          <StudentForm togglePopup={toggleStudentForm} />
        </div>
      )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
