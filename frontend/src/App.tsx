import { createSignal, Show } from 'solid-js';
import StartScreen from './components/StartScreen';
import TestScreen from './components/TestScreen';
import ResultScreen from './components/ResultScreen';
import type { AIInsightsResult, FinishResult } from './services/api';

export type Question = {
  id: string;
  text: string;
  options: string[];
  difficulty: number;
  topic: string;
};

export type TestState = 'start' | 'testing' | 'finished';

export interface ResultState extends FinishResult {
  aiInsights: AIInsightsResult | null;
  aiInsightsLoading: boolean;
  aiInsightsError: string;
}

export default function App() {
  const [state, setState] = createSignal<TestState>('start');
  const [sessionId, setSessionId] = createSignal<string>('');
  const [currentQuestion, setCurrentQuestion] = createSignal<Question | null>(null);
  const [ability, setAbility] = createSignal<number>(0.5);
  const [questionsAnswered, setQuestionsAnswered] = createSignal<number>(0);
  const [result, setResult] = createSignal<ResultState | null>(null);

  const handleStart = (sessionId: string) => {
    setSessionId(sessionId);
    setState('testing');
  };

  const handleQuestionReceived = (question: Question) => {
    setCurrentQuestion(question);
  };

  const handleAnswered = (newAbility: number) => {
    setAbility(newAbility);
    setQuestionsAnswered((prev) => prev + 1);
  };

  const handleFinish = (result: ResultState) => {
    setResult(result);
    setState('finished');
  };

  const handleRestart = () => {
    setState('start');
    setSessionId('');
    setCurrentQuestion(null);
    setAbility(0.5);
    setQuestionsAnswered(0);
    setResult(null);
  };

  return (
    <div class="app">
      <header class="header">
        <h1>Adaptive Test</h1>
        <Show when={state() === 'testing'}>
          <div class="progress-bar">
            <div
              class="progress-fill"
              style={{ width: `${(questionsAnswered() / 10) * 100}%` }}
            />
          </div>
          <div class="stats">
            <span>Question {questionsAnswered()}/10</span>
            <span class="ability">Ability = {ability().toFixed(2)}</span>
          </div>
        </Show>
      </header>

      <main class="main">
        <Show when={state() === 'start'}>
          <StartScreen onStart={handleStart} />
        </Show>
        <Show when={state() === 'testing'}>
          <TestScreen
            sessionId={sessionId()}
            currentQuestion={currentQuestion()}
            onQuestionReceived={handleQuestionReceived}
            onAnswered={handleAnswered}
            onFinish={handleFinish}
          />
        </Show>
        <Show when={state() === 'finished'}>
          <ResultScreen result={result()} onRestart={handleRestart} />
        </Show>
      </main>
    </div>
  );
}
