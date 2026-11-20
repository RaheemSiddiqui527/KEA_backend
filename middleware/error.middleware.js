export default function errorHandler(err, req, res, next) {
  console.error('Error middleware caught:', err);

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    return res.status(400).json({
      success: false,
      message,
      error: message
    });
  }

  // Mongoose ValidationError (missing required fields)
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message || 'Validation Error: Missing required fields',
      error: err.message
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      error: err.message
    });
  }

  // Syntax / Payload parse errors
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error: Malformed JSON payload',
      error: 'Malformed JSON payload'
    });
  }

  // Bcrypt illegal arguments error
  if (err.message && err.message.includes('Illegal arguments')) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error: Missing required password fields',
      error: err.message
    });
  }

  if (err.name === 'MulterError') {
    let message = 'File upload error';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds maximum allowed limit of 500MB';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded simultaneously (maximum 100 allowed per request)';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = `Unexpected upload field: ${err.field || 'unknown'}`;
    } else {
      message = err.message || 'File upload failed';
    }
    return res.status(400).json({
      success: false,
      message,
      error: message
    });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}
