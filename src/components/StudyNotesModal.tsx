// StudyNotesModal Component - Realistic Interactive E-Learning Reader Popup
import React, { useState, useEffect } from 'react';
import type { HrDomain, HrModule } from '../data/mockData';
import { 
  X, 
  BookOpen, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Copy, 
  Check, 
  Edit3, 
  Save, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles
} from 'lucide-react';

interface StudyNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain: HrDomain | null;
  initialModuleIndex: number;
  canEdit: boolean;
  onSaveNote: (domainId: string, moduleTitle: string, newNotes: string) => void;
  themeRole?: 'candidate' | 'recruiter';
}

export const StudyNotesModal: React.FC<StudyNotesModalProps> = ({
  isOpen,
  onClose,
  domain,
  initialModuleIndex,
  canEdit,
  onSaveNote,
  themeRole = 'candidate',
}) => {
  const [currentModuleIndex, setCurrentModuleIndex] = useState<number>(initialModuleIndex);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setCurrentModuleIndex(initialModuleIndex);
    setIsEditing(false);
  }, [initialModuleIndex, domain]);

  const currentModule: HrModule | undefined = domain?.modules[currentModuleIndex];

  useEffect(() => {
    if (currentModule) {
      setEditedNotes(currentModule.notes);
      setIsEditing(false);
    }
  }, [currentModule]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isEditing) {
          setIsEditing(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isEditing, onClose]);

  if (!isOpen || !domain || !currentModule) return null;

  const isRecruiter = themeRole === 'recruiter';
  const primaryColor = isRecruiter ? 'var(--recruiter-color)' : 'var(--candidate-color)';
  const glowColor = isRecruiter ? 'var(--recruiter-glow)' : 'var(--candidate-glow)';
  const badgeClass = isRecruiter ? 'badge-purple' : 'badge-emerald';

  const handleCopy = () => {
    if (currentModule) {
      navigator.clipboard.writeText(`${currentModule.title}\n\n${currentModule.notes}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = () => {
    onSaveNote(domain.id, currentModule.title, editedNotes);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handlePrev = () => {
    if (currentModuleIndex > 0) {
      setCurrentModuleIndex(currentModuleIndex - 1);
      setIsEditing(false);
    }
  };

  const handleNext = () => {
    if (currentModuleIndex < domain.modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
      setIsEditing(false);
    }
  };

  // Helper to format content with sections and realistic callout blocks
  const renderFormattedNotes = (rawNotes: string) => {
    const lines = rawNotes.split('\n');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          // Main Header (e.g. ### or Title)
          if (trimmed.startsWith('###') || trimmed.startsWith('##')) {
            const headerText = trimmed.replace(/^#+\s*/, '');
            return (
              <div 
                key={idx}
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginTop: idx === 0 ? 0 : '1.25rem',
                  marginBottom: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '0.5rem',
                }}
              >
                <Sparkles size={16} color={primaryColor} />
                <span>{headerText}</span>
              </div>
            );
          }

          // Bullet Points (• or -)
          if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const isSubBullet = line.startsWith('  ') || line.startsWith('\t');
            const bulletContent = trimmed.replace(/^[•\-\*]\s*/, '');
            
            // Format bold terms inside bullet point (e.g. **Term** or Term:)
            const parts = bulletContent.split(/(\*\*.*?\*\*|`.*?`)/g);

            return (
              <div 
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  marginLeft: isSubBullet ? '1.5rem' : '0.25rem',
                  lineHeight: '1.6',
                  fontSize: isSubBullet ? '0.9rem' : '0.95rem',
                  color: isSubBullet ? 'var(--text-secondary)' : 'var(--text-primary)',
                }}
              >
                <span style={{ 
                  color: primaryColor, 
                  marginTop: '0.25rem', 
                  fontSize: isSubBullet ? '0.65rem' : '0.85rem',
                  display: 'inline-flex'
                }}>
                  {isSubBullet ? '▪' : '●'}
                </span>
                <div style={{ flex: 1 }}>
                  {parts.map((part, pIdx) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={pIdx} style={{ color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
                    }
                    if (part.startsWith('`') && part.endsWith('`')) {
                      return (
                        <code 
                          key={pIdx}
                          style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontSize: '0.85em',
                            color: primaryColor
                          }}
                        >
                          {part.slice(1, -1)}
                        </code>
                      );
                    }
                    return part;
                  })}
                </div>
              </div>
            );
          }

          // Numbered lists (1. 2. 3.)
          if (/^\d+\./.test(trimmed)) {
            const match = trimmed.match(/^(\d+\.)\s*(.*)/);
            if (match) {
              const num = match[1];
              const text = match[2];
              return (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    marginLeft: '0.25rem',
                    lineHeight: '1.6',
                    fontSize: '0.95rem',
                    color: 'var(--text-primary)',
                    background: 'rgba(255, 255, 255, 0.015)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <span style={{ 
                    fontWeight: 800, 
                    color: primaryColor,
                    minWidth: '24px',
                  }}>
                    {num}
                  </span>
                  <div style={{ flex: 1, color: 'var(--text-secondary)' }}>
                    {text}
                  </div>
                </div>
              );
            }
          }

          // Mathematical Formulas or Code Blocks
          if (trimmed.includes('$$') || trimmed.startsWith('ROI (%) =') || trimmed.includes('Compa-Ratio =') || trimmed.includes('Turnover =')) {
            return (
              <div
                key={idx}
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: `1px solid ${glowColor}`,
                  borderRadius: '10px',
                  padding: '1rem 1.25rem',
                  margin: '0.5rem 0',
                  fontFamily: 'monospace',
                  fontSize: '0.92rem',
                  color: primaryColor,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  boxShadow: `0 0 15px ${glowColor}`
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>∑</div>
                <div>{trimmed.replace(/\$\$/g, '')}</div>
              </div>
            );
          }

          // Empty line
          if (!trimmed) {
            return <div key={idx} style={{ height: '0.35rem' }} />;
          }

          // Standard paragraph
          return (
            <p 
              key={idx} 
              style={{ 
                color: 'var(--text-secondary)', 
                lineHeight: '1.65', 
                fontSize: '0.95rem',
                margin: '0.2rem 0' 
              }}
            >
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(4, 6, 12, 0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.5rem',
        animation: 'fadeIn 0.25s ease-out',
      }}
      onClick={onClose}
    >
      {/* Modal Container */}
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface, #0f1016)',
          border: `1px solid rgba(255, 255, 255, 0.1)`,
          borderRadius: '20px',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: `0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px ${glowColor}`,
          overflow: 'hidden',
          animation: 'modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Top App Bar */}
        <div style={{
          padding: '1.25rem 1.75rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          {/* Left: Domain & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{
              background: isRecruiter ? 'var(--recruiter-gradient)' : 'var(--candidate-gradient)',
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: `0 0 10px ${glowColor}`
            }}>
              <BookOpen size={18} />
            </div>
            <div>
              <span className={`badge ${badgeClass}`} style={{ fontSize: '0.7rem' }}>
                {domain.title}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <Clock size={13} />
              <span>{currentModule.duration} Read</span>
            </div>
          </div>

          {/* Right Action Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {saveSuccess && (
              <span style={{ fontSize: '0.8rem', color: primaryColor, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Check size={14} /> Saved
              </span>
            )}

            <button
              onClick={handleCopy}
              className="btn btn-outline"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', gap: '0.35rem' }}
              title="Copy notes to clipboard"
            >
              {copied ? <Check size={14} color={primaryColor} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            {canEdit && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`btn ${isRecruiter ? 'btn-recruiter' : 'btn-candidate'}`}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', gap: '0.35rem' }}
              >
                <Edit3 size={14} />
                {isEditing ? 'Reader Mode' : 'Edit Guide'}
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginLeft: '0.25rem'
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.color = '#f87171'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              title="Close Reader (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Module Sub-bar / Navigation Selector */}
        <div style={{
          padding: '0.75rem 1.75rem',
          background: 'rgba(0, 0, 0, 0.25)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          overflowX: 'auto'
        }}>
          {/* Module Step Indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {domain.modules.map((m, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentModuleIndex(idx);
                  setIsEditing(false);
                }}
                style={{
                  background: idx === currentModuleIndex ? primaryColor : 'rgba(255, 255, 255, 0.04)',
                  color: idx === currentModuleIndex ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid',
                  borderColor: idx === currentModuleIndex ? primaryColor : 'var(--border-color)',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                Part {idx + 1}: {m.title.length > 24 ? m.title.slice(0, 22) + '...' : m.title}
              </button>
            ))}
          </div>

          {/* Prev/Next arrows */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              onClick={handlePrev}
              disabled={currentModuleIndex === 0}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: currentModuleIndex === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                padding: '0.3rem 0.5rem',
                borderRadius: '6px',
                cursor: currentModuleIndex === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                opacity: currentModuleIndex === 0 ? 0.4 : 1
              }}
              title="Previous Module"
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', minWidth: '45px', textAlign: 'center' }}>
              {currentModuleIndex + 1} of {domain.modules.length}
            </span>
            <button
              onClick={handleNext}
              disabled={currentModuleIndex === domain.modules.length - 1}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: currentModuleIndex === domain.modules.length - 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                padding: '0.3rem 0.5rem',
                borderRadius: '6px',
                cursor: currentModuleIndex === domain.modules.length - 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                opacity: currentModuleIndex === domain.modules.length - 1 ? 0.4 : 1
              }}
              title="Next Module"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{
          padding: '2rem 2.25rem',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}>
          {/* Header Description Box */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.5rem',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: primaryColor,
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.4rem',
            }}>
              <CheckCircle2 size={14} />
              Module Syllabus Document #{currentModuleIndex + 1}
            </div>
            <h2 style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              marginBottom: '0.6rem',
              lineHeight: '1.3'
            }}>
              {currentModule.title}
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.95rem',
              lineHeight: '1.5'
            }}>
              {currentModule.desc}
            </p>
          </div>

          {/* Reader or Editor Mode */}
          {isEditing ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: `1px solid ${primaryColor}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: primaryColor, textTransform: 'uppercase' }}>
                  Live Study Notes Markdown Editor
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Supports markdown bullets (• or -), headers (###), and code/formula blocks.
                </span>
              </div>

              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                rows={16}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  padding: '1rem',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  resize: 'vertical',
                  outline: 'none'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditedNotes(currentModule.notes)}
                  className="btn btn-outline"
                  style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', gap: '0.35rem' }}
                >
                  <RotateCcw size={13} />
                  Revert to Saved
                </button>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="btn btn-outline"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className={`btn ${isRecruiter ? 'btn-recruiter' : 'btn-candidate'}`}
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem', gap: '0.35rem' }}
                  >
                    <Save size={14} />
                    Save & Publish Guide
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255, 255, 255, 0.015)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.75rem',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: primaryColor,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '1.25rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.75rem'
              }}>
                <FileText size={15} />
                Full Training Coursework & Reference Notes
              </div>

              {renderFormattedNotes(currentModule.notes)}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1rem 1.75rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            Crewcore HR Academy • Verified Spec Repository
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handlePrev}
              disabled={currentModuleIndex === 0}
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', opacity: currentModuleIndex === 0 ? 0.5 : 1 }}
            >
              Previous Part
            </button>
            <button
              onClick={handleNext}
              disabled={currentModuleIndex === domain.modules.length - 1}
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', opacity: currentModuleIndex === domain.modules.length - 1 ? 0.5 : 1 }}
            >
              Next Part
            </button>
            <button
              onClick={onClose}
              className={`btn ${isRecruiter ? 'btn-recruiter' : 'btn-candidate'}`}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.9rem' }}
            >
              Done Reading
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
