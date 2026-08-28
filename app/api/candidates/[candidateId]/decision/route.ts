import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/mock-db';
import { ApiResponse, CandidateDecision } from '@/lib/types';
import { generateCandidateDecision } from '@/lib/server/gemini/decision';

export const maxDuration = 120;

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

    const debate = await db.getDebateSession(candidateId);
    if (!debate || debate.status !== 'concluded' || !debate.consensus) {
      return NextResponse.json({ success: false, error: { code: 'DEBATE_REQUIRED', message: 'A concluded evidence-based debate is required before generating a decision.' } } satisfies ApiResponse, { status: 409 });
    }
    const analysis = await db.getAnalysisByCandidateId(candidateId);
    const decision = await generateCandidateDecision({ candidateId, roomId: candidate.roomId, candidateName: candidate.name, debate, evidencePoints: analysis?.evidencePoints || [] });
    await db.saveDecision(decision);

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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ candidateId: string }> }) {
  try {
    const { candidateId } = await params;
    const body = await req.json();
    if (!['advance', 'hold', 'reject'].includes(body.humanDecision)) return NextResponse.json({ success: false, error: { code: 'INVALID_DECISION', message: 'humanDecision must be advance, hold, or reject.' } } satisfies ApiResponse, { status: 400 });
    const decision = await db.getDecision(candidateId);
    if (!decision) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Generate the AI decision before recording a human decision.' } } satisfies ApiResponse, { status: 404 });
    const saved = await db.saveDecision({ ...decision, humanDecision: body.humanDecision, decidedAt: new Date().toISOString() });
    return NextResponse.json({ success: true, data: saved, meta: { timestamp: new Date().toISOString() } } satisfies ApiResponse<CandidateDecision>);
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Failed to save human decision' } } satisfies ApiResponse, { status: 500 });
  }
}
