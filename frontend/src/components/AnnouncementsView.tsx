import { useEffect, useState } from 'react';
import { useAuth } from '../store/auth';
import api from '../api/client';
import type { Announcement } from '../types';
import { formatDateTime, annBadgeClass, toast } from '../utils';
import { Modal } from './Modal';

export function AnnouncementsView() {
  const { user } = useAuth();
  const [anns, setAnns] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [annType, setAnnType] = useState('CAMPUS');
  const [target, setTarget] = useState('ALL');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAnns(); }, []);

  const fetchAnns = async () => {
    try { const { data } = await api.get('/announcements'); setAnns(data.data.items); }
    finally { setLoading(false); }
  };

  const deleteAnn = async (id: number) => {
    if (!confirm('Delete this announcement?')) return;
    await api.delete(`/announcements/${id}`);
    toast('Announcement deleted', 'info', 'fa-trash');
    fetchAnns();
  };

  const handleCreate = async () => {
    if (!title.trim() || !body.trim()) { toast('Please fill in all fields', 'error', 'fa-exclamation-circle'); return; }
    setSaving(true);
    try {
      await api.post('/announcements', { title, body, type: annType, target_audience: target });
      toast('Announcement posted!', 'success', 'fa-check-circle');
      setShowCreate(false); setTitle(''); setBody('');
      fetchAnns();
    } catch (e: any) { toast(e.response?.data?.detail || 'Failed to post', 'error', 'fa-times-circle'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px' }}>Announcements</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Stay updated with campus news</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'instructor') && (
          <div className="page-header-actions">
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              <i className="fas fa-plus" style={{ marginRight: '6px' }}></i>Post Announcement
            </button>
          </div>
        )}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {anns.map(a => (
            <div key={a.id} className="card fade-in" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: `var(--${a.color || 'indigo'})` }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ minWidth: 0 }}>
                  <span className={`badge ${annBadgeClass(a.color)}`} style={{ marginBottom: '8px' }}>{a.type}</span>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>{a.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Posted by {a.author_name} • {formatDateTime(a.created_at)}</div>
                </div>
                {(user?.role === 'admin' || user?.id === a.author_id) && (
                  <button onClick={() => deleteAnn(a.id)} style={{ background: 'rgba(220,38,38,0.1)', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: '10px', cursor: 'pointer', flexShrink: 0 }}>
                    <i className="fas fa-trash"></i>
                  </button>
                )}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '16px' }}>{a.body}</div>
            </div>
          ))}
          {anns.length === 0 && <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}><i className="fas fa-bullhorn" style={{ fontSize: '32px', marginBottom: '12px', display: 'block', opacity: 0.5 }}></i>No announcements</div>}
        </div>
      )}

      {showCreate && (
        <Modal onClose={() => setShowCreate(false)} title="Post Announcement" icon="fa-bullhorn">
          <div style={{ marginBottom: 16 }}>
            <label className="label">Title</label>
            <input className="input" placeholder="Announcement title" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label className="label">Type</label>
              <select className="input" value={annType} onChange={e => setAnnType(e.target.value)}>
                <option value="CAMPUS">Campus</option><option value="ACADEMIC">Academic</option>
                <option value="URGENT">Urgent</option><option value="FACULTY">Faculty</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">Target Audience</label>
              <select className="input" value={target} onChange={e => setTarget(e.target.value)}>
                <option value="ALL">All</option><option value="STUDENTS">Students Only</option><option value="FACULTY">Faculty Only</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="label">Content</label>
            <textarea className="input" rows={5} placeholder="Write your announcement..." value={body} onChange={e => setBody(e.target.value)} style={{ resize: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-bullhorn" style={{ marginRight: 6 }}></i>Post</>}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
