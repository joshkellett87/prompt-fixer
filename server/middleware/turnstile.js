const rateLimit = require('express-rate-limit');

// Stricter rate limit for Turnstile verification attempts
const turnstileRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 Turnstile verification attempts per 15 minutes
  message: { error: 'Too many verification attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const verifyTurnstile = async (req, res, next) => {
  // Logic simplified: We rely on Test Keys in dev environment instead of code bypasses.

  const { turnstileToken } = req.body;
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.error('Server misconfiguration: TURNSTILE_SECRET_KEY is missing or empty.');
    return res.status(500).json({ error: 'Server misconfiguration: Turnstile Secret Key missing' });
  }

  if (!turnstileToken) {
    return res.status(400).json({ error: 'Turnstile token missing' });
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', turnstileToken);

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const data = await result.json();

    if (data.success) {
      next();
    } else {
      console.warn('Turnstile validation failed:', data);
      res.status(403).json({ error: 'CAPTCHA validation failed', details: data['error-codes'] });
    }
  } catch (error) {
    console.error('Turnstile verification error:', error);
    res.status(502).json({ error: 'Failed to connect to CAPTCHA verification service' });
  }
};

module.exports = { verifyTurnstile, turnstileRateLimiter };
