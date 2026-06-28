window.CertificateEngine = {
  drawCertificate: function(canvasId, studentName, courseTitle, completionDate) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions
    canvas.width = 800;
    canvas.height = 600;

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Outer elegant border
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Draw Inner border
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

    // Top Header Banner
    ctx.font = "bold 26px 'Outfit', sans-serif";
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

    // Body Text
    ctx.font = "300 18px 'Outfit', sans-serif";
    ctx.fillStyle = '#64748b';
    ctx.fillText("THIS CERTIFICATE IS PROUDLY PRESENTED TO", canvas.width / 2, 160);

    // Student Name (Elegant and Large)
    ctx.font = "bold 38px 'Outfit', sans-serif";
    ctx.fillStyle = '#4f46e5';
    ctx.fillText(studentName, canvas.width / 2, 220);

    // Divider Line
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(250, 240);
    ctx.lineTo(550, 240);
    ctx.stroke();

    // Description text
    ctx.font = "300 18px 'Outfit', sans-serif";
    ctx.fillStyle = '#64748b';
    ctx.fillText("for successfully completing the online learning course", canvas.width / 2, 280);

    // Course Title
    ctx.font = "bold 28px 'Outfit', sans-serif";
    ctx.fillStyle = '#1e293b';
    ctx.fillText(courseTitle, canvas.width / 2, 330);

    // Metadata details
    ctx.font = "italic 15px 'Outfit', sans-serif";
    ctx.fillStyle = '#94a3b8';
    const dateFormatted = new Date(completionDate).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    ctx.fillText(`Awarded on ${dateFormatted}`, canvas.width / 2, 380);

    // Gold Medal Seal Illustration
    const sealX = canvas.width / 2;
    const sealY = 470;
    
    // Draw outer golden ribbon glow
    ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(sealX, sealY, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // reset shadow

    // Inner gold ribbon
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(sealX, sealY, 30, 0, Math.PI * 2);
    ctx.fill();

    // Ribbons hanging down
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.moveTo(sealX - 15, sealY + 25);
    ctx.lineTo(sealX - 25, sealY + 70);
    ctx.lineTo(sealX - 5, sealY + 60);
    ctx.lineTo(sealX - 15, sealY + 25);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(sealX + 15, sealY + 25);
    ctx.lineTo(sealX + 25, sealY + 70);
    ctx.lineTo(sealX + 5, sealY + 60);
    ctx.lineTo(sealX + 15, sealY + 25);
    ctx.fill();

    // Star icon inside seal
    ctx.fillStyle = '#ffffff';
    ctx.font = "24px Arial";
    ctx.fillText("★", sealX, sealY + 8);

    // Signatures
    ctx.font = "italic 16px 'Outfit', sans-serif";
    ctx.fillStyle = '#1e293b';
    ctx.fillText("Dr. Jane Smith", 160, 480);
    ctx.font = "300 13px 'Outfit', sans-serif";
    ctx.fillStyle = '#64748b';
    ctx.fillText("Instructor in Charge", 160, 500);
    // Draw signature line
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, 460);
    ctx.lineTo(240, 460);
    ctx.stroke();

    ctx.font = "bold 16px 'Outfit', sans-serif";
    ctx.fillStyle = '#4f46e5';
    ctx.fillText("Antigravity LMS", 640, 480);
    ctx.font = "300 13px 'Outfit', sans-serif";
    ctx.fillStyle = '#64748b';
    ctx.fillText("Platform Authority", 640, 500);
    // Draw signature line
    ctx.beginPath();
    ctx.moveTo(560, 460);
    ctx.lineTo(720, 460);
    ctx.stroke();
  },

  download: function(canvasId, filename) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = filename || 'Certificate.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
};
