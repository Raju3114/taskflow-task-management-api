const express = require('express');
const taskRoutes = require('./routes/taskRoutes');
const notFoundHandler = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Express JSON body parser middleware
app.use(express.json());

// Register API Routes
app.use('/api/tasks', taskRoutes);

// Catch unmatched routes (404)
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
