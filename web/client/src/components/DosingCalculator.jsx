import { useState } from 'react';

const CHEMICALS = [
  {
    id: 'chlorine',
    label: 'Liquid Chlorine (12.5% sodium hypochlorite)',
    param: 'Free Chlorine',
    unit: 'ppm',
    // 1 fl oz of 12.5% sodium hypo raises FC ~1.2 ppm per 1000 gal
    factor: 1.2,
    resultUnit: 'fl oz',
    perGal: 1000,
    note: 'Does not add CYA. Pour around perimeter with pump running.',
  },
  {
    id: 'acid',
    label: 'Muriatic Acid (31.45% HCl) — lower pH',
    param: 'pH',
    unit: '',
    // custom calc — handled separately
    resultUnit: 'fl oz',
    perGal: 10000,
    note: 'Add acid to water, never water to acid. Wait 30 min and retest.',
    custom: true,
  },
  {
    id: 'soda_ash',
    label: 'Soda Ash (sodium carbonate) — raise pH',
    param: 'pH',
    unit: '',
    resultUnit: 'oz',
    perGal: 10000,
    note: 'Pre-dissolve in a bucket. Retest after 1 hour.',
    custom: true,
  },
  {
    id: 'bicarb',
    label: 'Baking Soda (sodium bicarbonate) — raise TA',
    param: 'Total Alkalinity',
    unit: 'ppm',
    // 1.5 lbs per 10,000 gal raises TA 10 ppm → 0.15 lbs per 1 ppm per 10K gal → 2.4 oz per ppm per 10K
    factor: 2.4,
    resultUnit: 'oz',
    perGal: 10000,
    note: 'Max 2 lbs per 10,000 gal per dose. Wait 6 hours between doses.',
  },
  {
    id: 'calcium',
    label: 'Calcium Chloride (77%) — raise CH',
    param: 'Calcium Hardness',
    unit: 'ppm',
    // 1.25 lbs per 10,000 gal raises CH 10 ppm → 0.125 lbs per ppm per 10K → 2 oz per ppm per 10K
    factor: 2.0,
    resultUnit: 'oz',
    perGal: 10000,
    note: 'Pre-dissolve in a bucket — generates heat. Never add through skimmer.',
  },
  {
    id: 'cya',
    label: 'Cyanuric Acid (stabilizer) — raise CYA',
    param: 'CYA',
    unit: 'ppm',
    // 13 oz per 10,000 gal raises CYA 10 ppm → 1.3 oz per ppm per 10K
    factor: 1.3,
    resultUnit: 'oz',
    perGal: 10000,
    note: 'Dissolve in a sock in skimmer basket. Takes 3-7 days to register on test.',
  },
];

// pH-specific dosing tables (approximation per 10,000 gal)
function calcAcid(currentPH, targetPH, gallons) {
  if (currentPH <= targetPH) return 0;
  const drop = currentPH - targetPH;
  // ~12 fl oz per 0.4 pH drop per 10K gal (linear approximation)
  const ozPer04 = 12;
  return ((drop / 0.4) * ozPer04 * (gallons / 10000)).toFixed(1);
}

function calcSodaAsh(currentPH, targetPH, gallons) {
  if (currentPH >= targetPH) return 0;
  const rise = targetPH - currentPH;
  // ~6 oz per 0.4 pH rise per 10K gal
  const ozPer04 = 6;
  return ((rise / 0.4) * ozPer04 * (gallons / 10000)).toFixed(1);
}

export default function DosingCalculator() {
  const [selectedChemical, setSelectedChemical] = useState('chlorine');
  const [poolVolume, setPoolVolume] = useState('');
  const [currentLevel, setCurrentLevel] = useState('');
  const [targetLevel, setTargetLevel] = useState('');
  const [result, setResult] = useState(null);

  const chem = CHEMICALS.find((c) => c.id === selectedChemical);

  const handleCalc = () => {
    const vol = parseFloat(poolVolume);
    const current = parseFloat(currentLevel);
    const target = parseFloat(targetLevel);

    if (!vol || vol <= 0) return;
    if (isNaN(current) || isNaN(target)) return;

    let amount;
    if (chem.id === 'acid') {
      amount = calcAcid(current, target, vol);
    } else if (chem.id === 'soda_ash') {
      amount = calcSodaAsh(current, target, vol);
    } else {
      const diff = target - current;
      if (diff <= 0) {
        setResult({ amount: 0, message: 'Current level is already at or above target.' });
        return;
      }
      amount = ((diff * chem.factor * (vol / chem.perGal))).toFixed(1);
    }

    if (amount <= 0) {
      setResult({ amount: 0, message: 'No adjustment needed.' });
      return;
    }

    // Convert large oz to lbs
    const ozNum = parseFloat(amount);
    let display;
    if (chem.resultUnit === 'oz' && ozNum >= 16) {
      display = `${(ozNum / 16).toFixed(1)} lbs (${amount} oz)`;
    } else if (chem.resultUnit === 'fl oz' && ozNum >= 128) {
      display = `${(ozNum / 128).toFixed(1)} gal (${amount} fl oz)`;
    } else {
      display = `${amount} ${chem.resultUnit}`;
    }

    setResult({ amount: display, note: chem.note });
  };

  const handleReset = () => {
    setCurrentLevel('');
    setTargetLevel('');
    setResult(null);
  };

  const isPH = chem.id === 'acid' || chem.id === 'soda_ash';

  return (
    <div className="stack">
      <div className="form-group">
        <label>Chemical</label>
        <select
          className="select"
          value={selectedChemical}
          onChange={(e) => { setSelectedChemical(e.target.value); setResult(null); }}
        >
          {CHEMICALS.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="form-group">
          <label>Current {isPH ? 'pH' : chem.param} {chem.unit}</label>
          <input
            className="input"
            type="number"
            step={isPH ? '0.1' : '1'}
            placeholder={isPH ? '7.8' : '0'}
            value={currentLevel}
            onChange={(e) => setCurrentLevel(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Target {isPH ? 'pH' : chem.param} {chem.unit}</label>
          <input
            className="input"
            type="number"
            step={isPH ? '0.1' : '1'}
            placeholder={isPH ? '7.4' : '0'}
            value={targetLevel}
            onChange={(e) => setTargetLevel(e.target.value)}
          />
        </div>
      </div>

      <button className="btn btn-primary btn-block" onClick={handleCalc}>
        Calculate
      </button>

      {result && (
        <div className="card">
          {result.amount === 0 ? (
            <p>{result.message}</p>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Amount to add</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#14B8A6' }}>{result.amount}</p>
              </div>
              {result.note && (
                <div className="info-box" style={{ fontSize: '0.8125rem' }}>
                  {result.note}
                </div>
              )}
            </>
          )}
          <button className="btn btn-ghost btn-block" onClick={handleReset} style={{ marginTop: '0.5rem' }}>
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
