import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/mock-db';
import { ApiResponse, Document } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    const document = await db.getDocumentById(documentId);

    if (!document) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Document with ID '${documentId}' was not found.`,
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<Document> = {
      success: true,
      data: document,
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
        message: 'Failed to fetch document',
        details: error instanceof Error ? error.message : String(error),
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
