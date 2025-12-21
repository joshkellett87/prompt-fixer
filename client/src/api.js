// API Configuration
// No API Key here! It's in the backend.

export const callApiWithBackoff = async (apiCallFn, maxRetries = 5) => {
  const delays = [1000, 2000, 4000, 8000, 16000];
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCallFn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(r => setTimeout(r, delays[i]));
    }
  }
};

export const fetchOptimizedPrompt = async (payload) => {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
      // Try to parse error message
      try {
          const errorData = await response.json();
          console.error("API Error Details:", errorData); // Log full details (e.g. upstream errors)
          throw new Error(errorData.error || `API Connection Failed: ${response.status}`);
      } catch (e) {
          // If json parse fails or it was the throw above
          if (e.message !== response.statusText && !e.message.startsWith('API')) {
            // It was a JSON parse error
             throw new Error(`API Connection Failed: ${response.status}`);
          }
          throw e; 
      }
  }
  return response.json();
};
