// AiBot Component - Crewcore HR Management System
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, BookOpen, FileText, HelpCircle, GraduationCap } from 'lucide-react';
import { aiEngine } from '../services/aiEngine';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AiBotProps {
  userRole: 'recruiter' | 'candidate';
  onStartScenario?: (scenarioId: string) => void;
  onAutoFillJD?: (jdText: string) => void;
}

export const AiBot: React.FC<AiBotProps> = ({
  userRole,
  onStartScenario,
  onAutoFillJD,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isRecruiter = userRole === 'recruiter';
  const accentColor = isRecruiter ? 'var(--recruiter-color)' : 'var(--candidate-color)';
  const bgGradient = isRecruiter ? 'var(--recruiter-gradient)' : 'var(--candidate-gradient)';
  const glowShadow = isRecruiter ? '0 0 20px var(--recruiter-glow)' : '0 0 20px var(--candidate-glow)';

  // Load initial welcome message
  useEffect(() => {
    const savedMessages = localStorage.getItem(`crewcore_chat_${userRole}`);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        setMessages(parsed);
        return;
      } catch (e) {
        console.error('Error loading chat history', e);
      }
    }

    // Default welcome message
    const welcomeMsg: Message = {
      id: 'welcome',
      role: 'assistant',
      content: isRecruiter
        ? "Hello! I'm **CrewBot**, your AI Recruiting Assistant. I can write job descriptions, generate interview questions, and assess resume matches. Try clicking one of the tools below!"
        : "Welcome to the Crewcore HR Academy! I am **CrewBot**, your training coach. Ask me about HR concepts, or use the panel below to learn the STAR method or start a conflict roleplay!",
      timestamp: new Date(),
    };
    setMessages([welcomeMsg]);
  }, [userRole]);

  // Save messages to local storage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`crewcore_chat_${userRole}`, JSON.stringify(messages));
    }
  }, [messages, userRole]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await aiEngine.chatWithBot(
        messages.map(m => ({ role: m.role, content: m.content })),
        text,
        userRole
      );

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionClick = async (action: string) => {
    if (action === 'star-method') {
      await handleSendMessage('What is the STAR interview method?');
    } else if (action === 'pip-explain') {
      await handleSendMessage('Explain what a Performance Improvement Plan (PIP) is and its rules.');
    } else if (action === 'conflict-academy') {
      if (onStartScenario) {
        onStartScenario('scen-conflict-resolution');
        setIsOpen(false);
      } else {
        await handleSendMessage('How do I start a conflict resolution mediation?');
      }
    } else if (action === 'generate-jd') {
      setIsTyping(true);
      const jd = await aiEngine.generateJobDescription(
        'Senior Software Engineer',
        'Engineering Operations',
        ['React', 'TypeScript', 'Node.js', 'System Architecture']
      );
      setIsTyping(false);
      if (onAutoFillJD) {
        onAutoFillJD(jd);
        const botMsg: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'I have generated a template for a **Senior Software Engineer** job description and filled it into the Recruiter Dashboard for you!',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        const botMsg: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Here is a sample Job Description draft for you:\n\n' + jd,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMsg]);
      }
    } else if (action === 'interview-questions') {
      setIsTyping(true);
      const questions = await aiEngine.generateInterviewQuestions('talent-acquisition', 'Mid-Level');
      setIsTyping(false);
      const formattedQ = questions.map((q, idx) => `${idx + 1}. ${q}`).join('\n');
      const botMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Here are suggested interview questions for a **Mid-Level Talent Acquisition Specialist**:\n\n${formattedQ}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    }
  };

  const clearChat = () => {
    localStorage.removeItem(`crewcore_chat_${userRole}`);
    const welcomeMsg: Message = {
      id: 'welcome',
      role: 'assistant',
      content: isRecruiter
        ? "Chat reset. Hello! I'm **CrewBot**, your AI Recruiting Assistant. I can write job descriptions, generate interview questions, and assess resume matches."
        : "Chat reset. Welcome back! I'm **CrewBot**, your HR coach. Ask me about HR concepts, or let's start a roleplay simulation!",
      timestamp: new Date(),
    };
    setMessages([welcomeMsg]);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: bgGradient,
          boxShadow: glowShadow,
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          color: '#ffffff',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isOpen ? 'rotate(90deg)' : 'none',
        }}
        title="Open CrewBot AI"
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="glass-panel"
          style={{
            position: 'fixed',
            bottom: '6.5rem',
            right: '2rem',
            width: '420px',
            height: '600px',
            maxHeight: 'calc(100vh - 10rem)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            overflow: 'hidden',
            border: `1px solid ${isRecruiter ? 'var(--bot-border-recruiter)' : 'var(--bot-border-candidate)'}`,
            boxShadow: glowShadow,
            animation: 'fadeIn 0.25s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: bgGradient,
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  CrewBot AI
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>
                  {isRecruiter ? 'HR Recruiter Copilot' : 'HR Training Coach'}
                </div>
              </div>
            </div>
            <button
              onClick={clearChat}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                fontSize: '0.7rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Reset Chat
            </button>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flexGrow: 1,
              padding: '1.25rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              background: 'rgba(6, 7, 10, 0.95)',
            }}
          >
            {messages.map(msg => (
              <div key={msg.id} className={`chat-message ${msg.role}`}>
                <div
                  className="chat-bubble"
                  style={{
                    // Override user message bubbles to use role color
                    background: msg.role === 'user' ? bgGradient : undefined,
                  }}
                >
                  {/* Format simple bolding and lists */}
                  {msg.content.split('\n').map((line, i) => {
                    let content = line;
                    // Format bolding **text**
                    const boldRegex = /\*\*(.*?)\*\*/g;
                    const parts = [];
                    let lastIdx = 0;
                    let match;
                    while ((match = boldRegex.exec(content)) !== null) {
                      if (match.index > lastIdx) {
                        parts.push(content.substring(lastIdx, match.index));
                      }
                      parts.push(<strong key={match.index}>{match[1]}</strong>);
                      lastIdx = boldRegex.lastIndex;
                    }
                    if (lastIdx < content.length) {
                      parts.push(content.substring(lastIdx));
                    }

                    const renderedContent = parts.length > 0 ? parts : content;

                    if (line.startsWith('- ')) {
                      return <li key={i} style={{ marginLeft: '1rem', listStyleType: 'disc' }}>{renderedContent}</li>;
                    }
                    if (/^\d+\./.test(line)) {
                      return <div key={i} style={{ marginLeft: '1rem', display: 'list-item', listStyleType: 'decimal' }}>{renderedContent}</div>;
                    }
                    return <p key={i} style={{ marginBottom: i === msg.content.split('\n').length - 1 ? 0 : '0.5rem' }}>{renderedContent}</p>;
                  })}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="chat-message bot">
                <div className="chat-bubble">
                  <div className="typing-indicator">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions Panel */}
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--bot-panel-bg)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            {isRecruiter ? (
              <>
                <button
                  onClick={() => handleActionClick('generate-jd')}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = accentColor)}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  <FileText size={12} color={accentColor} />
                  Draft JD (Engineering)
                </button>
                <button
                  onClick={() => handleActionClick('interview-questions')}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = accentColor)}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  <HelpCircle size={12} color={accentColor} />
                  Interview Templates
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleActionClick('star-method')}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = accentColor)}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  <GraduationCap size={12} color={accentColor} />
                  Learn STAR Method
                </button>
                <button
                  onClick={() => handleActionClick('pip-explain')}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = accentColor)}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  <BookOpen size={12} color={accentColor} />
                  What is a PIP?
                </button>
                <button
                  onClick={() => handleActionClick('conflict-academy')}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = accentColor)}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  <Sparkles size={12} color={accentColor} />
                  Roleplay Mediation
                </button>
              </>
            )}
          </div>

          {/* Message Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            style={{
              padding: '0.85rem 1rem',
              display: 'flex',
              gap: '0.5rem',
              background: 'var(--bot-panel-bg)',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <input
              type="text"
              placeholder="Ask CrewBot anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
              style={{
                flexGrow: 1,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={isTyping || !inputValue.trim()}
              style={{
                background: bgGradient,
                border: 'none',
                borderRadius: '8px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
                opacity: (isTyping || !inputValue.trim()) ? 0.5 : 1,
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
