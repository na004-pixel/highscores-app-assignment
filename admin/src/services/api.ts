import type { Question } from '../App';

const API_BASE = 'http://localhost:8000';

export async function getQuestions(): Promise<Question[]> {
  const res = await fetch(`${API_BASE}/questions`);
  return res.json();
}

export async function getQuestion(id: string): Promise<Question> {
  const res = await fetch(`${API_BASE}/questions/${id}`);
  return res.json();
}

export async function createQuestion(question: Omit<Question, 'id'>): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(question),
  });
  return res.json();
}

export async function updateQuestion(id: string, question: Partial<Question>): Promise<void> {
  await fetch(`${API_BASE}/questions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(question),
  });
}

export async function deleteQuestion(id: string): Promise<void> {
  await fetch(`${API_BASE}/questions/${id}`, { method: 'DELETE' });
}

export async function deleteAllQuestions(): Promise<{ deleted: number }> {
  const res = await fetch(`${API_BASE}/questions`, { method: 'DELETE' });
  return res.json();
}

export async function bulkCreateQuestions(questions: Omit<Question, 'id'>[]): Promise<{ inserted: number }> {
  const res = await fetch(`${API_BASE}/questions/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(questions),
  });
  return res.json();
}
