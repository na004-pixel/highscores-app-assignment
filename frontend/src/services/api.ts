const API_BASE = 'http://localhost:8000';

export interface TopicStats {
  correct: number;
  total: number;
}

export interface FinishResult {
  ability: number;
  analysis: {
    weak_topics: string[];
    topic_accuracy: Record<string, TopicStats>;
    max_difficulty: number;
  };
}

export interface StudyPlanStep {
  step: number;
  title: string;
  action: string;
}

export interface AIInsightsResult {
  weak_topics: string[];
  max_difficulty: number;
  study_plan: StudyPlanStep[];
  generated_by: string;
}

async function parseJsonResponse(res: Response) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.message || 'Request failed');
  }
  return data;
}

export async function startSession(): Promise<{ session_id: string }> {
  const res = await fetch(`${API_BASE}/session/start`, { method: 'POST' });
  return parseJsonResponse(res);
}

export async function getNextQuestion(sessionId: string) {
  const res = await fetch(`${API_BASE}/next-question/${sessionId}`);
  const data = await res.json();
  if (data.message === 'Test complete') {
    return null;
  }
  if (!res.ok) {
    throw new Error(data.detail || data.message || 'Failed to get question');
  }
  return data;
}

export async function submitAnswer(
  sessionId: string,
  questionId: string,
  answer: string
): Promise<{ correct: boolean; ability: number }> {
  const res = await fetch(`${API_BASE}/submit-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, question_id: questionId, answer }),
  });
  return parseJsonResponse(res);
}

export async function finishTest(sessionId: string): Promise<FinishResult> {
  const res = await fetch(`${API_BASE}/finish/${sessionId}`);
  return parseJsonResponse(res);
}

export async function getAIInsights(sessionId: string): Promise<AIInsightsResult> {
  const res = await fetch(`${API_BASE}/ai-insights/${sessionId}`);
  return parseJsonResponse(res);
}
