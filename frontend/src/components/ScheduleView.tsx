import { useEffect, useState } from 'react';
import { useAuth } from '../store/auth';
import api from '../api/client';
import type { Schedule } from '../types';
import { toast, getTodayName } from '../utils';
import { Modal } from './Modal';

export function ScheduleView() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ course_code: '', course_label: '', day_of_week: 'Monday', start_time: '08:00', end_time: '09:30', room_location: '', section_or_instructor: '' });
  const [saving, setSaving] = useState(false);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const isIns = user?.role === 'instructor';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try { const { data } = await api.get('/schedules'); setSchedule(data.data); }
    finally { setLoading(false); }
  };

  const removeSchedule = async (id: number) => {
    if (!confirm('Remove this class?')) return;
    try { await api.delete(`/schedules/${id}`); fetchData(); }
    catch { toast('Error removing class', 'error', 'fa-times-circle'); }
  };

  const handleAdd = async () => {
    if (!form.course_code || !form.course_label || !form.room_location || !form.section_or_instructor) {
      toast('Please fill in all fields', 'error', 'fa-exclamation-circle'); return;
    }
    setSaving(true);
    try {
      await api.post('/schedules', form);
      toast('Class added!', 'success', 'fa-check-circle');
      setShowAdd(false);
      setForm({ course_code: '', course_label: '', day_of_week: 'Monday', start_time: '08:00', end_time: '09:30', room_location: '', section_or_instructor: '' });
      fetchData();
    } catch (e: any) { toast(e.response?.data?.detail || 'Failed to add', 'error', 'fa-times-circle'); }
    finally { setSaving(false); }
  };

  const renderSchedPill = (s: Schedule) => (
    <div key={s.id} className="sched-pill" style={{ position: 'relative', overflow: 'hidden' }}>
      <button onClick={() => removeSchedule(s.id)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '4px' }}>
        <i className="fas fa-times"></i>
      </button>
      <div style={{ fontSize: '10px', opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{s.start_time}-{s.end_time}</div>
      <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '2px' }}>{s.course_code}</div>
      <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '8px' }}>{s.course_label}</div>
      <div style={{ fontSize: '10px', background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <i className="fas fa-map-marker-alt"></i> {s.room_location}
      </div>
      <div style={{ fontSize: '10px', marginTop: '6px', opacity: 0.8 }}>
        <i className={isIns ? 'fas fa-users' : 'fas fa-chalkboard-teacher'}></i> {s.section_or_instructor}
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px' }}>Class Schedule</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{isIns ? 'Your teaching schedule' : 'Your enrolled classes'} this semester</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <i className="fas fa-plus" style={{ marginRight: '6px' }}></i>Add Class
          </button>
        </div>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</div> : (
        <div className="card fade-in" style={{ overflow: 'hidden' }}>
          <div className="schedule-grid-header" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
            {days.map(day => (
              <div key={day} style={{ padding: '14px', textAlign: 'center', borderRight: '1px solid var(--border)', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {day === getTodayName() ? <span style={{ background: '#4f46e5', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '11px' }}>{day}</span> : day}
              </div>
            ))}
          </div>
          <div className="schedule-grid-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', minHeight: '360px' }}>
            {days.map((day, i) => {
              const slots = schedule.filter(s => s.day_of_week === day);
              return (
                <div key={day} className="schedule-day-col" style={{ borderRight: i === 4 ? 'none' : '1px solid var(--border)', padding: '12px' }}>
                  <div className="schedule-day-label" style={{ display: 'none' }}>
                    {day === getTodayName() ? <span style={{ background: '#4f46e5', color: 'white', padding: '3px 10px', borderRadius: '20px', fontSize: '11px' }}>{day} (Today)</span> : day}
                  </div>
                  {slots.length > 0 ? slots.map(renderSchedPill) : <div style={{ textAlign: 'center', padding: '24px 8px', color: 'var(--text-muted)', fontSize: '11px' }}>No class</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showAdd && (
        <Modal onClose={() => setShowAdd(false)} title="Add Class" icon="fa-calendar-plus">
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label className="label">Course Code</label>
              <input className="input" placeholder="e.g. IT401" value={form.course_code} onChange={e => setForm({ ...form, course_code: e.target.value })} />
            </div>
            <div style={{ flex: 2 }}>
              <label className="label">Course Name</label>
              <input className="input" placeholder="e.g. Advanced Web Dev" value={form.course_label} onChange={e => setForm({ ...form, course_label: e.target.value })} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Day of Week</label>
            <select className="input" value={form.day_of_week} onChange={e => setForm({ ...form, day_of_week: e.target.value })}>
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}><label className="label">Start Time</label><input type="time" className="input" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} /></div>
            <div style={{ flex: 1 }}><label className="label">End Time</label><input type="time" className="input" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} /></div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1 }}><label className="label">Room / Location</label><input className="input" placeholder="e.g. Room 401" value={form.room_location} onChange={e => setForm({ ...form, room_location: e.target.value })} /></div>
            <div style={{ flex: 1 }}><label className="label">{isIns ? 'Section' : 'Instructor'}</label><input className="input" placeholder={isIns ? 'e.g. BSIT 4A' : 'e.g. Prof. Lim'} value={form.section_or_instructor} onChange={e => setForm({ ...form, section_or_instructor: e.target.value })} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleAdd} disabled={saving}>
              {saving ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-plus" style={{ marginRight: 6 }}></i>Add Class</>}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
