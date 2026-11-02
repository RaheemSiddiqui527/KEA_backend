export default function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      message: 'File size exceeds maximum allowed limit of 500MB',
      error: 'File size exceeds maximum allowed limit of 500MB'
    });
  }
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Server error', stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
}
