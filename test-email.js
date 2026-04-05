import dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });

import nodemailer from 'nodemailer';

console.log('--- Email Config ---');
console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE || '(not set, defaulting to gmail)');
console.log('EMAIL_USER:', process.env.EMAIL_USER || '(not set!)');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '****' + process.env.EMAIL_PASS.slice(-4) : '(not set!)');
console.log('---');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

try {
  console.log('Verifying SMTP connection...');
  await transporter.verify();
  console.log('SMTP connection verified successfully!');

  console.log('Sending test email...');
  const info = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER, // send to yourself
    subject: 'Shopping Hub — Test Email',
    html: '<h2 style="color:#0984E3">Email is working!</h2><p>If you see this, your email config is correct.</p>',
  });

  console.log('Email sent successfully!');
  console.log('Message ID:', info.messageId);
  console.log('Response:', info.response);
} catch (error) {
  console.error('EMAIL ERROR:', error.message);
  console.error('Full error:', error);
}
