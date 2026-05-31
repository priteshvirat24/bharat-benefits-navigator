import { CitizenProfile, Scheme, Document, CoralQuery, ChatMessage } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Default mock profile for demo purposes
export const DEFAULT_PROFILE: CitizenProfile = {
  id: 'demo-user-001',
  name: 'Arjun Kumar',
  age: 21,
  gender: 'MALE',
  state: 'West Bengal',
  district: 'Kolkata',
  annualIncome: 180000,
  occupation: 'Student',
  educationLevel: 'Undergraduate (B.A./B.Sc./B.Com./B.Tech.)',
  category: 'OBC',
  hasDisability: false,
  familySize: 4,
  isFarmer: false,
  hasBPLCard: false,
  phone: '+91 98765 43210',
  email: 'arjun@example.com',
  completionScore: 82,
};

// --- Coral SQL Engine ---
// Calls the backend which executes real `coral sql` commands
export async function executeCoralQuery(sql: string): Promise<{ data: Record<string, unknown>[]; query: CoralQuery }> {
  try {
    const response = await fetch(`${BASE_URL}/api/coral/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql }),
    });
    if (!response.ok) throw new Error('Coral query failed');
    return response.json();
  } catch {
    // Fallback to client-side eligibility engine
    return { data: [], query: mockCoralQuery(sql) };
  }
}

function mockCoralQuery(sql: string): CoralQuery {
  return {
    id: `q_${Date.now()}`,
    sql,
    dataSources: detectDataSources(sql),
    executionTime: Math.floor(Math.random() * 200) + 50,
    rowCount: 0,
    timestamp: new Date().toISOString(),
    status: 'complete',
  };
}

function detectDataSources(sql: string): string[] {
  const sources: string[] = [];
  if (sql.includes('central_schemes')) sources.push('central_schemes');
  if (sql.includes('state_schemes')) sources.push('state_schemes');
  if (sql.includes('scholarships')) sources.push('scholarships');
  if (sql.includes('citizen_profile') || sql.includes('profile')) sources.push('citizen_profile');
  if (sql.includes('uploaded_documents') || sql.includes('documents')) sources.push('uploaded_documents');
  return sources;
}

// --- Schemes API ---
export async function getEligibleSchemes(profile: CitizenProfile): Promise<{ schemes: Scheme[]; query: CoralQuery }> {
  try {
    const res = await fetch(`${BASE_URL}/api/schemes/eligible`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile }),
    });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  } catch {
    return { schemes: getClientSideEligibleSchemes(profile), query: mockCoralQuery(buildEligibilitySQL(profile)) };
  }
}

export function buildEligibilitySQL(profile: CitizenProfile): string {
  return `-- Bharat Benefits Navigator × Coral
-- Cross-source eligibility matching for ${profile.name}

SELECT
  s.id,
  s.name,
  s.ministry,
  s.category,
  s.benefit_amount,
  s.benefit_type,
  s.deadline,
  s.application_url,
  s.required_documents,
  s.approval_probability,
  (
    CASE WHEN ${profile.annualIncome} <= s.max_income THEN 25 ELSE 0 END +
    CASE WHEN ${profile.age} >= s.min_age AND ${profile.age} <= s.max_age THEN 25 ELSE 0 END +
    CASE WHEN json_contains(s.eligible_categories, '"${profile.category}"') THEN 25 ELSE 0 END +
    CASE WHEN s.applicable_state = 'ALL' OR s.applicable_state = '${profile.state}' THEN 25 ELSE 0 END
  ) AS eligibility_score,
  s.applicable_state,
  s.eligible_categories

FROM central_schemes.schemes s

WHERE ${profile.annualIncome} <= s.max_income
  AND ${profile.age} BETWEEN s.min_age AND s.max_age
  AND (s.applicable_state = 'ALL' OR s.applicable_state = '${profile.state}')
  AND (s.gender = 'ALL' OR s.gender = '${profile.gender}')

UNION ALL

SELECT
  ss.id,
  ss.name,
  ss.ministry,
  ss.category,
  ss.benefit_amount,
  ss.benefit_type,
  ss.deadline,
  ss.application_url,
  ss.required_documents,
  ss.approval_probability,
  (
    CASE WHEN ${profile.annualIncome} <= ss.max_income THEN 25 ELSE 0 END +
    CASE WHEN ${profile.age} >= ss.min_age AND ${profile.age} <= ss.max_age THEN 25 ELSE 0 END +
    CASE WHEN json_contains(ss.eligible_categories, '"${profile.category}"') THEN 25 ELSE 0 END +
    CASE WHEN ss.applicable_state = '${profile.state}' THEN 25 ELSE 0 END
  ) AS eligibility_score,
  ss.applicable_state,
  ss.eligible_categories

FROM state_schemes.schemes ss

WHERE ss.applicable_state = '${profile.state}'
  AND ${profile.annualIncome} <= ss.max_income
  AND ${profile.age} BETWEEN ss.min_age AND ss.max_age

ORDER BY eligibility_score DESC, benefit_amount DESC
LIMIT 25`;
}

export function buildScholarshipSQL(profile: CitizenProfile): string {
  return `-- Bharat Benefits Navigator × Coral
-- Scholarship cross-source JOIN for ${profile.name}

SELECT
  sch.id,
  sch.name,
  sch.provider,
  sch.category,
  sch.benefit_amount,
  sch.deadline,
  sch.application_url,
  sch.required_documents,
  sch.approval_probability,
  (
    CASE WHEN ${profile.annualIncome} <= sch.max_income THEN 30 ELSE 0 END +
    CASE WHEN ${profile.age} BETWEEN sch.min_age AND sch.max_age THEN 25 ELSE 0 END +
    CASE WHEN json_contains(sch.eligible_categories, '"${profile.category}"') THEN 30 ELSE 0 END +
    CASE WHEN sch.applicable_state = 'ALL' OR sch.applicable_state = '${profile.state}' THEN 15 ELSE 0 END
  ) AS eligibility_score

FROM scholarships.scholarships sch

WHERE sch.required_occupation IS NULL
   OR json_contains(sch.required_occupation, '"Student"')
   OR json_contains(sch.required_occupation, '"${profile.occupation}"')

ORDER BY eligibility_score DESC, sch.benefit_amount DESC`;
}

// Client-side eligibility engine (runs when backend unavailable)
export function getClientSideEligibleSchemes(profile: CitizenProfile): Scheme[] {
  // Import data inline for client-side fallback
  const centralSchemes = getCentralSchemesData();
  const stateSchemes = getStateSchemesData();
  const scholarshipsData = getScholarshipsData();

  const allSchemes = [...centralSchemes, ...stateSchemes, ...scholarshipsData];

  return allSchemes
    .map((scheme) => {
      const score = calculateEligibilityScore(scheme, profile);
      const reasons = getEligibilityReasons(scheme, profile);
      const missing = getMissingDocuments(scheme, profile);
      return { ...scheme, eligibility_score: score, eligibility_reasons: reasons, missing_documents: missing };
    })
    .filter((s) => s.eligibility_score! >= 25)
    .sort((a, b) => b.eligibility_score! - a.eligibility_score! || b.benefit_amount - a.benefit_amount);
}

function calculateEligibilityScore(scheme: Scheme, profile: CitizenProfile): number {
  let score = 0;
  if (profile.annualIncome <= scheme.max_income) score += 25;
  if (
    (scheme.min_age === undefined || profile.age >= scheme.min_age) &&
    (scheme.max_age === undefined || profile.age <= scheme.max_age)
  ) {
    score += 25;
  }
  if (scheme.eligible_categories.includes(profile.category) || scheme.eligible_categories.includes('GEN')) score += 25;
  if (scheme.applicable_state === 'ALL' || scheme.applicable_state === profile.state) score += 25;
  if (scheme.gender && scheme.gender !== 'ALL' && scheme.gender !== profile.gender) return 0;
  if (scheme.disability_required && !profile.hasDisability) return 0;
  return score;
}

function getMissingDocuments(scheme: Scheme, profile: CitizenProfile): string[] {
  const docs = scheme.required_documents || [];
  const have = new Set(['Aadhaar']); // Assume Aadhaar always present
  if (profile.annualIncome < 300000) have.add('Income Certificate');
  if (profile.category !== 'GEN') have.add('Caste Certificate');
  if (profile.occupation === 'Student') have.add('Bonafide Certificate');
  return docs.filter((d) => !have.has(d));
}

function getEligibilityReasons(scheme: Scheme, profile: CitizenProfile): string[] {
  const reasons: string[] = [];
  if (profile.annualIncome <= scheme.max_income) {
    reasons.push(`Your income (₹${profile.annualIncome.toLocaleString('en-IN')}) is within the limit of ₹${scheme.max_income.toLocaleString('en-IN')}`);
  }
  if (scheme.eligible_categories.includes(profile.category)) {
    reasons.push(`Your category (${profile.category}) is eligible`);
  }
  if (scheme.min_age !== undefined && scheme.max_age !== undefined && profile.age >= scheme.min_age && profile.age <= scheme.max_age) {
    reasons.push(`Your age (${profile.age}) falls within the eligible range`);
  }
  if (scheme.applicable_state === 'ALL' || scheme.applicable_state === profile.state) {
    reasons.push(`Your state (${profile.state}) is ${scheme.applicable_state === 'ALL' ? 'a central scheme applicable nationally' : 'eligible for this state scheme'}`);
  }
  return reasons;
}

// Embedded data for client-side fallback
function getCentralSchemesData(): Scheme[] {
  return [
    { id: 'CS001', name: 'PM Kisan Samman Nidhi', ministry: 'Agriculture & Farmers Welfare', category: 'Agriculture', description: 'Direct income support of ₹6,000 per year to small and marginal farmers.', benefit_amount: 6000, benefit_type: 'Cash Transfer', benefit_frequency: 'Annual', min_age: 18, max_age: 99, gender: 'ALL', applicable_state: 'ALL', eligible_categories: ['GEN', 'OBC', 'SC', 'ST', 'EWS'], max_income: 999999, disability_required: false, required_documents: ['Aadhaar', 'Bank Passbook', 'Land Records'], deadline: '2025-03-31', application_url: 'https://pmkisan.gov.in', approval_probability: 85, tags: ['farmer', 'agriculture'] },
    { id: 'CS002', name: 'Ayushman Bharat PM-JAY', ministry: 'Health & Family Welfare', category: 'Healthcare', description: 'Health insurance coverage up to ₹5 lakh per family per year.', benefit_amount: 500000, benefit_type: 'Health Insurance', benefit_frequency: 'Annual', min_age: 0, max_age: 99, gender: 'ALL', applicable_state: 'ALL', eligible_categories: ['GEN', 'OBC', 'SC', 'ST', 'EWS'], max_income: 200000, disability_required: false, required_documents: ['Aadhaar', 'Ration Card', 'Income Certificate'], deadline: '2025-12-31', application_url: 'https://pmjay.gov.in', approval_probability: 78, tags: ['health', 'insurance'] },
    { id: 'CS005', name: 'NSP Post-Matric SC Scholarship', ministry: 'Social Justice & Empowerment', category: 'Scholarship', description: 'Post-matric scholarship for SC students. Up to ₹12,000 per year for hostellers.', benefit_amount: 12000, benefit_type: 'Scholarship', benefit_frequency: 'Annual', min_age: 14, max_age: 35, gender: 'ALL', applicable_state: 'ALL', eligible_categories: ['SC'], max_income: 250000, disability_required: false, required_documents: ['Aadhaar', 'Caste Certificate', 'Income Certificate', 'Marksheet'], deadline: '2025-11-30', application_url: 'https://scholarships.gov.in', approval_probability: 79, tags: ['scholarship', 'SC'] },
    { id: 'CS006', name: 'NSP OBC Post-Matric Scholarship', ministry: 'Social Justice & Empowerment', category: 'Scholarship', description: 'Post-matric scholarship for OBC students. Covers tuition, maintenance, and book grants.', benefit_amount: 10000, benefit_type: 'Scholarship', benefit_frequency: 'Annual', min_age: 14, max_age: 35, gender: 'ALL', applicable_state: 'ALL', eligible_categories: ['OBC'], max_income: 100000, disability_required: false, required_documents: ['Aadhaar', 'Caste Certificate', 'Income Certificate', 'Marksheet', 'Bonafide Certificate'], deadline: '2025-11-30', application_url: 'https://scholarships.gov.in', approval_probability: 76, tags: ['scholarship', 'OBC'] },
    { id: 'CS010', name: 'Skill India PMKVY 4.0', ministry: 'Skill Development & Entrepreneurship', category: 'Skill Development', description: 'Free skill training with certification and placement support. Stipend up to ₹1,500/month.', benefit_amount: 18000, benefit_type: 'Training + Stipend', benefit_frequency: 'One-time', min_age: 15, max_age: 45, gender: 'ALL', applicable_state: 'ALL', eligible_categories: ['GEN', 'OBC', 'SC', 'ST', 'EWS'], max_income: 500000, disability_required: false, required_documents: ['Aadhaar', 'Educational Certificate', 'Bank Passbook'], deadline: '2025-12-31', application_url: 'https://www.pmkvyofficial.org', approval_probability: 88, tags: ['skill', 'training', 'youth'] },
    { id: 'CS021', name: 'Central Sector Scholarship (CSSS)', ministry: 'Education', category: 'Scholarship', description: 'Merit-based scholarship for college students. ₹10,000/year for undergraduate.', benefit_amount: 10000, benefit_type: 'Scholarship', benefit_frequency: 'Annual', min_age: 17, max_age: 25, gender: 'ALL', applicable_state: 'ALL', eligible_categories: ['GEN', 'OBC', 'SC', 'ST', 'EWS'], max_income: 800000, disability_required: false, required_documents: ['Aadhaar', 'Income Certificate', 'Class 12 Marksheet', 'College Enrollment Certificate'], deadline: '2025-11-30', application_url: 'https://scholarships.gov.in', approval_probability: 60, tags: ['scholarship', 'merit', 'undergraduate'] },
    { id: 'CS022', name: 'PM Jan Dhan Yojana', ministry: 'Finance', category: 'Banking & Insurance', description: 'Zero-balance bank account with ₹2 lakh accident insurance and RuPay debit card.', benefit_amount: 200000, benefit_type: 'Insurance + Banking', benefit_frequency: 'Annual', min_age: 10, max_age: 99, gender: 'ALL', applicable_state: 'ALL', eligible_categories: ['GEN', 'OBC', 'SC', 'ST', 'EWS'], max_income: 999999999, disability_required: false, required_documents: ['Aadhaar', 'Address Proof'], deadline: '2025-12-31', application_url: 'https://pmjdy.gov.in', approval_probability: 98, tags: ['banking', 'insurance'] },
    { id: 'CS016', name: 'Atal Pension Yojana', ministry: 'Finance (PFRDA)', category: 'Pension', description: 'Guaranteed pension of ₹1,000-5,000/month after age 60 for unorganized sector workers.', benefit_amount: 60000, benefit_type: 'Pension', benefit_frequency: 'Annual', min_age: 18, max_age: 40, gender: 'ALL', applicable_state: 'ALL', eligible_categories: ['GEN', 'OBC', 'SC', 'ST', 'EWS'], max_income: 999999999, disability_required: false, required_documents: ['Aadhaar', 'Mobile Number', 'Bank Account'], deadline: '2025-12-31', application_url: 'https://www.npscra.nsdl.co.in', approval_probability: 93, tags: ['pension', 'social security'] },
    { id: 'CS024', name: 'AICTE Pragati Scholarship (Girls)', ministry: 'Education (AICTE)', category: 'Scholarship', description: 'Scholarship for girl students in technical institutions. ₹50,000 per year.', benefit_amount: 50000, benefit_type: 'Scholarship', benefit_frequency: 'Annual', min_age: 17, max_age: 30, gender: 'FEMALE', applicable_state: 'ALL', eligible_categories: ['GEN', 'OBC', 'SC', 'ST', 'EWS'], max_income: 800000, disability_required: false, required_documents: ['Aadhaar', 'Income Certificate', 'Admission Letter', 'Marksheet'], deadline: '2025-11-15', application_url: 'https://www.aicte-india.org', approval_probability: 70, tags: ['engineering', 'girls', 'scholarship'] },
  ];
}

function getStateSchemesData(): Scheme[] {
  return [
    { id: 'WB001', name: 'Kanyashree Prakalpa', ministry: 'Women & Child Development (WB)', category: 'Girl Child Welfare', description: 'Annual scholarship of ₹1,000 and one-time grant of ₹25,000 for girl students to prevent child marriage.', benefit_amount: 25000, benefit_type: 'Scholarship', benefit_frequency: 'One-time', min_age: 13, max_age: 18, gender: 'FEMALE', applicable_state: 'West Bengal', eligible_categories: ['GEN', 'OBC', 'SC', 'ST', 'EWS'], max_income: 120000, disability_required: false, required_documents: ['Aadhaar', 'Income Certificate', 'School Enrollment'], deadline: '2025-09-30', application_url: 'https://wbkanyashree.gov.in', approval_probability: 82, tags: ['girl', 'WB', 'education'], state: 'West Bengal' },
    { id: 'WB002', name: 'Swasthya Sathi (WB)', ministry: 'Health (WB)', category: 'Healthcare', description: 'West Bengal health insurance scheme providing coverage up to ₹5 lakh per family.', benefit_amount: 500000, benefit_type: 'Health Insurance', benefit_frequency: 'Annual', min_age: 0, max_age: 99, gender: 'ALL', applicable_state: 'West Bengal', eligible_categories: ['GEN', 'OBC', 'SC', 'ST', 'EWS'], max_income: 300000, disability_required: false, required_documents: ['Aadhaar', 'Ration Card', 'Domicile Certificate'], deadline: '2025-12-31', application_url: 'https://swasthyasathi.gov.in', approval_probability: 85, tags: ['health', 'WB'], state: 'West Bengal' },
    { id: 'WB003', name: 'Jai Bangla Scholarship', ministry: 'BC Welfare (WB)', category: 'Scholarship', description: 'Pre and post-matric scholarships for SC/ST/OBC students in West Bengal.', benefit_amount: 8000, benefit_type: 'Scholarship', benefit_frequency: 'Annual', min_age: 10, max_age: 30, gender: 'ALL', applicable_state: 'West Bengal', eligible_categories: ['SC', 'ST', 'OBC'], max_income: 250000, disability_required: false, required_documents: ['Aadhaar', 'Caste Certificate', 'Income Certificate', 'Marksheet'], deadline: '2025-10-31', application_url: 'https://oasis.wb.gov.in', approval_probability: 80, tags: ['scholarship', 'WB', 'OBC'], state: 'West Bengal' },
  ];
}

function getScholarshipsData(): Scheme[] {
  return [
    { id: 'SCH001', name: 'INSPIRE Scholarship (DST)', provider: 'Department of Science & Technology', ministry: 'Science & Technology', category: 'Science & Research', description: 'Scholarship for students pursuing natural and basic sciences. ₹80,000/year.', benefit_amount: 80000, benefit_type: 'Scholarship', benefit_frequency: 'Annual', min_age: 17, max_age: 25, gender: 'ALL', applicable_state: 'ALL', eligible_categories: ['GEN', 'OBC', 'SC', 'ST', 'EWS'], max_income: 999999999, disability_required: false, required_documents: ['Aadhaar', 'Class 12 Marksheet', 'Admission Letter'], deadline: '2025-11-30', application_url: 'https://online-inspire.gov.in', approval_probability: 45, tags: ['science', 'DST'], required_stream: 'Science' },
    { id: 'SCH007', name: 'Swami Vivekananda Scholarship (WB)', provider: 'West Bengal Government', ministry: 'Higher Education (WB)', category: 'State Scholarship', description: 'For meritorious WB students pursuing higher education. ₹1,000-1,500/month.', benefit_amount: 18000, benefit_type: 'Scholarship', benefit_frequency: 'Annual', min_age: 17, max_age: 30, gender: 'ALL', applicable_state: 'West Bengal', eligible_categories: ['GEN', 'OBC', 'SC', 'ST', 'EWS'], max_income: 250000, disability_required: false, required_documents: ['Aadhaar', 'Income Certificate', 'Class 12 Marksheet', 'Admission Letter', 'Domicile Certificate'], deadline: '2025-11-30', application_url: 'https://svmcm.wbhed.gov.in', approval_probability: 65, tags: ['scholarship', 'WB', 'merit'] },
    { id: 'SCH008', name: 'HDFC Parivartan ECSS Scholarship', provider: 'HDFC Bank Parivartan', ministry: 'Private/Corporate', category: 'Private Scholarship', description: 'Education Crisis Scholarship for students facing financial hardship. Up to ₹75,000 one-time.', benefit_amount: 75000, benefit_type: 'Scholarship', benefit_frequency: 'One-time', min_age: 17, max_age: 30, gender: 'ALL', applicable_state: 'ALL', eligible_categories: ['GEN', 'OBC', 'SC', 'ST', 'EWS'], max_income: 500000, disability_required: false, required_documents: ['Aadhaar', 'Income Certificate', 'Marksheet', 'Admission Letter'], deadline: '2025-12-31', application_url: 'https://www.buddy4study.com/scholarship/hdfc-bank', approval_probability: 55, tags: ['private', 'HDFC', 'crisis'] },
  ];
}

export { getCentralSchemesData, getStateSchemesData, getScholarshipsData };
