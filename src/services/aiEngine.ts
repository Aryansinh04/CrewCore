// AI Engine Mock Service - Crewcore HR Management System

export interface ScreeningReport {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
}

// Helper to delay for realism
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const aiEngine = {
  /**
   * Generates a premium formatted Job Description based on inputs
   */
  generateJobDescription: async (
    title: string,
    domain: string,
    keywords: string[]
  ): Promise<string> => {
    await delay(1200); // Simulate network latency

    const keywordList = keywords.length > 0 ? keywords : ['Collaboration', 'Agile', 'Communication'];
    const keywordBullets = keywordList.map(k => `- Proficient in **${k}** or related paradigms.`).join('\n');

    return `# Job Description: ${title}

## Role Overview
We are looking for a high-performing professional to join our **${domain.replace('-', ' ').toUpperCase()}** division. In this position, you will work within an agile workspace, driving best-in-class workflows, supporting organizational development, and fostering an inclusive company culture.

## Key Responsibilities
- Drive key metrics in the **${domain}** lifecycle, ensuring alignment with corporate strategic initiatives.
- Collaborate with engineering, product, and operations leaders to deliver cross-functional solutions.
- Champion organizational values, diversity, and equity across all team touchpoints.
- Analyze operational data pipelines to proactively identify bottlenecks and propose structured optimizations.

## Core Requirements
- Minimum 2+ years of hands-on experience in a relevant corporate or startup environment.
- Strong analytical capabilities and structured problem-solving skills.
${keywordBullets}
- Excellent written and verbal communication skills; ability to influence senior management.

## What We Offer
- Competitive salary packages with comprehensive equity/options plan.
- Premium medical, dental, vision, and wellness coverage.
- $1,500 annual training stipend for course enrollments and professional development.
- Flexible remote/hybrid working arrangement.`;
  },

  /**
   * Evaluates candidate resume & answers and outputs fit score & details
   */
  screenCandidateApplication: async (
    resume: string,
    answers: { question: string; answer: string }[]
  ): Promise<ScreeningReport> => {
    await delay(1500);

    const textToAnalyze = (resume + ' ' + answers.map(a => a.answer).join(' ')).toLowerCase();

    // Check for negative keyword counts or weak answers
    let score = 75; // Baseline
    const positiveKeywords = [
      'experience', 'management', 'sourcing', 'ats', 'workday', 'payroll', 
      'mediation', 'grievance', 'compliance', 'negotiation', 'star method', 
      'boolean', 'certified', 'led', 'managed', 'database'
    ];

    positiveKeywords.forEach(kw => {
      if (textToAnalyze.includes(kw)) score += 2.5;
    });

    // Check answer lengths
    answers.forEach(ans => {
      if (ans.answer.length > 150) score += 3;
      else if (ans.answer.length < 50) score -= 4;
    });

    // Clamp score
    score = Math.max(50, Math.min(98, Math.round(score)));

    // Generate response text based on score
    let summary = '';
    let strengths: string[] = [];
    let weaknesses: string[] = [];

    if (score >= 90) {
      summary = 'Exceptional candidate presenting comprehensive alignment with the role prerequisites. Demonstrates verified practical skills, clear communication, and solid background experience.';
      strengths = ['Advanced domain knowledge', 'Clear, highly-structured screening responses', 'Proven metrics-driven career history'];
      weaknesses = ['Potential overqualification for entry-level positions', 'May expect compensation at top of band'];
    } else if (score >= 75) {
      summary = 'Competent candidate displaying core qualifications. Has solid foundational skills, but would benefit from further assessment of practical task applications.';
      strengths = ['Relevant base experience', 'Enthusiastic and professional responses', 'Familiar with standard tools'];
      weaknesses = ['Needs training in complex scenario negotiations', 'Technical details in resume could be deeper'];
    } else {
      summary = 'Candidate meets minimum criteria but exhibits notable skill gaps or brief answers during screening. Deeper technical vetting is required.';
      strengths = ['Basic understanding of workflows', 'Willingness to learn and adjust'],
      weaknesses = ['Gaps in critical platform usage details', 'Short or under-explained answers to screening prompts'];
    }

    return { score, summary, strengths, weaknesses };
  },

  /**
   * Generates custom interview questions based on domain
   */
  generateInterviewQuestions: async (domain: string, seniority: string): Promise<string[]> => {
    await delay(800);

    const questionsMap: { [key: string]: string[] } = {
      'talent-acquisition': [
        `Describe your process for building a sourcing pipeline for a specialized ${seniority} role.`,
        'How do you manage a hiring manager who rejects all qualified candidates for subjective reasons?',
        'Provide an example of a recruitment offer you negotiated and successfully closed. What was your strategy?'
      ],
      'employee-relations': [
        'How do you handle an employee who raises a sexual harassment grievance against their VP?',
        `What structured steps do you take when designing a PIP for a ${seniority} team member?`,
        'Describe a situation where you had to enforce policy compliance when it was highly unpopular.'
      ],
      'learning-development': [
        'How do you perform a skill-gap analysis for an engineering department of 100 people?',
        'Describe the most successful training curriculum you designed. How did you measure ROI?',
        'How do you structure a mentorship program that matches junior engineers with senior leads?'
      ],
      'hr-operations': [
        'How do you analyze pay compression and market benchmarks for standardizing salaries?',
        `Describe a major HRIS platform database migration you managed. What went wrong?`,
        'What checks do you run to ensure compliance with payroll taxes for remote workers across multiple states?'
      ]
    };

    return questionsMap[domain] || [
      'Describe your general career history in human resources.',
      'How do you handle difficult conversations with employees or managers?',
      'How do you keep up-to-date with labor compliance and employment law changes?'
    ];
  },

  /**
   * Chat bot handler
   */
  chatWithBot: async (
    _history: { role: 'user' | 'assistant'; content: string }[],
    message: string,
    roleMode: 'recruiter' | 'candidate'
  ): Promise<string> => {
    await delay(1000);

    const input = message.toLowerCase();

    if (roleMode === 'recruiter') {
      // Recruiter Bot Responses
      if (input.includes('hi') || input.includes('hello') || input.includes('hey')) {
        return 'Hello Recruiter! I am **CrewBot**, your HR Copilot. I can assist you with: \n\n1. Generating **Job Descriptions**\n2. Creating **Interview Questions**\n3. Pre-screening candidates.\n\nSelect an action panel above or ask me a direct question!';
      }
      if (input.includes('job description') || input.includes('jd')) {
        return 'I can generate a professional Job Description for you! Use the **Job Description Generator** in the sidebar, or tell me the *Job Title*, *Domain*, and *Keywords* you want to include here.';
      }
      if (input.includes('interview') || input.includes('question')) {
        return 'To generate tailored interview questions, use the **Questions Helper** in the sidebar, or let me know the department and seniority level of the hire.';
      }
      if (input.includes('notes') || input.includes('candidate')) {
        return 'You can select any candidate from the **Applicant Tracker** to see their resume details, read the AI screening assessment report, and log your personal notes.';
      }
      return `I understand you are asking about: "${message}". As your HR assistant, I recommend checking the applicant tracker to cross-reference candidate records, or using the JD/Questions widgets on the side to automate standard paperwork. Let me know if you'd like a specific template!`;
    } else {
      // Candidate/Aspirant Bot Responses
      if (input.includes('hi') || input.includes('hello') || input.includes('hey')) {
        return 'Welcome to the **Crewcore HR Academy**! I am **CrewBot**, your personal HR training coach. \n\nHow can I help you today?\n- Type **"explain [concept]"** (e.g. *explain PIP*, *explain STAR method*) to learn.\n- Go to the **Training Academy** tab above and click **"Start Session"** to practice roleplay disputes.\n- Ask me any recruitment or compliance questions!';
      }
      if (input.includes('explain') || input.includes('what is') || input.includes('concept')) {
        if (input.includes('pip') || input.includes('performance improvement')) {
          return 'A **Performance Improvement Plan (PIP)** is a structured document that details clear deficiencies in an employee\'s performance and outlines specific, measurable goals they must achieve within a set time frame (usually 30, 60, or 90 days) to avoid termination. A good PIP is supportive, clear, and legally compliant.';
        }
        if (input.includes('star') || input.includes('interview')) {
          return 'The **STAR method** is a structured technique for answering behavioral interview questions. It stands for:\n- **S**ituation: Describe the context.\n- **T**ask: Explain the goal or problem.\n- **A**ction: Detail what you did.\n- **R**esult: Share the outcome and metrics.';
        }
        if (input.includes('boolean') || input.includes('sourcing')) {
          return '**Boolean Sourcing** uses operators like `AND`, `OR`, `NOT`, brackets `()`, and quotation marks `""` to construct search strings in search engines or databases. Example: `("Recruiter" OR "HR") AND "Tech" AND "New York"`. This isolates matching resumes immediately.';
        }
        if (input.includes('salary') || input.includes('band')) {
          return '**Salary Banding** is the process of setting range structures (minimum, midpoint, maximum) for compensation packages based on market rates and job evaluation. It maintains equity across roles and ensures budget controls.';
        }
      }
      if (input.includes('apply') || input.includes('job')) {
        return 'You can check out our simulated jobs under the **Browse Jobs & Apply** panel. Explore various domains, upload a mock resume, and answer screening questions to test your profile and receive an instant AI assessment score!';
      }
      return `Good question! In HR, managing "${message}" involves balancing organizational compliance with empathy. \n\nI recommend trying the **Mediate Conflict** or **Out-of-Band Salary Exception** training roleplays in the Academy section to see this in action, or ask me for more details on specific HR frameworks.`;
    }
  }
};
