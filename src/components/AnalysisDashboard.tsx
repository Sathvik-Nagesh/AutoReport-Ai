'use client';

import { ProjectAnalysis } from '../lib/types';
import { motion } from 'framer-motion';
import { Cpu, Server, Database, Layers, CheckCircle2, Bot } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState } from 'react';
import { ReportGenerationSettings } from '../lib/types';

export default function AnalysisDashboard({
  analysis,
  onGenerateReport,
  selectedModel
}: {
  analysis: ProjectAnalysis;
  onGenerateReport: (modifiedAnalysis: ProjectAnalysis) => void;
  selectedModel: string;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [data, setData] = useState<ProjectAnalysis>(analysis);
  const [settings, setSettings] = useState<ReportGenerationSettings>({
      verbosity: 'medium',
      tone: 'formal',
      universityFormat: 'Bangalore University BCA'
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Instead of calling straight to parent, we handle the stream decoding here so we can pass chunks up if we wanted
    // But since the parent component mounts ReportPreview only when text exists, let's pass a stream proxy up
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, targetModelId: selectedModel, settings }),
      });

      if (!response.ok) throw new Error('Failed to generate report');
      if (!response.body) throw new Error('No response body for streaming');

      // Let the parent handle the stream via a modified prop or we just pass the raw fetch Response object
      // Actually, since onGenerateReport expects a ProjectAnalysis, we need to update the parent to accept the stream
      onGenerateReport({ ...data, settings } as unknown as ProjectAnalysis); // We'll modify parent momentarily.
    } catch(err) {
       console.error(err);
       setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-6xl mx-auto mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      {/* Left Column - Core Metrics */}
      <div className="col-span-1 lg:col-span-2 space-y-6">
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                 <Server className="text-indigo-400 w-6 h-6" />
                 <h3 className="text-xl font-semibold text-slate-100">Architecture Definition</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Project Type" value={data.projectType} />
                  <StatCard label="Inferred Domain" value={data.probableDomain} />
                  <StatCard label="Architecture" value={data.architecture} className="col-span-2" />
                  <div className="col-span-2 mt-4">
                     <label className="text-xs text-slate-400 font-medium mb-2 block uppercase tracking-wider">Detected Technologies</label>
                     <div className="flex flex-wrap gap-2">
                         {data.technologies.length > 0 ? data.technologies.map(tech => (
                             <span key={tech} className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm rounded-full flex items-center gap-1">
                                 <CheckCircle2 className="w-3 h-3" /> {tech}
                             </span>
                         )) : (
                            <span className="text-slate-500 text-sm">No specific frameworks detected</span>
                         )}
                     </div>
                  </div>
                   {data.database && (
                     <div className="col-span-2 mt-2">
                        <label className="text-xs text-slate-400 font-medium mb-2 block uppercase tracking-wider">Inferred Database</label>
                        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm rounded-full inline-flex items-center gap-1">
                            <Database className="w-3 h-3" /> {data.database}
                        </span>
                     </div>
                   )}
              </div>
          </div>

          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                 <Layers className="text-fuchsia-400 w-6 h-6" />
                 <h3 className="text-xl font-semibold text-slate-100">Key Features & Modules</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <h4 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider relative group">
                        Inferred Features
                        <span className="opacity-0 group-hover:opacity-100 transition absolute ml-2 text-xs text-fuchsia-400 font-normal normal-case pt-0.5">Based on syntax heuristics</span>
                      </h4>
                      <ul className="space-y-2">
                        {data.keyFeatures.map((f, i) => (
                           <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 mt-1.5 flex-shrink-0" />
                             {f}
                           </li>
                        ))}
                      </ul>
                  </div>
                  <div>
                      <h4 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider relative group">
                        Detected Modules
                      </h4>
                      <ul className="space-y-2">
                        {data.modules.map((m, i) => (
                           <li key={i} className="text-sm text-slate-300 flex items-start gap-2 capitalize">
                             <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 flex-shrink-0" />
                             {m.replace(/([A-Z])/g, ' $1').trim()}
                           </li>
                        ))}
                      </ul>
                  </div>
              </div>
          </div>

          {data.databaseSchema && data.databaseSchema.length > 0 && (
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                 <Database className="text-emerald-400 w-6 h-6" />
                 <h3 className="text-xl font-semibold text-slate-100">Database Schema</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.databaseSchema.map((schema, i) => (
                      <div key={i} className="p-4 bg-black/40 border border-slate-800 rounded-xl">
                          <code className="text-sm text-emerald-300 font-mono">{schema}</code>
                      </div>
                  ))}
              </div>
          </div>
          )}

          {data.deploymentRecommendations && data.deploymentRecommendations.length > 0 && (
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                 <Server className="text-amber-400 w-6 h-6" />
                 <h3 className="text-xl font-semibold text-slate-100">Deployment & Scaling Matrix</h3>
              </div>
              <div className="space-y-4">
                  {data.deploymentRecommendations.map((rec, i) => (
                      <div key={i} className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                          <div className="flex justify-between items-center mb-2">
                             <span className="font-semibold text-amber-300">{rec.platform}</span>
                             <span className="text-xs px-2 py-1 bg-amber-500/20 rounded font-mono text-amber-200">{rec.costEstimate}</span>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed">{rec.reasoning}</p>
                      </div>
                  ))}
              </div>
          </div>
          )}
      </div>

      {/* Right Column - File Tree & Action */}
      <div className="col-span-1 space-y-6">
           <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-xl h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                 <Cpu className="text-cyan-400 w-6 h-6" />
                 <h3 className="text-xl font-semibold text-slate-100">Structure Insight</h3>
              </div>
              <div className="flex-1 bg-black/40 border border-slate-800/50 rounded-xl p-4 overflow-y-auto max-h-[300px]">
                 <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">
                     {data.fileTreeSummary}
                 </pre>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800">
                  <p className="text-sm text-slate-400 mb-4">
                     Review the extracted intelligence. This JSON will be securely sent to <span className="text-white font-medium">{selectedModel}</span> for report synthesis.
                  </p>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-fuchsia-600 hover:from-indigo-400 hover:to-fuchsia-500 text-white rounded-2xl font-semibold shadow-xl shadow-fuchsia-900/20 hover:shadow-fuchsia-900/40 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 group"
                  >
                     {isGenerating ? (
                         <>
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                           Synthesizing Report...
                         </>
                     ) : (
                         <>
                           <Bot className="w-5 h-5 group-hover:scale-110 transition-transform" />
                           Generate Academic Report
                         </>
                     )}
                  </button>
              </div>
            </div>

            {/* Customization Dials */}
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-xl h-full flex flex-col mt-6">
                 <h3 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2"><Bot className="w-5 h-5 text-fuchsia-400" /> Generation Dials</h3>
                 <div className="space-y-4 text-sm mt-2">
                     <div>
                         <label className="text-slate-400 text-xs uppercase font-medium">Verbosity</label>
                         <select 
                             value={settings.verbosity}
                             onChange={(e) => setSettings({...settings, verbosity: e.target.value as 'short' | 'medium' | 'long'})}
                             className="mt-1 w-full bg-slate-900 border border-slate-700/50 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                         >
                             <option value="short">Short & Punchy</option>
                             <option value="medium">Medium Length</option>
                             <option value="long">Deep & Extensive</option>
                         </select>
                     </div>
                     <div>
                         <label className="text-slate-400 text-xs uppercase font-medium">Tone</label>
                         <select 
                             value={settings.tone}
                             onChange={(e) => setSettings({...settings, tone: e.target.value as 'formal' | 'conversational'})}
                             className="mt-1 w-full bg-slate-900 border border-slate-700/50 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                         >
                             <option value="formal">Strictly Formal Academic</option>
                             <option value="conversational">Conversational & Accessible</option>
                         </select>
                     </div>
                     <div>
                         <label className="text-slate-400 text-xs uppercase font-medium">Target Format</label>
                         <select 
                             value={settings.universityFormat}
                             onChange={(e) => setSettings({...settings, universityFormat: e.target.value as 'Bangalore University BCA' | 'VTU' | 'Generic'})}
                             className="mt-1 w-full bg-slate-900 border border-slate-700/50 rounded-xl p-2.5 outline-none focus:border-indigo-500"
                         >
                             <option value="Bangalore University BCA">Bangalore University (BCA)</option>
                             <option value="VTU">VTU Layout</option>
                             <option value="Generic">Generic Architecture</option>
                         </select>
                     </div>
                 </div>
            </div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50", className)}>
        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">{label}</p>
        <p className="text-lg font-medium text-slate-100">{value}</p>
    </div>
  )
}
