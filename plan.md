Prompt Architect: Technical Documentation

1. Project Overview

Prompt Architect is a high-fidelity web application designed to democratize advanced prompt engineering. It bridges the gap between novice users and Large Language Models (LLMs) by acting as a "Senior Prompt Engineer" intermediary.

The tool takes a simple user intent and, using a multi-step reasoning process, wraps that intent in a proven prompt engineering framework (such as CO-STAR or RISEN).

2. Technical Approach

The application is built using a Single-File React Architecture. This choice was made to ensure portability and ease of deployment within constrained environments while maintaining a rich, interactive state.

Key Logic Pillars:

Invisibile Framework Selection (Smart Select): Instead of forcing users to choose a strategy, the application uses the LLM to analyze the "Information Entropy" of the input. It then dynamically selects the best structural framework.

Batch Refinement Engine: To reduce token churn and user fatigue, the app implements a non-blocking refinement workspace. Users can answer multiple "Information Gap" questions before triggering a single, unified re-architecture call.

Self-Correction Loop (Auto-Refine): The application implements a "Critic-Actor" pattern where the LLM audits its own generated prompt to remove bloat and improve technical precision.

Resilient API Communication: All network calls utilize a 5-step exponential backoff algorithm (1s, 2s, 4s, 8s, 16s) to ensure stability against rate limits.

3. Technical Breakdown

Frontend: React 18+ with Tailwind CSS for utility-first styling.

Icons: Lucide-React for a semantic, lightweight UI.

Models:

gemini-3-flash-preview: Primary reasoning and text generation.

gemini-2.5-flash-preview-tts: Used for generating authoritative "Strategy Briefs."

UI State Management: React Hooks (useState, useEffect, useRef) are used for managing complex interactions like the "Click-Outside" dropdown behavior and the batch answer tracking.

4. API Rewiring Instructions

By default, the application is configured to receive its API key from the environment. To use this application in a standalone environment with your personal Gemini API key, follow these steps:

Step 1: Obtain a Key

Visit Google AI Studio and generate a new API Key.

Step 2: Update the Code

Locate the following line at the top of the prompt_architect.jsx file:

const API_KEY = ""; // Environment provides the key at runtime


Replace it with your key:

const API_KEY = "YOUR_ACTUAL_API_KEY_HERE";


Step 3: Security Note

If you are deploying this application to a public server (e.g., Vercel, Netlify), do not hardcode the key. Instead, use an environment variable:

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;


Ensure you add REACT_APP_GEMINI_API_KEY to your hosting provider's "Secrets" or "Environment Variables" section.