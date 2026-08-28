import { generateGeminiJson } from '@/lib/server/gemini/generate';
import {
  AgentEvaluation,
  AgentId,
  AgentPersona,
  AgentRoleName,
  AgentToneColor,
  ConfidenceLevel,
  CompactEvaluationContext,
  EvidencePoint,
} from '@/lib/types';

export const INDEPENDENT_AGENTS: AgentPersona[] = [
  {
    id: 'atlas',
    name: 'Atlas',
    role: 'Technical',
    color: 'indigo',
    description:
      'Independent technical evaluator focused on engineering depth, architecture, and skill match to the job description.',
    focusAreas: [
      'Technical skills vs JD requirements',
      'System design and architecture evidence',
      'Hands-on implementation depth',
      'Technical leadership signals',
    ],
  },
  {
    id: 'sage',
    name: 'Sage',
    role: 'HR / Culture',
    color: 'violet',
    description:
      'Independent experience and culture evaluator focused on collaboration, communication, and organizational fit.',
    focusAreas: [
      'Career trajectory and relevant experience',
      'Collaboration and communication',
      'Culture and values alignment',
      'Team influence without relying on other agents',
    ],
  },
  {
    id: 'vector',
    name: 'Vector',
    role: 'Hiring Manager',
    color: 'blue',
    description:
      'Independent hiring-manager evaluator focused on execution, ownership, and whether this person can deliver in the role.',
    focusAreas: [
      'Role readiness and time-to-impact',
      'Ownership and delivery track record',
      'Roadmap and business-context fit',
      'Pragmatic hiring recommendation from a manager lens',
    ],
  },
  {
    id: 'quill',
    name: 'Quill',
    role: 'Skeptic',
    color: 'coral',
    description:
      'Independent skeptic focused on risk, unverified claims, gaps, and reasons not to advance without stronger evidence.',
    focusAreas: [
      'Unsupported or weakly supported claims',
      'Scope inflation and missing corroboration',
      'Role-transition and execution risk',
      'Open questions that should block or caveat a hire',
    ],
  },
];

export interface EvaluateCandidateAgentsParams {
  candidateId: string;
  candidateName: string;
  candidateRole: string;
  roomId: string;
  evaluationContext: CompactEvaluationContext;
  evidencePoints: EvidencePoint[];
  agentIds?: AgentId[];
}

interface GeminiRawAgentOutput {
  score: number;
  confidence: ConfidenceLevel | string;
  reasoning: string;
  strengths: string[];
  concerns: string[];
  referencedEvidenceIds: string[];
}

function formatEvidenceForPrompt(evidencePoints: EvidencePoint[]): string {
  if (!evidencePoints.length) {
    return 'No prior evidence points are available. Base your evaluation only on the JD, resume, and transcript.';
  }

  return evidencePoints.slice(0, 8)
    .map((ev) => {
      return [
        `- id: ${ev.id}`,
        `  claim: ${ev.claim}`,
        `  category: ${ev.category}`,
        `  source: ${ev.sourceLocation}`,
        `  quote: ${(ev.quoteSnippet || '').replace(/\s+/g, ' ').slice(0, 240)}`,
        `  supportLevel: ${ev.supportLevel}`,
        `  confidence: ${ev.confidence}`,
      ].join('\n');
    })
    .join('\n');
}

function normalizeConfidence(value: string | undefined): ConfidenceLevel {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'low') return 'Low';
  if (normalized === 'medium') return 'Medium';
  return 'High';
}

function buildAgentPrompt(agent: AgentPersona, params: EvaluateCandidateAgentsParams): string {
  return `
You are ${agent.name}, Recruitfy's independent ${agent.role} evaluation agent.
${agent.description}

You must evaluate this candidate independently. You cannot see any other agent's scores, reasoning, strengths, concerns, or conclusions. Do not invent or speculate about other agents.

Your focus areas:
${agent.focusAreas.map((area) => `- ${area}`).join('\n')}

---
### COMPACT CANDIDATE CONTEXT
Role: ${params.evaluationContext.roleTitle}
Role brief: ${params.evaluationContext.roleBrief}
Candidate: ${params.evaluationContext.candidateName}, ${params.evaluationContext.candidateRole}
Requirements: ${params.evaluationContext.requirements.join('; ')}
Evidence summary:
${params.evaluationContext.evidenceSummary}

---
### EXISTING EVIDENCE POINTS
Use only these compact evidence points as citations. You may only reference IDs from this list.
${formatEvidenceForPrompt(params.evidencePoints)}

---
### INSTRUCTIONS
1. Score the candidate from your unique ${agent.role} lens only (0-100).
2. Assign confidence as "High", "Medium", or "Low" based on how well the sources support your conclusion.
3. List 2-4 concrete strengths and 1-3 concrete concerns from your lens.
4. Cite referencedEvidenceIds using only IDs from the evidence list above. If none apply, return an empty array.
5. Write concise reasoning (2-4 sentences) grounded only in the compact context and cited evidence.
6. Do not mention other agents (Atlas, Sage, Vector, Quill) or a panel consensus.

Return ONLY a valid, parseable JSON object matching this schema:
{
  "score": number (0-100),
  "confidence": "High" | "Medium" | "Low",
  "reasoning": string,
  "strengths": string[],
  "concerns": string[],
  "referencedEvidenceIds": string[]
}
`;
}

async function evaluateWithSingleAgent(
  agent: AgentPersona,
  params: EvaluateCandidateAgentsParams
): Promise<AgentEvaluation> {
  const validEvidenceIds = new Set(params.evidencePoints.map((ev) => ev.id));
  const parsed = await generateGeminiJson<GeminiRawAgentOutput>(buildAgentPrompt(agent, params));

  const referencedEvidenceIds = Array.isArray(parsed.referencedEvidenceIds)
    ? parsed.referencedEvidenceIds.map(String).filter((id) => validEvidenceIds.has(id))
    : [];

  const strengths =
    Array.isArray(parsed.strengths) && parsed.strengths.length > 0
      ? parsed.strengths.map(String)
      : ['Relevant experience identified'];

  const concerns =
    Array.isArray(parsed.concerns) && parsed.concerns.length > 0
      ? parsed.concerns.map(String)
      : ['Additional verification recommended'];

  return {
    id: `eval-${agent.id}-${params.candidateId}`,
    candidateId: params.candidateId,
    roomId: params.roomId,
    agentId: agent.id,
    agentName: agent.name,
    agentRole: agent.role as AgentRoleName,
    agentColor: agent.color as AgentToneColor,
    score: Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0))),
    confidence: normalizeConfidence(parsed.confidence),
    reasoning:
      String(parsed.reasoning || '').trim() ||
      `${agent.name} completed an independent ${agent.role} evaluation of the available sources.`,
    strengths,
    concerns,
    referencedEvidenceIds,
    status: 'completed',
    evaluatedAt: new Date().toISOString(),
  };
}

export async function evaluateCandidateWithIndependentAgents(
  params: EvaluateCandidateAgentsParams
): Promise<AgentEvaluation[]> {
  const requested = new Set((params.agentIds || []).map((id) => String(id).toLowerCase()));
  const agents =
    requested.size > 0
      ? INDEPENDENT_AGENTS.filter((agent) => requested.has(String(agent.id)))
      : INDEPENDENT_AGENTS;

  if (agents.length === 0) {
    throw new Error('No matching independent agents were requested.');
  }

  // Sequential independent calls: every prompt receives the same compact context, never another agent's output.
  const evaluations: AgentEvaluation[] = [];
  for (const agent of agents) {
    evaluations.push(await evaluateWithSingleAgent(agent, params));
  }
  return evaluations;
}
