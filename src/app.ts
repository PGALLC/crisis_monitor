import express, { Application, Request, Response } from 'express';
// Route convention: each domain gets its own Express Router in src/routes/.
// createApp() is a pure composition root — no inline route handlers here.
import fredRouter from './routes/fred';

export function createApp(): Application {
  const app = express();

  app.get('/', (_req: Request, res: Response) => {
    res.json({ message: 'Hello World', status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'healthy' });
  });

  app.use('/api', fredRouter);

  return app;
}
