const express = require('express');
const router = express.Router();
const { verifyTurnstile, turnstileRateLimiter } = require('../middleware/turnstile');
const rateLimiter = require('../middleware/rateLimiter');

// Model tiers. max_price is a per-request price-per-token CEILING ($/M tokens)
// used purely for provider routing — a loose guardrail against surprise price
// hikes, NOT a spend/session cap. Set to a modest margin (~2x) above list price
// so normal requests never fail. Tune down cautiously if requests start erroring.
const MODELS = {
  default: {
    name: "google/gemini-3.1-flash-lite", // GA; list ~$0.25 in / $1.50 out
    maxPrice: { prompt: 0.5, completion: 3 },
  },
  power: {
    name: "google/gemini-3-flash-preview", // hidden ?mode=power; list ~$0.50 in / $3 out
    maxPrice: { prompt: 1, completion: 6 },
  },
};

// Thinking-level scaling: pick a Gemini thinkingLevel (via OpenRouter's unified
// reasoning.effort) proportional to input complexity. No extra LLM call — this
// is a deterministic heuristic run before the single generation call. Power tier
// gets a static high floor; the default tier scales low→medium with input size.
const determineReasoningEffort = (messages, isPowerModel) => {
  if (isPowerModel) return "high";
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const text = (lastUser && lastUser.content) || "";
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  // Long/refinement/multi-part inputs warrant more thinking; short prompts stay cheap+fast.
  return wordCount > 60 ? "medium" : "low";
};

router.post('/generate', rateLimiter, turnstileRateLimiter, verifyTurnstile, async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error('Server misconfiguration: OPENROUTER_API_KEY is missing or empty.');
    return res.status(500).json({ error: 'Server misconfiguration: API Key missing' });
  }

  try {
    // Input validation: allow-list of permitted fields
    const allowedFields = ['messages', 'temperature', 'max_tokens', 'top_p', 'frequency_penalty', 'presence_penalty', 'usePowerModel'];
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

    // Determine model with strict boolean check for security/correctness
    const isPowerModel = sanitizedBody.usePowerModel === true;
    const tier = isPowerModel ? MODELS.power : MODELS.default;
    const modelToUse = tier.name;

    // Remove usePowerModel to avoid sending unknown parameters to the LLM API
    delete sanitizedBody.usePowerModel;

    const requestBody = {
      model: modelToUse,
      ...sanitizedBody
    };
    // Internal flag — not an OpenRouter parameter.
    delete requestBody.usePowerModel;

    // Thinking-level scaling: effort maps to Gemini's thinkingLevel via OpenRouter.
    // See: https://openrouter.ai/docs/guides/best-practices/reasoning-tokens
    const reasoningEffort = determineReasoningEffort(sanitizedBody.messages, isPowerModel);
    requestBody.reasoning = { effort: reasoningEffort };

    // Loose price guardrail (routing ceiling, not a spend cap). The large, stable
    // system prompt is served via Gemini's implicit prompt caching (OpenRouter keeps
    // it warm with sticky routing) — no explicit cache_control needed for Gemini.
    requestBody.provider = { max_price: tier.maxPrice };

    console.log(`[Generate] Model: ${modelToUse} | reasoning: ${reasoningEffort}`);
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://promptfixer.co", 
        "X-Title": "PromptFixer",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('OpenRouter API Error:', response.status, JSON.stringify(data));
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
