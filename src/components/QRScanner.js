import React, { useRef, useEffect } from 'react';

const QRScanner = ({ isOpen, onScan, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Camera access denied. Please allow camera permissions and try again.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const captureAndScan = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // For now, we'll simulate QR scanning by asking user to input manually
    // In a real app, you'd use a QR code library here
    const qrData = prompt('QR Scanner: Please paste the QR code URL or scan result:');
    if (qrData) {
      onScan(qrData);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="qr-scanner-overlay">
      <div className="qr-scanner-popup">
        <div className="qr-scanner-header">
          <h3>📱 Scan QR Code for Attendance</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="scanner-content">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            style={{ width: '100%', maxWidth: '400px', borderRadius: '8px' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
        <div className="scanner-instructions">
          <p>📍 Position the QR code within the camera view</p>
          <button 
            className="scan-btn"
            onClick={captureAndScan}
          >
            📷 Capture & Scan QR Code
          </button>
          <p style={{ fontSize: '0.8em', color: '#666', marginTop: '10px' }}>
            Alternative: Manually input QR code data when prompted
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
