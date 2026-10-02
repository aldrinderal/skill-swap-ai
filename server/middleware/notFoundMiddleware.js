/**
 * 404 Not Found Middleware
 * Handles all requests targeting unregistered endpoints
 */
export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'API route not found',
  });
};

export default notFound;
