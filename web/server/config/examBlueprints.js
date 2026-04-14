export const EXAM_BLUEPRINTS = {
  CPO: {
    totalQuestions: 50, timeMinutes: 75, passPercent: 70,
    domains: [
      { moduleNumber: 1, name: 'Water Chemistry Fundamentals', weight: 0.25, questions: 13 },
      { moduleNumber: 2, name: 'Disinfection and Sanitization', weight: 0.25, questions: 13 },
      { moduleNumber: 3, name: 'Filtration Systems', weight: 0.20, questions: 10 },
      { moduleNumber: 4, name: 'Circulation and Hydraulics', weight: 0.15, questions: 7 },
      { moduleNumber: 5, name: 'Health and Safety Regulations', weight: 0.15, questions: 7 },
    ]
  },
  CST: {
    totalQuestions: 60, timeMinutes: 90, passPercent: 70,
    domains: [
      { moduleNumber: 1, name: 'Pool Equipment Troubleshooting', weight: 0.30, questions: 18 },
      { moduleNumber: 2, name: 'Plumbing Repair and Leak Detection', weight: 0.25, questions: 15 },
      { moduleNumber: 3, name: 'Surface and Structural Repair', weight: 0.20, questions: 12 },
      { moduleNumber: 4, name: 'Spa and Hot Tub Service', weight: 0.25, questions: 15 },
    ]
  },
  RESIDENTIAL: {
    totalQuestions: 50, timeMinutes: 75, passPercent: 70,
    domains: [
      { moduleNumber: 1, name: 'Weekly Service Procedures', weight: 0.30, questions: 15 },
      { moduleNumber: 2, name: 'Seasonal Operations', weight: 0.25, questions: 13 },
      { moduleNumber: 3, name: 'Equipment Installation Basics', weight: 0.25, questions: 12 },
      { moduleNumber: 4, name: 'Customer Relations and Business', weight: 0.20, questions: 10 },
    ]
  },
  COMMERCIAL: {
    totalQuestions: 75, timeMinutes: 120, passPercent: 72,
    domains: [
      { moduleNumber: 1, name: 'Commercial Pool Operations', weight: 0.30, questions: 22 },
      { moduleNumber: 2, name: 'Commercial Water Features', weight: 0.20, questions: 15 },
      { moduleNumber: 3, name: 'Advanced Chemical Management', weight: 0.25, questions: 19 },
      { moduleNumber: 4, name: 'Regulatory Compliance', weight: 0.25, questions: 19 },
    ]
  },
};
