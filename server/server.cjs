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

// Start Express Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`MongoDB-supported HR backend server running on http://localhost:${PORT}`);
});
