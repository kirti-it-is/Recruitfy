import fs from 'fs';
import path from 'path';
import {
  HiringRoom,
  CreateRoomInput,
  UpdateRoomInput,
  Candidate,
  CreateCandidateInput,
  UpdateCandidateInput,
  Document,
  CreateDocumentInput,
  CandidateAnalysis,
  AgentEvaluation,
  DebateSession,
  CandidateDecision,
  RoomComparativeAnalysis,
  RoomRecommendation,
} from '@/lib/types';

interface DatabaseSchema {
  rooms: Record<string, HiringRoom>;
  candidates: Record<string, Candidate>;
  documents: Record<string, Document>;
  analyses: Record<string, CandidateAnalysis>;
  agentEvaluations: Record<string, AgentEvaluation[]>;
  debateSessions: Record<string, DebateSession>;
  decisions: Record<string, CandidateDecision>;
}

export class JsonFileDatabase {
  private filePath: string;
  private data: DatabaseSchema;
  private isLoaded = false;

  constructor(filename = 'hiremind-db.json') {
    this.filePath = path.join(process.cwd(), 'data', filename);
    this.data = {
      rooms: {},
      candidates: {},
      documents: {},
      analyses: {},
      agentEvaluations: {},
      debateSessions: {},
      decisions: {},
    };
    this.init();
  }

  private init() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
        this.isLoaded = true;
      } catch (err) {
        console.error('Error reading database file, seeding default data:', err);
        this.seedDefaultData();
        this.persist();
      }
    } else {
      this.seedDefaultData();
      this.persist();
    }
  }

  private persist() {
    try {
      const json = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(this.filePath, json, 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  private seedDefaultData() {
    const room1: HiringRoom = {
      id: 'room-senior-ml',
      title: 'Senior ML Engineer',
      role: 'Senior ML Engineer',
      location: 'New York, NY',
      department: 'Engineering',
      brief: 'Build reliable machine learning systems for our next generation platform.',
      status: 'in_progress',
      jobDescriptionDocumentId: 'doc-jd-senior-ml',
      jobDescriptionFileName: 'senior-ml-engineer-jd.pdf',
      candidateCount: 3,
      analysisProgress: 67,
      createdAt: '2024-08-18T10:00:00Z',
      updatedAt: '2024-08-26T08:30:00Z',
    };

    const room2: HiringRoom = {
      id: 'room-product-designer',
      title: 'Product Designer',
      role: 'Product Designer',
      location: 'San Francisco, CA',
      department: 'Product',
      brief: 'Design intuitive workflows and intelligent interface patterns.',
      status: 'needs_review',
      candidateCount: 12,
      analysisProgress: 40,
      createdAt: '2024-08-20T14:00:00Z',
      updatedAt: '2024-08-25T17:00:00Z',
    };

    const room3: HiringRoom = {
      id: 'room-staff-backend',
      title: 'Staff Backend Engineer',
      role: 'Staff Backend Engineer',
      location: 'Remote',
      department: 'Infrastructure',
      brief: 'Architect high-throughput distributed systems and data pipelines.',
      status: 'active',
      candidateCount: 4,
      analysisProgress: 25,
      createdAt: '2024-08-22T09:00:00Z',
      updatedAt: '2024-08-26T06:00:00Z',
    };

    this.data.rooms[room1.id] = room1;
    this.data.rooms[room2.id] = room2;
    this.data.rooms[room3.id] = room3;

    // Seed Documents
    const jdDoc: Document = {
      id: 'doc-jd-senior-ml',
      name: 'senior-ml-engineer-jd.pdf',
      type: 'job_description',
      status: 'ready',
      roomId: room1.id,
      metadata: {
        originalFilename: 'senior-ml-engineer-jd.pdf',
        sizeBytes: 245000,
        mimeType: 'application/pdf',
        pageCount: 3,
        uploadedAt: '2024-08-18T10:00:00Z',
      },
      createdAt: '2024-08-18T10:00:00Z',
      updatedAt: '2024-08-18T10:00:00Z',
    };
    this.data.documents[jdDoc.id] = jdDoc;

    // Seed Candidates
    const maya: Candidate = {
      id: 'cand-maya-chen',
      roomId: room1.id,
      name: 'Maya Chen',
      role: 'Senior ML Engineer',
      initials: 'MC',
      location: 'San Francisco, CA',
      availability: 'Available in 1 month',
      score: 92,
      status: 'Strong fit',
      color: 'indigo',
      summary: 'Exceptional systems thinker with a rare blend of research depth and production instincts.',
      strengths: ['Distributed systems', 'Model evaluation', 'Technical leadership'],
      concern: 'Limited experience managing a team larger than 5.',
      progress: 'Complete',
      stage: 'final',
      resumeDocumentId: 'doc-maya-resume',
      resumeFileName: 'maya-chen-resume.pdf',
      resumeStatus: 'ready',
      transcriptDocumentId: 'doc-maya-transcript',
      transcriptFileName: 'maya-chen-interview.pdf',
      transcriptStatus: 'ready',
      createdAt: '2024-08-19T11:00:00Z',
      updatedAt: '2024-08-26T08:00:00Z',
    };

    const jordan: Candidate = {
      id: 'cand-jordan-bell',
      roomId: room1.id,
      name: 'Jordan Bell',
      role: 'ML Platform Engineer',
      initials: 'JB',
      location: 'New York, NY',
      availability: 'Immediate',
      score: 84,
      status: 'Good fit',
      color: 'blue',
      summary: 'Reliable builder who brings strong platform fundamentals and thoughtful execution.',
      strengths: ['MLOps & infra', 'Cross-functional partner', 'Pragmatic delivery'],
      concern: 'Less evidence of novel research or ambiguous problem solving.',
      progress: 'Complete',
      stage: 'final',
      resumeDocumentId: 'doc-jordan-resume',
      resumeFileName: 'jordan-bell-resume.pdf',
      resumeStatus: 'ready',
      transcriptDocumentId: 'doc-jordan-transcript',
      transcriptFileName: 'jordan-bell-interview.pdf',
      transcriptStatus: 'ready',
      createdAt: '2024-08-19T12:00:00Z',
      updatedAt: '2024-08-25T15:00:00Z',
    };

    const priya: Candidate = {
      id: 'cand-priya-shah',
      roomId: room1.id,
      name: 'Priya Shah',
      role: 'Applied Scientist',
      initials: 'PS',
      location: 'Seattle, WA',
      availability: '2 weeks',
      score: 78,
      status: 'Potential fit',
      color: 'violet',
      summary: 'High-upside applied scientist with a compelling research portfolio and strong curiosity.',
      strengths: ['Research depth', 'Experiment design', 'Written communication'],
      concern: 'Production ownership examples were lighter than the role requires.',
      progress: 'Complete',
      stage: 'final',
      resumeDocumentId: 'doc-priya-resume',
      resumeFileName: 'priya-shah-resume.pdf',
      resumeStatus: 'ready',
      transcriptDocumentId: 'doc-priya-transcript',
      transcriptFileName: 'priya-shah-interview.pdf',
      transcriptStatus: 'ready',
      createdAt: '2024-08-19T13:00:00Z',
      updatedAt: '2024-08-25T16:00:00Z',
    };

    this.data.candidates[maya.id] = maya;
    this.data.candidates[jordan.id] = jordan;
    this.data.candidates[priya.id] = priya;

    // Seed Maya Analysis
    const mayaAnalysis: CandidateAnalysis = {
      id: 'analysis-maya-chen',
      candidateId: maya.id,
      roomId: room1.id,
      overallFitScore: 92,
      decisionConfidence: 87,
      summary:
        'Maya combines exceptional systems thinking with execution instincts that turn ambiguous problems into durable platforms. Her strongest evidence is the real-time inference migration, where she reduced latency by 68%, plus a rigorous evaluation practice across three model families.',
      evidenceWeightedConclusion:
        'Advance to final interview. Validate people-management scope and team scaling in one focused conversation.',
      recommendation: 'advance',
      roleAlignment: {
        overallMatchScore: 92,
        technicalSkillsScore: 94,
        experienceMatchScore: 89,
        evidenceCoverageScore: 96,
        riskLevel: 'Low',
        riskNote: 'Low · one open question',
      },
      skillScores: [
        { skill: 'Distributed systems', score: 96, requiredScore: 94 },
        { skill: 'Model evaluation', score: 91, requiredScore: 90 },
        { skill: 'Technical leadership', score: 86, requiredScore: 85 },
        { skill: 'MLOps & infrastructure', score: 82, requiredScore: 80 },
        { skill: 'Team management', score: 58, requiredScore: 75 },
      ],
      evidencePoints: [
        {
          id: 'ev-1',
          candidateId: maya.id,
          claim: 'Distributed systems',
          category: 'Architecture',
          sourceType: 'resume',
          sourceDocumentName: 'Resume',
          sourceLocation: 'Resume · Project history · p. 2',
          quoteSnippet: 'Led real-time inference migration with 68% latency reduction across 4 global clusters.',
          supportLevel: 'Supported',
          confidence: 96,
        },
        {
          id: 'ev-2',
          candidateId: maya.id,
          claim: 'Model evaluation',
          category: 'Machine Learning',
          sourceType: 'interview_transcript',
          sourceDocumentName: 'Interview transcript',
          sourceLocation: 'Interview transcript · Technical deep dive',
          quoteSnippet: 'Built evaluation systems across three model families and established automated regression benchmarks.',
          supportLevel: 'Supported',
          confidence: 91,
        },
        {
          id: 'ev-3',
          candidateId: maya.id,
          claim: 'Team scaling',
          category: 'Leadership',
          sourceType: 'interview_transcript',
          sourceDocumentName: 'Interview transcript',
          sourceLocation: 'Interview transcript · Leadership example',
          quoteSnippet: 'Influence is clear; direct management scope remains partially supported.',
          supportLevel: 'Partial',
          confidence: 72,
        },
      ],
      coverageDistribution: {
        totalClaims: 24,
        supportedCount: 18,
        partialCount: 5,
        notSupportedCount: 1,
        supportedPercentage: 75,
      },
      strengths: ['Distributed systems', 'Evaluation rigor', 'Technical leadership'],
      concerns: ['Management scale'],
      status: 'completed',
      createdAt: '2024-08-25T10:00:00Z',
      updatedAt: '2024-08-26T08:00:00Z',
    };
    this.data.analyses[maya.id] = mayaAnalysis;

    // Seed Maya Agent Evaluations
    this.data.agentEvaluations[maya.id] = [
      {
        id: 'eval-atlas-maya',
        candidateId: maya.id,
        roomId: room1.id,
        agentId: 'atlas',
        agentName: 'Atlas',
        agentRole: 'Technical',
        agentColor: 'indigo',
        score: 94,
        confidence: 'High',
        reasoning: 'Evidence is specific, recent, and directly relevant to the role scope.',
        strengths: ['Technical depth', 'System architecture'],
        concerns: ['Role transition risk'],
        referencedEvidenceIds: ['ev-1', 'ev-2'],
        status: 'completed',
        evaluatedAt: '2024-08-25T11:00:00Z',
      },
      {
        id: 'eval-sage-maya',
        candidateId: maya.id,
        roomId: room1.id,
        agentId: 'sage',
        agentName: 'Sage',
        agentRole: 'HR / Culture',
        agentColor: 'violet',
        score: 88,
        confidence: 'High',
        reasoning: 'Strong evidence of collaborative problem solving and communication.',
        strengths: ['Clear communication', 'Mentorship mindset'],
        concerns: ['People management tenure'],
        referencedEvidenceIds: ['ev-3'],
        status: 'completed',
        evaluatedAt: '2024-08-25T11:05:00Z',
      },
      {
        id: 'eval-vector-maya',
        candidateId: maya.id,
        roomId: room1.id,
        agentId: 'vector',
        agentName: 'Vector',
        agentRole: 'Hiring Manager',
        agentColor: 'blue',
        score: 91,
        confidence: 'Medium',
        reasoning: 'Hits the technical requirements with room to spare.',
        strengths: ['Execution speed', 'Platform ownership'],
        concerns: ['Large org navigation'],
        referencedEvidenceIds: ['ev-1'],
        status: 'completed',
        evaluatedAt: '2024-08-25T11:10:00Z',
      },
      {
        id: 'eval-quill-maya',
        candidateId: maya.id,
        roomId: room1.id,
        agentId: 'quill',
        agentName: 'Quill',
        agentRole: 'Skeptic',
        agentColor: 'coral',
        score: 76,
        confidence: 'Medium',
        reasoning: 'The team-scaling claim needs stronger corroboration before advancing.',
        strengths: ['Pragmatic delivery'],
        concerns: ['Management scale'],
        referencedEvidenceIds: ['ev-3'],
        status: 'completed',
        evaluatedAt: '2024-08-25T11:15:00Z',
      },
    ];

    // Seed Maya Debate
    this.data.debateSessions[maya.id] = {
      id: 'debate-maya-chen',
      candidateId: maya.id,
      roomId: room1.id,
      status: 'concluded',
      currentRound: 3,
      maxRounds: 3,
      messages: [
        {
          id: 'msg-1',
          roundNumber: 1,
          agentId: 'atlas',
          agentName: 'Atlas',
          agentRole: 'Technical',
          tone: 'indigo',
          text: 'Her distributed systems work is the strongest signal in the pool. The 68% latency reduction is technically credible.',
          referencedEvidenceId: 'ev-1',
          referencedEvidenceLabel: 'Evidence #04 referenced',
          timestamp: '2024-08-25T11:30:00Z',
        },
        {
          id: 'msg-2',
          roundNumber: 2,
          agentId: 'quill',
          agentName: 'Quill',
          agentRole: 'Skeptic',
          tone: 'coral',
          text: 'Challenge: the claim is supported by one interview example. I would revise technical confidence until we verify scope.',
          referencedEvidenceId: 'ev-3',
          referencedEvidenceLabel: 'Evidence #07 referenced',
          timestamp: '2024-08-25T11:32:00Z',
        },
        {
          id: 'msg-3',
          roundNumber: 2,
          agentId: 'sage',
          agentName: 'Sage',
          agentRole: 'HR / Culture',
          tone: 'violet',
          text: 'Agree on the challenge. She has influence evidence, not yet people-management evidence.',
          referencedEvidenceId: 'ev-3',
          timestamp: '2024-08-25T11:33:00Z',
        },
        {
          id: 'msg-4',
          roundNumber: 3,
          agentId: 'atlas',
          agentName: 'Atlas',
          agentRole: 'Technical',
          tone: 'indigo',
          text: 'Revised: 84 → 76. The concern is material, but does not outweigh the depth of her systems work.',
          timestamp: '2024-08-25T11:35:00Z',
        },
        {
          id: 'msg-5',
          roundNumber: 3,
          agentId: 'consensus',
          agentName: 'Consensus',
          agentRole: 'Synthesis',
          tone: 'indigo',
          isConsensus: true,
          text: 'Advance Maya, with a final interview focused on team scaling and management scope.',
          timestamp: '2024-08-25T11:36:00Z',
        },
      ],
      revisions: [
        {
          id: 'rev-1',
          agentId: 'atlas',
          agentName: 'Atlas',
          previousScore: 84,
          revisedScore: 76,
          reason: 'Skeptic challenged ML claim evidence',
          roundNumber: 3,
        },
      ],
      consensus: {
        agreementConfidence: 87,
        verdictRecommendation: 'Advance Maya, with a final interview focused on team scaling and management scope.',
        summary: 'Consensus with caveat: Advance Maya with one open validation question.',
        caveat: 'Validate people-management scope and team scaling in final interview.',
        unresolvedDisagreement: 'Unresolved disagreement on direct management scale',
        totalRounds: 3,
        participatingAgentsCount: 4,
        evidenceReferencesCount: 6,
      },
      createdAt: '2024-08-25T11:29:00Z',
      concludedAt: '2024-08-25T11:37:00Z',
    };

    // Seed Maya Decision
    this.data.decisions[maya.id] = {
      id: 'decision-maya-chen',
      candidateId: maya.id,
      roomId: room1.id,
      verdict: 'advance',
      verdictTitle: 'Advance to final interview',
      finalScore: 92,
      overallConfidence: 87,
      agentConsensusSummary: '3 agree · 1 caveat',
      unresolvedQuestion: 'Team scaling evidence',
      rationale:
        'Maya combines exceptional systems thinking with execution instincts that turn ambiguous problems into durable platforms. The debate surfaced one meaningful question, but the evidence remains consistently strong across technical depth, collaboration, and delivery.',
      strengths: ['Distributed systems', 'Evaluation rigor', 'Technical leadership'],
      keyEvidence: ['68% latency reduction', 'Cross-team architecture influence'],
      concerns: ['Validate people-management scope in final interview'],
      recommendedFocusAreas: ['People-management scope', 'Team scaling track record'],
      decidedAt: '2024-08-25T11:40:00Z',
    };
  }

  // --- Hiring Room Operations ---
  async getRooms(): Promise<HiringRoom[]> {
    return Object.values(this.data.rooms);
  }

  async getRoomById(id: string): Promise<HiringRoom | null> {
    return this.data.rooms[id] || null;
  }

  async createRoom(input: CreateRoomInput): Promise<HiringRoom> {
    const id = `room-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newRoom: HiringRoom = {
      id,
      title: input.title,
      role: input.role || input.title,
      location: input.location,
      department: input.department || 'Engineering',
      brief: input.brief,
      status: 'active',
      jobDescriptionDocumentId: input.jobDescriptionDocumentId,
      jobDescriptionFileName: input.jobDescriptionFileName,
      candidateCount: 0,
      analysisProgress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.rooms[id] = newRoom;
    this.persist();
    return newRoom;
  }

  async updateRoom(id: string, input: UpdateRoomInput): Promise<HiringRoom | null> {
    const existing = this.data.rooms[id];
    if (!existing) return null;
    const updated: HiringRoom = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    this.data.rooms[id] = updated;
    this.persist();
    return updated;
  }

  async deleteRoom(id: string): Promise<boolean> {
    if (this.data.rooms[id]) {
      delete this.data.rooms[id];
      this.persist();
      return true;
    }
    return false;
  }

  // --- Candidate Operations ---
  async getCandidatesByRoom(roomId: string): Promise<Candidate[]> {
    return Object.values(this.data.candidates).filter((c) => c.roomId === roomId);
  }

  async getCandidateById(id: string): Promise<Candidate | null> {
    return this.data.candidates[id] || null;
  }

  async createCandidate(input: CreateCandidateInput): Promise<Candidate> {
    const id = `cand-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nameParts = input.name.trim().split(/\s+/);
    const initials = nameParts
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'C';

    const colors: Candidate['color'][] = ['indigo', 'blue', 'violet', 'coral', 'mint'];
    const existingCount = Object.keys(this.data.candidates).length;
    const color = colors[existingCount % colors.length];

    const newCandidate: Candidate = {
      id,
      roomId: input.roomId,
      name: input.name,
      role: input.role || 'Candidate',
      initials,
      location: input.location || 'Remote',
      availability: input.availability || 'Immediate',
      score: 0,
      status: 'Needs review',
      color,
      summary: 'Candidate added to hiring room. Ready for document ingestion and AI analysis.',
      strengths: [],
      concern: 'Awaiting initial analysis.',
      progress: 'Not started',
      stage: 'upload',
      resumeDocumentId: input.resumeDocumentId,
      resumeFileName: input.resumeFileName,
      resumeStatus: input.resumeDocumentId ? 'ready' : 'missing',
      transcriptDocumentId: input.transcriptDocumentId,
      transcriptFileName: input.transcriptFileName,
      transcriptStatus: input.transcriptDocumentId ? 'ready' : 'missing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.candidates[id] = newCandidate;

    // Update room count
    const room = this.data.rooms[input.roomId];
    if (room) {
      room.candidateCount = (room.candidateCount || 0) + 1;
      room.updatedAt = new Date().toISOString();
    }

    this.persist();
    return newCandidate;
  }

  async updateCandidate(id: string, input: UpdateCandidateInput): Promise<Candidate | null> {
    const existing = this.data.candidates[id];
    if (!existing) return null;
    const updated: Candidate = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    this.data.candidates[id] = updated;
    this.persist();
    return updated;
  }

  async deleteCandidate(id: string): Promise<boolean> {
    const candidate = this.data.candidates[id];
    if (candidate) {
      const room = this.data.rooms[candidate.roomId];
      if (room && room.candidateCount > 0) {
        room.candidateCount -= 1;
        room.updatedAt = new Date().toISOString();
      }
      delete this.data.candidates[id];
      this.persist();
      return true;
    }
    return false;
  }

  // --- Document Operations ---
  async getDocumentById(id: string): Promise<Document | null> {
    return this.data.documents[id] || null;
  }

  async getDocumentsByRoom(roomId: string): Promise<Document[]> {
    return Object.values(this.data.documents).filter((d) => d.roomId === roomId);
  }

  async getDocumentsByCandidate(candidateId: string): Promise<Document[]> {
    return Object.values(this.data.documents).filter((d) => d.candidateId === candidateId);
  }

  async createDocument(input: CreateDocumentInput & { storagePath?: string; id?: string }): Promise<Document> {
    const id = input.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newDoc: Document = {
      id,
      name: input.name,
      type: input.type,
      status: 'ready',
      storagePath: input.storagePath,
      extractedText: input.extractedText,
      metadata: input.metadata,
      roomId: input.roomId,
      candidateId: input.candidateId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.documents[id] = newDoc;
    this.persist();
    return newDoc;
  }

  async updateDocument(id: string, input: Partial<Document>): Promise<Document | null> {
    const existing = this.data.documents[id];
    if (!existing) return null;
    const updated: Document = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    this.data.documents[id] = updated;
    this.persist();
    return updated;
  }

  // --- Analysis Operations ---
  async getAnalysisByCandidateId(candidateId: string): Promise<CandidateAnalysis | null> {
    return this.data.analyses[candidateId] || null;
  }

  async saveAnalysis(analysis: CandidateAnalysis): Promise<CandidateAnalysis> {
    this.data.analyses[analysis.candidateId] = analysis;
    this.persist();
    return analysis;
  }

  // --- Agent Evaluation Operations ---
  async getAgentEvaluations(candidateId: string): Promise<AgentEvaluation[]> {
    return this.data.agentEvaluations[candidateId] || [];
  }

  async saveAgentEvaluations(candidateId: string, evaluations: AgentEvaluation[]): Promise<AgentEvaluation[]> {
    this.data.agentEvaluations[candidateId] = evaluations;
    this.persist();
    return evaluations;
  }

  // --- Debate Session Operations ---
  async getDebateSession(candidateId: string): Promise<DebateSession | null> {
    return this.data.debateSessions[candidateId] || null;
  }

  async saveDebateSession(session: DebateSession): Promise<DebateSession> {
    this.data.debateSessions[session.candidateId] = session;
    this.persist();
    return session;
  }

  // --- Decision & Recommendation Operations ---
  async getDecision(candidateId: string): Promise<CandidateDecision | null> {
    return this.data.decisions[candidateId] || null;
  }

  async saveDecision(decision: CandidateDecision): Promise<CandidateDecision> {
    this.data.decisions[decision.candidateId] = decision;
    this.persist();
    return decision;
  }

  async getComparativeAnalysis(roomId: string): Promise<RoomComparativeAnalysis | null> {
    const room = this.data.rooms[roomId];
    if (!room) return null;
    const roomCandidates = await this.getCandidatesByRoom(roomId);

    return {
      roomId,
      roleTitle: room.title,
      candidates: roomCandidates.map((c, idx) => ({
        candidateId: c.id,
        name: c.name,
        role: c.role,
        initials: c.initials,
        color: c.color,
        score: c.score || (idx === 0 ? 92 : idx === 1 ? 84 : 78),
        confidence: idx === 0 ? 87 : idx === 1 ? 81 : 74,
        isLeadingSignal: idx === 0,
        agentScores: {
          technical: idx === 0 ? 96 : idx === 1 ? 88 : 81,
          culture: idx === 0 ? 88 : idx === 1 ? 89 : 82,
          manager: idx === 0 ? 91 : idx === 1 ? 89 : 82,
          skeptic: idx === 0 ? 76 : idx === 1 ? 80 : 74,
        },
        primaryStrength: c.strengths[0] || 'Technical depth',
        primaryConcern: c.concern || 'None identified',
      })),
      decisionLensSummary:
        'Candidates are evaluated against one shared job description. Evidence coherence across all four independent lenses drives the leading signal.',
      generatedAt: new Date().toISOString(),
    };
  }

  async getRoomRecommendation(roomId: string): Promise<RoomRecommendation | null> {
    const room = this.data.rooms[roomId];
    if (!room) return null;
    const roomCandidates = await this.getCandidatesByRoom(roomId);
    const topCandidate = roomCandidates[0];
    if (!topCandidate) return null;

    return {
      id: `rec-${roomId}`,
      roomId,
      roleTitle: room.title,
      location: room.location,
      topCandidateId: topCandidate.id,
      topCandidateName: topCandidate.name,
      topCandidateRole: topCandidate.role,
      topCandidateInitials: topCandidate.initials,
      fitScore: topCandidate.score || 92,
      fitLevel: topCandidate.status || 'Strong fit',
      decisionConfidence: 87,
      whyWinner:
        `${topCandidate.name} presents the most coherent signal in this pool: exceptional technical depth, dependable execution, and evidence that survives challenge.`,
      tradeOffs: topCandidate.concern ? `Validate: ${topCandidate.concern}` : 'Standard reference verification.',
      generatedAt: new Date().toISOString(),
    };
  }
}

export const db = new JsonFileDatabase();
