'use client';

import { useState, useCallback } from 'react';
import { UploadCloud, FileArchive, Loader2 } from 'lucide-react';
import { ProjectAnalysis } from '../lib/types';
import { ProjectAnalyzer } from '../lib/analyzer/ProjectAnalyzer';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { AI_CONFIG } from '../config/ai';

export default function UploadZone({ 
  onAnalysisComplete, 
  selectedModel, 
  onModelChange 
}: { 
  onAnalysisComplete: (data: ProjectAnalysis) => void;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}) {
  const [isHovering, setIsHovering] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.zip') || file.type === 'application/zip')) {
        await processFile(file);
    } else {
        alert("Please upload a .zip file");
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          await processFile(file);
      }
  };

  const processFile = async (file: File) => {
      setIsAnalyzing(true);
      setErrorState(null);
      try {
          const analysis = await ProjectAnalyzer.analyzeTarget(file, selectedModel);
          // artificial delay for visual effect
          await new Promise(resolve => setTimeout(resolve, 800));
          onAnalysisComplete(analysis);
      } catch (error: unknown) {
          console.error("Analysis failed:", error);
          setErrorState((error as Error).message || "Failed to analyze ZIP file. Please try another model.");
      } finally {
          setIsAnalyzing(false);
      }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-xl mx-auto w-full mt-12"
    >
        <div 
          className={cn(
            "relative group flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-3xl transition-all duration-300 overflow-hidden",
            isHovering ? "border-indigo-500 bg-indigo-500/10 scale-[1.02]" : "border-slate-700 bg-slate-900/50 hover:bg-slate-800/80 hover:border-slate-500"
          )}
          onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
          onDragLeave={() => setIsHovering(false)}
          onDrop={handleDrop}
        >
            <input 
              type="file" 
              accept=".zip" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={handleFileSelect}
              disabled={isAnalyzing}
            />
            
            <AnimatePresence mode="wait">
              {errorState ? (
                 <motion.div 
                    key="error"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center p-4 text-center z-20 absolute"
                 >
                     <p className="text-rose-400 font-semibold mb-2 flex items-center gap-2">
                       <span className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">!</span>
                       Analysis Failed
                     </p>
                     <p className="text-xs text-rose-200/70 max-w-[80%] break-all">
                       {errorState}
                     </p>
                     <button 
                       onClick={(e) => { e.stopPropagation(); setErrorState(null); }}
                       className="mt-4 text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 px-3 py-1.5 rounded-full transition"
                     >
                       Dismiss & Try Again
                     </button>
                 </motion.div>
              ) : isAnalyzing ? (
                 <motion.div 
                    key="analyzing"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center"
                 >
                     <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
                     <p className="text-xl font-medium text-slate-200">Analyzing Project Anatomy...</p>
                     <p className="text-sm text-slate-400 mt-2">Extracting architecture and building intelligence object</p>
                 </motion.div>
              ) : (
                <motion.div 
                    key="upload"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center"
                >
                    <div className="p-4 bg-slate-800 rounded-full mb-4 group-hover:bg-indigo-500/20 group-hover:scale-110 transition-all duration-300">
                      <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-indigo-400" />
                    </div>
                    <p className="text-xl font-medium text-slate-200">Drag & Drop your ZIP file</p>
                    <p className="text-sm text-slate-400 mt-2 flex items-center gap-1">
                      <FileArchive className="w-4 h-4" /> Next.js, Node.js, React, React Native...
                    </p>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Animated Gradient Border Overlay */}
            <div className="absolute inset-0 pointer-events-none rounded-3xl border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        {/* Model Selection UI */}
        <div className="mt-6 flex flex-col items-center gap-2">
           <label className="text-sm font-medium text-slate-400">Select Intelligence Engine</label>
           <select 
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full max-w-xs p-2.5 outline-none transition"
           >
              {AI_CONFIG.availableModels.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.provider})
                </option>
              ))}
           </select>
        </div>
    </motion.div>
  );
}
