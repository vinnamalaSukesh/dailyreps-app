import type {
  Attempt, AttemptResult, DateKey, LcInfo, Level, Miss, Objective, Profile, Question, QuestionDetail, Report, Today, Topic,
  TopicCategory,
} from './types';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
const KEY = process.env.EXPO_PUBLIC_API_KEY ?? '';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-API-Key': KEY },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, `Can't reach the server at ${BASE || '(EXPO_PUBLIC_API_URL not set)'}`);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = data?.detail;
    throw new ApiError(res.status, typeof detail === 'string' ? detail : `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  today: () => req<Today>('GET', '/today'),

  questions: () => req<Question[]>('GET', '/questions'),
  question: (id: string) => req<QuestionDetail>('GET', `/questions/${id}`),
  lookup: (ref: string) => req<LcInfo>('GET', `/leetcode/lookup?ref=${encodeURIComponent(ref)}`),
  addQuestion: (q: { ref?: string; title?: string; level?: Level; tags?: string[]; pattern?: string }) =>
    req<Question>('POST', '/questions', q),
  patchQuestion: (id: string, q: Partial<Pick<Question, 'title' | 'level' | 'pattern' | 'tags' | 'mastered'>>) =>
    req<Question>('PATCH', `/questions/${id}`, q),
  deleteQuestion: (id: string) => req<void>('DELETE', `/questions/${id}`),
  seed: () => req<{ added: number }>('POST', '/questions/seed'),
  logAttempt: (id: string, a: { result: AttemptResult; timeMin: number; comment: string }) =>
    req<{ attempt: Attempt; question: Question }>('POST', `/questions/${id}/attempts`, a),
  editAttempt: (id: string, a: { comment?: string; timeMin?: number }) => req<Attempt>('PATCH', `/attempts/${id}`, a),

  topics: () => req<Topic[]>('GET', '/topics'),
  topic: (id: string) => req<Topic>('GET', `/topics/${id}`),
  addTopic: (title: string, category: TopicCategory) => req<Topic>('POST', '/topics', { title, category }),
  patchTopic: (id: string, t: Partial<Pick<Topic, 'title' | 'category' | 'status'>> & { revise?: boolean }) =>
    req<Topic>('PATCH', `/topics/${id}`, t),
  commentTopic: (id: string, text: string) => req<Topic>('POST', `/topics/${id}/comments`, { text }),
  reviewTopic: (id: string, correct: boolean) => req<Topic>('POST', `/topics/${id}/reviews`, { correct }),
  deleteTopic: (id: string) => req<void>('DELETE', `/topics/${id}`),

  completeWorkout: () => req<{ date: string }>('POST', '/workout/complete'),
  workoutLogs: () => req<{ date: string; completed: boolean }[]>('GET', '/workout/logs?days=30'),

  misses: (days = 30) => req<Miss[]>('GET', `/misses?days=${days}`),
  missSuggestions: () => req<Record<Objective, string[]>>('GET', '/misses/suggestions'),
  saveMiss: (m: { objective: Objective; reason: string; date?: DateKey }) => req<Miss>('PUT', '/misses', m),
  deleteMiss: (date: DateKey, objective: Objective) => req<void>('DELETE', `/misses/${date}/${objective}`),

  reports: () => req<Report[]>('GET', '/reports'),
  analyzeNow: () => req<Report>('POST', '/reports/analyze'),
  profile: () => req<Profile>('GET', '/profile'),
  saveProfile: (p: Profile) => req<Profile>('PUT', '/profile', p),
};
