import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client();

/**
 * Verify a Google Identity Services ID token credential
 * Validates cryptographic signature, audience, issuer, and expiration date.
 * @param {string} idToken - The Google ID token credential from client GIS
 * @returns {Promise<Object>} Decoded and verified Google user claims
 */
export const verifyGoogleIdToken = async (idToken) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured in server environment.');
  }

  if (!idToken) {
    throw new Error('No Google ID token provided.');
  }

  // Verifies signature, expiry, and ensures audience matches GOOGLE_CLIENT_ID
  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });

  const payload = ticket.getPayload();

  if (!payload || !payload.sub) {
    throw new Error('Invalid Google token payload.');
  }

  return {
    sub: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified,
    name: payload.name,
    picture: payload.picture,
  };
};

export default { verifyGoogleIdToken };
