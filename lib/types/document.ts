export type DocumentType = 'resume' | 'interview_transcript' | 'job_description' | 'other';

export type DocumentStatus = 'uploaded' | 'processing' | 'ready' | 'error';

export interface DocumentMetadata {
  originalFilename: string;
  sizeBytes: number;
  mimeType: string;
  pageCount?: number;
  wordCount?: number;
  uploadedAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  storagePath?: string;
  downloadUrl?: string;
  extractedText?: string;
  metadata: DocumentMetadata;
  roomId?: string;
  candidateId?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentInput {
  name: string;
  type: DocumentType;
  roomId?: string;
  candidateId?: string;
  extractedText?: string;
  metadata: DocumentMetadata;
}
