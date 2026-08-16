// server/server.cjs - Crewcore HR Management System Backend (CommonJS)
const path = require('path');

// Load environment variables from .env file
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Startup check for required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'SMTP_USER', 'SMTP_PASS'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  throw new Error(`CRITICAL STARTUP ERROR: Missing required environment variable(s): ${missingEnvVars.join(', ')}`);
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to authenticate requests via JWT
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

const app = express();
app.use(express.json());
app.use(cors()); // Allow cross-origin requests from the React client

// 1. MONGODB CONNECTION
const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB successfully at:', MONGODB_URI))
  .catch(err => console.error('Failed to connect to MongoDB:', err));

// 2. MONGOOSE SCHEMA & MODEL DEFINITIONS

// OTP Schema (with a TTL index of 15 minutes)
const OtpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 900 } // automatically expires in 15 mins (900 seconds)
});
const Otp = mongoose.model('Otp', OtpSchema);

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['candidate', 'recruiter'], required: true },
  domain: { type: String }, // optional domain for candidate portal
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// Hash helper using bcryptjs
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Job Schema
const JobSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  title: String,
  domain: String,
  location: String,
  type: String,
  experience: String,
  description: String,
  requirements: [String],
  responsibilities: [String]
});
const Job = mongoose.model('Job', JobSchema);

// Candidate Schema
const CandidateSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: String,
  email: String,
  domain: String,
  roleApplied: String,
  appliedDate: String,
  status: { type: String, enum: ['Applied', 'Interviewing', 'Hired', 'Rejected'], default: 'Applied' },
  resumeContent: String,
  resumeFile: {
    fileName: String,
    fileData: String,
    contentType: String
  },
  screeningAnswers: [{
    question: String,
    answer: String
  }],
  aiFitScore: Number,
  aiSummary: String,
  strengths: [String],
  weaknesses: [String]
});
const Candidate = mongoose.model('Candidate', CandidateSchema);

// Note Schema
const NoteSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  candidateId: { type: String, required: true },
  text: String,
  timestamp: String
});
const Note = mongoose.model('Note', NoteSchema);

// 3. DATABASE SEEDING
const seedDatabase = async () => {
  try {
    // Seed default jobs
    const jobCount = await Job.countDocuments();
    if (jobCount === 0) {
      const defaultJobs = [
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
      await Job.insertMany(defaultJobs);
      console.log('Seeded default job listings into database.');
    }

    // Seed default candidates
    const candidateCount = await Candidate.countDocuments();
    if (candidateCount === 0) {
      const defaultCandidates = [
        {
          id: 'cand-1',
          name: 'Sarah Jenkins',
          email: 'sarah.j@example.com',
          domain: 'talent-acquisition',
          roleApplied: 'Associate Talent Acquisition Specialist',
          appliedDate: '2026-07-10',
          status: 'Interviewing',
          resumeContent: `SARAH JENKINS - TALENT ACQUISITION SPECIALIST\nExperienced recruiter with 2 years of experience at TechCorp filling software engineering roles.\nSKILLS: Boolean Searching, Candidate Sourcing, Lever ATS, Resume Screening, Interview Coaching.\nEXPERIENCE:\n- Sourced and closed 15+ engineering candidates per year.\n- Reduced overall agency spend by 20% by sourcing directly via LinkedIn.\n- Built a diverse applicant pool and coordinated university recruitment fairs.`,
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
          resumeContent: `MICHAEL CHEN - HR OPERATIONS MANAGER\n5 years of experience administering HR systems, managing vendor contracts, and handling payroll for teams of 200+ employees.\nSKILLS: Workday Certified, Excel (VLookup, Pivot Tables), Payroll Processing, Benefits Administration, HIPAA compliance.\nEXPERIENCE:\n- Led BambooHR-to-Workday migration, finishing 2 weeks ahead of schedule.\n- Managed quarterly audit of local payroll tax compliance.\n- Redesigned remote worker stipend structures during global work-from-home shifts.`,
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
          resumeContent: `ELENA ROSTOVA - HR RELATIONSHIPS SPECIALIST\nDedicated employee relations advisor with 3 years experience resolving grievances and promoting employee wellbeing.\nSKILLS: Workplace Mediation, Grievance Resolution, Diversity & Inclusion, Policy Drafting.\nEXPERIENCE:\n- Mediated 40+ disputes between supervisors and subordinates with a 90% positive resolution rate.\n- Authored the remote workspace wellness policy implemented company-wide.\n- Led D&I seminars that increased survey inclusion ratings by 15 points.`,
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
      await Candidate.insertMany(defaultCandidates);
      console.log('Seeded default candidate files into database.');
    }
  } catch (err) {
    console.error('Error seeding database:', err);
  }
};

// Hook seeding on DB connection success
mongoose.connection.once('open', seedDatabase);

// 4. NODEMAILER SMTP TRANSPORTER CONFIGURATION
// Configured with credentials loaded from environment variables
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465, // SSL
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// 5. API ROUTES

// Auth Routes

// signup
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password, role, domain, inviteCode } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields (name, email, password, role) are required.' });
  }

  try {
    // Check duplicate
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // Recruiter OTP verification
    if (role === 'recruiter') {
      if (!inviteCode) {
        return res.status(400).json({ error: 'Recruiter Invite Code is required.' });
      }

      const record = await Otp.findOne({ email });
      if (!record) {
        return res.status(404).json({ error: 'No invite code found for this email. Please request a new one.' });
      }

      if (record.code.toUpperCase().trim() !== inviteCode.toUpperCase().trim()) {
        return res.status(400).json({ error: 'Incorrect Invite Code. Please try again.' });
      }

      // Clear Otp
      await Otp.deleteOne({ _id: record._id });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      domain: role === 'candidate' ? domain : undefined
    });

    await newUser.save();
    console.log(`Created new ${role} user: ${email}`);

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        domain: newUser.domain
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Database signup error.', details: err.message });
  }
});

// login
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (role && user.role !== role) {
      return res.status(401).json({ error: `Invalid email or password for ${role} portal.` });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log(`User logged in successfully: ${email}`);
    return res.status(200).json({
      success: true,
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        domain: user.domain
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Database login error.', details: err.message });
  }
});

// Get logged-in user profile
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        domain: user.domain
      }
    });
  } catch (err) {
    console.error('Fetch profile error:', err);
    return res.status(500).json({ error: 'Database fetch profile error.', details: err.message });
  }
});

// Update user profile name
app.patch('/api/auth/update-profile', authMiddleware, async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { name }, { new: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({ success: true, name: user.name });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Database update profile error.', details: err.message });
  }
});

// A. Send Recruiter Invite Code
app.post('/api/otp/send', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and Code are required.' });
  }

  try {
    // Delete any existing OTP for this email
    await Otp.deleteMany({ email });

    // Store new OTP document in MongoDB
    const newOtp = new Otp({ email, code });
    await newOtp.save();

    // Nodemailer Email configuration
    const mailOptions = {
      from: `"Crewcore HR" <${process.env.SMTP_USER}>`, // Sender
      to: email, // Recipient
      subject: 'Your Recruiter Portal Invite Code - Crewcore HR',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #8b5cf6; text-align: center;">Welcome to Crewcore HR Console</h2>
          <p>Hello Recruiter,</p>
          <p>You recently requested a verification code to access the Crewcore HR administrative dashboard.</p>
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #111827;">${code}</span>
          </div>
          <p>Please enter this verification code on the login page to complete your login session. This code is valid for 15 minutes.</p>
          <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280; text-align: center;">
            If you did not make this request, please ignore this email or contact support.
          </p>
        </div>
      `
    };

    let info = await transporter.sendMail(mailOptions);
    console.log('Invite code sent via SMTP to: %s. MessageID: %s', email, info.messageId);

    return res.status(200).json({
      success: true,
      message: 'Invite code email dispatched successfully!',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('SMTP Mailer Error (falling back to database code verification):', error.message);
    console.log(`[SIMULATED OTP] Code for ${email} is: ${code}`);
    // Still return 200 success so the user can verify the code using the UI simulated alert
    return res.status(200).json({
      success: true,
      message: 'Invite code saved to database successfully (SMTP dispatch failed).',
      simulated: true
    });
  }
});

// B. Verify Recruiter Invite Code
app.post('/api/otp/verify', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and Code are required.' });
  }

  try {
    // Lookup matching OTP document
    const record = await Otp.findOne({ email });
    if (!record) {
      return res.status(404).json({ success: false, error: 'No invite code found for this email. Please request a new one.' });
    }

    if (record.code.toUpperCase().trim() !== code.toUpperCase().trim()) {
      return res.status(400).json({ success: false, error: 'Incorrect Invite Code. Please try again.' });
    }

    // Delete the verified OTP code to prevent reuse
    await Otp.deleteOne({ _id: record._id });

    return res.status(200).json({ success: true, message: 'Invite Code verified successfully!' });
  } catch (err) {
    console.error('OTP Verification Error:', err);
    return res.status(500).json({ error: 'Database verification failure.', details: err.message });
  }
});

// C. Get Job Listings
app.get('/api/jobs', authMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find({});
    return res.status(200).json(jobs);
  } catch (err) {
    console.error('Error fetching jobs:', err);
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// D. Get Candidates List
app.get('/api/candidates', authMiddleware, async (req, res) => {
  try {
    const candidates = await Candidate.find({}).sort({ appliedDate: -1 });
    return res.status(200).json(candidates);
  } catch (err) {
    console.error('Error fetching candidates:', err);
    return res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// E. Submit Candidate Application
app.post('/api/candidates', authMiddleware, async (req, res) => {
  try {
    const candidateData = req.body;
    const newCandidate = new Candidate(candidateData);
    await newCandidate.save();
    console.log('Persisted new candidate application in DB:', newCandidate.name);
    return res.status(201).json({ success: true, data: newCandidate });
  } catch (err) {
    console.error('Error creating candidate application:', err);
    return res.status(500).json({ error: 'Failed to save application', details: err.message });
  }
});

// F. Update Candidate Status
app.patch('/api/candidates/:id/status', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updated = await Candidate.findOneAndUpdate(
      { id },
      { status },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    console.log(`Updated candidate ${id} status to: ${status}`);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('Error updating status:', err);
    return res.status(500).json({ error: 'Failed to update status' });
  }
});

// G. Get Notes for Candidate
app.get('/api/candidates/:id/notes', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const notes = await Note.find({ candidateId: id }).sort({ timestamp: -1 });
    return res.status(200).json(notes);
  } catch (err) {
    console.error('Error fetching notes:', err);
    return res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// H. Add Note
app.post('/api/candidates/:id/notes', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { text, timestamp, noteId } = req.body;

  try {
    const newNote = new Note({
      id: noteId || 'note_' + Date.now(),
      candidateId: id,
      text,
      timestamp
    });
    await newNote.save();
    return res.status(201).json({ success: true, data: newNote });
  } catch (err) {
    console.error('Error adding note:', err);
    return res.status(500).json({ error: 'Failed to save note' });
  }
});

// I. Delete Note
app.delete('/api/notes/:noteId', authMiddleware, async (req, res) => {
  const { noteId } = req.params;
  try {
    const result = await Note.deleteOne({ id: noteId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    return res.status(200).json({ success: true, message: 'Note deleted' });
  } catch (err) {
    console.error('Error deleting note:', err);
    return res.status(500).json({ error: 'Failed to delete note' });
  }
});

// ==========================================
// 6. GEMINI AI ROUTER & CONTROLLER LAYER
// ==========================================

const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.statusText}. Details: ${errText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Invalid response structure from Gemini API');
  }
  return text;
};

const cleanJsonString = (str) => {
  let cleaned = str.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*/, '');
    cleaned = cleaned.replace(/```$/, '');
    cleaned = cleaned.trim();
  }
  return cleaned;
};

// Fallback Generators (Realism Fail-safes if API Key is missing or service is offline)
const generateJdFallback = (title, domain, keywords) => {
  const keywordList = keywords && keywords.length > 0 ? keywords : ['Collaboration', 'Agile', 'Communication'];
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
};

const getQuestionsFallback = (domain, seniority) => {
  const questionsMap = {
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
};

const screenFallback = (resume, answers) => {
  const textToAnalyze = (resume + ' ' + answers.map(a => a.answer).join(' ')).toLowerCase();
  let score = 75;
  const positiveKeywords = [
    'experience', 'management', 'sourcing', 'ats', 'workday', 'payroll', 
    'mediation', 'grievance', 'compliance', 'negotiation', 'star method', 
    'boolean', 'certified', 'led', 'managed', 'database'
  ];

  positiveKeywords.forEach(kw => {
    if (textToAnalyze.includes(kw)) score += 2.5;
  });

  answers.forEach(ans => {
    if (ans.answer.length > 150) score += 3;
    else if (ans.answer.length < 50) score -= 4;
  });

  score = Math.max(50, Math.min(98, Math.round(score)));

  let summary = '';
  let strengths = [];
  let weaknesses = [];

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
    strengths = ['Basic understanding of workflows', 'Willingness to learn and adjust'];
    weaknesses = ['Gaps in critical platform usage details', 'Short or under-explained answers to screening prompts'];
  }

  return { score, summary, strengths, weaknesses };
};

const chatFallback = (message, roleMode) => {
  const input = message.toLowerCase();

  if (roleMode === 'recruiter') {
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
};

// AI Routes

// 1. Generate JD
app.post('/api/ai/generate-jd', authMiddleware, async (req, res) => {
  const { title, domain, keywords } = req.body;
  if (!title || !domain) {
    return res.status(400).json({ error: 'Title and Domain are required.' });
  }

  try {
    const prompt = `Write a professional Job Description for the job title: '${title}' in the department/domain: '${domain}'. Key skills to highlight: ${keywords ? keywords.join(', ') : 'none'}. Return the response in Markdown format.`;
    const jdText = await callGemini(prompt);
    return res.status(200).json({ jd: jdText });
  } catch (err) {
    console.warn('Gemini JD generation offline, using fallback:', err.message);
    const fallbackJd = generateJdFallback(title, domain, keywords);
    return res.status(200).json({ jd: fallbackJd, fallback: true });
  }
});

// 2. Generate Interview Questions
app.post('/api/ai/interview-questions', authMiddleware, async (req, res) => {
  const { domain, seniority } = req.body;
  if (!domain) {
    return res.status(400).json({ error: 'Domain is required.' });
  }

  try {
    const prompt = `Generate a list of exactly 3 professional interview questions for a candidate applying for a '${domain}' role at seniority level '${seniority || 'Mid-Level'}'. Return only the list of questions as a JSON array of strings, e.g. ["question 1", "question 2", "question 3"]. Do not include markdown code block formatting or other text, just the raw JSON array.`;
    const responseText = await callGemini(prompt);
    const cleaned = cleanJsonString(responseText);
    const questions = JSON.parse(cleaned);
    if (!Array.isArray(questions)) throw new Error('Response is not a JSON array');
    return res.status(200).json(questions);
  } catch (err) {
    console.warn('Gemini questions generation offline, using fallback:', err.message);
    const fallbackQ = getQuestionsFallback(domain, seniority || 'Mid-Level');
    return res.status(200).json(fallbackQ);
  }
});

// 3. Screen Application
app.post('/api/ai/screen', authMiddleware, async (req, res) => {
  const { resume, answers } = req.body;
  if (!resume || !answers) {
    return res.status(400).json({ error: 'Resume and Answers are required.' });
  }

  try {
    const prompt = `Evaluate the following candidate application for a role.
Candidate Resume Content:
${resume}

Screening Question & Answers:
${JSON.stringify(answers)}

Assess the candidate fit. Output the result strictly in JSON format matching this schema:
{
  "score": <number between 50 and 99 representing candidate fit percentage>,
  "summary": "<brief 2-3 sentence overview of candidate suitability>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<area to improve 1>", "<area to improve 2>", "<area to improve 3>"]
}
Do not include markdown code block formatting or other text, just the raw JSON.`;
    const responseText = await callGemini(prompt);
    const cleaned = cleanJsonString(responseText);
    const result = JSON.parse(cleaned);
    return res.status(200).json(result);
  } catch (err) {
    console.warn('Gemini candidate screening offline, using fallback:', err.message);
    const fallbackResult = screenFallback(resume, answers);
    return res.status(200).json(fallbackResult);
  }
});

// 4. Chat with Bot
app.post('/api/ai/chat', authMiddleware, async (req, res) => {
  const { history, message, roleMode } = req.body;
  if (!message || !roleMode) {
    return res.status(400).json({ error: 'Message and RoleMode are required.' });
  }

  try {
    const botContext = roleMode === 'recruiter'
      ? "You are CrewBot, a helpful AI Recruiting Assistant for Crewcore HR. You help recruiters draft job descriptions, prepare interview templates, and screen candidates. Keep responses professional, clear, and action-oriented. Support simple bolding (**text**) and bullet lists (- item) in markdown."
      : "You are CrewBot, a helpful AI HR Coach for candidates in the Crewcore HR Learning Academy. You explain HR concepts (like STAR method, PIPs, compliance) and guide candidates through roleplay exercises. Keep responses supportive, clear, and educational. Support simple bolding (**text**) and bullet lists (- item) in markdown.";
    
    let formattedHistory = '';
    if (history && history.length > 0) {
      formattedHistory = "History:\n" + history.map(h => `${h.role === 'user' ? 'User' : 'CrewBot'}: ${h.content}`).join('\n') + '\n';
    }

    const prompt = `${botContext}\n\n${formattedHistory}User: ${message}\nCrewBot:`;
    const responseText = await callGemini(prompt);
    return res.status(200).json({ response: responseText });
  } catch (err) {
    console.warn('Gemini chat offline, using fallback:', err.message);
    const fallbackResponse = chatFallback(message, roleMode);
    return res.status(200).json({ response: fallbackResponse });
  }
});

// Start Express Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`MongoDB-supported HR backend server running on http://localhost:${PORT}`);
});
