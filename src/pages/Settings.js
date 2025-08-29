import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config/api";
import SideNav from "../components/SideNav";
import "../styles/Settings.css";

const Settings = () => {
    const [token] = useState(() => localStorage.getItem('token'));
  const [userInfo, setUserInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    designation: "",
    department: ""
  });
  const navigate = useNavigate();

  // Get current user information
  const getUserInfo = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/users/profile`, {
        token: token,
      });
      
      setUserInfo(response.data.user);
      setFormData({
        name: response.data.user.name || "",
        email: response.data.user.email || "",
        password: "",
        confirmPassword: "",
        phone: response.data.user.phone || "",
        designation: response.data.user.designation || "",
        department: response.data.user.department || ""
      });
      setLoading(false);
    } catch (err) {
      console.log("Error fetching user info:", err);
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setMessage("Failed to load user information");
        setMessageType("error");
      }
      setLoading(false);
    }
  }, [token, navigate]);

  // Update user profile
  const updateProfile = async () => {
    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match");
      setMessageType("error");
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        token: token,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        designation: formData.designation,
        department: formData.department
      };

      // Only include password if it's being changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await axios.post(`${API_BASE_URL}/users/updateProfile`, updateData);
      
      setUserInfo(response.data.user);
      setMessage("Profile updated successfully!");
      setMessageType("success");
      setIsEditing(false);
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        password: "",
        confirmPassword: ""
      }));

      setSaving(false);
    } catch (err) {
      console.log("Error updating profile:", err);
      setMessage(err.response?.data?.message || "Failed to update profile");
      setMessageType("error");
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCancel = () => {
    setFormData({
      name: userInfo.name || "",
      email: userInfo.email || "",
      password: "",
      confirmPassword: "",
      phone: userInfo.phone || "",
      designation: userInfo.designation || "",
      department: userInfo.department || ""
    });
    setIsEditing(false);
    setMessage("");
  };

  useEffect(() => {
    if (token === "" || token === undefined) {
      navigate("/login");
    } else {
      getUserInfo();
    }
  }, [token, navigate, getUserInfo]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <>
      <div className="app-container">
        <SideNav onCreateSession={() => {}} userType={userInfo.userType || "student"} />
        <div className="main-content-area">
          <div className="settings-container">
            <div className="settings-header">
              <h1>⚙️ Settings</h1>
              <p>Manage your profile information and account settings</p>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`message ${messageType}`}>
                {message}
              </div>
            )}

            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading user information...</p>
              </div>
            ) : (
              <div className="profile-section">
                <div className="profile-header">
                  <div className="profile-info">
                    <div className="avatar">
                      {userInfo.name ? userInfo.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="basic-info">
                      <h3>{userInfo.name}</h3>
                      <p className="user-type-badge">{userInfo.userType}</p>
                      <p className="email">{userInfo.email}</p>
                    </div>
                  </div>
                  
                  {!isEditing && (
                    <button 
                      className="edit-btn"
                      onClick={() => setIsEditing(true)}
                    >
                      ✏️ Edit Profile
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="edit-form">
                    <h4>Edit Profile Information</h4>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Full Name</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Email Address</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Enter your phone number"
                        />
                      </div>
                      
                      {userInfo.userType === "teacher" && (
                        <div className="form-group">
                          <label>Designation</label>
                          <input
                            type="text"
                            name="designation"
                            value={formData.designation}
                            onChange={handleInputChange}
                            placeholder="e.g., Professor, Assistant Professor"
                          />
                        </div>
                      )}
                    </div>

                    {userInfo.userType === "teacher" && (
                      <div className="form-group">
                        <label>Department</label>
                        <input
                          type="text"
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          placeholder="e.g., Computer Science, Mathematics"
                        />
                      </div>
                    )}

                    <div className="password-section">
                      <h5>Change Password (Optional)</h5>
                      <div className="form-row">
                        <div className="form-group">
                          <label>New Password</label>
                          <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Enter new password (leave blank to keep current)"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Confirm New Password</label>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Confirm new password"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-actions">
                      <button 
                        className="save-btn"
                        onClick={updateProfile}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "💾 Save Changes"}
                      </button>
                      
                      <button 
                        className="cancel-btn"
                        onClick={handleCancel}
                        disabled={saving}
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="profile-details">
                    <h4>Profile Information</h4>
                    
                    <div className="details-grid">
                      <div className="detail-item">
                        <label>Full Name</label>
                        <p>{userInfo.name || "Not provided"}</p>
                      </div>
                      
                      <div className="detail-item">
                        <label>Email</label>
                        <p>{userInfo.email || "Not provided"}</p>
                      </div>
                      
                      <div className="detail-item">
                        <label>Phone</label>
                        <p>{userInfo.phone || "Not provided"}</p>
                      </div>
                      
                      <div className="detail-item">
                        <label>Account Type</label>
                        <p className="user-type">{userInfo.userType}</p>
                      </div>
                      
                      {userInfo.userType === "teacher" && (
                        <>
                          <div className="detail-item">
                            <label>Designation</label>
                            <p>{userInfo.designation || "Not provided"}</p>
                          </div>
                          
                          <div className="detail-item">
                            <label>Department</label>
                            <p>{userInfo.department || "Not provided"}</p>
                          </div>
                        </>
                      )}
                      
                      <div className="detail-item">
                        <label>Member Since</label>
                        <p>{userInfo.createdAt ? new Date(userInfo.createdAt).toLocaleDateString() : "Unknown"}</p>
                      </div>
                    </div>
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

export default Settings;
