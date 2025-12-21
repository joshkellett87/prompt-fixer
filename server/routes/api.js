const express = require('express');
const router = express.Router();
const { verifyTurnstile, turnstileRateLimiter } = require('../middleware/turnstile');
const rateLimiter = require('../middleware/rateLimiter');

const MODEL_NAME = "google/gemini-2.5-flash-lite-preview-09-2025";

router.post('/generate', rateLimiter, turnstileRateLimiter, verifyTurnstile, async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error('Server misconfiguration: OPENROUTER_API_KEY is missing or empty.');
    return res.status(500).json({ error: 'Server misconfiguration: API Key missing' });
  }

  try {
    // Input validation: allow-list of permitted fields
    const allowedFields = ['messages', 'temperature', 'max_tokens', 'top_p', 'frequency_penalty', 'presence_penalty'];
    const sanitizedBody = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        sanitizedBody[field] = req.body[field];
      }
    }

    // Validate required fields
    if (!sanitizedBody.messages || !Array.isArray(sanitizedBody.messages)) {
      return res.status(400).json({ error: 'Invalid request: messages array is required' });
    }

    // Validate messages structure
    for (const msg of sanitizedBody.messages) {
      if (!msg.role || !msg.content) {
        return res.status(400).json({ error: 'Invalid request: each message must have role and content' });
      }
      if (typeof msg.content !== 'string') {
        return res.status(400).json({ error: 'Invalid request: message content must be a string' });
      }
    }

    // Size limits to prevent abuse
    const messagesString = JSON.stringify(sanitizedBody.messages);
    if (messagesString.length > 100000) { // ~100KB limit
      return res.status(413).json({ error: 'Request payload too large' });
    }

    // Validate numeric parameters if present
    if (sanitizedBody.temperature !== undefined && (sanitizedBody.temperature < 0 || sanitizedBody.temperature > 2)) {
      return res.status(400).json({ error: 'Invalid request: temperature must be between 0 and 2' });
    }
    if (sanitizedBody.max_tokens !== undefined && (sanitizedBody.max_tokens < 1 || sanitizedBody.max_tokens > 100000)) {
      return res.status(400).json({ error: 'Invalid request: max_tokens must be between 1 and 100000' });
    }

    // Ensure the model is set, and enable reasoning
    const requestBody = {
      model: MODEL_NAME,
      ...sanitizedBody
    };

    // To enable reasoning with the default parameters (medium effort, no exclusions)
    // See: https://openrouter.ai/docs/guides/best-practices/reasoning-tokens
    requestBody.reasoning = {
      enabled: true
    };

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://prompt-architect.joshk.cc", // Optional, for including your app on openrouter.ai rankings.
        "X-Title": "Prompt Architect", // Optional. Shows in rankings on openrouter.ai.
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('OpenRouter API Error:', response.status, JSON.stringify(data));
        // Return generic error to client, log details server-side only
        return res.status(response.status === 500 ? 502 : response.status).json({
          error: 'Failed to process request with AI service'
        });
    }

    res.json(data);

  } catch (error) {
    console.error('OpenRouter API connection error:', error);
    res.status(502).json({ error: 'Failed to communicate with AI service' });
  }
});

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.GIT_COMMIT_HASH || 'unknown',
    turnstile_configured: !!process.env.TURNSTILE_SECRET_KEY
  });
});

module.exports = router;
