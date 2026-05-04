export function toast(msg: string, type: 'info' | 'success' | 'error' = 'info', icon = 'fa-info-circle') {
  let c = document.getElementById('toast-container');
  if (!c) { c = document.createElement('div'); c.id = 'toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fas ${icon}" style="font-size:14px"></i> ${msg}`;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(12px)'; t.style.transition = 'all 0.3s'; setTimeout(() => t.remove(), 300); }, 3000);
}

export function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export function annBorderColor(c: string) {
  return ({ indigo: '#4f46e5', red: '#dc2626', amber: '#d97706', emerald: '#16a34a' } as Record<string, string>)[c] || '#94a3b8';
}

export function annBadgeClass(c: string) {
  return ({ indigo: 'badge-indigo', red: 'badge-red', amber: 'badge-amber', emerald: 'badge-emerald' } as Record<string, string>)[c] || 'badge-slate';
}

export function roleBadge(role: string) {
  if (role === 'admin') return '<span class="role-chip chip-admin" style="font-size:9px"><i class="fas fa-shield-alt"></i> Admin</span>';
  if (role === 'instructor') return '<span class="role-chip chip-instructor" style="font-size:9px"><i class="fas fa-chalkboard-teacher"></i> Instructor</span>';
  return '<span class="role-chip chip-student" style="font-size:9px"><i class="fas fa-user-graduate"></i> Student</span>';
}

export function getTodayName() {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
}

export function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}
