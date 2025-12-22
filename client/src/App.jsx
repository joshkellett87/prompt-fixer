import React, { useState, useEffect, useRef } from 'react';
import {
  Wand2,
  MessageSquarePlus,
  Copy,
  Check,
  RefreshCw,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Trash2,
  History,
  Microscope,
  Send,
  Github,
  Linkedin
} from 'lucide-react';
import { callApiWithBackoff, fetchOptimizedPrompt } from './api';
import { getSystemInstruction } from './prompts/systemInstructions';
import { Button } from './components/ui/button';
import { Textarea } from './components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';

const HISTORY_STORAGE_KEY = 'prompt-builder-history';

const App = () => {
  // State Management
  const [userInput, setUserInput] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [refinementQuestions, setRefinementQuestions] = useState([]);
  const [pendingAnswers, setPendingAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load history:', e);
    }
    return [];
  });
  const [error, setError] = useState(null);
  const [usedFramework, setUsedFramework] = useState(null);

  const widgetIdRef = useRef(null);

  // Save history to localStorage on update
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save history:', e);
    }
  }, [history]);

  // Check for Power Mode
  const [usePowerModel, setUsePowerModel] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'power') {
      setUsePowerModel(true);
      console.log('Power Mode Activated: Using Gemini 3 Flash Preview');
    }
  }, []);

  // Turnstile Integration
  useEffect(() => {
    const renderWidget = () => {
      if (window.turnstile && !widgetIdRef.current) {
        const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
        if (!siteKey) {
          console.warn("Turnstile Site Key is missing. Check your .env file or VITE_TURNSTILE_SITE_KEY variable.");
          return;
        }

        window.turnstile.ready(() => {
          try {
            widgetIdRef.current = window.turnstile.render('#turnstile-container', {
              sitekey: siteKey,
              callback: (token) => {
                window.turnstileToken = token;
                setError(null);
              },
              'error-callback': (errorCode) => {
                console.error('Turnstile error:', errorCode);
                setError('Security verification failed. Please refresh the page.');
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
  }, []);

  // Primary Logic: Generation
  const generatePrompt = async (input, answers = "", isAutoRefine = false) => {
    if (!input && !answers && !isAutoRefine) return;

    if (!window.turnstileToken && import.meta.env.PROD) {
       setError("Please complete the security check (Captcha) below.");
       return;
    }

    setIsLoading(true);
    setError(null);

    let fullPrompt = answers
      ? `## Current Optimized Prompt (BASE):\n${optimizedPrompt}\n\n## Original Intent:\n${userInput}\n\n## User's Refinement Answers:\n${answers}\n\n## Task: Integrate answers while preserving all existing content. Enhance the prompt structure without losing any details.`
      : `Original Intent: ${input}`;

    if (isAutoRefine) {
      fullPrompt = `Current Draft:\n${optimizedPrompt}\n\nTask: Perform a structural audit. Remove redundancy and sharpen logic. IMPORTANT: Preserve all specific details, constraints, and intent from the Current Draft. Return only the improved prompt inside [PROMPT_START] tags.`;
    }

    const apiCall = () => fetchOptimizedPrompt({
        messages: [
          { role: "system", content: getSystemInstruction('SMART', !!answers || isAutoRefine) },
          { role: "user", content: fullPrompt }
        ],
        turnstileToken: window.turnstileToken,
        usePowerModel
    });

    try {
      const result = await callApiWithBackoff(apiCall);
      const text = result.choices?.[0]?.message?.content || "";

      const promptMatch = text.match(/\[PROMPT_START\]([\s\S]*?)\[PROMPT_END\]/);
      const questionMatch = text.match(/\[QUESTIONS_START\]([\s\S]*?)\[QUESTIONS_END\]/);

      let cleanPrompt = "";
      if (promptMatch) {
        cleanPrompt = promptMatch[1].trim();
      } else {
        cleanPrompt = text
          .replace(/\[QUESTIONS_START\][\s\S]*?\[QUESTIONS_END\]/g, "")
          .replace(/\[PROMPT_START\]/g, "")
          .replace(/\[PROMPT_END\]/g, "")
          .trim();
      }

      if (questionMatch) {
        try {
          const qs = JSON.parse(questionMatch[1]);
          setRefinementQuestions(qs);
        } catch (e) {
          setRefinementQuestions([]);
        }
      }

      // Parse framework used for transparency
      const frameworkMatch = text.match(/\[FRAMEWORK\](.*?)\[\/FRAMEWORK\]/);
      if (frameworkMatch) {
        setUsedFramework(frameworkMatch[1].trim());
      }

      setOptimizedPrompt(cleanPrompt);
      setPendingAnswers({});
      if (!answers && !isAutoRefine) {
        const historyItem = {
          input,
          optimizedPrompt: cleanPrompt,
          refinementQuestions: questionMatch ? JSON.parse(questionMatch[1]) : [],
          timestamp: Date.now()
        };
        setHistory(prev => [historyItem, ...prev.filter(h => h.input !== input)].slice(0, 5));
      }

      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.reset(widgetIdRef.current);
        window.turnstileToken = null;
      }

    } catch (err) {
      setError(err.message || "Failed to build the prompt. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchRefinement = () => {
    const formattedAnswers = Object.entries(pendingAnswers)
      .filter(([_, answer]) => answer.trim() !== "")
      .map(([index, answer]) => `Q: ${refinementQuestions[index]} | A: ${answer}`)
      .join('\n');

    if (formattedAnswers) generatePrompt(userInput, formattedAnswers);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(optimizedPrompt)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Copy failed:', err));
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center gap-3 mb-12">
          <div className="p-2.5 bg-primary rounded-lg shadow-sm">
            <Wand2 className="text-primary-foreground w-5 h-5" />
          </div>
          <h1 className="text-3xl font-serif font-medium text-foreground">
            Prompt Fixer
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Input Side */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="order-1">
              <div className="lg:sticky lg:top-8">
                <Card className="shadow-md border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-serif font-medium flex items-center gap-2.5">
                      <div className="p-1.5 bg-primary/10 rounded-md">
                        <MessageSquarePlus className="w-4 h-4 text-primary" />
                      </div>
                      Your Idea
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      className="min-h-[180px] resize-none bg-muted/50 border-border focus-visible:ring-primary text-sm leading-relaxed"
                      placeholder="What should the AI do? E.g. 'Critique this project plan' or 'Write a landing page for an organic tea brand'..."
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                          e.preventDefault();
                          if (userInput.trim() && window.turnstileToken && !isLoading) {
                            generatePrompt(userInput);
                          }
                        }
                      }}
                    />

                    {/* Turnstile Widget */}
                    <div className="flex justify-center min-h-[65px]">
                      <div id="turnstile-container"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => generatePrompt(userInput)}
                        disabled={!userInput.trim() || isLoading || !window.turnstileToken}
                        size="lg"
                        className="font-semibold"
                      >
                        {isLoading ? (
                          <RefreshCw className="animate-spin" size={16} />
                        ) : (
                          <>
                            <Wand2 size={16} />
                            Build Prompt
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={() => generatePrompt(userInput, "", true)}
                        disabled={isLoading || !optimizedPrompt}
                        variant="outline"
                        size="lg"
                        className="font-semibold"
                      >
                        <Microscope size={16} />
                        Auto-Refine
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* History - order-3 on mobile, order-2 on desktop to stay under input */}
            {history.length > 0 && (
              <div className="order-3 lg:order-2 px-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <History size={12} />
                    History
                  </h3>
                  <button
                    onClick={() => setHistory([])}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="space-y-2">
                  {history.map((historyItem, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setUserInput(historyItem.input);
                        setOptimizedPrompt(historyItem.optimizedPrompt);
                        setRefinementQuestions(historyItem.refinementQuestions || []);
                        setPendingAnswers({});
                      }}
                      className="w-full text-left p-3 text-xs font-medium text-foreground bg-card hover:border-primary/30 border border-border rounded-lg transition-all flex items-center justify-between group shadow-sm"
                    >
                      <span className="truncate pr-4">{historyItem.input}</span>
                      <ChevronRight size={10} className="opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Output Side */}
          <div className="lg:col-span-7 order-2">
            <Card className="shadow-lg border-2 border-primary/10 min-h-[550px] flex flex-col">
              <CardHeader className="border-b border-border shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2.5 text-lg font-serif font-medium">
                    <div className="p-1.5 bg-accent/50 rounded-md">
                      <Sparkles className="w-4 h-4 text-accent-foreground" />
                    </div>
                    Optimized Prompt
                  </CardTitle>

                  {optimizedPrompt && (
                    <Button
                      onClick={handleCopy}
                      size="sm"
                      className={copied ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-grow overflow-y-auto max-h-[600px] p-8">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
                    <div className="relative">
                       <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
                       <Wand2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    </div>
                    <p className="font-semibold text-sm text-foreground">Optimizing...</p>
                  </div>
                ) : optimizedPrompt ? (
                  <div>
                    <div className="whitespace-pre-wrap text-foreground text-sm font-mono leading-relaxed bg-muted/30 p-6 rounded-lg border border-border">
                      {optimizedPrompt}
                    </div>
                    {usedFramework && (
                      <p className="text-xs text-muted-foreground mt-3 pl-1">
                        Optimized using {usedFramework} framework
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 p-6">
                    <div className="space-y-3">
                      <div className="h-3 bg-muted/50 rounded animate-pulse w-full"></div>
                      <div className="h-3 bg-muted/50 rounded animate-pulse w-5/6"></div>
                      <div className="h-3 bg-muted/50 rounded animate-pulse w-4/6"></div>
                      <div className="h-3 bg-muted/50 rounded animate-pulse w-full"></div>
                      <div className="h-3 bg-muted/50 rounded animate-pulse w-3/4"></div>
                    </div>
                    <div className="mt-8 text-center">
                      <Sparkles className="w-12 h-12 text-primary/20 mx-auto mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Your optimized prompt will appear here
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>

              {/* Refinement Questions */}
              {refinementQuestions.length > 0 && !isLoading && (
                <div className="p-6 bg-muted/30 border-t border-border shrink-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-primary rounded-full"></div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Refinement Questions
                      </h3>
                    </div>
                    {Object.values(pendingAnswers).some(a => a.trim() !== "") && (
                      <Button
                        onClick={handleBatchRefinement}
                        size="sm"
                        className="font-semibold"
                      >
                        <Send size={12} />
                        Apply Updates
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {refinementQuestions.map((q, i) => (
                      <div key={i} className="bg-card border border-border p-3 rounded-lg shadow-sm hover:border-primary/30 transition-all">
                        <div className="flex items-start gap-2 mb-2">
                          <div className="w-4 h-4 rounded-full bg-accent/50 flex items-center justify-center shrink-0 mt-0.5">
                            <ArrowRight size={8} className="text-accent-foreground" />
                          </div>
                          <p className="text-xs font-medium text-foreground leading-relaxed">{q}</p>
                        </div>
                        <Textarea
                          className="text-xs bg-muted/50 border-border min-h-[60px]"
                          placeholder="Your answer..."
                          rows={2}
                          value={pendingAnswers[i] || ''}
                          onChange={(e) => setPendingAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 pb-8 text-center">
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>Built by Josh Kellett</span>
          <div className="flex items-center gap-2">
            <a
              href="https://linkedin.com/in/joshkellett"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin size={14} />
            </a>
            <a
              href="https://github.com/joshkellett87"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <Github size={14} />
            </a>
          </div>
        </div>
      </footer>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-6 right-6 max-w-sm bg-card border-l-4 border-destructive shadow-xl p-4 rounded-lg flex items-start gap-3 z-50">
          <div className="shrink-0 w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center">
            <Sparkles className="text-destructive w-3 h-3" />
          </div>
          <div className="flex-grow">
            <p className="font-semibold text-foreground text-xs mb-1">Error</p>
            <p className="text-muted-foreground text-xs leading-relaxed">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
