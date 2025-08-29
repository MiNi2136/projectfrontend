import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config/api";
import SideNav from "../components/SideNav";
import "../styles/TeacherReports.css";

const TeacherReports = () => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [sessionList, setSessionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState("summary"); // summary, detailed, datasheet
  const [editingCT, setEditingCT] = useState(null); // For inline CT marks editing
  const [ctMarksInput, setCTMarksInput] = useState("");
  const navigate = useNavigate();

  // Update CT marks for a student
  const updateCTMarks = (sessionId, studentEmail, examType, marks) => {
    const ctMarksData = { [examType]: marks };
    
    axios
      .post(`${API_BASE_URL}/sessions/updateCTMarks`, {
        token: token,
        session_id: sessionId,
        student_email: studentEmail,
        ct_marks: ctMarksData
      })
      .then(() => {
        // Refresh data after update
        getTeacherAttendanceReports();
        setEditingCT(null);
        setCTMarksInput("");
      })
      .catch((err) => {
        console.log("Error updating CT marks:", err);
        alert("Failed to update CT marks");
      });
  };

  // Get detailed teacher attendance reports
  function getTeacherAttendanceReports() {
    setLoading(true);
    axios
      .post(`${API_BASE_URL}/sessions/getAttendanceReports`, {
        token: token,
      })
      .then((response) => {
        setSessionList(response.data.sessions || []);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Error fetching attendance reports:", err);
        setSessionList([]);
        setLoading(false);
      });
  }

  // Get unique courses for filtering
  const getUniqueCourses = () => {
    const courses = sessionList.map(session => session.name);
    return [...new Set(courses)];
  };

  // Calculate overall statistics
  const calculateStats = () => {
    const filteredData = getFilteredSessions();
    const totalSessions = filteredData.length;
    const totalStudents = filteredData.reduce((sum, session) => sum + (session.total_students || 0), 0);
    const totalPresent = filteredData.reduce((sum, session) => sum + (session.present_count || 0), 0);
    const totalLate = filteredData.reduce((sum, session) => sum + (session.late_count || 0), 0);
    const attendanceRate = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;

    return { totalSessions, totalStudents, totalPresent, totalLate, attendanceRate };
  };

  // Filter sessions based on search, course, and status
  const getFilteredSessions = () => {
    return sessionList.filter(session => {
      const matchesSearch = session.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCourse = selectedCourse === "all" || session.name === selectedCourse;
      
      if (filterStatus === "all") return matchesSearch && matchesCourse;
      
      const hasAttendance = session.attendance && session.attendance.length > 0;
      if (filterStatus === "with-attendance") return matchesSearch && matchesCourse && hasAttendance;
      if (filterStatus === "no-attendance") return matchesSearch && matchesCourse && !hasAttendance;
      
      return matchesSearch && matchesCourse;
    });
  };

  // Export data as CSV (which can be opened in Excel or converted to PDF)
  const exportToCSV = () => {
    const filteredSessions = getFilteredSessions();
    const csvData = [];
    
    // Add header
    csvData.push([
      'Course Name', 'Session Date', 'Session Time', 'Student Name', 
      'Registration No', 'Email', 'Attendance Status', 'Distance (m)', 
      'Attendance Time', 'CT Marks'
    ]);

    // Add data rows
    filteredSessions.forEach(session => {
      if (session.attendance && session.attendance.length > 0) {
        session.attendance.forEach(student => {
          csvData.push([
            session.name,
            new Date(session.date).toLocaleDateString(),
            session.time,
            student.student_name,
            student.student_regno,
            student.student_email,
            student.status,
            student.distance,
            student.attendance_time,
            JSON.stringify(student.ct_marks)
          ]);
        });
      }
    });

    // Convert to CSV string
    const csvContent = csvData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `attendance-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = calculateStats();
  const filteredSessions = getFilteredSessions();
  const uniqueCourses = getUniqueCourses();

  useEffect(() => {
    if (token === "" || token === undefined) {
      navigate("/login");
    } else {
      getTeacherAttendanceReports();
    }
  }, [token, navigate]);

  return (
    <>
      <div className="app-container">
        <SideNav onCreateSession={() => {}} userType="teacher" />
        <div className="main-content-area">
          <div className="teacher-reports-container">
            <div className="reports-header">
              <h1>� Attendance Reports & Analytics</h1>
              <div className="view-mode-toggle">
                <button 
                  className={viewMode === "summary" ? "active" : ""}
                  onClick={() => setViewMode("summary")}
                >
                  📈 Summary
                </button>
                <button 
                  className={viewMode === "datasheet" ? "active" : ""}
                  onClick={() => setViewMode("datasheet")}
                >
                  📋 Data Sheet
                </button>
              </div>
            </div>

            {/* Overall Statistics */}
            <div className="teacher-stats-grid">
              <div className="teacher-stat-card sessions">
                <div className="stat-icon">📚</div>
                <div className="stat-info">
                  <h3>{stats.totalSessions}</h3>
                  <p>Total Sessions</p>
                </div>
              </div>
              <div className="teacher-stat-card students">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>{stats.totalStudents}</h3>
                  <p>Total Attendance</p>
                </div>
              </div>
              <div className="teacher-stat-card present">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>{stats.totalPresent}</h3>
                  <p>Present</p>
                </div>
              </div>
              <div className="teacher-stat-card late">
                <div className="stat-icon">⚠️</div>
                <div className="stat-info">
                  <h3>{stats.totalLate}</h3>
                  <p>Late</p>
                </div>
              </div>
              <div className="teacher-stat-card rate">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <h3>{stats.attendanceRate}%</h3>
                  <p>Attendance Rate</p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="teacher-controls">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="🔍 Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <select 
                value={selectedCourse} 
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Courses</option>
                {uniqueCourses.map((course, index) => (
                  <option key={index} value={course}>{course}</option>
                ))}
              </select>

              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Sessions</option>
                <option value="with-attendance">With Attendance</option>
                <option value="no-attendance">No Attendance</option>
              </select>

              <button 
                className="export-btn primary"
                onClick={exportToCSV}
                disabled={filteredSessions.length === 0}
              >
                📄 Export PDF/Excel
              </button>
            </div>

            {/* Content based on view mode */}
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading attendance reports...</p>
              </div>
            ) : viewMode === "datasheet" ? (
              // Data Sheet View
              <div className="datasheet-container">
                <div className="datasheet-header">
                  <h2>📋 Attendance Data Sheet</h2>
                  <p>Showing {filteredSessions.length} sessions with detailed attendance records</p>
                </div>
                
                {filteredSessions.length > 0 ? (
                  <div className="datasheet-table-container">
                    <table className="attendance-datasheet">
                      <thead>
                        <tr>
                          <th>Course</th>
                          <th>Session Date</th>
                          <th>Time</th>
                          <th>Student Name</th>
                          <th>Reg No</th>
                          <th>Email</th>
                          <th>Status</th>
                          <th>Distance</th>
                          <th>CT Marks</th>
                          <th>Attendance Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSessions.map((session, sessionIndex) => {
                          if (!session.attendance || session.attendance.length === 0) {
                            return (
                              <tr key={sessionIndex} className="no-attendance-row">
                                <td>{session.name}</td>
                                <td>{new Date(session.date).toLocaleDateString()}</td>
                                <td>{session.time}</td>
                                <td colSpan="7" className="no-data">No attendance recorded</td>
                              </tr>
                            );
                          }
                          
                          return session.attendance.map((student, studentIndex) => (
                            <tr key={`${sessionIndex}-${studentIndex}`} className={student.status === 'Present' ? 'present-row' : 'late-row'}>
                              <td>{session.name}</td>
                              <td>{new Date(session.date).toLocaleDateString()}</td>
                              <td>{session.time}</td>
                              <td>{student.student_name}</td>
                              <td>{student.student_regno}</td>
                              <td>{student.student_email}</td>
                              <td>
                                <span className={`status-badge ${student.status.toLowerCase()}`}>
                                  {student.status === 'Present' ? '✅' : '⚠️'} {student.status}
                                </span>
                              </td>
                              <td>{student.distance}m</td>
                              <td>
                                {editingCT === `${sessionIndex}-${studentIndex}` ? (
                                  <div className="ct-edit-form">
                                    <input
                                      type="text"
                                      placeholder="CT1: 15"
                                      value={ctMarksInput}
                                      onChange={(e) => setCTMarksInput(e.target.value)}
                                      className="ct-input"
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          const [examType, marks] = ctMarksInput.split(':').map(s => s.trim());
                                          if (examType && marks) {
                                            updateCTMarks(session.session_id, student.student_email, examType, marks);
                                          }
                                        }
                                      }}
                                    />
                                    <div className="ct-buttons">
                                      <button 
                                        className="ct-save-btn"
                                        onClick={() => {
                                          const [examType, marks] = ctMarksInput.split(':').map(s => s.trim());
                                          if (examType && marks) {
                                            updateCTMarks(session.session_id, student.student_email, examType, marks);
                                          }
                                        }}
                                      >
                                        ✅
                                      </button>
                                      <button 
                                        className="ct-cancel-btn"
                                        onClick={() => {
                                          setEditingCT(null);
                                          setCTMarksInput("");
                                        }}
                                      >
                                        ❌
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="ct-marks-cell" onClick={() => {
                                    setEditingCT(`${sessionIndex}-${studentIndex}`);
                                    setCTMarksInput("");
                                  }}>
                                    {Object.keys(student.ct_marks).length > 0 ? (
                                      <span className="ct-marks">
                                        {Object.entries(student.ct_marks).map(([exam, mark]) => (
                                          <span key={exam} className="ct-mark-item">{exam}: {mark}</span>
                                        ))}
                                      </span>
                                    ) : (
                                      <span className="no-marks">Click to add CT marks</span>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td>{student.attendance_time}</td>
                            </tr>
                          ));
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="no-data-message">
                    <p>No attendance data available for the selected filters.</p>
                  </div>
                )}
              </div>
            ) : (
              // Summary View (existing)
              <div className="teacher-session-reports">
                {filteredSessions.length > 0 ? (
                  filteredSessions.map((session, index) => {
                    return (
                      <div key={index} className="session-report-card">
                        <div className="session-report-header">
                          <div className="session-details">
                            <h3>{session.name}</h3>
                            <div className="session-info-meta">
                              <span className="date">📅 {new Date(session.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}</span>
                              <span className="time">⏰ {session.time}</span>
                              <span className="duration">⏱️ {session.duration}</span>
                              <span className="radius">📍 {session.radius}m radius</span>
                            </div>
                          </div>
                          
                          <div className="session-stats">
                            <div className="quick-stats">
                              <div className="quick-stat">
                                <span className="number">{session.total_students}</span>
                                <span className="label">Total</span>
                              </div>
                              <div className="quick-stat success">
                                <span className="number">{session.present_count}</span>
                                <span className="label">Present</span>
                              </div>
                              <div className="quick-stat warning">
                                <span className="number">{session.late_count}</span>
                                <span className="label">Late</span>
                              </div>
                              <div className="quick-stat rate">
                                <span className="number">
                                  {session.total_students > 0 ? Math.round((session.present_count / session.total_students) * 100) : 0}%
                                </span>
                                <span className="label">Rate</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {session.total_students > 0 && (
                          <div className="attendance-details">
                            <h4>👥 Student Attendance Details:</h4>
                            <div className="student-attendance-grid">
                              {session.attendance.map((student, studentIndex) => {
                                return (
                                  <div key={studentIndex} className="student-attendance-item">
                                    <div className="student-profile">
                                      <img 
                                        src={student.image} 
                                        alt="Student verification" 
                                        className="student-verification-photo"
                                        onClick={() => window.open(student.image, '_blank')}
                                      />
                                      <div className="student-details">
                                        <span className="student-name">{student.student_name}</span>
                                        <span className="student-regno">Reg: {student.student_regno}</span>
                                        <span className="student-email">{student.student_email}</span>
                                        <span className="attendance-time">
                                          🕒 {student.attendance_time}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="attendance-metrics">
                                      <span className={`distance-metric ${student.status === 'Present' ? 'success' : 'warning'}`}>
                                        📍 {student.distance}m
                                      </span>
                                      <span className={`status-badge ${student.status.toLowerCase()}`}>
                                        {student.status === 'Present' ? '✅ Present' : '⚠️ Late'}
                                      </span>
                                      {Object.keys(student.ct_marks).length > 0 && (
                                        <div className="ct-marks-display">
                                          <span className="ct-label">CT:</span>
                                          {Object.entries(student.ct_marks).map(([exam, mark]) => (
                                            <span key={exam} className="ct-mark">{exam}: {mark}</span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="no-sessions-found">
                    <div className="no-sessions-icon">🔍</div>
                    <h3>No sessions found</h3>
                    <p>
                      {searchTerm ? 
                        `No sessions match "${searchTerm}"` : 
                        `No sessions ${filterStatus === 'all' ? '' : 'with ' + filterStatus.replace('-', ' ')} found`
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

export default TeacherReports;
