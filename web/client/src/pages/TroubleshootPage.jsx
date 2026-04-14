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
    return (
      <div className="page">
        <div className="stack">
          <div className="page-header">
            <h2>Diagnosis</h2>
            {model && <div style={{ fontSize: '0.6875rem', color: '#6B6B73', marginTop: '0.25rem' }}>{model}</div>}
          </div>

          {/* Summary */}
          {result.plain_english_summary && (
            <div className="card">
              <p style={{ fontSize: '1.125rem', lineHeight: 1.6 }}>{result.plain_english_summary}</p>
            </div>
          )}

          {/* Probable Causes */}
          {result.probable_causes && result.probable_causes.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '0.75rem' }}>Probable Causes</h3>
              <div className="stack-sm">
                {result.probable_causes.map((c, i) => (
                  <div key={i} style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #2A2A2E' }}>
                    <div className="row" style={{ gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, color: '#14B8A6', minWidth: 24 }}>#{c.rank || i + 1}</span>
                      <strong>{c.cause}</strong>
                      {c.likelihood && (
                        <span className={`badge ${c.likelihood === 'high' ? 'badge-red' : c.likelihood === 'medium' ? 'badge-amber' : 'badge-gray'}`}>
                          {c.likelihood}
                        </span>
                      )}
                    </div>
                    {c.explanation && <p className="text-secondary" style={{ fontSize: '0.875rem', marginLeft: 32 }}>{c.explanation}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step-by-Step Fix */}
          {result.step_by_step_fix && result.step_by_step_fix.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '0.75rem' }}>Step-by-Step Fix</h3>
              <div className="stack-sm">
                {result.step_by_step_fix.map((s, i) => (
                  <div key={i} className="row" style={{ gap: '0.5rem', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: 700, color: '#14B8A6', minWidth: 24 }}>{s.step || i + 1}</span>
                    <div>
                      <p>{s.action}</p>
                      {s.tip && <p className="text-secondary" style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Tip: {s.tip}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parts to Check */}
          {result.parts_to_check && result.parts_to_check.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '0.75rem' }}>Parts to Check</h3>
              <div className="stack-sm">
                {result.parts_to_check.map((p, i) => (
                  <div key={i} className="row-between" style={{ padding: '0.5rem 0', borderBottom: '1px solid #2A2A2E' }}>
                    <div>
                      <strong>{p.part}</strong>
                      {p.symptom_if_failed && <p className="text-secondary" style={{ fontSize: '0.8125rem' }}>{p.symptom_if_failed}</p>}
                    </div>
                    {p.estimated_cost && <span className="text-secondary" style={{ fontSize: '0.875rem' }}>{p.estimated_cost}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Escalation */}
          {result.escalate_if && (
            <div className="warning-box">
              <strong>Escalate if:</strong> {result.escalate_if}
            </div>
          )}

          {/* Estimated Fix Time */}
          {result.estimated_fix_time && (
            <div className="info-box">
              <strong>Estimated Fix Time:</strong> {result.estimated_fix_time}
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
