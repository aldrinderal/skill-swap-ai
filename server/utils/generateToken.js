import jwt from 'jsonwebtoken';

/**
 * Generate a signed JSON Web Token
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {string} Signed JWT token
 */
export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

export default generateToken;
