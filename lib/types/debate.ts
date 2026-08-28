import { AgentToneColor } from './agent';

export type DebateStatus = 'not_started' | 'in_progress' | 'concluded' | 'failed';

export interface DebateMessage {
  id: string;
  roundNumber: number;
  agentId: string;
  agentName: string;
  agentRole: string;
  tone: AgentToneColor;
  text: string;
  referencedEvidenceId?: string;
  referencedEvidenceLabel?: string; // e.g. "Evidence #04 referenced"
  isConsensus?: boolean;
  timestamp: string;
}

export interface OpinionRevision {
  id: string;
  agentId: string;
  agentName: string;
  previousScore: number;
  revisedScore: number;
  reason: string;
  roundNumber: number;
}

export interface DebateConsensus {
  agreementConfidence: number; // e.g. 87%
  verdictRecommendation: string; // e.g. "Advance Maya, with a final interview focused on team scaling"
  summary: string;
  caveat?: string;
  unresolvedDisagreement?: string;
  totalRounds: number;
  participatingAgentsCount: number;
  evidenceReferencesCount: number;
}

export interface DebateSession {
  id: string;
  candidateId: string;
  roomId: string;
  status: DebateStatus;
  currentRound: number;
  maxRounds: number;
  messages: DebateMessage[];
  revisions: OpinionRevision[];
  consensus?: DebateConsensus;
  createdAt: string;
  concludedAt?: string;
}

export interface RunDebateInput {
  candidateId: string;
  roomId: string;
  maxRounds?: number;
}
