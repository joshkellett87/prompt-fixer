module.exports = {
  apps: [{
    name: 'prompt-builder',
    script: 'server/index.js',
    // `pm2 --env production` passes ONLY what is enumerated here, so anything the
    // deploy shell exports has to be listed or it never reaches the process. Leaving
    // GIT_COMMIT_HASH out is why /api/health reported a months-old commit while
    // current code was running — a silently-wrong answer to "what is deployed?",
    // which is worse than no answer at all.
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
      VITE_TURNSTILE_SITE_KEY: process.env.VITE_TURNSTILE_SITE_KEY,
      GIT_COMMIT_HASH: process.env.GIT_COMMIT_HASH
    }
  }]
}
