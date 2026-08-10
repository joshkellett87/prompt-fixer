import React, { useState, useEffect, useRef } from 'react';
import PenLine from 'lucide-react/dist/esm/icons/pen-line';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Check from 'lucide-react/dist/esm/icons/check';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import ArrowDown from 'lucide-react/dist/esm/icons/arrow-down';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import History from 'lucide-react/dist/esm/icons/history';
import Send from 'lucide-react/dist/esm/icons/send';
import Github from 'lucide-react/dist/esm/icons/github';
import Linkedin from 'lucide-react/dist/esm/icons/linkedin';
import X from 'lucide-react/dist/esm/icons/x';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import Undo2 from 'lucide-react/dist/esm/icons/undo-2';
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
// History only records *completed* generations, so a refresh or a crash during a
// build used to take the idea with it. This keeps the in-flight draft.
const DRAFT_STORAGE_KEY = 'promptfixer-draft';

// Curated, unobtrusive starter prompts (shown only when the input is empty + unfocused).
// Kept deliberately short: they have to fit two rows inside the input at the
// desktop column width, and a terse chip also models the "rougher the better"
// input the tool is asking for.
const EXAMPLE_CHIPS = [
  'Critique my project plan',
  'Summarize a long report',
  'Turn my notes into a study guide',
];

// The empty state's worked example. Split so the panel shows the shape of a
// result without matching the height of a real one — the rest is one click away.
const EXAMPLE_OUTPUT_HEAD = `Role: You are an experienced coffee writer and
home-brewing enthusiast.

Task: Write an engaging, beginner-friendly blog post
about making great coffee at home.`;

const EXAMPLE_OUTPUT_REST = `Audience: Readers new to brewing who own only basic
equipment (kettle, grinder, a simple dripper).

Format: ~600 words — a short hook, three clearly
headed sections, and a closing list of 3 quick tips.

Tone: Warm and practical; explain any jargon in
plain English.`;

// Apple platforms use ⌘; everything else uses Ctrl. Showing both and making the
// reader pick is the interface doing half its job.
const IS_APPLE =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform || '');
const MOD_KEY = IS_APPLE ? '⌘' : 'Ctrl';
// Copying is the moment the whole tool exists for, so its shortcut is shown on
// the control rather than left for the user to discover by accident.
const COPY_SHORTCUT = IS_APPLE ? '⌘⇧C' : 'Ctrl+Shift+C';
const COPY_SHORTCUT_ARIA = IS_APPLE ? 'Meta+Shift+C' : 'Control+Shift+C';

// Errors get the same voice as the rest of the product. The HTTP status stays
// in the console where it's useful; the user gets a sentence that says what
// happened, whose fault it was, and that their idea survived.
const describeError = (err) => {
  const status = err?.status ?? 0;
  if (status === 0)
    return {
      title: 'no connection',
      body: 'the request never left. your idea is still here — check your network and try again.',
      retryable: true,
    };
  if (status === 429)
    return {
      title: 'too many requests',
      body: "you've hit the rate limit. give it a minute, then try again.",
      retryable: false,
    };
  if (status === 400)
    return {
      title: 'that input was refused',
      body: err.serverMessage || 'the request came back malformed. try rephrasing your idea.',
      retryable: false,
    };
  if (status === 401 || status === 403)
    return {
      title: 'access refused',
      body: "promptfixer couldn't authenticate with the ai service. that one's ours, not yours.",
      retryable: false,
    };
  if (status === 408 || status === 504)
    return {
      title: 'the ai service timed out',
      body: 'it took too long to answer. your idea is still here — try again.',
      retryable: true,
    };
  if (status >= 500)
    return {
      title: "the ai service didn't answer",
      body: 'nothing to do with your idea, which is still here. try again in a moment.',
      retryable: true,
    };
  return {
    title: "that didn't work",
    body: 'something went wrong on the way to the ai service. your idea is still here — try again.',
    retryable: true,
  };
};

// Automatic framework selection is half the product's positioning, and until now
// it was only ever visible one framework at a time, after the fact. Every value
// here comes from frameworks.js — no invented copy.
const FrameworkReference = ({ summary }) => {
  return (
    <details className="group">
      <summary className="cursor-pointer list-none inline-flex items-center gap-1.5 py-1.5 -my-1.5 touch:py-3.5 touch:-my-3.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
        <ChevronRight size={12} className="shrink-0 transition-transform group-open:rotate-90" />
        <span className="group-open:hidden">{summary}</span>
        <span className="hidden group-open:inline">hide</span>
      </summary>
      <dl className="mt-3 space-y-2.5">
        {Object.entries(frameworks).map(([name, meta]) => (
          <div key={name} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <dt className="font-mono text-xs font-semibold uppercase tracking-wide text-foreground shrink-0 sm:w-20 sm:pt-px">
              {name}
            </dt>
            <dd className="text-xs text-muted-foreground leading-relaxed">
              {meta.label} — best for {meta.useCase.toLowerCase()}.
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
        PromptFixer picks one for you from what you write. You never have to choose.
      </p>
    </details>
  );
};

const App = () => {
  // State Management
  const [userInput, setUserInput] = useState(() => {
    try {
      return localStorage.getItem(DRAFT_STORAGE_KEY) || '';
    } catch (e) {
      return '';
    }
  });
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
  // Set once the first retry fires, so a slow upstream stops looking like a
  // frozen skeleton bar. Cleared on every new run.
  const [isRetrying, setIsRetrying] = useState(false);
  // Shown when the primary button is pressed with nothing to build from. The
  // button stays live at rest, so this is what makes an empty press explicable
  // rather than a dead click.
  const [needsIdea, setNeedsIdea] = useState(false);
  // The refinement panel's equivalent of `needsIdea`.
  const [needsAnswer, setNeedsAnswer] = useState(false);
  // Everything `start over` threw away, kept until the next real action so the
  // clear is recoverable. No timer: an undo that expires while you are still
  // deciding is not an undo.
  const [undoSnapshot, setUndoSnapshot] = useState(null);
  const textareaRef = useRef(null);
  const outputRef = useRef(null);
  const refinementRef = useRef(null);

  // Theme: initialized from the class set by the anti-FOUC script in index.html.
  const [theme, setTheme] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light'
  );
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    // Keep the mobile browser chrome on the same ground as the page. A pair of
    // `prefers-color-scheme` metas can't do this, because the theme here is a
    // class the user can override against their OS setting — so it's driven from
    // the applied theme instead. Values track --background in index.css.
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#1c1917' : '#f2ece6');
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

  // Survive a refresh, a crash, or a closed tab mid-generation. Cheap enough to
  // write on every keystroke: the value is a few KB and the commit measured
  // 0.1ms, so there's nothing here worth debouncing.
  useEffect(() => {
    try {
      if (userInput) localStorage.setItem(DRAFT_STORAGE_KEY, userInput);
      else localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to persist draft:', e);
    }
  }, [userInput]);

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
  const { resetTurnstile } = useTurnstile(setError);

  const hasInput = !!userInput.trim();
  // Only a generation in flight disables the button. The bot check no longer
  // gates it: an empty input isn't a failure state, and neither is an
  // unfinished Turnstile handshake.
  const canBuild = hasInput && !isLoading;

  // The bot check protects our API key, not the visitor's time — so it belongs
  // behind the Building… state, not in front of it. Turnstile re-arms after
  // every generation (the token is single-use), so surfacing it would also mean
  // flashing a "checking" state at someone who is reading their result.
  // ponytail: polls the global rather than subscribing to the hook's state,
  // because this runs inside an async call that would otherwise close over a
  // stale `turnstileReady`.
  const awaitTurnstileToken = (timeoutMs = 12000) =>
    new Promise((resolve, reject) => {
      if (window.turnstileToken) return resolve(window.turnstileToken);
      const startedAt = Date.now();
      const poll = setInterval(() => {
        if (window.turnstileToken) {
          clearInterval(poll);
          resolve(window.turnstileToken);
        } else if (Date.now() - startedAt > timeoutMs) {
          clearInterval(poll);
          reject(new Error('turnstile-timeout'));
        }
      }, 100);
    });

  // Primary Logic: Generation
  const generatePrompt = async (input, answers = "") => {
    if (!input && !answers) return;

    setIsLoading(true);
    setIsRetrying(false);
    setError(null);
    setNeedsIdea(false);
    setNeedsAnswer(false);
    setUndoSnapshot(null);

    // Wait for the check inside the loading state rather than blocking the
    // button on it. The server verifies the token independently, so waiting
    // here is a courtesy to the user, not a security boundary.
    if (import.meta.env.PROD && !window.turnstileToken) {
      try {
        await awaitTurnstileToken();
      } catch (e) {
        setError({
          title: "the security check didn't clear",
          body: 'an ad blocker or a strict network may be blocking cloudflare. your idea is still here — try again, or switch network.',
          retryable: true,
        });
        setIsLoading(false);
        return;
      }
    }

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
      const result = await callApiWithBackoff(apiCall, () => setIsRetrying(true));
      const text = result.choices?.[0]?.message?.content || "";

      const promptMatch = text.match(/\[PROMPT_START\]([\s\S]*?)\[PROMPT_END\]/);
      const questionMatch = text.match(/\[QUESTIONS_START\]([\s\S]*?)\[QUESTIONS_END\]/);

      let cleanPrompt = "";
      if (promptMatch) {
        cleanPrompt = promptMatch[1].trim();
      } else {
        // Models occasionally open [PROMPT_START] and never close it (~1 in 16 on
        // long inputs). The framework tag has to come out too, or it lands in the
        // text the user copies.
        cleanPrompt = text
          .replace(/\[QUESTIONS_START\][\s\S]*?\[QUESTIONS_END\]/g, "")
          .replace(/\[FRAMEWORK\][\s\S]*?\[\/FRAMEWORK\]/g, "")
          .replace(/\[PROMPT_START\]/g, "")
          .replace(/\[PROMPT_END\]/g, "")
          .trim();
      }

      // Parse once and reuse. Parsing again for the history item is how a
      // malformed questions block used to fail a generation that had actually
      // succeeded — the second JSON.parse threw straight into the error path.
      let questions = [];
      if (questionMatch) {
        try {
          const qs = JSON.parse(questionMatch[1]);
          if (Array.isArray(qs)) questions = qs;
        } catch (e) {
          console.warn('Could not parse refinement questions:', e);
        }
      }
      setRefinementQuestions(questions);

      // Framework attribution, for transparency. Always assign — leaving the
      // previous run's value in place would label this prompt with a framework
      // that was never applied to it.
      const frameworkMatch = text.match(/\[FRAMEWORK\](.*?)\[\/FRAMEWORK\]/);
      const framework = frameworkMatch ? frameworkMatch[1].trim() : null;
      setUsedFramework(framework);

      setOptimizedPrompt(cleanPrompt);
      setPendingAnswers({});
      if (!answers) {
        const historyItem = {
          input,
          optimizedPrompt: cleanPrompt,
          refinementQuestions: questions,
          usedFramework: framework,
          timestamp: Date.now()
        };
        setHistory(prev => [historyItem, ...prev.filter(h => h.input !== input)].slice(0, 5));
      }



      resetTurnstile();

    } catch (err) {
      setError(describeError(err));
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  // The 03 step lands just past the fold on a desktop viewport, so the numbered
  // sequence promises a step the screen never shows. This is the cue plus the
  // ride down.
  const scrollToRefinement = () => {
    const el = refinementRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    el.querySelector('textarea')?.focus({ preventScroll: true });
  };

  const handleBatchRefinement = () => {
    const formattedAnswers = Object.entries(pendingAnswers)
      .filter(([_, answer]) => answer.trim() !== "")
      .map(([index, answer]) => `Q: ${refinementQuestions[index]} | A: ${answer}`)
      .join('\n');

    // Same contract as the Build button: a live control that explains an empty
    // press rather than a greyed-out one the user has to decode.
    if (!formattedAnswers) {
      setNeedsAnswer(true);
      const fields = refinementRef.current?.querySelectorAll('textarea') ?? [];
      ([...fields].find((f) => !f.value.trim()) ?? fields[0])?.focus();
      return;
    }

    setNeedsAnswer(false);
    generatePrompt(userInput, formattedAnswers);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(optimizedPrompt)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        // A silent no-op here reads as a broken button. Say so, and say what to do.
        console.error('Copy failed:', err);
        setError({
          title: "couldn't reach the clipboard",
          body: 'your browser blocked the copy. select the prompt and copy it manually.',
          retryable: false,
        });
      });
  };

  // Copying is the moment this whole tool exists for, so it gets a shortcut.
  // Shift avoids stealing the browser's own copy when text is selected.
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c' && optimizedPrompt) {
        e.preventDefault();
        handleCopy();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [optimizedPrompt]);

  // The primary button stays live even with an empty input. Pressing it with
  // nothing to build from puts the cursor where the work starts and says why,
  // which is more use than a greyed-out control the visitor lands on.
  const handleBuild = () => {
    if (!hasInput) {
      setNeedsIdea(true);
      textareaRef.current?.focus();
      return;
    }
    generatePrompt(userInput);
  };

  const handleClear = () => {
    setUndoSnapshot({ userInput, optimizedPrompt, refinementQuestions, pendingAnswers, usedFramework });
    setUserInput('');
    setOptimizedPrompt('');
    setRefinementQuestions([]);
    setPendingAnswers({});
    setUsedFramework(null);
    setError(null);
    setNeedsIdea(false);
    setNeedsAnswer(false);
    textareaRef.current?.focus();
  };

  const handleUndoClear = () => {
    if (!undoSnapshot) return;
    setUserInput(undoSnapshot.userInput);
    setOptimizedPrompt(undoSnapshot.optimizedPrompt);
    setRefinementQuestions(undoSnapshot.refinementQuestions);
    setPendingAnswers(undoSnapshot.pendingAnswers);
    setUsedFramework(undoSnapshot.usedFramework);
    setUndoSnapshot(null);
  };

  const restoreFromHistory = (historyItem) => {
    // Restoring replaces everything on screen. Only interrupt when there is
    // genuinely unsaved work to lose — an untouched or identical input isn't
    // worth a dialog.
    // ponytail: native confirm; swap for an in-place undo affordance if this
    // interruption ever proves annoying in practice.
    const wouldDiscardWork = userInput.trim() && userInput !== historyItem.input;
    if (wouldDiscardWork && !window.confirm('Replace what you have written with this saved prompt?')) {
      return;
    }
    setUserInput(historyItem.input);
    setOptimizedPrompt(historyItem.optimizedPrompt);
    setRefinementQuestions(historyItem.refinementQuestions || []);
    setPendingAnswers({});
    // Older entries predate framework storage — show nothing rather than the
    // last generation's framework, which would attribute this prompt wrongly.
    setUsedFramework(historyItem.usedFramework ?? null);
    setError(null);
    setNeedsIdea(false);
    setNeedsAnswer(false);
    setUndoSnapshot(null);
  };

  return (
    <div className="min-h-dvh bg-background text-foreground font-sans p-4 md:p-8">
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
        {/* At 320px the mark, the wordmark at 30px and the mode switch together
            needed 344px — the switch was clipped off-screen. The mark and the
            wordmark both step down below `sm` so the row fits without wrapping,
            which keeps the lockup intact on the smallest phones. */}
        <header className="flex items-start justify-between gap-3 sm:gap-4 mb-10 md:mb-12">
          {/* Top-aligned, not centered: centering the mark against the whole
              two-line block dropped its optical centre well below the wordmark. */}
          <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
            <img
              src="/logo.png"
              alt="PromptFixer logo"
              width={44}
              height={44}
              className="w-9 h-9 sm:w-11 sm:h-11 mt-0.5 rounded-md shadow-sm border border-border bg-card object-contain p-1 shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-serif font-medium text-foreground leading-[1.15] tracking-[-0.02em]">
                PromptFixer
              </h1>
              {/* Micro-hero: slim value-prop so novices instantly get what it does */}
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Turn rough ideas into clear, high-performance AI prompts.
              </p>
            </div>
          </div>

          {/* A labelled text switch, not the default sun/moon icon toggle — it
              names the mode you'll get, so there's nothing to decode. */}
          {/* The hit area is padded to clear the 24px minimum (44px on touch)
              while the negative margin keeps the row exactly where it was. The
              dotted rule lives on the inner span so it stays tight to the text
              instead of floating away from it. */}
          <button
            type="button"
            onClick={toggleTheme}
            className="group shrink-0 flex items-center py-2 -my-2 touch:py-3 touch:-my-3 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="border-b border-dotted border-muted-foreground/40 group-hover:border-primary/60 pb-0.5 transition-colors">
              {theme === 'dark' ? 'light mode' : 'dark mode'}
            </span>
          </button>
        </header>

        {/* The one landmark the page was missing. Assistive tech had no way to
            skip the header and reach the actual work. A visible skip link would
            be ceremony here — only two controls sit above this. */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Input Side */}
          {/* Explicit row/column placement rather than nesting. History used to
              live inside the input column, so `order` could never move it below
              the result on a stacked phone layout. As its own grid item it sits
              under the input on desktop (row 2, cols 1–5) and after the result
              on mobile, which is what the old comment claimed but couldn't do. */}
          <div className="order-1 lg:col-span-5 lg:col-start-1 lg:row-start-1">
              <div className="lg:sticky lg:top-8">
                {/* The input is a recessed working surface — a tray, not a card.
                    Full-opacity fill (a 40% wash left it indistinguishable from
                    the page) plus an inset shadow; the lift is reserved for the
                    output sheet so the two panels never read as identical boxes. */}
                {/* `!shadow-inner`: tailwind-merge doesn't treat shadow-inner as
                    conflicting with the Card base's shadow-sm, so both survive and
                    source order picks the wrong one. The important flag settles it. */}
                <Card className="bg-muted border-border/80 !shadow-inner rounded-panel">
                  <CardHeader className="pb-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono text-xs text-primary dark:text-muted-foreground tracking-tight shrink-0">01</span>
                        <CardTitle id="idea-heading" className="text-lg font-serif font-medium tracking-[-0.01em]">
                          Your idea
                        </CardTitle>
                      </div>
                      {/* An exit from the whole flow, and the way back in. After a
                          clear this slot becomes the undo, so the most destructive
                          control in the product is also the most recoverable one.
                          Understated register, like the theme switch — a control,
                          not a second CTA. */}
                      {/* Iconed, unlike the plain-text theme switch: these act on
                          the user's content, the theme switch is a preference, and
                          they shouldn't look like the same kind of control. */}
                      {undoSnapshot ? (
                        <button
                          type="button"
                          onClick={handleUndoClear}
                          className="group shrink-0 inline-flex items-center gap-1.5 py-2 -my-2 touch:py-3 touch:-my-3 font-mono text-xs text-primary dark:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-muted rounded-sm"
                        >
                          <Undo2 size={12} className="shrink-0" />
                          <span className="border-b border-dotted border-primary/40 group-hover:border-primary pb-0.5 transition-colors">undo</span>
                        </button>
                      ) : (userInput || optimizedPrompt) ? (
                        <button
                          type="button"
                          onClick={handleClear}
                          className="group shrink-0 inline-flex items-center gap-1.5 py-2 -my-2 touch:py-3 touch:-my-3 font-mono text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-muted rounded-sm"
                        >
                          <RotateCcw size={12} className="shrink-0" />
                          <span className="border-b border-dotted border-muted-foreground/40 group-hover:border-destructive/60 pb-0.5 transition-colors">start over</span>
                        </button>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="relative">
                      {/* The visible "Your idea" title is the label. A placeholder
                          is not an accessible name — it also vanishes the moment
                          the field has content, so it labelled nothing exactly
                          when the user most needed to know what the field was. */}
                      <Textarea
                        ref={textareaRef}
                        aria-labelledby="idea-heading"
                        className="min-h-[260px] max-h-[500px] resize-y bg-card border-border focus-visible:ring-primary text-sm leading-relaxed rounded-lg shadow-sm"
                        placeholder="Describe what you want the AI to do — the rougher the better. PromptFixer rewrites it into a clear, structured prompt that gets better results."
                        value={userInput}
                        onChange={(e) => {
                          setUserInput(e.target.value);
                          // Typing answers the nudge and supersedes the undo.
                          if (needsIdea) setNeedsIdea(false);
                          if (undoSnapshot) setUndoSnapshot(null);
                        }}
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
                              // ponytail: sans, not mono — mono is ~15% wider and
                              // pushed these chips onto three stacked rows.
                              className="text-xs text-muted-foreground bg-muted hover:bg-accent hover:text-accent-foreground border border-border rounded-full px-3 py-1.5 transition-colors cursor-pointer shadow-sm"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* A count, not a limit. There is no input cap to warn about —
                        the server's 10k cap is on generated tokens — so this only
                        reports what's there, and only once it's worth reporting. */}
                    {userInput.length > 1500 && (
                      <p className="text-xs text-muted-foreground text-right tabular-nums">
                        {new Intl.NumberFormat().format(userInput.length)} characters · longer ideas take a moment more to structure
                      </p>
                    )}

                    {/* Turnstile Widget — interaction-only, so it usually renders nothing;
                        no reserved height keeps the button tight to the input. */}
                    <div className="flex justify-center empty:hidden">
                      <div id="turnstile-container"></div>
                    </div>

                    {/* One label for the whole wait. Whether the current sub-step
                        is the bot check, the network, or the model thinking, the
                        visitor asked for a prompt and the prompt is being built. */}
                    <Button
                      onClick={handleBuild}
                      disabled={isLoading}
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

                    {/* Never leave the button as a silent dead end: say what it's
                        waiting for, or surface the keyboard shortcut. */}
                    {!isLoading && (
                      needsIdea ? (
                        <p role="status" className="text-xs text-muted-foreground text-center">
                          Describe your idea above first — anything rough will do.
                        </p>
                      ) : hasInput ? (
                        <p className="hidden sm:block text-xs text-muted-foreground text-center">
                          Or press{' '}
                          <kbd className="px-1.5 py-0.5 rounded-sm border border-border bg-card font-mono text-xs">{MOD_KEY}</kbd>
                          {' + '}
                          <kbd className="px-1.5 py-0.5 rounded-sm border border-border bg-card font-mono text-xs">Enter</kbd>
                        </p>
                      ) : null
                    )}
                  </CardContent>
                </Card>

                {/* The permanent resident of this column. It used to live in the
                    output's empty state, where it vanished the moment a result
                    arrived — so a returning user could never find it again, and
                    the idle right panel carried height the left one lacked.
                    Here it answers "how does this work?" at every point in the
                    flow, and the two columns resolve from both directions. */}
                <div className="mt-6 px-1">
                  <FrameworkReference summary="how does PromptFixer choose?" />
                </div>
              </div>
            </div>


          {/* Output Side. Spans both rows so history can sit beneath the input
              without the taller result column pushing it down the page. */}
          <div
            ref={outputRef}
            tabIndex={-1}
            className="order-2 lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:row-span-2 scroll-mt-4 focus:outline-none"
          >
            {/* The output is the sheet of paper: lifted off the desk with a
                warm-tinted shadow, so hierarchy comes from depth, not borders. */}
            <Card className="shadow-sheet border-border/60 rounded-panel flex flex-col">
              <CardHeader className="border-b border-border shrink-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-xs text-primary dark:text-muted-foreground tracking-tight shrink-0">02</span>
                    <CardTitle className="text-lg font-serif font-medium tracking-[-0.01em]">
                      Optimized prompt
                    </CardTitle>
                  </div>

                  {/* Without this the numbered sequence advertises an 03 that sits
                      ~20px below the fold with nothing hinting at it. */}
                  {refinementQuestions.length > 0 && !isLoading && (
                    <button
                      type="button"
                      onClick={scrollToRefinement}
                      className="group order-last w-full sm:order-none sm:w-auto inline-flex items-center gap-1.5 py-2 -my-2 touch:py-3 touch:-my-3 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <ArrowDown size={12} className="shrink-0" />
                      <span className="border-b border-dotted border-muted-foreground/40 group-hover:border-foreground/60 pb-0.5 transition-colors">
                        {refinementQuestions.length} question{refinementQuestions.length === 1 ? '' : 's'} below
                      </span>
                    </button>
                  )}

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
                      <Button
                        onClick={handleCopy}
                        size="sm"
                        title={`Copy the prompt (${COPY_SHORTCUT})`}
                        aria-keyshortcuts={COPY_SHORTCUT_ARIA}
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Copied' : 'Copy'}
                        {/* /90 is the floor that clears AA in BOTH themes: dark's
                            lighter oxblood (#b91c1c) leaves less headroom, so /70
                            measured 4.4:1 and /80 still only 4.45:1 there. */}
                        <kbd className="hidden md:inline font-mono text-xs text-primary-foreground/90 border border-primary-foreground/25 rounded-sm px-1 py-px ml-0.5">
                          {COPY_SHORTCUT}
                        </kbd>
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              {/* The height cap only exists to stop a long generated prompt from
                  running the page on forever — so it applies only when there IS
                  output. The idle/empty state is a fixed, known height and gets to
                  size itself, rather than sitting in a nested scrollbar. */}
              <CardContent
                className={cn(
                  'flex-grow p-6 sm:p-8',
                  (optimizedPrompt || isLoading) &&
                    'overflow-y-auto max-h-[calc(100dvh-14rem)] min-h-[22rem]'
                )}
              >
                {isLoading ? (
                  /* Skeleton shaped like the mono prompt block it's replacing —
                     the layout doesn't jump when the real text lands. */
                  <div className="space-y-6">
                    <div className="bg-muted/30 p-6 rounded-lg border border-border space-y-3">
                      {['85%', '70%', '92%', '48%', '78%', '88%', '60%'].map((w, i) => (
                        <div
                          key={i}
                          className="h-3 rounded-sm bg-foreground/10 animate-pulse"
                          style={{ width: w, animationDelay: `${i * 90}ms` }}
                        />
                      ))}
                    </div>
                    {/* The copy has to stay true. Once we're retrying, "a few
                        seconds" is no longer what's happening — say so. */}
                    <p className="font-mono text-xs text-muted-foreground" role="status">
                      {isRetrying
                        ? 'the ai service is slow right now — still working.'
                        : 'Structuring your prompt — a few seconds.'}
                    </p>
                  </div>
                ) : optimizedPrompt ? (
                  <div>
                    <div className="whitespace-pre-wrap text-foreground text-sm font-mono leading-relaxed bg-muted/30 p-6 rounded-lg border border-border">
                      {optimizedPrompt}
                    </div>
                    {/* Framework attribution is half the product's positioning,
                        so it gets the sanctioned section-label treatment rather
                        than a grey footnote: accent bar, named framework, what
                        the letters stand for, and why it was picked. */}
                    {usedFramework && (
                      <div className="mt-6 border-t border-border pt-4 flex gap-3">
                        <span aria-hidden="true" className="w-1 self-stretch rounded-full bg-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-semibold uppercase tracking-wide text-primary dark:text-foreground">
                            {usedFramework}
                          </p>
                          {frameworks[usedFramework]?.label && (
                            <p className="text-sm text-foreground mt-1.5">
                              {frameworks[usedFramework].label}
                            </p>
                          )}
                          {frameworks[usedFramework]?.useCase && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Best for {frameworks[usedFramework].useCase.toLowerCase()}.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Teaching empty state: show a real rough-idea → structured-prompt
                     transformation so the value lands before the user types anything.
                     (Replaces the old fake skeleton, which implied loading when idle.)
                     No vertical padding of its own — CardContent already pads, and
                     doubling it was part of what forced the panel to scroll. */
                  <div className="h-full flex flex-col items-center justify-center text-center px-2">
                    <h3 className="text-lg font-serif font-medium text-foreground mb-2">
                      Your optimized prompt will appear here
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
                      Describe a rough idea on the left and PromptFixer structures it into a
                      clear, high-performance prompt. Here's the kind of transformation you'll get:
                    </p>

                    <div className="w-full max-w-md text-left space-y-3">
                      <div>
                        <p className="font-mono text-xs text-muted-foreground mb-1.5">
                          you type
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
                        <p className="font-mono text-xs text-muted-foreground mb-1.5">
                          you get
                        </p>
                        {/* Only the opening of the example. Showing all of it made
                            the idle panel the same height as a real result, so the
                            empty state read as one — and left the input column
                            with a quarter-screen of dead space beside it. */}
                        <div className="text-foreground text-xs font-mono leading-relaxed bg-muted/30 p-3 rounded-lg border border-border">
                          <div className="whitespace-pre-wrap">{EXAMPLE_OUTPUT_HEAD}</div>
                          <details className="group mt-2">
                            <summary className="cursor-pointer list-none py-1.5 -my-1.5 touch:py-3.5 touch:-my-3.5 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-sm inline-flex items-center gap-1.5">
                              <ChevronRight size={12} className="transition-transform group-open:rotate-90 shrink-0" />
                              <span className="group-open:hidden">see the rest</span>
                              <span className="hidden group-open:inline">hide the rest</span>
                            </summary>
                            <div className="whitespace-pre-wrap mt-2">{EXAMPLE_OUTPUT_REST}</div>
                          </details>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>

              {/* Refinement Questions */}
              {refinementQuestions.length > 0 && !isLoading && (
                <div ref={refinementRef} className="p-6 bg-muted/30 border-t border-border shrink-0 scroll-mt-4">
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="font-mono text-xs text-primary dark:text-muted-foreground tracking-tight shrink-0">03</span>
                    <h3 className="font-serif text-base font-medium text-foreground tracking-[-0.01em]">
                      Sharpen it further
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {refinementQuestions.map((q, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <ArrowRight size={8} className="text-primary dark:text-foreground" />
                          </div>
                          <p id={`refinement-q-${i}`} className="text-xs font-medium text-foreground leading-relaxed">{q}</p>
                        </div>
                        {/* Each field is labelled by its own question, so a screen
                            reader announces what is being asked rather than three
                            identical "Your answer..." boxes. */}
                        <Textarea
                          aria-labelledby={`refinement-q-${i}`}
                          className="text-xs bg-card border-border min-h-[60px]"
                          placeholder="Your answer..."
                          rows={2}
                          value={pendingAnswers[i] || ''}
                          onChange={(e) => {
                            setPendingAnswers(prev => ({ ...prev, [i]: e.target.value }));
                            if (needsAnswer) setNeedsAnswer(false);
                          }}
                          // Step 01 teaches this shortcut under its own button. It
                          // was dead in the only other text-entry step in the
                          // product, which is the one place the interface taught a
                          // gesture and then ignored it.
                          onKeyDown={(e) => {
                            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                              e.preventDefault();
                              handleBatchRefinement();
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* After the questions, not before them: the submit used to sit
                      in the section header, so keyboard users tabbed onto it
                      before reaching anything to submit. It also stays live at
                      rest — an empty press moves the cursor to the first blank
                      answer, the same contract as the Build button. */}
                  <div className="mt-5 flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
                    {needsAnswer && (
                      <p role="status" className="text-xs text-muted-foreground mr-auto">
                        Answer at least one question — skip any that don&rsquo;t apply.
                      </p>
                    )}
                    {/* Same hint as step 01, now that the gesture works here too. */}
                    <p className="hidden sm:block text-xs text-muted-foreground">
                      <kbd className="px-1.5 py-0.5 rounded-sm border border-border bg-card font-mono text-xs">{MOD_KEY}</kbd>
                      {' + '}
                      <kbd className="px-1.5 py-0.5 rounded-sm border border-border bg-card font-mono text-xs">Enter</kbd>
                    </p>
                    <Button
                      onClick={handleBatchRefinement}
                      size="sm"
                      className="font-semibold"
                    >
                      <Send size={12} />
                      Apply Updates
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* History. Last in the DOM so focus order follows the primary flow —
              idea, result, then the archive — and `order-3` keeps the visual
              order matching on every breakpoint. */}
          {history.length > 0 && (
            <div className="order-3 lg:col-span-5 lg:col-start-1 lg:row-start-2 px-2">
              <div className="flex items-center justify-between mb-3">
                {/* h2: history is a sibling region of the input and the result,
                    not a subsection of either. */}
                <h2 className="font-mono text-xs text-muted-foreground flex items-center gap-1.5">
                  <History size={12} />
                  recent
                </h2>
                {/* Icon-only and destructive: it needs a name for anyone who
                    can't see the icon. */}
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  aria-label="Clear recent prompts"
                  title="Clear recent prompts"
                  className="grid place-items-center w-6 h-6 -m-1 touch:w-11 touch:h-11 touch:-m-3 text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="space-y-2">
                {history.map((historyItem, i) => (
                  <button
                    key={historyItem.timestamp ?? i}
                    type="button"
                    onClick={() => restoreFromHistory(historyItem)}
                    className="w-full text-left p-3 text-xs font-medium text-foreground bg-card hover:border-primary/30 border border-border rounded-lg transition-all flex items-center justify-between group shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <span className="truncate pr-4">{historyItem.input}</span>
                    <ChevronRight size={10} className="opacity-0 group-hover:opacity-100 text-primary dark:text-foreground transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-16 pb-8 text-center">
        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <span>Built by Josh Kellett</span>
          {/* These were the worst offenders in the audit: 14×14 icons sitting 8px
              apart, failing both the 24px target minimum and the spacing
              exception. The icons are unchanged; only the hit box grew. */}
          <div className="flex items-center gap-1 touch:gap-0">
            <a
              href="https://linkedin.com/in/joshkellett"
              target="_blank"
              rel="noopener noreferrer"
              className="grid place-items-center w-7 h-7 touch:w-11 touch:h-11 rounded-sm hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="LinkedIn"
            >
              <Linkedin size={14} />
            </a>
            <a
              href="https://github.com/joshkellett87"
              target="_blank"
              rel="noopener noreferrer"
              className="grid place-items-center w-7 h-7 touch:w-11 touch:h-11 rounded-sm hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="GitHub"
            >
              <Github size={14} />
            </a>
          </div>
        </div>
      </footer>

      {/* Error Toast. The accent is a `w-1` bar element, not a thick border-left
          — the design system rules that one out explicitly. */}
      {error && (
        <div
          role="alert"
          // Bottom-LEFT on desktop: near the Build button that caused it, and off
          // the result the user came for. Full width on phones.
          className="fixed bottom-6 left-6 right-6 sm:right-auto sm:max-w-sm bg-card border border-border shadow-xl p-4 rounded-lg flex items-start gap-3 z-50"
        >
          <span aria-hidden="true" className="w-1 self-stretch rounded-full bg-destructive shrink-0" />
          <AlertTriangle className="text-destructive w-4 h-4 shrink-0 mt-px" />
          <div className="flex-grow min-w-0">
            <p className="font-mono text-xs text-destructive mb-1">{error.title}</p>
            <p className="text-muted-foreground text-xs leading-relaxed">{error.body}</p>
            {error.retryable && (
              <button
                type="button"
                onClick={() => { setError(null); generatePrompt(userInput); }}
                className="group mt-1.5 inline-flex items-center py-2 touch:py-3 font-mono text-xs text-primary dark:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              >
                <span className="border-b border-dotted border-primary/40 group-hover:border-primary pb-0.5 transition-colors">try again</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss"
            className="shrink-0 grid place-items-center w-6 h-6 -mt-1 -mr-1 touch:w-11 touch:h-11 touch:-mt-3 touch:-mr-3 text-muted-foreground hover:text-foreground transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
