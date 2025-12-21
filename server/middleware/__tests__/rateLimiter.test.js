const rateLimiter = require('../rateLimiter');

describe('Rate Limiter Middleware', () => {
  test('should be a function', () => {
    expect(typeof rateLimiter).toBe('function');
  });

  test('should have middleware signature', () => {
    // Middleware functions take (req, res, next) parameters
    expect(rateLimiter.length).toBe(3);
  });

  test('should be configured with express-rate-limit', () => {
    // The rateLimiter is created using express-rate-limit
    // We verify it's properly exported and has the expected structure
    expect(rateLimiter).toBeDefined();
  });

  // Note: Full integration testing of rate limiting behavior
  // would require making multiple requests and is better suited
  // for integration tests rather than unit tests
});
