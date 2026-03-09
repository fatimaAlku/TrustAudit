const express = require('express');
const cors = require('cors');
const config = require('./config/config');

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    env: config.env,
    timestamp: new Date().toISOString(),
  });
});

// Base router for API resources
const apiRouter = express.Router();

// Audits endpoints (placeholder)
apiRouter.get('/audits', (req, res) => {
  res.json({ items: [], message: 'List of audits (placeholder)' });
});

apiRouter.post('/audits', (req, res) => {
  res.status(201).json({ message: 'Create audit (placeholder)' });
});

// Controls endpoints (placeholder)
apiRouter.get('/controls', (req, res) => {
  res.json({ items: [], message: 'List of controls (placeholder)' });
});

// Evidence endpoints (placeholder)
apiRouter.post('/evidence', (req, res) => {
  res.status(201).json({ message: 'Upload evidence (placeholder)' });
});

app.use('/api', apiRouter);

// Fallback for non-existing routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const port = config.port;

app.listen(port, () => {
  console.log(`Smart IT Audit backend listening on port ${port}`);
});

module.exports = app;

