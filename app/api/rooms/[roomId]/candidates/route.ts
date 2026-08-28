import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/mock-db';
import { fileStorage } from '@/lib/server/storage/file-storage';
import { ApiResponse, Candidate, CreateCandidateInput } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const candidates = await db.getCandidatesByRoom(roomId);

    const response: ApiResponse<Candidate[]> = {
      success: true,
      data: candidates,
      meta: {
        timestamp: new Date().toISOString(),
        totalCount: candidates.length,
      },
    };
    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch candidates',
        details: error instanceof Error ? error.message : String(error),
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const room = await db.getRoomById(roomId);

    if (!room) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Hiring room with ID '${roomId}' was not found.`,
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    const contentType = req.headers.get('content-type') || '';
    let name = '';
    let role = room.role;
    let location = 'Remote';
    let availability = 'Immediate';
    let resumeDocId: string | undefined;
    let resumeFileName: string | undefined;
    let transcriptDocId: string | undefined;
    let transcriptFileName: string | undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      name = (formData.get('name') as string) || '';
      role = (formData.get('role') as string) || room.role;
      location = (formData.get('location') as string) || 'Remote';
      availability = (formData.get('availability') as string) || 'Immediate';

      if (!name.trim()) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Candidate name is required.',
          },
        };
        return NextResponse.json(response, { status: 400 });
      }

      const resumeFile = formData.get('resume') as File | null;
      const transcriptFile = formData.get('transcript') as File | null;

      // Handle Resume File
      if (resumeFile && resumeFile.size > 0) {
        const savedResume = await fileStorage.saveFile(resumeFile, 'resume', { roomId });
        const resumeDoc = await db.createDocument({
          id: savedResume.id,
          name: savedResume.originalFilename,
          type: 'resume',
          storagePath: savedResume.storagePath,
          metadata: savedResume.metadata,
          roomId,
        });
        resumeDocId = resumeDoc.id;
        resumeFileName = resumeDoc.name;
      }

      // Handle Interview Transcript File
      if (transcriptFile && transcriptFile.size > 0) {
        const savedTrans = await fileStorage.saveFile(transcriptFile, 'interview_transcript', { roomId });
        const transDoc = await db.createDocument({
          id: savedTrans.id,
          name: savedTrans.originalFilename,
          type: 'interview_transcript',
          storagePath: savedTrans.storagePath,
          metadata: savedTrans.metadata,
          roomId,
        });
        transcriptDocId = transDoc.id;
        transcriptFileName = transDoc.name;
      }
    } else {
      const body = (await req.json()) as Omit<CreateCandidateInput, 'roomId'>;
      if (!body.name) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Candidate name is required.',
          },
        };
        return NextResponse.json(response, { status: 400 });
      }
      name = body.name;
      role = body.role || room.role;
      location = body.location || 'Remote';
      availability = body.availability || 'Immediate';
      resumeDocId = body.resumeDocumentId;
      resumeFileName = body.resumeFileName;
      transcriptDocId = body.transcriptDocumentId;
      transcriptFileName = body.transcriptFileName;
    }

    const newCandidate = await db.createCandidate({
      roomId,
      name,
      role,
      location,
      availability,
      resumeDocumentId: resumeDocId,
      resumeFileName,
      transcriptDocumentId: transcriptDocId,
      transcriptFileName,
    });

    // Associate documents with candidate
    if (resumeDocId) {
      await db.updateDocument(resumeDocId, { candidateId: newCandidate.id });
    }
    if (transcriptDocId) {
      await db.updateDocument(transcriptDocId, { candidateId: newCandidate.id });
    }

    const response: ApiResponse<Candidate> = {
      success: true,
      data: newCandidate,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create candidate',
        details: error instanceof Error ? error.message : String(error),
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
