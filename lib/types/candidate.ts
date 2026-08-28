export type CandidateFitStatus = 'Strong fit' | 'Good fit' | 'Potential fit' | 'Low fit' | 'Needs review';
export type CandidateProgress = 'Not started' | 'In progress' | 'Complete';
export type CandidateStage = 'upload' | 'profile' | 'evidence' | 'agents' | 'debate' | 'final';
export type CandidateAccentColor = 'indigo' | 'blue' | 'violet' | 'coral' | 'mint';

export interface Candidate {
  id: string;
  roomId: string;
  name: string;
  role: string;
  initials: string;
  location?: string;
  availability?: string;
  score: number; // 0 to 100
  status: CandidateFitStatus;
  color: CandidateAccentColor;
  summary: string;
  strengths: string[];
  concern: string;
  progress: CandidateProgress;
  stage: CandidateStage;
  resumeDocumentId?: string;
  resumeFileName?: string;
  resumeStatus?: 'missing' | 'uploaded' | 'ready';
  transcriptDocumentId?: string;
  transcriptFileName?: string;
  transcriptStatus?: 'missing' | 'uploaded' | 'ready';
  createdAt: string;
  updatedAt: string;
}

export interface CreateCandidateInput {
  roomId: string;
  name: string;
  role?: string;
  location?: string;
  availability?: string;
  resumeDocumentId?: string;
  resumeFileName?: string;
  transcriptDocumentId?: string;
  transcriptFileName?: string;
}

export interface UpdateCandidateInput {
  name?: string;
  role?: string;
  location?: string;
  availability?: string;
  score?: number;
  status?: CandidateFitStatus;
  color?: CandidateAccentColor;
  summary?: string;
  strengths?: string[];
  concern?: string;
  progress?: CandidateProgress;
  stage?: CandidateStage;
  resumeDocumentId?: string;
  resumeFileName?: string;
  resumeStatus?: 'missing' | 'uploaded' | 'ready';
  transcriptDocumentId?: string;
  transcriptFileName?: string;
  transcriptStatus?: 'missing' | 'uploaded' | 'ready';
}
