import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/mock-db';
import { evaluateCandidateWithIndependentAgents } from '@/lib/server/gemini/agents';
import { buildCompactEvaluationContext } from '@/lib/server/gemini/analyzer';
import { AgentEvaluation, ApiResponse, RunAgentEvaluationsInput } from '@/lib/types';

export const maxDuration = 120;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const { candidateId } = await params;
    const evaluations = await db.getAgentEvaluations(candidateId);

    const response: ApiResponse<AgentEvaluation[]> = {
      success: true,
      data: evaluations,
      meta: {
        timestamp: new Date().toISOString(),
        totalCount: evaluations.length,
      },
    };
    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch agent evaluations',
        details: error instanceof Error ? error.message : String(error),
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const { candidateId } = await params;
    const body = (await req.json().catch(() => ({}))) as Partial<RunAgentEvaluationsInput>;

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

    const room = await db.getRoomById(candidate.roomId);
    if (!room) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Hiring room '${candidate.roomId}' was not found.`,
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    const analysis = await db.getAnalysisByCandidateId(candidateId);
    if (!analysis || analysis.status !== 'completed') {
      return NextResponse.json({ success: false, error: { code: 'ANALYSIS_REQUIRED', message: 'Complete the candidate analysis before starting independent agent evaluations.' } } satisfies ApiResponse, { status: 409 });
    }
    const evaluationContext = analysis.evaluationContext || buildCompactEvaluationContext({
      candidateName: candidate.name,
      candidateRole: candidate.role,
      roomTitle: room.title,
      roomBrief: room.brief,
      evidencePoints: analysis.evidencePoints,
      skillScores: analysis.skillScores,
    });
    if (!analysis.evaluationContext) {
      await db.saveAnalysis({ ...analysis, evaluationContext, updatedAt: new Date().toISOString() });
    }

    const evaluations = await evaluateCandidateWithIndependentAgents({
      candidateId: candidate.id,
      candidateName: candidate.name,
      candidateRole: candidate.role,
      roomId: room.id,
      evaluationContext,
      evidencePoints: analysis.evidencePoints,
      agentIds: body.agentIds,
    });

    await db.saveAgentEvaluations(candidateId, evaluations);

    const response: ApiResponse<AgentEvaluation[]> = {
      success: true,
      data: evaluations,
      meta: {
        timestamp: new Date().toISOString(),
        totalCount: evaluations.length,
      },
    };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error during Gemini agent evaluations:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'EVALUATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to evaluate candidate with independent Gemini agents',
        details: error instanceof Error ? error.stack : String(error),
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
