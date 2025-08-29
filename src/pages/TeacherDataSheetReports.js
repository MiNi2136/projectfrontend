import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config/api";
import SideNav from "../components/SideNav";
import "../styles/TeacherReportsDataSheet.css";

const TeacherReportsDataSheet = () => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [sessionList, setSessionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCT, setEditingCT] = useState(null);
  const [ctMarksInput, setCTMarksInput] = useState("");
  const navigate = useNavigate();

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
        if (err.response && err.response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
        setSessionList([]);
        setLoading(false);
      });
  }

  // Get unique courses for filtering
  const getUniqueCourses = () => {
    const courses = sessionList.map(session => session.name);
    return [...new Set(courses)];
  };

  // Filter sessions based on search and course
  const getFilteredSessions = () => {
    return sessionList.filter(session => {
      const matchesSearch = session.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCourse = selectedCourse === "all" || session.name === selectedCourse;
      const hasAttendance = session.attendance && session.attendance.length > 0;
      
      return matchesSearch && matchesCourse && hasAttendance;
    });
  };

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
        getTeacherAttendanceReports();
        setEditingCT(null);
        setCTMarksInput("");
      })
      .catch((err) => {
        console.log("Error updating CT marks:", err);
        alert("Failed to update CT marks");
      });
  };

  // Export data as CSV
  const exportToPDF = () => {
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
      session.attendance.forEach(student => {
        const ctMarksStr = Object.entries(student.ct_marks)
          .map(([exam, mark]) => `${exam}: ${mark}`)
          .join('; ') || 'Not assigned';
          
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
          ctMarksStr
        ]);
      });
    });

    // Convert to CSV string
    const csvContent = csvData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `attendance-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSessions = getFilteredSessions();
  const uniqueCourses = getUniqueCourses();

  // Calculate summary statistics
  const totalStudents = filteredSessions.reduce((sum, session) => sum + session.attendance.length, 0);
  const totalPresent = filteredSessions.reduce((sum, session) => sum + session.present_count, 0);
  const totalLate = filteredSessions.reduce((sum, session) => sum + session.late_count, 0);

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
          <div className="reports-container">
            <div className="reports-header">
              <h1>📋 Attendance Reports</h1>
             
            </div>

           
            {/* Filters and Export */}
            <div className="reports-controls">
              <div className="filters">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                
                <select 
                  value={selectedCourse} 
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="course-filter"
                >
                  <option value="all">All Courses</option>
                  {uniqueCourses.map((course, index) => (
                    <option key={index} value={course}>{course}</option>
                  ))}
                </select>
              </div>

              <button 
                className="export-btn"
                onClick={exportToPDF}
                disabled={filteredSessions.length === 0}
              >
                📄 Export as PDF
              </button>
            </div>

            {/* Data Sheet */}
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading reports...</p>
              </div>
            ) : (
              <div className="datasheet-container">
                {filteredSessions.length > 0 ? (
                  <div className="table-container">
                    <table className="reports-table">
                      <thead>
                        <tr>
                          <th>Course</th>
                          <th>Date</th>
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
                        {filteredSessions.map((session, sessionIndex) => 
                          session.attendance.map((student, studentIndex) => (
                            <tr key={`${sessionIndex}-${studentIndex}`} className={student.status === 'Present' ? 'present-row' : 'late-row'}>
                              <td className="course-cell">{session.name}</td>
                              <td>{new Date(session.date).toLocaleDateString()}</td>
                              <td>{session.time}</td>
                              <td className="student-name-cell">{student.student_name}</td>
                              <td className="regno-cell">{student.student_regno}</td>
                              <td className="email-cell">{student.student_email}</td>
                              <td>
                                <span className={`status-badge ${student.status.toLowerCase()}`}>
                                  {student.status}
                                </span>
                              </td>
                              <td>{student.distance}m</td>
                              <td className="ct-marks-cell">
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
                                  <div onClick={() => {
                                    setEditingCT(`${sessionIndex}-${studentIndex}`);
                                    setCTMarksInput("");
                                  }}>
                                    {Object.keys(student.ct_marks).length > 0 ? (
                                      <div className="ct-marks-display">
                                        {Object.entries(student.ct_marks).map(([exam, mark]) => (
                                          <span key={exam} className="ct-mark-item">{exam}: {mark}</span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="add-ct-marks">Click to add</span>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td>{student.attendance_time}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="no-data-message">
                    <div className="no-data-icon">📊</div>
                    <h3>No attendance data found</h3>
                    <p>No attendance records available for the selected filters.</p>
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

export default TeacherReportsDataSheet;
