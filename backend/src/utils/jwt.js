require('dotenv').config();

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('CRITICAL FATAL ERROR: JWT_SECRET environment variable is missing in production!');
      process.exit(1);
    }
    throw new Error('JWT_SECRET environment variable is not defined. Please set JWT_SECRET in your backend/.env file.');
  }
  return secret;
}

module.exports = { getJwtSecret };
