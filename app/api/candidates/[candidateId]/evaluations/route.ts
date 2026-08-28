import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/mock-db';
import { extractTextFromPdfFile } from '@/lib/server/pdf/pdf-extractor';
import { evaluateCandidateWithIndependentAgents } from '@/lib/server/gemini/agents';
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

    let jdText = '';
    if (room.jobDescriptionDocumentId) {
      const jdDoc = await db.getDocumentById(room.jobDescriptionDocumentId);
      if (jdDoc?.storagePath) {
        try {
          const res = await extractTextFromPdfFile(jdDoc.storagePath);
          jdText = res.text;
        } catch (e) {
          console.warn('Could not extract text from JD PDF file:', e);
        }
      }
    }
    if (!jdText) {
      jdText = `Job Title: ${room.title}\nDepartment: ${room.department}\nLocation: ${room.location}\nRole Brief: ${room.brief}`;
    }

    let resumeText = '';
    if (candidate.resumeDocumentId) {
      const resumeDoc = await db.getDocumentById(candidate.resumeDocumentId);
      if (resumeDoc?.storagePath) {
        try {
          const res = await extractTextFromPdfFile(resumeDoc.storagePath);
          resumeText = res.text;
        } catch (e) {
          console.warn('Could not extract text from Resume PDF file:', e);
        }
      }
    }
    if (!resumeText) {
      resumeText = `Candidate: ${candidate.name}\nRole: ${candidate.role}\nSummary: ${candidate.summary}\nKey Strengths: ${candidate.strengths.join(', ')}`;
    }

    let transcriptText = '';
    if (candidate.transcriptDocumentId) {
      const transDoc = await db.getDocumentById(candidate.transcriptDocumentId);
      if (transDoc?.storagePath) {
        try {
          const res = await extractTextFromPdfFile(transDoc.storagePath);
          transcriptText = res.text;
        } catch (e) {
          console.warn('Could not extract text from Transcript PDF file:', e);
        }
      }
    }
    if (!transcriptText) {
      transcriptText = `Interview Notes for ${candidate.name}:\n- Discussed system design, technical ownership, and project achievements.\n- Noted communication clarity and teamwork dynamics.\n- Candidate open questions: ${candidate.concern || 'Team scale experience'}.`;
    }

    const analysis = await db.getAnalysisByCandidateId(candidateId);
    const evidencePoints = analysis?.evidencePoints || [];

    const evaluations = await evaluateCandidateWithIndependentAgents({
      candidateId: candidate.id,
      candidateName: candidate.name,
      candidateRole: candidate.role,
      roomId: room.id,
      roomTitle: room.title,
      roomBrief: room.brief,
      jobDescriptionText: jdText,
      resumeText,
      transcriptText,
      resumeFileName: candidate.resumeFileName,
      transcriptFileName: candidate.transcriptFileName,
      evidencePoints,
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
