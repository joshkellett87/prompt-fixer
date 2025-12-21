import { useEffect, useRef, useState } from 'react';

export const useTurnstile = (onError) => {
  const widgetIdRef = useRef(null);
  const [turnstileReady, setTurnstileReady] = useState(false);

  useEffect(() => {
    const renderWidget = () => {
      if (window.turnstile && !widgetIdRef.current) {
        const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
        if (!siteKey) {
          console.warn("Turnstile Site Key is missing.");
          return;
        }

        window.turnstile.ready(() => {
          try {
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
        });
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          renderWidget();
        }
      }, 100);
      return () => clearInterval(interval);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
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

  return { turnstileReady, resetTurnstile, widgetIdRef };
};
