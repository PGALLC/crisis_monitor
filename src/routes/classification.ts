import { Router, Request, Response } from 'express';
import {
  fetchYieldCurveData,
  fetchCreditSpreadsData,
  fetchUnemploymentData,
  fetchPMIData,
} from '../connectors/fred/fredConnector';
import { classify } from '../engine/rulesEngine';

const router = Router();

// STORY-002: fetch all four indicator streams in parallel and return a
// classified economic state plus the individual signal flags.
router.get('/classification', async (_req: Request, res: Response) => {
  try {
    const [yieldCurve, creditSpreads, unemployment, manufacturing] = await Promise.all([
      fetchYieldCurveData(),
      fetchCreditSpreadsData(),
      fetchUnemploymentData(),
      fetchPMIData(),
    ]);

    const result = classify({ yieldCurve, creditSpreads, unemployment, manufacturing });
    res.json(result);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
