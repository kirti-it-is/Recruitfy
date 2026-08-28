import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/mock-db';
import { ApiResponse, DebateSession, RunDebateInput } from '@/lib/types';

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
    const _body = (await req.json().catch(() => ({}))) as Partial<RunDebateInput>;

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

    let debate = await db.getDebateSession(candidateId);
    if (!debate) {
      debate = {
        id: `debate-${Date.now()}`,
        candidateId,
        roomId: candidate.roomId,
        status: 'concluded',
        currentRound: 3,
        maxRounds: 3,
        messages: [
          {
            id: `msg-${Date.now()}-1`,
            roundNumber: 1,
            agentId: 'atlas',
            agentName: 'Atlas',
            agentRole: 'Technical',
            tone: 'indigo',
            text: `Initial technical evaluation indicates strong fundamentals for ${candidate.name}.`,
            timestamp: new Date().toISOString(),
          },
          {
            id: `msg-${Date.now()}-2`,
            roundNumber: 2,
            agentId: 'quill',
            agentName: 'Quill',
            agentRole: 'Skeptic',
            tone: 'coral',
            text: `Skeptic challenge: Need to verify ${candidate.concern || 'breadth of ownership'} in next stage.`,
            timestamp: new Date().toISOString(),
          },
          {
            id: `msg-${Date.now()}-3`,
            roundNumber: 3,
            agentId: 'consensus',
            agentName: 'Consensus',
            agentRole: 'Synthesis',
            tone: 'indigo',
            isConsensus: true,
            text: `Panel consensus reached for ${candidate.name} with standard verification caveats.`,
            timestamp: new Date().toISOString(),
          },
        ],
        revisions: [],
        consensus: {
          agreementConfidence: 85,
          verdictRecommendation: `Advance ${candidate.name} with targeted questions on key concerns.`,
          summary: 'Panel aligned on advancing candidate with caveats.',
          caveat: candidate.concern || 'Validate specific ownership examples.',
          totalRounds: 3,
          participatingAgentsCount: 4,
          evidenceReferencesCount: 4,
        },
        createdAt: new Date().toISOString(),
        concludedAt: new Date().toISOString(),
      };

      await db.saveDebateSession(debate);
    }

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
