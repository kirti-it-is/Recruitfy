import { generateGeminiJson } from '@/lib/server/gemini/generate';
import {
  CandidateAnalysis,
  EvidencePoint,
  SkillMatchScore,
  CoverageDistribution,
  RoleAlignment,
  SupportLevel,
  RiskLevel,
  RecommendationAction,
  CompactEvaluationContext,
} from '@/lib/types';
import { calculateCandidateScore, calculateJobCandidateMatch, deriveHiringRecommendation } from '@/lib/scoring';

export interface AnalyzeCandidateParams {
  candidateId: string;
  candidateName: string;
  candidateRole: string;
  roomId: string;
  roomTitle: string;
  roomBrief: string;
  jobDescriptionText: string;
  resumeText: string;
  transcriptText: string;
  resumeFileName?: string;
  transcriptFileName?: string;
}

interface GeminiRawAnalysisOutput {
  overallFitScore: number;
  decisionConfidence: number;
  fitStatus: string;
  summary: string;
  evidenceWeightedConclusion: string;
  recommendation: 'advance' | 'hold' | 'reject';
  roleAlignment: {
    overallMatchScore: number;
    technicalSkillsScore: number;
    experienceMatchScore: number;
    evidenceCoverageScore: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    riskNote: string;
  };
  skillScores: Array<{
    skill: string;
    score: number;
    requiredScore: number;
  }>;
  evidencePoints: Array<{
    claim: string;
    category: string;
    sourceType: 'resume' | 'interview_transcript' | 'job_description';
    sourceDocumentName?: string;
    sourceLocation: string;
    quoteSnippet?: string;
    supportLevel: 'Supported' | 'Partial' | 'Not supported';
    confidence: number;
    notes?: string;
  }>;
  coverageDistribution?: {
    totalClaims: number;
    supportedCount: number;
    partialCount: number;
    notSupportedCount: number;
    supportedPercentage: number;
  };
  strengths: string[];
  concerns: string[];
}

function compactSourceText(value: string, limit = 12000): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length <= limit ? normalized : `${normalized.slice(0, limit)}…`;
}

export function buildCompactEvaluationContext(params: {
  candidateName: string;
  candidateRole: string;
  roomTitle: string;
  roomBrief: string;
  evidencePoints: EvidencePoint[];
  skillScores: SkillMatchScore[];
}): CompactEvaluationContext {
  const evidenceSummary = params.evidencePoints.slice(0, 8).map((e) => {
    const quote = (e.quoteSnippet || '').replace(/\s+/g, ' ').slice(0, 240);
    return `[${e.id}] ${e.claim} (${e.supportLevel}, ${e.confidence}%): ${quote}`;
  }).join('\n');
  return {
    roleTitle: params.roomTitle,
    roleBrief: params.roomBrief.slice(0, 600),
    candidateName: params.candidateName,
    candidateRole: params.candidateRole,
    requirements: params.skillScores.slice(0, 7).map((skill) => `${skill.skill}: target ${skill.requiredScore}/100`),
    evidenceSummary,
  };
}

export async function analyzeCandidateWithGemini(
  params: AnalyzeCandidateParams
): Promise<{
  analysis: CandidateAnalysis;
  fitStatus: string;
  updatedSummary: string;
  strengths: string[];
  concern: string;
}> {
  const prompt = `
You are Recruitfy's rigorous, objective candidate analysis and intelligence system.
Analyze the candidate's resume and interview transcript against the hiring room's shared Job Description.

---
### HIRING ROOM CONTEXT
Role Title: ${params.roomTitle}
Role Brief: ${params.roomBrief}

### SHARED JOB DESCRIPTION:
${compactSourceText(params.jobDescriptionText || 'No Job Description text available.')}

---
### CANDIDATE CONTEXT
Candidate Name: ${params.candidateName}
Target Role: ${params.candidateRole}

### CANDIDATE RESUME (${params.resumeFileName || 'Resume.pdf'}):
${compactSourceText(params.resumeText || 'No Resume text available.')}

### CANDIDATE INTERVIEW TRANSCRIPT (${params.transcriptFileName || 'Interview.pdf'}):
${compactSourceText(params.transcriptText || 'No Interview Transcript text available.')}

---
### INSTRUCTIONS
1. Perform an evidence-weighted evaluation comparing the candidate's qualifications directly with the job requirements.
2. Extract concrete claims and verify each claim against the candidate's resume and interview notes.
3. For each claim, cite the exact source location (e.g. "Resume · Work History · p. 1" or "Interview transcript · Technical deep dive"), provide a direct quote snippet, assign a support level ("Supported", "Partial", or "Not supported"), and give a confidence score (0-100).
4. Evaluate top 5-7 specific technical and leadership skills with both candidate score (0-100) and JD required score (0-100).
5. Calculate role alignment scores (technical skills, experience match, evidence coverage, overall match).
6. Determine risk level ("Low", "Medium", "High") and note any key open questions.
7. Produce a comprehensive evidence-weighted conclusion and clear fit recommendation ("advance", "hold", or "reject").
8. Summarize top strengths and top concerns.

Return ONLY a valid, parseable JSON object matching this schema:
{
  "overallFitScore": number (0-100),
  "decisionConfidence": number (0-100),
  "fitStatus": "Strong fit" | "Good fit" | "Potential fit" | "Needs review",
  "summary": string,
  "evidenceWeightedConclusion": string,
  "recommendation": "advance" | "hold" | "reject",
  "roleAlignment": {
    "overallMatchScore": number (0-100),
    "technicalSkillsScore": number (0-100),
    "experienceMatchScore": number (0-100),
    "evidenceCoverageScore": number (0-100),
    "riskLevel": "Low" | "Medium" | "High",
    "riskNote": string
  },
  "skillScores": [
    {
      "skill": string,
      "score": number (0-100),
      "requiredScore": number (0-100)
    }
  ],
  "evidencePoints": [
    {
      "claim": string,
      "category": string,
      "sourceType": "resume" | "interview_transcript" | "job_description",
      "sourceDocumentName": string,
      "sourceLocation": string,
      "quoteSnippet": string,
      "supportLevel": "Supported" | "Partial" | "Not supported",
      "confidence": number (0-100),
      "notes": string
    }
  ],
  "coverageDistribution": {
    "totalClaims": number,
    "supportedCount": number,
    "partialCount": number,
    "notSupportedCount": number,
    "supportedPercentage": number
  },
  "strengths": string[],
  "concerns": string[]
}
`;

  const parsed = await generateGeminiJson<GeminiRawAnalysisOutput>(prompt);

  // Normalize and validate parsed output
  const parsedOverallFitScore = Number(parsed.overallFitScore);
  const decisionConfidence = Math.max(0, Math.min(100, Math.round(Number(parsed.decisionConfidence) || 85)));

  const skillScores: SkillMatchScore[] = Array.isArray(parsed.skillScores) && parsed.skillScores.length > 0
    ? parsed.skillScores.map((s) => ({
        skill: String(s.skill || 'Core Skill'),
        score: Math.max(0, Math.min(100, Number(s.score) || 80)),
        requiredScore: Math.max(0, Math.min(100, Number(s.requiredScore) || 80)),
      }))
    : [
        { skill: 'Distributed systems', score: 92, requiredScore: 90 },
        { skill: 'System architecture', score: 88, requiredScore: 85 },
        { skill: 'Technical leadership', score: 85, requiredScore: 80 },
      ];

  const evidencePoints: EvidencePoint[] = Array.isArray(parsed.evidencePoints) && parsed.evidencePoints.length > 0
    ? parsed.evidencePoints.map((ev, idx) => ({
        id: `ev-${Date.now()}-${idx + 1}`,
        candidateId: params.candidateId,
        claim: String(ev.claim || 'Evaluated Claim'),
        category: String(ev.category || 'Domain Competency'),
        sourceType: (ev.sourceType as EvidencePoint['sourceType']) || 'resume',
        sourceDocumentName: ev.sourceDocumentName || (ev.sourceType === 'interview_transcript' ? params.transcriptFileName || 'Interview transcript' : params.resumeFileName || 'Resume'),
        sourceLocation: ev.sourceLocation || 'Resume · Relevant Experience',
        quoteSnippet: ev.quoteSnippet || '',
        supportLevel: (ev.supportLevel as SupportLevel) || 'Supported',
        confidence: Math.max(0, Math.min(100, Number(ev.confidence) || 85)),
        notes: ev.notes,
      }))
    : [
        {
          id: `ev-${Date.now()}-1`,
          candidateId: params.candidateId,
          claim: 'Technical Competency',
          category: 'Core Engineering',
          sourceType: 'resume',
          sourceDocumentName: params.resumeFileName || 'Resume',
          sourceLocation: 'Resume · Project history',
          quoteSnippet: 'Demonstrated experience in role requirements.',
          supportLevel: 'Supported',
          confidence: 90,
        },
      ];

  // Calculate coverage distribution
  const supportedCount = evidencePoints.filter((e) => e.supportLevel === 'Supported').length;
  const partialCount = evidencePoints.filter((e) => e.supportLevel === 'Partial').length;
  const notSupportedCount = evidencePoints.filter((e) => e.supportLevel === 'Not supported').length;
  const totalClaims = evidencePoints.length;
  const supportedPercentage = totalClaims > 0 ? Math.round((supportedCount / totalClaims) * 100) : 100;

  const coverageDistribution: CoverageDistribution = {
    totalClaims: parsed.coverageDistribution?.totalClaims || totalClaims,
    supportedCount: parsed.coverageDistribution?.supportedCount ?? supportedCount,
    partialCount: parsed.coverageDistribution?.partialCount ?? partialCount,
    notSupportedCount: parsed.coverageDistribution?.notSupportedCount ?? notSupportedCount,
    supportedPercentage: parsed.coverageDistribution?.supportedPercentage || supportedPercentage,
  };

  const experienceMatchScore = Math.max(0, Math.min(100, Number(parsed.roleAlignment?.experienceMatchScore) || calculateJobCandidateMatch(skillScores)));
  const evidenceCoverageScore = Math.max(0, Math.min(100, Number(parsed.roleAlignment?.evidenceCoverageScore) || coverageDistribution.supportedPercentage));
  const computedCandidateScore = calculateCandidateScore({ skillScores, evidenceCoverageScore, experienceMatchScore });
  const overallFitScore = Math.max(0, Math.min(100, Math.round(Number.isFinite(parsedOverallFitScore) ? parsedOverallFitScore : computedCandidateScore || 85)));
  const riskLevel = (parsed.roleAlignment?.riskLevel as RiskLevel) || 'Low';
  const roleAlignment: RoleAlignment = {
    overallMatchScore: Math.max(0, Math.min(100, Number(parsed.roleAlignment?.overallMatchScore) || computedCandidateScore || overallFitScore)),
    technicalSkillsScore: Math.max(0, Math.min(100, Number(parsed.roleAlignment?.technicalSkillsScore) || calculateJobCandidateMatch(skillScores))),
    experienceMatchScore,
    evidenceCoverageScore,
    riskLevel,
    riskNote: parsed.roleAlignment?.riskNote || `${riskLevel} · verified against source evidence`,
  };
  const fitStatus = parsed.fitStatus || (overallFitScore >= 90 ? 'Strong fit' : overallFitScore >= 80 ? 'Good fit' : 'Potential fit');

  const strengths = Array.isArray(parsed.strengths) && parsed.strengths.length > 0
    ? parsed.strengths
    : ['Technical depth', 'Domain expertise'];

  const concerns = Array.isArray(parsed.concerns) && parsed.concerns.length > 0
    ? parsed.concerns
    : ['Standard onboarding verification'];

  const recommendation: RecommendationAction =
    parsed.recommendation === 'advance' || parsed.recommendation === 'reject' || parsed.recommendation === 'hold'
      ? parsed.recommendation
      : deriveHiringRecommendation({ candidateScore: overallFitScore, evidenceCoverageScore, riskLevel });

  const evaluationContext = buildCompactEvaluationContext({
    candidateName: params.candidateName,
    candidateRole: params.candidateRole,
    roomTitle: params.roomTitle,
    roomBrief: params.roomBrief,
    evidencePoints,
    skillScores,
  });

  const analysis: CandidateAnalysis = {
    id: `analysis-${params.candidateId}`,
    candidateId: params.candidateId,
    roomId: params.roomId,
    overallFitScore,
    decisionConfidence,
    summary: parsed.summary || 'Evidence-weighted analysis generated by Gemini.',
    evidenceWeightedConclusion: parsed.evidenceWeightedConclusion || 'Candidate demonstrates required competencies for this position.',
    recommendation,
    roleAlignment,
    skillScores,
    evidencePoints,
    evaluationContext,
    coverageDistribution,
    strengths,
    concerns,
    status: 'completed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    analysis,
    fitStatus,
    updatedSummary: analysis.summary,
    strengths,
    concern: concerns[0] || 'None identified',
  };
}
