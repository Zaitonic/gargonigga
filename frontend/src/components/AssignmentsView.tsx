import { useEffect, useState } from 'react';
import { useAuth } from '../store/auth';
import api from '../api/client';
import type { Assignment, Submission } from '../types';
import { formatDate, toast } from '../utils';
import { Modal } from './Modal';

export function AssignmentsView() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showSubmit, setShowSubmit] = useState<Assignment | null>(null);
  const [showSubs, setShowSubs] = useState<Assignment | null>(null);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [createForm, setCreateForm] = useState({ course_code: '', course_name: '', title: '', description: '', due_date: '', max_points: 100 });
  const [saving, setSaving] = useState(false);
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [gradeId, setGradeId] = useState<number | null>(null);
  const [gradeVal, setGradeVal] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const isStudent = user?.role === 'student';
  const canCreate = user?.role === 'admin' || user?.role === 'instructor';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try { const { data } = await api.get('/assignments'); setAssignments(data.data.items); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    const f = createForm;
    if (!f.course_code || !f.course_name || !f.title || !f.description || !f.due_date) {
      toast('Please fill in all fields', 'error', 'fa-exclamation-circle'); return;
    }
    setSaving(true);
    try {
      await api.post('/assignments', { ...f, due_date: new Date(f.due_date).toISOString(), max_points: Number(f.max_points) });
      toast('Assignment created!', 'success', 'fa-check-circle');
      setShowCreate(false);
      setCreateForm({ course_code: '', course_name: '', title: '', description: '', due_date: '', max_points: 100 });
      fetchData();
    } catch (e: any) { toast(e.response?.data?.detail || 'Failed to create', 'error', 'fa-times-circle'); }
    finally { setSaving(false); }
  };

  const handleSubmitWork = async () => {
    if (!submitFile || !showSubmit) { toast('Please select a file', 'error', 'fa-exclamation-circle'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('file', submitFile);
      await api.post(`/submissions/${showSubmit.id}/submit`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast('Submitted successfully!', 'success', 'fa-check-circle');
      setShowSubmit(null); setSubmitFile(null);
      fetchData();
    } catch (e: any) { toast(e.response?.data?.detail || 'Failed to submit', 'error', 'fa-times-circle'); }
    finally { setSubmitting(false); }
  };

  const viewSubmissions = async (a: Assignment) => {
    setShowSubs(a); setSubsLoading(true);
    try {
      const { data } = await api.get(`/assignments/${a.id}`);
      setSubs(data.data.submissions || []);
    } finally { setSubsLoading(false); }
  };

  const handleGrade = async (subId: number) => {
    if (!gradeVal) { toast('Enter a grade', 'error', 'fa-exclamation-circle'); return; }
    try {
      await api.patch(`/submissions/${subId}/grade`, { grade: Number(gradeVal), feedback: gradeFeedback || null });
      toast('Graded!', 'success', 'fa-check-circle');
      setGradeId(null); setGradeVal(''); setGradeFeedback('');
      if (showSubs) viewSubmissions(showSubs);
    } catch (e: any) { toast(e.response?.data?.detail || 'Failed to grade', 'error', 'fa-times-circle'); }
  };

  const deleteAssignment = async (id: number) => {
    if (!confirm('Delete this assignment?')) return;
    await api.delete(`/assignments/${id}`);
    toast('Assignment deleted', 'info', 'fa-trash');
    fetchData();
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px' }}>
            {isStudent ? 'My Assignments' : 'Assignment Management'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            {isStudent ? 'Track your coursework' : 'Create assignments and grade submissions'}
          </p>
        </div>
        {canCreate && (
          <div className="page-header-actions">
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              <i className="fas fa-plus" style={{ marginRight: '6px' }}></i>Create Assignment
            </button>
          </div>
        )}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {assignments.map(a => (
            <div key={a.id} className="card fade-in" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <span style={{ background: '#eef2ff', color: '#4f46e5', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 800 }}>{a.course_code}</span>
                    {canCreate && <span style={{ background: '#fef3c7', color: '#d97706', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700 }}>{a.submission_count} SUBMISSIONS</span>}
                    {isStudent && a.submitted_by_me && <span style={{ background: '#dcfce7', color: '#16a34a', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700 }}>✓ SUBMITTED</span>}
                    {isStudent && a.my_grade !== null && a.my_grade !== undefined && <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700 }}>GRADE: {a.my_grade}/{a.max_points}</span>}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>{a.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{a.course_name} · {a.instructor_name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '12px' }}>{a.description}</div>
                  <div style={{ display: 'flex', gap: '24px', marginTop: '14px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    <div><span style={{ color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DUE</span><div style={{ color: 'var(--text-primary)', marginTop: '2px', fontSize: '13px' }}>{formatDate(a.due_date)}</div></div>
                    <div><span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>POINTS</span><div style={{ color: 'var(--text-primary)', marginTop: '2px', fontSize: '13px' }}>{a.max_points}</div></div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                  {canCreate && <button className="btn-secondary" onClick={() => viewSubmissions(a)}>View Submissions</button>}
                  {isStudent && !a.submitted_by_me && <button className="btn-primary" onClick={() => setShowSubmit(a)}><i className="fas fa-upload" style={{ marginRight: 6 }}></i>Submit Work</button>}
                  {canCreate && <button style={{ background: 'rgba(220,38,38,0.1)', color: '#dc2626', border: 'none', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }} onClick={() => deleteAssignment(a.id)}><i className="fas fa-trash" style={{ marginRight: 4 }}></i>Delete</button>}
                </div>
              </div>
            </div>
          ))}
          {assignments.length === 0 && <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}><i className="fas fa-clipboard-list" style={{ fontSize: '32px', marginBottom: '12px', display: 'block', opacity: 0.5 }}></i>No assignments</div>}
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)} title="Create Assignment" icon="fa-clipboard-list" width={580}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}><label className="label">Course Code</label><input className="input" placeholder="e.g. IT401" value={createForm.course_code} onChange={e => setCreateForm({ ...createForm, course_code: e.target.value })} /></div>
            <div style={{ flex: 2 }}><label className="label">Course Name</label><input className="input" placeholder="e.g. Advanced Web Dev" value={createForm.course_name} onChange={e => setCreateForm({ ...createForm, course_name: e.target.value })} /></div>
          </div>
          <div style={{ marginBottom: 16 }}><label className="label">Title</label><input className="input" placeholder="Assignment title" value={createForm.title} onChange={e => setCreateForm({ ...createForm, title: e.target.value })} /></div>
          <div style={{ marginBottom: 16 }}><label className="label">Description</label><textarea className="input" rows={3} placeholder="Instructions..." value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} style={{ resize: 'none' }} /></div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1 }}><label className="label">Due Date</label><input type="datetime-local" className="input" value={createForm.due_date} onChange={e => setCreateForm({ ...createForm, due_date: e.target.value })} /></div>
            <div style={{ flex: 1 }}><label className="label">Max Points</label><input type="number" className="input" value={createForm.max_points} onChange={e => setCreateForm({ ...createForm, max_points: Number(e.target.value) })} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-plus" style={{ marginRight: 6 }}></i>Create</>}
            </button>
          </div>
        </Modal>
      )}

      {/* Submit Work Modal */}
      {showSubmit && (
        <Modal onClose={() => { setShowSubmit(null); setSubmitFile(null); }} title={`Submit: ${showSubmit.title}`} icon="fa-upload" iconColor="#16a34a">
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
              <strong>{showSubmit.course_code}</strong> · Due: {formatDate(showSubmit.due_date)} · {showSubmit.max_points} points
            </div>
            <label className="label">Upload File</label>
            <input type="file" className="input" onChange={e => setSubmitFile(e.target.files?.[0] || null)} style={{ padding: '10px' }} />
            {submitFile && <div style={{ fontSize: 11, color: '#16a34a', marginTop: 8 }}><i className="fas fa-file"></i> {submitFile.name} ({(submitFile.size / 1024).toFixed(1)} KB)</div>}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={() => { setShowSubmit(null); setSubmitFile(null); }}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmitWork} disabled={submitting}>
              {submitting ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-paper-plane" style={{ marginRight: 6 }}></i>Submit</>}
            </button>
          </div>
        </Modal>
      )}

      {/* View Submissions + Grading Modal */}
      {showSubs && (
        <Modal onClose={() => { setShowSubs(null); setGradeId(null); }} title={`Submissions: ${showSubs.title}`} icon="fa-list-check" width={680}>
          {subsLoading ? <div style={{ textAlign: 'center', padding: 32 }}>Loading...</div> : (
            <div>
              {subs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No submissions yet</div>
              ) : (
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {subs.map(s => (
                    <div key={s.id} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{s.student_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.student_id} · {s.file_name} · {formatDate(s.submitted_at)}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {s.grade !== null ? (
                            <span style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>{s.grade}/{showSubs.max_points}</span>
                          ) : gradeId === s.id ? (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <input type="number" min={0} max={showSubs.max_points} className="input" style={{ width: 60, padding: '6px 8px', fontSize: 12 }} placeholder="Grade" value={gradeVal} onChange={e => setGradeVal(e.target.value)} />
                              <input className="input" style={{ width: 120, padding: '6px 8px', fontSize: 12 }} placeholder="Feedback" value={gradeFeedback} onChange={e => setGradeFeedback(e.target.value)} />
                              <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => handleGrade(s.id)}>Save</button>
                              <button className="btn-secondary" style={{ padding: '6px 8px', fontSize: 11 }} onClick={() => setGradeId(null)}>✕</button>
                            </div>
                          ) : (
                            <button className="btn-secondary" style={{ fontSize: 11, padding: '6px 12px' }} onClick={() => { setGradeId(s.id); setGradeVal(''); setGradeFeedback(''); }}>Grade</button>
                          )}
                        </div>
                      </div>
                      {s.feedback && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, fontStyle: 'italic' }}>Feedback: {s.feedback}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
