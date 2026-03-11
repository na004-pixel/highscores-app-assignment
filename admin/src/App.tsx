import { createSignal, createResource, Show, For } from 'solid-js';
import QuestionList from './components/QuestionList';
import QuestionForm from './components/QuestionForm';
import CsvUpload from './components/CsvUpload';
import { getQuestions } from './services/api';

export type Question = {
  id: string;
  text: string;
  options: string[];
  correct_answer: string;
  difficulty: number;
  topic: string;
  tags: string[];
};

export type View = 'list' | 'add' | 'edit' | 'upload';

export default function App() {
  const [view, setView] = createSignal<View>('list');
  const [editingQuestion, setEditingQuestion] = createSignal<Question | null>(null);
  const [refreshTrigger, setRefreshTrigger] = createSignal(0);

  const [questions, { refetch }] = createResource(refreshTrigger, async () => {
    return await getQuestions();
  });

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setView('edit');
  };

  const handleAdd = () => {
    setEditingQuestion(null);
    setView('add');
  };

  const handleCancel = () => {
    setEditingQuestion(null);
    setView('list');
  };

  const handleSaved = () => {
    handleCancel();
    handleRefresh();
  };

  return (
    <div class="admin-app">
      <header class="header">
        <h1>Question Admin</h1>
        <nav class="nav">
          <button class={`nav-btn ${view() === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
            All Questions
          </button>
          <button class={`nav-btn ${view() === 'add' ? 'active' : ''}`} onClick={handleAdd}>
            Add New
          </button>
          <button class={`nav-btn ${view() === 'upload' ? 'active' : ''}`} onClick={() => setView('upload')}>
            CSV Upload
          </button>
        </nav>
      </header>

      <main class="main">
        <Show when={view() === 'list'}>
          <QuestionList
            questions={questions() || []}
            loading={questions.loading}
            onEdit={handleEdit}
            onRefresh={handleRefresh}
          />
        </Show>

        <Show when={view() === 'add' || view() === 'edit'}>
          <QuestionForm
            question={editingQuestion()}
            onSave={handleSaved}
            onCancel={handleCancel}
          />
        </Show>

        <Show when={view() === 'upload'}>
          <CsvUpload onUpload={handleRefresh} />
        </Show>
      </main>
    </div>
  );
}
