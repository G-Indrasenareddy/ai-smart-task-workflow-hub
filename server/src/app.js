import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import apiRouter from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);

// Body parsing middleware with payload limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Main API Router Mounting
app.use('/api', apiRouter);

// 404 & Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

export default app;
