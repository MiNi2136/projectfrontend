import React, { useEffect, useRef } from "react";
import jsQR from "jsqr";

const QRScanner = ({ isOpen = true, onScan, onError, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    let stream;
    let animationId;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', true); // for iOS
          videoRef.current.setAttribute('autofocus', true);
        }
        // Wait for video to actually start
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            scanQRCode();
          };
        }
      } catch (err) {
        if (onError) onError(err);
      }
    };

    const scanQRCode = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) {
        animationId = requestAnimationFrame(scanQRCode);
        return;
      }
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        animationId = requestAnimationFrame(scanQRCode);
        return;
      }
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        animationId = requestAnimationFrame(scanQRCode);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);
      if (code) {
        // Always show prompt for confirmation/editing
        // eslint-disable-next-line no-alert
        const manual = window.prompt('QR code detected! Paste or confirm the URL:', code.data);
        if (manual && onScan) {
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          if (onClose) onClose();
          onScan(manual);
          return;
        }
        // If cancelled, keep scanning
        animationId = requestAnimationFrame(scanQRCode);
        return;
      }
      animationId = requestAnimationFrame(scanQRCode);
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isOpen, onScan, onError, onClose]);

  if (!isOpen) return null;

  return (
    <div className="qr-scanner-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="qr-scanner-popup" style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 420, width: '95%', boxShadow: '0 2px 16px rgba(0,0,0,0.2)', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, fontSize: 24, background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button>
        <h3 style={{ marginTop: 0 }}>📱 Scan QR Code for Attendance</h3>
        <video
          ref={videoRef}
          style={{ width: '100%', maxWidth: 360, height: 'auto', borderRadius: 8, margin: '0 auto', display: 'block', background: '#222' }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className="scanner-instructions" style={{ marginTop: 16, textAlign: 'center' }}>
          <p>📍 Position the QR code within the camera view</p>
          <p style={{ fontSize: '0.8em', color: '#666', marginTop: '10px' }}>
            The URL will be auto-filled when a valid QR code is detected.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
