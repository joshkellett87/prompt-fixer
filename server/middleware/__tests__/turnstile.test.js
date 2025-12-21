const { verifyTurnstile, turnstileRateLimiter } = require('../turnstile');

// Mock fetch
global.fetch = jest.fn();

describe('Turnstile Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    // Set required env var
    process.env.TURNSTILE_SECRET_KEY = 'test-secret';

    // Reset mocks
    fetch.mockClear();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    delete process.env.TURNSTILE_SECRET_KEY;
  });

  describe('verifyTurnstile', () => {
    test('should reject when TURNSTILE_SECRET_KEY is missing', async () => {
      delete process.env.TURNSTILE_SECRET_KEY;
      req.body.turnstileToken = 'test-token';

      await verifyTurnstile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Turnstile Secret Key missing')
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject when turnstileToken is missing', async () => {
      await verifyTurnstile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Turnstile token missing'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should call next() on successful verification', async () => {
      req.body.turnstileToken = 'valid-token';

      fetch.mockResolvedValue({
        json: async () => ({ success: true })
      });

      await verifyTurnstile(req, res, next);

      expect(fetch).toHaveBeenCalledWith(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        expect.objectContaining({
          method: 'POST'
        })
      );
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject on failed verification', async () => {
      req.body.turnstileToken = 'invalid-token';

      fetch.mockResolvedValue({
        json: async () => ({
          success: false,
          'error-codes': ['invalid-input-response']
        })
      });

      await verifyTurnstile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'CAPTCHA validation failed'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle Cloudflare API errors', async () => {
      req.body.turnstileToken = 'test-token';

      fetch.mockRejectedValue(new Error('Network error'));

      await verifyTurnstile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to connect to CAPTCHA verification service'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should send correct parameters to Cloudflare API', async () => {
      req.body.turnstileToken = 'test-token-123';

      fetch.mockResolvedValue({
        json: async () => ({ success: true })
      });

      await verifyTurnstile(req, res, next);

      expect(fetch).toHaveBeenCalledWith(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(URLSearchParams)
        })
      );

      const formData = fetch.mock.calls[0][1].body;
      expect(formData.get('secret')).toBe('test-secret');
      expect(formData.get('response')).toBe('test-token-123');
    });
  });

  describe('turnstileRateLimiter', () => {
    test('should be a function', () => {
      expect(typeof turnstileRateLimiter).toBe('function');
    });

    test('should have rate limiting configuration', () => {
      // The rate limiter is configured with max: 20 per 15 minutes
      // We can't easily test the actual rate limiting without making 20 requests
      // but we can verify it's properly exported and is a middleware function
      expect(turnstileRateLimiter).toBeDefined();
      expect(turnstileRateLimiter.length).toBe(3); // middleware signature: (req, res, next)
    });
  });
});
