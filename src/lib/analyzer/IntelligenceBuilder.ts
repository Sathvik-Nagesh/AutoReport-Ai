import { ProjectAnalysisRequest, ProjectAnalysis } from '../types';

export class IntelligenceBuilder {
  static async enrichAnalysis(analysisRequest: ProjectAnalysisRequest): Promise<ProjectAnalysis> {
    const response = await fetch('/api/analyze-project', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analysisRequest),
    });

    if (!response.ok) {
        const errorTextBytes = await response.text();
        let errorMsg = "Failed to analyze project via AI Engine. Raw Server Output: " + errorTextBytes.substring(0, 100);
        try {
            const errData = JSON.parse(errorTextBytes);
            if (errData.error) errorMsg = errData.error;
        } catch(e) {}
        throw new Error(errorMsg);
    }

    const data = await response.json();
    return data.analysis as ProjectAnalysis;
  }
}
