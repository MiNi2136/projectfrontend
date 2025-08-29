import React from "react";
import { useEffect } from "react";
import "../styles/Landing.css";
import { Link } from "react-router-dom";

const Landing = () => {
  useEffect(() => {
    if (localStorage.getItem("token")) {
      window.location.href = "/login";
    }
  });

  return (
    <div className="landing-main">
      <div className="landing-main">
        <h1>Qr Code Attendance System</h1>
        <p>Hello and welcome!</p>
        <Link to="/login" className="landing-login-button">
          Login
        </Link>
        <Link to="/register" className="landing-register-button">
          Register
        </Link>
      </div>
    </div>
  );
};

export default Landing;
