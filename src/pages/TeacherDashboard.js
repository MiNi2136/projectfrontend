import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import API_BASE_URL from "../config/api";
import QRCode from "qrcode.react";
import "../styles/Dashboard.css";
import { useNavigate } from "react-router-dom";
import NewSession from "./NewSession";
import SessionDetails from "./SessionDetails";
import SideNav from "../components/SideNav";

axios.defaults.withCredentials = true;

const TeacherDashboard = () => {
  //eslint-disable-next-line
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [sessionList, setSessionList] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSessionDisplay, setSessionDisplay] = useState(false);
  const [currentSession, setCurrentSession] = useState("");
  const [loading, setLoading] = useState(true);
  const [latestQR, setLatestQR] = useState("");
  const [latestSessionDetails, setLatestSessionDetails] = useState(null);
  const navigate = useNavigate();

  //update list of sessions
  const updateList = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/sessions/getSessions`,
        {
          token: token,
        }
      );
      setSessionList(response.data.sessions || []);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      if (err.response && err.response.status === 401) {
        // Token expired or invalid, redirect to login
        localStorage.clear();
        navigate("/login");
        return;
      }
      setSessionList([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const toggleSessionDetails = (e) => {
    //get the session details that has session_id = e
    setCurrentSession(
      sessionList.filter((session) => {
        return session.session_id === e;
      })
    );
    setSessionDisplay(!isSessionDisplay);
  };

  const handleSessionCreated = (qrData, sessionDetails) => {
    // Refresh the session list and store QR data
    updateList();
    setLatestQR(qrData);
    setLatestSessionDetails(sessionDetails);
  };

  const togglePopup = () => {
    setIsOpen(!isOpen);
  };

  const copyLatestQR = () => {
    if (latestQR) {
      navigator.clipboard.writeText(latestQR);
      alert("QR code URL copied to clipboard!");
    }
  };

  useEffect(() => {
    if (token === "" || token === undefined) {
      navigate("/login");
    } else {
      // Check if user is actually a teacher
      const userType = localStorage.getItem("type");
      if (userType !== "teacher") {
        // If user is not a teacher, redirect to appropriate dashboard
        navigate("/student-dashboard");
        return;
      }
      updateList();
    }
  }, [token, navigate, updateList]);

  return (
    <>
      <div className="app-container">
        <SideNav onCreateSession={togglePopup} userType="teacher" />
        <div className="main-content-area">
          <div className="dashboard-main">
          
          {/* Dashboard Overview */}
          <div className="teacher-overview">
            <div className="overview-header">
              <h1>👨‍🏫 Teacher Dashboard</h1>
             
            </div>
            
            {/* Statistics Cards */}
            <div className="teacher-stats">
              <div className="stat-card total-sessions">
                <div className="stat-icon">📚</div>
                <div className="stat-info">
                  <h3>{sessionList.length}</h3>
                  <p>Total Sessions</p>
                </div>
              </div>
              <div className="stat-card total-attendance">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>{sessionList.reduce((total, session) => total + (session.attendance?.length || 0), 0)}</h3>
                  <p>Total Attendance</p>
                </div>
              </div>
              <div className="stat-card recent-sessions">
                <div className="stat-icon">🕒</div>
                <div className="stat-info">
                  <h3>{sessionList.filter(session => {
                    const sessionDate = new Date(session.date);
                    const today = new Date();
                    const diffTime = Math.abs(today - sessionDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 7;
                  }).length}</h3>
                  <p>This Week</p>
                </div>
              </div>
            </div>
          </div>

          {/* Latest Session QR Display */}
          {latestQR && latestSessionDetails && (
            <div className="latest-session-qr">
              <div className="section-header">
                <h2>🎉 Latest Session Created</h2>
                <button onClick={() => {setLatestQR(""); setLatestSessionDetails(null);}} className="close-qr-btn">
                  ✕ Dismiss
                </button>
              </div>
              
              <div className="qr-display-dashboard">
                <div className="session-summary-dashboard">
                  <h3>📚 {latestSessionDetails.name}</h3>
                  <p>📅 {latestSessionDetails.date} ⏰ {latestSessionDetails.time}</p>
                  <p>⏱️ {latestSessionDetails.duration} 📍 {latestSessionDetails.radius}m radius</p>
                </div>
                
                <div className="qr-container-dashboard">
                  <QRCode value={latestQR} size={200} level="H" />
                  <p>Students can scan this QR code to mark attendance</p>
                  <button onClick={copyLatestQR} className="copy-qr-dashboard-btn">
                    📋 Copy QR Link
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Recent Sessions with Attendance */}
          <div className="sessions-section">
            <div className="section-header">
              <h2>📊 Recent Sessions & Attendance</h2>
              <span className="session-count">{sessionList.length} sessions created</span>
            </div>
            
            {loading ? (
              <div className="loading-state">
                <div className="loading-icon">⏳</div>
                <p>Loading sessions...</p>
              </div>
            ) : sessionList.length > 0 ? (
              <div className="teacher-sessions-list">
                {sessionList.slice(0, 5).map((session, index) => (
                  <div key={index} className="teacher-session-card">
                    <div className="session-card-header">
                      <div className="session-info">
                        <h3 className="session-name">{session.name}</h3>
                        <div className="session-meta">
                          <span className="date">📅 {new Date(session.date).toLocaleDateString()}</span>
                          <span className="time">⏰ {session.time}</span>
                          <span className="duration">⏱️ {session.duration}</span>
                          <span className="location">📍 Radius: {session.radius}m</span>
                        </div>
                      </div>
                      <div className="attendance-summary">
                        <div className="attendance-count-badge">
                          <span className="count">{session.attendance?.length || 0}</span>
                          <span className="label">Students</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="session-card-body">
                      {session.attendance && session.attendance.length > 0 ? (
                        <div className="student-attendance-list">
                          <h4>👥 Student Attendance:</h4>
                          <div className="student-list">
                            {session.attendance.slice(0, 3).map((student, idx) => (
                              <div key={idx} className="student-item">
                                <div className="student-info">
                                  <span className="student-email">{student.student_email}</span>
                                  <span className="student-distance">
                                    📍 {student.distance}m
                                    <span className={`distance-status ${
                                      parseFloat(student.distance) <= parseFloat(session.radius) ? 'on-time' : 'late'
                                    }`}>
                                      {parseFloat(student.distance) <= parseFloat(session.radius) ? '✅' : '⚠️'}
                                    </span>
                                  </span>
                                </div>
                                <img 
                                  src={student.image} 
                                  alt="Student verification" 
                                  className="student-photo"
                                  onClick={() => window.open(student.image, '_blank')}
                                />
                              </div>
                            ))}
                            {session.attendance.length > 3 && (
                              <div className="more-students">
                                +{session.attendance.length - 3} more students
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="no-attendance">
                          <span className="no-attendance-icon">👤</span>
                          <span>No students attended yet</span>
                        </div>
                      )}
                      
                      <div className="session-actions">
                        <button 
                          className="view-details-btn"
                          onClick={() => toggleSessionDetails(session.session_id)}
                        >
                          📋 View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {sessionList.length > 5 && (
                  <div className="view-all-container">
                    <button className="view-all-sessions-btn">
                      View All {sessionList.length} Sessions →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-sessions">
                <div className="no-sessions-icon">📋</div>
                <h3>No sessions created yet</h3>
                <p>Click "Create Session" in the sidebar to get started</p>
              </div>
            )}
          </div>
        </div>
          </div>
        </div>
      
      {isSessionDisplay && (
        <div className="popup-overlay">
          <SessionDetails
            currentSession={currentSession}
            toggleSessionDetails={toggleSessionDetails}
          />
        </div>
      )}
      {isOpen && (
        <div className="popup-overlay">
          <NewSession togglePopup={togglePopup} onSessionCreated={handleSessionCreated} />
        </div>
      )}
    </>
  );
};

export default TeacherDashboard;
