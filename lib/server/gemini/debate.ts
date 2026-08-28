import { generateGeminiJson } from '@/lib/server/gemini/generate';
import { AgentEvaluation, DebateSession, EvidencePoint } from '@/lib/types';

interface DebateOutput {
  messages: Array<{
    roundNumber: number;
    agentId: string;
    text: string;
    referencedEvidenceId?: string;
  }>;
  revisions: Array<{
    agentId: string;
    previousScore: number;
    revisedScore: number;
    reason: string;
    roundNumber: number;
  }>;
  consensus: {
    agreementConfidence: number;
    verdictRecommendation: string;
    summary: string;
    caveat?: string;
    unresolvedDisagreement?: string;
  };
}

const agentDetails = {
  atlas: { name: 'Atlas', role: 'Technical', tone: 'indigo' },
  sage: { name: 'Sage', role: 'HR / Culture', tone: 'violet' },
  vector: { name: 'Vector', role: 'Hiring Manager', tone: 'blue' },
  quill: { name: 'Quill', role: 'Skeptic', tone: 'coral' },
} as const;

export async function runEvidenceDebate(params: {
  candidateId: string;
  roomId: string;
  candidateName: string;
  evaluations: AgentEvaluation[];
  evidencePoints: EvidencePoint[];
  maxRounds?: number;
}): Promise<DebateSession> {
  const validIds = new Set(params.evidencePoints.map((e) => e.id));
  const evaluationText = params.evaluations.map((e) => `Agent: ${e.agentName} (${e.agentRole})\nScore: ${e.score}; confidence: ${e.confidence}\nReasoning: ${e.reasoning.slice(0, 500)}\nStrengths: ${e.strengths.slice(0, 3).join('; ')}\nConcerns: ${e.concerns.slice(0, 3).join('; ')}\nEvidence IDs: ${e.referencedEvidenceIds.join(', ') || 'none'}`).join('\n\n');
  const evidenceText = params.evidencePoints.slice(0, 8).map((e) => `${e.id}: ${e.claim.slice(0, 180)} | ${(e.quoteSnippet || '').replace(/\s+/g, ' ').slice(0, 240)} | ${e.supportLevel}`).join('\n');
  const maxRounds = Math.max(1, Math.min(3, params.maxRounds || 3));
  const prompt = `You are facilitating an evidence-based hiring panel debate for ${params.candidateName}. All four independent submissions are now complete, so agents may see and challenge one another. Do not add facts beyond the evidence list. Create concise challenges, responses or score revisions, and a final consensus. Use only the supplied agent IDs and evidence IDs.\n\nEVALUATIONS:\n${evaluationText}\n\nEVIDENCE:\n${evidenceText || 'No evidence points.'}\n\nReturn JSON only: {"messages":[{"roundNumber":number,"agentId":"atlas|sage|vector|quill|consensus","text":string,"referencedEvidenceId":string?}],"revisions":[{"agentId":"atlas|sage|vector|quill","previousScore":number,"revisedScore":number,"reason":string,"roundNumber":number}],"consensus":{"agreementConfidence":number,"verdictRecommendation":string,"summary":string,"caveat":string?,"unresolvedDisagreement":string?}}. Include at least one challenge, one response/revision when warranted, and one consensus message. Keep rounds at or below ${maxRounds}.`;
  const output = await generateGeminiJson<DebateOutput>(prompt);
  const now = new Date().toISOString();
  const messages = (Array.isArray(output.messages) ? output.messages : []).slice(0, 12).map((message, index) => {
    const detail: { name: string; role: string; tone: 'indigo' | 'violet' | 'blue' | 'coral' } = agentDetails[message.agentId as keyof typeof agentDetails] || { name: 'Consensus', role: 'Synthesis', tone: 'indigo' };
    const evidenceId = validIds.has(String(message.referencedEvidenceId)) ? String(message.referencedEvidenceId) : undefined;
    return { id: `debate-${params.candidateId}-${index}`, roundNumber: Math.max(1, Math.min(maxRounds, Number(message.roundNumber) || 1)), agentId: message.agentId === 'consensus' ? 'consensus' : detail.name.toLowerCase(), agentName: detail.name, agentRole: detail.role, tone: detail.tone, text: String(message.text || '').trim(), ...(evidenceId ? { referencedEvidenceId: evidenceId, referencedEvidenceLabel: `Evidence ${evidenceId} referenced` } : {}), isConsensus: message.agentId === 'consensus', timestamp: now };
  }).filter((message) => message.text);
  const consensus = output.consensus || { agreementConfidence: 0, verdictRecommendation: 'No consensus generated.', summary: 'The panel could not produce a consensus.' };
  if (!messages.some((m) => m.isConsensus)) messages.push({ id: `debate-${params.candidateId}-consensus`, roundNumber: maxRounds, agentId: 'consensus', agentName: 'Consensus', agentRole: 'Synthesis', tone: 'indigo', text: consensus.verdictRecommendation, isConsensus: true, timestamp: now });
  return { id: `debate-${params.candidateId}-${Date.now()}`, candidateId: params.candidateId, roomId: params.roomId, status: 'concluded', currentRound: maxRounds, maxRounds, messages, revisions: (Array.isArray(output.revisions) ? output.revisions : []).slice(0, 4).filter((r) => agentDetails[r.agentId as keyof typeof agentDetails]).map((r, index) => ({ id: `revision-${params.candidateId}-${index}`, agentId: r.agentId, agentName: agentDetails[r.agentId as keyof typeof agentDetails].name, previousScore: Math.max(0, Math.min(100, Number(r.previousScore) || 0)), revisedScore: Math.max(0, Math.min(100, Number(r.revisedScore) || 0)), reason: String(r.reason || ''), roundNumber: Math.max(1, Math.min(maxRounds, Number(r.roundNumber) || maxRounds)) })), consensus: { agreementConfidence: Math.max(0, Math.min(100, Math.round(Number(consensus.agreementConfidence) || 0))), verdictRecommendation: String(consensus.verdictRecommendation || ''), summary: String(consensus.summary || ''), caveat: consensus.caveat ? String(consensus.caveat) : undefined, unresolvedDisagreement: consensus.unresolvedDisagreement ? String(consensus.unresolvedDisagreement) : undefined, totalRounds: maxRounds, participatingAgentsCount: params.evaluations.length, evidenceReferencesCount: new Set(messages.map((m) => m.referencedEvidenceId).filter(Boolean)).size }, createdAt: now, concludedAt: now };
}
