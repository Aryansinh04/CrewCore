// Node.js SMTP Express Backend Template - Nodemailer Integration Reference
// To run this server: 
// 1. Run: npm install express cors nodemailer
// 2. Run: node server/mailer.js

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // Allow requests from Vite React app (http://localhost:5173)

// Configure Nodemailer SMTP Transporter
// Replace user and pass with your actual SMTP credentials (e.g. Gmail App Password, Mailtrap, SendGrid)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465, // SSL
  secure: true,
  auth: {
    user: '23se02ie028@ppsu.ac.in',
    pass: 'ocfzrsfcgtqrijbj'
  }
});

// API Endpoint to send Recruiter Invite Code
app.post('/api/send-code', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and Code are required.' });
  }

  // Email payload configuration
  const mailOptions = {
    from: '"Crewcore HR" <no-reply@crewcore.com>', // Sender address
    to: email,                                     // Recruiter recipient
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

  try {
    // Send email using SMTP transporter
    let info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);

    return res.status(200).json({
      success: true,
      message: 'Invite code email dispatched successfully!',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('SMTP Mailer Error:', error);
    return res.status(500).json({
      error: 'Failed to send invite code email via SMTP. Please check your transporter configuration.',
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SMTP Mailer service running on http://localhost:${PORT}`);
});
