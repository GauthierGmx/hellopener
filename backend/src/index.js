import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import prisma from './config/db.js';
import redis from './config/redis.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de base
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route racine API
app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Hellopener API opérationnelle',
    version: '1.0.0',
  });
});

// Route de diagnostic et de santé (healthcheck)
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  // Test de la base de données PostgreSQL
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = 'healthy';
  } catch (error) {
    health.status = 'degraded';
    health.services.database = `error: ${error.message}`;
  }

  // Test de Redis
  try {
    if (redis.status !== 'ready') {
      await redis.connect();
    }
    const pingResponse = await redis.ping();
    health.services.redis = pingResponse === 'PONG' ? 'healthy' : 'unexpected_response';
  } catch (error) {
    health.status = 'degraded';
    health.services.redis = `error: ${error.message}`;
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Démarrage du serveur
const server = app.listen(PORT, () => {
  console.log(`Serveur backend démarré sur http://localhost:${PORT}`);
});

export default app;

