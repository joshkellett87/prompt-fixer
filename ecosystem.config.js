module.exports = {
  apps: [{
    name: 'prompt-architect',
    script: 'server/index.js',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
