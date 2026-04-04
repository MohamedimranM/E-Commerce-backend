import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// Signup Controller
export const signup = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, role } = req.body;
    if (!name || !email || !password || !confirmPassword) {
      const err = new Error('All fields are required.');
      err.statusCode = 400;
      return next(err);
    }
    if (password !== confirmPassword) {
      const err = new Error('Passwords do not match.');
      err.statusCode = 400;
      return next(err);
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const err = new Error('Email already in use.');
      err.statusCode = 409;
      return next(err);
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      confirmPassword: hashedPassword,
      role
    });
    await user.save();
    const token = generateToken(user);
    res.status(201).json({
      message: 'User registered successfully.',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (error) {
    next(error);
  }
};

// Signin Controller
export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      const err = new Error('Email and password are required.');
      err.statusCode = 400;
      return next(err);
    }
    const user = await User.findOne({ email });
    if (!user) {
      const err = new Error('Invalid credentials.');
      err.statusCode = 401;
      return next(err);
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error('Invalid credentials.');
      err.statusCode = 401;
      return next(err);
    }
    const token = generateToken(user);
    res.status(200).json({
      message: 'Login successful.',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (error) {
    next(error);
  }
};
