// Catches any request that did not match a registered route

const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error); 
};


// All errors from controllers and middleware end up here via next(err).
const errorHandler = (err, req, res, next) => {
  // Controllers set the status code before calling next(err).
  // If they forgot (status is still 200), we default to 500 (Internal Server Error).
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export { notFound, errorHandler };
