import { For, Show } from 'solid-js';
import type { Question } from '../App';
import { deleteQuestion, deleteAllQuestions } from '../services/api';

interface QuestionListProps {
  questions: Question[];
  loading: boolean;
  onEdit: (question: Question) => void;
  onRefresh: () => void;
}

export default function QuestionList(props: QuestionListProps) {
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    await deleteQuestion(id);
    props.onRefresh();
  };

  const handleDeleteAll = async () => {
    if (!confirm('Delete ALL questions? This cannot be undone.')) return;
    await deleteAllQuestions();
    props.onRefresh();
  };

  return (
    <div class="question-list">
      <div class="list-header">
        <h2>Questions ({props.questions.length})</h2>
        <button class="btn-danger" onClick={handleDeleteAll}>Delete All</button>
      </div>

      <Show when={props.loading}>
        <div class="loading">Loading...</div>
      </Show>

      <Show when={!props.loading && props.questions.length === 0}>
        <div class="empty">No questions yet. Add some or upload via CSV.</div>
      </Show>

      <div class="questions-grid">
        <For each={props.questions}>
          {(question) => (
            <div class="question-card">
              <div class="question-header">
                <span class="topic">{question.topic}</span>
                <span class="difficulty">θ={question.difficulty.toFixed(1)}</span>
              </div>
              <p class="question-text">{question.text}</p>
              <div class="options-preview">
                <For each={question.options}>
                  {(opt) => (
                    <span class={`option-tag ${opt === question.correct_answer ? 'correct' : ''}`}>
                      {opt}
                    </span>
                  )}
                </For>
              </div>
              <div class="question-actions">
                <button class="btn-secondary" onClick={() => props.onEdit(question)}>Edit</button>
                <button class="btn-danger-small" onClick={() => handleDelete(question.id)}>Delete</button>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
