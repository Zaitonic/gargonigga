import { useEffect, useState } from 'react';
import { useAuth } from '../store/auth';
import api from '../api/client';
import type { Message } from '../types';
import { formatDateTime, initials, toast } from '../utils';
import { Modal } from './Modal';

export function MessagesView() {
  const { user } = useAuth();
  const [inbox, setInbox] = useState<Message[]>([]);
  const [sent, setSent] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [toId, setToId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [inboxRes, sentRes, contactsRes] = await Promise.all([
        api.get('/messages/inbox'),
        api.get('/messages/sent'),
        api.get('/users/contacts'),
      ]);
      setInbox(inboxRes.data.data.items);
      setSent(sentRes.data.data.items);
      setContacts(contactsRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!toId || !subject.trim() || !body.trim()) {
      toast('Please fill in all fields', 'error', 'fa-exclamation-circle');
      return;
    }
    setSending(true);
    try {
      await api.post('/messages', { to_id: toId, subject, body });
      toast('Message sent!', 'success', 'fa-check-circle');
      setShowCompose(false);
      setToId(''); setSubject(''); setBody('');
      fetchData();
    } catch (e: any) {
      toast(e.response?.data?.detail || 'Failed to send', 'error', 'fa-times-circle');
    } finally {
      setSending(false);
    }
  };

  const markRead = async (m: Message) => {
    if (!m.is_read) {
      await api.patch(`/messages/${m.id}/read`);
    }
    setSelectedMsg(m);
  };

  const renderMsgItem = (m: Message, isReceived: boolean) => (
    <div key={m.id} className={`msg-item ${!m.is_read && isReceived ? 'unread' : ''}`}
      onClick={() => isReceived ? markRead(m) : setSelectedMsg(m)} style={{ cursor: 'pointer' }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '11px' }}>
          {initials(isReceived ? m.from_name : m.to_name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isReceived ? m.from_name : `To: ${m.to_name}`}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>{formatDateTime(m.created_at)}</div>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {m.subject}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {m.body}
          </div>
        </div>
        {!m.is_read && isReceived && <div className="unread-dot"></div>}
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px' }}>Messages</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Direct communication</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary" onClick={() => setShowCompose(true)}>
            <i className="fas fa-pen" style={{ marginRight: '6px' }}></i>Compose
          </button>
        </div>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</div> : (
        <div className="messages-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 280px', gap: '20px' }}>
          <div>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-inbox" style={{ color: '#4f46e5' }}></i> Inbox
                <span style={{ background: '#eef2ff', color: '#4f46e5', padding: '2px 8px', borderRadius: '20px', fontSize: '10px' }}>{inbox.length}</span>
              </div>
              <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                {inbox.length > 0 ? inbox.map(m => renderMsgItem(m, true)) : <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No messages yet</div>}
              </div>
            </div>
          </div>

          <div className="messages-sent-col">
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-paper-plane" style={{ color: '#16a34a' }}></i> Sent
                <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: '20px', fontSize: '10px' }}>{sent.length}</span>
              </div>
              <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                {sent.length > 0 ? sent.map(m => renderMsgItem(m, false)) : <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No sent messages</div>}
              </div>
            </div>
          </div>

          <div className="messages-contacts card" style={{ padding: '20px', overflow: 'hidden' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fas fa-address-book" style={{ color: '#f59e0b' }}></i> Quick Contacts
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '400px', overflowY: 'auto' }}>
              {contacts.slice(0, 8).map(ct => (
                <button key={ct.id} className="contact-btn" onClick={() => { setToId(ct.id); setShowCompose(true); }}>
                  <div className="avatar" style={{ width: '34px', height: '34px', fontSize: '11px' }}>{ct.avatar || initials(ct.name)}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ct.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ct.role}</div>
                  </div>
                </button>
              ))}
              {contacts.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: 12, textAlign: 'center' }}>No contacts available</div>}
            </div>
          </div>
        </div>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <Modal onClose={() => setShowCompose(false)} title="Compose Message" icon="fa-pen" iconColor="#4f46e5">
          <div style={{ marginBottom: 16 }}>
            <label className="label">To</label>
            <select className="input" value={toId} onChange={e => setToId(e.target.value)}>
              <option value="">Select recipient...</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Subject</label>
            <input className="input" placeholder="Message subject" value={subject} onChange={e => setSubject(e.target.value)} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="label">Message</label>
            <textarea className="input" rows={5} placeholder="Write your message..." value={body} onChange={e => setBody(e.target.value)} style={{ resize: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={() => setShowCompose(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSend} disabled={sending}>
              {sending ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-paper-plane" style={{ marginRight: 6 }}></i>Send</>}
            </button>
          </div>
        </Modal>
      )}

      {/* Read Message Modal */}
      {selectedMsg && (
        <Modal onClose={() => { setSelectedMsg(null); fetchData(); }} title={selectedMsg.subject} icon="fa-envelope-open" iconColor="#4f46e5" width={600}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
            <div><strong>From:</strong> {selectedMsg.from_name} ({selectedMsg.from_id})</div>
            <div><strong>To:</strong> {selectedMsg.to_name} ({selectedMsg.to_id})</div>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 16 }}>{formatDateTime(selectedMsg.created_at)}</div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)', padding: 16, background: 'var(--bg-surface)', borderRadius: 12, minHeight: 100 }}>
            {selectedMsg.body}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn-primary" onClick={() => {
              setToId(selectedMsg.from_id === user?.id ? selectedMsg.to_id : selectedMsg.from_id);
              setSubject(`Re: ${selectedMsg.subject}`);
              setSelectedMsg(null);
              setShowCompose(true);
            }}>
              <i className="fas fa-reply" style={{ marginRight: 6 }}></i>Reply
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
