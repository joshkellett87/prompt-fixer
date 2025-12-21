import { useState } from 'react';
import { callApiWithBackoff, fetchOptimizedPrompt } from '../api';
import { getSystemInstruction } from '../prompts/systemInstructions';

export const usePromptGeneration = () => {
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [refinementQuestions, setRefinementQuestions] = useState([]);
  const [pendingAnswers, setPendingAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generatePrompt = async (
    userInput,
    activeFramework,
    answers = "",
    isAutoRefine = false,
    onSuccess = null,
    resetTurnstile = null
  ) => {
    if (!userInput && !answers && !isAutoRefine) return;

    if (!window.turnstileToken && import.meta.env.PROD) {
      setError("Please complete the security check (Captcha) below.");
      return;
    }

    setIsLoading(true);
    setError(null);

    let fullPrompt = answers
      ? `## Current Optimized Prompt (BASE):\n${optimizedPrompt}\n\n## Original Intent:\n${userInput}\n\n## User's Refinement Answers:\n${answers}\n\n## Task: Integrate answers while preserving all existing content. Enhance the prompt structure without losing any details.`
      : `Original Intent: ${userInput}`;

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

      let parsedQuestions = [];
      if (questionMatch) {
        try {
          parsedQuestions = JSON.parse(questionMatch[1]);
        } catch (e) {
          parsedQuestions = [];
        }
      }

      setRefinementQuestions(parsedQuestions);
      setOptimizedPrompt(cleanPrompt);
      setPendingAnswers({});

      if (!answers && !isAutoRefine && onSuccess) {
        onSuccess({
          input: userInput,
          optimizedPrompt: cleanPrompt,
          refinementQuestions: parsedQuestions,
          timestamp: Date.now()
        });
      }

      if (resetTurnstile) {
        resetTurnstile();
      }

    } catch (err) {
      setError(err.message || "Failed to build the prompt. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchRefinement = (userInput, activeFramework, resetTurnstile) => {
    const formattedAnswers = Object.entries(pendingAnswers)
      .filter(([_, answer]) => answer.trim() !== "")
      .map(([index, answer]) => `Q: ${refinementQuestions[index]} | A: ${answer}`)
      .join('\n');

    if (formattedAnswers) {
      generatePrompt(userInput, activeFramework, formattedAnswers, false, null, resetTurnstile);
    }
  };

  return {
    optimizedPrompt,
    setOptimizedPrompt,
    refinementQuestions,
    setRefinementQuestions,
    pendingAnswers,
    setPendingAnswers,
    isLoading,
    error,
    setError,
    generatePrompt,
    handleBatchRefinement,
  };
};
