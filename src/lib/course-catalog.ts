// =============================================================================
// CAI Prep Course — Complete Course Catalog (8 credential tracks, ~50 modules)
// =============================================================================

export interface CourseSeed {
  slug: string
  title: string
  credential_code: string
  description: string
  prerequisites: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  estimated_hours: number
  sort_order: number
  color: string // brand color for UI
  modules: ModuleSeed[]
}

export interface ModuleSeed {
  slug: string
  title: string
  module_number: number
  description: string
  lesson_count: number
  metadata: {
    exam_weight?: number
    cai_course_code?: string
  }
  lessons: LessonSeed[]
}

export interface LessonSeed {
  slug: string
  title: string
  sort_order: number
  estimated_minutes: number
}

// ---------------------------------------------------------------------------
// Track 1: CMCA Prep (Priority 1)
// ---------------------------------------------------------------------------

const CMCA: CourseSeed = {
  slug: 'cmca-prep',
  title: 'CMCA Certification Prep',
  credential_code: 'CMCA',
  description: 'Prepare for the Certified Manager of Community Associations exam. Covers all 7 CAMICB domains with practice exams mirroring the real test format.',
  prerequisites: [],
  difficulty: 'intermediate',
  estimated_hours: 80,
  sort_order: 1,
  color: '#0ea5e9',
  modules: [
    {
      slug: 'financial-management',
      title: 'Financial Management',
      module_number: 1,
      description: 'Budgeting, reserve studies, financial reporting, and assessment collection for community associations.',
      lesson_count: 8,
      metadata: { exam_weight: 19, cai_course_code: 'M-100' },
      lessons: [
        { slug: 'budgeting-fundamentals', title: 'Budgeting Fundamentals for HOAs', sort_order: 1, estimated_minutes: 20 },
        { slug: 'reserve-studies', title: 'Understanding Reserve Studies', sort_order: 2, estimated_minutes: 25 },
        { slug: 'assessment-collection', title: 'Assessment Collection & Delinquency', sort_order: 3, estimated_minutes: 20 },
        { slug: 'financial-statements', title: 'Reading Financial Statements', sort_order: 4, estimated_minutes: 25 },
        { slug: 'investment-policies', title: 'Investment Policies & Controls', sort_order: 5, estimated_minutes: 20 },
        { slug: 'insurance-requirements', title: 'Insurance Requirements Overview', sort_order: 6, estimated_minutes: 15 },
        { slug: 'audit-review-compilation', title: 'Audit, Review, & Compilation Reports', sort_order: 7, estimated_minutes: 20 },
        { slug: 'financial-management-texas', title: 'Texas Financial Requirements (Ch. 209)', sort_order: 8, estimated_minutes: 20 },
      ],
    },
    {
      slug: 'community-governance',
      title: 'Community Governance',
      module_number: 2,
      description: 'Board operations, governing documents, meetings, voting procedures, and parliamentary rules.',
      lesson_count: 8,
      metadata: { exam_weight: 18, cai_course_code: 'M-100' },
      lessons: [
        { slug: 'governing-documents-hierarchy', title: 'Governing Documents Hierarchy', sort_order: 1, estimated_minutes: 20 },
        { slug: 'board-roles-responsibilities', title: 'Board Roles & Responsibilities', sort_order: 2, estimated_minutes: 20 },
        { slug: 'meeting-procedures', title: 'Meeting Procedures & Robert\'s Rules', sort_order: 3, estimated_minutes: 25 },
        { slug: 'voting-requirements', title: 'Voting Requirements & Quorum', sort_order: 4, estimated_minutes: 20 },
        { slug: 'record-keeping', title: 'Record Keeping & Transparency', sort_order: 5, estimated_minutes: 15 },
        { slug: 'committee-management', title: 'Committee Formation & Management', sort_order: 6, estimated_minutes: 15 },
        { slug: 'amending-documents', title: 'Amending Governing Documents', sort_order: 7, estimated_minutes: 20 },
        { slug: 'governance-texas', title: 'Texas Governance Requirements', sort_order: 8, estimated_minutes: 20 },
      ],
    },
    {
      slug: 'legal-ethics-risk',
      title: 'Legal, Ethics & Risk Management',
      module_number: 3,
      description: 'Legal frameworks, fiduciary duty, ethics, fair housing, and risk management for community managers.',
      lesson_count: 8,
      metadata: { exam_weight: 18, cai_course_code: 'M-100' },
      lessons: [
        { slug: 'fiduciary-duty', title: 'Fiduciary Duty & Business Judgment', sort_order: 1, estimated_minutes: 25 },
        { slug: 'fair-housing', title: 'Fair Housing Laws (Federal & Texas)', sort_order: 2, estimated_minutes: 25 },
        { slug: 'contract-management', title: 'Contract Management & Vendor Selection', sort_order: 3, estimated_minutes: 20 },
        { slug: 'liability-risk', title: 'Liability & Risk Assessment', sort_order: 4, estimated_minutes: 20 },
        { slug: 'cai-ethics-code', title: 'CAI Code of Ethics', sort_order: 5, estimated_minutes: 15 },
        { slug: 'dispute-resolution', title: 'Dispute Resolution & Mediation', sort_order: 6, estimated_minutes: 20 },
        { slug: 'collections-liens', title: 'Collections, Liens & Foreclosure', sort_order: 7, estimated_minutes: 25 },
        { slug: 'legal-risk-texas', title: 'Texas Legal Requirements Deep Dive', sort_order: 8, estimated_minutes: 25 },
      ],
    },
    {
      slug: 'facilities-management',
      title: 'Facilities Management',
      module_number: 4,
      description: 'Common area maintenance, capital improvements, vendor management, and emergency preparedness.',
      lesson_count: 6,
      metadata: { exam_weight: 14, cai_course_code: 'M-100' },
      lessons: [
        { slug: 'common-area-maintenance', title: 'Common Area Maintenance Standards', sort_order: 1, estimated_minutes: 20 },
        { slug: 'capital-improvement', title: 'Capital Improvement Planning', sort_order: 2, estimated_minutes: 20 },
        { slug: 'vendor-management', title: 'Vendor Management & Bid Process', sort_order: 3, estimated_minutes: 20 },
        { slug: 'environmental-compliance', title: 'Environmental Compliance', sort_order: 4, estimated_minutes: 15 },
        { slug: 'emergency-preparedness', title: 'Emergency & Disaster Preparedness', sort_order: 5, estimated_minutes: 20 },
        { slug: 'pool-amenity-management', title: 'Pool & Amenity Management', sort_order: 6, estimated_minutes: 15 },
      ],
    },
    {
      slug: 'community-relations',
      title: 'Community Relations',
      module_number: 5,
      description: 'Homeowner engagement, conflict resolution, community building, and customer service excellence.',
      lesson_count: 6,
      metadata: { exam_weight: 14, cai_course_code: 'M-100' },
      lessons: [
        { slug: 'homeowner-engagement', title: 'Homeowner Engagement Strategies', sort_order: 1, estimated_minutes: 20 },
        { slug: 'conflict-resolution', title: 'Conflict Resolution Techniques', sort_order: 2, estimated_minutes: 25 },
        { slug: 'community-events', title: 'Community Events & Programs', sort_order: 3, estimated_minutes: 15 },
        { slug: 'communication-best-practices', title: 'Communication Best Practices', sort_order: 4, estimated_minutes: 20 },
        { slug: 'dealing-difficult-homeowners', title: 'Dealing with Difficult Homeowners', sort_order: 5, estimated_minutes: 25 },
        { slug: 'customer-service-excellence', title: 'Customer Service Excellence', sort_order: 6, estimated_minutes: 15 },
      ],
    },
    {
      slug: 'human-resources',
      title: 'Human Resources',
      module_number: 6,
      description: 'Staffing, employment law, performance management, and professional development.',
      lesson_count: 5,
      metadata: { exam_weight: 10, cai_course_code: 'M-100' },
      lessons: [
        { slug: 'hiring-onboarding', title: 'Hiring & Onboarding Best Practices', sort_order: 1, estimated_minutes: 20 },
        { slug: 'employment-law', title: 'Employment Law for HOA Managers', sort_order: 2, estimated_minutes: 20 },
        { slug: 'performance-management', title: 'Performance Management', sort_order: 3, estimated_minutes: 15 },
        { slug: 'team-leadership', title: 'Team Leadership & Motivation', sort_order: 4, estimated_minutes: 20 },
        { slug: 'professional-development', title: 'Professional Development Planning', sort_order: 5, estimated_minutes: 15 },
      ],
    },
    {
      slug: 'communications-technology',
      title: 'Communications & Technology',
      module_number: 7,
      description: 'Digital communications, management software, social media, and technology tools.',
      lesson_count: 4,
      metadata: { exam_weight: 7, cai_course_code: 'M-100' },
      lessons: [
        { slug: 'management-software', title: 'Community Management Software', sort_order: 1, estimated_minutes: 20 },
        { slug: 'digital-communication', title: 'Digital Communication Channels', sort_order: 2, estimated_minutes: 15 },
        { slug: 'website-social-media', title: 'Website & Social Media Management', sort_order: 3, estimated_minutes: 15 },
        { slug: 'data-security-privacy', title: 'Data Security & Privacy', sort_order: 4, estimated_minutes: 15 },
      ],
    },
  ],
}

// ---------------------------------------------------------------------------
// Track 2: AMS Prep
// ---------------------------------------------------------------------------

const AMS: CourseSeed = {
  slug: 'ams-prep',
  title: 'AMS Certification Prep',
  credential_code: 'AMS',
  description: 'Prepare for the Association Management Specialist designation. Advanced coursework across 6 M-200 series courses.',
  prerequisites: ['cmca-prep'],
  difficulty: 'advanced',
  estimated_hours: 100,
  sort_order: 2,
  color: '#14b8a6',
  modules: [
    {
      slug: 'facilities-advanced',
      title: 'Facilities Management (M-201)',
      module_number: 1,
      description: 'Advanced facilities planning, sustainability, and large-scale maintenance operations.',
      lesson_count: 8,
      metadata: { cai_course_code: 'M-201' },
      lessons: [
        { slug: 'strategic-facilities-planning', title: 'Strategic Facilities Planning', sort_order: 1, estimated_minutes: 25 },
        { slug: 'sustainability-green-ops', title: 'Sustainability & Green Operations', sort_order: 2, estimated_minutes: 20 },
        { slug: 'construction-project-management', title: 'Construction Project Management', sort_order: 3, estimated_minutes: 25 },
        { slug: 'technology-building-systems', title: 'Technology & Building Systems', sort_order: 4, estimated_minutes: 20 },
        { slug: 'ada-compliance', title: 'ADA Compliance & Accessibility', sort_order: 5, estimated_minutes: 20 },
        { slug: 'vendor-contract-negotiation', title: 'Vendor Contract Negotiation', sort_order: 6, estimated_minutes: 20 },
        { slug: 'preventive-maintenance-programs', title: 'Preventive Maintenance Programs', sort_order: 7, estimated_minutes: 20 },
        { slug: 'facilities-texas-specific', title: 'Texas-Specific Facilities Requirements', sort_order: 8, estimated_minutes: 15 },
      ],
    },
    {
      slug: 'communications-advanced',
      title: 'Association Communications (M-202)',
      module_number: 2,
      description: 'Strategic communication planning, crisis communications, and stakeholder management.',
      lesson_count: 8,
      metadata: { cai_course_code: 'M-202' },
      lessons: [
        { slug: 'strategic-communication-plan', title: 'Strategic Communication Planning', sort_order: 1, estimated_minutes: 20 },
        { slug: 'crisis-communication', title: 'Crisis Communication', sort_order: 2, estimated_minutes: 25 },
        { slug: 'board-communication-strategies', title: 'Board Communication Strategies', sort_order: 3, estimated_minutes: 20 },
        { slug: 'newsletter-publication', title: 'Newsletter & Publication Design', sort_order: 4, estimated_minutes: 15 },
        { slug: 'meeting-presentation-skills', title: 'Meeting Presentation Skills', sort_order: 5, estimated_minutes: 20 },
        { slug: 'transparency-open-records', title: 'Transparency & Open Records', sort_order: 6, estimated_minutes: 20 },
        { slug: 'stakeholder-engagement', title: 'Stakeholder Engagement', sort_order: 7, estimated_minutes: 20 },
        { slug: 'media-relations', title: 'Media Relations for HOAs', sort_order: 8, estimated_minutes: 15 },
      ],
    },
    {
      slug: 'leadership-advanced',
      title: 'Community Leadership (M-203)',
      module_number: 3,
      description: 'Leadership development, strategic planning, and organizational management.',
      lesson_count: 6,
      metadata: { cai_course_code: 'M-203' },
      lessons: [
        { slug: 'leadership-styles', title: 'Leadership Styles & Effectiveness', sort_order: 1, estimated_minutes: 25 },
        { slug: 'strategic-planning', title: 'Strategic Planning for Communities', sort_order: 2, estimated_minutes: 25 },
        { slug: 'change-management', title: 'Change Management', sort_order: 3, estimated_minutes: 20 },
        { slug: 'board-development', title: 'Board Development & Training', sort_order: 4, estimated_minutes: 20 },
        { slug: 'succession-planning', title: 'Succession Planning', sort_order: 5, estimated_minutes: 20 },
        { slug: 'ethical-leadership', title: 'Ethical Leadership in Practice', sort_order: 6, estimated_minutes: 20 },
      ],
    },
    {
      slug: 'governance-advanced',
      title: 'Community Governance (M-204)',
      module_number: 4,
      description: 'Advanced governance topics, policy development, and regulatory compliance.',
      lesson_count: 8,
      metadata: { cai_course_code: 'M-204' },
      lessons: [
        { slug: 'policy-development', title: 'Policy Development & Implementation', sort_order: 1, estimated_minutes: 25 },
        { slug: 'regulatory-compliance', title: 'Regulatory Compliance', sort_order: 2, estimated_minutes: 25 },
        { slug: 'architectural-review', title: 'Architectural Review Process', sort_order: 3, estimated_minutes: 20 },
        { slug: 'enforcement-best-practices', title: 'Enforcement Best Practices', sort_order: 4, estimated_minutes: 20 },
        { slug: 'developer-transition', title: 'Developer-to-Owner Transition', sort_order: 5, estimated_minutes: 25 },
        { slug: 'mixed-use-governance', title: 'Mixed-Use Community Governance', sort_order: 6, estimated_minutes: 20 },
        { slug: 'legislative-advocacy', title: 'Legislative Advocacy', sort_order: 7, estimated_minutes: 15 },
        { slug: 'advanced-governance-texas', title: 'Advanced Texas Governance Issues', sort_order: 8, estimated_minutes: 20 },
      ],
    },
    {
      slug: 'risk-management-advanced',
      title: 'Risk Management (M-205)',
      module_number: 5,
      description: 'Comprehensive risk management, insurance program design, and liability mitigation.',
      lesson_count: 6,
      metadata: { cai_course_code: 'M-205' },
      lessons: [
        { slug: 'risk-assessment-framework', title: 'Risk Assessment Framework', sort_order: 1, estimated_minutes: 25 },
        { slug: 'insurance-program-design', title: 'Insurance Program Design', sort_order: 2, estimated_minutes: 25 },
        { slug: 'claims-management-advanced', title: 'Claims Management', sort_order: 3, estimated_minutes: 20 },
        { slug: 'employment-practices-liability', title: 'Employment Practices Liability', sort_order: 4, estimated_minutes: 20 },
        { slug: 'cyber-liability', title: 'Cyber Liability & Data Protection', sort_order: 5, estimated_minutes: 20 },
        { slug: 'risk-texas-specific', title: 'Texas Risk Management Considerations', sort_order: 6, estimated_minutes: 15 },
      ],
    },
    {
      slug: 'financial-advanced',
      title: 'Financial Management (M-206)',
      module_number: 6,
      description: 'Advanced financial analysis, long-range planning, and investment management.',
      lesson_count: 8,
      metadata: { cai_course_code: 'M-206' },
      lessons: [
        { slug: 'advanced-budgeting', title: 'Advanced Budgeting Techniques', sort_order: 1, estimated_minutes: 25 },
        { slug: 'reserve-funding-strategies', title: 'Reserve Funding Strategies', sort_order: 2, estimated_minutes: 25 },
        { slug: 'financial-analysis-tools', title: 'Financial Analysis Tools', sort_order: 3, estimated_minutes: 20 },
        { slug: 'tax-implications', title: 'Tax Implications for HOAs', sort_order: 4, estimated_minutes: 25 },
        { slug: 'investment-management', title: 'Investment Management', sort_order: 5, estimated_minutes: 20 },
        { slug: 'special-assessments', title: 'Special Assessments & Loans', sort_order: 6, estimated_minutes: 20 },
        { slug: 'financial-controls', title: 'Internal Financial Controls', sort_order: 7, estimated_minutes: 20 },
        { slug: 'financial-advanced-texas', title: 'Texas Financial Regulations', sort_order: 8, estimated_minutes: 15 },
      ],
    },
  ],
}

// ---------------------------------------------------------------------------
// Track 3: PCAM Prep
// ---------------------------------------------------------------------------

const PCAM: CourseSeed = {
  slug: 'pcam-prep',
  title: 'PCAM Certification Prep',
  credential_code: 'PCAM',
  description: 'Prepare for the Professional Community Association Manager designation — the highest credential in the industry. Case study methodology and advanced analysis.',
  prerequisites: ['cmca-prep', 'ams-prep'],
  difficulty: 'expert',
  estimated_hours: 60,
  sort_order: 3,
  color: '#a855f7',
  modules: [
    { slug: 'case-study-methodology', title: 'Case Study Methodology', module_number: 1, description: 'Analytical frameworks and structured problem-solving for complex community issues.', lesson_count: 6, metadata: {}, lessons: [
      { slug: 'analytical-frameworks', title: 'Analytical Frameworks', sort_order: 1, estimated_minutes: 30 },
      { slug: 'data-gathering-interpretation', title: 'Data Gathering & Interpretation', sort_order: 2, estimated_minutes: 25 },
      { slug: 'stakeholder-analysis', title: 'Stakeholder Analysis', sort_order: 3, estimated_minutes: 25 },
      { slug: 'solution-development', title: 'Solution Development', sort_order: 4, estimated_minutes: 25 },
      { slug: 'presentation-defense', title: 'Presentation & Defense', sort_order: 5, estimated_minutes: 20 },
      { slug: 'pcam-writing-standards', title: 'PCAM Writing Standards', sort_order: 6, estimated_minutes: 20 },
    ]},
    { slug: 'advanced-financial-analysis', title: 'Advanced Financial Analysis', module_number: 2, description: 'Complex financial scenarios, forensic accounting, and strategic financial planning.', lesson_count: 6, metadata: {}, lessons: [
      { slug: 'forensic-accounting-hoa', title: 'Forensic Accounting for HOAs', sort_order: 1, estimated_minutes: 30 },
      { slug: 'complex-reserve-analysis', title: 'Complex Reserve Analysis', sort_order: 2, estimated_minutes: 30 },
      { slug: 'financial-distress-recovery', title: 'Financial Distress & Recovery', sort_order: 3, estimated_minutes: 25 },
      { slug: 'multi-entity-budgeting', title: 'Multi-Entity Budgeting', sort_order: 4, estimated_minutes: 25 },
      { slug: 'financial-policy-creation', title: 'Financial Policy Creation', sort_order: 5, estimated_minutes: 20 },
      { slug: 'case-financial-turnaround', title: 'Case: Financial Turnaround', sort_order: 6, estimated_minutes: 25 },
    ]},
    { slug: 'strategic-operations', title: 'Strategic Operations Planning', module_number: 3, description: 'Operational excellence, process optimization, and technology integration.', lesson_count: 6, metadata: {}, lessons: [
      { slug: 'operational-assessment', title: 'Operational Assessment', sort_order: 1, estimated_minutes: 25 },
      { slug: 'process-optimization', title: 'Process Optimization', sort_order: 2, estimated_minutes: 25 },
      { slug: 'technology-strategy', title: 'Technology Strategy', sort_order: 3, estimated_minutes: 20 },
      { slug: 'vendor-portfolio-management', title: 'Vendor Portfolio Management', sort_order: 4, estimated_minutes: 20 },
      { slug: 'quality-assurance', title: 'Quality Assurance & Metrics', sort_order: 5, estimated_minutes: 25 },
      { slug: 'case-operational-overhaul', title: 'Case: Operational Overhaul', sort_order: 6, estimated_minutes: 25 },
    ]},
    { slug: 'complex-governance', title: 'Complex Governance Scenarios', module_number: 4, description: 'Multi-party disputes, litigation management, and governance restructuring.', lesson_count: 6, metadata: {}, lessons: [
      { slug: 'multi-party-disputes', title: 'Multi-Party Disputes', sort_order: 1, estimated_minutes: 30 },
      { slug: 'litigation-management', title: 'Litigation Management', sort_order: 2, estimated_minutes: 25 },
      { slug: 'governance-restructuring', title: 'Governance Restructuring', sort_order: 3, estimated_minutes: 25 },
      { slug: 'regulatory-investigation', title: 'Regulatory Investigation Response', sort_order: 4, estimated_minutes: 25 },
      { slug: 'whistleblower-ethics', title: 'Whistleblower & Ethics Cases', sort_order: 5, estimated_minutes: 20 },
      { slug: 'case-governance-crisis', title: 'Case: Governance Crisis', sort_order: 6, estimated_minutes: 25 },
    ]},
    { slug: 'leadership-communication', title: 'Leadership & Communication Excellence', module_number: 5, description: 'Executive-level communication, negotiation, and leadership in complex situations.', lesson_count: 5, metadata: {}, lessons: [
      { slug: 'executive-communication', title: 'Executive Communication', sort_order: 1, estimated_minutes: 25 },
      { slug: 'negotiation-mastery', title: 'Negotiation Mastery', sort_order: 2, estimated_minutes: 25 },
      { slug: 'media-crisis-management', title: 'Media & Crisis Management', sort_order: 3, estimated_minutes: 25 },
      { slug: 'mentoring-profession', title: 'Mentoring the Profession', sort_order: 4, estimated_minutes: 20 },
      { slug: 'legacy-leadership', title: 'Legacy & Leadership Impact', sort_order: 5, estimated_minutes: 20 },
    ]},
    { slug: 'full-case-simulation', title: 'Full Case Study Simulation', module_number: 6, description: 'Complete case study exercises simulating the PCAM submission process.', lesson_count: 4, metadata: {}, lessons: [
      { slug: 'case-selection-research', title: 'Case Selection & Research', sort_order: 1, estimated_minutes: 30 },
      { slug: 'analysis-report-writing', title: 'Analysis & Report Writing', sort_order: 2, estimated_minutes: 45 },
      { slug: 'peer-review-revision', title: 'Peer Review & Revision', sort_order: 3, estimated_minutes: 30 },
      { slug: 'final-presentation-prep', title: 'Final Presentation Prep', sort_order: 4, estimated_minutes: 30 },
    ]},
  ],
}

// ---------------------------------------------------------------------------
// Track 4: LSM
// ---------------------------------------------------------------------------

const LSM: CourseSeed = {
  slug: 'lsm-prep',
  title: 'Large-Scale Manager (LSM)',
  credential_code: 'LSM',
  description: 'Specialized training for managing large-scale and master-planned communities with complex amenity programs.',
  prerequisites: ['cmca-prep'],
  difficulty: 'advanced',
  estimated_hours: 30,
  sort_order: 4,
  color: '#f59e0b',
  modules: [
    { slug: 'large-scale-characteristics', title: 'Large-Scale Community Characteristics', module_number: 1, description: 'Understanding the unique features and challenges of large-scale communities.', lesson_count: 5, metadata: { cai_course_code: 'M-340' }, lessons: [
      { slug: 'defining-large-scale', title: 'Defining Large-Scale Communities', sort_order: 1, estimated_minutes: 20 },
      { slug: 'organizational-structure', title: 'Organizational Structure', sort_order: 2, estimated_minutes: 20 },
      { slug: 'master-association-sub', title: 'Master vs Sub-Association', sort_order: 3, estimated_minutes: 25 },
      { slug: 'developer-relationships', title: 'Developer Relationships', sort_order: 4, estimated_minutes: 20 },
      { slug: 'texas-large-scale', title: 'Texas Large-Scale Communities', sort_order: 5, estimated_minutes: 15 },
    ]},
    { slug: 'operations-at-scale', title: 'Operations at Scale', module_number: 2, description: 'Managing operations across large communities with multiple staff and vendors.', lesson_count: 5, metadata: { cai_course_code: 'M-340' }, lessons: [
      { slug: 'staffing-large-communities', title: 'Staffing Large Communities', sort_order: 1, estimated_minutes: 25 },
      { slug: 'budget-scale', title: 'Budgeting at Scale', sort_order: 2, estimated_minutes: 25 },
      { slug: 'multi-vendor-management', title: 'Multi-Vendor Management', sort_order: 3, estimated_minutes: 20 },
      { slug: 'infrastructure-systems', title: 'Infrastructure & Systems', sort_order: 4, estimated_minutes: 20 },
      { slug: 'emergency-management-scale', title: 'Emergency Management at Scale', sort_order: 5, estimated_minutes: 20 },
    ]},
    { slug: 'multi-amenity', title: 'Multi-Amenity Management', module_number: 3, description: 'Managing pools, fitness centers, clubhouses, and recreational facilities.', lesson_count: 4, metadata: { cai_course_code: 'M-340' }, lessons: [
      { slug: 'amenity-portfolio', title: 'Amenity Portfolio Management', sort_order: 1, estimated_minutes: 20 },
      { slug: 'programming-events', title: 'Programming & Events', sort_order: 2, estimated_minutes: 15 },
      { slug: 'access-control-systems', title: 'Access Control Systems', sort_order: 3, estimated_minutes: 20 },
      { slug: 'amenity-financial-planning', title: 'Amenity Financial Planning', sort_order: 4, estimated_minutes: 20 },
    ]},
    { slug: 'master-planned-governance', title: 'Master-Planned Community Governance', module_number: 4, description: 'Governance structures for master-planned communities with multiple sub-associations.', lesson_count: 4, metadata: { cai_course_code: 'M-340' }, lessons: [
      { slug: 'multi-tier-governance', title: 'Multi-Tier Governance', sort_order: 1, estimated_minutes: 25 },
      { slug: 'shared-cost-allocation', title: 'Shared Cost Allocation', sort_order: 2, estimated_minutes: 20 },
      { slug: 'inter-association-disputes', title: 'Inter-Association Disputes', sort_order: 3, estimated_minutes: 20 },
      { slug: 'commercial-residential-mixed', title: 'Commercial-Residential Mixed Use', sort_order: 4, estimated_minutes: 20 },
    ]},
  ],
}

// ---------------------------------------------------------------------------
// Track 5: RS (Reserve Specialist)
// ---------------------------------------------------------------------------

const RS: CourseSeed = {
  slug: 'rs-prep',
  title: 'Reserve Specialist (RS)',
  credential_code: 'RS',
  description: 'Prepare for the Reserve Specialist designation. Master reserve study fundamentals, component analysis, and funding methodologies.',
  prerequisites: [],
  difficulty: 'intermediate',
  estimated_hours: 40,
  sort_order: 5,
  color: '#10b981',
  modules: [
    { slug: 'reserve-fundamentals', title: 'Reserve Study Fundamentals', module_number: 1, description: 'Core concepts of reserve planning and study types.', lesson_count: 5, metadata: {}, lessons: [
      { slug: 'reserve-study-types', title: 'Reserve Study Types & Levels', sort_order: 1, estimated_minutes: 25 },
      { slug: 'national-reserve-standard', title: 'National Reserve Study Standards', sort_order: 2, estimated_minutes: 20 },
      { slug: 'role-reserve-specialist', title: 'Role of the Reserve Specialist', sort_order: 3, estimated_minutes: 15 },
      { slug: 'legal-requirements-reserves', title: 'Legal Requirements for Reserves', sort_order: 4, estimated_minutes: 20 },
      { slug: 'texas-reserve-requirements', title: 'Texas Reserve Requirements', sort_order: 5, estimated_minutes: 20 },
    ]},
    { slug: 'component-analysis', title: 'Component Analysis & Useful Life', module_number: 2, description: 'Identifying and analyzing reserve components.', lesson_count: 5, metadata: {}, lessons: [
      { slug: 'component-identification', title: 'Component Identification', sort_order: 1, estimated_minutes: 25 },
      { slug: 'useful-life-estimation', title: 'Useful Life Estimation', sort_order: 2, estimated_minutes: 25 },
      { slug: 'condition-assessment', title: 'Condition Assessment Methods', sort_order: 3, estimated_minutes: 20 },
      { slug: 'cost-estimation', title: 'Replacement Cost Estimation', sort_order: 4, estimated_minutes: 20 },
      { slug: 'inflation-adjustment', title: 'Inflation & Cost Adjustment', sort_order: 5, estimated_minutes: 20 },
    ]},
    { slug: 'funding-methods', title: 'Funding Methods & Financial Projections', module_number: 3, description: 'Reserve funding strategies and 30-year projections.', lesson_count: 5, metadata: {}, lessons: [
      { slug: 'cash-flow-method', title: 'Cash Flow Method', sort_order: 1, estimated_minutes: 25 },
      { slug: 'straight-line-method', title: 'Straight-Line Method', sort_order: 2, estimated_minutes: 20 },
      { slug: 'percent-funded', title: 'Percent Funded Analysis', sort_order: 3, estimated_minutes: 20 },
      { slug: 'thirty-year-projections', title: '30-Year Financial Projections', sort_order: 4, estimated_minutes: 25 },
      { slug: 'special-assessment-avoidance', title: 'Special Assessment Avoidance', sort_order: 5, estimated_minutes: 20 },
    ]},
    { slug: 'report-writing', title: 'Report Writing & Presentation', module_number: 4, description: 'Creating professional reserve study reports.', lesson_count: 4, metadata: {}, lessons: [
      { slug: 'report-structure', title: 'Report Structure & Standards', sort_order: 1, estimated_minutes: 20 },
      { slug: 'visual-presentation', title: 'Visual Presentation of Data', sort_order: 2, estimated_minutes: 20 },
      { slug: 'board-presentation', title: 'Board Presentation Skills', sort_order: 3, estimated_minutes: 20 },
      { slug: 'update-procedures', title: 'Update & Revision Procedures', sort_order: 4, estimated_minutes: 15 },
    ]},
    { slug: 'rs-exam-prep', title: 'RS Exam Prep', module_number: 5, description: 'Practice questions and exam strategies.', lesson_count: 4, metadata: {}, lessons: [
      { slug: 'exam-format-overview', title: 'Exam Format Overview', sort_order: 1, estimated_minutes: 15 },
      { slug: 'calculation-practice', title: 'Calculation Practice', sort_order: 2, estimated_minutes: 30 },
      { slug: 'case-study-analysis', title: 'Case Study Analysis', sort_order: 3, estimated_minutes: 25 },
      { slug: 'rs-practice-exam', title: 'Practice Exam', sort_order: 4, estimated_minutes: 60 },
    ]},
  ],
}

// ---------------------------------------------------------------------------
// Track 6: CIRMS
// ---------------------------------------------------------------------------

const CIRMS: CourseSeed = {
  slug: 'cirms-prep',
  title: 'CIRMS Insurance & Risk',
  credential_code: 'CIRMS',
  description: 'Community Insurance & Risk Management Specialist certification prep. Master HOA insurance program design and claims management.',
  prerequisites: [],
  difficulty: 'intermediate',
  estimated_hours: 35,
  sort_order: 6,
  color: '#ef4444',
  modules: [
    { slug: 'insurance-program-design', title: 'HOA Insurance Program Design', module_number: 1, description: 'Designing comprehensive insurance programs for community associations.', lesson_count: 5, metadata: {}, lessons: [
      { slug: 'insurance-fundamentals', title: 'Insurance Fundamentals for HOAs', sort_order: 1, estimated_minutes: 20 },
      { slug: 'coverage-requirements', title: 'Coverage Requirements by Type', sort_order: 2, estimated_minutes: 25 },
      { slug: 'master-policy-design', title: 'Master Policy Design', sort_order: 3, estimated_minutes: 25 },
      { slug: 'deductible-strategy', title: 'Deductible Strategy', sort_order: 4, estimated_minutes: 20 },
      { slug: 'texas-insurance-requirements', title: 'Texas Insurance Requirements', sort_order: 5, estimated_minutes: 20 },
    ]},
    { slug: 'policy-types', title: 'Policy Types & Coverage Analysis', module_number: 2, description: 'Deep dive into policy types and coverage gap analysis.', lesson_count: 5, metadata: {}, lessons: [
      { slug: 'property-coverage', title: 'Property Coverage', sort_order: 1, estimated_minutes: 25 },
      { slug: 'liability-coverage', title: 'General Liability Coverage', sort_order: 2, estimated_minutes: 25 },
      { slug: 'do-coverage', title: 'Directors & Officers Coverage', sort_order: 3, estimated_minutes: 20 },
      { slug: 'workers-comp-fidelity', title: 'Workers Comp & Fidelity Bonds', sort_order: 4, estimated_minutes: 20 },
      { slug: 'flood-wind-specialty', title: 'Flood, Wind & Specialty Coverage', sort_order: 5, estimated_minutes: 20 },
    ]},
    { slug: 'claims-management', title: 'Claims Management', module_number: 3, description: 'Managing insurance claims from filing through resolution.', lesson_count: 4, metadata: {}, lessons: [
      { slug: 'claims-filing-process', title: 'Claims Filing Process', sort_order: 1, estimated_minutes: 20 },
      { slug: 'damage-documentation', title: 'Damage Documentation', sort_order: 2, estimated_minutes: 20 },
      { slug: 'adjuster-relations', title: 'Working with Adjusters', sort_order: 3, estimated_minutes: 20 },
      { slug: 'claims-disputes', title: 'Claims Disputes & Resolution', sort_order: 4, estimated_minutes: 20 },
    ]},
    { slug: 'risk-assessment', title: 'Risk Assessment & Mitigation', module_number: 4, description: 'Identifying and mitigating risks in community associations.', lesson_count: 5, metadata: {}, lessons: [
      { slug: 'risk-identification', title: 'Risk Identification Methods', sort_order: 1, estimated_minutes: 20 },
      { slug: 'risk-quantification', title: 'Risk Quantification', sort_order: 2, estimated_minutes: 20 },
      { slug: 'mitigation-strategies', title: 'Mitigation Strategies', sort_order: 3, estimated_minutes: 25 },
      { slug: 'safety-compliance', title: 'Safety & Compliance Programs', sort_order: 4, estimated_minutes: 20 },
      { slug: 'catastrophe-planning', title: 'Catastrophe Planning', sort_order: 5, estimated_minutes: 20 },
    ]},
    { slug: 'cirms-exam-prep', title: 'CIRMS Exam Prep', module_number: 5, description: 'Practice questions and exam strategies for CIRMS.', lesson_count: 4, metadata: {}, lessons: [
      { slug: 'cirms-exam-overview', title: 'CIRMS Exam Overview', sort_order: 1, estimated_minutes: 15 },
      { slug: 'scenario-practice', title: 'Scenario Practice Questions', sort_order: 2, estimated_minutes: 25 },
      { slug: 'coverage-analysis-exercise', title: 'Coverage Analysis Exercise', sort_order: 3, estimated_minutes: 30 },
      { slug: 'cirms-practice-exam', title: 'Practice Exam', sort_order: 4, estimated_minutes: 60 },
    ]},
  ],
}

// ---------------------------------------------------------------------------
// Track 7: Board Leader Certificate
// ---------------------------------------------------------------------------

const BOARD_LEADER: CourseSeed = {
  slug: 'board-leader',
  title: 'Board Leader Certificate',
  credential_code: 'BLC',
  description: 'Essential training for HOA board members. Understand your role, fiduciary duties, and how to work effectively with management.',
  prerequisites: [],
  difficulty: 'beginner',
  estimated_hours: 20,
  sort_order: 7,
  color: '#8b5cf6',
  modules: [
    { slug: 'board-roles-fiduciary', title: 'Board Member Roles & Fiduciary Duty', module_number: 1, description: 'Understanding your responsibilities as a board member.', lesson_count: 5, metadata: {}, lessons: [
      { slug: 'what-is-fiduciary-duty', title: 'What Is Fiduciary Duty?', sort_order: 1, estimated_minutes: 20 },
      { slug: 'board-officer-roles', title: 'Board Officer Roles', sort_order: 2, estimated_minutes: 15 },
      { slug: 'duty-of-care', title: 'Duty of Care & Loyalty', sort_order: 3, estimated_minutes: 20 },
      { slug: 'conflict-of-interest', title: 'Conflict of Interest', sort_order: 4, estimated_minutes: 15 },
      { slug: 'texas-board-requirements', title: 'Texas Board Requirements', sort_order: 5, estimated_minutes: 15 },
    ]},
    { slug: 'meetings-voting', title: 'Meetings, Voting & Governance', module_number: 2, description: 'Running effective meetings and making sound decisions.', lesson_count: 5, metadata: {}, lessons: [
      { slug: 'meeting-basics', title: 'Meeting Basics & Agendas', sort_order: 1, estimated_minutes: 15 },
      { slug: 'open-meeting-requirements', title: 'Open Meeting Requirements', sort_order: 2, estimated_minutes: 20 },
      { slug: 'voting-procedures', title: 'Voting Procedures', sort_order: 3, estimated_minutes: 15 },
      { slug: 'executive-session', title: 'Executive Session Rules', sort_order: 4, estimated_minutes: 15 },
      { slug: 'minutes-record-keeping', title: 'Minutes & Record Keeping', sort_order: 5, estimated_minutes: 15 },
    ]},
    { slug: 'financial-oversight', title: 'Financial Oversight for Board Members', module_number: 3, description: 'Reading financials, budget approval, and reserve oversight.', lesson_count: 4, metadata: {}, lessons: [
      { slug: 'reading-financials-board', title: 'Reading Financial Statements', sort_order: 1, estimated_minutes: 20 },
      { slug: 'budget-approval-process', title: 'Budget Approval Process', sort_order: 2, estimated_minutes: 15 },
      { slug: 'reserve-oversight', title: 'Reserve Fund Oversight', sort_order: 3, estimated_minutes: 20 },
      { slug: 'audit-selection', title: 'Selecting an Auditor', sort_order: 4, estimated_minutes: 15 },
    ]},
    { slug: 'working-with-management', title: 'Working with Your Management Company', module_number: 4, description: 'Building a productive relationship with your management company.', lesson_count: 4, metadata: {}, lessons: [
      { slug: 'management-agreement', title: 'Understanding the Management Agreement', sort_order: 1, estimated_minutes: 15 },
      { slug: 'scope-of-services', title: 'Scope of Services', sort_order: 2, estimated_minutes: 15 },
      { slug: 'effective-communication', title: 'Effective Board-Manager Communication', sort_order: 3, estimated_minutes: 20 },
      { slug: 'evaluating-performance', title: 'Evaluating Management Performance', sort_order: 4, estimated_minutes: 15 },
    ]},
  ],
}

// ---------------------------------------------------------------------------
// Track 8: Texas HOA Law Specialty
// ---------------------------------------------------------------------------

const TEXAS_LAW: CourseSeed = {
  slug: 'texas-hoa-law',
  title: 'Texas HOA Law Specialty',
  credential_code: 'TXL',
  description: 'PSPM-exclusive deep dive into Texas HOA law. Covers Property Code Chapters 209, 82, 207, fair housing, and recent legislative changes.',
  prerequisites: [],
  difficulty: 'intermediate',
  estimated_hours: 35,
  sort_order: 8,
  color: '#dc2626',
  modules: [
    { slug: 'chapter-209-trpopa', title: 'Chapter 209 Deep Dive (TRPOPA)', module_number: 1, description: 'Texas Residential Property Owners Protection Act — the foundation of Texas HOA law.', lesson_count: 6, metadata: {}, lessons: [
      { slug: '209-overview-applicability', title: '§209 Overview & Applicability', sort_order: 1, estimated_minutes: 25 },
      { slug: '209-assessment-liens', title: 'Assessment Liens & Collection', sort_order: 2, estimated_minutes: 30 },
      { slug: '209-enforcement-hearings', title: 'Enforcement & Hearing Requirements', sort_order: 3, estimated_minutes: 25 },
      { slug: '209-records-access', title: 'Records Access & Transparency', sort_order: 4, estimated_minutes: 20 },
      { slug: '209-foreclosure-restrictions', title: 'Foreclosure Restrictions', sort_order: 5, estimated_minutes: 25 },
      { slug: '209-recent-amendments', title: 'Recent Amendments & Impact', sort_order: 6, estimated_minutes: 20 },
    ]},
    { slug: 'chapter-82-tuca', title: 'Chapter 82 Condominiums (TUCA)', module_number: 2, description: 'Texas Uniform Condominium Act for condo associations.', lesson_count: 5, metadata: {}, lessons: [
      { slug: '82-creation-governance', title: 'Condo Creation & Governance', sort_order: 1, estimated_minutes: 25 },
      { slug: '82-common-elements', title: 'Common Elements & Ownership', sort_order: 2, estimated_minutes: 20 },
      { slug: '82-insurance-requirements', title: 'Insurance Requirements', sort_order: 3, estimated_minutes: 20 },
      { slug: '82-maintenance-repair', title: 'Maintenance & Repair Obligations', sort_order: 4, estimated_minutes: 20 },
      { slug: '82-termination', title: 'Termination & Conversion', sort_order: 5, estimated_minutes: 20 },
    ]},
    { slug: 'chapter-207-resale', title: 'Chapter 207 Resale Certificates', module_number: 3, description: 'Resale certificate requirements, deadlines, and compliance.', lesson_count: 4, metadata: {}, lessons: [
      { slug: '207-resale-cert-requirements', title: 'Resale Certificate Requirements', sort_order: 1, estimated_minutes: 20 },
      { slug: '207-required-information', title: 'Required Information & Disclosures', sort_order: 2, estimated_minutes: 20 },
      { slug: '207-fees-deadlines', title: 'Fees & Deadlines', sort_order: 3, estimated_minutes: 15 },
      { slug: '207-liability-penalties', title: 'Liability & Penalties', sort_order: 4, estimated_minutes: 15 },
    ]},
    { slug: 'fair-housing-texas', title: 'Fair Housing in Texas HOAs', module_number: 4, description: 'Federal and Texas fair housing requirements for community associations.', lesson_count: 5, metadata: {}, lessons: [
      { slug: 'fha-overview', title: 'Fair Housing Act Overview', sort_order: 1, estimated_minutes: 25 },
      { slug: 'protected-classes', title: 'Protected Classes & Discrimination', sort_order: 2, estimated_minutes: 20 },
      { slug: 'reasonable-accommodations', title: 'Reasonable Accommodations', sort_order: 3, estimated_minutes: 25 },
      { slug: 'texas-fair-housing', title: 'Texas Fair Housing Commission', sort_order: 4, estimated_minutes: 15 },
      { slug: 'fh-case-studies', title: 'Fair Housing Case Studies', sort_order: 5, estimated_minutes: 20 },
    ]},
    { slug: 'recent-texas-legislation', title: 'Recent Texas Legislation', module_number: 5, description: 'Latest legislative changes affecting Texas HOAs.', lesson_count: 4, metadata: {}, lessons: [
      { slug: 'recent-legislative-sessions', title: 'Recent Legislative Sessions', sort_order: 1, estimated_minutes: 20 },
      { slug: 'solar-flag-display', title: 'Solar, Flag & Display Rights', sort_order: 2, estimated_minutes: 15 },
      { slug: 'rental-restrictions', title: 'Rental Restriction Updates', sort_order: 3, estimated_minutes: 20 },
      { slug: 'looking-ahead', title: 'Looking Ahead: Pending Legislation', sort_order: 4, estimated_minutes: 15 },
    ]},
  ],
}

// ---------------------------------------------------------------------------
// Export all courses
// ---------------------------------------------------------------------------

export const COURSE_CATALOG: CourseSeed[] = [
  CMCA,
  AMS,
  PCAM,
  LSM,
  RS,
  CIRMS,
  BOARD_LEADER,
  TEXAS_LAW,
]

// Utility
export function getCourseBySlug(slug: string): CourseSeed | undefined {
  return COURSE_CATALOG.find((c) => c.slug === slug)
}

export function getModuleBySlug(courseSlug: string, moduleSlug: string): ModuleSeed | undefined {
  const course = getCourseBySlug(courseSlug)
  return course?.modules.find((m) => m.slug === moduleSlug)
}

export function totalLessons(): number {
  return COURSE_CATALOG.reduce(
    (sum, c) => sum + c.modules.reduce((ms, m) => ms + m.lessons.length, 0),
    0
  )
}

export function totalModules(): number {
  return COURSE_CATALOG.reduce((sum, c) => sum + c.modules.length, 0)
}

// Summary stats
export const CATALOG_STATS = {
  tracks: COURSE_CATALOG.length,
  modules: totalModules(),
  lessons: totalLessons(),
  totalHours: COURSE_CATALOG.reduce((sum, c) => sum + c.estimated_hours, 0),
}
