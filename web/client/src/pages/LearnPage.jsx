import { useState } from 'react';

const TOPICS = [
  {
    title: 'Water Chemistry & Balance',
    items: ['pH testing & adjustment', 'Total alkalinity management', 'Calcium hardness levels', 'Cyanuric acid (CYA) stabilizer', 'Total dissolved solids (TDS)', 'Langelier Saturation Index (LSI)'],
  },
  {
    title: 'Equipment & Systems',
    items: ['Pump types & sizing', 'Filter maintenance (sand, DE, cartridge)', 'Heater troubleshooting', 'Salt chlorine generators', 'Chemical feeders & ORP', 'Automation & remote control'],
  },
  {
    title: 'Pool Construction & Surfaces',
    items: ['Plaster finishes', 'Pebble & aggregate surfaces', 'Tile & coping installation', 'Vinyl liner repair', 'Fiberglass shell maintenance', 'Coping & decking materials'],
  },
  {
    title: 'Health & Safety',
    items: ['Chloramines & combined chlorine', 'Cryptosporidium response', 'Recreational water illness (RWI) prevention', 'Chemical handling & storage', 'Safety Data Sheets (SDS)', 'Emergency action plans'],
  },
  {
    title: 'CPO Certification Prep',
    items: ['AFO vs CPO differences', 'State & local code requirements', 'Flow rate calculations', 'Turnover rate formulas', 'Record-keeping requirements', 'Inspection checklists'],
  },
];

export default function LearnPage() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="page stack">
      <h1>Learn</h1>
      <div className="info-box">Training modules are coming soon. Browse topic previews below.</div>

      <div className="stack-sm">
        {TOPICS.map((topic, i) => {
          const isOpen = expanded === i;
          return (
            <div key={i} className="card">
              <div className="expandable-header" onClick={() => setExpanded(isOpen ? null : i)}>
                <h3>{topic.title}</h3>
                <span style={{ color: '#6B6B73', fontSize: '1.25rem' }}>{isOpen ? '\u2212' : '+'}</span>
              </div>
              {isOpen && (
                <div style={{ marginTop: '0.75rem' }}>
                  {topic.items.map((item, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', borderBottom: '1px solid #2A2A2E' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span className="text-secondary" style={{ fontSize: '0.875rem' }}>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
