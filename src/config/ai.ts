export const AI_CONFIG = {
  // Available models for the user to choose from in the UI
  availableModels: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini' },
  ],
  
  // Default configurations
  defaultModelId: 'gemini-2.5-flash',
  temperature: 0.3,

  // Fallback direct Gemini configurations if OpenRouter is not used
  geminiDirect: {
    model: 'gemini-2.5-flash',
    temperature: 0.3,
  }
};
