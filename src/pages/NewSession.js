//create a new session component
import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../config/api";
import QRCode from "qrcode.react";
import "../styles/NewSession.css";

const NewSession = ({ togglePopup, onSessionCreated }) => {
  //eslint-disable-next-line
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [qrtoggle, setQrtoggle] = useState(false);
  const [qrData, setQrData] = useState("");
  const [sessionDetails, setSessionDetails] = useState(null);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    
    // Focus the first input when modal opens
    setTimeout(() => {
      const firstInput = document.querySelector('.popup-inner input[name="name"]');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleClose = () => {
    setQrtoggle(false);
    setQrData("");
    setSessionDetails(null);
    togglePopup();
  };

  const createQR = async (e) => {
    e.preventDefault();
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Creating Session...';
    submitBtn.disabled = true;
    
    //create a 16 digit UUID
    const uuid = () => {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
          var r = (Math.random() * 16) | 0,
            v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }
      );
    };
    let session_id = uuid();

    let name = e.target.name.value;
    let date = new Date();
    //get the date in the format yyyy-mm-dd
    date = date.toISOString().split("T")[0];
    let time = e.target.time.value;
    let duration = e.target.duration.value;
    let radius = e.target.radius.value;
    //get the current location
    let location = "";

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const locationString = `${latitude},${longitude}`;
          location = locationString.length > 0 ? locationString : "0,0";
          if (name.length > 0 && duration.length > 0) {
            const formData = {
              token,
              session_id,
              date,
              time,
              name,
              duration,
              location,
              radius,
            };
            try {
              const response = await axios.post(
                `${API_BASE_URL}/sessions/create`,
                formData
              );
              
              if (response.data && response.data.url) {
                setQrData(response.data.url);
                setSessionDetails({ name, date, time, duration, radius });
                setQrtoggle(true);
                
                // Notify parent component that session was created with QR data
                if (onSessionCreated) {
                  onSessionCreated(response.data.url, { name, date, time, duration, radius });
                }
              } else {
                alert("Error: Invalid response from server");
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
              }
            } catch (err) {
              console.error("Error creating session:", err);
              if (err.response && err.response.status === 401) {
                // Token expired or invalid, redirect to login
                localStorage.clear();
                window.location.href = "/login";
                return;
              }
              alert(`Error creating session: ${err.response?.data?.message || err.message}`);
              submitBtn.textContent = originalText;
              submitBtn.disabled = false;
            }
          } else {
            alert("Please fill all the fields");
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
          }
        },
        (error) => {
          console.error("Error getting geolocation:", error);
          alert("Error getting location. Please enable location services.");
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        },
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
      const submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.textContent = '✨ Create Session & Generate QR';
      submitBtn.disabled = false;
    }
  };

  const copyQR = () => {
    navigator.clipboard.writeText(qrData);
    alert("QR code URL copied to clipboard!");
  };

  const handleOverlayClick = (e) => {
    // Close modal when clicking on the overlay (not the content)
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className="new-popup" onClick={handleOverlayClick}>
      <button onClick={handleClose} className="close-btn" aria-label="Close modal">
        <strong>✕</strong>
      </button>
      {!qrtoggle && (
        <div className="popup-inner">
          <h5>📋 Create a New Session</h5>
          <form onSubmit={createQR}>
            <input
              type="text"
              name="name"
              placeholder="Session Name"
              autoComplete="off"
              required
            />
            <input
              type="text"
              name="duration"
              placeholder="Duration (e.g., 1 hour)"
              autoComplete="off"
              required
            />
            <input
              type="time"
              name="time"
              placeholder="Time"
              autoComplete="off"
              required
            />
            <select name="radius" id="radius" autoComplete="off" required>
              <option value="">Select attendance radius</option>
              <option value="50">50 meters</option>
              <option value="75">75 meters</option>
              <option value="100">100 meters</option>
              <option value="150">150 meters</option>
            </select>
            <button type="submit" className="create-btn">
              ✨ Create Session & Generate QR
            </button>
          </form>
        </div>
      )}
      {qrtoggle && (
        <div className="qr-code-section">
          <div className="qr-header">
            <h5>🎉 Session Created Successfully!</h5>
            {sessionDetails && (
              <div className="session-summary">
                <p><strong>📚 {sessionDetails.name}</strong></p>
                <p>📅 {sessionDetails.date} ⏰ {sessionDetails.time}</p>
                <p>⏱️ {sessionDetails.duration} 📍 {sessionDetails.radius}m radius</p>
              </div>
            )}
          </div>
          <div className="qr-display">
            <QRCode value={qrData} size={250} level="H" />
            <p className="qr-instruction">Students can scan this QR code to mark attendance</p>
          </div>
          <div className="qr-actions">
            <button onClick={copyQR} className="copy-btn">
              📋 Copy QR Link
            </button>
            <button onClick={handleClose} className="done-btn">
              ✅ Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewSession;
