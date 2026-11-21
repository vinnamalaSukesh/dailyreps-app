import type { Exercise } from './types';

/** Workout player state machine: READY -> (EXERCISE -> REST)* -> DONE. Pure, so it's easy to reason about. */

export type Phase = 'READY' | 'EXERCISE' | 'REST' | 'DONE';
export const READY_SEC = 4; // "Get ready" + "1, 2, 3"

export interface PlayerState {
  phase: Phase;
  index: number; // current exercise (REST: the one just finished)
  remaining: number;
  paused: boolean;
}

export type PlayerAction = { type: 'TICK' } | { type: 'SKIP' } | { type: 'TOGGLE_PAUSE' };

export const initialPlayer: PlayerState = { phase: 'READY', index: 0, remaining: READY_SEC, paused: false };

function advance(s: PlayerState, routine: Exercise[]): PlayerState {
  const at = (index: number): PlayerState => ({ ...s, phase: 'EXERCISE', index, remaining: routine[index].durationSec });
  switch (s.phase) {
    case 'READY':
      return routine.length ? at(0) : { ...s, phase: 'DONE', remaining: 0 };
    case 'EXERCISE': {
      const last = s.index >= routine.length - 1;
      if (last) return { ...s, phase: 'DONE', remaining: 0 };
      const rest = routine[s.index].restSec;
      return rest > 0 ? { ...s, phase: 'REST', remaining: rest } : at(s.index + 1);
    }
    case 'REST':
      return at(s.index + 1);
    default:
      return s;
  }
}

export function playerReducer(routine: Exercise[]) {
  return (s: PlayerState, a: PlayerAction): PlayerState => {
    if (s.phase === 'DONE') return s;
    switch (a.type) {
      case 'TOGGLE_PAUSE':
        return { ...s, paused: !s.paused };
      case 'SKIP':
        return advance(s, routine);
      case 'TICK':
        if (s.paused) return s;
        return s.remaining > 1 ? { ...s, remaining: s.remaining - 1 } : advance(s, routine);
    }
  };
}
