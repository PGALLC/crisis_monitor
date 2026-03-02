/**
 * Smoke Tests
 *
 * When BASE_URL is set (post-deployment in CI/CD), tests hit the live cluster
 * service via HTTP — this is the true post-deploy sanity check.
 *
 * Without BASE_URL (local dev), tests fall back to an in-process supertest
 * server so the suite can still be run locally.
 */
import request from 'supertest';
import { createApp } from '../../src/app';

const BASE_URL = process.env.BASE_URL;

type JsonBody = Record<string, unknown>;

async function get(path: string): Promise<{ status: number; body: JsonBody }> {
  if (BASE_URL) {
    const res = await fetch(`${BASE_URL}${path}`);
    const body = (await res.json()) as JsonBody;
    return { status: res.status, body };
  }
  const res = await request(createApp()).get(path);
  return { status: res.status, body: res.body as JsonBody };
}

describe('Smoke Tests', () => {
  it(`GET /health returns 200 [${BASE_URL ?? 'in-process'}]`, async () => {
    const { status, body } = await get('/health');
    expect(status).toBe(200);
    expect(body.status).toBe('healthy');
  });

  it(`GET / returns 200 with Hello World [${BASE_URL ?? 'in-process'}]`, async () => {
    const { status, body } = await get('/');
    expect(status).toBe(200);
    expect(body.message).toBe('Hello World');
  });

  it(`GET /api/health/fred returns 200 with version and DGS10 sample [${BASE_URL ?? 'in-process'}]`, async () => {
    const { status, body } = await get('/api/health/fred');
    expect(status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.version).toMatch(/^\d+\.\d+\.\d+$/);
    const fred = body.fred as JsonBody;
    expect(fred.status).toBe('ok');
    const sample = fred.sample as JsonBody;
    expect(sample.series).toBe('DGS10');
  });
});
