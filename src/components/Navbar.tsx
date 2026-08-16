// Navbar Component - Crewcore HR Management System
import React from 'react';
import { Briefcase, BookOpen, Users, LogOut, Layers, Award, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  user: {
    name: string;
    email: string;
    role: 'recruiter' | 'candidate';
  } | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  theme: 'classic' | 'monochrome';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  theme,
  onToggleTheme,
}) => {
  if (!user) return null;

  const isRecruiter = user.role === 'recruiter';

  const recruiterTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    { id: 'applicants', label: 'Applicants Tracker', icon: Users },
    { id: 'curriculum', label: 'Curriculum & Notes', icon: BookOpen },
  ];

  const candidateTabs = [
    { id: 'domains', label: 'Academy & Domains', icon: BookOpen },
    { id: 'jobs', label: 'Browse Jobs & Apply', icon: Briefcase },
  ];

  const tabs = isRecruiter ? recruiterTabs : candidateTabs;

  return (
    <nav className="glass-panel" style={{
      margin: '1rem 5%',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      position: 'sticky',
      top: '1rem',
      zIndex: 100,
    }}>
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => setActiveTab(tabs[0].id)}>
        <div style={{
          background: isRecruiter ? 'var(--recruiter-gradient)' : 'var(--candidate-gradient)',
          padding: '0.5rem',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isRecruiter ? '0 0 10px var(--recruiter-glow)' : '0 0 10px var(--candidate-glow)'
        }}>
          <Award size={20} color="#fff" />
        </div>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
          Crewcore <span style={{ 
            color: isRecruiter ? 'var(--recruiter-color)' : 'var(--candidate-color)', 
            fontWeight: 400 
          }}>HR</span>
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const activeBg = isRecruiter ? 'var(--active-bg-recruiter)' : 'var(--active-bg-candidate)';
          const activeBorder = isRecruiter ? 'var(--recruiter-color)' : 'var(--candidate-color)';
          const activeText = isRecruiter ? 'var(--recruiter-color)' : 'var(--candidate-color)';

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: isActive ? activeBg : 'transparent',
                border: '1px solid',
                borderColor: isActive ? activeBorder : 'transparent',
                color: isActive ? activeText : 'var(--text-secondary)',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ textAlign: 'right', display: 'block' }}>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              display: 'inline-block',
            }}
          >
            {user.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            <span className={`badge ${isRecruiter ? 'badge-purple' : 'badge-emerald'}`}>
              {isRecruiter ? 'HR Recruiter' : 'HR Aspirant'}
            </span>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '0.4rem',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          title={theme === 'classic' ? 'Switch to Monochrome' : 'Switch to Classic Color'}
        >
          {theme === 'classic' ? <Moon size={14} /> : <Sun size={14} />}
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          style={{
            background: 'var(--logout-bg)',
            border: 'var(--logout-border)',
            color: 'var(--logout-text)',
            padding: '0.4rem 0.75rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            transition: 'all 0.2s',
          }}
          title="Log Out"
        >
          <LogOut size={12} />
          Logout
        </button>
      </div>
    </nav>
  );
};
