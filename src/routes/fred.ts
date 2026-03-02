import { Router, Request, Response } from 'express';
import { fetchFredSeries } from '../connectors/fred/fredApiClient';

const router = Router();

// STORY-001e: lightweight connectivity probe — fetches the 3 most recent
// DGS10 observations to confirm the FRED API key is valid and the service
// is reachable. Returns the app version alongside the sample for easy
// post-deployment sanity checks.
router.get('/health/fred', async (_req: Request, res: Response) => {
  const version = process.env.VERSION ?? 'unknown';
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

export default router;
