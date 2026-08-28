import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScoreRing } from '@/components/score-ring';

describe('ScoreRing', () => {
  it('exposes the candidate score to assistive technology', () => {
    render(<ScoreRing value={92} size="large" />);
    expect(screen.getByRole('img', { name: 'Candidate score: 92 out of 100' })).toHaveTextContent('92');
  });
});
