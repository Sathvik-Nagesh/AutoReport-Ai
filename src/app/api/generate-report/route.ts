import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { AI_CONFIG } from '../../../config/ai';

const geminiApiKey = process.env.GEMINI_API_KEY || '';
const openrouterApiKey = process.env.OPENROUTER_API_KEY || '';

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
    if (settings.verbosity === 'short') lengthInstruction = 'Make the responses highly concise and brief. 1 to 2 paragraphs maximum per section.';
    else if (settings.verbosity === 'long') lengthInstruction = 'Make the responses extraordinarily comprehensive and extensive. Write at least 6 to 8 lengthy paragraphs per section, exploring every minute architectural detail and theoretical aspect without summarizing.';
    else if (settings.verbosity === 'exhaustive') lengthInstruction = 'Provide a massive, thesis-level exhaustive analysis. Each section MUST BE at least 1500 words. Leave no detail untouched. Over-explain architectures, provide theoretical backgrounds, write extensive paragraphs, and break down the JSON deeply.';
    else lengthInstruction = 'Write a detailed and thorough response, aiming for 4 to 5 substantial paragraphs per section.';

    let toneInstruction = '';
    if (settings.tone === 'conversational') toneInstruction = 'Use a conversational, slightly casual, and highly accessible tone.';
    else toneInstruction = 'Formal academic tone, professional, objective.';

    let formatInstruction = '';
    if (settings.universityFormat === 'VTU') {
        formatInstruction = `Generate a Visvesvaraya Technological University (VTU) project report strictly following these sections:
- INTRODUCTION
- PROBLEM STATEMENT
- LITERATURE SURVEY
- SYSTEM DESIGN
- METHODOLOGY
- IMPLEMENTATION DETAILS
- ADVANTAGES AND DISADVANTAGES
- CONCLUSION`;
    } else if (settings.universityFormat === 'Generic') {
        formatInstruction = `Generate a standard software project architecture report strictly following these sections:
- Executive Summary
- Architecture Overview
- Core Modules
- Technical Stack
- Implementation Highlights
- Security & Deployment`;
    } else {
        formatInstruction = `Generate a Bangalore University BCA project report strictly following these sections:
- ABOUT
- EXISTING SYSTEM
- Brief explanation of Existing System
- Disadvantages of Existing System
- PROPOSED SYSTEM
- Objective Of The Proposed System
- Brief explanation of Proposed System
- Advantages of Proposed System
- SYSTEM REQUIREMENTS
- Requirement Analysis
- Hardware Requirements
- Software Requirements`;
    }

    const prompt = `
${formatInstruction}

Constraints:
- ${toneInstruction}
- ${lengthInstruction}
- No bullet overuse (write in paragraphs)
- No excessive technical jargon
- Do not mention AI or that this was auto-generated
- You MUST embed the following exact Mermaid diagram codeblock within the Architecture / Proposed System section:
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
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    if (!modelConfig || modelConfig.provider === 'gemini') {
        if (!geminiApiKey || !ai) {
             writer.write(encoder.encode("Error: Gemini API key is not configured."));
             writer.close();
             return new Response(stream.readable);
        }
        
        // Background stream processing
        (async () => {
            try {
                const responseStream = await ai!.models.generateContentStream({
                    model: (!modelConfig) ? targetModelId : AI_CONFIG.geminiDirect.model,
                    contents: prompt,
                    config: { temperature: AI_CONFIG.temperature }
                });

                for await (const chunk of responseStream) {
                    await writer.write(encoder.encode(chunk.text));
                }
            } catch (err: unknown) {
                console.error("Gemini stream error", err);
                await writer.write(encoder.encode(`\n\n[Streaming Error]: ${(err as Error).message}`));
            } finally {
                await writer.close();
            }
        })();

        return new Response(stream.readable, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    } 
    else if (modelConfig.provider === 'openrouter') {
        if (!openrouterApiKey) {
            writer.write(encoder.encode("Error: OpenRouter API key is not configured."));
            writer.close();
            return new Response(stream.readable);
        }

        // Background stream processing
        (async () => {
            try {
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${openrouterApiKey}`,
                        "HTTP-Referer": process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000",
                        "X-Title": "AutoReport AI",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: targetModelId,
                        temperature: AI_CONFIG.temperature,
                        stream: true,
                        messages: [ { role: "user", content: prompt } ]
                    })
                });

                if (!response.ok) {
                    throw new Error(`OpenRouter API responded with status: ${response.status}`);
                }

                if (!response.body) throw new Error("No response body returned from OpenRouter");

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const chunkText = decoder.decode(value, { stream: true });
                    const lines = chunkText.split('\n');
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                            try {
                                const data = JSON.parse(line.substring(6));
                                if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                                    await writer.write(encoder.encode(data.choices[0].delta.content));
                                }
                            } catch (e) {
                                // Ignore broken JSON stream chunks
                            }
                        }
                    }
                }
            } catch (err: unknown) {
            console.error("OpenRouter stream error", err);
            await writer.write(encoder.encode(`\n\n[Streaming Error]: ${(err as Error).message}`));
        } finally {
                await writer.close();
            }
        })();

        return new Response(stream.readable, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    return NextResponse.json({ error: 'Invalid model configuration' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to generate report' }, { status: 500 });
  }
}
