require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
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

// Compression middleware - must come before static file serving
if (process.env.NODE_ENV === 'production') {
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Balance between speed and compression
    threshold: 1024 // Only compress files > 1KB
  }));
}

// Middleware
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? 'https://promptfixer.co'
    : true, // Allow all origins in development
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Static files (production)
if (process.env.NODE_ENV === 'production') {
  // Serve static assets with long-term caching
  app.use(express.static(path.join(__dirname, '../client/dist'), {
    maxAge: '1y',
    immutable: true,
    setHeaders: (res, filePath) => {
      // Don't cache HTML - always fresh
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else if (filePath.match(/\.(js|css|woff2?|ttf|otf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/)) {
        // Hashed assets get long-term cache
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));

  // SPA fallback - serve index.html with no-cache
  app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
