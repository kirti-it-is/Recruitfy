import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/mock-db';
import { fileStorage } from '@/lib/server/storage/file-storage';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    const document = await db.getDocumentById(documentId);

    if (!document || !document.storagePath) {
      return new NextResponse('Document not found', { status: 404 });
    }

    const buffer = await fileStorage.getFileBuffer(document.storagePath);
    if (!buffer) {
      return new NextResponse('File content not found on server', { status: 404 });
    }

    const mimeType = document.metadata?.mimeType || 'application/pdf';
    const filename = document.name || 'document.pdf';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
