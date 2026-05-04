import { useEffect, useState } from 'react';
import api from '../api/client';
import type { User } from '../types';
import { toast } from '../utils';
import { Modal } from './Modal';

export function UserManagementView() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyAdd = { first_name: '', last_name: '', email: '', password: '', role: 'student', department_section: '', phone: '' };
  const [addForm, setAddForm] = useState(emptyAdd);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', department_section: '', password: '' });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async (q?: string) => {
    try {
      const params = new URLSearchParams({ per_page: '100' });
      if (q) params.set('search', q);
      const { data } = await api.get(`/users?${params.toString()}`);
      setUsers(data.data.items);
    } finally { setLoading(false); }
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    fetchUsers(val || undefined);
  };

  const handleAddUser = async () => {
    const f = addForm;
    if (!f.first_name || !f.last_name || !f.password || !f.department_section) {
      toast('Please fill required fields', 'error', 'fa-exclamation-circle'); return;
    }
    setSaving(true);
    try {
      await api.post('/users', f);
      toast('User created!', 'success', 'fa-check-circle');
      setShowAdd(false); setAddForm(emptyAdd);
      fetchUsers(search || undefined);
    } catch (e: any) { toast(e.response?.data?.detail || 'Failed to create user', 'error', 'fa-times-circle'); }
    finally { setSaving(false); }
  };

  const openEdit = (u: User) => {
    setEditForm({ name: u.name, email: u.email || '', phone: u.phone || '', department_section: u.department_section, password: '' });
    setShowEdit(u);
  };

  const handleEditUser = async () => {
    if (!showEdit) return;
    setSaving(true);
    try {
      const payload: any = { name: editForm.name, email: editForm.email, phone: editForm.phone, department_section: editForm.department_section };
      if (editForm.password) payload.password = editForm.password;
      await api.patch(`/users/${showEdit.id}`, payload);
      toast('User updated!', 'success', 'fa-check-circle');
      setShowEdit(null);
      fetchUsers(search || undefined);
    } catch (e: any) { toast(e.response?.data?.detail || 'Failed to update', 'error', 'fa-times-circle'); }
    finally { setSaving(false); }
  };

  const deleteUser = async (id: string) => {
    if (!confirm(`Delete user ${id}?`)) return;
    try {
      await api.delete(`/users/${id}`);
      toast('User deleted', 'info', 'fa-trash');
      fetchUsers(search || undefined);
    } catch (e: any) { toast(e.response?.data?.detail || 'Failed to delete', 'error', 'fa-times-circle'); }
  };

  const resetSystem = async () => {
    if (!confirm('⚠️ This will reset ALL data to defaults. Are you sure?')) return;
    if (!confirm('This action cannot be undone. Continue?')) return;
    try {
      await api.post('/admin/reset-data');
      toast('System reset complete', 'success', 'fa-redo');
      fetchUsers();
    } catch (e: any) { toast(e.response?.data?.detail || 'Reset failed', 'error', 'fa-times-circle'); }
  };

  const roleBadge = (role: string) => {
    const map: Record<string, { bg: string; color: string; icon: string; label: string }> = {
      admin: { bg: '#fef3c7', color: '#d97706', icon: 'fa-shield-alt', label: 'Admin' },
      instructor: { bg: '#e0e7ff', color: '#4f46e5', icon: 'fa-chalkboard-teacher', label: 'Instructor' },
      student: { bg: '#dcfce7', color: '#16a34a', icon: 'fa-user-graduate', label: 'Student' },
    };
    const r = map[role] || map.student;
    return <span style={{ background: r.bg, color: r.color, padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><i className={`fas ${r.icon}`}></i> {r.label}</span>;
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px' }}>User Management</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Manage system access and accounts</p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={resetSystem} style={{ color: '#dc2626', borderColor: '#fca5a5' }}>
            <i className="fas fa-redo" style={{ marginRight: 6 }}></i>Reset System
          </button>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <i className="fas fa-user-plus" style={{ marginRight: 6 }}></i>Add User
          </button>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative' }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '13px' }}></i>
            <input className="input" style={{ paddingLeft: '38px' }} placeholder="Search by name, ID, or email..." value={search} onChange={e => handleSearch(e.target.value)} />
          </div>
        </div>

        {loading ? <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                {['USER', 'ROLE', 'DEPARTMENT / SECTION', 'STATUS', 'ACTIONS'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '11px' }}>{u.avatar || u.name?.[0]}</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{u.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.id} · {u.email || 'No email'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>{roleBadge(u.role)}</td>
                  <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>{u.department_section}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ color: u.is_active ? '#16a34a' : '#dc2626', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: u.is_active ? '#16a34a' : '#dc2626' }}></span>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(u)} style={{ background: 'rgba(79,70,229,0.1)', color: '#4f46e5', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}><i className="fas fa-pen"></i></button>
                      <button onClick={() => deleteUser(u.id)} style={{ background: 'rgba(220,38,38,0.1)', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}><i className="fas fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && users.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No users found</div>}
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <Modal onClose={() => setShowAdd(false)} title="Add New User" icon="fa-user-plus">
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}><label className="label">First Name *</label><input className="input" placeholder="John" value={addForm.first_name} onChange={e => setAddForm({ ...addForm, first_name: e.target.value })} /></div>
            <div style={{ flex: 1 }}><label className="label">Last Name *</label><input className="input" placeholder="Doe" value={addForm.last_name} onChange={e => setAddForm({ ...addForm, last_name: e.target.value })} /></div>
          </div>
          <div style={{ marginBottom: 16 }}><label className="label">Email</label><input type="email" className="input" placeholder="user@acadsync.edu.ph" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} /></div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}><label className="label">Role *</label><select className="input" value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })}><option value="student">Student</option><option value="instructor">Instructor</option><option value="admin">Admin</option></select></div>
            <div style={{ flex: 2 }}><label className="label">Department / Section *</label><input className="input" placeholder="e.g. BSIT 4A" value={addForm.department_section} onChange={e => setAddForm({ ...addForm, department_section: e.target.value })} /></div>
          </div>
          <div style={{ marginBottom: 20 }}><label className="label">Password *</label><input type="password" className="input" placeholder="Set password" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })} /></div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleAddUser} disabled={saving}>
              {saving ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-user-plus" style={{ marginRight: 6 }}></i>Create User</>}
            </button>
          </div>
        </Modal>
      )}

      {/* Edit User Modal */}
      {showEdit && (
        <Modal onClose={() => setShowEdit(null)} title={`Edit: ${showEdit.name}`} icon="fa-user-edit">
          <div style={{ marginBottom: 16 }}><label className="label">Full Name</label><input className="input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
          <div style={{ marginBottom: 16 }}><label className="label">Email</label><input type="email" className="input" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
          <div style={{ marginBottom: 16 }}><label className="label">Phone</label><input className="input" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
          <div style={{ marginBottom: 16 }}><label className="label">Department / Section</label><input className="input" value={editForm.department_section} onChange={e => setEditForm({ ...editForm, department_section: e.target.value })} /></div>
          <div style={{ marginBottom: 20 }}><label className="label">New Password <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>(leave blank to keep current)</span></label><input type="password" className="input" placeholder="New password" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} /></div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={() => setShowEdit(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleEditUser} disabled={saving}>
              {saving ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-save" style={{ marginRight: 6 }}></i>Save Changes</>}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
