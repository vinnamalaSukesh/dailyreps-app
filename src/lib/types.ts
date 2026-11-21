// Shapes returned by the FastAPI server (camelCase, ids as strings).

export type Level = 'easy' | 'medium' | 'hard';
export type AttemptResult = 'solved' | 'solved_with_hint' | 'failed';
export type TopicCategory = 'system_design' | 'devops' | 'other';
/** Local calendar day, "YYYY-MM-DD" (server timezone). */
export type DateKey = string;

export interface Question {
  id: string;
  lcNumber?: number;
  slug?: string;
  title: string;
  level: Level;
  tags: string[];
  pattern: string;
  step: number;
  nextRevisitAt: DateKey | null;
  failCount: number;
  lastAttemptAt: DateKey | null;
  mastered: boolean;
}

export interface Attempt {
  id: string;
  questionId: string;
  date: DateKey;
  type: 'new' | 'revisit';
  result: AttemptResult;
  timeMin: number;
  comment: string;
}

export interface QuestionDetail extends Question {
  attempts: Attempt[];
}

export interface Topic {
  id: string;
  title: string;
  category: TopicCategory;
  status: 'pending' | 'completed';
  comments: { date: DateKey; text: string }[];
  createdAt: DateKey;
  completedAt?: DateKey;
}

export interface Streak {
  current: number;
  best: number;
}

export interface Today {
  date: DateKey;
  weekend: boolean;
  plan: {
    generatedBy: 'rules' | 'ai' | 'fallback';
    aiReason: string | null;
    items: { kind: 'new' | 'revisit'; question: Question; attempt: Attempt | null }[];
  };
  backlogCount: number;
  pendingTopics: Topic[];
  workoutDone: boolean;
  streaks: { dsa: Streak; topics: Streak; workout: Streak };
}

export interface LcInfo {
  lcNumber: number;
  slug: string;
  title: string;
  level: Level;
  tags: string[];
}

export interface Report {
  id: string;
  weekOf: DateKey;
  createdOn: DateKey;
  trigger: 'weekly' | 'manual';
  source: string;
  summary: string;
  weakPatterns: string[];
  /** Older reports stored plain strings. */
  suggestedTopics: (string | SuggestedTopic)[];
  focusNextWeek: string[];
  suggestedQuestions: LcInfo[];
}

export interface SuggestedTopic {
  title: string;
  category: TopicCategory;
  why: string;
}

export interface Profile {
  stack: string;
  experience: string;
  targetRole: string;
  targetCTC: string;
  targetDate: string;
  weakAreas: string[];
  skills: string[];
  highlights: string[];
}

export interface Exercise {
  name: string;
  /** require('../../assets/exercises/x.png'), or undefined for no image. */
  image?: number;
  durationSec: number;
  restSec: number;
  /** Optional spoken/visible cue, e.g. "keep your back straight". */
  cue?: string;
}
