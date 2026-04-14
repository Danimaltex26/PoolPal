// PoolPal training module definitions
// Pool & spa certification path: CPO → CST → RESIDENTIAL → COMMERCIAL

export const MODULES = [
  // ── CPO (Certified Pool Operator) ─────────────────────────
  {
    cert_level: 'CPO', module_number: 1, title: 'Water Chemistry Fundamentals',
    estimated_minutes: 50, exam_domain_weight: 0.25,
    topic_list: ['pH scale and adjustment', 'Total alkalinity', 'Calcium hardness', 'Cyanuric acid/stabilizer', 'TDS', 'Saturation index/Langelier', 'Chemical relationships', 'Water balance', 'Testing methods'],
  },
  {
    cert_level: 'CPO', module_number: 2, title: 'Disinfection and Sanitization',
    estimated_minutes: 50, exam_domain_weight: 0.25,
    topic_list: ['Free chlorine vs combined chlorine', 'Breakpoint chlorination', 'Chlorine types — trichlor/dichlor/cal hypo/sodium hypo/liquid chlorine', 'ORP measurement', 'Salt chlorine generators', 'UV and ozone secondary disinfection', 'Chloramine removal', 'Superchlorination'],
  },
  {
    cert_level: 'CPO', module_number: 3, title: 'Filtration Systems',
    estimated_minutes: 45, exam_domain_weight: 0.20,
    topic_list: ['Sand filters', 'Cartridge filters', 'DE filters', 'Filter sizing and flow rates', 'Backwash procedures', 'Filter pressure differential', 'Media replacement', 'Turnover rate calculations'],
  },
  {
    cert_level: 'CPO', module_number: 4, title: 'Circulation and Hydraulics',
    estimated_minutes: 45, exam_domain_weight: 0.15,
    topic_list: ['Pump types and curves', 'Total dynamic head', 'Flow rate calculations', 'Pipe sizing', 'Suction and return design', 'Variable speed pumps', 'Entrapment prevention VGBA', 'Skimmer and main drain design'],
  },
  {
    cert_level: 'CPO', module_number: 5, title: 'Health and Safety Regulations',
    estimated_minutes: 40, exam_domain_weight: 0.15,
    topic_list: ['State and local health codes', 'VGB Act/VGBA compliance', 'Fencing and barrier requirements', 'Signage requirements', 'Chemical storage and handling', 'SDS sheets', 'Bather load calculations', 'Record keeping requirements'],
  },

  // ── CST (Certified Service Technician) ────────────────────
  {
    cert_level: 'CST', module_number: 1, title: 'Pool Equipment Troubleshooting',
    estimated_minutes: 55, exam_domain_weight: 0.30,
    topic_list: ['Pump motor diagnosis', 'Impeller problems', 'Air leaks on suction side', 'Heater troubleshooting', 'Heat pump diagnosis', 'Salt cell inspection', 'Automation system faults', 'Electrical testing for pool equipment'],
  },
  {
    cert_level: 'CST', module_number: 2, title: 'Plumbing Repair and Leak Detection',
    estimated_minutes: 50, exam_domain_weight: 0.25,
    topic_list: ['Pressure testing', 'Dye testing', 'Electronic leak detection', 'PVC pipe repair', 'Underground pipe repair', 'Skimmer repair', 'Return fitting repair', 'Main drain repair considerations'],
  },
  {
    cert_level: 'CST', module_number: 3, title: 'Surface and Structural Repair',
    estimated_minutes: 45, exam_domain_weight: 0.20,
    topic_list: ['Plaster/pebble surface issues', 'Tile repair', 'Coping repair', 'Deck repair', 'Vinyl liner replacement', 'Fiberglass repair', 'Expansion joint maintenance', 'Structural crack assessment'],
  },
  {
    cert_level: 'CST', module_number: 4, title: 'Spa and Hot Tub Service',
    estimated_minutes: 45, exam_domain_weight: 0.25,
    topic_list: ['Spa water chemistry differences', 'Jetted tub plumbing', 'Spa pack troubleshooting', 'Ozonator service', 'Spa cover assessment', 'Temperature regulation', 'Biofilm prevention', 'Portable vs built-in spa systems'],
  },

  // ── RESIDENTIAL (Residential Pool Specialist) ─────────────
  {
    cert_level: 'RESIDENTIAL', module_number: 1, title: 'Weekly Service Procedures',
    estimated_minutes: 40, exam_domain_weight: 0.30,
    topic_list: ['Testing and adjusting chemistry', 'Brushing and vacuuming', 'Skimmer basket and pump basket service', 'Filter maintenance schedule', 'Chemical dosing calculations', 'Salt cell maintenance', 'Automatic cleaner adjustment', 'Customer communication'],
  },
  {
    cert_level: 'RESIDENTIAL', module_number: 2, title: 'Seasonal Operations',
    estimated_minutes: 40, exam_domain_weight: 0.25,
    topic_list: ['Pool opening procedures', 'Pool closing/winterizing', 'Freeze protection', 'Algae prevention strategies', 'Stain identification and treatment', 'Scale prevention', 'Phosphate management', 'Green pool recovery'],
  },
  {
    cert_level: 'RESIDENTIAL', module_number: 3, title: 'Equipment Installation Basics',
    estimated_minutes: 45, exam_domain_weight: 0.25,
    topic_list: ['Pump replacement', 'Filter replacement', 'Heater installation', 'Salt system installation', 'Timer and automation basics', 'Electrical requirements for pool equipment', 'Bonding and grounding Article 680', 'Permit requirements'],
  },
  {
    cert_level: 'RESIDENTIAL', module_number: 4, title: 'Customer Relations and Business',
    estimated_minutes: 35, exam_domain_weight: 0.20,
    topic_list: ['Route management', 'Service agreements', 'Pricing strategies', 'Upselling equipment upgrades', 'Liability and insurance', 'Documentation and photos', 'Handling complaints', 'Building referral business'],
  },

  // ── COMMERCIAL (Commercial Pool Specialist) ───────────────
  {
    cert_level: 'COMMERCIAL', module_number: 1, title: 'Commercial Pool Operations',
    estimated_minutes: 55, exam_domain_weight: 0.30,
    topic_list: ['High bather load management', 'Chemical feed systems — peristaltic/diaphragm', 'Chemical controllers and probes', 'Flow meters and sensors', 'Commercial filtration requirements', 'ADA compliance', 'Record keeping and logs', 'Health department inspections'],
  },
  {
    cert_level: 'COMMERCIAL', module_number: 2, title: 'Commercial Water Features',
    estimated_minutes: 45, exam_domain_weight: 0.20,
    topic_list: ['Splash pads and interactive features', 'Water slides — flow and safety', 'Lazy rivers and wave pools', 'Fountain and decorative features', 'Aquatic play structure maintenance', 'Cross-contamination prevention', 'Surge tanks', 'Flow requirements per feature'],
  },
  {
    cert_level: 'COMMERCIAL', module_number: 3, title: 'Advanced Chemical Management',
    estimated_minutes: 50, exam_domain_weight: 0.25,
    topic_list: ['Bulk chemical handling', 'Chemical feed pump calibration', 'Cyanuric acid management in commercial pools', 'Secondary disinfection systems', 'Chlorine dioxide', 'Legionella prevention', 'Cryptosporidium response', 'Fecal incident response protocols'],
  },
  {
    cert_level: 'COMMERCIAL', module_number: 4, title: 'Regulatory Compliance',
    estimated_minutes: 45, exam_domain_weight: 0.25,
    topic_list: ['Model Aquatic Health Code (MAHC)', 'State health codes', 'CPSC guidelines', 'VGB Act requirements', 'Lifeguard requirements', 'Emergency action plans', 'Incident reporting', 'Insurance and liability'],
  },
];
