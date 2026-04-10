const CYA_DATA = [
  { cya: 0,   minFC: 1,  targetFC: 2,   maxFC: 4,   slam: 10 },
  { cya: 10,  minFC: 1,  targetFC: 2,   maxFC: 4,   slam: 10 },
  { cya: 20,  minFC: 1,  targetFC: 2,   maxFC: 4,   slam: 10 },
  { cya: 30,  minFC: 2,  targetFC: 3,   maxFC: 5,   slam: 12 },
  { cya: 40,  minFC: 3,  targetFC: 4,   maxFC: 6,   slam: 16 },
  { cya: 50,  minFC: 4,  targetFC: 5,   maxFC: 7,   slam: 20 },
  { cya: 60,  minFC: 4,  targetFC: 6,   maxFC: 8,   slam: 24 },
  { cya: 70,  minFC: 5,  targetFC: 7,   maxFC: 9,   slam: 28 },
  { cya: 80,  minFC: 6,  targetFC: 8,   maxFC: 10,  slam: 32 },
  { cya: 90,  minFC: 7,  targetFC: 9,   maxFC: 11,  slam: 36 },
  { cya: 100, minFC: 8,  targetFC: 10,  maxFC: 12,  slam: 40 },
];

const cellStyle = { padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' };
const headerStyle = { ...cellStyle, fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.15)', fontSize: '0.8125rem', color: '#A0A0A8' };

export default function FCCYAChart() {
  return (
    <div className="stack">
      <div className="card">
        <h3 style={{ margin: '0 0 4px' }}>FC / CYA Chlorine Chart</h3>
        <p className="text-secondary" style={{ fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
          Free Chlorine targets based on Cyanuric Acid level. SLAM = Shock Level And Maintain for algae treatment.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr>
                <th style={{ ...headerStyle, textAlign: 'left' }}>CYA</th>
                <th style={headerStyle}>Min FC</th>
                <th style={{ ...headerStyle, color: '#14B8A6' }}>Target FC</th>
                <th style={headerStyle}>Max FC</th>
                <th style={{ ...headerStyle, color: '#EF4444' }}>SLAM</th>
              </tr>
            </thead>
            <tbody>
              {CYA_DATA.map((row) => (
                <tr key={row.cya}>
                  <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 600 }}>{row.cya} ppm</td>
                  <td style={cellStyle}>{row.minFC}</td>
                  <td style={{ ...cellStyle, color: '#14B8A6', fontWeight: 600 }}>{row.targetFC}</td>
                  <td style={cellStyle}>{row.maxFC}</td>
                  <td style={{ ...cellStyle, color: '#EF4444', fontWeight: 600 }}>{row.slam}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="warning-box" style={{ fontSize: '0.8125rem' }}>
        <strong>Key notes:</strong>
        <ul style={{ margin: '4px 0 0 16px', listStyle: 'disc' }}>
          <li>If CYA exceeds 80-100 ppm, chlorine becomes increasingly ineffective — partial drain is the only fix</li>
          <li>Liquid chlorine (sodium hypochlorite) does NOT add CYA; trichlor and dichlor DO</li>
          <li>For SLAM, use liquid chlorine only and maintain FC level until overnight test passes</li>
        </ul>
      </div>
    </div>
  );
}
