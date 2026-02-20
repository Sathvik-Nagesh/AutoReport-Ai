export interface DeploymentRecommendation {
  platform: string;
  costEstimate: string;
  reasoning: string;
}

export interface ProjectAnalysis {
  projectName: string;
  projectType: string;
  architecture: string;
  technologies: string[];
  database: string | null;
  modules: string[];
  keyFeatures: string[];
  probableDomain: string;
  fileTreeSummary: string;
  architectureDiagram: string;
  databaseSchema: string[];
  deploymentRecommendations: DeploymentRecommendation[];
}

export interface ReportGenerationSettings {
  verbosity: 'short' | 'medium' | 'long';
  tone: 'formal' | 'conversational';
  universityFormat: 'Bangalore University BCA' | 'VTU' | 'Generic';
}

export interface ProjectAnalysisRequest {
  projectName: string;
  fileTreeSummary: string;
  packageJson: string;
  readme: string;
  coreSnippets: string;
  modelId: string;
}

export interface ReportGenerationRequest extends ProjectAnalysis {
  targetModelId?: string;
  settings: ReportGenerationSettings;
}
