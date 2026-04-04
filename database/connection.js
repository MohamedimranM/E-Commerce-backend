// MongoDB connection setup
import mongoose from 'mongoose';

import  '../config/env.js'; // Ensure environment variables are loaded

const dbUrl = process.env.DB_HOST;

const connectDB = async () => {
  try {
    await mongoose.connect(dbUrl);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
