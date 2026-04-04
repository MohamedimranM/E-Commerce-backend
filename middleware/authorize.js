import jwt from 'jsonwebtoken';


import User from '../models/user.model.js';

const authorize = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('Authorization token missing or invalid.');
    err.statusCode = 401;
    return next(err);
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Fetch user from DB to get the name
    const user = await User.findById(decoded.id);
    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 401;
      return next(err);
    }
    req.user = { id: user._id, name: user.name, email: user.email, role: user.role };
    next();
  } catch (error) {
    error.statusCode = 401;
    error.message = 'Invalid or expired token.';
    next(error);
  }
};

export default authorize;
