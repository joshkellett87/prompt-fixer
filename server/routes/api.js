const express = require('express');
const router = express.Router();
const verifyTurnstile = require('../middleware/turnstile');
const rateLimiter = require('../middleware/rateLimiter');

const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";

router.post('/generate', rateLimiter, verifyTurnstile, async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('Server misconfiguration: API Key missing');
    return res.status(500).json({ error: 'Server misconfiguration: API Key missing' });
  }

  try {
    // Extract everything except turnstileToken to forward to Gemini
    const { turnstileToken, ...apiBody } = req.body;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiBody)
    });

    const data = await response.json();
    
    if (!response.ok) {
        return res.status(response.status).json(data);
    }
    
    res.json(data);

  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ error: 'Failed to communicate with AI service' });
  }
});

module.exports = router;
