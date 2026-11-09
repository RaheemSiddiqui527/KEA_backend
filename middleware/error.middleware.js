export default function errorHandler(err, req, res, next) {
  console.error('Error middleware caught:', err);

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

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Server error',
    error: err.message || 'Server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}
