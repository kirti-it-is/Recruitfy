'use client'

import { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleHelp,
  FileText,
  Gauge,
  GitCompareArrows,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Network,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react'

type View = 'dashboard' | 'room' | 'candidate' | 'compare' | 'recommendation' | 'create' | 'login'
type Stage = 'upload' | 'profile' | 'evidence' | 'agents' | 'debate' | 'final'

interface ClientCandidate {
  id: string
  roomId: string
  name: string
  role: string
  initials: string
  score: number
  status: string
  color: string
  summary: string
  strengths: string[]
  concern: string
  progress: string
  stage?: Stage
  location?: string
  availability?: string
  resumeFileName?: string
  resumeStatus?: string
  transcriptFileName?: string
  transcriptStatus?: string
}

interface ClientRoom {
  id: string
  title: string
  role: string
  location: string
  department: string
  brief: string
  status: string
  jobDescriptionFileName?: string
  candidateCount: number
  analysisProgress: number
  createdAt: string
}

interface ClientCandidateAnalysis {
  id: string
  candidateId: string
  roomId: string
  overallFitScore: number
  decisionConfidence: number
  summary: string
  evidenceWeightedConclusion: string
  recommendation: string
  roleAlignment: {
    overallMatchScore: number
    technicalSkillsScore: number
    experienceMatchScore: number
    evidenceCoverageScore: number
    riskLevel: 'Low' | 'Medium' | 'High'
    riskNote: string
  }
  skillScores: Array<{
    skill: string
    score: number
    requiredScore: number
  }>
  evidencePoints: Array<{
    id: string
    claim: string
    category: string
    sourceType: string
    sourceDocumentName: string
    sourceLocation: string
    quoteSnippet?: string
    supportLevel: 'Supported' | 'Partial' | 'Not supported'
    confidence: number
    notes?: string
  }>
  coverageDistribution: {
    totalClaims: number
    supportedCount: number
    partialCount: number
    notSupportedCount: number
    supportedPercentage: number
  }
  strengths: string[]
  concerns: string[]
}

interface ClientDebateSession {
  currentRound: number
  maxRounds: number
  messages: Array<{ id: string; agentName: string; agentRole: string; tone: string; text: string; referencedEvidenceLabel?: string; isConsensus?: boolean }>
  revisions: Array<{ id: string; agentName: string; previousScore: number; revisedScore: number; reason: string }>
  consensus?: { agreementConfidence: number; verdictRecommendation: string; summary: string; caveat?: string; unresolvedDisagreement?: string; participatingAgentsCount: number; evidenceReferencesCount: number }
}

interface ClientDecision {
  verdict: 'advance' | 'hold' | 'reject'
  verdictTitle: string
  finalScore: number
  overallConfidence: number
  agentConsensusSummary: string
  unresolvedQuestion: string
  rationale: string
  strengths: string[]
  keyEvidence: string[]
  concerns: string[]
  recommendedFocusAreas: string[]
  humanDecision?: 'advance' | 'hold' | 'reject'
}

function UploadField({
  label,
  hint,
  required = true,
  onChange,
  selectedFileName,
}: {
  label: string
  hint: string
  required?: boolean
  onChange?: (file: File | null) => void
  selectedFileName?: string
}) {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onChange?.(e.target.files[0])
    } else {
      onChange?.(null)
    }
  }

  return (
    <label className="upload-field">
      <span>
        {label}
        {required && <em>Required</em>}
      </span>
      <div className="upload-zone">
        <FileText size={18} />
        <div>
          <strong>{selectedFileName ? selectedFileName : 'Upload PDF'}</strong>
          <span>{selectedFileName ? 'PDF file selected' : hint}</span>
        </div>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
        />
      </div>
    </label>
  )
}

const defaultAgents = [
  { name: 'Atlas', role: 'Technical', color: 'indigo', icon: BrainCircuit, score: 94, confidence: 'High' },
  { name: 'Sage', role: 'HR / Culture', color: 'violet', icon: Users, score: 88, confidence: 'High' },
  { name: 'Vector', role: 'Hiring Manager', color: 'blue', icon: Zap, score: 91, confidence: 'Medium' },
  { name: 'Quill', role: 'Skeptic', color: 'coral', icon: ShieldCheck, score: 76, confidence: 'Medium' },
]

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="brand-mark">
        <span />
        <span />
        <span />
      </div>
      <span className="text-[17px] font-semibold tracking-[-0.03em] text-[#14213d]">
        Recruit<span className="text-[#5266d8]">fy</span>
      </span>
    </div>
  )
}

function Avatar({
  candidate,
  small = false,
}: {
  candidate: ClientCandidate
  small?: boolean
}) {
  return (
    <div
      className={`avatar avatar-${candidate.color || 'indigo'} ${
        small ? 'avatar-sm' : ''
      }`}
    >
      {candidate.initials}
    </div>
  )
}

function Score({
  value,
  size = 'normal',
}: {
  value: number
  size?: 'normal' | 'large'
}) {
  return (
    <div
      className={`score-ring ${size === 'large' ? 'score-ring-lg' : ''}`}
      style={{ '--score': `${value * 3.6}deg` } as React.CSSProperties}
    >
      <span>{value}</span>
    </div>
  )
}

function Pill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: string
}) {
  return <span className={`pill pill-${tone}`}>{children}</span>
}

function Header({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string
  title: string
  subtitle: string
  action?: React.ReactNode
}) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  )
}

function Sidebar({
  view,
  setView,
  roomsCount,
}: {
  view: View
  setView: (v: View) => void
  roomsCount: number
}) {
  const items: [View, string, any][] = [
    ['dashboard', 'Overview', LayoutDashboard],
    ['room', 'Hiring rooms', BriefcaseBusiness],
    ['candidate', 'Candidates', Users],
    ['compare', 'Analysis', GitCompareArrows],
    ['recommendation', 'Recommendations', Sparkles],
  ]

  return (
    <aside className="sidebar">
      <div className="px-6 pt-7">
        <Brand />
      </div>
      <div className="nav-group">
        <div className="nav-label">Workspace</div>
        {items.map(([key, label, Icon]) => (
          <button
            key={key}
            className={`nav-item ${view === key ? 'active' : ''}`}
            onClick={() => setView(key)}
          >
            <Icon size={17} strokeWidth={1.8} />
            {label}
            {key === 'room' && <span className="nav-count">{roomsCount}</span>}
          </button>
        ))}
      </div>
      <div className="sidebar-bottom">
        <div className="help-box">
          <CircleHelp size={17} />
          <div>
            <strong>Need a hand?</strong>
            <span>Read the quick guide</span>
          </div>
          <ChevronRight size={15} />
        </div>
        <button className="nav-item">
          <MoreHorizontal size={17} />
          Settings
        </button>
        <div className="user-row">
          <div className="user-avatar">AK</div>
          <div>
            <strong>Alex Kim</strong>
            <span>Administrator</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

function Topbar({
  view,
  onMenu,
  activeRoomTitle,
}: {
  view: View
  onMenu: () => void
  activeRoomTitle?: string
}) {
  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={onMenu}>
        <Menu size={20} />
      </button>
      <div className="breadcrumbs">
        <span>Workspace</span>
        <ChevronRight size={14} />
        <strong>
          {view === 'room' ||
          view === 'candidate' ||
          view === 'compare' ||
          view === 'recommendation'
            ? activeRoomTitle || 'Senior ML Engineer · New York'
            : 'Overview'}
        </strong>
      </div>
      <div className="top-actions">
        <div className="search">
          <Search size={16} />
          <span>Search anything</span>
          <kbd>⌘ K</kbd>
        </div>
        <button className="icon-button">
          <Bell size={18} />
          <i />
        </button>
        <div className="top-avatar">AK</div>
      </div>
    </header>
  )
}

function Progress({
  stage,
  setStage,
}: {
  stage: Stage
  setStage: (s: Stage) => void
}) {
  const stages: [Stage, string, string][] = [
    ['upload', '01', 'Upload'],
    ['profile', '02', 'Profile'],
    ['evidence', '03', 'Evidence'],
    ['agents', '04', 'Agents'],
    ['debate', '05', 'Debate'],
    ['final', '06', 'Decision'],
  ]
  return (
    <div className="analysis-progress">
      {stages.map(([key, num, label], i) => (
        <button
          key={key}
          className={stage === key ? 'current' : ''}
          onClick={() => setStage(key)}
        >
          <span>{stage === key ? <Check size={13} /> : num}</span>
          <strong>{label}</strong>
          {i < stages.length - 1 && <i />}
        </button>
      ))}
    </div>
  )
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: any
}) {
  return (
    <div className="metric-card">
      <div className="metric-icon lavender">
        <Icon size={18} />
      </div>
      <div>
        <div className="metric-label">{label}</div>
        <div className="metric-value">{value}</div>
        <div className="metric-change">↗ 8% vs last month</div>
      </div>
    </div>
  )
}

function Dashboard({
  setView,
  rooms,
  onSelectRoom,
}: {
  setView: (v: View) => void
  rooms: ClientRoom[]
  onSelectRoom: (roomId: string) => void
}) {
  const totalCandidates = rooms.reduce((acc, r) => acc + (r.candidateCount || 0), 0)

  return (
    <>
      <Header
        eyebrow="Monday, August 26, 2024"
        title="Good morning, Alex"
        subtitle="Here’s the signal across your hiring workspace."
        action={
          <button className="primary-button" onClick={() => setView('create')}>
            <Plus size={17} />
            Create hiring room
          </button>
        }
      />
      <div className="metrics-grid">
        <Metric
          label="Active hiring rooms"
          value={rooms.length.toString()}
          icon={BriefcaseBusiness}
        />
        <Metric
          label="Candidates in review"
          value={totalCandidates.toString()}
          icon={Users}
        />
        <Metric
          label="Avg. decision confidence"
          value="87%"
          icon={Gauge}
        />
        <Metric
          label="Time saved this month"
          value="31h"
          icon={Zap}
        />
      </div>
      <div className="section-heading">
        <div>
          <h2>Active hiring rooms</h2>
          <p>Continue where you left off.</p>
        </div>
      </div>
      <div className="rooms-grid">
        {rooms.map((room, index) => (
          <button
            key={room.id}
            className={`room-card text-left ${index === 0 ? 'featured' : ''}`}
            onClick={() => {
              onSelectRoom(room.id)
              setView('room')
            }}
          >
            <div className="room-top">
              <Pill tone={room.status === 'in_progress' ? 'live' : room.status === 'needs_review' ? 'review' : 'neutral'}>
                {room.status === 'in_progress' && <span className="pulse" />}
                {room.status === 'in_progress'
                  ? 'In progress'
                  : room.status === 'needs_review'
                  ? 'Needs review'
                  : 'Active'}
              </Pill>
              <MoreHorizontal size={18} />
            </div>
            <div className={`room-icon ${index === 1 ? 'room-icon-blue' : ''}`}>
              {index === 0 ? <Network size={20} /> : <BriefcaseBusiness size={20} />}
            </div>
            <h3>{room.title}</h3>
            <p>
              {room.location} · {room.department}
            </p>
            <div className="room-footer">
              <span>
                <Users size={15} /> {room.candidateCount} candidates
              </span>
              <span>{room.analysisProgress}% analyzed</span>
            </div>
            <div className="room-progress">
              <div>
                <span style={{ width: `${room.analysisProgress}%` }} />
              </div>
              <b>{room.analysisProgress}%</b>
            </div>
          </button>
        ))}
      </div>
    </>
  )
}

function CandidateCard({
  candidate,
  setView,
  onSelectCandidate,
}: {
  candidate: ClientCandidate
  setView: (v: View) => void
  onSelectCandidate: (candidate: ClientCandidate) => void
}) {
  return (
    <button
      className="candidate-card text-left"
      onClick={() => {
        onSelectCandidate(candidate)
        setView('candidate')
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar candidate={candidate} />
          <div>
            <strong>{candidate.name}</strong>
            <span>{candidate.role}</span>
          </div>
        </div>
        <MoreHorizontal size={17} />
      </div>
      <div className="candidate-summary">{candidate.summary}</div>
      <div className="candidate-scores">
        <span>
          Technical{' '}
          <b>
            {candidate.name === 'Maya Chen'
              ? 96
              : candidate.name === 'Jordan Bell'
              ? 88
              : candidate.score || 81}
          </b>
        </span>
        <span>
          HR / Culture{' '}
          <b>
            {candidate.name === 'Maya Chen'
              ? 88
              : candidate.name === 'Jordan Bell'
              ? 89
              : 82}
          </b>
        </span>
        <span>
          Manager{' '}
          <b>
            {candidate.name === 'Maya Chen'
              ? 91
              : candidate.name === 'Jordan Bell'
              ? 89
              : 82}
          </b>
        </span>
        <span>
          Skeptic{' '}
          <b>
            {candidate.name === 'Maya Chen'
              ? 76
              : candidate.name === 'Jordan Bell'
              ? 80
              : 74}
          </b>
        </span>
      </div>
      <div className="candidate-card-footer">
        <Pill tone={candidate.color === 'indigo' ? 'strong' : 'neutral'}>
          {candidate.status}
        </Pill>
        <span>{candidate.progress}</span>
        <Score value={candidate.score || 85} />
      </div>
    </button>
  )
}

function Room({
  setView,
  room,
  candidates,
  onCandidateAdded,
  onSelectCandidate,
}: {
  setView: (v: View) => void
  room: ClientRoom
  candidates: ClientCandidate[]
  onCandidateAdded: (newCand: ClientCandidate) => void
  onSelectCandidate: (cand: ClientCandidate) => void
}) {
  const [adding, setAdding] = useState(false)
  const [newCandidateName, setNewCandidateName] = useState('')
  const [newCandidateRole, setNewCandidateRole] = useState(room.role || room.title)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddCandidate = async (e: FormEvent) => {
    e.preventDefault()
    if (!newCandidateName.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('name', newCandidateName.trim())
      formData.append('role', newCandidateRole.trim() || room.role || room.title)
      if (resumeFile) {
        formData.append('resume', resumeFile)
      }
      if (transcriptFile) {
        formData.append('transcript', transcriptFile)
      }

      const res = await fetch(`/api/rooms/${room.id}/candidates`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          onCandidateAdded(json.data)
          setAdding(false)
          setNewCandidateName('')
          setResumeFile(null)
          setTranscriptFile(null)
        }
      }
    } catch (err) {
      console.error('Failed to add candidate:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Header
        eyebrow="Hiring room · In progress"
        title={room.title}
        subtitle={`${room.location} · ${room.department} · Created Aug 18, 2024`}
        action={
          <button className="primary-button" onClick={() => setView('compare')}>
            <GitCompareArrows size={16} />
            Compare candidates
          </button>
        }
      />
      <div className="room-tabs">
        <button className="selected">Overview</button>
        <button>
          Candidates <span>{candidates.length}</span>
        </button>
        <button onClick={() => setView('compare')}>Analysis</button>
      </div>
      <div className="panel room-summary">
        <div>
          <div className="eyebrow">Shared hiring room context</div>
          <h2>Strong signal, one open question</h2>
          <p>
            The candidate pool is evaluated against one shared job description.
            Review each candidate’s evidence trail and independent panel before
            comparing the final signals.
          </p>
          <div className="shared-jd">
            <FileText size={16} />
            <div>
              <strong>
                {room.jobDescriptionFileName || 'senior-ml-engineer-jd.pdf'}
              </strong>
              <span>Shared job description · Uploaded at room creation</span>
            </div>
            <Pill tone="live">Ready</Pill>
          </div>
        </div>
        <div className="signal-bar">
          <div>
            <span>Analysis progress</span>
            <b>{room.analysisProgress}%</b>
          </div>
          <div className="signal-track">
            <span style={{ width: `${room.analysisProgress}%` }} />
          </div>
        </div>
      </div>
      <div className="section-heading">
        <div>
          <h2>Candidate pipeline</h2>
          <p>Each candidate owns a resume and interview transcript.</p>
        </div>
        <div className="section-actions">
          <Pill tone="neutral">{candidates.length} analyzed</Pill>
          <button className="secondary-button" onClick={() => setAdding(true)}>
            <Plus size={15} />
            Add candidate
          </button>
          <button className="primary-button" onClick={() => setView('compare')}>
            <GitCompareArrows size={15} />
            Compare candidates
          </button>
        </div>
      </div>
      <div className="candidates-grid">
        {candidates.map((c) => (
          <CandidateCard
            key={c.id || c.name}
            candidate={c}
            setView={setView}
            onSelectCandidate={onSelectCandidate}
          />
        ))}
      </div>
      {adding && (
        <div className="modal-backdrop" onClick={() => setAdding(false)}>
          <div
            className="modal-card panel"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleAddCandidate}>
              <div className="panel-title">
                <div>
                  <div className="eyebrow">Hiring room · Candidate intake</div>
                  <h2>Add candidate</h2>
                  <p>Assign both documents to one candidate.</p>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setAdding(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="form-grid">
                <label>
                  Candidate name
                  <input
                    placeholder="e.g. Taylor Morgan"
                    value={newCandidateName}
                    onChange={(e) => setNewCandidateName(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Role
                  <input
                    value={newCandidateRole}
                    onChange={(e) => setNewCandidateRole(e.target.value)}
                  />
                </label>
              </div>
              <div className="upload-grid">
                <UploadField
                  label="Resume PDF"
                  hint="Candidate resume"
                  selectedFileName={resumeFile?.name}
                  onChange={setResumeFile}
                />
                <UploadField
                  label="Interview transcript PDF"
                  hint="Structured interview notes"
                  selectedFileName={transcriptFile?.name}
                  onChange={setTranscriptFile}
                />
              </div>
              <div className="create-footer">
                <span>
                  <ShieldCheck size={15} />
                  Documents stay attached to this candidate.
                </span>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={isSubmitting || !newCandidateName.trim()}
                >
                  {isSubmitting ? 'Adding...' : 'Add candidate'}{' '}
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function AgentRow({ agent }: { agent: (typeof defaultAgents)[number] }) {
  const Icon = agent.icon
  return (
    <div className="agent-row">
      <div className={`agent-icon ${agent.color}`}>
        <Icon size={17} />
      </div>
      <div className="agent-copy">
        <strong>{agent.name}</strong>
        <span>{agent.role}</span>
      </div>
      <div className="agent-progress">
        <div>
          <span style={{ width: `${agent.score}%` }} />
        </div>
        <b>{agent.score}</b>
      </div>
      <Pill tone="neutral">{agent.confidence}</Pill>
    </div>
  )
}

function CandidateView({
  setView,
  candidate,
  onCandidateUpdated,
}: {
  setView: (v: View) => void
  candidate: ClientCandidate
  onCandidateUpdated?: (updated: ClientCandidate) => void
}) {
  const [stage, setStage] = useState<Stage>(candidate.stage || 'upload')
  const [analysis, setAnalysis] = useState<ClientCandidateAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  // Fetch analysis for active candidate on load or selection
  useEffect(() => {
    let isMounted = true
    async function loadAnalysis() {
      try {
        const res = await fetch(`/api/candidates/${candidate.id}/analysis`)
        if (res.ok) {
          const json = await res.json()
          if (json.data && isMounted) {
            setAnalysis(json.data)
          }
        }
      } catch (err) {
        console.error('Error fetching candidate analysis:', err)
      }
    }
    loadAnalysis()
    return () => {
      isMounted = false
    }
  }, [candidate.id])

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true)
    setAnalysisError(null)
    try {
      const res = await fetch(`/api/candidates/${candidate.id}/analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceReanalyze: true }),
      })

      const json = await res.json()
      if (res.ok && json.data) {
        const ana = json.data as ClientCandidateAnalysis
        setAnalysis(ana)
        if (onCandidateUpdated) {
          onCandidateUpdated({
            ...candidate,
            score: ana.overallFitScore,
            status: ana.overallFitScore >= 90 ? 'Strong fit' : ana.overallFitScore >= 80 ? 'Good fit' : 'Potential fit',
            summary: ana.summary,
            strengths: ana.strengths,
            concern: ana.concerns?.[0] || candidate.concern,
            progress: 'Complete',
            stage: 'profile',
          })
        }
        setStage('profile')
      } else {
        setAnalysisError(
          json.error?.message || 'Failed to generate analysis with Gemini. Please try again.'
        )
      }
    } catch (err) {
      setAnalysisError(
        err instanceof Error ? err.message : 'Network error during Gemini analysis.'
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <>
      <button className="back-button" onClick={() => setView('room')}>
        <ArrowLeft size={15} />
        Back to hiring room
      </button>
      <div className="candidate-hero">
        <div className="flex items-center gap-4">
          <Avatar candidate={candidate} />
          <div>
            <div className="eyebrow">
              Candidate analysis · {candidate.role}
            </div>
            <h1>{candidate.name}</h1>
            <p>
              {candidate.role} · {candidate.location || 'San Francisco, CA'} ·{' '}
              <span className="green-text">
                {candidate.availability || 'Available in 1 month'}
              </span>
            </p>
          </div>
        </div>
        <Pill tone="strong">{candidate.status || 'Strong fit'}</Pill>
      </div>
      <Progress stage={stage} setStage={setStage} />
      {stage === 'upload' && (
        <CandidateUploads
          candidate={candidate}
          setStage={setStage}
          onBuildProfile={handleRunAnalysis}
          isAnalyzing={isAnalyzing}
          analysisError={analysisError}
        />
      )}
      {stage === 'profile' && (
        <Profile
          candidate={candidate}
          analysis={analysis}
          setStage={setStage}
        />
      )}
      {stage === 'evidence' && (
        <EvidenceStage
          candidate={candidate}
          analysis={analysis}
          setStage={setStage}
        />
      )}
      {stage === 'agents' && (
        <Agents candidateId={candidate.id} setStage={setStage} />
      )}
      {stage === 'debate' && <Debate candidateId={candidate.id} setStage={setStage} />}
      {stage === 'final' && (
        <FinalAssessment candidate={candidate} setView={setView} />
      )}
    </>
  )
}

function CandidateUploads({
  candidate,
  setStage,
  onBuildProfile,
  isAnalyzing = false,
  analysisError = null,
}: {
  candidate: ClientCandidate
  setStage: (s: Stage) => void
  onBuildProfile?: () => void
  isAnalyzing?: boolean
  analysisError?: string | null
}) {
  const resumeHint =
    candidate.resumeFileName ||
    `${candidate.name.toLowerCase().replace(/\s+/g, '-')}-resume.pdf`
  const transHint =
    candidate.transcriptFileName ||
    `${candidate.name.toLowerCase().replace(/\s+/g, '-')}-interview.pdf`

  return (
    <div className="panel upload-review">
      <div className="eyebrow">01 · Candidate documents</div>
      <h2>Assign documents to {candidate.name}</h2>
      <p className="large-copy">
        These files are analyzed against the shared Senior ML Engineer job
        description. No other candidate can inherit these documents.
      </p>
      <div className="upload-grid">
        <UploadField
          label="Resume PDF"
          hint={resumeHint}
          selectedFileName={candidate.resumeFileName}
        />
        <UploadField
          label="Interview transcript PDF"
          hint={transHint}
          selectedFileName={candidate.transcriptFileName}
        />
      </div>
      <div className="document-note">
        <Check size={15} />
        Both documents are ready for Gemini analysis.
      </div>
      {analysisError && (
        <div style={{ color: '#ef8a79', fontSize: '12px', marginTop: '12px' }}>
          <strong>Analysis Error:</strong> {analysisError}
        </div>
      )}
      <div style={{ marginTop: '20px' }}>
        <button
          className="primary-button"
          onClick={() => {
            if (onBuildProfile) {
              onBuildProfile()
            } else {
              setStage('profile')
            }
          }}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <span className="pulse" /> Analyzing with Gemini...
            </>
          ) : (
            <>
              Build candidate profile <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function EvidenceStage({
  candidate,
  analysis,
  setStage,
}: {
  candidate: ClientCandidate
  analysis: ClientCandidateAnalysis | null
  setStage: (s: Stage) => void
}) {
  const evidenceList =
    analysis && analysis.evidencePoints && analysis.evidencePoints.length > 0
      ? analysis.evidencePoints
      : candidate.strengths && candidate.strengths.length > 0
      ? candidate.strengths.map((s, idx) => ({
          id: `ev-${idx}`,
          claim: s,
          category: 'Core Competency',
          sourceType: 'resume',
          sourceDocumentName: 'Resume',
          sourceLocation: [
            'Resume · Project history · p. 2',
            'Interview transcript · Technical deep dive',
            'Interview transcript · Leadership example',
          ][idx % 3],
          quoteSnippet: '',
          supportLevel: 'Supported' as const,
          confidence: 90,
        }))
      : [
          {
            id: 'ev-1',
            claim: 'Distributed systems',
            category: 'Architecture',
            sourceType: 'resume',
            sourceDocumentName: 'Resume',
            sourceLocation: 'Resume · Project history · p. 2',
            quoteSnippet: 'Led real-time inference migration with 68% latency reduction.',
            supportLevel: 'Supported' as const,
            confidence: 96,
          },
        ]

  return (
    <div className="analysis-grid">
      <div className="panel">
        <div className="eyebrow">03 · Evidence trail</div>
        <h2>Claims linked to source material</h2>
        <p className="large-copy">
          Recruitfy found {analysis?.evidencePoints?.length || 24} evidence points
          across {candidate.name}&apos;s resume and interview transcript.
        </p>
        {evidenceList.map((ev, i) => (
          <div className="evidence-row" key={ev.id || i}>
            <div className={`evidence-number n${i % 3}`}>{i + 1}</div>
            <div>
              <strong>{ev.claim}</strong>
              <p>
                {ev.sourceLocation}
                {ev.quoteSnippet ? ` — “${ev.quoteSnippet}”` : ''}
              </p>
            </div>
            {ev.supportLevel === 'Supported' ? (
              <Check size={15} className="green-text" />
            ) : (
              <ShieldCheck size={15} className="warn-icon" />
            )}
          </div>
        ))}
        <button className="primary-button" onClick={() => setStage('agents')}>
          Review independent panel <ArrowRight size={16} />
        </button>
      </div>
      <div className="panel">
        <div className="eyebrow">Shared context</div>
        <h2>Evidence is role-specific</h2>
        <p className="large-copy">
          Every claim is evaluated against the same job description for this
          hiring room, while the candidate&apos;s documents remain individually
          assigned.
        </p>
        <Pill tone="live">JD match active</Pill>
      </div>
    </div>
  )
}

function Profile({
  candidate,
  analysis,
  setStage,
}: {
  candidate: ClientCandidate
  analysis: ClientCandidateAnalysis | null
  setStage: (s: Stage) => void
}) {
  const [showFullAnalysis, setShowFullAnalysis] = useState(false)

  const skills =
    analysis && analysis.skillScores && analysis.skillScores.length > 0
      ? analysis.skillScores.map((s) => [s.skill, s.score, s.requiredScore || 85])
      : [
          ['Distributed systems', 96, 94],
          ['Model evaluation', 91, 90],
          ['Technical leadership', 86, 85],
          ['MLOps & infrastructure', 82, 80],
          ['Team management', 58, 75],
        ]

  const totalClaims = analysis?.coverageDistribution?.totalClaims || 24
  const supportedCount = analysis?.coverageDistribution?.supportedCount || 18
  const partialCount = analysis?.coverageDistribution?.partialCount || 5
  const notSupportedCount = analysis?.coverageDistribution?.notSupportedCount || 1

  const distribution = [
    ['Supported', supportedCount, 'mint'],
    ['Partial', partialCount, 'blue'],
    ['Not supported', notSupportedCount, 'coral'],
  ]

  const fitScoreValue = analysis?.overallFitScore || candidate.score || 92
  const decisionConfidenceValue = analysis?.decisionConfidence || 87
  const jdMatchScore = analysis?.roleAlignment?.overallMatchScore || 92
  const techScore = analysis?.roleAlignment?.technicalSkillsScore || 94
  const expScore = analysis?.roleAlignment?.experienceMatchScore || 89
  const evCoverageScore = analysis?.roleAlignment?.evidenceCoverageScore || 96
  const riskNote = analysis?.roleAlignment?.riskNote || 'Low · one open question'

  const strengthsList =
    analysis && analysis.strengths && analysis.strengths.length > 0
      ? analysis.strengths
      : candidate.strengths && candidate.strengths.length > 0
      ? candidate.strengths
      : ['Technical depth', 'Evaluation rigor', 'Leadership influence']

  const concernsList =
    analysis && analysis.concerns && analysis.concerns.length > 0
      ? analysis.concerns
      : candidate.concern
      ? [candidate.concern]
      : ['Management scale']

  const evidencePoints = analysis?.evidencePoints || []

  if (showFullAnalysis) {
    return (
      <div className="analysis-grid">
        <div className="panel full-analysis">
          <div className="eyebrow">Full AI analysis · Evidence view</div>
          <div className="panel-title">
            <div>
              <h2>Why {candidate.name} is a {candidate.status || 'strong fit'}</h2>
              <p>Detailed reasoning behind the visual summary.</p>
            </div>
            <button
              className="secondary-button"
              onClick={() => setShowFullAnalysis(false)}
            >
              <ArrowLeft size={15} />
              Back to visual summary
            </button>
          </div>
          <p className="analysis-prose">
            {analysis?.summary || candidate.summary}
          </p>
          <div className="analysis-callout">
            <Check size={16} />
            <div>
              <b>Evidence-weighted conclusion</b>
              <span>
                {analysis?.evidenceWeightedConclusion ||
                  'Advance to final interview. Validate people-management scope and team scaling in one focused conversation.'}
              </span>
            </div>
          </div>
          {evidencePoints.slice(0, 3).map((ev, idx) => (
            <div className="evidence-row" key={ev.id || idx}>
              <div className={`evidence-number n${idx % 3}`}>{idx + 1}</div>
              <div>
                <strong>{ev.claim}</strong>
                <p>
                  {ev.sourceLocation}
                  {ev.quoteSnippet ? ` — ${ev.quoteSnippet}` : ''}
                </p>
              </div>
              {ev.supportLevel === 'Supported' ? (
                <Check size={15} className="green-text" />
              ) : (
                <ShieldCheck size={15} className="warn-icon" />
              )}
            </div>
          ))}
          <button
            className="primary-button"
            onClick={() => setStage('agents')}
          >
            Review independent panel <ArrowRight size={16} />
          </button>
        </div>
        <div className="panel">
          <div className="eyebrow">Source coverage</div>
          <h2>Evidence remains traceable</h2>
          <p className="large-copy">
            {totalClaims} evidence points were found across the resume and interview
            transcript. Each scored claim links back to a source location for
            recruiter review.
          </p>
          <Pill tone="live">{totalClaims} sources linked</Pill>
        </div>
      </div>
    )
  }

  return (
    <div className="visual-analysis">
      <div className="analysis-summary-grid">
        <div className="panel fit-score-card">
          <div className="eyebrow">01 · Candidate intelligence</div>
          <div className="fit-score-content">
            <div
              className="score-ring score-ring-xl"
              style={
                { '--score': `${fitScoreValue * 3.6}deg` } as React.CSSProperties
              }
            >
              <span>{fitScoreValue}</span>
            </div>
            <div>
              <h2>Overall fit</h2>
              <p>Evidence-weighted match</p>
              <Pill tone="strong">{candidate.status || 'Strong fit'}</Pill>
            </div>
          </div>
          <div className="fit-meta">
            <span>
              <b>{decisionConfidenceValue}%</b> decision confidence
            </span>
            <span>
              <Check size={13} />
              {totalClaims} evidence points
            </span>
          </div>
        </div>
        <div className="panel match-card">
          <div className="panel-title">
            <div>
              <div className="eyebrow">Role alignment</div>
              <h2>JD match score</h2>
            </div>
            <b className="headline-score">{jdMatchScore}%</b>
          </div>
          <div className="mini-ring-row">
            <div
              className="mini-ring"
              style={{ '--score': `${jdMatchScore * 3.6}deg` } as React.CSSProperties}
            >
              <span>{jdMatchScore}</span>
            </div>
            <div className="match-lines">
              <ScoreLine label="Technical skills" value={techScore} />
              <ScoreLine label="Experience match" value={expScore} />
              <ScoreLine label="Evidence coverage" value={evCoverageScore} />
            </div>
          </div>
          <div className="risk-strip">
            <span>Risk level</span>
            <b>
              <i />
              {riskNote}
            </b>
          </div>
        </div>
      </div>
      <div className="panel skills-panel">
        <div className="panel-title">
          <div>
            <div className="eyebrow">Requirement coverage</div>
            <h2>Skill-by-skill match</h2>
            <p>Candidate strength against role requirements.</p>
          </div>
          <Pill tone="live">{totalClaims} sources</Pill>
        </div>
        <div className="skill-chart">
          {skills.map(([label, value, req]) => (
            <div className="skill-row" key={label as string}>
              <div>
                <span>{label as string}</span>
                <b>{value as number}</b>
              </div>
              <div className="skill-track">
                <i style={{ width: `${value}%` }} />
                <em style={{ left: `${req || 85}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="chart-legend">
          <span>
            <i className="legend-fill" />
            Candidate strength
          </span>
          <span>
            <i className="legend-marker" />
            JD requirement
          </span>
        </div>
      </div>
      <div className="analysis-lower-grid">
        <div className="panel">
          <div className="eyebrow">Signal breakdown</div>
          <h2>Strengths vs concerns</h2>
          <div className="strength-concern">
            <div className="strength-column">
              <strong>
                <Check size={14} />
                Strengths
              </strong>
              <b>{strengthsList.length}</b>
              {strengthsList.slice(0, 3).map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
            <div className="concern-column">
              <strong>
                <ShieldCheck size={14} />
                Concerns
              </strong>
              <b>{concernsList.length}</b>
              {concernsList.slice(0, 3).map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">Evidence status</div>
              <h2>Coverage distribution</h2>
            </div>
            <b className="headline-score">
              {Math.round((supportedCount / (totalClaims || 1)) * 100)}%
            </b>
          </div>
          <div className="distribution-chart">
            {distribution.map(([label, value, tone]) => (
              <div className="distribution-row" key={label as string}>
                <div>
                  <span>{label as string}</span>
                  <b>{value as number}</b>
                </div>
                <div className="distribution-track">
                  <i
                    className={tone as string}
                    style={{
                      width: `${((value as number) / (totalClaims || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="distribution-total">
            <span>{totalClaims} total claims</span>
            <span>{supportedCount} fully supported</span>
          </div>
        </div>
      </div>
      <div className="analysis-lower-grid">
        <div className="panel agent-score-panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">Independent panel</div>
              <h2>Agent score visualization</h2>
            </div>
            <Pill tone="neutral">4 agents</Pill>
          </div>
          {defaultAgents.map((a) => (
            <div className="agent-score-line" key={a.name}>
              <div className={`agent-icon ${a.color}`}>
                <a.icon size={15} />
              </div>
              <span>
                {a.name}
                <small>{a.role}</small>
              </span>
              <div className="agent-score-track">
                <i className={a.color} style={{ width: `${a.score}%` }} />
              </div>
              <b>{a.score}</b>
            </div>
          ))}
        </div>
        <div className="panel consensus-panel">
          <div className="eyebrow">Panel alignment</div>
          <h2>Consensus visualization</h2>
          <div className="consensus-visual">
            <div className="consensus-bars">
              <i style={{ height: '94%' }} />
              <i style={{ height: '88%' }} />
              <i style={{ height: '91%' }} />
              <i className="coral" style={{ height: '76%' }} />
            </div>
            <div>
              <b>87%</b>
              <span>agreement confidence</span>
              <small>Spread of 18 pts · one caveat</small>
            </div>
          </div>
          <div className="consensus-track">
            <i style={{ width: '87%' }} />
          </div>
        </div>
      </div>
      <div className="analysis-cta">
        <div>
          <div className="eyebrow">Want the reasoning?</div>
          <strong>Review every claim, source, and debate revision.</strong>
        </div>
        <button
          className="primary-button"
          onClick={() => setShowFullAnalysis(true)}
        >
          Read Full AI Analysis <ArrowRight size={16} />
        </button>
      </div>
      <button className="primary-button" onClick={() => setStage('agents')}>
        Review independent panel <ArrowRight size={16} />
      </button>
    </div>
  )
}

function ScoreLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-line">
      <span>{label}</span>
      <b>{value}%</b>
      <div>
        <i style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

interface ClientAgentEvaluation {
  id: string
  agentId: string
  agentName: string
  agentRole: string
  agentColor: 'indigo' | 'violet' | 'blue' | 'coral' | string
  score: number
  confidence: string
  reasoning: string
  strengths: string[]
  concerns: string[]
  referencedEvidenceIds: string[]
  status: string
}

const agentIcons = {
  atlas: BrainCircuit,
  sage: Users,
  vector: Zap,
  quill: ShieldCheck,
} as const

function toAgentRow(evaluation: ClientAgentEvaluation): (typeof defaultAgents)[number] {
  const iconKey = evaluation.agentId as keyof typeof agentIcons
  return {
    name: evaluation.agentName,
    role: evaluation.agentRole,
    color: evaluation.agentColor || 'indigo',
    icon: agentIcons[iconKey] || BrainCircuit,
    score: evaluation.score,
    confidence: evaluation.confidence,
  }
}

function Agents({
  candidateId,
  setStage,
}: {
  candidateId: string
  setStage: (s: Stage) => void
}) {
  const [evaluations, setEvaluations] = useState<ClientAgentEvaluation[]>([])
  const [isEvaluating, setIsEvaluating] = useState(true)
  const [evaluationError, setEvaluationError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadEvaluations() {
      setIsEvaluating(true)
      setEvaluationError(null)
      try {
        const existingRes = await fetch(`/api/candidates/${candidateId}/evaluations`)
        const existingJson = await existingRes.json()
        const existing = (existingJson.data || []) as ClientAgentEvaluation[]
        const completed = existing.filter((evaluation) => evaluation.status === 'completed')

        if (completed.length >= 4 && isMounted) {
          setEvaluations(completed)
          setIsEvaluating(false)
          return
        }

        const res = await fetch(`/api/candidates/${candidateId}/evaluations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateId }),
        })
        const json = await res.json()
        if (!isMounted) return

        if (res.ok && Array.isArray(json.data)) {
          setEvaluations(json.data)
        } else {
          setEvaluationError(
            json.error?.message || 'Failed to generate independent agent evaluations.'
          )
        }
      } catch (err) {
        if (isMounted) {
          setEvaluationError(
            err instanceof Error ? err.message : 'Network error during agent evaluations.'
          )
        }
      } finally {
        if (isMounted) setIsEvaluating(false)
      }
    }

    loadEvaluations()
    return () => {
      isMounted = false
    }
  }, [candidateId])

  const panelAgents =
    evaluations.length > 0
      ? evaluations.map((evaluation) => {
          const row = toAgentRow(evaluation)
          return { evaluation, row }
        })
      : defaultAgents.map((row) => ({
          evaluation: {
            id: row.name,
            agentId: row.name.toLowerCase(),
            agentName: row.name,
            agentRole: row.role,
            agentColor: row.color,
            score: row.score,
            confidence: row.confidence,
            reasoning:
              row.name === 'Quill'
                ? 'The team-scaling claim needs stronger corroboration before advancing.'
                : 'Evidence is specific, recent, and directly relevant to the role scope.',
            strengths: [row.name === 'Atlas' ? 'Technical depth' : 'Clear communication'],
            concerns: [row.name === 'Quill' ? 'Management scale' : 'Role transition risk'],
            referencedEvidenceIds: [],
            status: isEvaluating ? 'in_progress' : 'pending',
          } as ClientAgentEvaluation,
          row,
        }))

  const completedCount = evaluations.filter((evaluation) => evaluation.status === 'completed').length

  return (
    <>
      <div className="panel independent-banner">
        <ShieldCheck size={19} />
        <div>
          <strong>Independent reasoning</strong>
          <span>Agents cannot see each other’s conclusions before the debate.</span>
        </div>
        <Pill tone="live">
          {isEvaluating ? 'Evaluating…' : `${completedCount || panelAgents.length} / 4 complete`}
        </Pill>
      </div>
      {evaluationError && (
        <div className="panel">
          <strong>Evaluation Error:</strong> {evaluationError}
        </div>
      )}
      <div className="agent-panel-grid">
        {panelAgents.map(({ evaluation, row }) => (
          <div className="panel agent-detail" key={evaluation.id || row.name}>
            <AgentRow agent={row} />
            <div className="agent-detail-body">
              <div>
                <span>Reasoning</span>
                <p>
                  {isEvaluating && evaluations.length === 0
                    ? `${row.name} is forming an independent ${row.role.toLowerCase()} assessment.`
                    : evaluation.reasoning}
                </p>
              </div>
              <div className="detail-columns">
                <div>
                  <span>Strengths</span>
                  <b>{evaluation.strengths?.[0] || '—'}</b>
                </div>
                <div>
                  <span>Concerns</span>
                  <b>{evaluation.concerns?.[0] || '—'}</b>
                </div>
              </div>
            </div>
            <div className="confidence-line">
              <span>Confidence</span>
              <b>{evaluation.confidence}</b>
              <span className="ml-auto">
                {evaluation.referencedEvidenceIds?.length
                  ? `${evaluation.referencedEvidenceIds.length} evidence linked`
                  : 'Evidence linked'}
              </span>
              <Check size={14} />
            </div>
          </div>
        ))}
      </div>
      <button className="primary-button" disabled={isEvaluating || completedCount < 4} onClick={() => setStage('debate')}>
        Enter debate arena <MessageSquareText size={16} />
      </button>
    </>
  )
}

function Debate({ candidateId, setStage }: { candidateId: string; setStage: (s: Stage) => void }) {
  const [debate, setDebate] = useState<ClientDebateSession | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let mounted = true
    async function loadDebate() {
      try {
        let res = await fetch(`/api/candidates/${candidateId}/debate`)
        if (res.status === 404) res = await fetch(`/api/candidates/${candidateId}/debate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
        const json = await res.json()
        if (!mounted) return
        if (res.ok) setDebate(json.data)
        else setError(json.error?.message || 'Failed to run debate.')
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to run debate.')
      } finally { if (mounted) setLoading(false) }
    }
    loadDebate()
    return () => { mounted = false }
  }, [candidateId])
  const consensus = debate?.consensus
  return (
    <>
      <div className="panel debate-intro">
        <div>
          <div className="live-heading">
            <span className="pulse" />
            03 · Debate arena
          </div>
          <h2>Stress-test the independent signal</h2>
          <p>
            Only now can agents see one another’s reasoning and challenge the
            evidence.
          </p>
        </div>
        <Pill tone="neutral">{loading ? 'Debating…' : `Round ${debate?.currentRound || 0} of ${debate?.maxRounds || 3}`}</Pill>
      </div>
      {error && <div className="panel"><strong>Debate error:</strong> {error}</div>}
      <div className="debate-layout">
        <div className="panel transcript">
          <div className="messages">
            {debate?.messages.map((message) => message.isConsensus ? <div className="message consensus" key={message.id}><div className="consensus-icon"><Check size={17} /></div><div><div className="message-meta"><strong>Consensus</strong><span>{consensus?.unresolvedDisagreement ? 'Consensus with caveat' : 'Panel consensus'}</span></div><p>{message.text}</p></div></div> : <Message key={message.id} agent={message.agentName} role={message.agentRole} tone={message.tone} text={message.text} evidenceLabel={message.referencedEvidenceLabel} />)}
          </div>
          <div className="debate-footer">
            <span>{consensus?.participatingAgentsCount || 0} agents participated</span>
            <span>{consensus?.evidenceReferencesCount || 0} evidence references</span>
          </div>
        </div>
        <div className="panel debate-side">
          <div className="eyebrow">Opinion revisions</div>
          {debate?.revisions.map((revision) => <div className="revision" key={revision.id}><b>{revision.agentName}</b><span>{revision.previousScore} → {revision.revisedScore}</span><small>{revision.reason}</small></div>)}
          {consensus && <div className="revision"><b>Consensus</b><span>{consensus.agreementConfidence}% confidence</span><small>{consensus.verdictRecommendation}</small></div>}
          <button
            className="primary-button full"
            disabled={!debate || loading}
            onClick={() => setStage('final')}
          >
            View final assessment <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </>
  )
}

function Message({
  agent,
  role,
  tone,
  text,
  evidenceLabel,
}: {
  agent: string
  role: string
  tone: string
  text: string
  evidenceLabel?: string
}) {
  return (
    <div className="message">
      <div className={`agent-icon ${tone}`}>
        <BrainCircuit size={16} />
      </div>
      <div>
        <div className="message-meta">
          <strong>{agent}</strong>
          <span>{role}</span>
        </div>
        <p>{text}</p>
        {evidenceLabel && <small className="evidence-ref">{evidenceLabel}</small>}
      </div>
    </div>
  )
}

function FinalAssessment({
  candidate,
  setView,
}: {
  candidate: ClientCandidate
  setView: (v: View) => void
}) {
  const [decision, setDecision] = useState<ClientDecision | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let mounted = true
    async function loadDecision() {
      try {
        let res = await fetch(`/api/candidates/${candidate.id}/decision`)
        if (res.status === 404) res = await fetch(`/api/candidates/${candidate.id}/decision`, { method: 'POST' })
        const json = await res.json()
        if (!mounted) return
        if (res.ok) setDecision(json.data)
        else setError(json.error?.message || 'Failed to generate decision.')
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to generate decision.')
      } finally { if (mounted) setLoading(false) }
    }
    loadDecision()
    return () => { mounted = false }
  }, [candidate.id])
  const recordHumanDecision = async (humanDecision: ClientDecision['verdict']) => {
    const res = await fetch(`/api/candidates/${candidate.id}/decision`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ humanDecision }) })
    const json = await res.json()
    if (res.ok) setDecision(json.data)
    else setError(json.error?.message || 'Failed to record human decision.')
  }
  const displayed = decision
  return (
    <>
      {error && <div className="panel"><strong>Decision error:</strong> {error}</div>}
      <div className="panel final-verdict">
        <div className="verdict-top">
          <div>
            <div className="eyebrow">04 · Final candidate assessment</div>
            <h2>{loading ? 'Generating final assessment…' : displayed?.verdictTitle || 'Final assessment unavailable'}</h2>
            <p>Evidence-weighted verdict after independent review and debate.</p>
          </div>
          <Score value={displayed?.finalScore || candidate.score || 0} size="large" />
        </div>
        <div className="final-columns">
          <div>
            <span>Agent consensus</span>
            <b>{displayed?.agentConsensusSummary || '—'}</b>
          </div>
          <div>
            <span>Overall confidence</span>
            <b>{displayed?.overallConfidence ?? 0}%</b>
          </div>
          <div>
            <span>Unresolved</span>
            <b>{displayed?.unresolvedQuestion || '—'}</b>
          </div>
        </div>
      </div>
      <div className="analysis-grid">
        <div className="panel">
          <div className="eyebrow">Evidence-weighted reasoning</div>
          <h2>Why {candidate.name} is a strong fit</h2>
          <p className="large-copy">
            {displayed?.rationale || 'The evidence-weighted recommendation will appear after the debate concludes.'}
          </p>
          <div className="final-list">
            <div>
              <Check size={16} />
              <span>
                <b>Strengths</b> {displayed?.strengths.join(', ') || '—'}
              </span>
            </div>
            <div>
              <Check size={16} />
              <span>
                <b>Key evidence</b> {displayed?.keyEvidence.join(', ') || '—'}
              </span>
            </div>
            <div className="warn">
              <ShieldCheck size={16} />
              <span>
                <b>Concern</b> {displayed?.concerns.join(', ') || '—'}
              </span>
            </div>
          </div>
          <button className="primary-button" onClick={() => setView('room')}>
            <ArrowLeft size={16} />
            Back to hiring room
          </button>
          <div className="section-actions" style={{ marginTop: 12 }}>
            {(['advance', 'hold', 'reject'] as const).map((verdict) => <button key={verdict} className="secondary-button" disabled={!displayed} onClick={() => recordHumanDecision(verdict)}>{displayed?.humanDecision === verdict ? `Selected: ${verdict}` : verdict}</button>)}
          </div>
        </div>
        <div className="panel">
          <div className="eyebrow">Next decision</div>
          <h2>Ready for comparative analysis</h2>
          <p className="large-copy">
            Return to the hiring room to compare {candidate.name}’s completed
            assessment with every candidate in the role.
          </p>
          <button
            className="secondary-button"
            onClick={() => setView('compare')}
          >
            Generate comparative analysis <GitCompareArrows size={16} />
          </button>
        </div>
      </div>
    </>
  )
}

function Compare({
  setView,
  room,
  candidates,
  onSelectCandidate,
}: {
  setView: (v: View) => void
  room: ClientRoom
  candidates: ClientCandidate[]
  onSelectCandidate: (c: ClientCandidate) => void
}) {
  return (
    <>
      <Header
        eyebrow="Analysis · Hiring room level"
        title="Comparative analysis"
        subtitle="Compare completed candidate assessments without flattening the nuance."
        action={
          <button
            className="primary-button"
            onClick={() => setView('recommendation')}
          >
            <Sparkles size={16} />
            Find best fit for this role
          </button>
        }
      />
      <div className="panel comparison-panel">
        <div className="comparison-top">
          <div>
            <h2>{room.title}</h2>
            <p>
              {candidates.length} individual assessments · Evidence-weighted
              comparison
            </p>
          </div>
          <Pill tone="live">All analyses complete</Pill>
        </div>
        <div className="comparison-table">
          {candidates.map((c, i) => (
            <button
              className="table-row"
              key={c.id || c.name}
              onClick={() => {
                onSelectCandidate(c)
                setView('candidate')
              }}
            >
              <div className="candidate-cell">
                <Avatar candidate={c} small />
                <div>
                  <strong>{c.name}</strong>
                  <span>{c.role}</span>
                </div>
                {i === 0 && <Pill tone="strong">Leading signal</Pill>}
              </div>
              <div className="table-score">
                <b>{c.score || 85}</b>
                <span>
                  confidence {i === 0 ? '87%' : i === 1 ? '81%' : '74%'}
                </span>
              </div>
              <div className="bars">
                <i
                  style={{
                    width: `${[96, 88, 81][i % 3]}%`,
                  }}
                />
                <i
                  style={{
                    width: `${[88, 89, 82][i % 3]}%`,
                  }}
                />
                <i
                  style={{
                    width: `${[91, 89, 82][i % 3]}%`,
                  }}
                />
                <i
                  style={{
                    width: `${[76, 80, 74][i % 3]}%`,
                  }}
                />
              </div>
              <div className="distinction">
                <b>Strength</b>
                {c.strengths && c.strengths[0]
                  ? c.strengths[0]
                  : 'Technical depth'}
                <span>
                  <b>Concern</b>
                  {c.concern || 'None identified'}
                </span>
              </div>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      </div>
      <div className="comparison-bottom">
        <div className="panel">
          <div className="eyebrow">Decision lens</div>
          <h2>Consistency beats one high score</h2>
          <p>
            Maya leads because her evidence is coherent across all four
            independent lenses, not because of a simple average. Jordan has
            strong platform signal; Priya has research upside with more
            production risk.
          </p>
        </div>
      </div>
    </>
  )
}

function Recommendation({
  setView,
  room,
  candidates,
}: {
  setView: (v: View) => void
  room: ClientRoom
  candidates: ClientCandidate[]
}) {
  const topCandidate = candidates[0] || {
    id: 'cand-maya-chen',
    roomId: room.id,
    name: 'Maya Chen',
    role: 'Senior ML Engineer',
    initials: 'MC',
    score: 92,
    color: 'indigo',
    status: 'Strong fit',
    summary: '',
    strengths: [],
    concern: 'Validate team scaling in final interview.',
    progress: 'Complete',
  }

  return (
    <div className="recommendation-page">
      <button
        className="back-button light"
        onClick={() => setView('compare')}
      >
        <ArrowLeft size={15} />
        Back to comparative analysis
      </button>
      <div className="recommendation-content">
        <div className="recommendation-kicker">
          <Sparkles size={15} />
          Final comparative recommendation
        </div>
        <div className="recommendation-label">Best fit for {room.title}</div>
        <Avatar candidate={topCandidate} />
        <h1>{topCandidate.name}</h1>
        <p className="recommendation-role">
          {topCandidate.role} · {room.location}
        </p>
        <div className="recommendation-score">
          <Score value={topCandidate.score || 92} size="large" />
          <div>
            <span>Evidence-weighted fit</span>
            <strong>{topCandidate.status || 'Strong fit'}</strong>
            <em>87% decision confidence</em>
          </div>
        </div>
        <div className="recommendation-why">
          <div className="eyebrow">Why {topCandidate.name} wins</div>
          <p>
            “{topCandidate.name} is the most complete signal in this pool:
            exceptional systems depth, dependable execution, and evidence that
            survives challenge. She beats other candidates on research depth and
            production ownership.”
          </p>
          <div className="recommendation-tradeoffs">
            <span>Trade-off</span>{' '}
            {topCandidate.concern || 'Validate team scaling in final interview.'}
          </div>
        </div>
        <div className="recommendation-actions">
          <button
            className="primary-button"
            onClick={() => setView('room')}
          >
            Return to hiring room <ArrowRight size={16} />
          </button>
          <button
            className="secondary-button light-secondary"
            onClick={() => setView('candidate')}
          >
            Review full assessment
          </button>
        </div>
      </div>
    </div>
  )
}

function Create({
  setView,
  onRoomCreated,
}: {
  setView: (v: View) => void
  onRoomCreated: (newRoom: ClientRoom) => void
}) {
  const [title, setTitle] = useState('Senior ML Engineer')
  const [location, setLocation] = useState('New York, NY')
  const [brief, setBrief] = useState(
    'Build reliable machine learning systems for our next generation platform.'
  )
  const [jdFile, setJdFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !location.trim() || !brief.trim() || isSubmitting) return

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('location', location.trim())
      formData.append('brief', brief.trim())
      if (jdFile) {
        formData.append('jobDescription', jdFile)
      }

      const res = await fetch('/api/rooms', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        setSubmitError(json?.error?.message || 'Unable to create the hiring room. Please try again.')
        return
      }
      if (!json?.data) {
        setSubmitError('The hiring room was created without a response. Please refresh and try again.')
        return
      }
      onRoomCreated(json.data)
      setView('room')
    } catch (err) {
      console.error('Failed to create hiring room:', err)
      setSubmitError(err instanceof Error ? err.message : 'Network error while creating the hiring room.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="create-wrap">
      <button className="back-button" onClick={() => setView('dashboard')}>
        <ArrowLeft size={15} />
        Back to overview
      </button>
      <div className="create-card panel">
        <form onSubmit={handleSubmit}>
          <div className="eyebrow">New workspace</div>
          <h1>Create a hiring room</h1>
          <p>Define the role. Recruitfy will structure the signal.</p>
          <div className="form-grid">
            <label>
              Role title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>
            <label>
              Location
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </label>
          </div>
          <label className="full-label">
            Role brief
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              required
            />
          </label>
          <UploadField
            label="Job description PDF"
            hint="Required · Shared across every candidate in this room"
            selectedFileName={jdFile?.name}
            onChange={setJdFile}
          />
          {submitError && <div className="document-note" role="alert">{submitError}</div>}
          <div className="create-footer">
            <span>
              <ShieldCheck size={15} />
              Your workspace is private by default.
            </span>
            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting ? 'Creating...' : 'Create hiring room'}{' '}
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Login({ setView }: { setView: (v: View) => void }) {
  return (
    <div className="login-page">
      <div className="login-art">
        <div className="login-art-content">
          <Brand />
          <div className="art-quote">
            <Sparkles size={21} />
            <h2>Make the signal clear.</h2>
            <p>
              Recruitfy brings independent AI perspectives into one transparent
              hiring workflow.
            </p>
          </div>
          <div className="art-footer">
            <span>Evidence first</span>
            <span>Human-led</span>
            <span>Private by default</span>
          </div>
        </div>
      </div>
      <div className="login-form-wrap">
        <div className="login-form">
          <div className="mobile-brand">
            <Brand />
          </div>
          <div className="eyebrow">Administrator access</div>
          <h1>Welcome back</h1>
          <p>Sign in to your hiring intelligence workspace.</p>
          <label>
            Email
            <input defaultValue="alex@company.com" />
          </label>
          <label>
            Password
            <input type="password" defaultValue="password" />
          </label>
          <button
            className="primary-button full"
            onClick={() => setView('dashboard')}
          >
            Sign in <ArrowRight size={16} />
          </button>
          <p className="login-help">
            Need access? <a>Contact your workspace admin</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [view, setView] = useState<View>('dashboard')
  const [menu, setMenu] = useState(false)
  const [rooms, setRooms] = useState<ClientRoom[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')
  const [candidates, setCandidates] = useState<ClientCandidate[]>([])
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('')

  // Fetch all hiring rooms on mount
  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms')
      if (res.ok) {
        const json = await res.json()
        if (json.data && Array.isArray(json.data)) {
          setRooms(json.data)
          if (json.data.length > 0 && !selectedRoomId) {
            setSelectedRoomId(json.data[0].id)
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err)
    }
  }, [selectedRoomId])

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  // Fetch candidates whenever selectedRoomId changes
  const fetchCandidates = useCallback(async (roomId: string) => {
    if (!roomId) return
    try {
      const res = await fetch(`/api/rooms/${roomId}/candidates`)
      if (res.ok) {
        const json = await res.json()
        if (json.data && Array.isArray(json.data)) {
          setCandidates(json.data)
          if (json.data.length > 0) {
            setSelectedCandidateId(json.data[0].id)
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch candidates:', err)
    }
  }, [])

  useEffect(() => {
    if (selectedRoomId) {
      fetchCandidates(selectedRoomId)
    }
  }, [selectedRoomId, fetchCandidates])

  const handleRoomCreated = (newRoom: ClientRoom) => {
    setRooms((prev) => [newRoom, ...prev])
    setSelectedRoomId(newRoom.id)
    fetchCandidates(newRoom.id)
  }

  const handleCandidateAdded = (newCand: ClientCandidate) => {
    setCandidates((prev) => [...prev, newCand])
    setRooms((prev) =>
      prev.map((r) =>
        r.id === newCand.roomId
          ? { ...r, candidateCount: (r.candidateCount || 0) + 1 }
          : r
      )
    )
    setSelectedCandidateId(newCand.id)
  }

  const handleCandidateUpdated = (updated: ClientCandidate) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
    )
  }

  const activeRoom =
    rooms.find((r) => r.id === selectedRoomId) ||
    rooms[0] || {
      id: 'room-senior-ml',
      title: 'Senior ML Engineer',
      role: 'Senior ML Engineer',
      location: 'New York, NY',
      department: 'Engineering',
      brief:
        'Build reliable machine learning systems for our next generation platform.',
      status: 'in_progress',
      jobDescriptionFileName: 'senior-ml-engineer-jd.pdf',
      candidateCount: candidates.length,
      analysisProgress: 67,
      createdAt: '2024-08-18T10:00:00Z',
    }

  const activeCandidate =
    candidates.find((c) => c.id === selectedCandidateId) ||
    candidates[0] || {
      id: 'cand-maya-chen',
      roomId: activeRoom.id,
      name: 'Maya Chen',
      role: 'Senior ML Engineer',
      initials: 'MC',
      score: 92,
      status: 'Strong fit',
      color: 'indigo',
      summary:
        'Exceptional systems thinker with a rare blend of research depth and production instincts.',
      strengths: [
        'Distributed systems',
        'Model evaluation',
        'Technical leadership',
      ],
      concern: 'Limited experience managing a team larger than 5.',
      progress: 'Complete',
      stage: 'upload' as Stage,
      resumeFileName: 'maya-chen-resume.pdf',
      transcriptFileName: 'maya-chen-interview.pdf',
    }

  if (view === 'login') return <Login setView={setView} />

  return (
    <div className="app-shell">
      <div
        className={`mobile-sidebar ${menu ? 'open' : ''}`}
        onClick={() => setMenu(false)}
      >
        <Sidebar
          view={view}
          setView={setView}
          roomsCount={rooms.length}
        />
      </div>
      <Sidebar
        view={view}
        setView={setView}
        roomsCount={rooms.length}
      />
      <div className="main-column">
        <Topbar
          view={view}
          onMenu={() => setMenu(true)}
          activeRoomTitle={`${activeRoom.title} · ${activeRoom.location}`}
        />
        <main className="content-canvas">
          {view === 'dashboard' && (
            <Dashboard
              setView={setView}
              rooms={rooms}
              onSelectRoom={(rId) => {
                setSelectedRoomId(rId)
                fetchCandidates(rId)
              }}
            />
          )}
          {view === 'room' && (
            <Room
              setView={setView}
              room={activeRoom}
              candidates={candidates}
              onCandidateAdded={handleCandidateAdded}
              onSelectCandidate={(c) => setSelectedCandidateId(c.id)}
            />
          )}
          {view === 'candidate' && (
            <CandidateView
              setView={setView}
              candidate={activeCandidate}
              onCandidateUpdated={handleCandidateUpdated}
            />
          )}
          {view === 'compare' && (
            <Compare
              setView={setView}
              room={activeRoom}
              candidates={candidates}
              onSelectCandidate={(c) => setSelectedCandidateId(c.id)}
            />
          )}
          {view === 'recommendation' && (
            <Recommendation
              setView={setView}
              room={activeRoom}
              candidates={candidates}
            />
          )}
          {view === 'create' && (
            <Create
              setView={setView}
              onRoomCreated={handleRoomCreated}
            />
          )}
        </main>
      </div>
    </div>
  )
}
