import { createSignal, createEffect, Show, onMount } from 'solid-js';
import type { Question, ResultState } from '../App';
import { finishTest, getAIInsights, getNextQuestion, submitAnswer } from '../services/api';

interface TestScreenProps {
  sessionId: string;
  currentQuestion: Question | null;
  onQuestionReceived: (question: Question) => void;
  onAnswered: (ability: number) => void;
  onFinish: (result: ResultState) => void;
}

export default function TestScreen(props: TestScreenProps) {
  const [selectedAnswer, setSelectedAnswer] = createSignal<string>('');
  const [submitting, setSubmitting] = createSignal(false);
  const [lastCorrect, setLastCorrect] = createSignal<boolean | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal('');

  const loadNextQuestion = async (showLoadingState = false) => {
    if (showLoadingState) {
      setLoading(true);
    }
    setError('');
    try {
      const question = await getNextQuestion(props.sessionId);
      if (question === null) {
        const result = await finishTest(props.sessionId);
        props.onFinish({
          ...result,
          aiInsights: null,
          aiInsightsLoading: true,
          aiInsightsError: '',
        });

        void getAIInsights(props.sessionId)
          .then((aiInsights) => {
            props.onFinish({
              ...result,
              aiInsights,
              aiInsightsLoading: false,
              aiInsightsError: '',
            });
          })
          .catch((aiError) => {
            console.error(aiError);
            props.onFinish({
              ...result,
              aiInsights: null,
              aiInsightsLoading: false,
              aiInsightsError:
                aiError instanceof Error ? aiError.message : 'Failed to load AI study plan',
            });
          });
      } else {
        setSelectedAnswer('');
        setLastCorrect(null);
        props.onQuestionReceived(question);
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to load the next question');
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    if (!props.currentQuestion) {
      loadNextQuestion(true);
    }
  });

  createEffect(() => {
    if (props.currentQuestion) {
      setLoading(false);
    }
  });

  const handleSubmit = async () => {
    if (!selectedAnswer() || !props.currentQuestion) return;

    setSubmitting(true);
    setError('');
    try {
      const result = await submitAnswer(
        props.sessionId,
        props.currentQuestion.id,
        selectedAnswer()
      );
      setLastCorrect(result.correct);
      props.onAnswered(result.ability);

      setTimeout(() => {
        loadNextQuestion();
      }, 800);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div class="test-screen">
      <Show when={lastCorrect() !== null}>
        <div class={`answer-toast ${lastCorrect() ? 'correct' : 'incorrect'}`}>
          <span class="answer-toast-icon" aria-hidden="true">
            {lastCorrect() ? '✓' : '✕'}
          </span>
          <strong>{lastCorrect() ? 'Correct' : 'Incorrect'}</strong>
        </div>
      </Show>

      <Show when={loading()}>
        <div class="loading">Loading question...</div>
      </Show>

      <Show when={!loading() && props.currentQuestion}>
        <div class="question-card">
          <Show when={error()}>
            <div class="error">{error()}</div>
          </Show>
          <div class="question-meta">
            <span class="topic">{props.currentQuestion!.topic}</span>
            <span class="difficulty">Difficulty: {props.currentQuestion!.difficulty.toFixed(1)}</span>
          </div>

          <h3 class="question-text">{props.currentQuestion!.text}</h3>

          <div class="options">
            {props.currentQuestion!.options.map((option) => (
              <button
                class={`option ${selectedAnswer() === option ? 'selected' : ''} ${
                  lastCorrect() !== null && selectedAnswer() === option
                    ? lastCorrect()
                      ? 'correct'
                      : 'incorrect'
                    : ''
                }`}
                onClick={() => setSelectedAnswer(option)}
                disabled={submitting() || lastCorrect() !== null}
              >
                {option}
              </button>
            ))}
          </div>

          <button
            class="btn-primary"
            onClick={handleSubmit}
            disabled={!selectedAnswer() || submitting() || lastCorrect() !== null}
          >
            {submitting() ? 'Submitting...' : 'Submit Answer'}
          </button>
        </div>
      </Show>
    </div>
  );
}
