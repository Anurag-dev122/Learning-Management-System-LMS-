import React, { useEffect, useRef, useState } from 'react';

export default function LiveClassroom({ courseId, onClose }) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const [messages, setMessages] = useState([
    { sender: 'Instructor', text: 'Welcome everyone! Feel free to sketch on the shared whiteboard panel.', type: 'instructor' }
  ]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Scale canvas
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const startDraw = (e) => {
      isDrawing.current = true;
      ctx.beginPath();
      ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    };

    const draw = (e) => {
      if (!isDrawing.current) return;
      ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    const stopDraw = () => {
      isDrawing.current = false;
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);

    return () => {
      canvas.removeEventListener('mousedown', startDraw);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDraw);
      canvas.removeEventListener('mouseleave', stopDraw);
    };
  }, []);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, { sender: 'You', text: chatInput, type: 'student' }]);
    setChatInput('');
  };

  return (
    <div className="view-content" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2>🎥 Live Virtual Lecture</h2>
        <button className="btn btn-secondary" onClick={onClose}>Exit Classroom</button>
      </div>
      
      <div className="live-classroom">
        <div className="video-grid-container">
          <div className="video-simulation">
            <div className="instructor-feed">👨‍🏫 Instructor Video stream active</div>
            <div className="video-label">Instructor: Dr. Jane Smith</div>
          </div>
          
          <div className="whiteboard-container">
            <div className="whiteboard-controls">
              <button className="btn btn-secondary btn-sm" onClick={handleClear}>Clear Whiteboard</button>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', alignSelf: 'center' }}>Draw below to explain concepts:</span>
            </div>
            <canvas ref={canvasRef} id="whiteboard-canvas"></canvas>
          </div>
        </div>

        <div className="live-chat-panel">
          <div className="chat-header">💬 Live Classroom Chat</div>
          <div className="chat-messages" style={{ overflowY: 'auto' }}>
            {messages.map((m, idx) => (
              <div key={idx} className={`chat-bubble ${m.type}`}>
                <strong>{m.sender}:</strong> {m.text}
              </div>
            ))}
          </div>
          <form className="chat-input-bar" onSubmit={handleSendChat}>
            <input 
              type="text" 
              className="form-control" 
              style={{ flex: 1 }} 
              placeholder="Ask a question..." 
              value={chatInput} 
              onChange={e => setChatInput(e.target.value)} 
              required 
            />
            <button type="submit" className="btn btn-primary">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}
