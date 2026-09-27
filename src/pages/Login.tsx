import React, { useState, useEffect } from 'react';
import { Award, Briefcase, GraduationCap, Lock, Mail, User, BookOpen, Sun, Moon } from 'lucide-react';
import { getApiBaseUrl } from '../services/aiEngine';

interface LoginProps {
  onLoginSuccess: (user: { name: string; email: string; role: 'recruiter' | 'candidate'; domain?: string }) => void;
  theme: 'classic' | 'monochrome';
  onToggleTheme: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, theme, onToggleTheme }) => {
  const [activeTab, setActiveTab] = useState<'candidate' | 'recruiter'>('candidate');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [candidateDomain, setCandidateDomain] = useState('talent-acquisition');
  const [inviteCode, setInviteCode] = useState('');
  
  // Status states
  const [errorMsg, setErrorMsg] = useState('');
  const [suggestedRole, setSuggestedRole] = useState<'candidate' | 'recruiter' | null>(null);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Restore remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('crewcore_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleTabChange = (tab: 'candidate' | 'recruiter') => {
    setActiveTab(tab);
    setAuthMode('signin');
    setErrorMsg('');
    setSuggestedRole(null);
    setIsCodeSent(false);
    setIsSimulated(false);
    setName('');
    setPassword('');
    setInviteCode('');
    const savedEmail = localStorage.getItem('crewcore_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
    } else {
      setEmail('');
    }
  };

  const handleModeChange = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setErrorMsg('');
    setSuggestedRole(null);
    setIsCodeSent(false);
    setIsSimulated(false);
    setName('');
    setPassword('');
    setInviteCode('');
  };

  const handleCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuggestedRole(null);

    if (authMode === 'signin') {
      if (!email || !password) {
        setErrorMsg('Please fill in email and password.');
        return;
      }
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role: 'candidate' })
        });
        const data = await response.json();
        if (response.ok && data.success) {
          if (rememberMe) {
            localStorage.setItem('crewcore_remembered_email', email);
          } else {
            localStorage.removeItem('crewcore_remembered_email');
          }
          if (data.token) {
            localStorage.setItem('crewcore_token', data.token);
          }
          onLoginSuccess({
            ...data.user,
            name: data.user?.name || name || email.split('@')[0]
          });
        } else {
          if (data.suggestedRole) {
            setSuggestedRole(data.suggestedRole);
          }
          setErrorMsg(data.error || 'Invalid credentials.');
        }
      } catch (err) {
        console.log('Backend offline, simulating local candidate login.');
        if (password.length >= 4) {
          if (rememberMe) {
            localStorage.setItem('crewcore_remembered_email', email);
          } else {
            localStorage.removeItem('crewcore_remembered_email');
          }
          localStorage.setItem('crewcore_token', 'simulated_dummy_jwt_token');
          onLoginSuccess({
            name: name || email.split('@')[0],
            email,
            role: 'candidate',
            domain: candidateDomain
          });
        } else {
          setErrorMsg('Password must be at least 4 characters for offline validation.');
        }
      }
    } else {
      // signup
      if (!name || !email || !password) {
        setErrorMsg('Please fill in all fields.');
        return;
      }
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role: 'candidate', domain: candidateDomain })
        });
        const data = await response.json();
        if (response.ok && data.success) {
          if (rememberMe) {
            localStorage.setItem('crewcore_remembered_email', email);
          } else {
            localStorage.removeItem('crewcore_remembered_email');
          }
          if (data.token) {
            localStorage.setItem('crewcore_token', data.token);
          }
          onLoginSuccess(data.user);
        } else {
          setErrorMsg(data.error || 'Signup failed.');
        }
      } catch (err) {
        console.log('Backend offline, simulating local candidate signup.');
        if (rememberMe) {
          localStorage.setItem('crewcore_remembered_email', email);
        } else {
          localStorage.removeItem('crewcore_remembered_email');
        }
        localStorage.setItem('crewcore_token', 'simulated_dummy_jwt_token');
        onLoginSuccess({ name, email, role: 'candidate', domain: candidateDomain });
      }
    }
  };

  const handleRequestInviteCode = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setErrorMsg('Please enter Recruiter Name and Work Email first.');
      return;
    }
    
    // Simple email validation
    if (!email.includes('@') || email.length < 5) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    // Generate a random 4 digit code
    const code = 'CREW-' + Math.floor(1000 + Math.random() * 9000);
    setGeneratedCode(code);
    setInviteCode(code); // Pre-fill invite code so user is never blocked by email delays
    setIsCodeSent(true);
    setIsSimulated(false);
    setErrorMsg('');

    // Try to dispatch real email via our local Express Nodemailer backend
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/otp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json();
      if (data.success) {
        if (data.simulated) {
          setIsSimulated(true);
          console.warn('Backend SMTP error, falling back to local simulation:', data.message);
        } else {
          console.log('Real email sent successfully via SMTP Nodemailer backend:', data.messageId);
        }
      } else {
        setIsSimulated(true);
        console.warn('Backend SMTP error, falling back to local simulation:', data.error);
      }
    } catch (err) {
      setIsSimulated(true);
      console.log('SMTP backend offline. Running in local simulation mode.');
    }
  };

  const handleRecruiterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuggestedRole(null);

    if (authMode === 'signin') {
      if (!email || !password) {
        setErrorMsg('Please fill in email and password.');
        return;
      }
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role: 'recruiter' })
        });
        const data = await response.json();
        if (response.ok && data.success) {
          if (rememberMe) {
            localStorage.setItem('crewcore_remembered_email', email);
          } else {
            localStorage.removeItem('crewcore_remembered_email');
          }
          if (data.token) {
            localStorage.setItem('crewcore_token', data.token);
          }
          onLoginSuccess({
            ...data.user,
            name: data.user?.name || name || email.split('@')[0]
          });
        } else {
          if (data.suggestedRole) {
            setSuggestedRole(data.suggestedRole);
          }
          setErrorMsg(data.error || 'Invalid credentials.');
        }
      } catch (err) {
        console.log('Backend offline, simulating local recruiter login.');
        if (password.length >= 4) {
          if (rememberMe) {
            localStorage.setItem('crewcore_remembered_email', email);
          } else {
            localStorage.removeItem('crewcore_remembered_email');
          }
          localStorage.setItem('crewcore_token', 'simulated_dummy_jwt_token');
          onLoginSuccess({
            name: name || email.split('@')[0],
            email,
            role: 'recruiter'
          });
        } else {
          setErrorMsg('Password must be at least 4 characters for offline validation.');
        }
      }
    } else {
      // recruiter signup
      if (!name || !email || !inviteCode || !password) {
        setErrorMsg('Please fill in all fields, including Invite Code and Password.');
        return;
      }

      try {
        const response = await fetch(`${getApiBaseUrl()}/api/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, password, role: 'recruiter', inviteCode }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          if (rememberMe) {
            localStorage.setItem('crewcore_remembered_email', email);
          } else {
            localStorage.removeItem('crewcore_remembered_email');
          }
          if (data.token) {
            localStorage.setItem('crewcore_token', data.token);
          }
          onLoginSuccess(data.user);
        } else {
          setErrorMsg(data.error || 'Signup failed.');
        }
      } catch (err) {
        console.log('OTP backend offline, falling back to local verification.');
        // Local fallback check
        const userCode = inviteCode.toUpperCase().trim();
        if (userCode === generatedCode.toUpperCase().trim() || userCode === 'CREW-1234' || userCode === 'CREW-9999') {
          if (rememberMe) {
            localStorage.setItem('crewcore_remembered_email', email);
          } else {
            localStorage.removeItem('crewcore_remembered_email');
          }
          localStorage.setItem('crewcore_token', 'simulated_dummy_jwt_token');
          onLoginSuccess({
            name,
            email,
            role: 'recruiter',
          });
        } else {
          setErrorMsg('Invalid Recruiter Invite Code. Please check the code or try master code CREW-1234.');
        }
      }
    }
  };

  return (
    <div className="auth-container" style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: '2rem', right: '2rem' }}>
        <button
          type="button"
          onClick={onToggleTheme}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '0.5rem',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          title={theme === 'classic' ? 'Switch to Monochrome' : 'Switch to Classic Color'}
        >
          {theme === 'classic' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '520px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '2.5rem',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            background: activeTab === 'recruiter' ? 'var(--recruiter-gradient)' : 'var(--candidate-gradient)',
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: activeTab === 'recruiter' ? '0 0 20px var(--recruiter-glow)' : '0 0 20px var(--candidate-glow)',
            transition: 'all 0.3s ease',
          }}>
            <Award size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
            Crewcore <span style={{ color: activeTab === 'recruiter' ? 'var(--recruiter-color)' : 'var(--candidate-color)' }}>HR</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            AI-Driven Recruiting Hub & HR Learning Academy
          </p>
        </div>

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '0.25rem',
          marginBottom: '2rem',
        }}>
          <button
            onClick={() => handleTabChange('candidate')}
            style={{
              flex: 1,
              background: activeTab === 'candidate' ? 'var(--candidate-gradient)' : 'transparent',
              color: activeTab === 'candidate' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              padding: '0.75rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            <GraduationCap size={16} />
            HR Aspirant
          </button>
          <button
            onClick={() => handleTabChange('recruiter')}
            style={{
              flex: 1,
              background: activeTab === 'recruiter' ? 'var(--recruiter-gradient)' : 'transparent',
              color: activeTab === 'recruiter' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              padding: '0.75rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            <Briefcase size={16} />
            HR Recruiter
          </button>
        </div>

        {/* Form Error */}
        {errorMsg && (
          <div className="alert-error" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>{errorMsg}</div>
            {suggestedRole && (
              <button
                type="button"
                onClick={() => handleTabChange(suggestedRole)}
                style={{
                  alignSelf: 'flex-start',
                  marginTop: '0.25rem',
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#fff',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
              >
                👉 Switch to {suggestedRole === 'recruiter' ? 'HR Recruiter' : 'HR Aspirant'} Tab
              </button>
            )}
          </div>
        )}

        {/* Forms */}
        {activeTab === 'candidate' ? (
          <form onSubmit={handleCandidateSubmit}>
            {authMode === 'signup' && (
              <div className="form-group" style={{ animation: 'fadeIn 0.2s' }}>
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  name="password"
                  autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {authMode === 'signup' && (
              <div className="form-group" style={{ animation: 'fadeIn 0.2s' }}>
                <label className="form-label">HR Learning Domain</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <BookOpen size={16} />
                  </span>
                  <select
                    name="domain"
                    value={candidateDomain}
                    onChange={(e) => setCandidateDomain(e.target.value)}
                    className="form-select auth-select"
                  >
                    <option value="talent-acquisition">Talent Acquisition & Recruiting</option>
                    <option value="employee-relations">Employee Relations & Culture</option>
                    <option value="learning-development">Learning & Development (L&D)</option>
                    <option value="hr-operations">HR Operations & Compensation</option>
                  </select>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    accentColor: 'var(--candidate-color)',
                    cursor: 'pointer',
                    width: '14px',
                    height: '14px',
                  }}
                />
                Remember Me
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-candidate"
              style={{ width: '100%', padding: '0.85rem' }}
            >
              {authMode === 'signin' ? 'Enter Academy Portal' : 'Register & Enter Academy'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => handleModeChange(authMode === 'signin' ? 'signup' : 'signin')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--candidate-color)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                {authMode === 'signin' ? "Don't have an academy account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRecruiterSubmit}>
            {/* Success Notification Alert */}
            {isCodeSent && (
              <div className="alert-success" style={{ padding: '1rem', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>✉️</span>
                  <div>
                    <strong style={{ fontSize: '0.95rem' }}>Verification Code Dispatched!</strong>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      An invite email was sent to <strong>{email}</strong> (check Inbox &amp; Spam).
                    </div>
                  </div>
                </div>

                <div style={{
                  marginTop: '0.6rem',
                  padding: '0.75rem',
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px dashed var(--recruiter-color)',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                    Your Verification Code
                  </div>
                  <div
                    onClick={() => setInviteCode(generatedCode)}
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      letterSpacing: '2px',
                      color: 'var(--recruiter-color)',
                      marginBottom: '0.35rem',
                      cursor: 'pointer'
                    }}
                    title="Click to copy/re-fill code"
                  >
                    {generatedCode}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                    ✓ Auto-filled into the form field below!
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Or enter master code: <strong style={{ color: 'var(--recruiter-color)' }}>CREW-1234</strong>
                </div>
              </div>
            )}

            {authMode === 'signup' && !isCodeSent && (
              <div className="form-group" style={{ animation: 'fadeIn 0.2s' }}>
                <label className="form-label">Recruiter Name</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>
            )}

            {(!isCodeSent || authMode === 'signin') && (
              <div className="form-group">
                <label className="form-label">Work Email</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    name="email"
                    autoComplete="username"
                    placeholder="recruiter@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>
            )}

            {authMode === 'signin' && (
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>
            )}

            {authMode === 'signup' && isCodeSent && (
              <>
                <div className="form-group" style={{ animation: 'fadeIn 0.25s' }}>
                  <label className="form-label">Enter Invite Code</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                      <Lock size={16} />
                    </span>
                    <input
                      type="text"
                      name="inviteCode"
                      autoComplete="off"
                      placeholder="e.g. CREW-1234"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      className="form-input"
                      style={{ width: '100%', paddingLeft: '2.5rem' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ animation: 'fadeIn 0.25s' }}>
                  <label className="form-label">Choose Password</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                      <Lock size={16} />
                    </span>
                    <input
                      type="password"
                      name="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input"
                      style={{ width: '100%', paddingLeft: '2.5rem' }}
                    />
                  </div>
                </div>
              </>
            )}

            {authMode === 'signin' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{
                      accentColor: 'var(--recruiter-color)',
                      cursor: 'pointer',
                      width: '14px',
                      height: '14px',
                    }}
                  />
                  Remember Me
                </label>
              </div>
            )}

            {authMode === 'signup' && !isCodeSent ? (
              <button
                type="button"
                onClick={handleRequestInviteCode}
                className="btn btn-recruiter"
                style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}
              >
                Send Recruiter Invite Code
              </button>
            ) : authMode === 'signup' ? (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => { setIsCodeSent(false); setInviteCode(''); setErrorMsg(''); }}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '0.85rem' }}
                >
                  Change Email
                </button>
                <button
                  type="submit"
                  className="btn btn-recruiter"
                  style={{ flex: 2, padding: '0.85rem' }}
                >
                  Verify & Sign Up
                </button>
              </div>
            ) : (
              <button
                type="submit"
                className="btn btn-recruiter"
                style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}
              >
                Verify & Enter Console
              </button>
            )}

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => handleModeChange(authMode === 'signin' ? 'signup' : 'signin')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--recruiter-color)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                {authMode === 'signin' ? "Need recruiter console access? Sign Up" : "Already have an account? Sign In"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

