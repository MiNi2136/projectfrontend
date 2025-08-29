import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config/api";
import SideNav from "../components/SideNav";
import "../styles/Reports.css";

const Reports = () => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [sessionList, setSessionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, present, late
  const [sortBy, setSortBy] = useState("date"); // date, course, status
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Get student sessions
  function getStudentSessions() {
    setLoading(true);
    axios
      .post(`${API_BASE_URL}/sessions/getStudentSessions`, {
        token: token,
      })
      .then((response) => {
        setSessionList(response.data.sessions || []);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Error fetching student sessions:", err);
        setSessionList([]);
        setLoading(false);
      });
  }

  function getDistance(distance, radius) {
    return {
      distance,
      color: distance <= parseFloat(radius) ? "green" : "red",
      status: distance <= parseFloat(radius) ? "present" : "late",
    };
  }

  // Filter and sort sessions
  const filteredSessions = sessionList
    .filter((session) => {
      const matchesSearch = session.name.toLowerCase().includes(searchTerm.toLowerCase());
      const sessionStatus = getDistance(session.distance, session.radius).status;
      
      if (filter === "all") return matchesSearch;
      return matchesSearch && sessionStatus === filter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.date) - new Date(a.date);
        case "course":
          return a.name.localeCompare(b.name);
        case "status":
          const aStatus = getDistance(a.distance, a.radius).status;
          const bStatus = getDistance(b.distance, b.radius).status;
          return aStatus.localeCompare(bStatus);
        default:
          return 0;
      }
    });

  // Calculate statistics
  const stats = {
    total: sessionList.length,
    present: sessionList.filter(s => getDistance(s.distance, s.radius).status === "present").length,
    late: sessionList.filter(s => getDistance(s.distance, s.radius).status === "late").length,
    attendanceRate: sessionList.length > 0 ? 
      Math.round((sessionList.filter(s => getDistance(s.distance, s.radius).status === "present").length / sessionList.length) * 100) : 0
  };

  useEffect(() => {
    if (token === "" || token === undefined) {
      navigate("/login");
    } else {
      getStudentSessions();
    }
  }, [token, navigate]);

  return (
    <>
      <div className="app-container">
        <SideNav userType="student" />
        <div className="main-content-area">
        <div className="reports-container">
          <div className="reports-header">
            <h1>📊 Attendance </h1>
            
          </div>

          {/* Statistics Cards */}
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-icon">📚</div>
              <div className="stat-info">
                <h3>{stats.total}</h3>
                <p>Total Sessions</p>
              </div>
            </div>
            <div className="stat-card present">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{stats.present}</h3>
                <p>Present</p>
              </div>
            </div>
            <div className="stat-card late">
              <div className="stat-icon">⚠️</div>
              <div className="stat-info">
                <h3>{stats.late}</h3>
                <p>Late</p>
              </div>
            </div>
            <div className="stat-card rate">
              <div className="stat-icon">📈</div>
              <div className="stat-info">
                <h3>{stats.attendanceRate}%</h3>
                <p>Attendance Rate</p>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="controls-section">
            <div className="search-container">
              <input
                type="text"
                placeholder="🔍 Search by course name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="filter-controls">
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Sessions</option>
                <option value="present">Present Only</option>
                <option value="late">Late Only</option>
              </select>
              
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="date">Sort by Date</option>
                <option value="course">Sort by Course</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>
          </div>

          {/* Attendance List */}
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading attendance records...</p>
            </div>
          ) : (
            <div className="attendance-report-list">
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session, index) => {
                  const distanceInfo = getDistance(session.distance, session.radius);
                  return (
                    <div key={index} className="report-card">
                      <div className="report-header">
                        <div className="course-details">
                          <h3>{session.name}</h3>
                          <div className="session-metadata">
                            <span className="date">📅 {new Date(session.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}</span>
                            <span className="time">⏰ {session.time}</span>
                            <span className="duration">⏱️ {session.duration}</span>
                          </div>
                        </div>
                        
                        <div className="status-section">
                          <span className={`status-indicator ${distanceInfo.status}`}>
                            {distanceInfo.status === 'present' ? '✅ Present' : '⚠️ Late'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="report-details">
                        <div className="detail-grid">
                          <div className="detail-item">
                            <span className="label">📍 Distance</span>
                            <span className={`value distance-${distanceInfo.color}`}>
                              {session.distance}m / {session.radius}m limit
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="label">📸 Photo</span>
                            <img 
                              src={session.image} 
                              alt="Attendance verification" 
                              className="report-photo"
                              onClick={() => window.open(session.image, '_blank')}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-results">
                  <div className="no-results-icon">🔍</div>
                  <h3>No records found</h3>
                  <p>
                    {searchTerm ? 
                      `No attendance records match "${searchTerm}"` : 
                      `No ${filter === 'all' ? '' : filter} attendance records found`
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  );
};

export default Reports;
