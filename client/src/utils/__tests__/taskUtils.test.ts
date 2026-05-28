import { describe, expect, it } from 'vitest';
import { isOverdue, priorityRank } from '@/utils/taskUtils';

describe('taskUtils', () => {
  it('isOverdue true when deadline past and not Completed', () => {
    expect(isOverdue({ deadline: new Date(Date.now() - 1000).toISOString(), status: 'Todo' })).toBe(true);
  });
  it('isOverdue false when status is Completed', () => {
    expect(isOverdue({ deadline: new Date(Date.now() - 1000).toISOString(), status: 'Completed' })).toBe(false);
  });
  it('isOverdue false when deadline future', () => {
    expect(isOverdue({ deadline: new Date(Date.now() + 60_000).toISOString(), status: 'Todo' })).toBe(false);
  });
  it('priorityRank ordering', () => {
    expect(priorityRank.High).toBeGreaterThan(priorityRank.Medium);
    expect(priorityRank.Medium).toBeGreaterThan(priorityRank.Low);
  });
});
