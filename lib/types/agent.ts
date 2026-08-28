export type AgentId = 'atlas' | 'sage' | 'vector' | 'quill' | string;
export type AgentRoleName = 'Technical' | 'HR / Culture' | 'Hiring Manager' | 'Skeptic' | string;
export type AgentToneColor = 'indigo' | 'violet' | 'blue' | 'coral';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface AgentPersona {
  id: AgentId;
  name: string;
  role: AgentRoleName;
  color: AgentToneColor;
  description: string;
  focusAreas: string[];
}

export interface AgentEvaluation {
  id: string;
  candidateId: string;
  roomId: string;
  agentId: AgentId;
  agentName: string;
  agentRole: AgentRoleName;
  agentColor: AgentToneColor;
  score: number; // 0 to 100
  confidence: ConfidenceLevel;
  reasoning: string;
  strengths: string[];
  concerns: string[];
  referencedEvidenceIds: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  evaluatedAt: string;
}

export interface AgentPanelSummary {
  candidateId: string;
  evaluations: AgentEvaluation[];
  averageScore: number;
  scoreSpread: number;
  consensusConfidence: number; // e.g. 87%
  unresolvedCaveat?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface RunAgentEvaluationsInput {
  candidateId: string;
  roomId: string;
  agentIds?: AgentId[];
}
