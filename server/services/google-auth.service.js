const { OAuth2Client } = require('google-auth-library');
const { googleClientId } = require('../config');

const client = new OAuth2Client(googleClientId || undefined);

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function verifyGoogleIdToken(idToken) {
  const token = String(idToken || '').trim();

  if (!googleClientId) {
    throw httpError(503, 'Google Login is not configured. Add GOOGLE_CLIENT_ID to .env.');
  }

  if (!token) {
    throw httpError(400, 'Missing Google ID token.');
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: googleClientId
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.sub || !payload.email) {
      throw httpError(401, 'Invalid Google ID token payload.');
    }

    if (payload.email_verified !== true && payload.email_verified !== 'true') {
      throw httpError(401, 'Google account email is not verified.');
    }

    return {
      googleSub: payload.sub,
      email: String(payload.email).trim().toLowerCase(),
      fullName: String(payload.name || payload.email).trim(),
      avatarUrl: payload.picture || null
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    throw httpError(401, 'Invalid Google ID token.');
  }
}

module.exports = {
  verifyGoogleIdToken
};
