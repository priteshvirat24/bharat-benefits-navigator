'use client';

import { useState } from 'react';
import { ExternalLink, CheckCircle, AlertCircle, Clock, TrendingUp, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Scheme } from '@/lib/types';

interface SchemeCardProps {
  scheme: Scheme;
  rank: number;
}

function EligibilityRing({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? '#10d060' : score >= 50 ? '#FF9933' : '#ef4444';

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle
          cx="32" cy="32" r={radius} fill="none"
          stroke={color} strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>{score}%</span>
      </div>
    </div>
  );
}

function getBenefitColor(type: string): string {
  const map: Record<string, string> = {
    'Scholarship': '#a78bfa',
    'Cash Transfer': '#10d060',
    'Health Insurance': '#f472b6',
    'Insurance': '#f472b6',
    'Subsidy': '#FF9933',
    'Loan': '#60a5fa',
    'Training + Stipend': '#4ade80',
    'Grant': '#fbbf24',
    'Pension': '#c084fc',
    'Fee Reimbursement': '#38bdf8',
  };
  return map[type] || '#8ba8c8';
}

export default function SchemeCard({ scheme, rank }: SchemeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const score = scheme.eligibility_score || 0;
  const missing = scheme.missing_documents || [];
  const reasons = scheme.eligibility_reasons || [];

  const urgencyDays = scheme.deadline
    ? Math.ceil((new Date(scheme.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="glass-card glass-card-hover p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-start gap-4">
        <EligibilityRing score={score} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>#{rank}</span>
                {scheme.state && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(76, 163, 255, 0.15)', color: '#4ca3ff', border: '1px solid rgba(76,163,255,0.25)' }}>
                    {scheme.state}
                  </span>
                )}
                {scheme.provider && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(124, 58, 237, 0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}>
                    {scheme.provider}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>
                {scheme.name}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {scheme.ministry}
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <div className="text-lg font-bold text-saffron-gradient">
                ₹{Number(scheme.benefit_amount).toLocaleString('en-IN')}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {scheme.benefit_frequency}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefit type + approval badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{ background: `${getBenefitColor(scheme.benefit_type)}20`, color: getBenefitColor(scheme.benefit_type), border: `1px solid ${getBenefitColor(scheme.benefit_type)}35` }}>
          {scheme.benefit_type}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium badge-eligible">
          <TrendingUp className="w-3 h-3" />
          {scheme.approval_probability}% approval
        </span>
        {urgencyDays !== null && urgencyDays <= 30 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: urgencyDays <= 7 ? 'rgba(239,68,68,0.15)' : 'rgba(251,191,36,0.15)', color: urgencyDays <= 7 ? '#ef4444' : '#fbbf24', border: `1px solid ${urgencyDays <= 7 ? 'rgba(239,68,68,0.3)' : 'rgba(251,191,36,0.3)'}` }}>
            <Clock className="w-3 h-3" />
            {urgencyDays <= 0 ? 'Deadline passed' : `${urgencyDays} days left`}
          </span>
        )}
        {missing.length > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium badge-partial">
            <AlertCircle className="w-3 h-3" />
            {missing.length} doc{missing.length !== 1 ? 's' : ''} missing
          </span>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="space-y-3 pt-2 border-t border-white/5">
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {scheme.description}
          </p>

          {reasons.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                ✅ Why you qualify
              </div>
              <ul className="space-y-1">
                {reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {missing.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                📄 Missing documents
              </div>
              <ul className="space-y-1">
                {missing.map((doc, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs badge-partial px-2 py-1 rounded-lg w-fit">
                    <FileText className="w-3 h-3" />
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {scheme.deadline && (
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              📅 Deadline: <span style={{ color: 'var(--text-secondary)' }}>{scheme.deadline}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center gap-2 pt-1">
        <a
          href={scheme.application_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #FF9933, #ff6b00)', color: 'white' }}
        >
          Apply Now
          <ExternalLink className="w-3 h-3" />
        </a>
        <button
          onClick={() => setExpanded(!expanded)}
          className="px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
