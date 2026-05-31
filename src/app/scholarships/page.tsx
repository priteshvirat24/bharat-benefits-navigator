'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import SchemeCard from '@/components/SchemeCard';
import CoralQueryViewer from '@/components/CoralQueryViewer';
import { DEFAULT_PROFILE, getClientSideEligibleSchemes, buildScholarshipSQL } from '@/lib/api';
import { Scheme, CoralQuery } from '@/lib/types';
import { GraduationCap, BookOpen, Award, Globe } from 'lucide-react';

const SCHOLARSHIP_FILTERS = ['All', 'Central Gov', 'State Scheme', 'Private/Corporate', 'Science & Research', 'International'];

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState<Scheme[]>([]);
  const [query, setQuery] = useState<CoralQuery | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    setTimeout(() => {
      const all = getClientSideEligibleSchemes(DEFAULT_PROFILE);
      const schols = all.filter(s => s.category.toLowerCase().includes('scholarship') || s.benefit_type === 'Scholarship' || s.benefit_type === 'Fellowship' || s.provider);
      setScholarships(schols);
      setQuery({
        id: `q_${Date.now()}`,
        sql: buildScholarshipSQL(DEFAULT_PROFILE),
        dataSources: ['scholarships', 'central_schemes', 'state_schemes'],
        executionTime: 89,
        rowCount: schols.length,
        timestamp: new Date().toISOString(),
        status: 'complete',
      });
      setLoading(false);
    }, 700);
  }, []);

  const filtered = filter === 'All' ? scholarships : scholarships.filter(s => {
    if (filter === 'State Scheme') return !!s.state;
    if (filter === 'Private/Corporate') return !!s.provider;
    if (filter === 'Science & Research') return s.category.includes('Science') || s.required_stream === 'Science';
    if (filter === 'International') return s.name.toLowerCase().includes('overseas') || s.name.toLowerCase().includes('abroad') || s.name.toLowerCase().includes('cornell');
    return s.ministry && !s.state && !s.provider;
  });

  const totalAmount = filtered.reduce((s, sc) => s + Number(sc.benefit_amount), 0);

  return (
    <AppShell>
      <div className="p-6 space-y-5 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 rounded-xl" style={{ background: 'rgba(124,58,237,0.2)' }}>
            <GraduationCap className="w-6 h-6" style={{ color: '#a78bfa' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Scholarships</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {loading ? 'Querying scholarship database...' : `${filtered.length} scholarships worth ₹${(totalAmount/100000).toFixed(1)}L found for you`}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: BookOpen, label: 'NSP Scholarships', value: String(scholarships.filter(s => !s.state && !s.provider).length), color: '#FF9933' },
            { icon: Globe, label: 'State Schemes', value: String(scholarships.filter(s => !!s.state).length), color: '#10d060' },
            { icon: Award, label: 'Private/Corporate', value: String(scholarships.filter(s => !!s.provider).length), color: '#a78bfa' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="glass-card p-4 text-center">
              <Icon className="w-5 h-5 mx-auto mb-2" style={{ color }} />
              <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Coral SQL */}
        <CoralQueryViewer query={query} isLoading={loading} />

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SCHOLARSHIP_FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={filter === f
                ? { background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.4)' }
                : { background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {f}
            </button>
          ))}
        </div>

        {/* Scholarships grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-64 rounded-2xl shimmer" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((s, i) => <SchemeCard key={s.id} scheme={s} rank={i + 1} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}
