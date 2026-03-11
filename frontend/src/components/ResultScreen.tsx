import { Show, For } from 'solid-js';
import type { ResultState } from '../App';

interface ResultScreenProps {
  result: ResultState | null;
  onRestart: () => void;
}

export default function ResultScreen(props: ResultScreenProps) {
  const getAbilityLabel = (ability: number) => {
    if (ability > 2) return 'Expert';
    if (ability > 1) return 'Advanced';
    if (ability > 0) return 'Intermediate';
    if (ability > -1) return 'Beginner';
    return 'Novice';
  };

  return (
    <div class="result-screen">
      <div class="result-card">
        <h2>Test Complete!</h2>

        <div class="ability-display">
          <div class="ability-circle">
            <span class="ability-value">{props.result?.ability?.toFixed(2)}</span>
          </div>
          <span class="ability-label">{getAbilityLabel(props.result?.ability || 0)}</span>
        </div>

        <Show when={props.result?.analysis}>
          <div class="analysis-section">
            <h3>Performance Analysis</h3>
            <div class="topic-stats">
              <For each={Object.entries(props.result.analysis.topic_accuracy || {})}>
                {([topic, stats]: [string, any]) => (
                  <div class="topic-stat">
                    <span class="topic-name">{topic}</span>
                    <div class="topic-bar">
                      <div
                        class="topic-fill"
                        style={{
                          width: `${((stats.correct / stats.total) * 100).toFixed(0)}%`,
                          background:
                            stats.correct / stats.total >= 0.6 ? '#22c55e' : '#ef4444',
                        }}
                      />
                    </div>
                    <span class="topic-accuracy">
                      {stats.correct}/{stats.total}
                    </span>
                  </div>
                )}
              </For>
            </div>

            <Show when={props.result.analysis.weak_topics?.length > 0}>
              <div class="weak-topics">
                <strong>Areas to improve:</strong>
                <ul>
                  <For each={props.result.analysis.weak_topics}>
                    {(topic: string) => <li>{topic}</li>}
                  </For>
                </ul>
              </div>
            </Show>
          </div>
        </Show>

        <div class="study-plan-section">
          <h3>Personalized Learning Plan</h3>
          <Show when={props.result?.aiInsightsLoading}>
            <div class="study-plan-loading">
              <div class="study-plan-spinner" />
              <div>
                <strong>Generating study plan</strong>
                <p>Score is ready. Gemini is tailoring the next steps now.</p>
              </div>
            </div>
          </Show>

          <Show when={props.result?.aiInsightsError}>
            <div class="error">{props.result?.aiInsightsError}</div>
          </Show>

          <Show when={props.result?.aiInsights}>
            <div class="study-plan">
              <For each={props.result?.aiInsights?.study_plan || []}>
                {(step) => (
                  <article class="study-plan-step">
                    <div class="study-plan-step-number">0{step.step}</div>
                    <div class="study-plan-step-body">
                      <h4>{step.title}</h4>
                      <p>{step.action}</p>
                    </div>
                  </article>
                )}
              </For>
            </div>

            <div class="ai-metadata">
              <span class="ai-badge">{props.result?.aiInsights?.generated_by}</span>
              <span>
                Max difficulty reached: {props.result?.aiInsights?.max_difficulty}
              </span>
            </div>
          </Show>

          <Show
            when={
              !props.result?.aiInsightsLoading &&
              !props.result?.aiInsights &&
              !props.result?.aiInsightsError
            }
          >
            <div class="study-plan-empty">No AI study plan is available for this attempt.</div>
          </Show>
        </div>

        <button class="btn-primary" onClick={props.onRestart}>
          Take Test Again
        </button>
      </div>
    </div>
  );
}
