import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/mock-db';
import { fileStorage } from '@/lib/server/storage/file-storage';
import { ApiResponse, CreateRoomInput, HiringRoom } from '@/lib/types';

export const runtime = 'nodejs';

function getFormText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function getUploadedFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);
  return value && typeof value !== 'string' && typeof value.arrayBuffer === 'function' && typeof value.size === 'number'
    ? value as File
    : null;
}

export async function GET() {
  try {
    const rooms = await db.getRooms();
    const response: ApiResponse<HiringRoom[]> = {
      success: true,
      data: rooms,
      meta: {
        timestamp: new Date().toISOString(),
        totalCount: rooms.length,
      },
    };
    return NextResponse.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch hiring rooms',
        details: error instanceof Error ? error.message : String(error),
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let createInput: CreateRoomInput;
    let jdFileToProcess: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const title = getFormText(formData, 'title');
      const role = getFormText(formData, 'role') || title;
      const location = getFormText(formData, 'location');
      const department = getFormText(formData, 'department') || 'Engineering';
      const brief = getFormText(formData, 'brief');
      const jdFile = getUploadedFile(formData, 'jobDescription');

      if (!title || !location || !brief) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Title, location, and brief are required fields.',
          },
        };
        return NextResponse.json(response, { status: 400 });
      }

      createInput = {
        title,
        role,
        location,
        department,
        brief,
      };

      if (jdFile && jdFile.size > 0) {
        jdFileToProcess = jdFile;
      }
    } else {
      const body = (await req.json()) as CreateRoomInput;
      if (!body.title || !body.location || !body.brief) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Title, location, and brief are required fields.',
          },
        };
        return NextResponse.json(response, { status: 400 });
      }
      createInput = body;
    }

    // Handle JD File upload if provided
    let jdDocId = createInput.jobDescriptionDocumentId;
    let jdDocName = createInput.jobDescriptionFileName;

    if (jdFileToProcess) {
      const saved = await fileStorage.saveFile(jdFileToProcess, 'job_description');
      const doc = await db.createDocument({
        id: saved.id,
        name: saved.originalFilename,
        type: 'job_description',
        storagePath: saved.storagePath,
        metadata: saved.metadata,
      });
      jdDocId = doc.id;
      jdDocName = doc.name;
    }

    const newRoom = await db.createRoom({
      ...createInput,
      jobDescriptionDocumentId: jdDocId,
      jobDescriptionFileName: jdDocName,
    });

    // Link document to room
    if (jdDocId) {
      await db.updateDocument(jdDocId, { roomId: newRoom.id });
    }

    const response: ApiResponse<HiringRoom> = {
      success: true,
      data: newRoom,
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
        message: 'Failed to create hiring room',
        details: error instanceof Error ? error.message : String(error),
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
