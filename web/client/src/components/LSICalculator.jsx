import { useState } from 'react';

// LSI = pH + TF + CF + AF - 12.1
// Temperature Factor (TF)
const TEMP_TABLE = [
  [32, 0.0], [37, 0.1], [46, 0.2], [53, 0.3], [60, 0.4],
  [66, 0.5], [76, 0.6], [84, 0.7], [94, 0.8], [105, 0.9],
];

// Calcium Factor (CF) — log10(CH) * some factor, simplified lookup
const CA_TABLE = [
  [5, 0.3], [25, 1.0], [50, 1.3], [75, 1.5], [100, 1.6],
  [150, 1.8], [200, 1.9], [250, 2.0], [300, 2.0], [400, 2.1],
  [600, 2.2], [800, 2.3], [1000, 2.4],
];

// Alkalinity Factor (AF)
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

function getLSIStatus(lsi) {
  if (lsi < -0.3) return { label: 'Corrosive', color: '#EF4444', desc: 'Water is aggressive — etches plaster, dissolves grout, corrodes metal. Raise pH, TA, or CH.' };
  if (lsi > 0.3) return { label: 'Scaling', color: '#F59E0B', desc: 'Water tends to deposit calcium scale on surfaces and equipment. Lower pH or TA.' };
  return { label: 'Balanced', color: '#14B8A6', desc: 'Water is balanced — neither corrosive nor scaling. Ideal range.' };
}

export default function LSICalculator() {
  const [pH, setPH] = useState('');
  const [temp, setTemp] = useState('');
  const [ch, setCH] = useState('');
  const [ta, setTA] = useState('');
  const [result, setResult] = useState(null);

  const handleCalc = () => {
    const pHVal = parseFloat(pH);
    const tempVal = parseFloat(temp);
    const chVal = parseFloat(ch);
    const taVal = parseFloat(ta);

    if ([pHVal, tempVal, chVal, taVal].some(isNaN)) return;

    const lsi = calcLSI(pHVal, tempVal, chVal, taVal);
    const status = getLSIStatus(lsi);
    setResult({ lsi: lsi.toFixed(2), ...status });
  };

  return (
    <div className="stack">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="form-group">
          <label>pH</label>
          <input className="input" type="number" step="0.1" placeholder="7.4" value={pH} onChange={(e) => setPH(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Water Temp ({'\u00b0'}F)</label>
          <input className="input" type="number" placeholder="82" value={temp} onChange={(e) => setTemp(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Calcium Hardness (ppm)</label>
          <input className="input" type="number" placeholder="300" value={ch} onChange={(e) => setCH(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Total Alkalinity (ppm)</label>
          <input className="input" type="number" placeholder="100" value={ta} onChange={(e) => setTA(e.target.value)} />
        </div>
      </div>

      <button className="btn btn-primary btn-block" onClick={handleCalc}>
        Calculate LSI
      </button>

      {result && (
        <div className="card" style={{ textAlign: 'center' }}>
          <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Langelier Saturation Index</p>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: result.color }}>{result.lsi}</p>
          <span className="badge" style={{ backgroundColor: `${result.color}22`, color: result.color, marginBottom: '0.5rem' }}>
            {result.label}
          </span>
          <p className="text-secondary" style={{ fontSize: '0.8125rem', marginTop: '0.5rem' }}>{result.desc}</p>
        </div>
      )}

      <div className="card" style={{ fontSize: '0.8125rem', color: '#A0A0A8' }}>
        <strong style={{ color: '#F5F5F5' }}>LSI Quick Guide</strong>
        <div style={{ marginTop: '0.5rem', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.25rem 0.75rem' }}>
          <span style={{ color: '#EF4444' }}>Below -0.3</span><span>Corrosive — damages plaster & metal</span>
          <span style={{ color: '#14B8A6' }}>-0.3 to +0.3</span><span>Balanced — ideal target</span>
          <span style={{ color: '#F59E0B' }}>Above +0.3</span><span>Scaling — calcium deposits form</span>
        </div>
      </div>
    </div>
  );
}
