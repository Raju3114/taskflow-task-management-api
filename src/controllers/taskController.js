const taskService = require('../services/taskService');

/**
 * Task Controller - Handles incoming HTTP requests, invokes service layer, and returns responses
 */
const taskController = {
  /**
   * POST /api/tasks - Create a task
   */
  async createTask(req, res, next) {
    try {
      const task = await taskService.createTask(req.body);
      return res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/tasks - List all tasks (with optional status & priority filters)
   */
  async getAllTasks(req, res, next) {
    try {
      const tasks = await taskService.getAllTasks(req.query);
      return res.status(200).json(tasks);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/tasks/:id - Retrieve a task by ID
   */
  async getTaskById(req, res, next) {
    try {
      const task = await taskService.getTaskById(req.params.id);
      if (!task) {
        return res.status(404).json({
          error: {
            message: 'Task not found'
          }
        });
      }
      return res.status(200).json(task);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/tasks/:id - Full resource replacement update for a task
   */
  async updateTask(req, res, next) {
    try {
      const updatedTask = await taskService.updateTask(req.params.id, req.body);
      if (!updatedTask) {
        return res.status(404).json({
          error: {
            message: 'Task not found'
          }
        });
      }
      return res.status(200).json(updatedTask);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/tasks/:id - Delete a task by ID
   */
  async deleteTask(req, res, next) {
    try {
      const deleted = await taskService.deleteTask(req.params.id);
      if (!deleted) {
        return res.status(404).json({
          error: {
            message: 'Task not found'
          }
        });
      }
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
};

module.exports = taskController;
