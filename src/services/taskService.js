const db = require('../config/db');

/**
 * Task Service Layer - Handles all database persistence logic using parameterized queries
 */
const taskService = {
  /**
   * Create a new task in PostgreSQL
   */
  async createTask({ title, description = null, status = 'pending', priority = 'medium' }) {
    const text = `
      INSERT INTO tasks (title, description, status, priority)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, description, status, priority, created_at, updated_at;
    `;
    const params = [title, description, status, priority];
    const result = await db.query(text, params);
    return result.rows[0];
  },

  /**
   * Retrieve all tasks with optional status and priority filters
   */
  async getAllTasks({ status, priority } = {}) {
    let text = 'SELECT id, title, description, status, priority, created_at, updated_at FROM tasks';
    const params = [];
    const conditions = [];

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (priority) {
      params.push(priority);
      conditions.push(`priority = $${params.length}`);
    }

    if (conditions.length > 0) {
      text += ' WHERE ' + conditions.join(' AND ');
    }

    text += ' ORDER BY id ASC;';

    const result = await db.query(text, params);
    return result.rows;
  },

  /**
   * Retrieve a single task by its integer ID
   */
  async getTaskById(id) {
    const text = `
      SELECT id, title, description, status, priority, created_at, updated_at
      FROM tasks
      WHERE id = $1;
    `;
    const result = await db.query(text, [id]);
    return result.rows[0] || null;
  },

  /**
   * Full resource replacement (PUT) for an existing task
   * Omitted optional fields default to schema baseline values
   */
  async updateTask(id, { title, description = null, status = 'pending', priority = 'medium' }) {
    const text = `
      UPDATE tasks
      SET title = $1, description = $2, status = $3, priority = $4
      WHERE id = $5
      RETURNING id, title, description, status, priority, created_at, updated_at;
    `;
    const params = [title, description, status, priority, id];
    const result = await db.query(text, params);
    return result.rows[0] || null;
  },

  /**
   * Delete a task by its integer ID
   */
  async deleteTask(id) {
    const text = 'DELETE FROM tasks WHERE id = $1 RETURNING id;';
    const result = await db.query(text, [id]);
    return result.rowCount > 0;
  }
};

module.exports = taskService;
