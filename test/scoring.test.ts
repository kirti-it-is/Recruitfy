import { describe, expect, it } from 'vitest';
import { calculateCandidateScore, calculateJobCandidateMatch, deriveHiringRecommendation } from '@/lib/scoring';

describe('candidate scoring', () => {
  it('calculates a strong job-candidate match from skill requirements', () => {
    expect(calculateJobCandidateMatch([{ skill: 'ML systems', score: 95, requiredScore: 90 }, { skill: 'Architecture', score: 88, requiredScore: 85 }])).toBe(100);
  });

  it('weights skills, evidence coverage, and experience into a candidate score', () => {
    expect(calculateCandidateScore({ skillScores: [{ skill: 'ML systems', score: 80, requiredScore: 100 }], evidenceCoverageScore: 90, experienceMatchScore: 80 })).toBe(82);
  });

  it('handles missing scoring data safely', () => {
    expect(calculateJobCandidateMatch([])).toBe(0);
    expect(calculateCandidateScore({ skillScores: [], evidenceCoverageScore: 0, experienceMatchScore: 0 })).toBe(0);
  });

  it('derives advance, hold, and reject recommendations from evidence-aware thresholds', () => {
    expect(deriveHiringRecommendation({ candidateScore: 86, evidenceCoverageScore: 82, riskLevel: 'Low' })).toBe('advance');
    expect(deriveHiringRecommendation({ candidateScore: 86, evidenceCoverageScore: 82, riskLevel: 'High' })).toBe('hold');
    expect(deriveHiringRecommendation({ candidateScore: 50, evidenceCoverageScore: 90, riskLevel: 'Low' })).toBe('reject');
  });
});
