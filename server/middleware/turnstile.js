const verifyTurnstile = async (req, res, next) => {
  // If we are in dev mode and specify SKIP_CAPTCHA, bypass
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_CAPTCHA === 'true') {
    return next();
  }

  const { turnstileToken } = req.body;
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

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
      res.status(403).json({ error: 'CAPTCHA validation failed' });
    }
  } catch (error) {
    console.error('Turnstile verification error:', error);
    res.status(500).json({ error: 'Internal server error during CAPTCHA validation' });
  }
};

module.exports = verifyTurnstile;
