import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/mock-db';
import { ApiResponse, CreateDocumentInput, Document } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateDocumentInput;

    if (!body.name || !body.type) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Document name and type are required.',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const doc = await db.createDocument({
      name: body.name,
      type: body.type,
      roomId: body.roomId,
      candidateId: body.candidateId,
      extractedText: body.extractedText || '',
      metadata: body.metadata || {
        originalFilename: body.name,
        sizeBytes: 1024,
        mimeType: 'application/pdf',
        uploadedAt: new Date().toISOString(),
      },
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
        message: 'Failed to create document record',
        details: error instanceof Error ? error.message : String(error),
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
