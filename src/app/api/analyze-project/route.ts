import { NextResponse } from 'next/server';
import { AI_CONFIG } from '../../../config/ai';
import { GoogleGenAI } from '@google/genai';

const geminiApiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (geminiApiKey) {
    ai = new GoogleGenAI({ apiKey: geminiApiKey });
}

export async function POST(req: Request) {
  try {
    const analysisRequest = await req.json();

    const systemPrompt = `
You are a senior Software Systems Architect. Analyze the codebase deeply to infer its architecture.
CRITICAL INSTRUCTION: You MUST output ONLY pure JSON. You must not include any conversational text, greetings, or markdown formatting (no \`\`\`json wrappers). Start your response exactly with '{' and end exactly with '}'. The JSON must adhere to this interface:

interface DeploymentRecommendation {
  platform: string;
  costEstimate: string; // e.g. "Free Tier", "$5-20/mo", "$100+/mo"
  reasoning: string;
}

interface ProjectAnalysis {
  projectName: string;
  projectType: string; // e.g., "Full-Stack Web App", "Backend API", "Utility Script"
  architecture: string; // e.g., "Monolithic MVC", "Microservices", "Client-Server SPA"
  technologies: string[]; // List of core frameworks, languages, libraries used
  database: string | null; // e.g., "MongoDB", "PostgreSQL", null if not found
  modules: string[]; // Major deduced functional modules (e.g., ["Authentication", "Shopping Cart", "Payment Processing"])
  keyFeatures: string[]; // Array of high-level features inferred
  probableDomain: string; // e.g., "E-Commerce", "EdTech", "HealthTech"
  fileTreeSummary: string; // Keep the original file tree summary sent by the user unmodified.
  architectureDiagram: string; // A strictly valid Mermaid.js graph string mapping data flow (e.g., "graph TD\\n A-->B"). Do not wrap in markdown \`\`\` blocks, just raw syntax.
  databaseSchema: string[]; // Array of interpreted database tables (e.g., "Users(id, email)"). Empty if inapplicable.
  deploymentRecommendations: DeploymentRecommendation[]; // 1 to 2 best fit hosting platform proposals.
}

Analyze deeply utilizing the README context, dependency mapping, folder semantics, and the raw Core Code Snippets extracted.
Make heavily informed deductions about the specific frameworks logic and logic flow using the raw snippets. Let's begin parsing.
`;

    const userPrompt = `
Analyze the following project data and return the JSON.

PROJECT NAME: 
${analysisRequest.projectName}

PACKAGE.JSON:
${analysisRequest.packageJson.substring(0, 5000)}

FILE TREE:
${analysisRequest.fileTreeSummary}

README.MD:
${analysisRequest.readme?.substring(0, 8000) || "No README"}

CORE CODE SNIPPETS:
${analysisRequest.coreSnippets || "No architectural snippets found"}
`;

    let aiOutput = '';
    const selectedModel = analysisRequest.modelId || AI_CONFIG.defaultModelId;
    const modelConfig = AI_CONFIG.availableModels.find(m => m.id === selectedModel);

    if (!geminiApiKey || !ai) {
        return NextResponse.json({ error: 'Gemini API key is not configured.' }, { status: 500 });
    }
    
    const response = await ai.models.generateContent({
        model: (!modelConfig || modelConfig.provider !== 'gemini') ? AI_CONFIG.geminiDirect.model : selectedModel,
        contents: systemPrompt + '\n\n' + userPrompt,
        config: {
            temperature: 0.1, 
        }
    });
    aiOutput = response.text || '';

    // Attempt to clean any potential markdown fences out of paranoia just in case the AI messed up
    if (aiOutput.includes('```json')) {
        aiOutput = aiOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    let parsedData;
    console.log("Raw AI output before parsing:", aiOutput);
    try {
        const aiTrimmed = aiOutput.trim();
        const firstBraceIndex = aiTrimmed.indexOf('{');
        const lastBraceIndex = aiTrimmed.lastIndexOf('}');
        
        if (firstBraceIndex !== -1 && lastBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
            const cleanJsonString = aiTrimmed.substring(firstBraceIndex, lastBraceIndex + 1);
            console.log("Substring captured for JSON parsing:", cleanJsonString);
            
            // Try to parse the substring extraction first
            try {
                parsedData = JSON.parse(cleanJsonString);
            } catch(e) {
                // If substring still failed (maybe due to trailing commas or markdown), try the raw first
                parsedData = JSON.parse(aiTrimmed);
            }
        } else {
            parsedData = JSON.parse(aiTrimmed);
        }
    } catch (e: unknown) {
      console.warn("Direct JSON parse failed, attempting regex extraction...", e);
        return NextResponse.json({ error: `AI did not return valid JSON. Ensure your logic requires valid JSON syntax. Raw: ${aiOutput.substring(0, 150)}...` }, { status: 500 });
    }

    // Ensure we keep the original text
    parsedData.fileTreeSummary = analysisRequest.fileTreeSummary;

    return NextResponse.json({ analysis: parsedData });
  } catch (error: unknown) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to analyze project.' }, { status: 500 });
  }
}
