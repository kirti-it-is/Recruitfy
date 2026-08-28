import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/mock-db';
import { fileStorage } from '@/lib/server/storage/file-storage';
import { ApiResponse, Document, DocumentType } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as DocumentType) || 'other';
    const roomId = formData.get('roomId') as string | undefined;
    const candidateId = formData.get('candidateId') as string | undefined;

    if (!file || file.size === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No file was provided in the request.',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const saved = await fileStorage.saveFile(file, type, { candidateId, roomId });
    const doc = await db.createDocument({
      id: saved.id,
      name: saved.originalFilename,
      type,
      storagePath: saved.storagePath,
      metadata: saved.metadata,
      roomId,
      candidateId,
    });

    const response: ApiResponse<Document> = {
      success: true,
      data: doc,
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
        message: 'Failed to upload document',
        details: error instanceof Error ? error.message : String(error),
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
