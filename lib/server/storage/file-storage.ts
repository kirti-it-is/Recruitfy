import fs from 'fs';
import path from 'path';
import { DocumentMetadata, DocumentType } from '@/lib/types';

export interface SavedFileInfo {
  id: string;
  originalFilename: string;
  savedFilename: string;
  storagePath: string;
  relativePath: string;
  mimeType: string;
  sizeBytes: number;
  metadata: DocumentMetadata;
}

export class FileStorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureDir(this.uploadDir);
    this.ensureDir(path.join(this.uploadDir, 'job_descriptions'));
    this.ensureDir(path.join(this.uploadDir, 'resumes'));
    this.ensureDir(path.join(this.uploadDir, 'transcripts'));
    this.ensureDir(path.join(this.uploadDir, 'misc'));
  }

  private ensureDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private getSubdirectoryForType(type: DocumentType): string {
    switch (type) {
      case 'job_description':
        return 'job_descriptions';
      case 'resume':
        return 'resumes';
      case 'interview_transcript':
        return 'transcripts';
      default:
        return 'misc';
    }
  }

  async saveFile(
    file: File | Blob,
    type: DocumentType,
    options?: { filename?: string; candidateId?: string; roomId?: string }
  ): Promise<SavedFileInfo> {
    const fileId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fileName = 'name' in file && typeof file.name === 'string' ? file.name : undefined;
    const originalFilename = options?.filename || fileName || `${fileId}.pdf`;

    // Clean filename for safety
    const ext = path.extname(originalFilename) || '.pdf';
    const baseName = path
      .basename(originalFilename, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const savedFilename = `${fileId}_${baseName}${ext}`;

    const subDir = this.getSubdirectoryForType(type);
    const targetDir = path.join(this.uploadDir, subDir);
    this.ensureDir(targetDir);

    const fullPath = path.join(targetDir, savedFilename);
    const relativePath = path.posix.join('uploads', subDir, savedFilename);

    // Write file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.promises.writeFile(fullPath, buffer);

    const sizeBytes = buffer.length;
    const mimeType = file.type || 'application/pdf';

    const metadata: DocumentMetadata = {
      originalFilename,
      sizeBytes,
      mimeType,
      uploadedAt: new Date().toISOString(),
    };

    return {
      id: fileId,
      originalFilename,
      savedFilename,
      storagePath: fullPath,
      relativePath,
      mimeType,
      sizeBytes,
      metadata,
    };
  }

  async getFileBuffer(storagePath: string): Promise<Buffer | null> {
    try {
      if (fs.existsSync(storagePath)) {
        return await fs.promises.readFile(storagePath);
      }
      return null;
    } catch {
      return null;
    }
  }

  async deleteFile(storagePath: string): Promise<boolean> {
    try {
      if (fs.existsSync(storagePath)) {
        await fs.promises.unlink(storagePath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const fileStorage = new FileStorageService();
