export const AI_CONFIG = {
  // Available models for the user to choose from in the UI
  availableModels: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Direct)', provider: 'gemini' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Direct)', provider: 'gemini' },
    { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash (OpenRouter)', provider: 'openrouter' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'openrouter' },
    { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', provider: 'openrouter' },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'openrouter' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openrouter' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openrouter' },
    { id: 'openai/gpt-oss-120b:free', name: 'GPT-OSS-120B (Free)', provider: 'openrouter' },
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
