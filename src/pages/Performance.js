import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config/api";
import SideNav from "../components/SideNav";
import "../styles/Performance.css";

const Performance = () => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [performanceData, setPerformanceData] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [editingCT, setEditingCT] = useState({});
  const [showAddCTColumn, setShowAddCTColumn] = useState(false);
  const [newCTColumn, setNewCTColumn] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const navigate = useNavigate();

  // Get teacher sessions and compile performance data
  function getPerformanceData() {
    setLoading(true);
    axios
      .post(`${API_BASE_URL}/sessions/getPerformanceData`, {
        token: token,
      })
      .then((response) => {
        const data = response.data;
        setSessions(data.sessions || []);
        
        // Transform backend data to frontend format
        const transformedData = data.performance_data.map(student => ({
          regNo: student.regno,
          email: student.email,
          attendanceRecords: student.attendance_records.reduce((acc, record) => {
            acc[record.session_id] = {
              sessionName: record.session_name,
              date: record.date,
              status: record.status,
              distance: record.distance,
              image: record.image
            };
            return acc;
          }, {}),
          ctMarks: student.ct_marks || {}, // Load saved CT marks from backend
          totalSessions: student.total_sessions,
          attendedSessions: student.sessions_attended,
          attendancePercentage: student.attendance_percentage,
          attendanceMarks: Math.round((student.attendance_percentage / 100) * 10) // Calculate attendance marks out of 10
        }));
        
        setPerformanceData(transformedData);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Error fetching performance data:", err);
        if (err.response && err.response.status === 401) {
          // Token expired or invalid, redirect to login
          localStorage.clear();
          window.location.href = "/login";
          return;
        }
        setPerformanceData([]);
        setLoading(false);
      });
  }

  // Add new CT marks column
  const handleAddCTColumn = () => {
    if (newCTColumn.trim()) {
      setPerformanceData(prevData => 
        prevData.map(student => ({
          ...student,
          ctMarks: {
            ...student.ctMarks,
            [newCTColumn]: ""
          }
        }))
      );
      setNewCTColumn("");
      setShowAddCTColumn(false);
    }
  };

  // Update CT marks for a student
  const handleCTMarksChange = (studentIndex, columnName, value) => {
    setPerformanceData(prevData => {
      const newData = [...prevData];
      newData[studentIndex].ctMarks[columnName] = value;
      return newData;
    });
  };

  // Save CT marks to backend
  const saveCTMarks = async () => {
    setSaving(true);
    setSaveMessage("Saving...");
    
    try {
      const ctMarksData = performanceData.map(student => ({
        regno: student.regNo,
        email: student.email,
        ct_marks: student.ctMarks
      }));

      const response = await axios.post(`${API_BASE_URL}/sessions/saveCTMarks`, {
        token: token,
        ct_marks_data: ctMarksData
      });

      setSaveMessage("✅ CT Marks saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Error saving CT marks:", error);
      setSaveMessage("❌ Error saving CT marks. Please try again.");
      setTimeout(() => setSaveMessage(""), 3000);
    }
    
    setSaving(false);
  };

  // Handle Ctrl+S keyboard shortcut
  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveCTMarks();
    }
  };

  // Get unique CT columns
  const getCTColumns = () => {
    const columns = new Set();
    performanceData.forEach(student => {
      Object.keys(student.ctMarks).forEach(column => columns.add(column));
    });
    return Array.from(columns);
  };

  // Filter performance data based on search and session
  const filteredData = performanceData.filter(student => {
    const matchesSearch = student.regNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!selectedSession) return matchesSearch;
    
    return matchesSearch && student.attendanceRecords[selectedSession];
  });

  // Export data to CSV
  const exportToCSV = () => {
    const ctColumns = getCTColumns();
    const headers = ['Reg No', 'Email', 'Total Sessions', 'Attended', 'Attendance %', 'Attendance Marks (/10)', ...ctColumns];
    
    const csvData = filteredData.map(student => [
      student.regNo,
      student.email,
      student.totalSessions,
      student.attendedSessions,
      `${student.attendancePercentage}%`,
      `${student.attendanceMarks}/10`,
      ...ctColumns.map(column => student.ctMarks[column] || '')
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `performance-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    if (token === "" || token === undefined) {
      navigate("/login");
    } else {
      // Check if user is actually a teacher
      const userType = localStorage.getItem("type");
      if (userType !== "teacher") {
        navigate("/student-dashboard");
        return;
      }
      getPerformanceData();
    }

    // Add keyboard event listener for Ctrl+S
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [token, navigate]);

  return (
    <>
      <div className="app-container">
        <SideNav onCreateSession={() => {}} userType="teacher" />
        <div className="main-content-area">
          <div className="performance-container">
            <div className="performance-header">
              <h1>📊 Student Performance Dashboard</h1>
             
            </div>

            {/* Controls */}
            <div className="performance-controls">
              <div className="search-filter-section">
                <input
                  type="text"
                  placeholder="Search by Reg No or Email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                
                <select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                  className="session-filter"
                >
                  <option value="">All Sessions</option>
                  {sessions.map(session => (
                    <option key={session.session_id} value={session.session_id}>
                      {session.name} - {new Date(session.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="action-buttons">
                <button
                  onClick={() => setShowAddCTColumn(true)}
                  className="add-ct-btn"
                >
                  ➕ Add CT Column
                </button>
                <button
                  onClick={saveCTMarks}
                  className="save-btn"
                  disabled={saving}
                >
                  {saving ? "💾 Saving..." : "💾 Save CT Marks"}
                </button>
               
              </div>
            </div>

            {/* Save Message */}
            {saveMessage && (
              <div className="save-message">
                {saveMessage}
                <div className="save-hint">💡 Tip: Press Ctrl+S to save quickly!</div>
              </div>
            )}

            {/* Add CT Column Modal */}
            {showAddCTColumn && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3>Add New CT Marks Column</h3>
                  <input
                    type="text"
                    placeholder="Column name (e.g., CT-1, Quiz-1, etc.)"
                    value={newCTColumn}
                    onChange={(e) => setNewCTColumn(e.target.value)}
                    className="ct-column-input"
                  />
                  <div className="modal-actions">
                    <button onClick={handleAddCTColumn} className="confirm-btn">
                      Add Column
                    </button>
                    <button
                      onClick={() => {
                        setShowAddCTColumn(false);
                        setNewCTColumn("");
                      }}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Data Table */}
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading performance data...</p>
              </div>
            ) : (
              <div className="performance-table-container">
                {filteredData.length > 0 ? (
                  <div className="table-wrapper">
                    <table className="performance-table">
                      <thead>
                        <tr>
                          <th className="sticky-col">Reg No</th>
                          <th className="sticky-col-2">Email</th>
                          <th>Total Sessions</th>
                          <th>Attended</th>
                          <th>Attendance %</th>
                          <th className="attendance-marks-header">Attendance Marks (/10)</th>
                          {getCTColumns().map(column => (
                            <th key={column} className="ct-column">
                              {column}
                            </th>
                          ))}
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.map((student, index) => (
                          <tr key={student.email} className="student-row">
                            <td className="sticky-col reg-no-cell">
                              {student.regNo}
                            </td>
                            <td className="sticky-col-2 email-cell">
                              {student.email}
                            </td>
                            <td className="sessions-count">
                              {student.totalSessions}
                            </td>
                            <td className="attended-count">
                              {student.attendedSessions}
                            </td>
                            <td className={`attendance-percentage ${
                              student.attendancePercentage >= 75 ? 'good-attendance' : 
                              student.attendancePercentage >= 50 ? 'average-attendance' : 'poor-attendance'
                            }`}>
                              {student.attendancePercentage}%
                            </td>
                            <td className={`attendance-marks attendance-marks-cell ${
                              student.attendanceMarks >= 8 ? 'excellent-marks' :
                              student.attendanceMarks >= 6 ? 'good-marks' :
                              student.attendanceMarks >= 4 ? 'average-marks' : 'poor-marks'
                            }`}>
                              {student.attendanceMarks}/10
                            </td>
                            {getCTColumns().map(column => (
                              <td key={column} className="ct-marks-cell">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={student.ctMarks[column] || ""}
                                  onChange={(e) => handleCTMarksChange(index, column, e.target.value)}
                                  className="ct-marks-input"
                                  placeholder="0"
                                />
                              </td>
                            ))}
                            <td className="actions-cell">
                              <button
                                onClick={() => {
                                  // Show detailed attendance records
                                  const records = Object.values(student.attendanceRecords);
                                  alert(
                                    `Detailed Attendance for ${student.regNo}:\n\n` +
                                    records.map(record => 
                                      `${record.sessionName} (${new Date(record.date).toLocaleDateString()}): ${record.status}`
                                    ).join('\n')
                                  );
                                }}
                                className="view-details-btn"
                              >
                                👁️ View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="no-data-container">
                    <div className="no-data-icon">📊</div>
                    <h3>No Performance Data Available</h3>
                    <p>No students have attended any sessions yet or no sessions found.</p>
                  </div>
                )}
              </div>
            )}

            {/* Summary Statistics */}
            {!loading && filteredData.length > 0 && (
              <div className="performance-summary">
                <h3>📈 Summary Statistics</h3>
                <div className="summary-cards">
                  <div className="summary-card">
                    <div className="summary-icon">👥</div>
                    <div className="summary-info">
                      <h4>{filteredData.length}</h4>
                      <p>Total Students</p>
                    </div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-icon">📚</div>
                    <div className="summary-info">
                      <h4>{sessions.length}</h4>
                      <p>Total Sessions</p>
                    </div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-icon">✅</div>
                    <div className="summary-info">
                      <h4>
                        {filteredData.length > 0 
                          ? Math.round(filteredData.reduce((sum, student) => sum + student.attendancePercentage, 0) / filteredData.length)
                          : 0
                        }%
                      </h4>
                      <p>Average Attendance</p>
                    </div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-icon">📝</div>
                    <div className="summary-info">
                      <h4>{getCTColumns().length}</h4>
                      <p>CT Assessments</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Performance;
