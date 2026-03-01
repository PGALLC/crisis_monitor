import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

describe('Smoke Tests', () => {
  it('server responds to requests', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
  });

  it('main endpoint is accessible', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
  });
});
