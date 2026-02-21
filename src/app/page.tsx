'use client';

import { useState, useEffect } from 'react';
import { ProjectAnalysis, ReportGenerationRequest } from '../lib/types';
import UploadZone from '../components/UploadZone';
import AnalysisDashboard from '../components/AnalysisDashboard';
import ReportPreview from '../components/ReportPreview';
import { Sparkles, BrainCircuit, History, ChevronRight, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AI_CONFIG } from '../config/ai';

export interface SavedReport {
  id: number;
  name: string;
  date: string;
  analysis: ProjectAnalysis;
  reportText: string;
}

export default function Home() {
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [reportText, setReportText] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(AI_CONFIG.defaultModelId);

  const [isGeneratingStream, setIsGeneratingStream] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
     if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('autoreport_history');
        if (stored) setSavedReports(JSON.parse(stored));
     }
  }, []);

  const saveToHistory = (analysisPayload: ProjectAnalysis, generatedReport: string) => {
      const historyItem: SavedReport = { 
          id: Date.now(), 
          name: analysisPayload.projectName, 
          date: new Date().toLocaleDateString(), 
          analysis: analysisPayload, 
          reportText: generatedReport 
      };
      setSavedReports(prev => {
          const next = [historyItem, ...prev].slice(0, 10);
          localStorage.setItem('autoreport_history', JSON.stringify(next));
          return next;
      });
  };

  const loadFromHistory = (item: SavedReport) => {
      setAnalysis(item.analysis);
      setReportText(item.reportText);
      setShowHistory(false);
  };

  const deleteFromHistory = (id: number, e: React.MouseEvent) => {
      e.stopPropagation();
      setSavedReports(prev => {
          const next = prev.filter(r => r.id !== id);
          localStorage.setItem('autoreport_history', JSON.stringify(next));
          return next;
      });
  };

  const clearHistory = () => {
      if (confirm('Are you sure you want to delete all saved reports? This cannot be undone.')) {
          setSavedReports([]);
          localStorage.removeItem('autoreport_history');
      }
  };

  const handleGenerateReport = async (data: ReportGenerationRequest) => {
    try {
      setReportText(""); // Prep for stream
      setIsGeneratingStream(true);
      const generateData = { ...data, targetModelId: selectedModel };
      
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generateData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      if (!response.body) throw new Error("No body");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let fullText = "";
      while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setReportText(prev => (prev || "") + chunk);
      }
      
      // Auto-save when stream completes
      saveToHistory(data, fullText);
    } catch (error) {
           console.error(error);
           alert('Error generating report. Ensure your API key is correctly configured.');
           setReportText(null);
    } finally {
        setIsGeneratingStream(false);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setReportText(null);
  }

  return (
    <main className="min-h-screen bg-transparent text-slate-50 font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      {/* Background Gradient Orbs */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <motion.div 
            animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
                rotate: [0, 90, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/40 blur-[150px]" 
        />
        <motion.div 
            animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
                rotate: [0, -90, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-900/30 blur-[150px]" 
        />
        <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] rounded-full bg-emerald-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 lg:py-24">
        {/* Floating Library Button */}
        <div className="absolute top-4 right-4 z-50">
             <button 
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur border border-slate-700 text-slate-300 rounded-full hover:text-white transition"
             >
                <History className="w-4 h-4" />
                <span className="text-sm font-medium">Library ({savedReports.length})</span>
             </button>
             
             {showHistory && (
                <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 overflow-hidden origin-top-right animate-in fade-in zoom-in duration-200">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h4 className="text-slate-200 font-semibold flex items-center gap-2">
                           <History className="w-4 h-4 text-indigo-400" /> Past Reports
                        </h4>
                        {savedReports.length > 0 && (
                            <button onClick={clearHistory} className="text-xs text-rose-400 hover:text-rose-300 transition font-medium">Clear All</button>
                        )}
                    </div>
                    
                    {savedReports.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-sm">
                           No saved reports yet.<br/>Generate one to see it here!
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                            {savedReports.map(item => (
                                <div key={item.id} className="group relative w-full text-left bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl transition flex items-stretch overflow-hidden">
                                   <button
                                       onClick={() => loadFromHistory(item)}
                                       className="flex-1 p-3 flex items-center justify-between"
                                   >
                                       <div className="text-left">
                                          <p className="text-sm text-slate-200 font-medium truncate w-48 sm:w-56" title={item.name}>{item.name}</p>
                                          <p className="text-xs text-slate-500 mt-0.5">{item.date}</p>
                                       </div>
                                   </button>
                                   <button 
                                      onClick={(e) => deleteFromHistory(item.id, e)}
                                      className="px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border-l border-slate-700/50 flex items-center justify-center transition opacity-0 group-hover:opacity-100"
                                      title="Delete"
                                   >
                                      <Trash2 className="w-4 h-4" />
                                   </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
             )}
        </div>

        {/* Header Section */}
        <header className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 text-sm font-medium mb-6 shadow-[0_0_30px_-5px_rgba(99,102,241,0.4)] backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>Dynamic Edition Generator</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-slate-200 to-indigo-400"
          >
            AutoReport <span className="text-fuchsia-400">AI</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-slate-400 font-light"
          >
             Upload your raw codebase and instantly synthesize structured academic intelligence.
          </motion.p>
        </header>

        {/* Main Content Areas */}
        <AnimatePresence mode="wait">
          {!analysis && !reportText && (
             <UploadZone 
               key="upload" 
               onAnalysisComplete={setAnalysis} 
               selectedModel={selectedModel}
               onModelChange={setSelectedModel}
             />
          )}

          {analysis && reportText === null && (
            <AnalysisDashboard 
               key="dashboard"
               analysis={analysis} 
               onGenerateReport={handleGenerateReport as unknown as (modifiedAnalysis: ProjectAnalysis) => void} 
               selectedModel={selectedModel}
            />
          )}

          {reportText !== null && (
            <ReportPreview 
              key="report"
              report={reportText} 
              onReset={handleReset}
              isGenerating={isGeneratingStream}
            />
          )}
        </AnimatePresence>

        {/* Footer info */}
         <div className="max-w-xl mx-auto mt-24 text-center opacity-60">
             <div className="flex justify-center mb-2">
                 <BrainCircuit className="w-6 h-6 text-slate-500" />
             </div>
             <p className="text-xs text-slate-500 font-medium">BCA SYNPOSIS GENERATOR • STATIC CODE ANALYZER</p>
         </div>
      </div>
    </main>
  );
}
