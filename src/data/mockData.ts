// Mock Data - Crewcore HR Management System

export interface JobListing {
  id: string;
  title: string;
  domain: string;
  location: string;
  type: string;
  experience: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  domain: string;
  roleApplied: string;
  appliedDate: string;
  status: 'Applied' | 'Interviewing' | 'Hired' | 'Rejected';
  resumeContent: string;
  resumeFile?: {
    fileName: string;
    fileData: string;
    contentType: string;
  };
  screeningAnswers: {
    question: string;
    answer: string;
  }[];
  aiFitScore: number; // 0 to 100
  aiSummary: string;
  strengths: string[];
  weaknesses: string[];
}

export interface HrModule {
  id?: string;
  title: string;
  desc: string;
  duration: string;
  notes: string;
}

export interface HrDomain {
  id: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  skillsNeeded: string[];
  modules: HrModule[];
}

export const HR_DOMAINS: HrDomain[] = [
  {
    id: 'talent-acquisition',
    title: 'Talent Acquisition & Recruiting',
    shortDesc: 'Source, screen, and hire the best talent to drive company growth.',
    fullDesc: 'Talent Acquisition (TA) is about strategic recruitment. Rather than just filling positions, it focuses on finding the right specialists, leaders, or future executives. It covers employer branding, sourcing pipelines, assessment design, and onboarding.',
    skillsNeeded: [
      'Sourcing Strategies (Boolean Search)',
      'Behavioral Interviewing (STAR Method)',
      'Negotiation & Compensation Package Design',
      'Applicant Tracking Systems (ATS) & CRM Tools',
      'Employer Branding & Talent Pipelines'
    ],
    modules: [
      {
        id: 'ta-1',
        title: 'Sourcing Secrets & Advanced Boolean Queries',
        desc: 'Master how to find passive candidates on LinkedIn, GitHub, and other platforms.',
        duration: '40 mins',
        notes: `• Core Boolean Logic:
  - AND : Combines mandatory skills (e.g., "Full Stack" AND ("React" OR "Vue"))
  - OR : Expands synonyms (e.g., ("PostgreSQL" OR "MongoDB" OR "MySQL"))
  - NOT / - : Excludes noise (e.g., NOT "Intern" NOT "Student")
  - " " (Exact Match) : Preserves multi-word phrases and job titles
  - ( ) (Grouping) : Enforces logical precedence in complex queries

• X-Ray Search Commands:
  - LinkedIn: site:linkedin.com/in ("Lead Recruiter" OR "TA Manager") ("Bengaluru" OR "Remote")
  - GitHub: site:github.com "joined on" "followers" "TypeScript" "San Francisco"

• High-Conversion Candidate Outreach:
  - Personalize first 2 sentences referencing specific repos, papers, or career moves.
  - Keep cold pitches under 150 words with a clear, low-friction call-to-action.
  - Sourcing cadence: Day 1 InMail -> Day 3 Email -> Day 7 Follow-up.`
      },
      {
        id: 'ta-2',
        title: 'Designing High-Impact Interview Workflows',
        desc: 'Learn how to create structured interview templates and rubrics that reduce bias.',
        duration: '50 mins',
        notes: `• Structured Interview Architecture:
  - Define 4-5 core competencies per role (e.g., System Design, Team Leadership, Problem Solving).
  - Create standardized grading rubrics anchored from Level 1 (Novice) to Level 5 (Mastery).

• The STAR Behavioral Framework:
  - Situation: The context and operational challenge.
  - Task: The specific goal the candidate owned.
  - Action: The step-by-step initiative taken (probe for "I" vs "We").
  - Result: The quantifiable business impact and key learnings.

• Debiasing the Panel:
  - Submit individual scorecards before joint hiring debrief sessions.
  - Evaluate against concrete rubric criteria to eliminate halo, similarity, and recency biases.`
      },
      {
        id: 'ta-3',
        title: 'Offer Letters & Closing Negotiations',
        desc: 'A step-by-step guide to pitch offers, counter-negotiate, and handle objections.',
        duration: '45 mins',
        notes: `• Pre-Closing from Day One:
  - Continuously confirm compensation benchmarks, competing offers, and decision timelines.
  - Uncover intrinsic motivators (leadership scope, equity upside, remote flexibility).

• Total Rewards Package Structuring:
  - Base Salary: Market-benchmarked to internal salary bands.
  - Variable/Bonus: KPI-linked performance milestones.
  - Equity Grants (RSUs/ESOPs): Explain 4-year vesting, 1-year cliff, and potential financial upside models.
  - Sign-on Stipends: Offset forfeited bonuses or relocation expenses.

• Handling Counter-Offers & Objections:
  - Reiterate career progression trajectory and immediate high-impact projects.
  - Address lifestyle, culture, and team fit factors directly.`
      }
    ]
  },
  {
    id: 'employee-relations',
    title: 'Employee Relations & Culture',
    shortDesc: 'Manage policies, workplace compliance, and resolve team conflicts.',
    fullDesc: 'Employee Relations (ER) is the core of HR that deals with the relationship between employer and employees. It focuses on resolving grievances, managing conflict, designing code of conduct policies, and maintaining high team engagement and company culture.',
    skillsNeeded: [
      'Conflict Resolution & Mediation',
      'Employment Law & Compliance',
      'Performance Management Systems (PIP)',
      'Employee Survey Analysis & Feedback Loops',
      'Crisis Management & Ethics Investigations'
    ],
    modules: [
      {
        id: 'er-1',
        title: 'Mediation: Navigating High-Stakes Workplace Disputes',
        desc: 'Learn active listening and structured mediation frameworks to resolve conflicts.',
        duration: '1 hour',
        notes: `• Five-Stage Mediation Protocol:
  1. Individual Fact-Finding Intake: Meet both parties separately in a confidential space.
  2. Setting Ground Rules: Mutual respect, no interruptions, focus on actions/impacts rather than personalities.
  3. Facilitated Dialogue: Apply Nonviolent Communication (Observation -> Feeling -> Need -> Request).
  4. Solution Co-Creation: Brainstorm workable compromises and shared goals.
  5. Written Agreement & Follow-up: Formalize commitments and schedule 30/60-day check-ins.

• De-escalation Strategies:
  - Acknowledge emotional friction without validating misconduct.
  - Reframe accusatory statements into shared operational objectives.`
      },
      {
        id: 'er-2',
        title: 'Performance Improvement Plans (PIP) with Empathy',
        desc: 'How to structure feedback, write legally defensible PIPs, and support employee growth.',
        duration: '55 mins',
        notes: `• Distinguishing Skill vs Will Gaps:
  - Verify that the employee had adequate tooling, clear benchmarks, and prior coaching.
  - A PIP should serve as a genuine turnaround mechanism, not a pre-termination formality.

• Essential Elements of a Defensible PIP:
  - Specific gap descriptions supported by concrete dates and deliverables.
  - SMART turnaround goals with objective success criteria.
  - Support resources: Weekly manager 1-on-1s, technical shadowing, and HR check-ins.
  - Standard duration (30/60/90 days) with written documentation of weekly progress.`
      },
      {
        id: 'er-3',
        title: 'Workplace Investigations & Ethics Compliance',
        desc: 'Conduct unbiased interviews, document evidence, and write formal findings.',
        duration: '1.5 hours',
        notes: `• Investigation Roadmap:
  1. Intake & Protective Measures: Assess severity and implement non-punitive safeguards (e.g. temporary reporting changes).
  2. Interview Order: Complainant -> Relevant Witnesses -> Respondent.
  3. Evidence Gathering: Preserve digital trails (Slack, emails, access logs).
  4. Standard of Proof: Evaluate credibility using the Preponderance of Evidence standard.
  5. Formal Investigative Report: Summary of allegations, factual findings, policy analysis, and corrective actions.`
      }
    ]
  },
  {
    id: 'learning-development',
    title: 'Learning & Development (L&D)',
    shortDesc: 'Upskill employees, run mentorship programs, and plan career progression.',
    fullDesc: 'L&D is dedicated to optimizing the workforce’s capabilities and alignment with organizational goals. It involves analyzing skill gaps, developing custom curricula, managing LMS platforms, and building leadership training programs.',
    skillsNeeded: [
      'Skill Gap Analysis',
      'Instructional Design (ADDIE Framework)',
      'Learning Management Systems (LMS)',
      'Mentorship & Leadership Coaching',
      'ROI Estimation for Training Programs'
    ],
    modules: [
      {
        id: 'ld-1',
        title: 'Designing Curriculums under ADDIE',
        desc: 'Analyze, Design, Develop, Implement, and Evaluate corporate training programs.',
        duration: '45 mins',
        notes: `• The ADDIE Framework:
  - Analyze: Conduct organizational skill gap assessments and learner persona profiles.
  - Design: Establish Bloom's Taxonomy learning objectives and curriculum roadmaps.
  - Develop: Build slides, interactive case studies, scenario trees, and quizzes.
  - Implement: Roll out through LMS or live instructor-led workshops.
  - Evaluate: Perform formative feedback audits and post-course skill evaluations.`
      },
      {
        id: 'ld-2',
        title: 'Building Leadership Tracks for Senior Staff',
        desc: 'Establish transition frameworks from individual contributor to engineering manager.',
        duration: '1 hour',
        notes: `• Moving from IC to People Manager:
  - Shift from individual task output to multiplier of team effectiveness and coaching.
  - Master radical candor: Care personally while challenging directly.
  - 1-on-1 Framework: Dedicate time to career growth, blocker removal, and feedback exchange.
  - 360-Degree Feedback: Deploy quarterly peer and upward reviews to calibrate leadership development.`
      },
      {
        id: 'ld-3',
        title: 'Measuring Training ROI & Business Impact',
        desc: 'Use Kirkpatrick\'s Four Levels of Evaluation to prove the cash value of training.',
        duration: '40 mins',
        notes: `• Kirkpatrick's 4-Level Evaluation Hierarchy:
  - Level 1 (Reaction): Post-training engagement surveys and NPS.
  - Level 2 (Learning): Competency scores on pre/post knowledge assessments.
  - Level 3 (Behavior): Manager-observed on-the-job application after 60 days.
  - Level 4 (Results): Business metrics (shorter onboarding, higher retention, fewer production bugs).

• Phillips ROI Calculation:
  ROI (%) = [(Net Financial Benefits - Program Costs) / Program Costs] * 100%`
      }
    ]
  },
  {
    id: 'hr-operations',
    title: 'HR Operations & Compensation',
    shortDesc: 'Oversee payroll, employee benefits, HRIS databases, and analytics.',
    fullDesc: 'HR Operations is the engine room of HR. It ensures that employee data is stored securely, payroll is executed on time, benefits packages (medical, stock options, insurance) are competitive, and analytics dashboards are constructed to monitor retention.',
    skillsNeeded: [
      'Compensation Structuring & Market Benchmarking',
      'HRIS Administration (Workday, BambooHR)',
      'Payroll & Tax Compliance Rules',
      'HR Metrics & Workforce Analytics',
      'Onboarding and Offboarding Operations'
    ],
    modules: [
      {
        id: 'ops-1',
        title: 'Salary Banding & Benefits Strategy',
        desc: 'Benchmark internal roles against market data and construct equitable salary bands.',
        duration: '1 hour',
        notes: `• Salary Band Construction:
  - Establish Minimum, Midpoint, and Maximum pay bands based on market benchmarks.
  - Range Spread = (Max - Min) / Min (typically 30% to 50%).

• Compa-Ratio Analytics:
  - Compa-Ratio = Employee Base Salary / Band Midpoint.
  - < 0.85: Below market (target for adjustment).
  - 0.95 - 1.05: Market competitive.
  - > 1.15: Top performer or ready for promotion review.

• Holistic Total Rewards:
  - Integrate health insurance, mental wellness stipends, retirement matching, and remote allowances.`
      },
      {
        id: 'ops-2',
        title: 'HR Metrics that Matter: Analytics & Retention',
        desc: 'Calculate turnover rates, cost-per-hire, and design dashboard reporting templates.',
        duration: '45 mins',
        notes: `• Critical HR Metrics & KPIs:
  - Turnover Rate (%) = (Departures / Average Headcount) * 100.
  - Cost Per Hire (CPH) = (Internal Costs + Agency/Vendor Costs) / Total Hires.
  - Time-to-Fill: Job requisition opening to candidate offer acceptance.
  - Time-to-Hire: Candidate application submission to offer acceptance.

• Flight Risk Signals:
  - Stagnant tenure (>2 years without role evolution), drop in survey sentiment, or missed 1-on-1s.`
      },
      {
        id: 'ops-3',
        title: 'Designing the Perfect Remote Onboarding Flow',
        desc: 'Step-by-step systems to ensure day-one success, tech setups, and team warmth.',
        duration: '30 mins',
        notes: `• 30-60-90 Day Remote Onboarding Roadmap:
  - Pre-boarding (T-minus 14 days): Hardware dispatch, credentials provisioning, buddy assignment.
  - Day 1: IT setup, team welcome call, initial orientation checklist.
  - 30 Days (Learn): Understand internal codebases/policies, complete starter task.
  - 60 Days (Collaborate): Lead sprint meetings, take ownership of feature module.
  - 90 Days (Deliver): Full autonomous performance, 90-day review and mutual onboarding feedback.`
      }
    ]
  }
];

// Local storage management helpers for editable domain notes
export const getStoredDomains = (): HrDomain[] => {
  try {
    const saved = localStorage.getItem('crewcore_custom_domain_notes');
    if (saved) {
      const parsedNotesMap: Record<string, string> = JSON.parse(saved);
      return HR_DOMAINS.map(domain => ({
        ...domain,
        modules: domain.modules.map(mod => {
          const key = `${domain.id}_${mod.title}`;
          return {
            ...mod,
            notes: parsedNotesMap[key] !== undefined ? parsedNotesMap[key] : mod.notes
          };
        })
      }));
    }
  } catch (e) {
    console.error('Error reading custom notes from local storage:', e);
  }
  return HR_DOMAINS;
};

export const saveStoredDomainNotes = (domainId: string, moduleTitle: string, newNotes: string): HrDomain[] => {
  try {
    const saved = localStorage.getItem('crewcore_custom_domain_notes');
    const notesMap: Record<string, string> = saved ? JSON.parse(saved) : {};
    notesMap[`${domainId}_${moduleTitle}`] = newNotes;
    localStorage.setItem('crewcore_custom_domain_notes', JSON.stringify(notesMap));
  } catch (e) {
    console.error('Error saving custom notes:', e);
  }
  return getStoredDomains();
};

export const resetStoredDomainNotes = (): HrDomain[] => {
  try {
    localStorage.removeItem('crewcore_custom_domain_notes');
  } catch (e) {
    console.error('Error resetting custom notes:', e);
  }
  return HR_DOMAINS;
};

export const MOCK_JOBS: JobListing[] = [
  {
    id: 'job-1',
    title: 'Associate Talent Acquisition Specialist',
    domain: 'talent-acquisition',
    location: 'Remote, USA / India',
    type: 'Full-Time',
    experience: '1-3 years',
    description: 'We are seeking an enthusiastic recruiter to join our scaling engineering division. You will manage candidates from sourcing on LinkedIn through to onboarding.',
    requirements: [
      'Familiarity with sourcing techniques (Boolean query builders)',
      'Strong communication skills and interview coordination experience',
      'Experience working with an ATS (Greenhouse, Lever, or similar)'
    ],
    responsibilities: [
      'Source candidate pipelines for backend, frontend, and design roles',
      'Conduct preliminary screening calls to check fit and compensation expectation',
      'Coordinate interview schedules and collate panel feedback'
    ]
  },
  {
    id: 'job-2',
    title: 'HR Operations Lead',
    domain: 'hr-operations',
    location: 'New York, NY (Hybrid)',
    type: 'Full-Time',
    experience: '4-7 years',
    description: 'Looking for a numbers-driven HR specialist to manage our compensation structures, HRIS database transitions, and run monthly payroll auditing processes.',
    requirements: [
      'Deep experience with HRIS administration (BambooHR, Workday)',
      'Familiarity with compensation modeling and equity grant systems',
      'Excellent Microsoft Excel and payroll processing skills'
    ],
    responsibilities: [
      'Manage benefit enrollments and interface with external insurance vendors',
      'Conduct bi-annual market benchmarking for employee salaries',
      'Oversee regulatory compliance filings and payroll integrations'
    ]
  },
  {
    id: 'job-3',
    title: 'Culture & Employee Experience Manager',
    domain: 'employee-relations',
    location: 'San Francisco, CA',
    type: 'Full-Time',
    experience: '3-5 years',
    description: 'Help us make our company the best place to work. You will manage internal grievances, lead pulse survey action items, and plan culture-building initiatives.',
    requirements: [
      'Proven background in mediation or conflict management',
      'Experience drafting policy manuals and HR standard procedures',
      'Empathic listening and strong public speaking abilities'
    ],
    responsibilities: [
      'Mediate employee issues and coordinate formal grievance steps',
      'Draft and update the employee handbook rules and code of conduct',
      'Organize company-wide culture surveys and summarize actionable feedback'
    ]
  }
];

export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: 'cand-1',
    name: 'Sarah Jenkins',
    email: 'sarah.j@example.com',
    domain: 'talent-acquisition',
    roleApplied: 'Associate Talent Acquisition Specialist',
    appliedDate: '2026-07-10',
    status: 'Interviewing',
    resumeContent: `SARAH JENKINS - TALENT ACQUISITION SPECIALIST
Experienced recruiter with 2 years of experience at TechCorp filling software engineering roles. 
SKILLS: Boolean Searching, Candidate Sourcing, Lever ATS, Resume Screening, Interview Coaching.
EXPERIENCE:
- Sourced and closed 15+ engineering candidates per year.
- Reduced overall agency spend by 20% by sourcing directly via LinkedIn.
- Built a diverse applicant pool and coordinated university recruitment fairs.`,
    screeningAnswers: [
      { question: 'Describe your experience with Boolean search operators.', answer: 'I use Boolean searches daily on LinkedIn and GitHub to find specific tech stacks. For example: (React OR Vue) AND Node.js AND "Software Engineer".' },
      { question: 'How do you handle candidates who ask for a salary higher than the approved budget?', answer: 'I focus on highlighting other benefits like equity, work-life balance, and wellness stipends. If that fails, I discuss with the hiring manager to see if they can justify raising the budget for this specific candidate.' }
    ],
    aiFitScore: 88,
    aiSummary: 'Strong junior-to-mid recruiter with solid direct sourcing experience. Technical sourcing queries are correct, and demonstrates good negotiation diplomacy.',
    strengths: ['Boolean sourcing capability', 'Proactive communication', 'ATS familiarity'],
    weaknesses: ['Limited experience in executive compensation structure', 'Has not designed onboarding structures']
  },
  {
    id: 'cand-2',
    name: 'Michael Chen',
    email: 'm.chen@example.com',
    domain: 'hr-operations',
    roleApplied: 'HR Operations Lead',
    appliedDate: '2026-07-15',
    status: 'Applied',
    resumeContent: `MICHAEL CHEN - HR OPERATIONS MANAGER
5 years of experience administering HR systems, managing vendor contracts, and handling payroll for teams of 200+ employees.
SKILLS: Workday Certified, Excel (VLookup, Pivot Tables), Payroll Processing, Benefits Administration, HIPAA compliance.
EXPERIENCE:
- Led BambooHR-to-Workday migration, finishing 2 weeks ahead of schedule.
- Managed quarterly audit of local payroll tax compliance.
- Redesigned remote worker stipend structures during global work-from-home shifts.`,
    screeningAnswers: [
      { question: 'What systems are you certified in or highly proficient with?', answer: 'I am a certified Workday Administrator and have extensively configured BambooHR, Gusto, and ADP.' },
      { question: 'Explain your experience handling vendor negotiations.', answer: 'I negotiated medical plan contracts with Blue Cross, resulting in a 7% reduction in premiums while keeping coverage identical for employees.' }
    ],
    aiFitScore: 94,
    aiSummary: 'Outstanding operations candidate. Direct system migration experience and certified in Workday. Exhibits strong quantitative and contract negotiation capabilities.',
    strengths: ['Workday certification', 'Data migration management', 'Advanced Excel & Analytics'],
    weaknesses: ['Less experience in soft-skills coaching and candidate-facing culture programs']
  },
  {
    id: 'cand-3',
    name: 'Elena Rostova',
    email: 'elena.rostova@example.com',
    domain: 'employee-relations',
    roleApplied: 'Culture & Employee Experience Manager',
    appliedDate: '2026-07-12',
    status: 'Applied',
    resumeContent: `ELENA ROSTOVA - HR RELATIONSHIPS SPECIALIST
Dedicated employee relations advisor with 3 years experience resolving grievances and promoting employee wellbeing.
SKILLS: Workplace Mediation, Grievance Resolution, Diversity & Inclusion, Policy Drafting.
EXPERIENCE:
- Mediated 40+ disputes between supervisors and subordinates with a 90% positive resolution rate.
- Authored the remote workspace wellness policy implemented company-wide.
- Led D&I seminars that increased survey inclusion ratings by 15 points.`,
    screeningAnswers: [
      { question: 'What is your process for resolving a conflict between a manager and a employee?', answer: 'I first interview both individuals privately to gather facts without bias. Then, I hold a structured joint mediation session where we focus on neutral solutions and establish a follow-up check-in timeline.' },
      { question: 'How do you ensure policies are inclusive and legally compliant?', answer: 'I collaborate with our legal team to audit drafts and run policies through a D&I review panel comprising employee resource group representatives.' }
    ],
    aiFitScore: 91,
    aiSummary: 'Empathic and structured professional. Has outstanding dispute resolution numbers and demonstrates a clear, structured compliance framework in answers.',
    strengths: ['Mediation success rate', 'Inclusivity drafting', 'Unbiased conflict protocol'],
    weaknesses: ['Has not overseen payroll or systems administrative configurations']
  }
];
