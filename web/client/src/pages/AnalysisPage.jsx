import { useState, useRef } from 'react';
import { apiUpload } from '../utils/api';
import { compressImage } from '../utils/compressImage';
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
  if (s === 'serious') return 'badge badge-red';
  if (s === 'moderate') return 'badge badge-amber';
  return 'badge badge-green';
}

function actionBadgeClass(action) {
  if (!action) return 'badge badge-gray';
  const a = action.toLowerCase();
  if (a.includes('pool_ready') || a.includes('ready') || a.includes('routine') || a.includes('pass')) return 'badge badge-green';
  if (a.includes('service') || a.includes('further') || a.includes('testing') || a.includes('this_week') || a.includes('today')) return 'badge badge-amber';
  if (a.includes('do_not_open') || a.includes('immediate') || a.includes('before_opening')) return 'badge badge-red';
  return 'badge badge-gray';
}

function confidenceBadgeClass(confidence) {
  if (!confidence) return 'badge badge-gray';
  const lower = confidence.toLowerCase();
  if (lower.includes('high')) return 'badge badge-green';
  if (lower.includes('medium')) return 'badge badge-amber';
  return 'badge badge-red';
}

function urgencyBadgeClass(urgency) {
  if (!urgency) return 'badge badge-gray';
  const u = urgency.toLowerCase();
  if (u === 'immediate' || u === 'before_opening') return 'badge badge-red';
  if (u === 'today' || u === 'this_week' || u === 'schedule_soon') return 'badge badge-amber';
  if (u === 'routine' || u === 'monitor' || u === 'cosmetic_only') return 'badge badge-green';
  return 'badge badge-gray';
}

export default function AnalysisPage() {
  const [analysisType, setAnalysisType] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [model, setModel] = useState('');
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
      var compressed = await compressImage(files[i]);
      formData.append('images', compressed);
    }
    if (analysisType) formData.append('analysis_type', analysisType);

    try {
      const data = await apiUpload('/analysis', formData);
      setResult(data.result);
      setModel(data.model || '');
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
    setModel('');
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
    const ctx = result.pool_context;
    const water = result.water_condition_analysis;
    const pad = result.equipment_pad_analysis;
    const pump = result.pump_analysis;
    const filter = result.filter_analysis;
    const chem = result.chemical_test_analysis;
    const surface = result.surface_condition_analysis;
    const imageUsable = result.is_pool_image !== false && result.image_quality?.usable !== false;

    return (
      <div className="page">
        <div className="stack">
          <div className="page-header">
            <h2>Analysis Result</h2>
            {model && <div style={{ fontSize: '0.6875rem', color: '#6B6B73', marginTop: '0.25rem' }}>{model}</div>}
          </div>

          {/* Unusable image warning */}
          {!imageUsable && (
            <div className="warning-box">
              <strong>Image could not be analyzed.</strong>
              {result.image_quality?.quality_note && (
                <p style={{ marginTop: '0.25rem' }}>{result.image_quality.quality_note}</p>
              )}
            </div>
          )}

          {/* Overall Assessment Badge */}
          {imageUsable && result.overall_assessment && (
            <div className="card" style={{ textAlign: 'center' }}>
              <span className={actionBadgeClass(result.overall_assessment)} style={{ fontSize: '1.25rem', padding: '0.5rem 1.5rem' }}>
                {result.overall_assessment.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
          )}

          {/* Assessment Reasoning */}
          {result.assessment_reasoning && (
            <div className="card">
              <p style={{ fontSize: '1.0625rem', lineHeight: 1.6 }}>{result.assessment_reasoning}</p>
            </div>
          )}

          {/* Immediate Safety Hazards */}
          {result.immediate_safety_hazards && result.immediate_safety_hazards.length > 0 && (
            <div className="card" style={{ borderLeft: '4px solid #EF4444' }}>
              <h3 style={{ marginBottom: '0.75rem' }}>Immediate Safety Hazards</h3>
              <div className="stack-sm">
                {result.immediate_safety_hazards.map((h, i) => (
                  <div key={i} className="warning-box">
                    <div className="row-between" style={{ marginBottom: '0.25rem' }}>
                      <strong>{h.hazard_type?.replace(/_/g, ' ')}</strong>
                      <span className={severityBadge(h.severity)}>{h.severity}</span>
                    </div>
                    {h.description && <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>{h.description}</p>}
                    {h.immediate_action && (
                      <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        <span className="text-secondary">Action:</span> {h.immediate_action}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detected Context */}
          {ctx && (ctx.pool_type_detected || ctx.surface_type_detected || (ctx.equipment_brands_detected && ctx.equipment_brands_detected.length > 0) || ctx.approximate_pool_size) && (
            <div className="card">
              <h3 style={{ marginBottom: '0.75rem' }}>Detected</h3>
              <div className="stack-sm">
                {ctx.pool_type_detected && ctx.pool_type_detected !== 'unknown' && (
                  <div className="row-between">
                    <span className="text-secondary">Pool Type</span>
                    <span className="badge badge-blue">{ctx.pool_type_detected.replace(/_/g, ' ')}</span>
                  </div>
                )}
                {ctx.surface_type_detected && ctx.surface_type_detected !== 'unknown' && (
                  <div className="row-between">
                    <span className="text-secondary">Surface</span>
                    <span style={{ fontWeight: 600 }}>{ctx.surface_type_detected}</span>
                  </div>
                )}
                {ctx.approximate_pool_size && (
                  <div className="row-between">
                    <span className="text-secondary">Approx. Size</span>
                    <span style={{ fontWeight: 600 }}>{ctx.approximate_pool_size}</span>
                  </div>
                )}
                {ctx.equipment_brands_detected && ctx.equipment_brands_detected.length > 0 && (
                  <div className="row-between">
                    <span className="text-secondary">Equipment</span>
                    <span style={{ fontWeight: 600 }}>{ctx.equipment_brands_detected.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Water Condition Analysis */}
          {water?.applicable && (
            <div className="card">
              <h3 style={{ marginBottom: '0.75rem' }}>Water Condition</h3>
              <div className="stack-sm">
                {water.water_color && (
                  <div className="row-between">
                    <span className="text-secondary">Color</span>
                    <span style={{ fontWeight: 600 }}>{water.water_color.replace(/_/g, ' ')}</span>
                  </div>
                )}
                {water.clarity && (
                  <div className="row-between">
                    <span className="text-secondary">Clarity</span>
                    <span style={{ fontWeight: 600 }}>{water.clarity.replace(/_/g, ' ')}</span>
                  </div>
                )}
                {water.safe_for_swimming && (
                  <div className="row-between">
                    <span className="text-secondary">Safe for Swimming</span>
                    <span className={actionBadgeClass(water.safe_for_swimming === 'yes' ? 'pass' : water.safe_for_swimming === 'no' ? 'do_not_open' : 'further_testing_required')}>
                      {water.safe_for_swimming.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
                {water.safe_for_swimming_reasoning && (
                  <p className="text-secondary" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>{water.safe_for_swimming_reasoning}</p>
                )}
              </div>

              {water.visible_issues && water.visible_issues.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9375rem' }}>Visible Issues</h4>
                  <div className="stack-sm">
                    {water.visible_issues.map((v, i) => (
                      <div key={i} style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                        <div className="row-between" style={{ marginBottom: '0.25rem' }}>
                          <strong>{v.issue_type?.replace(/_/g, ' ')}</strong>
                          <span className={severityBadge(v.severity)}>{v.severity}</span>
                        </div>
                        {v.location && <p className="text-secondary" style={{ fontSize: '0.8125rem' }}>Location: {v.location}</p>}
                        {v.probable_cause && <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}><span className="text-secondary">Cause:</span> {v.probable_cause}</p>}
                        {v.treatment_approach && <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}><span className="text-secondary">Treatment:</span> {v.treatment_approach}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {water.estimated_chemistry_issues && water.estimated_chemistry_issues.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9375rem' }}>Estimated Chemistry Issues</h4>
                  <div className="stack-sm">
                    {water.estimated_chemistry_issues.map((e, i) => (
                      <div key={i} style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                        <div className="row-between" style={{ marginBottom: '0.25rem' }}>
                          <strong>{e.parameter?.replace(/_/g, ' ')}</strong>
                          {e.likely_condition && <span>{e.likely_condition}</span>}
                        </div>
                        {e.basis_for_estimate && <p className="text-secondary" style={{ fontSize: '0.8125rem' }}>{e.basis_for_estimate}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Equipment Pad Analysis */}
          {pad?.applicable && (
            <div className="card">
              <h3 style={{ marginBottom: '0.75rem' }}>Equipment Pad</h3>
              <div className="stack-sm">
                {pad.overall_pad_condition && (
                  <div className="row-between">
                    <span className="text-secondary">Overall Condition</span>
                    <span className={actionBadgeClass(pad.overall_pad_condition === 'good' ? 'pass' : pad.overall_pad_condition === 'fair' ? 'service_required' : 'do_not_open')}>
                      {pad.overall_pad_condition}
                    </span>
                  </div>
                )}
                {pad.plumbing_condition && (
                  <div className="row-between">
                    <span className="text-secondary">Plumbing</span>
                    <span style={{ fontWeight: 600 }}>{pad.plumbing_condition.replace(/_/g, ' ')}</span>
                  </div>
                )}
                {pad.equipment_identified && pad.equipment_identified.length > 0 && (
                  <div className="row-between">
                    <span className="text-secondary">Identified</span>
                    <span style={{ fontWeight: 600 }}>{pad.equipment_identified.join(', ')}</span>
                  </div>
                )}
              </div>

              {pad.issues_found && pad.issues_found.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9375rem' }}>Issues Found</h4>
                  <div className="stack-sm">
                    {pad.issues_found.map((issue, i) => (
                      <div key={i} style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                        <div className="row-between" style={{ marginBottom: '0.25rem' }}>
                          <strong>{issue.equipment} — {issue.issue_type?.replace(/_/g, ' ')}</strong>
                          <span className={severityBadge(issue.severity)}>{issue.severity}</span>
                        </div>
                        {issue.location && <p className="text-secondary" style={{ fontSize: '0.8125rem' }}>Location: {issue.location}</p>}
                        {issue.description && <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>{issue.description}</p>}
                        {issue.corrective_action && <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}><span className="text-secondary">Fix:</span> {issue.corrective_action}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pump Analysis */}
          {pump?.applicable && (
            <div className="card">
              <h3 style={{ marginBottom: '0.75rem' }}>Pump</h3>
              <div className="stack-sm">
                {pump.pump_brand && (
                  <div className="row-between">
                    <span className="text-secondary">Brand</span>
                    <span style={{ fontWeight: 600 }}>{pump.pump_brand}</span>
                  </div>
                )}
                {pump.pump_type && pump.pump_type !== 'unknown' && (
                  <div className="row-between">
                    <span className="text-secondary">Type</span>
                    <span style={{ fontWeight: 600 }}>{pump.pump_type.replace(/_/g, ' ')}</span>
                  </div>
                )}
                {pump.priming_status && pump.priming_status !== 'unknown' && (
                  <div className="row-between">
                    <span className="text-secondary">Priming</span>
                    <span>{pump.priming_status.replace(/_/g, ' ')}</span>
                  </div>
                )}
                {pump.visible_condition && (
                  <>
                    {pump.visible_condition.basket_condition && (
                      <div className="row-between">
                        <span className="text-secondary">Basket</span>
                        <span>{pump.visible_condition.basket_condition.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                    {pump.visible_condition.lid_condition && (
                      <div className="row-between">
                        <span className="text-secondary">Lid</span>
                        <span>{pump.visible_condition.lid_condition.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                    {pump.visible_condition.housing_condition && (
                      <div className="row-between">
                        <span className="text-secondary">Housing</span>
                        <span>{pump.visible_condition.housing_condition.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                    {pump.visible_condition.motor_condition && (
                      <div className="row-between">
                        <span className="text-secondary">Motor</span>
                        <span>{pump.visible_condition.motor_condition.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                    {pump.visible_condition.seal_leak_evidence === true && (
                      <div className="warning-box" style={{ marginTop: '0.5rem' }}>
                        Seal leak evidence visible.
                      </div>
                    )}
                  </>
                )}
              </div>

              {pump.issues_found && pump.issues_found.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9375rem' }}>Issues Found</h4>
                  <div className="stack-sm">
                    {pump.issues_found.map((issue, i) => (
                      <div key={i} style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                        <div className="row-between" style={{ marginBottom: '0.25rem' }}>
                          <strong>{issue.issue_type?.replace(/_/g, ' ')}</strong>
                          <span className={severityBadge(issue.severity)}>{issue.severity}</span>
                        </div>
                        {issue.description && <p style={{ fontSize: '0.875rem' }}>{issue.description}</p>}
                        {issue.probable_cause && <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}><span className="text-secondary">Cause:</span> {issue.probable_cause}</p>}
                        {issue.corrective_action && <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}><span className="text-secondary">Fix:</span> {issue.corrective_action}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filter Analysis */}
          {filter?.applicable && (
            <div className="card">
              <h3 style={{ marginBottom: '0.75rem' }}>Filter</h3>
              <div className="stack-sm">
                {filter.filter_type && filter.filter_type !== 'unknown' && (
                  <div className="row-between">
                    <span className="text-secondary">Type</span>
                    <span style={{ fontWeight: 600 }}>{filter.filter_type}</span>
                  </div>
                )}
                {filter.filter_brand && (
                  <div className="row-between">
                    <span className="text-secondary">Brand</span>
                    <span style={{ fontWeight: 600 }}>{filter.filter_brand}</span>
                  </div>
                )}
                {filter.pressure_gauge_reading && (
                  <div className="row-between">
                    <span className="text-secondary">Pressure Gauge</span>
                    <span style={{ fontWeight: 600 }}>{filter.pressure_gauge_reading}</span>
                  </div>
                )}
                {filter.multiport_valve_position && (
                  <div className="row-between">
                    <span className="text-secondary">Valve Position</span>
                    <span style={{ fontWeight: 600 }}>{filter.multiport_valve_position}</span>
                  </div>
                )}
                {filter.service_due === true && (
                  <div className="warning-box" style={{ marginTop: '0.5rem' }}>
                    <strong>Service due.</strong>
                    {filter.service_recommendation && <p style={{ marginTop: '0.25rem' }}>{filter.service_recommendation}</p>}
                  </div>
                )}
              </div>

              {filter.issues_found && filter.issues_found.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9375rem' }}>Issues Found</h4>
                  <div className="stack-sm">
                    {filter.issues_found.map((issue, i) => (
                      <div key={i} style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                        <div className="row-between" style={{ marginBottom: '0.25rem' }}>
                          <strong>{issue.issue_type?.replace(/_/g, ' ')}</strong>
                          <span className={severityBadge(issue.severity)}>{issue.severity}</span>
                        </div>
                        {issue.description && <p style={{ fontSize: '0.875rem' }}>{issue.description}</p>}
                        {issue.corrective_action && <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}><span className="text-secondary">Fix:</span> {issue.corrective_action}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chemical Test Analysis */}
          {chem?.applicable && (
            <div className="card">
              <div className="row-between" style={{ marginBottom: '0.75rem' }}>
                <h3>Chemical Test</h3>
                {chem.overall_water_balance && (
                  <span className={actionBadgeClass(chem.overall_water_balance === 'balanced' ? 'pass' : chem.overall_water_balance === 'dangerous' ? 'do_not_open' : 'service_required')}>
                    {chem.overall_water_balance.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <div className="stack-sm">
                {chem.test_method && chem.test_method !== 'unknown' && (
                  <div className="row-between">
                    <span className="text-secondary">Test Method</span>
                    <span style={{ fontWeight: 600 }}>{chem.test_method.replace(/_/g, ' ')}</span>
                  </div>
                )}
                {chem.safe_for_swimming && (
                  <div className="row-between">
                    <span className="text-secondary">Safe for Swimming</span>
                    <span className={actionBadgeClass(chem.safe_for_swimming === 'yes' ? 'pass' : chem.safe_for_swimming === 'no' ? 'do_not_open' : 'service_required')}>
                      {chem.safe_for_swimming.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Readings */}
              {chem.readings && Object.values(chem.readings).some(v => v != null) && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9375rem' }}>Readings</h4>
                  <div className="stack-sm">
                    {chem.readings.free_chlorine_ppm != null && (
                      <div className="row-between"><span className="text-secondary">Free Chlorine</span><span style={{ fontWeight: 600 }}>{chem.readings.free_chlorine_ppm} ppm</span></div>
                    )}
                    {chem.readings.combined_chlorine_ppm != null && (
                      <div className="row-between"><span className="text-secondary">Combined Chlorine</span><span style={{ fontWeight: 600 }}>{chem.readings.combined_chlorine_ppm} ppm</span></div>
                    )}
                    {chem.readings.total_chlorine_ppm != null && (
                      <div className="row-between"><span className="text-secondary">Total Chlorine</span><span style={{ fontWeight: 600 }}>{chem.readings.total_chlorine_ppm} ppm</span></div>
                    )}
                    {chem.readings.pH != null && (
                      <div className="row-between"><span className="text-secondary">pH</span><span style={{ fontWeight: 600 }}>{chem.readings.pH}</span></div>
                    )}
                    {chem.readings.total_alkalinity_ppm != null && (
                      <div className="row-between"><span className="text-secondary">Total Alkalinity</span><span style={{ fontWeight: 600 }}>{chem.readings.total_alkalinity_ppm} ppm</span></div>
                    )}
                    {chem.readings.cyanuric_acid_ppm != null && (
                      <div className="row-between"><span className="text-secondary">Cyanuric Acid</span><span style={{ fontWeight: 600 }}>{chem.readings.cyanuric_acid_ppm} ppm</span></div>
                    )}
                    {chem.readings.calcium_hardness_ppm != null && (
                      <div className="row-between"><span className="text-secondary">Calcium Hardness</span><span style={{ fontWeight: 600 }}>{chem.readings.calcium_hardness_ppm} ppm</span></div>
                    )}
                    {chem.readings.salt_ppm != null && (
                      <div className="row-between"><span className="text-secondary">Salt</span><span style={{ fontWeight: 600 }}>{chem.readings.salt_ppm} ppm</span></div>
                    )}
                    {chem.readings.TDS_ppm != null && (
                      <div className="row-between"><span className="text-secondary">TDS</span><span style={{ fontWeight: 600 }}>{chem.readings.TDS_ppm} ppm</span></div>
                    )}
                    {chem.readings.phosphates_ppb != null && (
                      <div className="row-between"><span className="text-secondary">Phosphates</span><span style={{ fontWeight: 600 }}>{chem.readings.phosphates_ppb} ppb</span></div>
                    )}
                    {chem.readings.temperature_f != null && (
                      <div className="row-between"><span className="text-secondary">Temperature</span><span style={{ fontWeight: 600 }}>{chem.readings.temperature_f}°F</span></div>
                    )}
                  </div>
                </div>
              )}

              {/* Out of Range */}
              {chem.out_of_range_parameters && chem.out_of_range_parameters.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9375rem' }}>Out of Range</h4>
                  <div className="stack-sm">
                    {chem.out_of_range_parameters.map((p, i) => (
                      <div key={i} style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                        <div className="row-between" style={{ marginBottom: '0.25rem' }}>
                          <strong>{p.parameter}</strong>
                          <span className={p.condition === 'too_high' ? 'badge badge-red' : 'badge badge-amber'}>
                            {p.condition?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {p.current_value && <p className="text-secondary" style={{ fontSize: '0.8125rem' }}>Current: {p.current_value} {p.ideal_range ? `(ideal ${p.ideal_range})` : ''}</p>}
                        {p.health_or_equipment_impact && <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}><span className="text-secondary">Impact:</span> {p.health_or_equipment_impact}</p>}
                        {p.treatment && <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}><span className="text-secondary">Treatment:</span> {p.treatment}</p>}
                        {p.treatment_amount_guidance && <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}><span className="text-secondary">Dosing:</span> {p.treatment_amount_guidance}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Priority Treatments */}
              {chem.priority_treatments && chem.priority_treatments.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9375rem' }}>Priority Treatments</h4>
                  <div className="stack-sm">
                    {chem.priority_treatments.map((t, i) => (
                      <div key={i} className="row" style={{ gap: '0.75rem', alignItems: 'flex-start' }}>
                        <span className="badge badge-blue" style={{ minWidth: 'fit-content' }}>{t.priority}</span>
                        <div>
                          <strong>{t.chemical}</strong>
                          {t.action && <p style={{ fontSize: '0.875rem' }}>{t.action}</p>}
                          {t.reason && <p className="text-secondary" style={{ fontSize: '0.8125rem', marginTop: '0.125rem' }}>{t.reason}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Surface Condition Analysis */}
          {surface?.applicable && (
            <div className="card">
              <h3 style={{ marginBottom: '0.75rem' }}>Surface Condition</h3>
              {surface.surface_type && (
                <div className="row-between" style={{ marginBottom: '0.5rem' }}>
                  <span className="text-secondary">Surface Type</span>
                  <span style={{ fontWeight: 600 }}>{surface.surface_type}</span>
                </div>
              )}

              {surface.issues_found && surface.issues_found.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9375rem' }}>Issues Found</h4>
                  <div className="stack-sm">
                    {surface.issues_found.map((issue, i) => (
                      <div key={i} style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                        <div className="row-between" style={{ marginBottom: '0.25rem' }}>
                          <strong>{issue.issue_type?.replace(/_/g, ' ')}</strong>
                          <span className={severityBadge(issue.severity)}>{issue.severity}</span>
                        </div>
                        {issue.location && <p className="text-secondary" style={{ fontSize: '0.8125rem' }}>Location: {issue.location}</p>}
                        {issue.probable_cause && <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}><span className="text-secondary">Cause:</span> {issue.probable_cause}</p>}
                        {issue.treatment_approach && <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}><span className="text-secondary">Treatment:</span> {issue.treatment_approach}</p>}
                        {issue.urgency && (
                          <div style={{ marginTop: '0.25rem' }}>
                            <span className={urgencyBadgeClass(issue.urgency)}>{issue.urgency.replace(/_/g, ' ')}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Prioritized Actions */}
          {result.prioritized_actions && result.prioritized_actions.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '0.75rem' }}>Prioritized Actions</h3>
              <div className="stack-sm">
                {result.prioritized_actions.map((a, i) => (
                  <div key={i} className="row" style={{ gap: '0.75rem', alignItems: 'flex-start' }}>
                    <span className="badge badge-blue" style={{ minWidth: 'fit-content' }}>{a.priority}</span>
                    <span className={urgencyBadgeClass(a.urgency)} style={{ minWidth: 'fit-content', fontSize: '0.6875rem' }}>
                      {a.urgency?.replace(/_/g, ' ')}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div>{a.action}</div>
                      {a.reason && <p className="text-secondary" style={{ fontSize: '0.8125rem', marginTop: '0.125rem' }}>{a.reason}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Standards References */}
          {result.standards_references && result.standards_references.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '0.75rem' }}>Standards</h3>
              <div className="stack-sm">
                {result.standards_references.map((s, i) => (
                  <div key={i} style={{ fontSize: '0.875rem' }}>
                    <strong>{s.standard}</strong>
                    {s.section && <span className="text-secondary"> · {s.section}</span>}
                    {s.requirement_summary && <p className="text-secondary" style={{ marginTop: '0.125rem' }}>{s.requirement_summary}</p>}
                    {s.applies_to && <p className="text-muted" style={{ fontSize: '0.75rem' }}>Applies to: {s.applies_to}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Next Steps */}
          {result.recommended_next_steps && (
            <div className="card">
              <h3 style={{ marginBottom: '0.5rem' }}>Next Steps</h3>
              <p>{result.recommended_next_steps}</p>
            </div>
          )}

          {/* Confidence */}
          {result.confidence && (
            <div className="card">
              <div className="row-between">
                <span className="text-secondary">Confidence</span>
                <span className={confidenceBadgeClass(result.confidence)}>{result.confidence}</span>
              </div>
              {result.confidence_reasoning && (
                <p className="text-secondary" style={{ fontSize: '0.8125rem', marginTop: '0.5rem' }}>{result.confidence_reasoning}</p>
              )}
            </div>
          )}

          {/* Scope Disclaimer */}
          {result.scope_disclaimer && (
            <p className="text-muted" style={{ fontSize: '0.75rem', fontStyle: 'italic', padding: '0 0.5rem' }}>
              {result.scope_disclaimer}
            </p>
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
