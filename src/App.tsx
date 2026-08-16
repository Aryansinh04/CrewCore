// App Component - Crewcore HR Management System
import { useState, useEffect } from 'react';
import { Login } from './pages/Login';
import { Navbar } from './components/Navbar';
import { CandidatePortal } from './pages/CandidatePortal';
import { RecruiterPortal } from './pages/RecruiterPortal';
import { AiBot } from './components/AiBot';

interface UserSession {
  name: string;
  email: string;
  role: 'recruiter' | 'candidate';
}

function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');
  
  // Cross-component triggers from CrewBot AI
  const [activeScenarioTrigger, setActiveScenarioTrigger] = useState<string | null>(null);
  const [autoFillJDText, setAutoFillJDText] = useState<string | null>(null);

  const [theme, setTheme] = useState<'classic' | 'monochrome'>('classic');

  // Restore user session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('crewcore_user');
    const token = localStorage.getItem('crewcore_token');

    if (savedUser) {
      try {
        const parsed: UserSession = JSON.parse(savedUser);
        setUser(parsed);
        setActiveTab(parsed.role === 'recruiter' ? 'dashboard' : 'domains');
      } catch (e) {
        console.error('Error parsing session', e);
      }
    }

    // Sync latest user details from backend database if token exists
    if (token) {
      fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch profile');
      })
      .then(data => {
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem('crewcore_user', JSON.stringify(data.user));
        }
      })
      .catch(err => {
        console.log('Backend profile sync offline or unavailable:', err.message);
      });
    }

    const savedTheme = localStorage.getItem('crewcore_theme') as 'classic' | 'monochrome';
    if (savedTheme) {
      setTheme(savedTheme);
      document.body.classList.toggle('theme-monochrome', savedTheme === 'monochrome');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'classic' ? 'monochrome' : 'classic';
    setTheme(nextTheme);
    localStorage.setItem('crewcore_theme', nextTheme);
    document.body.classList.toggle('theme-monochrome', nextTheme === 'monochrome');
  };

  const handleLoginSuccess = (session: UserSession) => {
    setUser(session);
    localStorage.setItem('crewcore_user', JSON.stringify(session));
    setActiveTab(session.role === 'recruiter' ? 'dashboard' : 'domains');

    const token = localStorage.getItem('crewcore_token');
    if (token && session.name) {
      fetch('http://localhost:5000/api/auth/update-profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: session.name })
      })
      .then(res => {
        if (!res.ok) throw new Error('Update failed');
        console.log('User profile name successfully updated on backend during login/signup');
      })
      .catch(err => {
        console.log('Could not update profile name on server:', err.message);
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('crewcore_user');
    localStorage.removeItem('crewcore_token');
    setUser(null);
    setActiveTab('');
    setActiveScenarioTrigger(null);
    setAutoFillJDText(null);
  };


  // Callback triggers from floating AI bot
  const triggerScenarioFromBot = (scenarioId: string) => {
    setActiveScenarioTrigger(scenarioId);
    setActiveTab('domains'); // Direct candidate to training academy
  };

  const triggerAutoFillJDFromBot = (jdText: string) => {
    setAutoFillJDText(jdText);
    setActiveTab('dashboard'); // Direct recruiter to dashboard generator
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <div className="app-container">
      {/* Dynamic Shared Header */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Core Router Panels */}
      <main className="main-content">
        {user.role === 'candidate' ? (
          <CandidatePortal
            user={user}
            activeTab={activeTab}
            onSelectScenarioFromBot={activeScenarioTrigger}
            onClearScenarioTrigger={() => setActiveScenarioTrigger(null)}
          />
        ) : (
          <RecruiterPortal
            user={user}
            activeTab={activeTab}
            autoFillJDText={autoFillJDText}
            onClearAutoFillJD={() => setAutoFillJDText(null)}
          />
        )}
      </main>

      {/* Context-aware Floating Copilot */}
      <AiBot
        userRole={user.role}
        onStartScenario={triggerScenarioFromBot}
        onAutoFillJD={triggerAutoFillJDFromBot}
      />
    </div>
  );
}

export default App;
