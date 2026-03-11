import { createSignal } from 'solid-js';
import type { Question } from '../App';
import { createQuestion, updateQuestion } from '../services/api';

interface QuestionFormProps {
  question: Question | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function QuestionForm(props: QuestionFormProps) {
  const isEdit = () => props.question !== null;

  const [text, setText] = createSignal(props.question?.text || '');
  const [options, setOptions] = createSignal<string[]>(props.question?.options || ['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = createSignal(props.question?.correct_answer || '');
  const [difficulty, setDifficulty] = createSignal(props.question?.difficulty || 0);
  const [topic, setTopic] = createSignal(props.question?.topic || '');
  const [tags, setTags] = createSignal(props.question?.tags?.join(', ') || '');
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal('');

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options()];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');

    if (!text() || options().some(o => !o) || !correctAnswer() || !topic()) {
      setError('Please fill in all required fields');
      return;
    }

    if (!options().includes(correctAnswer())) {
      setError('Correct answer must be one of the options');
      return;
    }

    setSaving(true);
    try {
      const data = {
        text: text(),
        options: options(),
        correct_answer: correctAnswer(),
        difficulty: difficulty(),
        topic: topic(),
        tags: tags().split(',').map(t => t.trim()).filter(Boolean),
      };

      if (isEdit()) {
        await updateQuestion(props.question!.id, data);
      } else {
        await createQuestion(data);
      }
      props.onSave();
    } catch (err) {
      setError('Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class="question-form-container">
      <h2>{isEdit() ? 'Edit Question' : 'Add New Question'}</h2>

      <form class="question-form" onSubmit={handleSubmit}>
        <div class="form-group">
          <label>Question Text *</label>
          <textarea
            value={text()}
            onInput={(e) => setText(e.currentTarget.value)}
            placeholder="Enter the question..."
            rows={3}
            required
          />
        </div>

        <div class="form-group">
          <label>Topic *</label>
          <input
            type="text"
            value={topic()}
            onInput={(e) => setTopic(e.currentTarget.value)}
            placeholder="e.g., Math, Science, History"
            required
          />
        </div>

        <div class="form-group">
          <label>Difficulty (-3 to 3) *</label>
          <input
            type="number"
            step="0.1"
            min="-3"
            max="3"
            value={difficulty()}
            onInput={(e) => setDifficulty(parseFloat(e.currentTarget.value))}
            required
          />
        </div>

        <div class="form-group">
          <label>Options *</label>
          <div class="options-inputs">
            {options().map((opt, i) => (
              <div class="option-input-row">
                <input
                  type="radio"
                  name="correct"
                  checked={correctAnswer() === opt}
                  onChange={() => setCorrectAnswer(opt)}
                />
                <input
                  type="text"
                  value={opt}
                  onInput={(e) => handleOptionChange(i, e.currentTarget.value)}
                  placeholder={`Option ${i + 1}`}
                  required
                />
              </div>
            ))}
          </div>
          <small class="hint">Select the radio button next to the correct answer</small>
        </div>

        <div class="form-group">
          <label>Tags (comma separated)</label>
          <input
            type="text"
            value={tags()}
            onInput={(e) => setTags(e.currentTarget.value)}
            placeholder="e.g., algebra, equations"
          />
        </div>

        {error() && <div class="error">{error()}</div>}

        <div class="form-actions">
          <button type="button" class="btn-secondary" onClick={props.onCancel}>
            Cancel
          </button>
          <button type="submit" class="btn-primary" disabled={saving()}>
            {saving() ? 'Saving...' : (isEdit() ? 'Update Question' : 'Create Question')}
          </button>
        </div>
      </form>
    </div>
  );
}
