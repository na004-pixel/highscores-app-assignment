import { createSignal } from 'solid-js';
import { startSession } from '../services/api';

interface StartScreenProps {
  onStart: (sessionId: string) => void;
}

export default function StartScreen(props: StartScreenProps) {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal('');

  const handleStart = async () => {
    setLoading(true);
    setError('');
    try {
      const { session_id } = await startSession();
      props.onStart(session_id);
    } catch (e) {
      setError('Failed to start session. Make sure the API is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="start-screen">
      <div class="card">
        <h2>Welcome to the Adaptive Test</h2>
        <p>
          This test uses <strong>Item Response Theory</strong> to adapt to your ability level.
          Questions will become easier or harder based on your performance.
        </p>
        <ul class="features">
          <li>10 questions total</li>
          <li>Real-time ability estimation</li>
          <li>Personalized study plan at the end</li>
        </ul>
        {error() && <div class="error">{error()}</div>}
        <button class="btn-primary" onClick={handleStart} disabled={loading()}>
          {loading() ? 'Starting...' : 'Start Test'}
        </button>
      </div>
    </div>
  );
}
