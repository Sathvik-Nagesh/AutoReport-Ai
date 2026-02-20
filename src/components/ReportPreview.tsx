'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Copy, FileText, Download, Check, RefreshCw, FileUp } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';

const MermaidRender = ({ code, isGenerating }: { code: string, isGenerating?: boolean }) => {
  const [svg, setSvg] = useState('');
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    // Save expensive mermaid parsing until streaming is done to prevent syntax corruption errors
    if (isGenerating) return;

    mermaid.initialize({ startOnLoad: false, theme: 'default' });
    const renderDiagram = async () => {
      try {
        setHasError(false);
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, code);
        setSvg(svg);
      } catch (err) {
        console.error("Mermaid Render failed", err);
        setHasError(true);
      }
    };
    if (code) {
       renderDiagram();
    }
  }, [code, isGenerating]);

  if (isGenerating || hasError || !svg) {
      return (
          <div className="my-8 p-4 bg-slate-900 border border-slate-700 rounded-xl overflow-x-auto">
              <div className="flex items-center gap-2 mb-3">
                 <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-xs font-medium text-slate-400">
                    {isGenerating ? "Synthesizing Architecture Diagram..." : "Architecture Diagram (Raw Syntax)"}
                 </span>
              </div>
              <pre className="text-emerald-400 font-mono text-sm leading-relaxed">
                  {code}
              </pre>
          </div>
      );
  }

  return (
    <div className="flex justify-center my-8 p-6 bg-white rounded-xl shadow-inner overflow-x-auto text-slate-800 border border-slate-200" dangerouslySetInnerHTML={{ __html: svg }} />
  );
};

export default function ReportPreview({ report, onReset, isGenerating }: { report: string, onReset: () => void, isGenerating?: boolean }) {
  const [content, setContent] = useState(report);
  
  // Keep content synced with incoming stream
  useEffect(() => {
      setContent(report);
  }, [report]);

  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Resume auto-scroll when a new generation starts
  useEffect(() => {
     if (isGenerating) setAutoScroll(true);
  }, [isGenerating]);

  // Handle scrolling to bottom if autoScroll is enabled (using window scroll now)
  useEffect(() => {
     if (isGenerating && autoScroll) {
         window.scrollTo({
             top: document.body.scrollHeight,
             behavior: 'smooth'
         });
     }
  }, [content, isGenerating, autoScroll]);

  useEffect(() => {
     const handleWindowScroll = () => {
        const isAtBottom = document.body.scrollHeight - window.scrollY - window.innerHeight < 100;
        setAutoScroll(isAtBottom);
     };
     window.addEventListener('scroll', handleWindowScroll);
     return () => window.removeEventListener('scroll', handleWindowScroll);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportDocx = async () => {
    setExporting(true);
    try {
        const docChildren: (Paragraph)[] = [];
        const lines = content.split('\n');

        for (const line of lines) {
             if (line.trim() === '') {
                 docChildren.push(new Paragraph({ text: "", spacing: { after: 100 }}));
                 continue;
             }
             if (line.startsWith('# ')) {
                 docChildren.push(new Paragraph({ text: line.replace('# ', ''), heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 }}));
             } else if (line.startsWith('## ')) {
                 docChildren.push(new Paragraph({ text: line.replace('## ', ''), heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 }}));
             } else if (line.startsWith('### ')) {
                 docChildren.push(new Paragraph({ text: line.replace('### ', ''), heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 }}));
             } else if (line.startsWith('- ')) {
                 docChildren.push(new Paragraph({ text: line.replace('- ', ''), bullet: { level: 0 } }));
             } else {
                 // Standard Paragraph
                 docChildren.push(new Paragraph({ children: [new TextRun(line)], spacing: { after: 200 } }));
             }
        }

        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: docChildren,
                },
            ],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, "Project_Report.docx");
    } catch(e) {
        console.error("Export error", e);
        alert("DOCX export failed. Check console.");
    } finally {
        setExporting(false);
    }
  };

  const exportPDF = async () => {
      setExporting(true);
      if (!pdfRef.current) return setExporting(false);
      
      try {
          const html2pdf = (await import('html2pdf.js')).default;
          
          const opt = {
            margin:       0.5,
            filename:     'Architectural_Report.pdf',
            image:        { type: 'jpeg' as const, quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'letter' as const, orientation: 'portrait' as const }
          };

          await html2pdf().set(opt).from(pdfRef.current).save();
      } catch(e) {
          console.error("PDF generation failed:", e);
      } finally {
          setExporting(false);
      }
  };

  return (
    <motion.div
       initial={{ opacity: 0, scale: 0.98 }}
       animate={{ opacity: 1, scale: 1 }}
       className="w-full max-w-5xl mx-auto mt-12 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-900/20"
    >
        {/* Header toolbar */}
        <div className="flex items-center justify-between p-4 px-6 bg-slate-950 border-b border-slate-800">
            <div className="flex items-center gap-3">
                <FileText className="text-emerald-400 w-5 h-5" />
                <h3 className="text-lg font-medium text-slate-200">
                   {isGenerating ? "Synthesizing Synopsis..." : "Generated Synopsis"}
                </h3>
                {isGenerating && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ml-2" />
                )}
            </div>
            <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
                >
                  {isEditing ? 'Preview Mode' : 'Edit Markdown'}
                </button>
                <button 
                  onClick={handleCopy}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition tooltip-trigger relative group"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs opacity-0 group-hover:opacity-100 transition rounded whitespace-nowrap pointer-events-none">Copy text</span>
                </button>
                <button 
                  onClick={exportDocx}
                  disabled={exporting || isGenerating}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" /> DOCX
                </button>
                <button 
                  onClick={exportPDF}
                  disabled={exporting || isGenerating}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-fuchsia-600 hover:bg-fuchsia-500 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileUp className="w-4 h-4" /> PDF
                </button>
                <button 
                  onClick={onReset}
                  className="ml-4 p-2 text-slate-500 hover:text-rose-400 transition tooltip-trigger relative group"
                >
                    <RefreshCw className="w-5 h-5" />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs opacity-0 group-hover:opacity-100 transition rounded whitespace-nowrap pointer-events-none">Analyze New</span>
                </button>
            </div>
        </div>

        <div 
           ref={scrollContainerRef}
           className="p-6 md:p-10 bg-slate-50 group relative rounded-b-3xl"
        >
             {isEditing ? (
                 <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full min-h-[500px] bg-transparent text-slate-900 border-none outline-none font-mono text-sm leading-relaxed resize-y"
                 />
             ) : (
                 <div ref={pdfRef} className="p-4 bg-white text-black min-h-screen">
                     <article className="prose prose-slate prose-lg max-w-none prose-h1:text-indigo-900 prose-h2:text-indigo-800 prose-p:text-slate-800 prose-headings:font-bold font-serif prose-p:leading-relaxed prose-li:text-slate-800">
                        <ReactMarkdown
                           components={{
                               code({inline, className, children, ...props}: React.HTMLProps<HTMLElement> & { inline?: boolean }) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  if (!inline && match && match[1] === 'mermaid') {
                                    return <MermaidRender code={String(children).replace(/\n$/, '')} isGenerating={isGenerating} />;
                                  }
                                  return <code className={className} {...props}>{children}</code>;
                               }
                           }}
                        >
                           {content}
                        </ReactMarkdown>
                     </article>
                 </div>
             )}
        </div>
    </motion.div>
  );
}
