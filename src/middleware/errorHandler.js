/**
 * Centralized Express Error Handling Middleware
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Handle Express body-parser malformed JSON syntax error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: {
        message: 'Malformed JSON payload in request body'
      }
    });
  }

  // Determine HTTP status code
  const statusCode = err.statusCode || err.status || 500;
  
  // Format standardized JSON error response
  const response = {
    error: {
      message: err.message || 'Internal server error'
    }
  };

  if (err.details) {
    response.error.details = err.details;
  }

  // Mask stack traces, credentials, and SQL statements in production
  if (statusCode === 500) {
    if (process.env.NODE_ENV === 'production') {
      response.error.message = 'An unexpected internal server error occurred';
    } else {
      console.error('[Internal Server Error]', err);
    }
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
