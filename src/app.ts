import express, { Application, Request, Response } from 'express';
import {
  fetchYieldCurveData,
  fetchCreditSpreadsData,
  fetchUnemploymentData,
  fetchPMIData,
} from './connectors/fred/fredConnector';

export function createApp(): Application {
  const app = express();

  app.get('/', (_req: Request, res: Response) => {
    res.json({ message: 'Hello World', status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'healthy' });
  });

  // STORY-001e: diagnostic endpoint — invokes all FRED connectors and returns
  // a recent sample of each indicator. Use this to verify data ingestion is
  // working after a deployment.
  app.get('/api/health/fred', async (_req: Request, res: Response) => {
    try {
      const [yieldCurve, creditSpreads, unemployment, pmi] = await Promise.all([
        fetchYieldCurveData(),
        fetchCreditSpreadsData(),
        fetchUnemploymentData(),
        fetchPMIData(),
      ]);
      res.json({
        status: 'ok',
        indicators: { yieldCurve, creditSpreads, unemployment, pmi },
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return app;
}
