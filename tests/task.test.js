const request = require('supertest');

// Set test environment variables BEFORE requiring app or db modules
process.env.NODE_ENV = 'test';
process.env.TEST_DB_NAME = process.env.TEST_DB_NAME || 'taskflow_test';

const app = require('../src/app');
const { pool, closePool, validateTestDatabaseGuard } = require('../src/config/db');

describe('TaskFlow REST API Test Suite', () => {
  let isDbAvailable = false;

  beforeAll(async () => {
    // 1. Enforce strict database security guard check
    validateTestDatabaseGuard();

    // 2. Test PostgreSQL database connectivity
    try {
      await pool.query('SELECT 1;');
      isDbAvailable = true;

      // Clean up test table safely if PostgreSQL is available
      await pool.query('DELETE FROM tasks;');
    } catch (err) {
      isDbAvailable = false;
      console.warn(
        `\n[Notice] PostgreSQL database server is not available locally (${err.message}). Database integration tests will be skipped/blocked as expected.`
      );
    }
  });

  afterAll(async () => {
    // Clean up test data and terminate connection pool
    if (isDbAvailable) {
      try {
        await pool.query('DELETE FROM tasks;');
      } catch (err) {
        // Ignore cleanup errors on shutdown
      }
    }
    await closePool();
  });

  // ==========================================
  // SECTION 1: HTTP & REQUEST VALIDATION TESTS
  // ==========================================
  describe('Input Validation & Error Middleware Tests', () => {
    test('POST /api/tasks - Rejects request with missing title (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ description: 'No title provided' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toBe('Validation failed');
    });

    test('POST /api/tasks - Rejects empty or whitespace-only title (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Validation failed');
    });

    test('POST /api/tasks - Rejects invalid status enum value (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Valid Title', status: 'invalid_status' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Validation failed');
    });

    test('POST /api/tasks - Rejects invalid priority enum value (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Valid Title', priority: 'super_high' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Validation failed');
    });

    test('POST /api/tasks - Rejects server-managed field "id" in request body (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ id: 100, title: 'Attempt setting ID' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('server-managed');
    });

    test('POST /api/tasks - Rejects server-managed field "created_at" in request body (HTTP 400)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Attempt setting timestamp', created_at: '2026-01-01' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('server-managed');
    });

    test('GET /api/tasks - Rejects unsupported query parameters (HTTP 400)', async () => {
      const res = await request(app).get('/api/tasks?unsupported_param=123');

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Unsupported query parameter');
    });

    test('GET /api/tasks/:id - Rejects non-integer task ID (HTTP 400)', async () => {
      const res = await request(app).get('/api/tasks/invalid-id-string');

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Validation failed');
    });

    test('GET /api/tasks/:id - Rejects non-positive integer task ID (HTTP 400)', async () => {
      const res = await request(app).get('/api/tasks/0');

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Validation failed');
    });

    test('PUT /api/tasks/:id - Rejects request without mandatory title (HTTP 400)', async () => {
      const res = await request(app)
        .put('/api/tasks/1')
        .send({ description: 'Missing title for PUT' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Validation failed');
    });

    test('POST /api/tasks - Returns HTTP 400 for malformed JSON payload', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Content-Type', 'application/json')
        .send('{"title": "Broken JSON, missing closing brace');

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Malformed JSON payload in request body');
    });

    test('Unmatched endpoint - Returns HTTP 404 for nonexistent route', async () => {
      const res = await request(app).get('/api/nonexistent-route');

      expect(res.status).toBe(404);
      expect(res.body.error.message).toContain('Route not found');
    });
  });

  // ==========================================
  // SECTION 2: LIVE DATABASE INTEGRATION TESTS
  // ==========================================
  describe('PostgreSQL Database CRUD & Filtering Integration', () => {
    test('POST /api/tasks - Creates a task successfully (HTTP 201)', async () => {
      if (!isDbAvailable) return;

      const payload = {
        title: 'Learn PostgreSQL integration',
        description: 'Practice writing parameterized queries',
        status: 'in_progress',
        priority: 'high'
      };

      const res = await request(app).post('/api/tasks').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe(payload.title);
      expect(res.body.description).toBe(payload.description);
      expect(res.body.status).toBe(payload.status);
      expect(res.body.priority).toBe(payload.priority);
      expect(res.body.created_at).toBeDefined();
      expect(res.body.updated_at).toBeDefined();
    });

    test('GET /api/tasks - Lists created tasks (HTTP 200)', async () => {
      if (!isDbAvailable) return;

      const res = await request(app).get('/api/tasks');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('GET /api/tasks?status=...&priority=... - Filters tasks by status and priority (HTTP 200)', async () => {
      if (!isDbAvailable) return;

      const res = await request(app).get('/api/tasks?status=in_progress&priority=high');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((task) => {
        expect(task.status).toBe('in_progress');
        expect(task.priority).toBe('high');
      });
    });

    test('GET /api/tasks/:id - Retrieves task by valid ID (HTTP 200)', async () => {
      if (!isDbAvailable) return;

      // Create a task first
      const createRes = await request(app)
        .post('/api/tasks')
        .send({ title: 'Task to retrieve' });

      const taskId = createRes.body.id;

      const res = await request(app).get(`/api/tasks/${taskId}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(taskId);
      expect(res.body.title).toBe('Task to retrieve');
    });

    test('GET /api/tasks/:id - Returns HTTP 404 for nonexistent task ID', async () => {
      if (!isDbAvailable) return;

      const res = await request(app).get('/api/tasks/999999');

      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('Task not found');
    });

    test('PUT /api/tasks/:id - Replaces existing task (HTTP 200)', async () => {
      if (!isDbAvailable) return;

      const createRes = await request(app)
        .post('/api/tasks')
        .send({ title: 'Original Task Title', priority: 'low' });

      const taskId = createRes.body.id;

      const updatePayload = {
        title: 'Updated Task Title',
        description: 'New Description',
        status: 'completed',
        priority: 'high'
      };

      const res = await request(app).put(`/api/tasks/${taskId}`).send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(taskId);
      expect(res.body.title).toBe(updatePayload.title);
      expect(res.body.status).toBe(updatePayload.status);
      expect(res.body.priority).toBe(updatePayload.priority);
    });

    test('DELETE /api/tasks/:id - Deletes an existing task (HTTP 204)', async () => {
      if (!isDbAvailable) return;

      const createRes = await request(app)
        .post('/api/tasks')
        .send({ title: 'Task to delete' });

      const taskId = createRes.body.id;

      const deleteRes = await request(app).delete(`/api/tasks/${taskId}`);
      expect(deleteRes.status).toBe(204);

      // Verify task is gone
      const getRes = await request(app).get(`/api/tasks/${taskId}`);
      expect(getRes.status).toBe(404);
    });
  });
});
