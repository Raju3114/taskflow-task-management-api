const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const {
  validateTaskId,
  validateCreateTask,
  validateUpdateTask,
  validateGetTasksQuery
} = require('../validators/taskValidator');

// Map REST API endpoints to validation middleware and controller handlers
router.post('/', validateCreateTask, taskController.createTask);
router.get('/', validateGetTasksQuery, taskController.getAllTasks);
router.get('/:id', validateTaskId, taskController.getTaskById);
router.put('/:id', validateUpdateTask, taskController.updateTask);
router.delete('/:id', validateTaskId, taskController.deleteTask);

module.exports = router;
