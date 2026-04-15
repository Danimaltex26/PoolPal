import { useState } from 'react';
import { apiPost } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const EQUIPMENT_TYPES = ['Pump', 'Heater', 'Filter', 'Salt Cell', 'Chemical Balance', 'Automation', 'Cleaner', 'Other'];

const EQUIPMENT_BRANDS = {
  Pump: [
    'Pentair IntelliFlo VSF',
    'Pentair IntelliFlo 3',
    'Pentair SuperFlo VS',
    'Pentair WhisperFlo',
    'Hayward TriStar VS',
    'Hayward Super Pump VS',
    'Hayward MaxFlo VS',
    'Hayward EcoStar',
    'Jandy FloPro VS',
    'Jandy Stealth',
    'Jandy ePump',
    'Sta-Rite IntelliPro',
    'Sta-Rite Max-E-Pro',
    'Waterway Champion',
    'Waterway SVL56',
    'Speck Badu EcoM3',
    'Blue Torrent Cyclone',
  ],
  Heater: [
    'Pentair MasterTemp 250',
    'Pentair MasterTemp 400',
    'Pentair UltraTemp Heat Pump',
    'Pentair Max-E-Therm',
    'Hayward H-Series H250',
    'Hayward H-Series H400',
    'Hayward HeatPro Heat Pump',
    'Hayward Universal H-Series Low NOx',
    'Raypak 266A',
    'Raypak 336A',
    'Raypak 406A',
    'Raypak Crosswind Heat Pump',
    'Jandy LXi 300',
    'Jandy LXi 400',
    'Jandy JE Heat Pump',
    'Rheem / Ruud P-M206A',
    'Rheem / Ruud P-M406A',
    'AquaCal TropiCal Heat Pump',
    'AquaCal HeatWave SuperQuiet',
  ],
  Filter: [
    'Pentair Clean & Clear Plus (Cartridge)',
    'Pentair FNS Plus (DE)',
    'Pentair Triton II (Sand)',
    'Pentair Quad DE',
    'Hayward SwimClear (Cartridge)',
    'Hayward ProGrid (DE)',
    'Hayward Pro-Series (Sand)',
    'Hayward Star-Clear Plus (Cartridge)',
    'Jandy CV/CL (Cartridge)',
    'Jandy DEL (DE)',
    'Waterway ClearWater II (Cartridge)',
    'Waterway ProClean (DE)',
    'Sta-Rite System 3 (Cartridge/DE)',
    'Sta-Rite Posi-Clear (Cartridge)',
  ],
  'Salt Cell': [
    'Pentair IntelliChlor IC15',
    'Pentair IntelliChlor IC20',
    'Pentair IntelliChlor IC40',
    'Pentair IntelliChlor IC60',
    'Hayward T-Cell-3 (15K gal)',
    'Hayward T-Cell-9 (25K gal)',
    'Hayward T-Cell-15 (40K gal)',
    'Hayward AquaRite',
    'Jandy AquaPure 700',
    'Jandy AquaPure 1400',
    'Jandy TruClear',
    'CircuPool RJ-30',
    'CircuPool RJ-45',
    'CircuPool RJ-60',
    'CompuPool CPSC16',
    'CompuPool CPSC24',
    'CompuPool CPSC36',
    'AutoPilot Salt Power',
    'AutoPilot Pool Pilot Digital',
    'ControlOMatic SmarterSpa',
  ],
  Automation: [
    'Pentair IntelliCenter',
    'Pentair EasyTouch',
    'Pentair SunTouch',
    'Pentair ScreenLogic',
    'Hayward OmniLogic',
    'Hayward ProLogic',
    'Hayward AquaConnect',
    'Jandy iAquaLink',
    'Jandy AquaLink RS',
    'Jandy AquaPalm',
    'Intermatic PE653RC',
  ],
  Cleaner: [
    'Pentair Rebel (Suction)',
    'Pentair Racer (Pressure)',
    'Pentair Prowler 930 (Robotic)',
    'Hayward PoolVac XL (Suction)',
    'Hayward Navigator Pro (Suction)',
    'Hayward AquaNaut 400 (Suction)',
    'Hayward TigerShark (Robotic)',
    'Hayward AquaVac 6 Series (Robotic)',
    'Polaris 280 (Pressure)',
    'Polaris 380 (Pressure)',
    'Polaris 3900 Sport (Pressure)',
    'Polaris P945 (Robotic)',
    'Zodiac MX6/MX8 (Suction)',
    'Zodiac Baracuda G3/G4 (Suction)',
    'Dolphin Nautilus CC Plus (Robotic)',
    'Dolphin Premier (Robotic)',
    'Dolphin Sigma (Robotic)',
    'Maytronics S200 (Robotic)',
  ],
  'Chemical Balance': [],
  Other: [],
};

const POOL_TYPES = ['Chlorine', 'Salt', 'Biguanide', 'Mineral', 'Bromine'];
const ENVIRONMENTS = ['Residential', 'Commercial', 'Indoor', 'Outdoor'];
const ALREADY_TRIED_OPTIONS = [
  'Checked water level',
  'Cleaned filter/basket',
  'Checked for leaks',
  'Primed pump',
  'Checked gas supply',
  'Tested water chemistry',
  'Nothing yet',
];

const AI_MESSAGES = [
  'Analyzing the issue...',
  'Checking common causes...',
  'Building diagnosis...',
];

export default function TroubleshootPage() {
  const [form, setForm] = useState({
    equipment_type: '',
    equipment_brand: '',
    pool_type: '',
    symptom: '',
    environment: '',
    already_tried: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [model, setModel] = useState('');

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleTried = (opt) => {
    setForm((prev) => {
      const arr = prev.already_tried.includes(opt)
        ? prev.already_tried.filter((o) => o !== opt)
        : [...prev.already_tried, opt];
      return { ...prev, already_tried: arr };
    });
  };

  const brandOptions = EQUIPMENT_BRANDS[form.equipment_type] || [];

  const handleSubmit = async () => {
    if (!form.symptom.trim()) {
      setError('Please describe the symptom.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const data = await apiPost('/troubleshoot', form);
      setResult(data.result || data);
      setModel(data.model || '');
    } catch (err) {
      setError(err.message || 'Troubleshoot failed.');
    } finally {
      setLoading(false);
    }
  };

  function handleReset() {
    setResult(null);
    setModel('');
    setError('');
    setForm({
      equipment_type: '',
      equipment_brand: '',
      pool_type: '',
      symptom: '',
      environment: '',
      already_tried: [],
    });
  }

  if (loading) {
    return (
      <div className="page">
        <LoadingSpinner messages={AI_MESSAGES} />
      </div>
    );
  }

  if (result) {
    const swim = (result.safe_to_swim || '').toLowerCase();
    const swimBg = swim === 'yes' ? 'rgba(16,185,129,0.15)'
                 : swim === 'no' ? 'rgba(239,68,68,0.15)'
                 : swim === 'test_required' ? 'rgba(245,158,11,0.15)'
                 : 'rgba(255,255,255,0.05)';
    const swimBorder = swim === 'yes' ? '#10B981'
                     : swim === 'no' ? '#EF4444'
                     : swim === 'test_required' ? '#F59E0B'
                     : '#14B8A6';
    const swimLabel = swim === 'yes' ? 'Safe to swim'
                    : swim === 'no' ? 'Not safe to swim'
                    : swim === 'test_required' ? 'Test before swimming'
                    : result.safe_to_swim;

    return (
      <div className="page">
        <div className="stack">
          <div className="page-header">
            <h2>Diagnosis</h2>
            {model && <div style={{ fontSize: '0.6875rem', color: '#6B6B73', marginTop: '0.25rem' }}>{model}</div>}
          </div>

          {/* Safe to Swim — top priority, always shown if populated */}
          {result.safe_to_swim && (
            <div className="card" style={{ background: swimBg, borderLeft: `4px solid ${swimBorder}` }}>
              <h3 style={{ marginBottom: '0.375rem', color: swimBorder }}>{swimLabel}</h3>
              {result.safe_to_swim_reasoning && (
                <p style={{ fontSize: '0.9375rem' }}>{result.safe_to_swim_reasoning}</p>
              )}
            </div>
          )}

          {/* Safety callout — only for genuine hazards beyond routine issues */}
          {result.safety_callout && (
            <div className="warning-box">
              <strong>Safety: </strong>{result.safety_callout}
            </div>
          )}

          {/* Plain English Summary */}
          {result.plain_english_summary && (
            <div className="card">
              <p style={{ fontSize: '1.0625rem', lineHeight: 1.6 }}>{result.plain_english_summary}</p>
            </div>
          )}

          {/* Do Not Do — common-mistake warning */}
          {result.do_not_do && (
            <div className="card" style={{ borderLeft: '4px solid #EF4444', background: 'rgba(239,68,68,0.05)' }}>
              <h3 style={{ marginBottom: '0.375rem', color: '#EF4444' }}>Do not</h3>
              <p style={{ fontSize: '0.9375rem' }}>{result.do_not_do}</p>
            </div>
          )}

          {/* Probable Causes — each with chemistry_corrections, fix_path, parts_to_check */}
          {result.probable_causes && result.probable_causes.length > 0 && (
            <div className="stack">
              <h3>Probable Causes</h3>
              {result.probable_causes.map((c, i) => {
                const rank = c.rank ?? i + 1;
                const fixSteps = c.fix_path || c.fix_steps || [];
                const parts = c.parts_to_check || [];
                const chem = c.chemistry_corrections;
                const chemApplicable = chem && chem.applicable && Array.isArray(chem.parameters_to_adjust) && chem.parameters_to_adjust.length > 0;
                return (
                  <div key={i} className="card">
                    <div className="row" style={{ marginBottom: '0.5rem', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div className="row" style={{ gap: '0.5rem', alignItems: 'center' }}>
                        <div style={{
                          minWidth: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: '#14B8A6',
                          color: '#fff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                        }}>
                          {rank}
                        </div>
                        <strong style={{ lineHeight: 1.3 }}>{c.cause}</strong>
                      </div>
                      {c.likelihood && (
                        <span className={`badge ${c.likelihood === 'high' ? 'badge-red' : c.likelihood === 'medium' ? 'badge-amber' : 'badge-gray'}`}>
                          {c.likelihood}
                        </span>
                      )}
                    </div>

                    {c.explanation && (
                      <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                        {c.explanation}
                      </p>
                    )}

                    {chemApplicable && (
                      <div style={{ marginBottom: parts.length > 0 || fixSteps.length > 0 ? '0.75rem' : 0 }}>
                        <p className="text-secondary" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.375rem' }}>
                          Chemistry Corrections
                        </p>
                        <div className="stack-sm">
                          {chem.parameters_to_adjust.map((p, pi) => (
                            <div key={pi} style={{ padding: '0.625rem', background: 'rgba(20,184,166,0.08)', borderLeft: '3px solid #14B8A6', borderRadius: 4 }}>
                              <div className="row-between" style={{ marginBottom: '0.25rem', alignItems: 'flex-start' }}>
                                <strong style={{ fontSize: '0.9375rem' }}>{p.parameter}</strong>
                                {p.current_value && (
                                  <span className="text-secondary" style={{ fontSize: '0.8125rem', flexShrink: 0, marginLeft: '0.5rem' }}>
                                    Now: {p.current_value}
                                  </span>
                                )}
                              </div>
                              {p.target_range && (
                                <p style={{ fontSize: '0.8125rem' }}>
                                  <span className="text-secondary">Target: </span>{p.target_range}
                                </p>
                              )}
                              {p.treatment && (
                                <p style={{ fontSize: '0.8125rem', marginTop: '0.125rem' }}>
                                  <span className="text-secondary">Treatment: </span>{p.treatment}
                                </p>
                              )}
                              {p.dosing_guidance && (
                                <p style={{ fontSize: '0.8125rem', marginTop: '0.125rem', fontStyle: 'italic' }}>
                                  {p.dosing_guidance}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {parts.length > 0 && (
                      <div style={{ marginBottom: fixSteps.length > 0 ? '0.75rem' : 0 }}>
                        <p className="text-secondary" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.375rem' }}>
                          Parts to Check
                        </p>
                        <div className="stack-sm">
                          {parts.map((p, pi) => (
                            <div key={pi} style={{ padding: '0.5rem 0.625rem', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                              <div className="row-between" style={{ marginBottom: '0.25rem', alignItems: 'flex-start' }}>
                                <strong style={{ fontSize: '0.9375rem' }}>{p.part}</strong>
                                {p.estimated_cost && <span className="text-secondary" style={{ fontSize: '0.8125rem', flexShrink: 0, marginLeft: '0.5rem' }}>{p.estimated_cost}</span>}
                              </div>
                              {p.symptom_if_failed && (
                                <p className="text-secondary" style={{ fontSize: '0.8125rem' }}>
                                  <em>If failed:</em> {p.symptom_if_failed}
                                </p>
                              )}
                              {p.test_method && (
                                <p className="text-secondary" style={{ fontSize: '0.8125rem', marginTop: '0.125rem' }}>
                                  <em>Test:</em> {p.test_method}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {fixSteps.length > 0 && (
                      <div style={{ paddingLeft: '0.5rem', borderLeft: '2px solid #2A2A2E' }}>
                        <p className="text-secondary" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                          Fix Path
                        </p>
                        <div className="stack-sm">
                          {fixSteps.map((step, si) => (
                            <div key={si} className="row" style={{ gap: '0.5rem', alignItems: 'flex-start' }}>
                              <span style={{ fontWeight: 600, color: '#14B8A6', minWidth: 18, fontSize: '0.875rem' }}>
                                {step.step ?? si + 1}.
                              </span>
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.9375rem' }}>{step.action || step.instruction || step}</p>
                                {step.tip && (
                                  <p className="text-secondary" style={{ fontSize: '0.8125rem', marginTop: '0.25rem', fontStyle: 'italic' }}>
                                    Tip: {step.tip}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Escalation */}
          {result.escalate_if && (
            <div className="warning-box">
              <strong>Escalate if: </strong>{result.escalate_if}
            </div>
          )}

          {/* Estimated Fix Time + Standards Reference */}
          {(result.estimated_fix_time || result.standards_reference) && (
            <div className="card">
              {result.estimated_fix_time && (
                <p style={{ fontSize: '0.9375rem', marginBottom: result.standards_reference ? '0.5rem' : 0 }}>
                  <span className="text-secondary">Estimated fix time: </span>
                  <strong>{result.estimated_fix_time}</strong>
                </p>
              )}
              {result.standards_reference && (
                <p style={{ fontSize: '0.9375rem' }}>
                  <span className="text-secondary">Standard: </span>
                  <strong>{result.standards_reference}</strong>
                </p>
              )}
            </div>
          )}

          {/* Confidence */}
          {result.confidence && (
            <div className="card">
              <div className="row-between" style={{ alignItems: 'center' }}>
                <span className="text-secondary">Confidence</span>
                <span className={`badge ${result.confidence === 'high' ? 'badge-green' : result.confidence === 'medium' ? 'badge-amber' : 'badge-red'}`}>
                  {result.confidence}
                </span>
              </div>
              {result.confidence_reasoning && (
                <p className="text-secondary" style={{ fontSize: '0.8125rem', marginTop: '0.5rem' }}>
                  {result.confidence_reasoning}
                </p>
              )}
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
          <h2>Troubleshoot</h2>
          <p className="text-secondary" style={{ marginTop: '0.25rem' }}>
            Describe your issue and get an AI-powered diagnosis
          </p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="form-group">
          <label>Equipment Type</label>
          <select
            className="select"
            value={form.equipment_type}
            onChange={(e) => {
              set('equipment_type', e.target.value);
              set('equipment_brand', '');
            }}
          >
            <option value="">Select...</option>
            {EQUIPMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {brandOptions.length > 0 ? (
          <div className="form-group">
            <label>Equipment Brand / Model</label>
            <select className="select" value={form.equipment_brand} onChange={(e) => set('equipment_brand', e.target.value)}>
              <option value="">Select...</option>
              {brandOptions.map((b) => <option key={b} value={b}>{b}</option>)}
              <option value="__other">Other (not listed)</option>
            </select>
            {form.equipment_brand === '__other' && (
              <input
                className="input"
                style={{ marginTop: '0.5rem' }}
                placeholder="Type brand / model"
                value=""
                onChange={(e) => set('equipment_brand', e.target.value)}
              />
            )}
          </div>
        ) : form.equipment_type && form.equipment_type !== 'Chemical Balance' ? (
          <div className="form-group">
            <label>Equipment Brand / Model</label>
            <input className="input" placeholder="e.g. brand and model" value={form.equipment_brand} onChange={(e) => set('equipment_brand', e.target.value)} />
          </div>
        ) : null}

        <div className="form-group">
          <label>Pool Type</label>
          <select className="select" value={form.pool_type} onChange={(e) => set('pool_type', e.target.value)}>
            <option value="">Select...</option>
            {POOL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Symptom *</label>
          <textarea
            className="input"
            rows={4}
            style={{ resize: 'vertical' }}
            placeholder="Describe what's happening..."
            value={form.symptom}
            onChange={(e) => set('symptom', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Environment</label>
          <select className="select" value={form.environment} onChange={(e) => set('environment', e.target.value)}>
            <option value="">Select...</option>
            {ENVIRONMENTS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Already Tried</label>
          <div className="stack-sm">
            {ALREADY_TRIED_OPTIONS.map((opt) => (
              <label key={opt} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={form.already_tried.includes(opt)}
                  onChange={() => toggleTried(opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        <button className="btn btn-primary btn-block" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Analyzing...' : 'Get Diagnosis'}
        </button>
      </div>
    </div>
  );
}
