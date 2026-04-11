import { useState, useRef } from 'react';
import { apiUpload } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import OfflineQueue from '../components/OfflineQueue';
import useOfflineQueue from '../hooks/useOfflineQueue';

const AI_MESSAGES = [
  'Analyzing your pool photo...',
  'Checking water clarity...',
  'Identifying issues...',
  'Almost done...',
];

function severityBadge(severity) {
  if (!severity) return 'badge badge-gray';
  const s = severity.toLowerCase();
  if (s === 'critical' || s === 'severe') return 'badge badge-red';
  if (s === 'moderate') return 'badge badge-amber';
  return 'badge badge-green';
}

function actionBadge(action) {
  if (!action) return 'badge badge-gray';
  const a = action.toLowerCase();
  if (a.includes('routine') || a.includes('maintenance')) return 'badge badge-green';
  if (a.includes('chemical') || a.includes('repair')) return 'badge badge-amber';
  if (a.includes('drain') || a.includes('professional')) return 'badge badge-red';
  return 'badge badge-gray';
}

export default function AnalysisPage() {
  const [analysisType, setAnalysisType] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [queued, setQueued] = useState(false);
  const fileInputRef = useRef(null);
  const offlineQueue = useOfflineQueue();

  async function handleUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError('');
    setResult(null);
    setQueued(false);

    // If offline, queue it
    if (!navigator.onLine) {
      await offlineQueue.enqueue(files, analysisType);
      setQueued(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Online — upload directly
    setLoading(true);
    const formData = new FormData();
    for (let i = 0; i < Math.min(files.length, 4); i++) {
      formData.append('images', files[i]);
    }
    if (analysisType) formData.append('analysis_type', analysisType);

    try {
      const data = await apiUpload('/analysis', formData);
      setResult(data.result);
    } catch (err) {
      // If upload fails (network dropped mid-request), queue it
      if (!navigator.onLine || err.message?.includes('fetch') || err.message?.includes('network')) {
        await offlineQueue.enqueue(files, analysisType);
        setQueued(true);
      } else {
        setError(err.message || 'Failed to analyze. Please try again.');
      }
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleReset() {
    setResult(null);
    setError('');
    setQueued(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleViewQueueResult(item) {
    if (item.result) {
      setResult(item.result);
      offlineQueue.dismiss(item.id);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <LoadingSpinner messages={AI_MESSAGES} />
      </div>
    );
  }

  if (result) {
    return (
      <div className="page">
        <div className="stack">
          <div className="page-header">
            <h2>Analysis Result</h2>
          </div>

          {result.plain_english_summary && (
            <div className="card">
              <p style={{ fontSize: '1.125rem', lineHeight: 1.6 }}>{result.plain_english_summary}</p>
            </div>
          )}

          {result.recommended_action && (
            <div className="card">
              <div className="row-between" style={{ marginBottom: '0.5rem' }}>
                <strong>Recommendation</strong>
                <span className={actionBadge(result.recommended_action)}>
                  {result.recommended_action.replace(/_/g, ' ')}
                </span>
              </div>
              {result.confidence && (
                <div className="row" style={{ marginTop: '0.5rem' }}>
                  <span className="text-secondary" style={{ fontSize: '0.875rem' }}>Confidence:</span>
                  <span className={`badge ${result.confidence === 'high' ? 'badge-green' : result.confidence === 'medium' ? 'badge-amber' : 'badge-red'}`}>
                    {result.confidence}
                  </span>
                </div>
              )}
            </div>
          )}

          {result.test_first_warning && (
            <div className="warning-box">{result.test_first_warning}</div>
          )}

          {result.water_appearance && (
            <div className="card">
              <h3 style={{ marginBottom: '0.75rem' }}>Water Appearance</h3>
              <div className="stack-sm">
                {result.water_appearance.clarity && (
                  <div className="row-between">
                    <span className="text-secondary">Clarity</span>
                    <span style={{ fontWeight: 600 }}>{result.water_appearance.clarity}</span>
                  </div>
                )}
                {result.water_appearance.color_note && (
                  <div className="row-between">
                    <span className="text-secondary">Color</span>
                    <span>{result.water_appearance.color_note}</span>
                  </div>
                )}
                {result.water_appearance.surface_condition && (
                  <div className="row-between">
                    <span className="text-secondary">Surface</span>
                    <span>{result.water_appearance.surface_condition}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {result.findings && result.findings.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '0.75rem' }}>Findings</h3>
              <div className="stack-sm">
                {result.findings.map((f, i) => (
                  <div key={i} style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #2A2A2E' }}>
                    <div className="row-between" style={{ marginBottom: '0.25rem' }}>
                      <strong>{f.issue}</strong>
                      <span className={severityBadge(f.severity)}>{f.severity}</span>
                    </div>
                    <p className="text-secondary" style={{ fontSize: '0.875rem' }}>{f.description}</p>
                    {f.probable_cause && (
                      <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                        <span className="text-secondary">Cause:</span> {f.probable_cause}
                      </p>
                    )}
                    {f.immediate_action && (
                      <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                        <span className="text-secondary">Action:</span> {f.immediate_action}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.chemical_recommendations && result.chemical_recommendations.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '0.75rem' }}>Chemical Recommendations</h3>
              <div className="stack-sm">
                {result.chemical_recommendations.map((c, i) => (
                  <div key={i} className="row-between" style={{ padding: '0.5rem 0', borderBottom: '1px solid #2A2A2E' }}>
                    <div>
                      <strong>{c.chemical}</strong>
                      {c.note && <p className="text-secondary" style={{ fontSize: '0.8125rem' }}>{c.note}</p>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${c.action === 'add' ? 'badge-green' : c.action === 'reduce' ? 'badge-amber' : 'badge-blue'}`}>
                        {c.action}
                      </span>
                      {c.estimated_amount && (
                        <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>{c.estimated_amount}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.overall_diagnosis && (
            <div className="card">
              <h3 style={{ marginBottom: '0.5rem' }}>Diagnosis</h3>
              <p className="text-secondary">{result.overall_diagnosis}</p>
            </div>
          )}

          <button className="btn btn-secondary btn-block" onClick={handleReset}>
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="stack">
        <div className="page-header">
          <h2>Pool Photo Analysis</h2>
          <p className="text-secondary" style={{ marginTop: '0.25rem' }}>
            Upload a photo of your pool or equipment for AI-powered analysis
          </p>
        </div>

        {/* Offline indicator */}
        {!navigator.onLine && (
          <div className="warning-box" style={{ fontSize: '0.875rem' }}>
            You are offline. Photos will be queued and processed automatically when you reconnect.
          </div>
        )}

        {/* Queued confirmation */}
        {queued && (
          <div className="info-box" style={{ fontSize: '0.875rem' }}>
            Photo queued! It will be processed automatically when you're back online.
          </div>
        )}

        {error && <div className="error-banner">{error}</div>}

        {/* Analysis Type */}
        <div className="form-group">
          <label>Analysis Type (optional)</label>
          <select className="select" value={analysisType} onChange={(e) => setAnalysisType(e.target.value)}>
            <option value="">Auto-detect</option>
            <option value="water_chemistry">Water Chemistry</option>
            <option value="algae">Algae</option>
            <option value="equipment">Equipment</option>
            <option value="surface_damage">Surface Damage</option>
          </select>
        </div>

        {/* Upload Area */}
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            minHeight: 220,
            border: '2px dashed #2A2A2E',
            borderRadius: 16,
            cursor: 'pointer',
            padding: '2rem',
            textAlign: 'center',
            transition: 'border-color 0.15s',
          }}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#14B8A6'; }}
          onDragLeave={(e) => { e.currentTarget.style.borderColor = '#2A2A2E'; }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = '#2A2A2E';
            if (e.dataTransfer.files.length) {
              const dt = new DataTransfer();
              for (const f of e.dataTransfer.files) dt.items.add(f);
              fileInputRef.current.files = dt.files;
              handleUpload({ target: { files: dt.files } });
            }
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <div>
            <p style={{ fontSize: '1.0625rem', fontWeight: 600 }}>
              {navigator.onLine ? 'Tap to upload or take a photo' : 'Tap to capture and queue a photo'}
            </p>
            <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Photo of your pool, spa, or equipment (up to 4)
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
        </label>

        {/* Offline Queue */}
        <OfflineQueue
          queue={offlineQueue.queue}
          processing={offlineQueue.processing}
          onRetry={offlineQueue.retry}
          onDismiss={offlineQueue.dismiss}
          onViewResult={handleViewQueueResult}
          onClearCompleted={offlineQueue.clearCompleted}
        />
      </div>
    </div>
  );
}
