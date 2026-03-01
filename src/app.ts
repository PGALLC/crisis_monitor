import express, { Application, Request, Response } from 'express';

export function createApp(): Application {
  const app = express();

  app.get('/', (_req: Request, res: Response) => {
    res.json({ message: 'Hello World', status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'healthy' });
  });

  return app;
}
