import express, { Application, Request, Response } from 'express';
import { fetchFredSeries } from './connectors/fred/fredApiClient';
import packageJson from '../package.json';

export function createApp(): Application {
  const app = express();

  app.get('/', (_req: Request, res: Response) => {
    res.json({ message: 'Hello World', status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'healthy' });
  });

  // STORY-001e: lightweight connectivity probe — fetches the 3 most recent
  // DGS10 observations to confirm the FRED API key is valid and the service
  // is reachable. Returns the app version alongside the sample for easy
  // post-deployment sanity checks.
  app.get('/api/health/fred', async (_req: Request, res: Response) => {
    const version = packageJson.version;
    const gitSha = process.env.GIT_SHA ?? 'dev';
    try {
      const apiKey = process.env.FRED_API_KEY?.trim();
      if (!apiKey) {
        throw new Error('FRED_API_KEY environment variable is not set');
      }
      const response = await fetchFredSeries('DGS10', apiKey, { limit: 3 });
      const observations = response.observations
        .filter(obs => obs.value.trim() !== '.')
        .map(obs => ({ date: obs.date, value: parseFloat(obs.value) }));
      res.json({
        status: 'ok',
        version,
        gitSha,
        fred: { status: 'ok', sample: { series: 'DGS10', observations } },
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        version,
        gitSha,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return app;
}
