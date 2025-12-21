require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

// Security Headers Middleware
app.use((req, res, next) => {
  // Content Security Policy
  if (process.env.NODE_ENV === 'production') {
    // Strict CSP for production - no unsafe-eval or unsafe-inline
    const csp = [
      "default-src 'self'",
      "script-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
      "frame-src 'self' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'", // Tailwind requires inline styles
      "img-src 'self' data:",
      "connect-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ');
    res.setHeader('Content-Security-Policy', csp);

    // Additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  }
  next();
});

// Middleware
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? 'https://prompt-architect.joshk.cc'
    : true, // Allow all origins in development
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Static files (production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
