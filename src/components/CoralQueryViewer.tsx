'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Database, Zap, Clock, TableProperties } from 'lucide-react';
import { CoralQuery } from '@/lib/types';

interface CoralQueryViewerProps {
  query: CoralQuery | null;
  isLoading?: boolean;
  defaultExpanded?: boolean;
}

const SOURCE_COLORS: Record<string, string> = {
  central_schemes: 'data-source-central',
  state_schemes: 'data-source-state',
  scholarships: 'data-source-scholarship',
  citizen_profile: 'data-source-profile',
  citizen_documents: 'data-source-documents',
  uploaded_documents: 'data-source-documents',
  application_history: 'data-source-history',
  issuing_authorities: 'data-source-authorities',
  life_events: 'data-source-events',
  'coral.metadata': 'data-source-profile',
};

const SOURCE_LABELS: Record<string, string> = {
  central_schemes: '🏛 central_schemes',
  state_schemes: '🗺 state_schemes',
  scholarships: '🎓 scholarships',
  citizen_profile: '👤 citizen_profile',
  citizen_documents: '📄 citizen_documents',
  uploaded_documents: '📄 uploaded_documents',
  application_history: '📋 application_history',
  issuing_authorities: '🏢 issuing_authorities',
  life_events: '⚡ life_events',
  'coral.metadata': '🪸 coral.metadata',
};

function syntaxHighlightSQL(sql: string): string {
  const keywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'INNER', 'ON', 'AND', 'OR', 'ORDER', 'BY', 'LIMIT', 'UNION', 'ALL', 'AS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'GROUP', 'HAVING', 'DESC', 'ASC', 'NULL', 'IS', 'NOT', 'IN', 'BETWEEN', 'DISTINCT', 'COUNT', 'SUM', 'MAX', 'MIN', 'AVG', 'ROUND'];
  
  let highlighted = sql
    .replace(/--[^\n]*/g, (match) => `<span style="color:#4a6a8a;font-style:italic">${match}</span>`)
    .replace(/'[^']*'/g, (match) => `<span style="color:#a3e635">${match}</span>`)
    .replace(/\b(\d+)\b/g, (match) => `<span style="color:#60a5fa">${match}</span>`);
  
  keywords.forEach(kw => {
    highlighted = highlighted.replace(
      new RegExp(`\\b${kw}\\b`, 'g'),
      `<span style="color:#FF9933;font-weight:600">${kw}</span>`
    );
  });
  
  // Schema.table coloring
  highlighted = highlighted.replace(
    /\b(central_schemes|state_schemes|scholarships|citizen_documents|application_history|issuing_authorities|life_events|coral)\.([\w.]+)/g,
    '<span style="color:#a78bfa">$1</span><span style="color:#f0f6ff">.</span><span style="color:#4ca3ff">$2</span>'
  );
  
  return highlighted;
}

export default function CoralQueryViewer({ query, isLoading, defaultExpanded = false }: CoralQueryViewerProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isLoading) setAnimating(true);
    else setTimeout(() => setAnimating(false), 500);
  }, [isLoading]);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255, 153, 51, 0.2)', background: 'rgba(2, 10, 20, 0.8)' }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Database className="w-4 h-4 text-saffron" />
            <span className="text-sm font-semibold font-mono text-saffron">Coral SQL</span>
          </div>

          {/* Data sources */}
          {query && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {query.dataSources.map((src) => (
                <span key={src} className={`data-source-badge ${SOURCE_COLORS[src] || 'data-source-central'}`}>
                  {SOURCE_LABELS[src] || src}
                </span>
              ))}
            </div>
          )}

          {/* Animated running indicator */}
          {(isLoading || animating) && (
            <div className="flex items-center gap-1.5">
              <div className="flex gap-1">
                <div className="typing-dot w-1.5 h-1.5 rounded-full bg-orange-400" />
                <div className="typing-dot w-1.5 h-1.5 rounded-full bg-orange-400" />
                <div className="typing-dot w-1.5 h-1.5 rounded-full bg-orange-400" />
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Running...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {query && !isLoading && (
            <>
              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <TableProperties className="w-3 h-3" />
                <span>{query.rowCount} rows</span>
              </div>
              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Zap className="w-3 h-3" />
                <span>{query.executionTime}ms</span>
              </div>
            </>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          ) : (
            <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          )}
        </div>
      </button>

      {/* SQL content */}
      {expanded && query && (
        <div className="border-t border-white/5">
          {/* Source join diagram */}
          {query.dataSources.length > 1 && (
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2 flex-wrap">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Cross-source JOIN:</span>
              {query.dataSources.map((src, i) => (
                <div key={src} className="flex items-center gap-2">
                  <span className={`data-source-badge text-xs ${SOURCE_COLORS[src] || 'data-source-central'}`}>
                    {SOURCE_LABELS[src] || src}
                  </span>
                  {i < query.dataSources.length - 1 && (
                    <span className="text-xs text-saffron font-mono">×</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* SQL block */}
          <div className="coral-sql overflow-x-auto">
            <pre className="text-sm leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: syntaxHighlightSQL(query.sql) }}
            />
          </div>

          {/* Footer stats */}
          <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                <span className="text-green-400 font-mono">✓</span> {query.rowCount} results
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                <Clock className="w-3 h-3 inline mr-1" />
                {new Date(query.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              {query.executionTime}ms · coral sql
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
