// AiBot Component - Crewcore HR Management System
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, BookOpen, FileText, HelpCircle, GraduationCap, DollarSign, Search, Trophy, CheckSquare, Terminal } from 'lucide-react';
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

const quizQuestions = [
  {
    question: "Which federal agency enforces Title VII of the Civil Rights Act of 1964?",
    options: [
      "A) OSHA (Occupational Safety & Health)",
      "B) EEOC (Equal Employment Opportunity Commission)",
      "C) NLRB (National Labor Relations Board)"
    ],
    correct: "B"
  },
  {
    question: "What does the 'A' in the STAR behavioral interview method stand for?",
    options: [
      "A) Action",
      "B) Assessment",
      "C) Achievement"
    ],
    correct: "A"
  },
  {
    question: "A Performance Improvement Plan (PIP) usually lasts for how many days?",
    options: [
      "A) 1 to 5 days",
      "B) 30, 60, or 90 days",
      "C) Exactly 365 days"
    ],
    correct: "B"
  },
  {
    question: "Which Boolean operator is used to search for pages containing either search term?",
    options: [
      "A) AND",
      "B) NOT",
      "C) OR"
    ],
    correct: "C"
  }
];

export const AiBot: React.FC<AiBotProps> = ({
  userRole,
  onStartScenario,
  onAutoFillJD,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Interactive mini-game states
  const [activeGame, setActiveGame] = useState<'none' | 'quiz' | 'salary' | 'grader' | 'sourcing'>('none');
  const [gameState, setGameState] = useState<any>(null);

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
        ? "Hello! I'm **CrewBot**, your AI Recruiting Assistant. I can write job descriptions, generate interview questions, and assess resume matches. Try clicking one of the tools below, or type **help** to see all options!"
        : "Welcome to the Crewcore HR Academy! I am **CrewBot**, your training coach. Ask me about HR concepts, or use the panel below to learn the STAR method, start a conflict roleplay, or test your skills with a quiz!",
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

  // ------------------ INTERACTIVE GAME LOGIC ------------------

  const startQuiz = () => {
    setActiveGame('quiz');
    setGameState({ questionIndex: 0, score: 0 });
    
    const botMsg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `🏆 **Welcome to the Crewcore HR Trivia Quiz!** 🏆\n\nI will ask you 4 questions. Type **A**, **B**, or **C** to respond.\n\n**Question 1:** Which federal agency enforces Title VII of the Civil Rights Act of 1964?\n\n- **A)** OSHA (Occupational Safety & Health)\n- **B)** EEOC (Equal Employment Opportunity Commission)\n- **C)** NLRB (National Labor Relations Board)`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, botMsg]);
  };

  const processQuizAnswer = (answer: string) => {
    const currentQ = quizQuestions[gameState.questionIndex];
    const cleanedAnswer = answer.trim().toUpperCase();
    
    let isCorrect = false;
    if (cleanedAnswer === currentQ.correct || cleanedAnswer.includes(currentQ.correct)) {
      isCorrect = true;
    }

    const nextIndex = gameState.questionIndex + 1;
    const nextScore = isCorrect ? gameState.score + 1 : gameState.score;
    setGameState({ questionIndex: nextIndex, score: nextScore });

    const feedback = isCorrect 
      ? `🎉 **Correct!** Excellent job.` 
      : `❌ **Incorrect.** The correct answer was **${currentQ.correct}**.`;

    if (nextIndex < quizQuestions.length) {
      const nextQ = quizQuestions[nextIndex];
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `${feedback}\n\n**Question ${nextIndex + 1}:** ${nextQ.question}\n\n- ${nextQ.options.join('\n- ')}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    } else {
      let finalFeedback = '';
      if (nextScore === 4) {
        finalFeedback = "🏆 **Perfect Score!** You are an HR expert! 🌟";
      } else if (nextScore >= 2) {
        finalFeedback = "👍 **Good effort!** You have a solid grasp of HR basics.";
      } else {
        finalFeedback = "📚 **Keep studying!** Review the PIP, STAR, and compliance topics in the Academy.";
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `${feedback}\n\n🏆 **Quiz Completed!** 🏆\n\nYou scored **${nextScore} / ${quizQuestions.length}**.\n\n${finalFeedback}\n\nType **quiz** to play again, or ask me any questions!`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
      setActiveGame('none');
    }
  };

  const startSalaryEstimator = () => {
    setActiveGame('salary');
    setGameState({ step: 'title', title: '' });

    const botMsg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `💰 **Salary Band Estimator** 💰\n\nI will help you calculate an estimated market salary range.\n\n**Step 1:** What is the job title? (e.g. Software Engineer, Recruiter, HR Manager, UX Designer)`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, botMsg]);
  };

  const processSalaryStep = (input: string) => {
    if (gameState.step === 'title') {
      setGameState({ step: 'experience', title: input });
      const botMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Got it: **${input}**.\n\n**Step 2:** What is the experience level? (Type: **Junior**, **Mid**, or **Senior**)`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    } else if (gameState.step === 'experience') {
      const exp = input.trim().toLowerCase();
      
      let baseVal = 70000;
      const lowerTitle = gameState.title.toLowerCase();
      if (lowerTitle.includes('engineer') || lowerTitle.includes('developer')) {
        baseVal = 105000;
      } else if (lowerTitle.includes('manager') || lowerTitle.includes('lead')) {
        baseVal = 95000;
      } else if (lowerTitle.includes('recruiter') || lowerTitle.includes('hr')) {
        baseVal = 65000;
      }

      let multiplier = 1.0;
      if (exp.includes('junior')) multiplier = 0.75;
      else if (exp.includes('senior')) multiplier = 1.45;

      const midVal = Math.round(baseVal * multiplier);
      const minVal = Math.round(midVal * 0.85);
      const maxVal = Math.round(midVal * 1.15);

      const botMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `💰 **Salary Band Estimation Results** 💰\n\n**Position:** ${gameState.title} (${input})\n\n- **Minimum Base:** $${minVal.toLocaleString()}\n- **Midpoint:** $${midVal.toLocaleString()}\n- **Maximum Base:** $${maxVal.toLocaleString()}\n\n*Note: Estimates are benchmarks modeled on US national averages. Regional cost-of-living adjustments (e.g., SF, NYC) may add a 15-25% premium.*\n\nWhat would you like to do next?`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
      setActiveGame('none');
    }
  };

  const startStarGrader = () => {
    setActiveGame('grader');

    const botMsg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `📝 **STAR Interview Grader** 📝\n\nDescribe a past project or workplace conflict challenge you faced, and detail: \n1. **Situation**\n2. **Task**\n3. **Action**\n4. **Result**\n\nPaste your response below and I will grade it!`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, botMsg]);
  };

  const processGraderStep = (text: string) => {
    const textLower = text.toLowerCase();
    
    // Check elements
    const hasSituation = textLower.includes('when') || textLower.includes('at') || textLower.includes('project') || textLower.includes('during') || textLower.includes('challenge') || textLower.includes('faced');
    const hasTask = textLower.includes('goal') || textLower.includes('task') || textLower.includes('role') || textLower.includes('objective') || textLower.includes('assigned');
    const hasAction = textLower.includes('i did') || textLower.includes('i built') || textLower.includes('i created') || textLower.includes('i met') || textLower.includes('i resolved') || textLower.includes('i implemented') || textLower.includes('i set up');
    const hasResult = textLower.includes('%') || textLower.includes('percent') || textLower.includes('resulting') || textLower.includes('saved') || textLower.includes('achieved') || textLower.includes('outcome');

    let score = 50;
    if (hasSituation) score += 12;
    if (hasTask) score += 12;
    if (hasAction) score += 12;
    if (hasResult) score += 14;

    if (text.length > 250) score += 10;
    
    let grade = 'C';
    let summary = '';
    if (score >= 90) {
      grade = 'A';
      summary = 'Outstanding! You have a well-structured STAR response with clear outcomes and metrics.';
    } else if (score >= 75) {
      grade = 'B';
      summary = 'Solid response, but could benefit from stronger Action descriptors or explicit numeric Results.';
    } else {
      grade = 'C';
      summary = 'Your response is too brief or is missing key parts of the STAR framework (especially clear numeric Results).';
    }

    const botMsg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `📝 **STAR Grader Analysis** 📝\n\n- **Overall Grade:** **${grade}** (${score}/100)\n\n**Section Review:**\n- **Situation:** ${hasSituation ? '✅ Present' : '❌ Vague or missing context'}\n- **Task:** ${hasTask ? '✅ Present' : '❌ Vague objective'}\n- **Action:** ${hasAction ? '✅ Present' : '❌ Action steps unclear'}\n- **Result:** ${hasResult ? '✅ Present (Metrics detected)' : '❌ Missing quantifiable results/metrics'}\n\n**Coach Feedback:**\n*${summary}*\n\nTry writing another response to improve your score!`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, botMsg]);
    setActiveGame('none');
  };

  const startSourcingValidator = () => {
    setActiveGame('sourcing');

    const botMsg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `🔍 **Boolean Sourcing Query Validator** 🔍\n\nEnter a Boolean search string (using operators like **AND**, **OR**, **NOT**, brackets \`()\`, and quotes \`""\`). \n\n*Example:* \`("Recruiter" OR "Sourcer") AND "Tech" AND NOT Manager\``,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, botMsg]);
  };

  const processSourcingStep = (text: string) => {
    let openBrackets = 0;
    let openQuotes = 0;
    for (let char of text) {
      if (char === '(') openBrackets++;
      if (char === ')') openBrackets--;
      if (char === '"') openQuotes++;
    }

    const unbalanceBracket = openBrackets !== 0;
    const unbalanceQuote = openQuotes % 2 !== 0;
    
    // Check lowercase operators
    const hasLowercaseAnd = /\band\b/.test(text);
    const hasLowercaseOr = /\bor\b/.test(text);
    const hasLowercaseNot = /\bnot\b/.test(text);

    let content = `🔍 **Boolean Query Report** 🔍\n\n**Query:** \`${text}\`\n\n`;

    if (unbalanceBracket || unbalanceQuote) {
      content += `❌ **Syntax Error Detected:**\n`;
      if (unbalanceBracket) content += `- Unbalanced parentheses \`()\` (check matching open/close brackets).\n`;
      if (unbalanceQuote) content += `- Unbalanced quotation marks \`""\` (ensure every phrase is closed).\n`;
    } else {
      content += `✅ **Syntax Valid!**\n\n`;
      if (hasLowercaseAnd || hasLowercaseOr || hasLowercaseNot) {
        content += `⚠️ **Warning:** Standard search engines (like LinkedIn Recruiter or Google) require Boolean operators to be in **UPPERCASE** (\`AND\`, \`OR\`, \`NOT\`). Lowercase operators may be treated as search terms rather than query logic.\n\n`;
      }
      content += `**Interpretation:**\n- Isolates terms matched inside quotes as exact phrases.\n- Groups logical conditions within \`()\` brackets correctly.`;
    }

    const botMsg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, botMsg]);
    setActiveGame('none');
  };

  const showHelpMenu = () => {
    const commandsList = isRecruiter
      ? "- **quiz** : Start the HR Trivia Challenge\n- **salary** : Launch the Salary Estimator\n- **validate** : Open the Boolean Sourcing Validator\n- **help** : Show this command reference list"
      : "- **quiz** : Start the HR Trivia Challenge\n- **grader** : Launch the STAR Interview Grader\n- **help** : Show this command reference list";

    const botMsg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `🤖 **CrewBot Command Reference** 🤖\n\nYou can interact with me by typing the following commands directly into the chat box:\n\n${commandsList}\n\nOr click the quick action buttons in the panel above!`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, botMsg]);
  };

  // ------------------ END GAME LOGIC ------------------

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

    // Handle Active Interactive Game Routing
    if (activeGame === 'quiz') {
      processQuizAnswer(text);
      return;
    }
    if (activeGame === 'salary') {
      processSalaryStep(text);
      return;
    }
    if (activeGame === 'grader') {
      processGraderStep(text);
      return;
    }
    if (activeGame === 'sourcing') {
      processSourcingStep(text);
      return;
    }

    // Check for game initiation keywords or slash commands
    const cleanText = text.trim().toLowerCase();
    if (cleanText === '/quiz' || cleanText === 'quiz' || cleanText === 'start quiz') {
      startQuiz();
      return;
    }
    if (cleanText === '/salary' || cleanText === 'salary' || cleanText === 'salary estimator') {
      startSalaryEstimator();
      return;
    }
    if (cleanText === '/grade' || cleanText === 'grade' || cleanText === 'star grader' || cleanText === 'grader') {
      startStarGrader();
      return;
    }
    if (cleanText === '/validate' || cleanText === 'validate' || cleanText === 'sourcing validator') {
      startSourcingValidator();
      return;
    }
    if (cleanText === '/help' || cleanText === 'help') {
      showHelpMenu();
      return;
    }

    // Default chat fallback
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
    } else if (action === 'salary-estimator') {
      startSalaryEstimator();
    } else if (action === 'sourcing-validator') {
      startSourcingValidator();
    } else if (action === 'star-grader') {
      startStarGrader();
    } else if (action === 'quiz') {
      startQuiz();
    }
  };

  const clearChat = () => {
    localStorage.removeItem(`crewcore_chat_${userRole}`);
    setActiveGame('none');
    setGameState(null);
    const welcomeMsg: Message = {
      id: 'welcome',
      role: 'assistant',
      content: isRecruiter
        ? "Chat reset. Hello! I'm **CrewBot**, your AI Recruiting Assistant. I can write job descriptions, generate interview questions, and assess resume matches. Type **help** to see commands."
        : "Chat reset. Welcome back! I'm **CrewBot**, your HR coach. Ask me about HR concepts, or let's start a roleplay simulation! Type **help** to see options.",
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
              background: 'var(--bot-panel-bg)',
            }}
          >
            {messages.map(msg => (
              <div key={msg.id} className={`chat-message ${msg.role}`}>
                <div
                  className="chat-bubble"
                  style={{
                    background: msg.role === 'user' ? bgGradient : undefined,
                  }}
                >
                  {msg.content.split('\n').map((line, i) => {
                    let content = line;
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
                <button
                  onClick={() => handleActionClick('salary-estimator')}
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
                  <DollarSign size={12} color={accentColor} />
                  Salary Estimator
                </button>
                <button
                  onClick={() => handleActionClick('sourcing-validator')}
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
                  <Search size={12} color={accentColor} />
                  Sourcing Validator
                </button>
                <button
                  onClick={() => handleActionClick('quiz')}
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
                  <Trophy size={12} color={accentColor} />
                  HR Trivia Quiz
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
                <button
                  onClick={() => handleActionClick('star-grader')}
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
                  <CheckSquare size={12} color={accentColor} />
                  STAR Grader
                </button>
                <button
                  onClick={() => handleActionClick('quiz')}
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
                  <Trophy size={12} color={accentColor} />
                  HR Trivia Quiz
                </button>
              </>
            )}
            
            {/* Direct Command Help Shortcut */}
            <button
              onClick={() => handleActionClick('help')}
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
              <Terminal size={12} color={accentColor} />
              Help Commands
            </button>
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
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                color: 'var(--text-primary)',
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
