import React, { useState, useEffect, useRef } from 'react';
import PenLine from 'lucide-react/dist/esm/icons/pen-line';
import Lightbulb from 'lucide-react/dist/esm/icons/lightbulb';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Check from 'lucide-react/dist/esm/icons/check';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import ArrowDown from 'lucide-react/dist/esm/icons/arrow-down';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import History from 'lucide-react/dist/esm/icons/history';
import Send from 'lucide-react/dist/esm/icons/send';
import Github from 'lucide-react/dist/esm/icons/github';
import Linkedin from 'lucide-react/dist/esm/icons/linkedin';
import Sun from 'lucide-react/dist/esm/icons/sun';
import Moon from 'lucide-react/dist/esm/icons/moon';
import { callApiWithBackoff, fetchOptimizedPrompt } from './api';
import { useTurnstile } from './hooks/useTurnstile';
import { getSystemInstruction } from './prompts/systemInstructions';
import { frameworks } from './prompts/frameworks';
import { cn } from './lib/utils';
import { Button } from './components/ui/button';
import { Textarea } from './components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';

const HISTORY_STORAGE_KEY = 'prompt-builder-history';
const THEME_STORAGE_KEY = 'promptfixer-theme';

// Curated, unobtrusive starter prompts (shown only when the input is empty + unfocused).
const EXAMPLE_CHIPS = [
  'Critique my project plan',
  'Summarize this report for a busy executive',
  'Turn my rough notes into a study guide',
];

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
  const [inputFocused, setInputFocused] = useState(false);
  const textareaRef = useRef(null);
  const outputRef = useRef(null);

  // Theme: initialized from the class set by the anti-FOUC script in index.html.
  const [theme, setTheme] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light'
  );
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.warn('Failed to persist theme:', e);
    }
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const applyExample = (text) => {
    setUserInput(text);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const showChips = !userInput.trim();

  // Save history to localStorage on update
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save history:', e);
    }
  }, [history]);

  // On stacked (mobile/tablet) layouts the result renders below the fold, so a
  // fresh prompt can land unseen. Bring it into view — and move focus there for
  // screen readers — whenever a result arrives on small screens. Desktop shows
  // the result beside the input, so it's left untouched (no focus-stealing).
  useEffect(() => {
    if (!optimizedPrompt || !outputRef.current) return;
    if (!window.matchMedia('(max-width: 1023px)').matches) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    outputRef.current.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    outputRef.current.focus();
  }, [optimizedPrompt]);

  // Check for Power Mode
  const [usePowerModel, setUsePowerModel] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'power') {
      setUsePowerModel(true);
      console.log('Power Mode Activated: using Gemini 3 Flash Preview');
    }
  }, []);

  // Turnstile Integration
  const { turnstileReady, resetTurnstile } = useTurnstile(setError);

  // Turnstile only gates in production (dev has no site key / widget, and
  // generatePrompt already skips the token check outside PROD). Gating on the
  // reactive `turnstileReady` — not the non-reactive `window.turnstileToken`
  // global — is what lets the button re-enable itself the moment the check clears.
  const needsVerification = import.meta.env.PROD && !turnstileReady;
  const canBuild = userInput.trim() && !isLoading && !needsVerification;

  // Primary Logic: Generation
  const generatePrompt = async (input, answers = "") => {
    if (!input && !answers) return;

    if (!window.turnstileToken && import.meta.env.PROD) {
       setError("Please complete the security check (Captcha) below.");
       return;
    }

    setIsLoading(true);
    setError(null);

    const fullPrompt = answers
      ? `## Current Optimized Prompt (BASE):\n${optimizedPrompt}\n\n## Original Intent:\n${userInput}\n\n## User's Refinement Answers:\n${answers}\n\n## Task: Integrate answers while preserving all existing content. Enhance the prompt structure without losing any details.`
      : `Original Intent: ${input}`;

    const apiCall = () => fetchOptimizedPrompt({
        messages: [
          { role: "system", content: getSystemInstruction(!!answers) },
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
      if (!answers) {
        const historyItem = {
          input,
          optimizedPrompt: cleanPrompt,
          refinementQuestions: questionMatch ? JSON.parse(questionMatch[1]) : [],
          timestamp: Date.now()
        };
        setHistory(prev => [historyItem, ...prev.filter(h => h.input !== input)].slice(0, 5));
      }



      resetTurnstile();

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
      {/* Screen-reader-only live regions: narrate the core loop for assistive
          tech, which otherwise gets no signal that anything happened. */}
      <div aria-live="polite" className="sr-only">
        {isLoading
          ? 'Optimizing your prompt.'
          : optimizedPrompt
            ? 'Your optimized prompt is ready.'
            : ''}
      </div>
      <div aria-live="polite" className="sr-only">
        {copied ? 'Prompt copied to clipboard.' : ''}
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-start justify-between gap-4 mb-10 md:mb-12">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="PromptFixer logo"
              width={44}
              height={44}
              className="w-11 h-11 rounded-lg shadow-sm border border-border bg-white object-contain p-1 shrink-0"
            />
            <div>
              <h1 className="text-3xl font-serif font-medium text-foreground leading-tight">
                PromptFixer
              </h1>
              {/* Micro-hero: slim value-prop so novices instantly get what it does */}
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Turn rough ideas into clear, high-performance AI prompts.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="shrink-0 p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors cursor-pointer"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Input Side */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="order-1">
              <div className="lg:sticky lg:top-8">
                <Card className="shadow-sm border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-serif font-medium flex items-center gap-2.5">
                      <div className="p-1.5 bg-primary/10 rounded-md">
                        <Lightbulb className="w-4 h-4 text-primary" />
                      </div>
                      Your Idea
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="relative">
                      <Textarea
                        ref={textareaRef}
                        className="min-h-[260px] max-h-[500px] resize-y bg-muted/50 border-border focus-visible:ring-primary text-sm leading-relaxed"
                        placeholder="Describe what you want the AI to do — the rougher the better. PromptFixer rewrites it into a clear, structured prompt that gets better results."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
                        onKeyDown={(e) => {
                          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                            e.preventDefault();
                            if (canBuild) {
                              generatePrompt(userInput);
                            }
                          }
                        }}
                      />

                      {/* Example chips live INSIDE the input (absolutely positioned) so
                          showing/hiding them never shifts surrounding layout. Only shown
                          when the input is empty AND unfocused. */}
                      {showChips && (
                        <div
                          className={cn(
                            // Hidden on phones (they'd overlap the placeholder + eat half the box);
                            // shown inside the input from `sm` up where there's room.
                            'absolute inset-x-3 bottom-3 hidden sm:flex flex-wrap gap-2',
                            inputFocused ? 'animate-chip-out pointer-events-none' : 'animate-chip-in'
                          )}
                          aria-hidden={inputFocused}
                        >
                          {EXAMPLE_CHIPS.map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              tabIndex={inputFocused ? -1 : 0}
                              onClick={() => applyExample(chip)}
                              className="text-xs text-muted-foreground bg-card hover:bg-accent hover:text-accent-foreground border border-border rounded-full px-3 py-1.5 transition-colors cursor-pointer shadow-sm"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Turnstile Widget — interaction-only, so it usually renders nothing;
                        no reserved height keeps the button tight to the input. */}
                    <div className="flex justify-center empty:hidden">
                      <div id="turnstile-container"></div>
                    </div>

                    <Button
                      onClick={() => generatePrompt(userInput)}
                      disabled={!canBuild}
                      size="lg"
                      className="w-full font-semibold"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="animate-spin" size={16} />
                          Building…
                        </>
                      ) : (
                        <>
                          <PenLine size={16} />
                          Build Prompt
                        </>
                      )}
                    </Button>

                    {/* Never leave the disabled button as a silent dead end:
                        say why it's disabled, or surface the keyboard shortcut. */}
                    {!isLoading && (
                      needsVerification && userInput.trim() ? (
                        <p role="status" className="text-xs text-muted-foreground text-center">
                          Running a quick security check — the button enables in a second.
                        </p>
                      ) : userInput.trim() ? (
                        <p className="hidden sm:block text-xs text-muted-foreground text-center">
                          Or press{' '}
                          <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted/50 font-mono text-[10px]">⌘</kbd>
                          <span className="mx-0.5">/</span>
                          <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted/50 font-mono text-[10px]">Ctrl</kbd>
                          {' + '}
                          <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted/50 font-mono text-[10px]">Enter</kbd>
                        </p>
                      ) : null
                    )}
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
                      key={historyItem.timestamp ?? i}
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
          <div ref={outputRef} tabIndex={-1} className="lg:col-span-7 order-2 scroll-mt-4 focus:outline-none">
            <Card className="shadow-sm border-border min-h-[440px] flex flex-col">
              <CardHeader className="border-b border-border shrink-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="flex items-center gap-2.5 text-lg font-serif font-medium">
                    <div className="p-1.5 bg-primary/10 rounded-md">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    Optimized Prompt
                  </CardTitle>

                  {optimizedPrompt && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => generatePrompt(userInput)}
                        disabled={!canBuild}
                        size="sm"
                        variant="outline"
                      >
                        <RefreshCw size={14} />
                        Regenerate
                      </Button>
                      <Button onClick={handleCopy} size="sm">
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-grow overflow-y-auto max-h-[600px] p-8">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
                    <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
                    <div className="text-center space-y-1">
                      <p className="font-semibold text-sm text-foreground">Optimizing...</p>
                      <p className="text-xs text-muted-foreground">This usually takes a few seconds.</p>
                    </div>
                  </div>
                ) : optimizedPrompt ? (
                  <div>
                    <div className="whitespace-pre-wrap text-foreground text-sm font-mono leading-relaxed bg-muted/30 p-6 rounded-lg border border-border">
                      {optimizedPrompt}
                    </div>
                    {usedFramework && (
                      <div className="mt-3 pl-1 space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                          Optimized using {usedFramework}
                          {frameworks[usedFramework]?.useCase
                            ? ` — best for ${frameworks[usedFramework].useCase.toLowerCase()}`
                            : ''}
                        </p>
                        {frameworks[usedFramework]?.label && (
                          <p className="text-[11px] text-muted-foreground">
                            {frameworks[usedFramework].label}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Teaching empty state: show a real rough-idea → structured-prompt
                     transformation so the value lands before the user types anything.
                     (Replaces the old fake skeleton, which implied loading when idle.) */
                  <div className="h-full flex flex-col items-center justify-center text-center px-2 py-8">
                    <h3 className="text-lg font-serif font-medium text-foreground mb-2">
                      Your optimized prompt will appear here
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm mb-8 leading-relaxed">
                      Describe a rough idea on the left and PromptFixer structures it into a
                      clear, high-performance prompt. Here's the kind of transformation you'll get:
                    </p>

                    <div className="w-full max-w-md text-left space-y-3">
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                          You type
                        </p>
                        <p className="text-sm text-foreground bg-muted/40 border border-border rounded-lg px-3 py-2 italic">
                          &ldquo;write a blog post about coffee&rdquo;
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground pl-1">
                        <ArrowDown className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs">PromptFixer structures it</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                          You get
                        </p>
                        <div className="whitespace-pre-wrap text-foreground text-xs font-mono leading-relaxed bg-muted/30 p-3 rounded-lg border border-border">
{`Role: You are an experienced coffee writer and
home-brewing enthusiast.

Task: Write an engaging, beginner-friendly blog post
about making great coffee at home.

Audience: Readers new to brewing who own only basic
equipment (kettle, grinder, a simple dripper).

Format: ~600 words — a short hook, three clearly
headed sections, and a closing list of 3 quick tips.

Tone: Warm and practical; explain any jargon in
plain English.`}
                        </div>
                      </div>
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

                  <div className="space-y-4">
                    {refinementQuestions.map((q, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <ArrowRight size={8} className="text-primary" />
                          </div>
                          <p className="text-xs font-medium text-foreground leading-relaxed">{q}</p>
                        </div>
                        <Textarea
                          className="text-xs bg-card border-border min-h-[60px]"
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
        <div
          role="alert"
          className="fixed bottom-6 right-6 max-w-sm bg-card border border-destructive/40 shadow-xl p-4 rounded-lg flex items-start gap-3 z-50"
        >
          <div className="shrink-0 w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="text-destructive w-3 h-3" />
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
