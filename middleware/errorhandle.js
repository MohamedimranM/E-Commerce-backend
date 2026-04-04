// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const stack = process.env.NODE_ENV === 'production' ? undefined : err.stack;

  res.status(statusCode).json({
    success: false,
    message,
    ...(stack && { stack })
  });
};

export default errorHandler;
