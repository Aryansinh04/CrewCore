// CandidatePortal Component - Crewcore HR Management System
import React, { useState, useEffect } from 'react';
import { MOCK_JOBS, getStoredDomains, saveStoredDomainNotes } from '../data/mockData';
import type { HrDomain, JobListing, Candidate } from '../data/mockData';
import { TRAINING_SCENARIOS } from '../data/trainingScenarios';
import type { TrainingScenario } from '../data/trainingScenarios';
import { aiEngine } from '../services/aiEngine';
import type { ScreeningReport } from '../services/aiEngine';
import { StudyNotesModal } from '../components/StudyNotesModal';
import { BookOpen, Award, ArrowRight, ShieldCheck, Sparkles, Check, ChevronRight, Play, X, FileText, ExternalLink } from 'lucide-react';

interface CandidatePortalProps {
  user: { name: string; email: string; role: 'recruiter' | 'candidate' };
  activeTab: string;
  onSelectScenarioFromBot?: string | null;
  onClearScenarioTrigger?: () => void;
}

export const CandidatePortal: React.FC<CandidatePortalProps> = ({
  user,
  activeTab,
  onSelectScenarioFromBot,
  onClearScenarioTrigger,
}) => {
  const [domains, setDomains] = useState<HrDomain[]>(() => getStoredDomains());
  const [selectedDomain, setSelectedDomain] = useState<HrDomain | null>(null);
  const [modalModuleIndex, setModalModuleIndex] = useState<number | null>(null);

  const handleSaveModalNote = (domainId: string, moduleTitle: string, newNotes: string) => {
    const updated = saveStoredDomainNotes(domainId, moduleTitle, newNotes);
    setDomains(updated);
    if (selectedDomain && selectedDomain.id === domainId) {
      setSelectedDomain(updated.find(d => d.id === domainId) || null);
    }
  };
  
  // Job Board States
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [ans1, setAns1] = useState('');
  const [ans2, setAns2] = useState('');
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [screeningResult, setScreeningResult] = useState<ScreeningReport | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ fileName: string; fileData: string; contentType: string } | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  
  // Training Academy States
  const [activeScenario, setActiveScenario] = useState<TrainingScenario | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string>('');
  const [selectedOptionFeedback, setSelectedOptionFeedback] = useState<string | null>(null);
  const [runningScore, setRunningScore] = useState(0);
  const [completedScenario, setCompletedScenario] = useState(false);

  // Load jobs from DB on mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem('crewcore_token');
        const response = await fetch('http://localhost:5000/api/jobs', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setJobs(data);
        } else {
          setJobs(MOCK_JOBS);
        }
      } catch (err) {
        console.log('Jobs backend offline, using mock jobs.');
        setJobs(MOCK_JOBS);
      }
    };
    fetchJobs();
  }, []);

  // Trigger scenario if launched from AI Bot
  useEffect(() => {
    if (onSelectScenarioFromBot) {
      const scenario = TRAINING_SCENARIOS.find(s => s.id === onSelectScenarioFromBot);
      if (scenario) {
        startScenario(scenario);
      }
      if (onClearScenarioTrigger) onClearScenarioTrigger();
    }
  }, [onSelectScenarioFromBot, onClearScenarioTrigger]);

  // Load a template resume depending on selected job
  useEffect(() => {
    if (selectedJob) {
      setUploadedFile(null); // Clear any uploaded files
      if (selectedJob.domain === 'talent-acquisition') {
        setResumeText(`RESUME: ${user.name.toUpperCase()}\nEmail: ${user.email}\nExperience: 2 years in talent sourcing.\nSkills: Boolean Search, LinkedIn Sourcing, Recruitment coordinator.\nGoal: Sourcing candidates and scheduling panel interviews.`);
        setAns1('I use OR, AND, NOT operators daily to target specific engineering stacks.');
        setAns2('I present the candidates with comprehensive equity models and culture benefits.');
      } else if (selectedJob.domain === 'hr-operations') {
        setResumeText(`RESUME: ${user.name.toUpperCase()}\nEmail: ${user.email}\nExperience: 3 years in payroll support.\nSkills: HRIS, Excel spreadsheets, ADP, employee record tracking.\nGoal: Moving employee directories and balancing monthly accounts.`);
        setAns1('Highly proficient in Excel formulas, BambooHR configurations, and Gusto.');
        setAns2('I negotiate insurance carrier packages to minimize premium hikes.');
      } else {
        setResumeText(`RESUME: ${user.name.toUpperCase()}\nEmail: ${user.email}\nExperience: 2 years in human relations.\nSkills: Dispute mediation, employee surveys, drafting handbook drafts.\nGoal: Coordinating grievances and planning D&I programs.`);
        setAns1('I interview both parties separately first, then mediate a mutual pilot agreement.');
        setAns2('I collaborate with legal teams and employee resources groups to ensure safety.');
      }
    }
  }, [selectedJob, user]);

  const handleFileProcessing = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const base64Data = result.split(',')[1];
      setUploadedFile({
        fileName: file.name,
        fileData: base64Data,
        contentType: file.type || 'application/octet-stream'
      });

      // If it's a text file, populate the text area
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const textReader = new FileReader();
        textReader.onload = (tEvent) => {
          setResumeText(tEvent.target?.result as string);
        };
        textReader.readAsText(file);
      } else {
        // Non-text file, set a placeholder so the mock AI vetting can proceed
        setResumeText(`[RESUME FILE: ${file.name}]\nFormat: ${file.type || 'binary/unknown'}\nSize: ${(file.size / 1024).toFixed(1)} KB\n\nSkills and qualifications have been saved as binary data to the candidate file.`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    setIsSubmittingApp(true);
    setScreeningResult(null);

    const answers = [
      { question: selectedJob.requirements[0], answer: ans1 },
      { question: selectedJob.requirements[1], answer: ans2 }
    ];

    try {
      // Run AI screening
      const result = await aiEngine.screenCandidateApplication(resumeText, answers);
      setScreeningResult(result);

      // Save application record to localStorage so Recruiter dashboard sees it
      const appRecord: Candidate = {
        id: 'cand_' + Date.now(),
        name: user.name,
        email: user.email,
        domain: selectedJob.domain,
        roleApplied: selectedJob.title,
        appliedDate: new Date().toISOString().split('T')[0],
        status: 'Applied',
        resumeContent: resumeText,
        resumeFile: uploadedFile || undefined,
        screeningAnswers: answers,
        aiFitScore: result.score,
        aiSummary: result.summary,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
      };

      // Save application record to MongoDB
      try {
        const token = localStorage.getItem('crewcore_token');
        const response = await fetch('http://localhost:5000/api/candidates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(appRecord),
        });
        if (!response.ok) {
          throw new Error('Failed to save to MongoDB backend');
        }
        console.log('Successfully saved application to MongoDB.');
      } catch (dbErr) {
        console.log('MongoDB backend offline, falling back to local storage.');
        const existingApps = localStorage.getItem('crewcore_applications');
        const apps = existingApps ? JSON.parse(existingApps) : [];
        apps.unshift(appRecord);
        localStorage.setItem('crewcore_applications', JSON.stringify(apps));
      }

    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingApp(false);
    }
  };

  const startScenario = (scenario: TrainingScenario) => {
    setActiveScenario(scenario);
    setCurrentNodeId(scenario.firstNodeId);
    setRunningScore(0);
    setSelectedOptionFeedback(null);
    setCompletedScenario(false);
  };

  const handleOptionSelect = (option: { text: string; nextNodeId: string; scoreFeedback: string; points: number }) => {
    setSelectedOptionFeedback(option.scoreFeedback);
    setRunningScore(prev => prev + option.points);
    
    setTimeout(() => {
      setSelectedOptionFeedback(null);
      if (option.nextNodeId && activeScenario?.nodes[option.nextNodeId]) {
        setCurrentNodeId(option.nextNodeId);
      } else {
        setCompletedScenario(true);
      }
    }, 3500); // Display feedback score for 3.5s before moving
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. ACADEMY & DOMAINS TAB */}
      {activeTab === 'domains' && !activeScenario && (
        <>
          <div style={{ textAlign: 'center', margin: '1rem 0' }}>
            <h1 className="section-title">HR Training Academy & Domains</h1>
            <p className="section-desc" style={{ maxWidth: '600px', margin: '0.5rem auto' }}>
              Explore core HR divisions, learn theoretical competencies, and practice real mediation roleplay scenarios driven by CrewBot AI.
            </p>
          </div>

          {/* Grid of Domains */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {domains.map(domain => {
              const isSelected = selectedDomain?.id === domain.id;
              return (
                <div
                  key={domain.id}
                  onClick={() => {
                    const latestDomain = domains.find(d => d.id === domain.id) || domain;
                    setSelectedDomain(isSelected ? null : latestDomain);
                  }}
                  className="glass-panel"
                  style={{
                    padding: '2rem',
                    cursor: 'pointer',
                    border: isSelected ? '1px solid var(--candidate-color)' : '1px solid var(--border-color)',
                    boxShadow: isSelected ? '0 0 15px var(--candidate-glow)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    background: 'var(--candidate-icon-bg)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    color: 'var(--candidate-color)',
                  }}>
                    <BookOpen size={20} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{domain.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1rem' }}>
                    {domain.shortDesc}
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.85rem',
                    color: 'var(--candidate-color)',
                    fontWeight: 600,
                  }}>
                    {isSelected ? 'Collapse Details' : 'View Training Details'}
                    <ChevronRight size={14} style={{ transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expanded Domain Detail */}
          {selectedDomain && (
            <div className="glass-panel" style={{ padding: '2.5rem', animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ maxWidth: '750px' }}>
                  <span className="badge badge-emerald" style={{ marginBottom: '0.5rem' }}>HR Field Spec</span>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>{selectedDomain.title}</h2>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '1rem' }}>
                    {selectedDomain.fullDesc}
                  </p>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  minWidth: '220px',
                }}>
                  <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Interactive Roleplay
                  </h4>
                  {TRAINING_SCENARIOS.filter(s => s.domain === selectedDomain.id).map(scenario => (
                    <button
                      key={scenario.id}
                      onClick={() => startScenario(scenario)}
                      className="btn btn-candidate"
                      style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', width: '100%', gap: '0.25rem' }}
                    >
                      <Play size={12} fill="#fff" />
                      Start Scenario
                    </button>
                  ))}
                  {TRAINING_SCENARIOS.filter(s => s.domain === selectedDomain.id).length === 0 && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      No live scenario. Ask CrewBot AI for custom mock cases!
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                {/* Core Competencies */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} color="var(--candidate-color)" />
                    Key Competencies & Skills
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedDomain.skillsNeeded.map((skill, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--candidate-color)', display: 'flex' }}><Check size={14} /></span>
                        {skill}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Training Modules with Study Notes */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <BookOpen size={18} color="var(--candidate-color)" />
                      Curriculum & Study Guides
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Click any module to open reader popup
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {selectedDomain.modules.map((mod, index) => {
                      return (
                        <div
                          key={index}
                          onClick={() => setModalModuleIndex(index)}
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
                            e.currentTarget.style.borderColor = 'var(--candidate-color)';
                            e.currentTarget.style.boxShadow = '0 0 16px var(--candidate-glow)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                            <div style={{
                              background: 'var(--candidate-icon-bg)',
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--candidate-color)',
                              flexShrink: 0
                            }}>
                              <FileText size={18} />
                            </div>
                            <div>
                              <div style={{
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                marginBottom: '0.2rem'
                              }}>
                                {mod.title}
                              </div>
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                {mod.desc}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                            <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>{mod.duration}</span>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: 'var(--candidate-color)',
                              background: 'rgba(52, 211, 153, 0.08)',
                              padding: '0.35rem 0.75rem',
                              borderRadius: '6px',
                              border: '1px solid rgba(52, 211, 153, 0.2)'
                            }}>
                              <span>Read Notes</span>
                              <ExternalLink size={13} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Study Notes Popup Reader */}
          <StudyNotesModal
            isOpen={modalModuleIndex !== null}
            onClose={() => setModalModuleIndex(null)}
            domain={selectedDomain}
            initialModuleIndex={modalModuleIndex || 0}
            canEdit={user.role === 'recruiter'}
            onSaveNote={handleSaveModalNote}
            themeRole="candidate"
          />
        </>
      )}

      {/* 2. BROWSE JOBS & APPLY TAB */}
      {activeTab === 'jobs' && (
        <>
          <div style={{ textAlign: 'center', margin: '1rem 0' }}>
            <h1 className="section-title">Job Board & AI Pre-Screening</h1>
            <p className="section-desc" style={{ maxWidth: '600px', margin: '0.5rem auto' }}>
              Select a mock job, construct your applicant files, and submit them to trigger immediate AI vetting match scoring.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: selectedJob ? '1fr 1fr' : '1fr', gap: '2rem', alignItems: 'start' }}>
            {/* Jobs List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {jobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => { setSelectedJob(job); setIsApplying(false); setScreeningResult(null); }}
                  className="glass-panel"
                  style={{
                    padding: '1.5rem 2rem',
                    cursor: 'pointer',
                    border: selectedJob?.id === job.id ? '1px solid var(--candidate-color)' : '1px solid var(--border-color)',
                    boxShadow: selectedJob?.id === job.id ? '0 0 15px var(--candidate-glow)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{job.title}</h3>
                    <span className="badge badge-emerald">{job.type}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                    <span>📍 {job.location}</span>
                    <span>💼 Exp: {job.experience}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {job.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Selected Job Panel */}
            {selectedJob && (
              <div className="glass-panel" style={{ padding: '2rem', animation: 'fadeIn 0.3s' }}>
                {!isApplying ? (
                  <>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{selectedJob.title}</h2>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                      <span className="badge badge-emerald">{selectedJob.type}</span>
                      <span className="badge badge-info">{selectedJob.experience}</span>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Description</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>{selectedJob.description}</p>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Prerequisites</h4>
                      <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {selectedJob.requirements.map((req, i) => <li key={i}>{req}</li>)}
                      </ul>
                    </div>

                    <button
                      onClick={() => setIsApplying(true)}
                      className="btn btn-candidate"
                      style={{ width: '100%', padding: '0.85rem' }}
                    >
                      Apply & Test Your Fit
                    </button>
                  </>
                ) : (
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Apply: {selectedJob.title}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                      Complete the details below. CrewBot AI will scan your profile immediately to compile recruiter assessment analytics.
                    </p>

                    {isSubmittingApp ? (
                      <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                        <div className="typing-indicator" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
                          <span className="typing-dot" style={{ width: '10px', height: '10px', backgroundColor: 'var(--candidate-color)' }}></span>
                          <span className="typing-dot" style={{ width: '10px', height: '10px', backgroundColor: 'var(--candidate-color)' }}></span>
                          <span className="typing-dot" style={{ width: '10px', height: '10px', backgroundColor: 'var(--candidate-color)' }}></span>
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>CrewBot is Screening Application...</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Parsing resume keywords, checking competency matching, scoring question responses.</p>
                      </div>
                    ) : screeningResult ? (
                      <div style={{ animation: 'fadeIn 0.25s' }}>
                        {/* Result Score */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          background: 'var(--alert-success-bg)',
                          padding: '1.25rem',
                          borderRadius: '12px',
                          border: 'var(--alert-success-border)',
                          marginBottom: '1.5rem'
                        }}>
                          <div style={{
                            background: 'var(--candidate-gradient)',
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.35rem',
                            fontWeight: 800,
                            color: '#fff',
                            boxShadow: '0 0 15px var(--candidate-glow)'
                          }}>
                            {screeningResult.score}%
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>AI Fit Match Score</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Successfully submitted to the recruiter database.</div>
                          </div>
                        </div>

                        <div style={{ marginBottom: '1.25rem' }}>
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Fit Assessment</h4>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>{screeningResult.summary}</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                          <div>
                            <h5 style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 700, marginBottom: '0.5rem' }}>Strengths</h5>
                            <ul style={{ paddingLeft: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {screeningResult.strengths.map((s, idx) => <li key={idx}>{s}</li>)}
                            </ul>
                          </div>
                          <div>
                            <h5 style={{ fontSize: '0.8rem', color: 'var(--color-warning)', fontWeight: 700, marginBottom: '0.5rem' }}>Areas to Improve</h5>
                            <ul style={{ paddingLeft: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {screeningResult.weaknesses.map((w, idx) => <li key={idx}>{w}</li>)}
                            </ul>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => setIsApplying(false)}
                            className="btn btn-outline"
                            style={{ flex: 1 }}
                          >
                            Back to Details
                          </button>
                          <button
                            onClick={() => { setScreeningResult(null); setUploadedFile(null); }}
                            className="btn btn-candidate"
                            style={{ flex: 1 }}
                          >
                            Re-Apply & Retest
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label">Upload Resume File</label>
                          
                          {/* Drag and Drop Zone */}
                          <div 
                            className={`upload-zone ${isDragActive ? 'active' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
                            onDragLeave={() => setIsDragActive(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDragActive(false);
                              const file = e.dataTransfer.files?.[0];
                              if (file) handleFileProcessing(file);
                            }}
                            onClick={() => document.getElementById('file-upload-input')?.click()}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload-cloud" style={{ color: 'var(--candidate-color)', marginBottom: '0.25rem' }}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                              {uploadedFile ? `Change File: ${uploadedFile.fileName}` : 'Drag & drop file here or click to browse'}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              Supports PDF, TXT, DOCX, etc. (Max 10MB)
                            </span>
                          </div>
                          
                          <input 
                            id="file-upload-input"
                            type="file" 
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileProcessing(file);
                            }}
                          />

                          {uploadedFile && (
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem', 
                              background: 'var(--file-attached-bg)', 
                              padding: '0.5rem 1rem', 
                              borderRadius: '6px', 
                              border: 'var(--file-attached-border)',
                              fontSize: '0.85rem',
                              marginBottom: '0.5rem'
                            }}>
                              <span style={{ color: 'var(--candidate-color)' }}>✓</span>
                              <span style={{ flexGrow: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                Attached: <strong>{uploadedFile.fileName}</strong>
                              </span>
                              <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }} 
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                              >
                                Remove
                              </button>
                            </div>
                          )}

                          <label className="form-label" style={{ marginTop: '0.5rem' }}>Parsed Resume Text (AI Vetting View)</label>
                          <textarea
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            className="form-textarea"
                            style={{ fontSize: '0.85rem' }}
                            placeholder="File text content will be parsed here automatically. You can also edit it manually."
                          />
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                            Pre-Screening Competency Prompts
                          </h4>
                          
                          <div className="form-group">
                            <label className="form-label" style={{ textTransform: 'none', fontWeight: 600 }}>
                              Q1: {selectedJob.requirements[0]}
                            </label>
                            <input
                              type="text"
                              value={ans1}
                              onChange={(e) => setAns1(e.target.value)}
                              className="form-input"
                              placeholder="Type response..."
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label" style={{ textTransform: 'none', fontWeight: 600 }}>
                              Q2: {selectedJob.requirements[1]}
                            </label>
                            <input
                              type="text"
                              value={ans2}
                              onChange={(e) => setAns2(e.target.value)}
                              className="form-input"
                              placeholder="Type response..."
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                          <button
                            type="button"
                            onClick={() => setIsApplying(false)}
                            className="btn btn-outline"
                            style={{ flex: 1 }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-candidate"
                            style={{ flex: 2 }}
                          >
                            Submit to AI Screener
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* 3. ACTIVE TRAINING SCENARIO (medating/negation screen) */}
      {activeScenario && (
        <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            background: 'var(--candidate-gradient)',
            padding: '1.25rem 2rem',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 0 15px var(--candidate-glow)'
          }}>
            <div>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', marginBottom: '0.25rem' }}>
                {activeScenario.difficulty} • {activeScenario.role}
              </span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>{activeScenario.title}</h2>
            </div>
            <button
              onClick={() => setActiveScenario(null)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Intro Screen */}
          {currentNodeId === activeScenario.firstNodeId && !selectedOptionFeedback && (
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              padding: '1.5rem 2rem',
              borderBottom: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
            }}>
              <Sparkles size={24} color="var(--candidate-color)" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Scenario Context:</strong> {activeScenario.intro}
              </div>
            </div>
          )}

          {/* Dialogue Content */}
          <div style={{
            padding: '2.5rem 2rem',
            background: 'rgba(6, 7, 10, 0.96)',
            minHeight: '280px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            color: '#f8fafc',
          }}>
            {completedScenario ? (
              <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s' }}>
                <div style={{
                  background: 'var(--alert-success-bg)',
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  color: 'var(--candidate-color)',
                  border: '2px solid var(--candidate-color-dark)',
                  boxShadow: '0 0 20px var(--candidate-glow)'
                }}>
                  <Award size={36} />
                </div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: '#f8fafc' }}>Scenario Concluded</h2>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                  You completed the training simulation successfully.
                </p>
                
                {/* Score badge */}
                <div className="glass-panel" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  padding: '1rem 2rem',
                  marginBottom: '2rem',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Academy Score</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--candidate-color)' }}>{runningScore} Pts</div>
                  </div>
                  <div style={{ borderLeft: '1px solid var(--border-color)', height: '40px' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Performance</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                      {runningScore >= 60 ? '🏆 Honors Expert' : runningScore >= 40 ? '✅ Pass Certificate' : '⚠️ Retake Needed'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button 
                    onClick={() => setActiveScenario(null)} 
                    className="btn btn-outline"
                    style={{ color: '#f8fafc', borderColor: 'rgba(255,255,255,0.15)' }}
                  >
                    Return to Academy
                  </button>
                  <button onClick={() => startScenario(activeScenario)} className="btn btn-candidate">
                    Retry Scenario
                  </button>
                </div>
              </div>
            ) : selectedOptionFeedback ? (
              <div style={{ textAlign: 'center', animation: 'fadeIn 0.2s', padding: '1rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Coach Assessment Feedback
                </div>
                <p style={{ fontSize: '1.25rem', color: '#fff', lineHeight: '1.5', maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
                  "{selectedOptionFeedback}"
                </p>
                <div className="typing-indicator" style={{ display: 'inline-flex' }}>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Bot Speaker message */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--candidate-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                    boxShadow: '0 0 10px var(--candidate-glow)'
                  }}>
                    CB
                  </div>
                  <div className="glass-panel" style={{
                    padding: '1.1rem 1.4rem',
                    borderRadius: '16px',
                    borderTopLeftRadius: '2px',
                    fontSize: '1rem',
                    lineHeight: '1.5',
                    color: 'var(--text-primary)',
                    flexGrow: 1,
                  }}>
                    {activeScenario.nodes[currentNodeId]?.botMessage}
                  </div>
                </div>

                {/* Choices list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Select your HR Response:
                  </div>
                  {activeScenario.nodes[currentNodeId]?.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleOptionSelect(opt)}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '1rem 1.25rem',
                        color: '#f8fafc',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        lineHeight: '1.4',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = 'var(--candidate-color)';
                        e.currentTarget.style.background = 'var(--candidate-icon-bg)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                      }}
                    >
                      <span>{opt.text}</span>
                      <ArrowRight size={14} style={{ flexShrink: 0 }} />
                    </button>
                  ))}
                  {/* End Case fallback */}
                  {(!activeScenario.nodes[currentNodeId]?.options || activeScenario.nodes[currentNodeId]?.options.length === 0) && (
                    <button
                      onClick={() => setCompletedScenario(true)}
                      className="btn btn-candidate"
                      style={{ width: '100%', padding: '0.85rem' }}
                    >
                      Conclude Roleplay Simulation
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
