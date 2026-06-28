import React, { useEffect, useState } from 'react';
import { API } from '../utils/api';

export default function CourseBuilder({ courseId, onClose }) {
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newModTitle, setNewModTitle] = useState('');
  
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [activeModId, setActiveModId] = useState(null);
  const [lTitle, setLTitle] = useState('');
  const [lType, setLType] = useState('text');
  const [lBody, setLBody] = useState('');

  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [activeLesId, setActiveLesId] = useState(null);
  const [qTitle, setQTitle] = useState('');
  const [qPassing, setQPassing] = useState('70');
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState('');
  const [qCorrect, setQCorrect] = useState('1');

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignInstructions, setAssignInstructions] = useState('');
  const [assignDue, setAssignDue] = useState('2026-12-31');

  const loadCourse = async () => {
    try {
      const data = await API.get(`/api/courses/${courseId}`);
      setCourse(data.course);
      setModules(data.modules);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const handleCreateModule = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/api/courses/${courseId}/modules`, { title: newModTitle });
      alert("Module created!");
      setNewModTitle('');
      loadCourse();
    } catch(err) {
      alert(err.message);
    }
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/api/modules/${activeModId}/lessons`, { title: lTitle, contentType: lType, contentUrlOrText: lBody });
      alert("Lesson added!");
      setLessonModalOpen(false);
      setLTitle('');
      setLBody('');
      loadCourse();
    } catch(err) {
      alert(err.message);
    }
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    const parsedOptions = qOptions.split(',').map(s => s.trim());
    const questions = [{
      question_text: qText,
      options: parsedOptions,
      correct_option: parseInt(qCorrect)
    }];
    try {
      await API.post(`/api/lessons/${activeLesId}/quiz`, { title: qTitle, passingScore: parseInt(qPassing), questions });
      alert("Quiz added!");
      setQuizModalOpen(false);
      setQTitle('');
      setQText('');
      setQOptions('');
      loadCourse();
    } catch(err) {
      alert(err.message);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/api/lessons/${activeLesId}/assignment`, { title: assignTitle, instructionText: assignInstructions, dueDate: assignDue });
      alert("Assignment added!");
      setAssignModalOpen(false);
      setAssignTitle('');
      setAssignInstructions('');
      loadCourse();
    } catch(err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="view-content"><h2>Loading curriculum builder...</h2></div>;
  }

  return (
    <div className="view-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>🛠️ Curriculum Builder: {course ? course.title : ''}</h2>
          <p className="text-muted">Define the modules, structured lectures, and assessment milestones.</p>
        </div>
        <button className="btn btn-secondary" onClick={onClose}>Back to Dashboard</button>
      </div>

      <div className="glass-card" style={{ marginBottom: '32px' }}>
        <h3>Create New Module</h3>
        <form onSubmit={handleCreateModule} style={{ display: 'flex', gap: '16px', marginTop: '16px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, margin: 0 }}>
            <label>Module Title</label>
            <input type="text" className="form-control" placeholder="Module 1: Advanced Objects" required value={newModTitle} onChange={e => setNewModTitle(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary">Create Module</button>
        </form>
      </div>

      <h3>Syllabus Blueprint</h3>
      <div style={{ marginTop: '16px' }}>
        {modules.length === 0 ? (
          <p className="text-muted">No modules added yet.</p>
        ) : (
          modules.map(mod => (
            <div key={mod.id} className="glass-card" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <h4 style={{ fontWeight: 700 }}>📦 Module: {mod.title}</h4>
                <button className="btn btn-secondary btn-sm" onClick={() => { setActiveModId(mod.id); setLessonModalOpen(true); }}>➕ Add Lesson</button>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '10px' }}>
                {mod.lessons.map(l => (
                  <li key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <div>
                      <span>📖 {l.title}</span>
                      <span className="badge badge-info" style={{ fontSize: '8px', marginLeft: '8px' }}>{l.content_type}</span>
                    </div>
                    {l.content_type === 'text' && (
                      <div>
                        <button className="btn btn-secondary btn-sm" style={{ marginRight: '8px' }} onClick={() => { setActiveLesId(l.id); setQuizModalOpen(true); }}>Quiz Creator</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setActiveLesId(l.id); setAssignModalOpen(true); }}>Assignment Creator</button>
                      </div>
                    )}
                  </li>
                ))}
                {mod.lessons.length === 0 && <li className="text-muted" style={{ fontSize: '13px' }}>No lessons inside this module.</li>}
              </ul>
            </div>
          ))
        )}
      </div>

      {/* ADD LESSON MODAL */}
      {lessonModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>📖 Add Lesson to Module</h3>
            <form onSubmit={handleCreateLesson} style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label>Lesson Title</label>
                <input type="text" className="form-control" required placeholder="Lesson 1.3: Intermediate Loops" value={lTitle} onChange={e => setLTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Content Type</label>
                <select className="form-control" value={lType} onChange={e => setLType(e.target.value)}>
                  <option value="text">Rich Text Content</option>
                  <option value="video">External Video URL</option>
                  <option value="scorm">SCORM package metadata (JSON)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Content Body / URL</label>
                <textarea className="form-control" rows="4" placeholder="Write lesson body here, or provide a URL / SCORM metadata JSON..." value={lBody} onChange={e => setLBody(e.target.value)}></textarea>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Add Lesson</button>
                <button type="button" className="btn btn-secondary" onClick={() => setLessonModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUIZ MODAL */}
      {quizModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '580px' }}>
            <h3>📝 Add Assessment Quiz</h3>
            <form onSubmit={handleCreateQuiz} style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label>Quiz Title</label>
                <input type="text" className="form-control" required placeholder="Variables Chapter Quiz" value={qTitle} onChange={e => setQTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Passing Score (%)</label>
                <input type="number" className="form-control" min="10" max="100" value={qPassing} onChange={e => setQPassing(e.target.value)} />
              </div>
              
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px' }}>
                <h5>Question 1</h5>
                <div class="form-group">
                  <label>Question Text</label>
                  <input type="text" className="form-control" placeholder="What is the result of 2 + 2?" required value={qText} onChange={e => setQText(e.target.value)} />
                </div>
                <div class="form-group">
                  <label>Options (Comma separated)</label>
                  <input type="text" className="form-control" placeholder="3, 4, 5, 6" required value={qOptions} onChange={e => setQOptions(e.target.value)} />
                </div>
                <div class="form-group">
                  <label>Correct Option Index (0-based)</label>
                  <input type="number" className="form-control" min="0" max="3" required value={qCorrect} onChange={e => setQCorrect(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Add Quiz</button>
                <button type="button" className="btn btn-secondary" onClick={() => setQuizModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGNMENT MODAL */}
      {assignModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>📤 Add Coding Assignment</h3>
            <form onSubmit={handleCreateAssignment} style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label>Assignment Title</label>
                <input type="text" className="form-control" required placeholder="Homework 1: Node Server Setup" value={assignTitle} onChange={e => setAssignTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Instruction Text</label>
                <textarea className="form-control" rows="3" placeholder="Provide assignment specifications..." required value={assignInstructions} onChange={e => setAssignInstructions(e.target.value)}></textarea>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" className="form-control" required value={assignDue} onChange={e => setAssignDue(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Add Assignment</button>
                <button type="button" className="btn btn-secondary" onClick={() => setAssignModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
