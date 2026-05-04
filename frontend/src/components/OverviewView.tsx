import { useEffect, useState } from 'react';
import { useAuth } from '../store/auth';
import api from '../api/client';

export function OverviewView({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (user?.role === 'admin') api.get('/admin/dashboard/stats').then(r => setStats(r.data.data)).catch(() => {});
  }, [user]);

  if (!user) return null;
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  const MetricCard = ({ label, value, change, positive, icon }: { label: string; value: string | number; change?: string; positive?: boolean; icon: string }) => (
    <div className="card stat-card white">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99,102,241,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`fas ${icon}`} style={{ color: '#818cf8', fontSize: '13px' }}></i>
        </div>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-.02em', lineHeight: 1 }}>{value}</div>
      {change && (
        <div style={{ fontSize: '11px', fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', color: positive ? '#4ade80' : '#f87171' }}>
          <i className={`fas fa-arrow-${positive ? 'up' : 'down'}`} style={{ fontSize: '9px' }}></i> {change}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>{dateStr}</div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-.02em' }}>Welcome {user.name.split(' ')[0]}!</h2>
      </div>

      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '12px' }}>Current Performance</div>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {user.role === 'admin' && stats ? (<>
          <MetricCard label="Total Users" value={stats.total_users} change="+18%" positive icon="fa-users" />
          <MetricCard label="Announcements" value={stats.total_announcements} change="+7%" positive icon="fa-bullhorn" />
          <MetricCard label="Messages" value={stats.unread_messages} change="-3%" positive={false} icon="fa-envelope" />
          <MetricCard label="System Status" value="Online" change="+13%" positive icon="fa-server" />
        </>) : user.role !== 'admin' && (<>
          <MetricCard label="Overall Performance" value="85%" change="+18%" positive icon="fa-chart-line" />
          <MetricCard label="Class Attendance" value="92%" change="+7%" positive icon="fa-calendar-check" />
          <MetricCard label="Assignments" value="Complete" change="-3%" positive={false} icon="fa-tasks" />
          <MetricCard label="Average Grades" value="3.5" change="+13%" positive icon="fa-star" />
        </>)}
      </div>

      <div className="overview-grid-bottom" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '12px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-chart-area" style={{ color: '#818cf8', fontSize: '13px' }}></i> Recent Activity
            </h3>
            <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: '10px' }}>View All</button>
          </div>
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99,102,241,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <i className="fas fa-chart-line" style={{ fontSize: '18px', opacity: .4 }}></i>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600 }}>No recent activity</div>
            <div style={{ fontSize: '11px', marginTop: '4px', color: 'var(--text-muted)' }}>Activity will appear here</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-bolt" style={{ color: '#fbbf24', fontSize: '13px' }}></i> Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="btn-primary" style={{ justifyContent: 'flex-start', display: 'flex', width: '100%' }} onClick={() => setActiveTab('inbox')}><i className="fas fa-pen" style={{ marginRight: '8px' }}></i> Compose Message</button>
            <button className="btn-secondary" style={{ justifyContent: 'flex-start', display: 'flex', width: '100%' }} onClick={() => setActiveTab('schedule')}><i className="fas fa-calendar-alt" style={{ marginRight: '8px' }}></i> View Schedule</button>
            <button className="btn-secondary" style={{ justifyContent: 'flex-start', display: 'flex', width: '100%' }} onClick={() => setActiveTab('settings')}><i className="fas fa-user-edit" style={{ marginRight: '8px' }}></i> Edit Profile</button>
          </div>
        </div>
      </div>
    </div>
  );
}
