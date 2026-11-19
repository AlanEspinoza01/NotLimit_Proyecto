import express from 'express';
import { MONGODB_COLLECTIONS } from '../models';

export const getHealthStatus = (_req: express.Request, res: express.Response): void => {
  res.json({
    ok: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'No Limits API Backend',
    collectionsConfigured: MONGODB_COLLECTIONS,
  });
};
