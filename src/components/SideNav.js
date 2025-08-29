import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/SideNav.css";
import logout from "../assets/logout.png";
import home from "../assets/home.png";

const SideNav = ({ onCreateSession, userType = "student" }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to check if current route is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    navigate("/logout");
  };

  const handleDashboard = () => {
    const dashboardUrl = userType === "teacher" ? "/teacher-dashboard" : "/student-dashboard";
    navigate(dashboardUrl);
  };

  const handlePerformance = () => {
    if (userType === "teacher") {
      navigate("/performance");
    } else {
      navigate("/student-performance");
    }
  };

  const handleCreateSession = () => {
    if (onCreateSession) {
      onCreateSession();
    }
  };

  const handleReports = () => {
    if (userType === "teacher") {
      navigate("/teacher-data-reports");
    } else {
      navigate("/reports");
    }
  };

  const handleAttendance = () => {
    if (userType === "teacher") {
      navigate("/teacher-reports");
    } else {
      navigate("/reports");
    }
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  return (
    <div className="sidenav">
      <div className="sidenav-content">
        <div className="nav-items">
          <button 
            onClick={handleDashboard} 
            className={`nav-item ${isActive(userType === "teacher" ? "/teacher-dashboard" : "/student-dashboard") ? "active" : ""}`}
          >
            <img src={home} alt="Dashboard" />
            <span>Dashboard</span>
          </button>
          
          <button 
            onClick={handlePerformance} 
            className={`nav-item ${isActive(userType === "teacher" ? "/performance" : "/student-performance") ? "active" : ""}`}
          >
            <span>👤</span>
            <span>Performance</span>
          </button>

          {userType === "teacher" && (
            <button 
              onClick={handleCreateSession} 
              className="nav-item create-session-item"
            >
              <span>➕</span>
              <span>Create Session</span>
            </button>
          )}

          <button 
            onClick={handleAttendance} 
            className={`nav-item ${isActive(userType === "teacher" ? "/teacher-reports" : "/reports") ? "active" : ""}`}
          >
            <span>📊</span>
            <span>Attendance</span>
          </button>

          {userType === "teacher" && (
            <button 
              onClick={handleReports} 
              className={`nav-item ${isActive("/teacher-data-reports") ? "active" : ""}`}
            >
              <span>📈</span>
              <span>Reports</span>
            </button>
          )}

          <button 
            onClick={handleSettings}
            className={`nav-item ${isActive("/settings") ? "active" : ""}`}
          >
            <span>⚙️</span>
            <span>Settings</span>
          </button>
        </div>
        
        <div className="logout-section">
          <button onClick={handleLogout} className="logout-btn">
            <img src={logout} alt="Logout" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SideNav;
