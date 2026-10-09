/**
 * Catch-all middleware for 404 Unmatched Routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`
    }
  });
};

module.exports = notFoundHandler;
