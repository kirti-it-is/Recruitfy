import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/mock-db';
import { ApiResponse, Candidate, UpdateCandidateInput } from '@/lib/types';

export async function GET(
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

    const response: ApiResponse<Candidate> = {
      success: true,
      data: candidate,
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
        message: 'Failed to fetch candidate',
        details: error instanceof Error ? error.message : String(error),
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const { candidateId } = await params;
    const body = (await req.json()) as UpdateCandidateInput;

    const updated = await db.updateCandidate(candidateId, body);
    if (!updated) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Candidate with ID '${candidateId}' was not found.`,
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<Candidate> = {
      success: true,
      data: updated,
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
        message: 'Failed to update candidate',
        details: error instanceof Error ? error.message : String(error),
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const { candidateId } = await params;
    const deleted = await db.deleteCandidate(candidateId);

    if (!deleted) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Candidate with ID '${candidateId}' was not found.`,
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<{ deleted: boolean }> = {
      success: true,
      data: { deleted: true },
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
        message: 'Failed to delete candidate',
        details: error instanceof Error ? error.message : String(error),
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
