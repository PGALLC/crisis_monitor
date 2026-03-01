import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

describe('API Functional Tests', () => {
  describe('GET /', () => {
    it('should return 200 with Hello World message', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Hello World');
      expect(response.body.status).toBe('ok');
    });

    it('should return JSON content-type', async () => {
      const response = await request(app).get('/');
      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('GET /health', () => {
    it('should return 200 with healthy status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
    });
  });
});
