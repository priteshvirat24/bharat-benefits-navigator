'use client';

import { useState, useEffect, useMemo } from 'react';
import AppShell from '@/components/AppShell';
import SchemeCard from '@/components/SchemeCard';
import CoralQueryViewer from '@/components/CoralQueryViewer';
import { DEFAULT_PROFILE, getClientSideEligibleSchemes, buildEligibilitySQL } from '@/lib/api';
import { Scheme, CoralQuery } from '@/lib/types';
import { Filter, Search, SlidersHorizontal, Database, IndianRupee } from 'lucide-react';

const CATEGORIES = ['All', 'Scholarship', 'Healthcare', 'Agriculture', 'Skill Development', 'Housing', 'Banking & Insurance', 'Pension', 'Business Grant', 'Startup', 'Education'];

export default function SchemesPage() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [query, setQuery] = useState<CoralQuery | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'score' | 'amount' | 'deadline'>('score');
  const [showCoralSQL, setShowCoralSQL] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      const results = getClientSideEligibleSchemes(DEFAULT_PROFILE);
      setSchemes(results);
      setQuery({
        id: `q_${Date.now()}`,
        sql: buildEligibilitySQL(DEFAULT_PROFILE),
        dataSources: ['central_schemes', 'state_schemes', 'scholarships'],
        executionTime: 127,
        rowCount: results.length,
        timestamp: new Date().toISOString(),
        status: 'complete',
      });
      setLoading(false);
    }, 600);
  }, []);

  const filtered = useMemo(() => {
    let result = [...schemes];
    if (activeCategory !== 'All') result = result.filter(s => s.category === activeCategory);
    if (search) result = result.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.ministry.toLowerCase().includes(search.toLowerCase()));
    if (sortBy === 'amount') result.sort((a, b) => Number(b.benefit_amount) - Number(a.benefit_amount));
    else if (sortBy === 'deadline') result.sort((a, b) => new Date(a.deadline || '9999').getTime() - new Date(b.deadline || '9999').getTime());
    else result.sort((a, b) => (b.eligibility_score || 0) - (a.eligibility_score || 0));
    return result;
  }, [schemes, activeCategory, search, sortBy]);

  const totalBenefit = filtered.reduce((s, sc) => s + Number(sc.benefit_amount), 0);

  return (
    <AppShell>
      <div className="p-6 space-y-5 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-saffron-gradient">Eligible Schemes</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {loading ? 'Querying Coral sources...' : `${filtered.length} schemes matched • Total ₹${(totalBenefit / 100000).toFixed(1)}L potential benefit`}
            </p>
          </div>
          <button onClick={() => setShowCoralSQL(!showCoralSQL)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
            style={{ background: 'rgba(255,153,51,0.1)', color: '#FF9933', border: '1px solid rgba(255,153,51,0.25)' }}>
            <Database className="w-3.5 h-3.5" />
            {showCoralSQL ? 'Hide' : 'Show'} SQL
          </button>
        </div>

        {/* Coral SQL viewer */}
        {showCoralSQL && <CoralQueryViewer query={query} isLoading={loading} defaultExpanded />}

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search schemes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-primary)' }}
            >
              <option value="score">Best Match</option>
              <option value="amount">Highest Amount</option>
              <option value="deadline">Earliest Deadline</option>
            </select>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={activeCategory === cat
                ? { background: 'rgba(255,153,51,0.2)', color: '#FF9933', border: '1px solid rgba(255,153,51,0.4)' }
                : { background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.06)' }
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Schemes grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded-2xl shimmer" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
            <Filter className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No schemes match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((scheme, i) => (
              <SchemeCard key={scheme.id} scheme={scheme} rank={i + 1} />
            ))}
          </div>
        )}

        {/* Summary bar */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between py-3 px-4 rounded-xl"
            style={{ background: 'rgba(255,153,51,0.08)', border: '1px solid rgba(255,153,51,0.15)' }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Showing {filtered.length} eligible scheme{filtered.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-saffron" />
              <span className="font-bold text-saffron">₹{totalBenefit.toLocaleString('en-IN')} total potential</span>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
