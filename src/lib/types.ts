export interface CitizenProfile {
  id: string;
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  state: string;
  district: string;
  annualIncome: number;
  occupation: string;
  educationLevel: string;
  category: 'GEN' | 'OBC' | 'SC' | 'ST' | 'EWS' | 'Minority';
  hasDisability: boolean;
  disabilityPercentage?: number;
  familySize: number;
  isFarmer: boolean;
  hasBPLCard: boolean;
  phone: string;
  email: string;
  completionScore: number;
}

export interface Scheme {
  id: string;
  name: string;
  ministry: string;
  category: string;
  description: string;
  benefit_amount: number;
  benefit_type: string;
  benefit_frequency: string;
  applicable_state: string;
  eligible_categories: string[];
  max_income: number;
  deadline: string;
  application_url: string;
  approval_probability: number;
  required_documents: string[];
  tags: string[];
  eligibility_score?: number;
  eligibility_reasons?: string[];
  missing_documents?: string[];
  state?: string;
  provider?: string;
  required_stream?: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  status: 'available' | 'missing' | 'expired';
  uploadedAt?: string;
  expiresAt?: string;
  extractedData?: Record<string, string>;
  unlocksSchemes?: number;
}

export interface CoralQuery {
  id: string;
  sql: string;
  dataSources: string[];
  executionTime: number;
  rowCount: number;
  timestamp: string;
  status: 'running' | 'complete' | 'error';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  coralQuery?: CoralQuery;
}

export interface RoadmapStep {
  id: string;
  schemeId: string;
  schemeName: string;
  step: number;
  title: string;
  description: string;
  actionUrl?: string;
  estimatedTime: string;
  status: 'pending' | 'in_progress' | 'completed';
  deadline?: string;
}

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry'
];

export const EDUCATION_LEVELS = [
  'No formal education', 'Primary (Class 1-5)', 'Middle (Class 6-8)',
  'Secondary (Class 9-10)', 'Senior Secondary (Class 11-12)',
  'Diploma/ITI', 'Undergraduate (B.A./B.Sc./B.Com./B.Tech.)',
  'Postgraduate (M.A./M.Sc./M.Tech.)', 'PhD/Research', 'Professional (MBBS/LLB/CA)'
];

export const OCCUPATIONS = [
  'Student', 'Farmer', 'Agricultural Laborer', 'Daily Wage Worker',
  'Self-Employed', 'Street Vendor', 'Artisan/Craftsperson', 'Entrepreneur',
  'Private Sector Employee', 'Government Employee', 'Unemployed', 'Homemaker',
  'Other'
];
