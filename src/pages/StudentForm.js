//create a new session component
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../config/api";
import "../styles/StudentForm.css";

const StudentForm = ({ togglePopup }) => {
  //eslint-disable-next-line
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [image, setImage] = useState(null);
  const [photoData, setPhotoData] = useState(""); // To store the captured photo data
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);

  const constraints = {
    video: true,
  };
  const startCamera = () => {
    if (!videoRef.current) {
      console.error("Video element not available");
      return;
    }
    
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraActive(true);
        }
      })
      .catch((error) => {
        console.error("Error accessing camera:", error);
        alert("Unable to access camera. Please check your camera permissions.");
      });
  };
  const stopCamera = () => {
    if (!videoRef.current || !videoRef.current.srcObject) {
      return;
    }
    
    const stream = videoRef.current.srcObject;
    const tracks = stream.getTracks();

    tracks.forEach((track) => track.stop());
    videoRef.current.srcObject = null;
    setIsCameraActive(false);
  };
  const capturePhoto = async () => {
    if (!videoRef.current) {
      alert("Camera not available. Please start the camera first.");
      return;
    }
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas
      .getContext("2d")
      .drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const photoDataUrl = canvas.toDataURL("image/png");

    setImage(await fetch(photoDataUrl).then((res) => res.blob()));

    setPhotoData(photoDataUrl);
    stopCamera();
  };
  const ResetCamera = () => {
    setPhotoData("");
    setImage(null);
    startCamera();
  };

  const AttendSession = async (e) => {
    e.preventDefault();
    console.log("AttendSession function called");
    console.log("Event:", e);
    
    let regno = e.target.regno.value;
    console.log("Regno:", regno);
    console.log("Token:", token ? "Present" : "Missing");
    console.log("Image:", image ? "Present" : "Missing");
    console.log("Session ID:", localStorage.getItem("session_id"));
    console.log("Teacher Email:", localStorage.getItem("teacher_email"));
    console.log("Student Email:", localStorage.getItem("email"));
    
    if (!token) {
      console.error("No token found - redirecting to login");
      alert("Session expired. Please login again.");
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
    }
    
    //get user IP address
    axios.defaults.withCredentials = false;
    const res = await axios.get("https://api64.ipify.org?format=json");
    axios.defaults.withCredentials = true;
    //
    let IP = res.data.ip;
    if (navigator.geolocation) {
      console.log("Geolocation is supported!");
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          let locationString = `${latitude},${longitude}`;

          if (regno.length > 0) {
            
            if (!image) {
              console.error("No image captured");
              alert("Please capture a photo before submitting attendance!");
              return;
            }
            
            console.log("Creating FormData with:");
            const formData = new FormData();
            formData.append('token', token);
            formData.append('regno', regno);
            formData.append('session_id', localStorage.getItem("session_id"));
            formData.append('teacher_email', localStorage.getItem("teacher_email"));
            formData.append('IP', IP);
            formData.append('date', new Date().toISOString().split("T")[0]);
            formData.append('Location', locationString);
            formData.append('student_email', localStorage.getItem("email"));
            formData.append('image', image, 'attendance-photo.png');
            
            // Log FormData contents
            console.log("FormData entries:");
            for (let [key, value] of formData.entries()) {
              console.log(`${key}: ${typeof value === 'object' && value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value}`);
            }
            
            console.log("Making API call to:", `${API_BASE_URL}/sessions/attend_session`);
            
            try {
              const response = await axios.post(
                `${API_BASE_URL}/sessions/attend_session`,
                formData,
                {
                  headers: {
                    "Content-Type": "multipart/form-data",
                  },
                }
              );
              
              console.log("API Response:", response);
              console.log("Response status:", response.status);
              console.log("Response data:", response.data);
              
              //replace the contents of the popup with success message
              document.querySelector(
                ".form-popup-inner"
              ).innerHTML = `
                <div style="text-align: center; padding: 20px;">
                  <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
                  <h3 style="color: #27ae60; margin-bottom: 10px;">Attendance Marked Successfully!</h3>
                  <p style="color: #555; margin-bottom: 20px;">${response.data.message}</p>
                  <button onclick="window.location.reload()" style="
                    background: linear-gradient(135deg, #27ae60, #219a52);
                    color: white;
                    border: none;
                    padding: 10px 25px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 14px;
                  ">Close & Return to Dashboard</button>
                </div>
              `;
            } catch (err) {
              console.error("Attendance submission error:", err);
              console.error("Error details:", {
                message: err.message,
                response: err.response,
                status: err.response?.status,
                data: err.response?.data,
                config: err.config
              });
              
              // Check if it's a 401 error (token expired)
              if (err.response && err.response.status === 401) {
                const errorMessage = `Authentication failed: ${err.response.data?.message || 'Token expired'}`;
                console.error("401 Error:", errorMessage);
                
                // Show error message instead of immediate redirect
                document.querySelector(
                  ".form-popup-inner"
                ).innerHTML = `
                  <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 15px;">🔐</div>
                    <h3 style="color: #e74c3c; margin-bottom: 10px;">Authentication Error!</h3>
                    <p style="color: #555; margin-bottom: 10px; font-weight: bold;">Status: 401 Unauthorized</p>
                    <p style="color: #555; margin-bottom: 20px;">${errorMessage}</p>
                    <button onclick="localStorage.removeItem('token'); window.location.href='/login';" style="
                      background: linear-gradient(135deg, #3498db, #2980b9);
                      color: white;
                      border: none;
                      padding: 10px 25px;
                      border-radius: 20px;
                      cursor: pointer;
                      font-size: 14px;
                      margin-right: 10px;
                    ">Go to Login</button>
                    <button onclick="location.reload()" style="
                      background: linear-gradient(135deg, #95a5a6, #7f8c8d);
                      color: white;
                      border: none;
                      padding: 10px 25px;
                      border-radius: 20px;
                      cursor: pointer;
                      font-size: 14px;
                    ">Retry</button>
                  </div>
                `;
                return;
              }
              
              // Get specific error message from server if available
              const errorMessage = err.response?.data?.message || err.message || "Unknown error occurred";
              const statusCode = err.response?.status || 'Unknown';
              
              console.error("Full error object:", err);
              
              // Show detailed error message
              document.querySelector(
                ".form-popup-inner"
              ).innerHTML = `
                <div style="text-align: center; padding: 20px;">
                  <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
                  <h3 style="color: #e74c3c; margin-bottom: 10px;">Attendance Failed!</h3>
                  <p style="color: #555; margin-bottom: 10px; font-weight: bold;">Status Code: ${statusCode}</p>
                  <p style="color: #555; margin-bottom: 10px; font-family: monospace; background: #f8f9fa; padding: 10px; border-radius: 5px;">${errorMessage}</p>
                  <div style="margin-bottom: 20px;">
                    <button onclick="console.log('Full error:', ${JSON.stringify(err, null, 2).replace(/"/g, '\\"')})" style="
                      background: #6c757d;
                      color: white;
                      border: none;
                      padding: 5px 15px;
                      border-radius: 15px;
                      cursor: pointer;
                      font-size: 12px;
                      margin-bottom: 10px;
                    ">Log Full Error to Console</button>
                  </div>
                  <button onclick="location.reload()" style="
                    background: linear-gradient(135deg, #e74c3c, #c0392b);
                    color: white;
                    border: none;
                    padding: 10px 25px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 14px;
                    margin-right: 10px;
                  ">Try Again</button>
                  <button onclick="window.location.href='/student-dashboard'" style="
                    background: linear-gradient(135deg, #95a5a6, #7f8c8d);
                    color: white;
                    border: none;
                    padding: 10px 25px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 14px;
                  ">Back to Dashboard</button>
                </div>
              `;
            }
          } else {
            alert("Please fill all the fields");
          }
        },
        (error) => {
          console.error("Error getting geolocation:", error);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
      console.error("Geolocation is not supported by this browser.");
    }
  };

  // useEffect to handle component cleanup
  useEffect(() => {
    // Cleanup function to stop camera when component unmounts
    return () => {
      const video = videoRef.current;
      if (video && video.srcObject) {
        const stream = video.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
        video.srcObject = null;
      }
    };
  }, []);

  return (
    <div className="form-popup">
      <button onClick={togglePopup}>
        <strong>X</strong>
      </button>
      <div className="form-popup-inner">
        <h5>Enter Your Details</h5>
        {!photoData && <video ref={videoRef} width={300} autoPlay={true} />}
        {photoData && <img src={photoData} width={300} alt="Captured" />}
        <div className="cam-btn">
          <button onClick={isCameraActive ? stopCamera : startCamera}>
            {isCameraActive ? 'Stop Camera' : 'Start Camera'}
          </button>
          <button onClick={capturePhoto} disabled={!isCameraActive}>
            Capture
          </button>
          <button onClick={ResetCamera}>Reset</button>
        </div>

        <form onSubmit={AttendSession}>
          <input
            type="text"
            name="regno"
            placeholder="RegNo"
            autoComplete="off"
          />
          <button type="submit">Done</button>
        </form>
      </div>
    </div>
  );
};

export default StudentForm;
