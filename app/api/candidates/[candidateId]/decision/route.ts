import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/mock-db';
import { ApiResponse, CandidateDecision } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const { candidateId } = await params;
    const decision = await db.getDecision(candidateId);

    if (!decision) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Decision for candidate '${candidateId}' was not found.`,
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<CandidateDecision> = {
      success: true,
      data: decision,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch candidate decision',
        details: error instanceof Error ? error.message : String(error),
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const { candidateId } = await params;
    const candidate = await db.getCandidateById(candidateId);

    if (!candidate) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Candidate with ID '${candidateId}' was not found.`,
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    let decision = await db.getDecision(candidateId);
    if (!decision) {
      decision = {
        id: `decision-${Date.now()}`,
        candidateId,
        roomId: candidate.roomId,
        verdict: 'advance',
        verdictTitle: 'Advance to final interview',
        finalScore: candidate.score || 88,
        overallConfidence: 85,
        agentConsensusSummary: '3 agree · 1 caveat',
        unresolvedQuestion: candidate.concern || 'Team scaling evidence',
        rationale: candidate.summary || 'Strong candidate performance across evaluated criteria.',
        strengths: candidate.strengths.length ? candidate.strengths : ['Technical competency'],
        keyEvidence: ['Document evaluation verified'],
        concerns: [candidate.concern || 'Validate team leadership in final round'],
        recommendedFocusAreas: ['Leadership scope', 'Production scaling'],
        decidedAt: new Date().toISOString(),
      };

      await db.saveDecision(decision);
    }

    const response: ApiResponse<CandidateDecision> = {
      success: true,
      data: decision,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process candidate decision',
        details: error instanceof Error ? error.message : String(error),
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
