const request = require('supertest');
const express = require('express');
const apiRoutes = require('../api');

// Mock the turnstile and rate limiter middleware
jest.mock('../../middleware/turnstile', () => ({
  verifyTurnstile: (req, res, next) => next(),
  turnstileRateLimiter: (req, res, next) => next()
}));
jest.mock('../../middleware/rateLimiter', () => (req, res, next) => next());

// Mock fetch for OpenRouter API
global.fetch = jest.fn();

describe('API Input Validation', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', apiRoutes);

    // Set required env var
    process.env.OPENROUTER_API_KEY = 'test-key';

    // Reset mocks
    fetch.mockClear();
  });

  afterEach(() => {
    delete process.env.OPENROUTER_API_KEY;
  });

  describe('POST /api/generate - Input Validation', () => {
    test('should reject request without messages array', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({ turnstileToken: 'test-token' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('messages array is required');
    });

    test('should reject request with non-array messages', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          turnstileToken: 'test-token',
          messages: 'not an array'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('messages array is required');
    });

    test('should reject messages without role', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          turnstileToken: 'test-token',
          messages: [{ content: 'test' }]
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('must have role and content');
    });

    test('should reject messages without content', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          turnstileToken: 'test-token',
          messages: [{ role: 'user' }]
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('must have role and content');
    });

    test('should reject messages with non-string content', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          turnstileToken: 'test-token',
          messages: [{ role: 'user', content: 123 }]
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('content must be a string');
    });

    test('should reject payload exceeding size limit', async () => {
      const largeContent = 'x'.repeat(100001);
      const response = await request(app)
        .post('/api/generate')
        .send({
          turnstileToken: 'test-token',
          messages: [{ role: 'user', content: largeContent }]
        });

      expect(response.status).toBe(413);
      expect(response.body.error).toContain('too large');
    });

    test('should reject temperature outside valid range (negative)', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          turnstileToken: 'test-token',
          messages: [{ role: 'user', content: 'test' }],
          temperature: -1
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('temperature must be between 0 and 2');
    });

    test('should reject temperature outside valid range (too high)', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          turnstileToken: 'test-token',
          messages: [{ role: 'user', content: 'test' }],
          temperature: 3
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('temperature must be between 0 and 2');
    });

    test('should reject max_tokens outside valid range (too low)', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          turnstileToken: 'test-token',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 0
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('max_tokens must be between 1 and 100000');
    });

    test('should reject max_tokens outside valid range (too high)', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          turnstileToken: 'test-token',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 100001
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('max_tokens must be between 1 and 100000');
    });

    test('should filter out non-allowed fields', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'response' } }] })
      });

      await request(app)
        .post('/api/generate')
        .send({
          turnstileToken: 'test-token',
          messages: [{ role: 'user', content: 'test' }],
          malicious_field: 'should be filtered',
          another_bad_field: 'also filtered'
        });

      expect(fetch).toHaveBeenCalled();
      const fetchCall = fetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.malicious_field).toBeUndefined();
      expect(requestBody.another_bad_field).toBeUndefined();
    });

    test('should accept valid request with allowed fields', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'response' } }] })
      });

      const response = await request(app)
        .post('/api/generate')
        .send({
          turnstileToken: 'test-token',
          messages: [{ role: 'user', content: 'test' }],
          temperature: 0.7,
          max_tokens: 1000
        });

      expect(response.status).toBe(200);
      expect(fetch).toHaveBeenCalled();
    });
  });

  describe('POST /api/generate - Error Handling', () => {
    test('should not leak upstream error details to client', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            message: 'Invalid API key',
            code: 'invalid_api_key',
            internal_details: 'sensitive info'
          }
        })
      });

      const response = await request(app)
        .post('/api/generate')
        .send({
          turnstileToken: 'test-token',
          messages: [{ role: 'user', content: 'test' }]
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Failed to process request with AI service');
      expect(response.body.details).toBeUndefined();
      expect(response.body.internal_details).toBeUndefined();
    });

    test('should return 502 for upstream 500 errors', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      });

      const response = await request(app)
        .post('/api/generate')
        .send({
          turnstileToken: 'test-token',
          messages: [{ role: 'user', content: 'test' }]
        });

      expect(response.status).toBe(502);
    });

    test('should handle fetch network errors', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      const response = await request(app)
        .post('/api/generate')
        .send({
          turnstileToken: 'test-token',
          messages: [{ role: 'user', content: 'test' }]
        });

      expect(response.status).toBe(502);
      expect(response.body.error).toBe('Failed to communicate with AI service');
      expect(response.body.details).toBeUndefined();
    });
  });

  describe('GET /api/health', () => {
    test('should return health status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });
});
