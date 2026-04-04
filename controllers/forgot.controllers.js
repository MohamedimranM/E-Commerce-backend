import { sendMail } from '../config/email.js';
import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      const err = new Error('Email is required.');
      err.statusCode = 400;
      return next(err);
    }
    const user = await User.findOne({ email });
    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      return next(err);
    }
    // Generate a reset token (JWT, expires in 15m)
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    // Send real email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    await sendMail({
      to: email,
      subject: 'Password Reset Request',
      html: `<p>You requested a password reset.</p><p>Click <a href="${resetUrl}">here</a> to reset your password. This link will expire in 15 minutes.</p>`
    });
    res.status(200).json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    next(error);
  }
}
;

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    if (!password || !confirmPassword) {
      const err = new Error('Both password fields are required.');
      err.statusCode = 400;
      return next(err);
    }
    if (password !== confirmPassword) {
      const err = new Error('Passwords do not match.');
      err.statusCode = 400;
      return next(err);
    }
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      err.statusCode = 400;
      err.message = 'Invalid or expired token.';
      return next(err);
    }
    const user = await User.findById(payload.id);
    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      return next(err);
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
    user.confirmPassword = hashedPassword;
    await user.save();
    res.status(200).json({ message: 'Password reset successful.' });
  } catch (error) {
    next(error);
  }
};
