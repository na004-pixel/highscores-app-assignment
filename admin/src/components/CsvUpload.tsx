import { createSignal } from 'solid-js';
import Papa from 'papaparse';
import { bulkCreateQuestions, deleteAllQuestions } from '../services/api';

interface CsvRow {
  text: string;
  topic: string;
  difficulty: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_answer: string;
  tags?: string;
}

interface CsvUploadProps {
  onUpload: () => void;
}

export default function CsvUpload(props: CsvUploadProps) {
  const [uploading, setUploading] = createSignal(false);
  const [message, setMessage] = createSignal('');
  const [preview, setPreview] = createSignal<CsvRow[]>([]);

  const handleFile = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setMessage('Error parsing CSV: ' + results.errors[0].message);
          return;
        }
        setPreview(results.data);
        setMessage(`Preview: ${results.data.length} questions loaded`);
      },
    });
  };

  const handleUpload = async () => {
    if (preview().length === 0) return;

    const confirmMsg = 'This will replace ALL existing questions. Continue?';
    if (!confirm(confirmMsg)) return;

    setUploading(true);
    setMessage('');

    try {
      await deleteAllQuestions();

      const questions = preview().map((row) => ({
        text: row.text,
        topic: row.topic,
        difficulty: parseFloat(row.difficulty) || 0,
        options: [row.option1, row.option2, row.option3, row.option4],
        correct_answer: row.correct_answer,
        tags: row.tags ? row.tags.split(',').map((t) => t.trim()) : [],
      }));

      const result = await bulkCreateQuestions(questions);
      setMessage(`Successfully uploaded ${result.inserted} questions!`);
      setPreview([]);
      props.onUpload();
    } catch (err) {
      setMessage('Failed to upload questions');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div class="csv-upload">
      <h2>CSV Upload</h2>

      <div class="csv-instructions">
        <h3>CSV Format</h3>
        <p>Upload a CSV with these columns:</p>
        <code>text,topic,difficulty,option1,option2,option3,option4,correct_answer,tags</code>

        <h3>Example:</h3>
        <pre class="csv-example">
text,topic,difficulty,option1,option2,option3,option4,correct_answer,tags
"What is 2+2?",Math,0,A,B,C,D,B,"addition,basic"
"What is H2O?",Science,-1,Water,Ice,Steam,Oxygen,Water,"chemistry,water"
        </pre>
      </div>

      <div class="upload-section">
        <input type="file" accept=".csv" onChange={handleFile} />
      </div>

      {message() && <div class={`message ${message().includes('Error') || message().includes('Failed') ? 'error' : 'success'}`}>{message()}</div>}

      {preview().length > 0 && (
        <>
          <div class="preview-section">
            <h3>Preview ({preview().length} questions)</h3>
            <div class="preview-list">
              {preview().slice(0, 5).map((row, i) => (
                <div class="preview-item">
                  <strong>{row.topic}</strong>: {row.text.substring(0, 50)}...
                </div>
              ))}
              {preview().length > 5 && <div class="preview-more">...and {preview().length - 5} more</div>}
            </div>
          </div>

          <button class="btn-primary" onClick={handleUpload} disabled={uploading()}>
            {uploading() ? 'Uploading...' : 'Replace All Questions'}
          </button>
        </>
      )}
    </div>
  );
}
