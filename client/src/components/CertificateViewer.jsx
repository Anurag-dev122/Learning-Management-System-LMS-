import React, { useEffect, useRef } from 'react';

export default function CertificateViewer({ userName, courseTitle, completedAt, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Elegant Outer border
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Inner border
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

    // Header Title
    ctx.font = "bold 26px Arial, sans-serif";
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.fillText("CERTIFICATE OF COMPLETION", canvas.width / 2, 90);

    // Divider Line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(150, 115);
    ctx.lineTo(650, 115);
    ctx.stroke();

    // Body
    ctx.font = "300 18px Arial, sans-serif";
    ctx.fillStyle = '#64748b';
    ctx.fillText("THIS CERTIFICATE IS PROUDLY PRESENTED TO", canvas.width / 2, 160);

    // Student Name
    ctx.font = "bold 38px Arial, sans-serif";
    ctx.fillStyle = '#4f46e5';
    ctx.fillText(userName, canvas.width / 2, 220);

    // Divider Line
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(250, 240);
    ctx.lineTo(550, 240);
    ctx.stroke();

    ctx.font = "300 18px Arial, sans-serif";
    ctx.fillStyle = '#64748b';
    ctx.fillText("for successfully completing the online learning course", canvas.width / 2, 280);

    // Course Title
    ctx.font = "bold 28px Arial, sans-serif";
    ctx.fillStyle = '#1e293b';
    ctx.fillText(courseTitle, canvas.width / 2, 330);

    // Date
    ctx.font = "italic 15px Arial, sans-serif";
    ctx.fillStyle = '#94a3b8';
    const dateFormatted = new Date(completedAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    ctx.fillText(`Awarded on ${dateFormatted}`, canvas.width / 2, 380);

    // Seal
    const sealX = canvas.width / 2;
    const sealY = 470;
    
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(sealX, sealY, 35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(sealX, sealY, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = "24px Arial";
    ctx.fillText("★", sealX, sealY + 8);

    // Signatures
    ctx.font = "italic 16px Arial, sans-serif";
    ctx.fillStyle = '#1e293b';
    ctx.fillText("Dr. Jane Smith", 160, 480);
    ctx.font = "300 13px Arial, sans-serif";
    ctx.fillStyle = '#64748b';
    ctx.fillText("Instructor in Charge", 160, 500);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, 460);
    ctx.lineTo(240, 460);
    ctx.stroke();

    ctx.font = "bold 16px Arial, sans-serif";
    ctx.fillStyle = '#4f46e5';
    ctx.fillText("Antigravity LMS", 640, 480);
    ctx.font = "300 13px Arial, sans-serif";
    ctx.fillStyle = '#64748b';
    ctx.fillText("Platform Authority", 640, 500);

    ctx.beginPath();
    ctx.moveTo(560, 460);
    ctx.lineTo(720, 460);
    ctx.stroke();
  }, [userName, courseTitle, completedAt]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'LMS-Certificate.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '860px', width: '95%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>🎓 Course Completion Certificate</h3>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
        <div className="certificate-preview-box">
          <canvas ref={canvasRef} id="certificate-canvas"></canvas>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button className="btn btn-primary" onClick={handleDownload}>📥 Download PNG</button>
            <button className="btn btn-secondary" onClick={() => window.print()}>🖨️ Print Certificate</button>
          </div>
        </div>
      </div>
    </div>
  );
}
