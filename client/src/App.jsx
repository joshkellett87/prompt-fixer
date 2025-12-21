import React, { useState, useEffect, useRef } from 'react';
import { 
  Wand2, 
  MessageSquarePlus, 
  Copy, 
  Check, 
  RefreshCw, 
  Settings2, 
  ChevronRight,
  Info, 
  Sparkles,
  ArrowRight,
  Trash2,
  History,
  Volume2,
  Zap,
  Layout,
  Microscope,
  X,
  Send,
  HelpCircle,
  ChevronDown,
  BrainCircuit
} from 'lucide-react';
import { callApiWithBackoff, fetchOptimizedPrompt } from './api';
import { frameworks } from './prompts/frameworks';
import { getSystemInstruction } from './prompts/systemInstructions';

const HISTORY_STORAGE_KEY = 'prompt-architect-history';

const App = () => {
  // State Management
  const [userInput, setUserInput] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [refinementQuestions, setRefinementQuestions] = useState([]);
  const [pendingAnswers, setPendingAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
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
  const [activeFramework, setActiveFramework] = useState('SMART');
  const [showFrameworks, setShowFrameworks] = useState(false);


  const dropdownRef = useRef(null);
  const widgetIdRef = useRef(null);




  // Save history to localStorage on update
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save history:', e);
    }
  }, [history]);

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

    // If script already loaded
    if (window.turnstile) {
      renderWidget();
    } else {
      // Polling for Turnstile availability (more robust than setTimeout)
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

  // UI Event: Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowFrameworks(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Primary Logic: Generation
  const generatePrompt = async (input, answers = "", isAutoRefine = false) => {
    if (!input && !answers && !isAutoRefine) return;
    
    // Check for Turnstile token
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
          { role: "system", content: getSystemInstruction(activeFramework, !!answers || isAutoRefine) },
          { role: "user", content: fullPrompt }
        ],
        turnstileToken: window.turnstileToken
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
      
      // Reset Turnstile if needed for subsequent requests
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
    const textArea = document.createElement("textarea");
    textArea.value = optimizedPrompt;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation / Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 rotate-1 hover:rotate-0 transition-transform">
              <Wand2 className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">Prompt Architect</h1>
              <p className="text-[9px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-0.5">Optimized Instruction Engine</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 min-w-[280px]">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">
              <BrainCircuit size={10} className="text-indigo-500" /> Framework
            </div>
            
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowFrameworks(!showFrameworks)}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 shadow-sm flex items-center justify-between hover:border-indigo-300 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Zap size={12} className={activeFramework === 'SMART' ? "text-amber-500" : "text-indigo-500"} />
                  {activeFramework === 'SMART' ? 'Smart Mode' : `${activeFramework} Strategy Active`}
                </div>
                <ChevronDown size={12} className={`transition-transform duration-200 ${showFrameworks ? 'rotate-180' : ''}`} />
              </button>

              {showFrameworks && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => { setActiveFramework('SMART'); setShowFrameworks(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold transition-all ${
                      activeFramework === 'SMART' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Smart Mode (Recommended)
                  </button>
                  <div className="h-px bg-slate-100 my-1 mx-2" />
                  {Object.keys(frameworks).map(f => (
                    <button
                      key={f}
                      onClick={() => { setActiveFramework(f); setShowFrameworks(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold transition-all group relative ${
                        activeFramework === f ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{f}</span>
                        <HelpCircle size={10} className="text-slate-300" />
                      </div>
                      {/* Left-Aligned Tooltip */}
                      <div className="absolute right-full mr-2 top-0 hidden group-hover:block w-48 p-3 bg-slate-900 text-white rounded-xl shadow-2xl z-[60]">
                        <p className="font-black text-indigo-400 mb-1 uppercase tracking-wider">{f}</p>
                        <p className="font-medium leading-normal text-slate-300">{frameworks[f].description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Input Side */}
          <div className="lg:col-span-5 space-y-6 sticky top-8">
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
              <div className="p-6">
                <h2 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter text-sm mb-4">
                  <MessageSquarePlus size={14} className="text-indigo-600" />
                  Your Idea
                </h2>
                
                <textarea
                  className="w-full h-40 p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400/50 outline-none transition-all resize-none text-slate-700 placeholder:text-slate-300 font-medium leading-relaxed text-sm"
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
                 <div className="mt-4 flex justify-center min-h-[65px]">
                    <div id="turnstile-container"></div>
                </div>


                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={() => generatePrompt(userInput)}
                    disabled={!userInput.trim() || isLoading || !window.turnstileToken}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-white text-xs transition-all active:scale-[0.98] bg-indigo-600 ${
                      userInput.trim() && window.turnstileToken && !isLoading
                        ? 'hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? <RefreshCw className="animate-spin" size={16} /> : <><Wand2 size={16} /> Build Prompt</>}
                  </button>
                  
                  <div className="relative group">
                    <button
                      onClick={() => generatePrompt(userInput, "", true)}
                      disabled={isLoading || !optimizedPrompt}
                      className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-xs transition-all border-2 active:scale-[0.98] ${
                        isLoading || !optimizedPrompt 
                          ? 'border-slate-100 text-slate-300 bg-transparent' 
                          : 'border-indigo-100 text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                      }`}
                    >
                      <Microscope size={16} /> Auto-Refine
                    </button>
                    <div className="absolute bottom-full mb-2 hidden group-hover:block w-40 p-2 bg-slate-800 text-white text-[9px] rounded-lg shadow-2xl z-10 text-center font-bold">
                      Uses self-audit logic to polish instructions and remove redundancy.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* History List */}
            {history.length > 0 && (
              <div className="px-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <History size={10} /> History
                  </h3>
                  <button onClick={() => setHistory([])} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {history.map((historyItem, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setUserInput(historyItem.input);
                        setOptimizedPrompt(historyItem.optimizedPrompt);
                        setRefinementQuestions(historyItem.refinementQuestions || []);
                        setPendingAnswers({});
                      }}
                      className="w-full text-left p-3 text-[10px] font-bold text-slate-500 bg-white hover:border-indigo-200 border border-slate-100 rounded-xl transition-all flex items-center justify-between group"
                    >
                      <span className="truncate pr-4">{historyItem.input}</span>
                      <ChevronRight size={10} className="opacity-0 group-hover:opacity-100 text-indigo-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results Side */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 flex flex-col min-h-[550px] transition-all duration-700">
              <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Sparkles className="text-amber-500 w-4 h-4" />
                  </div>
                  <h2 className="font-black text-slate-800 text-base tracking-tight leading-none">Optimized Prompt</h2>
                </div>
                
                {optimizedPrompt && (
                  <button 
                    onClick={handleCopy}
                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all ${
                      copied ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                    }`}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy Prompt'}
                  </button>
                )}
              </div>
              
              <div className="p-8 flex-grow overflow-y-auto max-h-[600px]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
                    <div className="relative">
                       <div className="w-10 h-10 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
                       <Wand2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="text-center">
                      <p className="font-black text-xs text-slate-800 tracking-widest uppercase">Designing...</p>
                    </div>
                  </div>
                ) : optimizedPrompt ? (
                  <div className="whitespace-pre-wrap text-slate-700 text-xs font-medium leading-[1.6] font-mono tracking-tight bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                    {optimizedPrompt}
                  </div>
                ) : (
                  <div className="bg-slate-50/50 rounded-3xl p-6 space-y-4">
                    {/* Skeleton lines */}
                    <div className="h-4 bg-slate-200 rounded animate-pulse w-full"></div>
                    <div className="h-4 bg-slate-200 rounded animate-pulse w-5/6"></div>
                    <div className="h-4 bg-slate-200 rounded animate-pulse w-4/6"></div>
                    <div className="h-4 bg-slate-200 rounded animate-pulse w-full"></div>
                    <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
                    {/* Placeholder text */}
                    <p className="text-center text-slate-400 text-sm mt-6">
                      Your optimized prompt will appear here
                    </p>
                  </div>
                )}
              </div>

              {/* Batch Refinement Area */}
              {refinementQuestions.length > 0 && !isLoading && (
                <div className="p-6 bg-slate-50/50 border-t border-slate-100 shrink-0">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
                      <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Details & Improvements</h3>
                    </div>
                    {Object.values(pendingAnswers).some(a => a.trim() !== "") && (
                      <button 
                        onClick={handleBatchRefinement}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-[9px] font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all animate-in fade-in slide-in-from-right-4"
                      >
                        <Send size={10} /> Apply All Updates
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {refinementQuestions.map((q, i) => (
                      <div key={i} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:border-indigo-200 transition-all group">
                        <div className="flex items-start gap-2 mb-3">
                          <div className="w-4 h-4 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <ArrowRight size={8} />
                          </div>
                          <p className="text-[10px] font-bold text-slate-700 leading-normal">{q}</p>
                        </div>
                        <textarea 
                          className="w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-4 focus:ring-indigo-500/5 outline-none text-[10px] text-slate-600 font-bold placeholder:text-slate-300 resize-none transition-all"
                          placeholder="Provide details..."
                          rows={2}
                          value={pendingAnswers[i] || ''}
                          onChange={(e) => setPendingAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Dynamic Error Messaging */}
      {error && (
        <div className="fixed bottom-6 right-6 max-w-sm bg-white border-l-4 border-red-500 shadow-2xl p-4 rounded-xl flex items-start gap-3 animate-slide-in z-[100]">
          <Info className="text-red-500 shrink-0" size={20} />
          <div>
            <p className="font-black text-slate-800 uppercase text-[9px] tracking-widest mb-0.5">Error</p>
            <p className="text-slate-500 text-[9px] font-bold leading-normal">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;