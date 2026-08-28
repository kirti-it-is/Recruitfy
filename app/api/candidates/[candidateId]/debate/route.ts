import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/mock-db';
import { ApiResponse, DebateSession, RunDebateInput } from '@/lib/types';
import { runEvidenceDebate } from '@/lib/server/gemini/debate';

export const maxDuration = 120;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const { candidateId } = await params;
    const debate = await db.getDebateSession(candidateId);

    if (!debate) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Debate session for candidate '${candidateId}' was not found.`,
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<DebateSession> = {
      success: true,
      data: debate,
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
        message: 'Failed to fetch debate session',
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
    const body = (await req.json().catch(() => ({}))) as Partial<RunDebateInput>;

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

    const evaluations = await db.getAgentEvaluations(candidateId);
    const completed = evaluations.filter((evaluation) => evaluation.status === 'completed');
    const requiredAgents = new Set(['atlas', 'sage', 'vector', 'quill']);
    const completedAgentIds = new Set(completed.map((evaluation) => String(evaluation.agentId)));
    if (completed.length !== 4 || completedAgentIds.size !== 4 || [...requiredAgents].some((agentId) => !completedAgentIds.has(agentId))) {
      return NextResponse.json({ success: false, error: { code: 'EVALUATIONS_INCOMPLETE', message: 'Debate can start only after Atlas, Sage, Vector, and Quill have completed independent evaluations.' } } satisfies ApiResponse, { status: 409 });
    }
    const analysis = await db.getAnalysisByCandidateId(candidateId);
    const debate = await runEvidenceDebate({ candidateId, roomId: candidate.roomId, candidateName: candidate.name, evaluations: completed, evidencePoints: analysis?.evidencePoints || [], maxRounds: body.maxRounds });
    await db.saveDebateSession(debate);

    const response: ApiResponse<DebateSession> = {
      success: true,
      data: debate,
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
        message: 'Failed to process debate session',
        details: error instanceof Error ? error.message : String(error),
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
