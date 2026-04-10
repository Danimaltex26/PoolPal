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

// --- Dosing calculations ---
function formatAmount(oz, unit) {
  if (unit === 'fl oz' && oz >= 128) return `${(oz / 128).toFixed(1)} gal`;
  if (unit === 'oz' && oz >= 16) return `${(oz / 16).toFixed(1)} lbs`;
  return `${oz.toFixed(1)} ${unit}`;
}

function calcTreatmentPlan(current, desired, gallons) {
  const items = [];
  const vol = gallons || 0;
  if (vol <= 0) return items;

  // pH — raise with soda ash, lower with muriatic acid
  const phDiff = desired.ph - current.ph;
  if (phDiff > 0.05) {
    // Soda ash: ~6 oz per 0.4 pH rise per 10K gal
    const oz = (phDiff / 0.4) * 6 * (vol / 10000);
    items.push({ chemical: 'Soda Ash (sodium carbonate)', amount: formatAmount(oz, 'oz'), direction: 'raise pH', note: 'Pre-dissolve in bucket, pour near return jet' });
  } else if (phDiff < -0.05) {
    // Muriatic acid: ~12 fl oz per 0.4 pH drop per 10K gal
    const oz = (Math.abs(phDiff) / 0.4) * 12 * (vol / 10000);
    items.push({ chemical: 'Muriatic Acid (31.45% HCl)', amount: formatAmount(oz, 'fl oz'), direction: 'lower pH', note: 'Add slowly around perimeter, pump running' });
  }

  // TA — raise with baking soda (lowering TA requires acid, already covered by pH)
  const taDiff = desired.ta - current.ta;
  if (taDiff > 2) {
    // Baking soda: 2.4 oz per 1 ppm per 10K gal
    const oz = taDiff * 2.4 * (vol / 10000);
    items.push({ chemical: 'Baking Soda (sodium bicarbonate)', amount: formatAmount(oz, 'oz'), direction: `raise TA ${taDiff.toFixed(0)} ppm`, note: 'Max 2 lbs per 10K gal per dose, wait 6 hrs between' });
  } else if (taDiff < -2) {
    // Lowering TA is done with acid — note this
    items.push({ chemical: 'Muriatic Acid (aeration method)', amount: 'See pH dose above', direction: `lower TA ${Math.abs(taDiff).toFixed(0)} ppm`, note: 'Lower pH to 7.0 with acid, then aerate to raise pH back — repeat until TA drops' });
  }

  // CH — raise with calcium chloride (no chemical to lower — dilution only)
  const chDiff = desired.ch - current.ch;
  if (chDiff > 5) {
    // CaCl2 77%: 2 oz per 1 ppm per 10K gal
    const oz = chDiff * 2.0 * (vol / 10000);
    items.push({ chemical: 'Calcium Chloride (77%)', amount: formatAmount(oz, 'oz'), direction: `raise CH ${chDiff.toFixed(0)} ppm`, note: 'Pre-dissolve in bucket (exothermic!), never through skimmer' });
  } else if (chDiff < -5) {
    items.push({ chemical: 'Partial drain & refill', amount: `~${Math.round((Math.abs(chDiff) / current.ch) * 100)}% water replacement`, direction: `lower CH ${Math.abs(chDiff).toFixed(0)} ppm`, note: 'No chemical lowers CH — only dilution works' });
  }

  // CYA — raise with stabilizer (no chemical to lower — dilution only)
  const cyaDiff = desired.cya - current.cya;
  if (cyaDiff > 2) {
    // CYA: 1.3 oz per 1 ppm per 10K gal
    const oz = cyaDiff * 1.3 * (vol / 10000);
    items.push({ chemical: 'Cyanuric Acid (stabilizer)', amount: formatAmount(oz, 'oz'), direction: `raise CYA ${cyaDiff.toFixed(0)} ppm`, note: 'Dissolve in sock in skimmer, takes 3-7 days to register' });
  } else if (cyaDiff < -2) {
    items.push({ chemical: 'Partial drain & refill', amount: `~${Math.round((Math.abs(cyaDiff) / current.cya) * 100)}% water replacement`, direction: `lower CYA ${Math.abs(cyaDiff).toFixed(0)} ppm`, note: 'CYA does not degrade — only leaves through water removal' });
  }

  return items;
}

export default function LSICalculator() {
  const [poolVolume, setPoolVolume] = useState('');
  const [current, setCurrent] = useState(
    Object.fromEntries(PARAMS.map((p) => [p.key, p.default]))
  );
  const [desired, setDesired] = useState(
    Object.fromEntries(PARAMS.map((p) => [p.key, p.default]))
  );

  const updateCurrent = (key, val) => setCurrent((prev) => ({ ...prev, [key]: parseFloat(val) || 0 }));
  const updateDesired = (key, val) => setDesired((prev) => ({ ...prev, [key]: parseFloat(val) || 0 }));

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

  const treatmentPlan = useMemo(() =>
    calcTreatmentPlan(current, desired, parseFloat(poolVolume) || 0),
    [current, desired, poolVolume]
  );

  const hasChanges = PARAMS.some((p) => current[p.key] !== desired[p.key]);

  return (
    <div className="stack">
      {/* Pool Volume */}
      <div className="form-group">
        <label>Pool Volume (gallons)</label>
        <input
          className="input"
          type="number"
          placeholder="e.g. 15000"
          value={poolVolume}
          onChange={(e) => setPoolVolume(e.target.value)}
        />
      </div>

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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #2A2A2E' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#A0A0A8' }}>Parameter</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#14B8A6', textAlign: 'center' }}>Current</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#14B8A6', textAlign: 'center' }}>Desired</span>
        </div>

        {PARAMS.map((p) => (
          <div key={p.key} style={{ marginBottom: '0.875rem' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#A0A0A8', marginBottom: '0.25rem' }}>
              {p.label}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <input type="number" style={inputStyle} value={current[p.key]} step={p.step} min={p.min} max={p.max} onChange={(e) => updateCurrent(p.key, e.target.value)} />
              <input type="number" style={inputStyle} value={desired[p.key]} step={p.step} min={p.min} max={p.max} onChange={(e) => updateDesired(p.key, e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <input type="range" style={sliderStyle} value={current[p.key]} min={p.min} max={p.max} step={p.step} onChange={(e) => updateCurrent(p.key, e.target.value)} />
              <input type="range" style={sliderStyle} value={desired[p.key]} min={p.min} max={p.max} step={p.step} onChange={(e) => updateDesired(p.key, e.target.value)} />
            </div>
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

      {/* Treatment Plan */}
      {hasChanges && (
        <div className="card" style={{ padding: '0.75rem' }}>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>Chemical Treatment Plan</h3>

          {!poolVolume || parseFloat(poolVolume) <= 0 ? (
            <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Enter pool volume above to calculate dosing amounts.</p>
          ) : treatmentPlan.length === 0 ? (
            <p className="text-secondary" style={{ fontSize: '0.875rem' }}>No chemical adjustments needed.</p>
          ) : (
            <div className="stack-sm">
              {treatmentPlan.map((item, i) => (
                <div key={i} style={{ padding: '0.625rem', backgroundColor: '#0D0D0F', borderRadius: 8, border: '1px solid #2A2A2E' }}>
                  <div className="row-between" style={{ marginBottom: 4 }}>
                    <strong style={{ fontSize: '0.875rem' }}>{item.chemical}</strong>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#14B8A6' }}>{item.amount}</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#A0A0A8', marginBottom: 2 }}>{item.direction}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B6B73' }}>{item.note}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
