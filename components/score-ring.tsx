import type { CSSProperties } from 'react';

export function ScoreRing({ value, size = 'normal' }: { value: number; size?: 'normal' | 'large' }) {
  const score = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={`score-ring ${size === 'large' ? 'score-ring-lg' : ''}`}
      role="img"
      aria-label={`Candidate score: ${score} out of 100`}
      style={{ '--score': `${score * 3.6}deg` } as CSSProperties}
    >
      <span>{score}</span>
    </div>
  );
}
