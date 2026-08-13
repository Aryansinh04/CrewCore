import React, { useState, useEffect } from 'react';
import { MOCK_CANDIDATES, getStoredDomains, saveStoredDomainNotes, resetStoredDomainNotes } from '../data/mockData';
import type { Candidate, HrDomain } from '../data/mockData';
import { aiEngine } from '../services/aiEngine';
import { StudyNotesModal } from '../components/StudyNotesModal';
import { Users, FileText, CheckCircle, HelpCircle, FileSignature, Plus, Trash2, ShieldCheck, Sparkles, BarChart2, BookOpen, RotateCcw, Check, ExternalLink } from 'lucide-react';

interface RecruiterPortalProps {
  user: { name: string; email: string; role: 'recruiter' | 'candidate' };
  activeTab: string;
  autoFillJDText?: string | null;
  onClearAutoFillJD?: () => void;
}

interface Note {
  id: string;
  text: string;
  timestamp: string;
}

export const RecruiterPortal: React.FC<RecruiterPortalProps> = ({
  user,
  activeTab,
  autoFillJDText,
  onClearAutoFillJD,
}) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  
  // Notebook states
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteInput, setNoteInput] = useState('');
  
  // Job Description Generator States
  const [jdTitle, setJdTitle] = useState('Senior Node Developer');
  const [jdDomain, setJdDomain] = useState('talent-acquisition');
  const [jdKeywords, setJdKeywords] = useState('TypeScript, AWS, Docker, Microservices');
  const [generatedJd, setGeneratedJd] = useState('');
  const [isGeneratingJd, setIsGeneratingJd] = useState(false);
  
  // Custom Interview Template States
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  // Curriculum Management States
  const [domains, setDomains] = useState<HrDomain[]>(() => getStoredDomains());
  const [selectedCurriculumDomain, setSelectedCurriculumDomain] = useState<HrDomain | null>(null);
  const [recruiterModalIndex, setRecruiterModalIndex] = useState<number | null>(null);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  const handleSaveRecruiterNote = (domainId: string, moduleTitle: string, newNotes: string) => {
    const updated = saveStoredDomainNotes(domainId, moduleTitle, newNotes);
    setDomains(updated);
    if (selectedCurriculumDomain && selectedCurriculumDomain.id === domainId) {
      setSelectedCurriculumDomain(updated.find(d => d.id === domainId) || null);
    }
    setSaveNotification(`Successfully updated notes for: ${moduleTitle}`);
    setTimeout(() => setSaveNotification(null), 3500);
  };

  // Sync domains state on tab switch
  useEffect(() => {
    if (activeTab === 'curriculum') {
      const refreshed = getStoredDomains();
      setDomains(refreshed);
      setSelectedCurriculumDomain(prev => {
        if (prev) {
          return refreshed.find(d => d.id === prev.id) || refreshed[0];
        }
        return refreshed.length > 0 ? refreshed[0] : null;
      });
    }
  }, [activeTab]);

  // Initialize data (sync with database / localstorage)
  useEffect(() => {
    const syncCandidates = async () => {
      try {
        const token = localStorage.getItem('crewcore_token');
        const response = await fetch('http://localhost:5000/api/candidates', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          // Update candidates list
          setCandidates(data);
          // Sync to local storage for offline redundancy
          localStorage.setItem('crewcore_applications', JSON.stringify(data));
        } else {
          fallbackSync();
        }
      } catch (err) {
        fallbackSync();
      }
    };

    const fallbackSync = () => {
      const savedApps = localStorage.getItem('crewcore_applications');
      if (savedApps) {
        setCandidates(JSON.parse(savedApps));
      } else {
        localStorage.setItem('crewcore_applications', JSON.stringify(MOCK_CANDIDATES));
        setCandidates(MOCK_CANDIDATES);
      }
    };
    
    syncCandidates();
    // Simple polling helper to check if candidates update while bot/candidate submits
    const interval = setInterval(syncCandidates, 3000);
    return () => clearInterval(interval);
  }, []);

  // Autofill JD text if triggered from AI chatbot
  useEffect(() => {
    if (autoFillJDText) {
      setGeneratedJd(autoFillJDText);
      if (onClearAutoFillJD) onClearAutoFillJD();
    }
  }, [autoFillJDText]);

  // Set default selected candidate
  useEffect(() => {
    if (candidates.length > 0 && !selectedCandidate) {
      setSelectedCandidate(candidates[0]);
    }
  }, [candidates]);

  // Load Notes when selected candidate changes
  useEffect(() => {
    const loadNotes = async () => {
      if (!selectedCandidate) return;
      
      try {
        const token = localStorage.getItem('crewcore_token');
        const response = await fetch(`http://localhost:5000/api/candidates/${selectedCandidate.id}/notes`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setNotes(data);
        } else {
          fallbackLoadNotes();
        }
      } catch (err) {
        fallbackLoadNotes();
      }
      setInterviewQuestions([]); // Reset questions view when candidate swaps
    };

    const fallbackLoadNotes = () => {
      if (!selectedCandidate) return;
      const savedNotes = localStorage.getItem(`crewcore_notes_${selectedCandidate.id}`);
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      } else {
        setNotes([]);
      }
    };

    loadNotes();
  }, [selectedCandidate]);

  const handleStatusChange = async (newStatus: Candidate['status']) => {
    if (!selectedCandidate) return;

    // Update locally first for snappiness
    const updatedCandidates = candidates.map(cand => {
      if (cand.id === selectedCandidate.id) {
        const c = { ...cand, status: newStatus };
        setSelectedCandidate(c);
        return c;
      }
      return cand;
    });
    setCandidates(updatedCandidates);

    try {
      const token = localStorage.getItem('crewcore_token');
      const response = await fetch(`http://localhost:5000/api/candidates/${selectedCandidate.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        throw new Error('Failed to patch status on server');
      }
      // Also update local storage for redundancy
      localStorage.setItem('crewcore_applications', JSON.stringify(updatedCandidates));
    } catch (err) {
      console.log('MongoDB server offline, updating status locally only.');
      localStorage.setItem('crewcore_applications', JSON.stringify(updatedCandidates));
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate || !noteInput.trim()) return;

    const noteId = 'note_' + Date.now();
    const newNote: Note = {
      id: noteId,
      text: noteInput,
      timestamp: new Date().toLocaleString(),
    };

    // Update locally first
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setNoteInput('');

    try {
      const token = localStorage.getItem('crewcore_token');
      const response = await fetch(`http://localhost:5000/api/candidates/${selectedCandidate.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          noteId,
          text: newNote.text,
          timestamp: newNote.timestamp,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to save note on server');
      }
      localStorage.setItem(`crewcore_notes_${selectedCandidate.id}`, JSON.stringify(updatedNotes));
    } catch (err) {
      console.log('MongoDB server offline, saving note locally only.');
      localStorage.setItem(`crewcore_notes_${selectedCandidate.id}`, JSON.stringify(updatedNotes));
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!selectedCandidate) return;

    // Update locally first
    const updatedNotes = notes.filter(n => n.id !== noteId);
    setNotes(updatedNotes);

    try {
      const token = localStorage.getItem('crewcore_token');
      const response = await fetch(`http://localhost:5000/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to delete note on server');
      }
      localStorage.setItem(`crewcore_notes_${selectedCandidate.id}`, JSON.stringify(updatedNotes));
    } catch (err) {
      console.log('MongoDB server offline, deleting note locally only.');
      localStorage.setItem(`crewcore_notes_${selectedCandidate.id}`, JSON.stringify(updatedNotes));
    }
  };

  const handleGenerateJd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingJd(true);
    setGeneratedJd('');

    try {
      const keywordsArray = jdKeywords.split(',').map(kw => kw.trim()).filter(Boolean);
      const jd = await aiEngine.generateJobDescription(jdTitle, jdDomain, keywordsArray);
      setGeneratedJd(jd);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingJd(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!selectedCandidate) return;
    setIsGeneratingQuestions(true);
    try {
      const qs = await aiEngine.generateInterviewQuestions(selectedCandidate.domain, 'Senior');
      setInterviewQuestions(qs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Metrics details
  const totalApplied = candidates.length;
  const interviewing = candidates.filter(c => c.status === 'Interviewing').length;
  const hired = candidates.filter(c => c.status === 'Hired').length;
  const avgFitScore = candidates.length > 0 
    ? Math.round(candidates.reduce((acc, c) => acc + c.aiFitScore, 0) / candidates.length)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. RECRUITER DASHBOARD */}
      {activeTab === 'dashboard' && (
        <>
          <div style={{ textAlign: 'center', margin: '1rem 0' }}>
            <h1 className="section-title">HR Recruiter Dashboard</h1>
            <p className="section-desc" style={{ maxWidth: '600px', margin: '0.5rem auto' }}>
              Welcome back, {user.name}! Monitor incoming talent files, inspect AI fit metrics, and generate JDs.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
            marginBottom: '1rem',
          }}>
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{
                background: 'var(--stat-icon-bg)',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--recruiter-color)'
              }}>
                <Users size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Applicants</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{totalApplied}</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{
                background: 'var(--stat-icon-bg)',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--recruiter-color)'
              }}>
                <BarChart2 size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Avg AI Fit Score</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{avgFitScore}%</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{
                background: 'var(--stat-icon-bg)',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--recruiter-color)'
              }}>
                <HelpCircle size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Active Interviews</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{interviewing}</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{
                background: 'var(--stat-icon-bg)',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--recruiter-color)'
              }}>
                <CheckCircle size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Positions Closed</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{hired}</div>
              </div>
            </div>
          </div>

          {/* Job Description Generator Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
            
            {/* Input Config Form */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="var(--recruiter-color)" />
                AI Job Description Generator
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Input core parameters to generate structural recruitment details instantly using local template services.
              </p>

              <form onSubmit={handleGenerateJd} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input
                    type="text"
                    value={jdTitle}
                    onChange={(e) => setJdTitle(e.target.value)}
                    className="form-input"
                    placeholder="e.g. Lead Talent Acquisition Partner"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Domain Area</label>
                  <select
                    value={jdDomain}
                    onChange={(e) => setJdDomain(e.target.value)}
                    className="form-select"
                  >
                    <option value="talent-acquisition">Talent Acquisition</option>
                    <option value="employee-relations">Employee Relations</option>
                    <option value="learning-development">Learning & Development (L&D)</option>
                    <option value="hr-operations">HR Operations & Comp</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Core Skill Keywords (Comma Separated)</label>
                  <input
                    type="text"
                    value={jdKeywords}
                    onChange={(e) => setJdKeywords(e.target.value)}
                    className="form-input"
                    placeholder="e.g. Sourcing, Negotiation, CRM"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isGeneratingJd}
                  className="btn btn-recruiter"
                  style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }}
                >
                  {isGeneratingJd ? 'Generating JD Draft...' : 'Generate JD Draft'}
                </button>
              </form>
            </div>

            {/* Generated output Preview */}
            <div className="glass-panel" style={{ padding: '2rem', height: '495px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Draft Preview Panel
              </h3>

              {isGeneratingJd ? (
                <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
                  <div className="typing-indicator">
                    <span className="typing-dot" style={{ backgroundColor: 'var(--recruiter-color)' }}></span>
                    <span className="typing-dot" style={{ backgroundColor: 'var(--recruiter-color)' }}></span>
                    <span className="typing-dot" style={{ backgroundColor: 'var(--recruiter-color)' }}></span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Compiling markdown template...</div>
                </div>
              ) : generatedJd ? (
                <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <textarea
                    readOnly
                    value={generatedJd}
                    style={{
                      width: '100%',
                      height: '350px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      padding: '1rem',
                      resize: 'none',
                    }}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedJd);
                      alert('Job Description copied to clipboard!');
                    }}
                    className="btn btn-outline"
                    style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                  >
                    Copy Markdown Code
                  </button>
                </div>
              ) : (
                <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                  Provide details and trigger generation on the left panel to compile draft files.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 2. APPLICANT TRACKER TAB */}
      {activeTab === 'applicants' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* Left Column: Candidates list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Active Pipeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '700px', overflowY: 'auto' }}>
              {candidates.map(cand => {
                const isSelected = selectedCandidate?.id === cand.id;
                
                // Color badge based on score
                const scoreColor = cand.aiFitScore >= 90 
                  ? 'var(--score-high)' 
                  : cand.aiFitScore >= 75 
                    ? 'var(--score-mid)' 
                    : 'var(--score-low)';

                return (
                  <div
                    key={cand.id}
                    onClick={() => setSelectedCandidate(cand)}
                    className="glass-panel"
                    style={{
                      padding: '1.25rem 1.5rem',
                      cursor: 'pointer',
                      border: isSelected ? '1px solid var(--recruiter-color)' : '1px solid var(--border-color)',
                      boxShadow: isSelected ? '0 0 10px var(--recruiter-glow)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{cand.name}</h4>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: scoreColor }}>
                        {cand.aiFitScore}% Fit
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {cand.roleApplied}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>📅 {cand.appliedDate}</span>
                      <span className={`badge ${cand.status === 'Hired' ? 'badge-emerald' : cand.status === 'Rejected' ? 'badge-info' : 'badge-purple'}`}>
                        {cand.status}
                      </span>
                    </div>
                  </div>
                );
              })}
              {candidates.length === 0 && (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                  No applications received. Fill and submit forms in the Candidate Portal!
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Detailed Candidate View */}
          {selectedCandidate ? (
            <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Profile Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{selectedCandidate.name}</h2>
                    <span className="badge badge-purple" style={{ textTransform: 'uppercase' }}>{selectedCandidate.domain.replace('-', ' ')}</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {selectedCandidate.email} • Applied for **{selectedCandidate.roleApplied}**
                  </div>
                </div>

                {/* Status Toggler & Score */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div>
                    <label className="form-label" style={{ marginBottom: '0.25rem', fontSize: '0.75rem' }}>Lifecycle State</label>
                    <select
                      value={selectedCandidate.status}
                      onChange={(e) => handleStatusChange(e.target.value as Candidate['status'])}
                      className="form-select"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    >
                      <option value="Applied">Applied</option>
                      <option value="Interviewing">Interviewing</option>
                      <option value="Hired">Hired</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div style={{
                    background: 'var(--stat-icon-bg)',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MATCH SCORE</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--recruiter-color)' }}>{selectedCandidate.aiFitScore}%</div>
                  </div>
                </div>
              </div>

              {/* Detail Tabs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                
                {/* Left Section: Resume and AI report */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={16} color="var(--recruiter-color)" />
                      Resume Content
                    </h3>
                    <div style={{
                      background: 'rgba(0,0,0,0.2)',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '180px',
                      overflowY: 'auto'
                    }}>
                      {selectedCandidate.resumeContent}
                    </div>
                    {selectedCandidate.resumeFile && (
                      <div style={{ 
                        marginTop: '0.75rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        background: 'var(--stat-icon-bg)', 
                        padding: '0.65rem 1rem', 
                        borderRadius: '8px', 
                        border: '1px solid var(--border-color)' 
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-paperclip" style={{ color: 'var(--recruiter-color)' }}><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          Attached File: <strong>{selectedCandidate.resumeFile.fileName}</strong>
                        </span>
                        <a
                          href={`data:${selectedCandidate.resumeFile.contentType};base64,${selectedCandidate.resumeFile.fileData}`}
                          download={selectedCandidate.resumeFile.fileName}
                          style={{ 
                            marginLeft: 'auto', 
                            fontSize: '0.8rem', 
                            color: 'var(--recruiter-color)', 
                            textDecoration: 'none', 
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                          Download
                        </a>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ShieldCheck size={16} color="var(--recruiter-color)" />
                      AI Automated Screening Analysis
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.01)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        {selectedCandidate.aiSummary}
                      </p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--score-high)', marginBottom: '0.25rem' }}>Strengths</div>
                          <ul style={{ paddingLeft: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {selectedCandidate.strengths.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--score-low)', marginBottom: '0.25rem' }}>Gaps</div>
                          <ul style={{ paddingLeft: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {selectedCandidate.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pre-Screening Questions */}
                  {selectedCandidate.screeningAnswers && selectedCandidate.screeningAnswers.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={16} color="var(--recruiter-color)" />
                        Pre-Screening Responses
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {selectedCandidate.screeningAnswers.map((ans, idx) => (
                          <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Q: {ans.question}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>A: {ans.answer}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interview Helpers */}
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <HelpCircle size={16} color="var(--recruiter-color)" />
                      AI Interview Prep Templates
                    </h3>
                    
                    {isGeneratingQuestions ? (
                      <div style={{ padding: '1rem', textAlign: 'center' }}>
                        <div className="typing-indicator">
                          <span className="typing-dot" style={{ backgroundColor: 'var(--recruiter-color)' }}></span>
                          <span className="typing-dot" style={{ backgroundColor: 'var(--recruiter-color)' }}></span>
                          <span className="typing-dot" style={{ backgroundColor: 'var(--recruiter-color)' }}></span>
                        </div>
                      </div>
                    ) : interviewQuestions.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--stat-icon-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        {interviewQuestions.map((q, idx) => (
                          <div key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem' }}>
                            <span style={{ color: 'var(--recruiter-color)', fontWeight: 700 }}>{idx + 1}.</span>
                            <span>{q}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <button
                        onClick={handleGenerateQuestions}
                        className="btn btn-recruiter"
                        style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                      >
                        Compile Custom Interview Guide
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Section: Recruiter Notebook */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileSignature size={16} color="var(--recruiter-color)" />
                    Recruiter Notebook
                  </h3>
                  
                  {/* Notebook input form */}
                  <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Add candidate note..."
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      className="form-input"
                      style={{ flexGrow: 1, fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
                    />
                    <button type="submit" className="btn btn-recruiter" style={{ padding: '0.4rem 0.75rem' }}>
                      <Plus size={14} />
                    </button>
                  </form>

                  {/* Notes List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto' }}>
                    {notes.map(note => (
                      <div
                        key={note.id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '0.5rem',
                          animation: 'fadeIn 0.2s',
                        }}
                      >
                        <div style={{ flexGrow: 1 }}>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>{note.text}</p>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>{note.timestamp}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--trash-color)',
                            cursor: 'pointer',
                            opacity: 0.6,
                            transition: 'opacity 0.2s',
                            padding: '0.2rem',
                          }}
                          onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                          onMouseOut={(e) => e.currentTarget.style.opacity = '0.6'}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    {notes.length === 0 && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem 1rem', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                        No notes captured. Type above and click Plus to record interview feedback.
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-muted)' }}>
              Select a candidate from the left panel to review screening logs and notes.
            </div>
          )}

        </div>
      )}

      {/* 3. CURRICULUM & STUDY NOTES MANAGEMENT TAB */}
      {activeTab === 'curriculum' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', margin: '1rem 0' }}>
            <div>
              <h1 className="section-title">HR Curriculum & Domain Notes Editor</h1>
              <p className="section-desc" style={{ maxWidth: '650px', margin: '0.35rem 0' }}>
                Review, author, and customize interactive reference study notes for each HR specialty division. Notes are synced across the platform.
              </p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Reset all domain study notes back to original default content?')) {
                  const def = resetStoredDomainNotes();
                  setDomains(def);
                  if (selectedCurriculumDomain) {
                    setSelectedCurriculumDomain(def.find(d => d.id === selectedCurriculumDomain.id) || def[0]);
                  }
                  setSaveNotification('All notes have been reset to default templates.');
                  setTimeout(() => setSaveNotification(null), 3000);
                }
              }}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', gap: '0.35rem' }}
            >
              <RotateCcw size={14} />
              Reset All to Defaults
            </button>
          </div>

          {saveNotification && (
            <div style={{
              background: 'var(--alert-success-bg)',
              border: 'var(--alert-success-border)',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              animation: 'fadeIn 0.25s',
            }}>
              <CheckCircle size={16} color="var(--recruiter-color)" />
              {saveNotification}
            </div>
          )}

          {/* Domain Selection Tabs / Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem'
          }}>
            {domains.map(domain => {
              const isSelected = selectedCurriculumDomain?.id === domain.id;
              return (
                <div
                  key={domain.id}
                  onClick={() => {
                    setSelectedCurriculumDomain(domain);
                  }}
                  className="glass-panel"
                  style={{
                    padding: '1.5rem',
                    cursor: 'pointer',
                    border: isSelected ? '1px solid var(--recruiter-color)' : '1px solid var(--border-color)',
                    boxShadow: isSelected ? '0 0 12px var(--recruiter-glow)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    background: 'var(--stat-icon-bg)',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.75rem',
                    color: 'var(--recruiter-color)',
                  }}>
                    <BookOpen size={18} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>{domain.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4', marginBottom: '0.75rem' }}>
                    {domain.shortDesc}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--recruiter-color)', fontWeight: 600 }}>
                    {domain.modules.length} Study Modules {isSelected ? '● Active' : ''}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Domain Modules & Editor */}
          {selectedCurriculumDomain && (
            <div className="glass-panel" style={{ padding: '2.5rem', animation: 'fadeIn 0.3s' }}>
              <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                <span className="badge badge-purple" style={{ marginBottom: '0.5rem' }}>HR Field Specification</span>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem' }}>{selectedCurriculumDomain.title}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5', maxWidth: '800px' }}>
                  {selectedCurriculumDomain.fullDesc}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
                {/* Competencies */}
                <div style={{ background: 'rgba(255,255,255,0.01)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={16} color="var(--recruiter-color)" />
                    Core Competencies
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedCurriculumDomain.skillsNeeded.map((skill, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--recruiter-color)', display: 'flex' }}><Check size={14} /></span>
                        {skill}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modules with Editable Notes Popup */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={16} color="var(--recruiter-color)" />
                      Curriculum Modules & Study Guides
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Click any module to open reader & editor popup
                    </span>
                  </div>

                  {selectedCurriculumDomain.modules.map((mod, index) => {
                    return (
                      <div
                        key={index}
                        onClick={() => setRecruiterModalIndex(index)}
                        className="glass-panel"
                        style={{
                          background: 'rgba(255, 255, 255, 0.015)',
                          padding: '1.25rem 1.5rem',
                          borderRadius: '12px',
                          border: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '1rem',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = 'var(--recruiter-color)';
                          e.currentTarget.style.boxShadow = '0 0 16px var(--recruiter-glow)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {/* Header Content */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                          <div style={{
                            background: 'var(--stat-icon-bg)',
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--recruiter-color)',
                            flexShrink: 0
                          }}>
                            <FileText size={18} />
                          </div>
                          <div>
                            <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                              {mod.title}
                            </h4>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                              {mod.desc}
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                          <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>{mod.duration}</span>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--recruiter-color)',
                            background: 'rgba(139, 92, 246, 0.08)',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(139, 92, 246, 0.2)'
                          }}>
                            <span>Open & Edit</span>
                            <ExternalLink size={13} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Recruiter Study Notes Popup Modal */}
          <StudyNotesModal
            isOpen={recruiterModalIndex !== null}
            onClose={() => setRecruiterModalIndex(null)}
            domain={selectedCurriculumDomain}
            initialModuleIndex={recruiterModalIndex || 0}
            canEdit={true}
            onSaveNote={handleSaveRecruiterNote}
            themeRole="recruiter"
          />
        </>
      )}
    </div>
  );
};
