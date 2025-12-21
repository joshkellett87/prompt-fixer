module.exports = {
  apps: [{
    name: 'prompt-architect',
    script: 'server/index.js',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
      VITE_TURNSTILE_SITE_KEY: process.env.VITE_TURNSTILE_SITE_KEY
    }
  }]
}
