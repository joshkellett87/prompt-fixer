// API Configuration
// No API Key here! It's in the backend.

// Carries the HTTP status through to the UI so the toast can say something
// true about what happened. `status: 0` means the request never landed
// (offline, DNS, connection refused).
export class ApiError extends Error {
  constructor(status, serverMessage) {
    super(serverMessage || `request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.serverMessage = serverMessage || '';
  }
}

// Only these can plausibly succeed on a second attempt. A 400/401/403/500 fails
// identically every time, so retrying it just makes the user watch a fake
// progress bar for longer. Ceiling here is ~5.2s of backoff, not 31s.
const RETRYABLE = new Set([0, 408, 425, 429, 502, 503, 504]);

export const callApiWithBackoff = async (apiCallFn, onRetry) => {
  const delays = [700, 1500, 3000];
  for (let attempt = 0; ; attempt++) {
    try {
      return await apiCallFn();
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      if (attempt >= delays.length || !RETRYABLE.has(status)) throw err;
      onRetry?.(attempt + 1);
      await new Promise((r) => setTimeout(r, delays[attempt]));
    }
  }
};

export const fetchOptimizedPrompt = async (payload) => {
  let response;
  try {
    response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    // fetch only rejects on a transport failure — treat it as "never landed".
    throw new ApiError(0, err.message);
  }

  if (!response.ok) {
    let serverMessage = '';
    try {
      const errorData = await response.json();
      serverMessage = errorData.error || '';
      console.error('API Error Details:', errorData); // full upstream detail stays here
    } catch {
      // Non-JSON error body (nginx page, proxy failure) — status is all we get.
    }
    throw new ApiError(response.status, serverMessage);
  }

  return response.json();
};
