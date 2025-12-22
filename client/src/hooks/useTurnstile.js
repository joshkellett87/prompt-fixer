import { useEffect, useRef, useState } from 'react';

export const useTurnstile = (onError) => {
  const widgetIdRef = useRef(null);
  const [turnstileReady, setTurnstileReady] = useState(false);

  useEffect(() => {
    let script = null;

    const renderWidget = () => {
      if (window.turnstile && !widgetIdRef.current) {
        const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
        if (!siteKey) {
          console.warn("Turnstile Site Key is missing.");
          return;
        }

        try {
          // Check if element exists before rendering
          if (!document.getElementById('turnstile-container')) return;
          
          widgetIdRef.current = window.turnstile.render('#turnstile-container', {
            sitekey: siteKey,
            callback: (token) => {
              window.turnstileToken = token;
              setTurnstileReady(true);
            },
            'error-callback': (errorCode) => {
              console.error('Turnstile error:', errorCode);
              onError?.('Security verification failed. Please refresh the page.');
            },
            appearance: 'interaction-only',
            theme: 'light',
          });
        } catch (e) {
          console.error('Failed to render Turnstile:', e);
        }
      }
    };

    if (!window.turnstile) {
      // Check if script is already present but not loaded
      const existingScript = document.querySelector('script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]');
      
      if (!existingScript) {
        script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.onload = renderWidget;
        document.head.appendChild(script);
      } else {
         // Identify if we need to poll or wait for onload on existing script
         // For simplicity in this context, polling or checking ready state is safer 
         // if we don't control the existing script's onload.
         // However, since we removed it from index.html, we likely control it.
         // Fallback polling just in case of race conditions with other libs
         const interval = setInterval(() => {
            if (window.turnstile) {
              clearInterval(interval);
              renderWidget();
            }
         }, 100);
         return () => clearInterval(interval);
      }
    } else {
      renderWidget();
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch(e) { /* ignore cleanup errors */ }
        widgetIdRef.current = null;
      }
      window.turnstileToken = null;
    };
  }, [onError]);

  const resetTurnstile = () => {
    if (window.turnstile && widgetIdRef.current) {
      window.turnstile.reset(widgetIdRef.current);
      window.turnstileToken = null;
      setTurnstileReady(false);
    }
  };

  return { turnstileReady, resetTurnstile };
};
