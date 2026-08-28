export type SupportLevel = 'Supported' | 'Partial' | 'Not supported';
export type RiskLevel = 'Low' | 'Medium' | 'High';
export type RecommendationAction = 'advance' | 'hold' | 'reject';

export interface EvidencePoint {
  id: string;
  candidateId: string;
  claim: string;
  category: string; // e.g. "Distributed systems", "Model evaluation", "Leadership"
  sourceType: 'resume' | 'interview_transcript' | 'job_description';
  sourceDocumentId?: string;
  sourceDocumentName: string;
  sourceLocation: string; // e.g. "Resume · Project history · p. 2"
  quoteSnippet?: string;
  supportLevel: SupportLevel;
  confidence: number; // 0 to 100
  notes?: string;
}

export interface SkillMatchScore {
  skill: string;
  score: number; // 0 to 100 (Candidate strength)
  requiredScore: number; // 0 to 100 (JD requirement)
}

export interface RoleAlignment {
  overallMatchScore: number;
  technicalSkillsScore: number;
  experienceMatchScore: number;
  evidenceCoverageScore: number;
  riskLevel: RiskLevel;
  riskNote: string;
}

export interface CoverageDistribution {
  totalClaims: number;
  supportedCount: number;
  partialCount: number;
  notSupportedCount: number;
  supportedPercentage: number;
}

export interface CompactEvaluationContext {
  roleTitle: string;
  roleBrief: string;
  candidateName: string;
  candidateRole: string;
  evidenceSummary: string;
  requirements: string[];
}

export interface CandidateAnalysis {
  id: string;
  candidateId: string;
  roomId: string;
  overallFitScore: number; // 0 to 100
  decisionConfidence: number; // 0 to 100
  summary: string;
  evidenceWeightedConclusion: string;
  recommendation: RecommendationAction;
  roleAlignment: RoleAlignment;
  skillScores: SkillMatchScore[];
  evidencePoints: EvidencePoint[];
  evaluationContext?: CompactEvaluationContext;
  coverageDistribution: CoverageDistribution;
  strengths: string[];
  concerns: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RunAnalysisInput {
  candidateId: string;
  roomId: string;
  forceReanalyze?: boolean;
}
