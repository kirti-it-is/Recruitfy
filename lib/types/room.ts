export type RoomStatus = 'active' | 'in_progress' | 'needs_review' | 'completed' | 'archived';

export interface HiringRoom {
  id: string;
  title: string;
  role: string;
  location: string;
  department: string;
  brief: string;
  status: RoomStatus;
  jobDescriptionDocumentId?: string;
  jobDescriptionFileName?: string;
  candidateCount: number;
  analysisProgress: number; // 0 to 100
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomInput {
  title: string;
  role?: string;
  location: string;
  department?: string;
  brief: string;
  jobDescriptionDocumentId?: string;
  jobDescriptionFileName?: string;
}

export interface UpdateRoomInput {
  title?: string;
  role?: string;
  location?: string;
  department?: string;
  brief?: string;
  status?: RoomStatus;
  jobDescriptionDocumentId?: string;
  jobDescriptionFileName?: string;
  analysisProgress?: number;
}
