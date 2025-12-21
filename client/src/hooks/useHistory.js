import { useState, useEffect } from 'react';

const HISTORY_STORAGE_KEY = 'prompt-architect-history';
const MAX_HISTORY_ITEMS = 5;

export const useHistory = () => {
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load history:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save history:', e);
    }
  }, [history]);

  const addToHistory = (item) => {
    setHistory(prev =>
      [item, ...prev.filter(h => h.input !== item.input)].slice(0, MAX_HISTORY_ITEMS)
    );
  };

  const clearHistory = () => setHistory([]);

  return { history, setHistory, addToHistory, clearHistory };
};
