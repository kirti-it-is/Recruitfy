import type { RiskLevel, SkillMatchScore } from '@/lib/types';

export type HiringRecommendation = 'advance' | 'hold' | 'reject';

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
}

export function calculateJobCandidateMatch(skillScores: SkillMatchScore[]): number {
  if (!skillScores.length) return 0;
  const total = skillScores.reduce((sum, skill) => {
    const required = Math.max(1, skill.requiredScore);
    return sum + Math.min(100, (clampScore(skill.score) / required) * 100);
  }, 0);
  return clampScore(total / skillScores.length);
}

export function calculateCandidateScore(input: {
  skillScores: SkillMatchScore[];
  evidenceCoverageScore: number;
  experienceMatchScore: number;
}): number {
  const skillMatch = calculateJobCandidateMatch(input.skillScores);
  if (!skillMatch && !input.evidenceCoverageScore && !input.experienceMatchScore) return 0;
  return clampScore(skillMatch * 0.6 + clampScore(input.evidenceCoverageScore) * 0.2 + clampScore(input.experienceMatchScore) * 0.2);
}

export function deriveHiringRecommendation(input: {
  candidateScore: number;
  evidenceCoverageScore: number;
  riskLevel: RiskLevel;
}): HiringRecommendation {
  if (input.candidateScore < 55 || input.evidenceCoverageScore < 40) return 'reject';
  if (input.candidateScore < 75 || input.evidenceCoverageScore < 60 || input.riskLevel === 'High') return 'hold';
  return 'advance';
}
