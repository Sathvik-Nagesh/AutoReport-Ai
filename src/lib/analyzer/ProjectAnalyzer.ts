import JSZip from 'jszip';
import { ProjectAnalysis, ProjectAnalysisRequest } from '../types';
import { IntelligenceBuilder } from './IntelligenceBuilder';
import { AI_CONFIG } from '../../config/ai';

export class ProjectAnalyzer {
  static async analyzeTarget(file: File, selectedModelId: string = AI_CONFIG.defaultModelId): Promise<ProjectAnalysis> {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(file);

    const filePaths: string[] = [];
    let packageJsonContent = '';
    let readmeContent = '';
    let coreSnippets = '';

    const priorityExtensions = ['.ts', '.tsx', '.schema.prisma', 'schema.prisma', '.js', '.jsx', '.py', '.java', '.go'];
    let snippetCount = 0;

    // Extract file paths, package.json, and README.md
    for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
      if (!zipEntry.dir) {
        filePaths.push(relativePath);
        
        const pathLower = relativePath.toLowerCase();

        // Assuming package.json is in the root or close to it
        if (pathLower.endsWith('package.json') && !pathLower.includes('node_modules')) {
            if (!packageJsonContent) { 
                packageJsonContent = await zipEntry.async('text');
            }
        }

        // Search for README
        if ((pathLower.endsWith('readme.md') || pathLower.endsWith('readme.txt')) && !pathLower.includes('node_modules')) {
             if (!readmeContent) {
                  readmeContent = await zipEntry.async('text');
             }
        }

        // Deep Read: Extract core application files to fuel AI generation deeply
        if (!pathLower.includes('node_modules') && !pathLower.includes('.next') && !pathLower.includes('dist') && !pathLower.includes('build')) {
            const isPriority = priorityExtensions.some(ext => pathLower.endsWith(ext));
            // We want to avoid capturing huge bundles, but grab components/schema/routes to feed context
            if (isPriority && snippetCount < 10) {
               const rawCode = await zipEntry.async('text');
               if (rawCode.length < 15000) { // Safety constraint to not blow out models
                   coreSnippets += `\n\n--- FILE: ${relativePath} ---\n${rawCode.substring(0, 3000)}`;
                   snippetCount++;
               }
            }
        }
      }
    }

    const projectName = file.name.replace(/\.[^/.]+$/, "");

    // Generate a File Tree Summary
    const treeMap = new Map<string, Set<string>>();
    let fileCount = 0;
    for (const path of filePaths) {
        const parts = path.split('/');
        if (parts[0] === 'node_modules' || parts[0] === '.git' || parts[0] === '.next') continue;
        if (parts.length === 1) continue; 
        
        const topDir = parts[0];
        if (!treeMap.has(topDir)) treeMap.set(topDir, new Set());
        if (parts.length > 2) {
             treeMap.get(topDir)?.add(parts[1]);
        }
        fileCount++;
    }

    let fileTreeSummary = `Total Extracted Files (excluding node_modules/git): ~${fileCount}\n\n`;
    for (const [dir, subDirs] of treeMap.entries()) {
        fileTreeSummary += `- ${dir}/\n`;
        let count = 0;
        for (const sub of subDirs) {
            if (count > 8) { fileTreeSummary += `  - ...\n`; break; }
            fileTreeSummary += `  - ${sub}/\n`;
            count++;
        }
    }
    if (!fileTreeSummary || treeMap.size === 0) {
        fileTreeSummary = "Standard flattened or empty file structure.";
    }

    const analysisRequest: ProjectAnalysisRequest = {
        projectName,
        fileTreeSummary,
        packageJson: packageJsonContent || "{}",
        readme: readmeContent || "No README provided in root directory",
        coreSnippets: coreSnippets || "No core architectural code files extracted.",
        modelId: selectedModelId,
    };

    // Forward to the AI layer for deep structural intelligence and architectural deduction
    return IntelligenceBuilder.enrichAnalysis(analysisRequest);
  }
}
