export type DecisionVerdict = 'advance' | 'hold' | 'reject';

export interface CandidateDecision {
  id: string;
  candidateId: string;
  roomId: string;
  verdict: DecisionVerdict;
  verdictTitle: string; // e.g. "Advance to final interview"
  finalScore: number;
  overallConfidence: number; // e.g. 87%
  agentConsensusSummary: string; // e.g. "3 agree · 1 caveat"
  unresolvedQuestion: string; // e.g. "Team scaling evidence"
  rationale: string;
  strengths: string[];
  keyEvidence: string[];
  concerns: string[];
  recommendedFocusAreas: string[];
  decidedAt: string;
}

export interface CandidateComparisonItem {
  candidateId: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  score: number;
  confidence: number;
  isLeadingSignal: boolean;
  agentScores: {
    technical: number;
    culture: number;
    manager: number;
    skeptic: number;
  };
  primaryStrength: string;
  primaryConcern: string;
}

export interface RoomComparativeAnalysis {
  roomId: string;
  roleTitle: string;
  candidates: CandidateComparisonItem[];
  decisionLensSummary: string;
  generatedAt: string;
}

export interface RoomRecommendation {
  id: string;
  roomId: string;
  roleTitle: string;
  location: string;
  topCandidateId: string;
  topCandidateName: string;
  topCandidateRole: string;
  topCandidateInitials: string;
  fitScore: number;
  fitLevel: string; // e.g. "Strong fit"
  decisionConfidence: number; // e.g. 87%
  whyWinner: string;
  tradeOffs: string;
  generatedAt: string;
}
