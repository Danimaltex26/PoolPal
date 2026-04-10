import { useState, useMemo } from 'react';

// LSI = pH + TF + CF + AF - 12.1
const TEMP_TABLE = [
  [32, 0.0], [37, 0.1], [46, 0.2], [53, 0.3], [60, 0.4],
  [66, 0.5], [76, 0.6], [84, 0.7], [94, 0.8], [105, 0.9],
];
const CA_TABLE = [
  [5, 0.3], [25, 1.0], [50, 1.3], [75, 1.5], [100, 1.6],
  [150, 1.8], [200, 1.9], [250, 2.0], [300, 2.0], [400, 2.1],
  [600, 2.2], [800, 2.3], [1000, 2.4],
];
const ALK_TABLE = [
  [5, 0.7], [25, 1.4], [50, 1.7], [75, 1.9], [100, 2.0],
  [125, 2.1], [150, 2.2], [200, 2.3], [250, 2.4], [300, 2.5],
  [400, 2.6], [600, 2.8], [800, 2.9],
];

function interpolate(table, value) {
  if (value <= table[0][0]) return table[0][1];
  if (value >= table[table.length - 1][0]) return table[table.length - 1][1];
  for (let i = 0; i < table.length - 1; i++) {
    const [x0, y0] = table[i];
    const [x1, y1] = table[i + 1];
    if (value >= x0 && value <= x1) {
      return y0 + ((value - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return table[table.length - 1][1];
}

function calcLSI(pH, temp, ch, ta) {
  const TF = interpolate(TEMP_TABLE, temp);
  const CF = interpolate(CA_TABLE, ch);
  const AF = interpolate(ALK_TABLE, ta);
  return pH + TF + CF + AF - 12.1;
}

function getLSIColor(lsi) {
  if (lsi < -0.3) return '#EF4444';
  if (lsi > 0.3) return '#F59E0B';
  return '#14B8A6';
}

function getLSILabel(lsi) {
  if (lsi < -0.3) return 'Corrosive';
  if (lsi > 0.3) return 'Scaling';
  return 'Balanced';
}

const PARAMS = [
  { key: 'temp', label: 'Water \u00b0F', min: 32, max: 104, step: 1, default: 82 },
  { key: 'ph', label: 'pH', min: 6.8, max: 8.4, step: 0.1, default: 7.5 },
  { key: 'ta', label: 'Total Alkalinity', min: 0, max: 300, step: 5, default: 100 },
  { key: 'ch', label: 'Calcium', min: 0, max: 800, step: 10, default: 300 },
  { key: 'cya', label: 'CYA', min: 0, max: 150, step: 5, default: 40 },
  { key: 'tds', label: 'TDS / Salt', min: 0, max: 6000, step: 100, default: 1500 },
];

const inputStyle = {
  width: '100%',
  minHeight: 36,
  padding: '4px 6px',
  backgroundColor: '#0D0D0F',
  border: '1px solid #2A2A2E',
  borderRadius: 6,
  color: '#F5F5F5',
  fontSize: '0.9375rem',
  textAlign: 'center',
  outline: 'none',
};

const sliderStyle = {
  width: '100%',
  accentColor: '#14B8A6',
  cursor: 'pointer',
  height: 4,
};

export default function LSICalculator() {
  const [current, setCurrent] = useState(
    Object.fromEntries(PARAMS.map((p) => [p.key, p.default]))
  );
  const [desired, setDesired] = useState(
    Object.fromEntries(PARAMS.map((p) => [p.key, p.default]))
  );

  const updateCurrent = (key, val) => setCurrent((prev) => ({ ...prev, [key]: parseFloat(val) || 0 }));
  const updateDesired = (key, val) => setDesired((prev) => ({ ...prev, [key]: parseFloat(val) || 0 }));

  // Effective TA = TA - (CYA / 3) for LSI correction
  const effectiveTA = (ta, cya) => Math.max(ta - cya / 3, 0);

  const currentLSI = useMemo(() =>
    calcLSI(current.ph, current.temp, current.ch, effectiveTA(current.ta, current.cya)),
    [current]
  );
  const desiredLSI = useMemo(() =>
    calcLSI(desired.ph, desired.temp, desired.ch, effectiveTA(desired.ta, desired.cya)),
    [desired]
  );

  const currentColor = getLSIColor(currentLSI);
  const desiredColor = getLSIColor(desiredLSI);

  return (
    <div className="stack">
      {/* LSI Results */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '0.75rem' }}>
          <p className="text-secondary" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Current LSI</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: currentColor }}>{currentLSI.toFixed(2)}</p>
          <span className="badge" style={{ backgroundColor: `${currentColor}22`, color: currentColor, fontSize: '0.6875rem' }}>
            {getLSILabel(currentLSI)}
          </span>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '0.75rem' }}>
          <p className="text-secondary" style={{ fontSize: '0.75rem', marginBottom: 2 }}>Desired LSI</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: desiredColor }}>{desiredLSI.toFixed(2)}</p>
          <span className="badge" style={{ backgroundColor: `${desiredColor}22`, color: desiredColor, fontSize: '0.6875rem' }}>
            {getLSILabel(desiredLSI)}
          </span>
        </div>
      </div>

      {/* Parameter Rows */}
      <div className="card" style={{ padding: '0.75rem' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #2A2A2E' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#A0A0A8' }}>Parameter</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#14B8A6', textAlign: 'center' }}>Current</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#14B8A6', textAlign: 'center' }}>Desired</span>
        </div>

        {PARAMS.map((p) => (
          <div key={p.key} style={{ marginBottom: '0.875rem' }}>
            {/* Label */}
            <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#A0A0A8', marginBottom: '0.25rem' }}>
              {p.label}
            </div>

            {/* Inputs row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <input
                type="number"
                style={inputStyle}
                value={current[p.key]}
                step={p.step}
                min={p.min}
                max={p.max}
                onChange={(e) => updateCurrent(p.key, e.target.value)}
              />
              <input
                type="number"
                style={inputStyle}
                value={desired[p.key]}
                step={p.step}
                min={p.min}
                max={p.max}
                onChange={(e) => updateDesired(p.key, e.target.value)}
              />
            </div>

            {/* Sliders row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <input
                type="range"
                style={sliderStyle}
                value={current[p.key]}
                min={p.min}
                max={p.max}
                step={p.step}
                onChange={(e) => updateCurrent(p.key, e.target.value)}
              />
              <input
                type="range"
                style={sliderStyle}
                value={desired[p.key]}
                min={p.min}
                max={p.max}
                step={p.step}
                onChange={(e) => updateDesired(p.key, e.target.value)}
              />
            </div>

            {/* Min/Max labels */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div className="row-between" style={{ gap: 0 }}>
                <span style={{ fontSize: '0.625rem', color: '#6B6B73' }}>{p.min}</span>
                <span style={{ fontSize: '0.625rem', color: '#6B6B73' }}>{p.max}</span>
              </div>
              <div className="row-between" style={{ gap: 0 }}>
                <span style={{ fontSize: '0.625rem', color: '#6B6B73' }}>{p.min}</span>
                <span style={{ fontSize: '0.625rem', color: '#6B6B73' }}>{p.max}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reference guide */}
      <div className="card" style={{ fontSize: '0.8125rem', color: '#A0A0A8', padding: '0.75rem' }}>
        <strong style={{ color: '#F5F5F5' }}>LSI Guide</strong>
        <div style={{ marginTop: '0.375rem', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.25rem 0.75rem' }}>
          <span style={{ color: '#EF4444' }}>Below -0.3</span><span>Corrosive — etches plaster, corrodes metal</span>
          <span style={{ color: '#14B8A6' }}>-0.3 to +0.3</span><span>Balanced — target range</span>
          <span style={{ color: '#F59E0B' }}>Above +0.3</span><span>Scaling — calcium deposits on surfaces</span>
        </div>
        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
          CYA correction applied: Effective TA = TA - (CYA &divide; 3)
        </p>
      </div>
    </div>
  );
}
