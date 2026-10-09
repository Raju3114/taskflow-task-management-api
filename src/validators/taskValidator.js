const { body, param, query, validationResult } = require('express-validator');

// Validation rules and domain constraints
const ALLOWED_STATUSES = ['pending', 'in_progress', 'completed'];
const ALLOWED_PRIORITIES = ['low', 'medium', 'high'];
const ALLOWED_QUERY_PARAMS = ['status', 'priority'];
const FORBIDDEN_BODY_FIELDS = ['id', 'created_at', 'updated_at'];

/**
 * Middleware evaluating validation results, forbidden body fields, and unsupported query params
 */
const validate = (req, res, next) => {
  // 1. Reject forbidden server-managed body fields
  if (req.body && typeof req.body === 'object') {
    for (const field of FORBIDDEN_BODY_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        return res.status(400).json({
          error: {
            message: `Field '${field}' is server-managed and cannot be supplied in the request body`
          }
        });
      }
    }
  }

  // 2. Reject unsupported query parameters
  if (req.query && typeof req.query === 'object') {
    const unknownParams = Object.keys(req.query).filter(
      (key) => !ALLOWED_QUERY_PARAMS.includes(key)
    );
    if (unknownParams.length > 0) {
      return res.status(400).json({
        error: {
          message: `Unsupported query parameter(s): ${unknownParams.join(', ')}. Allowed parameters are 'status' and 'priority'.`
        }
      });
    }
  }

  // 3. Evaluate express-validator validation result
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg
    }));
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        details
      }
    });
  }

  next();
};

// Route parameter validation
const validateTaskId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Task ID must be a positive integer'),
  validate
];

// POST /api/tasks validation
const validateCreateTask = [
  body('title')
    .exists({ checkFalsy: false }).withMessage('Title is required')
    .isString().withMessage('Title must be a string')
    .bail()
    .trim()
    .notEmpty().withMessage('Title cannot be empty or whitespace only'),
  body('description')
    .optional({ nullable: true })
    .isString().withMessage('Description must be a string or null'),
  body('status')
    .optional()
    .isString().withMessage('Status must be a string')
    .isIn(ALLOWED_STATUSES).withMessage(`Status must be one of: ${ALLOWED_STATUSES.join(', ')}`),
  body('priority')
    .optional()
    .isString().withMessage('Priority must be a string')
    .isIn(ALLOWED_PRIORITIES).withMessage(`Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}`),
  validate
];

// PUT /api/tasks/:id validation (Full Resource Replacement)
const validateUpdateTask = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Task ID must be a positive integer'),
  body('title')
    .exists({ checkFalsy: false }).withMessage('Title is required for full resource update (PUT)')
    .isString().withMessage('Title must be a string')
    .bail()
    .trim()
    .notEmpty().withMessage('Title cannot be empty or whitespace only'),
  body('description')
    .optional({ nullable: true })
    .isString().withMessage('Description must be a string or null'),
  body('status')
    .optional()
    .isString().withMessage('Status must be a string')
    .isIn(ALLOWED_STATUSES).withMessage(`Status must be one of: ${ALLOWED_STATUSES.join(', ')}`),
  body('priority')
    .optional()
    .isString().withMessage('Priority must be a string')
    .isIn(ALLOWED_PRIORITIES).withMessage(`Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}`),
  validate
];

// GET /api/tasks query parameters validation
const validateGetTasksQuery = [
  query('status')
    .optional()
    .isString().withMessage('Status must be a string')
    .isIn(ALLOWED_STATUSES).withMessage(`Status must be one of: ${ALLOWED_STATUSES.join(', ')}`),
  query('priority')
    .optional()
    .isString().withMessage('Priority must be a string')
    .isIn(ALLOWED_PRIORITIES).withMessage(`Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}`),
  validate
];

module.exports = {
  validateTaskId,
  validateCreateTask,
  validateUpdateTask,
  validateGetTasksQuery
};
