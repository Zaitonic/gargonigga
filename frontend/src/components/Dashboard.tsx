import { useState, useEffect } from 'react';
import { useAuth } from '../store/auth';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { OverviewView } from './OverviewView';
import { AnnouncementsView } from './AnnouncementsView';
import { MessagesView } from './MessagesView';
import { ScheduleView } from './ScheduleView';
import { AssignmentsView } from './AssignmentsView';
import { SettingsView } from './SettingsView';
import { UserManagementView } from './UserManagementView';

export function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  // Close sidebar on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setSidebarOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewView setActiveTab={handleTabChange} />;
      case 'announcements': return <AnnouncementsView />;
      case 'inbox': return <MessagesView />;
      case 'schedule': return <ScheduleView />;
      case 'assignments': return <AssignmentsView />;
      case 'settings': return <SettingsView />;
      case 'user-management': return user?.role === 'admin' ? <UserManagementView /> : <OverviewView setActiveTab={handleTabChange} />;
      default: return <OverviewView setActiveTab={handleTabChange} />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="sidebar-backdrop visible" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Header activeTab={activeTab} setActiveTab={handleTabChange} onMenuClick={() => setSidebarOpen(true)} />
        <main className="main-content fade-in" style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          {renderContent()}
        </main>
      </div>
      <div id="toast-container"></div>
    </div>
  );
}
