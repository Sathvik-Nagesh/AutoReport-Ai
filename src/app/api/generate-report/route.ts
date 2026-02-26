import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';
import { AI_CONFIG } from '../../../config/ai';

const geminiApiKey = process.env.GEMINI_API_KEY || '';

let ai: GoogleGenAI | null = null;
if (geminiApiKey) {
    ai = new GoogleGenAI({ apiKey: geminiApiKey });
}

export async function POST(req: Request) {
  try {
    const requestData = await req.json();
    const settings = requestData.settings || { 
        verbosity: 'medium', tone: 'formal', universityFormat: 'Bangalore University BCA' 
    };

    let lengthInstruction = '';
    if (settings.verbosity === 'short') lengthInstruction = 'CRITICAL LENGTH: Write exactly 1 paragraph per section. Be concise and straight to the point.';
    else if (settings.verbosity === 'long') lengthInstruction = 'CRITICAL LENGTH: Write a highly extensive, comprehensive analysis. Each section MUST be 6 to 8 paragraphs. Deeply investigate all code elements. No summarizing. Expand fully.';
    else if (settings.verbosity === 'exhaustive') lengthInstruction = 'CRITICAL LENGTH: Provide a massive, thesis-level exhaustive analysis. Each section MUST BE at least 1500 words. Explain everything in meticulous detail. Break down JSON completely.';
    else lengthInstruction = 'Write a detailed response of about 3 to 4 paragraphs per section.';

    let toneInstruction = '';
    if (settings.tone === 'conversational') toneInstruction = 'Use a conversational, slightly casual, and highly accessible tone.';
    else toneInstruction = 'Formal academic tone, professional, objective.';

    let formatInstruction = '';
    if (settings.universityFormat === 'VTU') {
        formatInstruction = `Generate a Visvesvaraya Technological University (VTU) project report strictly following these exact Markdown headings:
## INTRODUCTION
## PROBLEM STATEMENT
## LITERATURE SURVEY
## SYSTEM DESIGN
## METHODOLOGY
## IMPLEMENTATION DETAILS
## ADVANTAGES AND DISADVANTAGES
## CONCLUSION`;
    } else if (settings.universityFormat === 'Generic') {
        formatInstruction = `Generate a standard software project architecture report strictly following these exact Markdown headings:
## Executive Summary
## Architecture Overview
## Core Modules
## Technical Stack
## Implementation Highlights
## Security & Deployment`;
    } else {
        formatInstruction = `Generate a Bangalore University BCA project report strictly following these exact Markdown headings:
## ABOUT
## EXISTING SYSTEM
### Brief explanation of Existing System
### Disadvantages of Existing System
## PROPOSED SYSTEM
### Objective Of The Proposed System
### Brief explanation of Proposed System
### Advantages of Proposed System
## SYSTEM REQUIREMENTS
### Requirement Analysis
### Hardware Requirements
### Software Requirements`;
    }

    const prompt = `
${formatInstruction}

Constraints:
- ${toneInstruction}
- ${lengthInstruction}
- No bullet overuse (write in paragraphs)
- No excessive technical jargon
- Do not mention AI or that this was auto-generated
- You MUST embed the exact Mermaid diagram codeblock within the Architecture / Proposed System section. 
IMPORTANT FORMAT FOR MERMAID: Do not wrap the code in HTML. Use standard Markdown fenced codeblocks like so:
\`\`\`mermaid
${requestData.architectureDiagram || "graph TD\\n A[Entity] --> B[System]"}
\`\`\`
- You MUST include a "Deployment & Hosting" subsection describing the JSON Deployment recommendations.
- Base the writing strictly on the provided JSON analysis of the project's codebase below.
${settings.customPrompt ? `\n--- USER REFINEMENT PROMPT ---\n${settings.customPrompt}\n------------------------------` : ''}

Project Analysis JSON:
${JSON.stringify(requestData, null, 2)}
`;

    const targetModelId = requestData.targetModelId || AI_CONFIG.defaultModelId;
    const modelConfig = AI_CONFIG.availableModels.find(m => m.id === targetModelId);

    const encoder = new TextEncoder();

    if (!geminiApiKey || !ai) {
         return new Response("Error: Gemini API key is not configured.", { status: 400 });
    }
    
    // Always use Gemini for now
    const selectedModelStr = (!modelConfig || modelConfig.provider !== 'gemini') ? AI_CONFIG.geminiDirect.model : targetModelId;

    const stream = new ReadableStream({
        async start(controller) {
            try {
                const responseStream = await ai!.models.generateContentStream({
                    model: selectedModelStr,
                    contents: prompt,
                    config: { temperature: AI_CONFIG.temperature }
                });

                for await (const chunk of responseStream) {
                    controller.enqueue(encoder.encode(chunk.text));
                }
            } catch (err: unknown) {
                console.error("Gemini stream error", err);
                controller.enqueue(encoder.encode(`\n\n[Streaming Error]: ${(err as Error).message}`));
            } finally {
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  } catch (error: unknown) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to generate report' }, { status: 500 });
  }
}
