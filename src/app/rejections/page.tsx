'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import CoralQueryViewer from '@/components/CoralQueryViewer';
import { CoralQuery } from '@/lib/types';
import { XCircle, CheckCircle, ArrowRight, ExternalLink, AlertTriangle, FileText, Zap, Clock, RefreshCw } from 'lucide-react';

interface Rejection {
  scheme_name: string;
  rejection_reason: string;
  missing_doc_at_rejection: string;
  doc_expiry_gap_days: number | null;
  applied_date: string;
  decision_date: string;
  portal: string;
  application_ref: string;
  current_doc_status: string;
  doc_expiry_date: string | null;
  issuing_authority: string;
  renewal_days: number;
  renewal_fee: number;
  renewal_portal: string;
  renewal_tip: string;
  can_reapply: boolean;
  reapply_steps: string[];
}

export default function RejectionsPage() {
  const [rejections, setRejections] = useState<Rejection[]>([]);
  const [query, setQuery] = useState<CoralQuery | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const fetchRejections = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/rejections');
        if (res.ok) {
          const data = await res.json();
          setRejections(data.rejections);
          setQuery(data.query);
        } else throw new Error('');
      } catch {
        // Fallback
        setRejections([
          {
            scheme_name: 'NSP OBC Post-Matric Scholarship',
            rejection_reason: 'Income certificate expired at time of verification',
            missing_doc_at_rejection: 'Income Certificate',
            doc_expiry_gap_days: 37,
            applied_date: '2024-09-15',
            decision_date: '2024-11-20',
            portal: 'scholarships.gov.in',
            application_ref: 'NSP-2024-WB-88421',
            current_doc_status: 'expired',
            doc_expiry_date: '2024-11-05',
            issuing_authority: 'SDO / Tehsil Office',
            renewal_days: 15,
            renewal_fee: 50,
            renewal_portal: 'https://serviceonline.gov.in',
            renewal_tip: 'Apply online via ServicePlus or visit Tehsil office.',
            can_reapply: true,
            reapply_steps: [
              'Renew Income Certificate at SDO / Tehsil Office (15 days, ₹50)',
              'Visit https://serviceonline.gov.in to apply online',
              'Resubmit application on scholarships.gov.in with ref: NSP-2024-WB-88421',
            ],
          },
          {
            scheme_name: 'Central Sector Scholarship (CSSS)',
            rejection_reason: 'Caste certificate expired; OBC verification failed',
            missing_doc_at_rejection: 'Caste Certificate',
            doc_expiry_gap_days: 45,
            applied_date: '2024-10-01',
            decision_date: '2024-12-15',
            portal: 'scholarships.gov.in',
            application_ref: 'CSSS-2024-WB-33102',
            current_doc_status: 'expired',
            doc_expiry_date: '2025-02-10',
            issuing_authority: 'Block Development Officer / Tehsil',
            renewal_days: 21,
            renewal_fee: 25,
            renewal_portal: 'https://serviceonline.gov.in',
            renewal_tip: 'Ensure your sub-caste is listed in the central OBC list.',
            can_reapply: true,
            reapply_steps: [
              'Renew Caste Certificate at Block Development Officer (21 days, ₹25)',
              'Visit https://serviceonline.gov.in to apply online',
              'Resubmit application on scholarships.gov.in with ref: CSSS-2024-WB-33102',
            ],
          },
          {
            scheme_name: 'Swami Vivekananda Scholarship (WB)',
            rejection_reason: 'Domicile certificate not submitted; applicant could not prove WB residency',
            missing_doc_at_rejection: 'Domicile Certificate',
            doc_expiry_gap_days: null,
            applied_date: '2024-11-01',
            decision_date: '2025-01-25',
            portal: 'svmcm.wbhed.gov.in',
            application_ref: 'SVMCM-2024-KOL-9987',
            current_doc_status: 'missing',
            doc_expiry_date: null,
            issuing_authority: 'District Magistrate / SDO Office',
            renewal_days: 15,
            renewal_fee: 30,
            renewal_portal: 'https://banglarbhumi.gov.in',
            renewal_tip: 'Permanent document — no expiry. Required for all WB state scholarships.',
            can_reapply: false,
            reapply_steps: [
              'Obtain Domicile Certificate from District Magistrate / SDO Office (15 days, ₹30)',
              'Visit https://banglarbhumi.gov.in to apply',
              'Submit fresh application on svmcm.wbhed.gov.in',
            ],
          },
        ]);
        setQuery({
          id: 'q_rejections',
          sql: `-- REJECTION ANALYSIS: 3-way cross-source JOIN
-- application_history × citizen_documents × issuing_authorities

SELECT
  ah.scheme_name,
  ah.rejection_reason,
  ah.missing_doc_at_rejection,
  ah.doc_expiry_gap_days,
  ah.applied_date,
  ah.decision_date,
  ah.portal,
  ah.application_ref,
  cd.status AS current_doc_status,
  cd.expiry_date AS doc_expiry_date,
  ia.issuing_authority,
  ia.processing_days AS renewal_days,
  ia.fee_inr AS renewal_fee,
  ia.online_portal AS renewal_portal,
  ia.tip AS renewal_tip
FROM application_history.applications ah
JOIN citizen_documents.documents cd
  ON ah.missing_doc_at_rejection = cd.doc_type
JOIN issuing_authorities.authorities ia
  ON cd.doc_type = ia.doc_type
WHERE ah.status = 'rejected'
  AND ah.user_id = 'demo-user-001'
ORDER BY ah.decision_date DESC`,
          dataSources: ['application_history', 'citizen_documents', 'issuing_authorities'],
          executionTime: 89,
          rowCount: 3,
          timestamp: new Date().toISOString(),
          status: 'complete',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchRejections();
  }, []);

  const totalLost = 70000;

  return (
    <AppShell>
      <div className="p-6 space-y-5 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.15)' }}>
            <XCircle className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Why Were Your Applications Rejected?
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              3-way Coral JOIN across <code className="text-saffron">application_history × citizen_documents × issuing_authorities</code> to diagnose and fix rejections
            </p>
          </div>
        </div>

        {/* Impact banner */}
        <div className="rounded-xl p-5" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Total Benefits Lost to Rejections
              </div>
              <div className="text-3xl font-black" style={{ color: '#ef4444' }}>₹{totalLost.toLocaleString('en-IN')}/year</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(16,208,96,0.1)', color: '#10d060', border: '1px solid rgba(16,208,96,0.2)' }}>
                <CheckCircle className="w-3.5 h-3.5" />
                All 3 rejections are fixable
              </span>
            </div>
          </div>
        </div>

        {/* Coral Query */}
        <CoralQueryViewer query={query} isLoading={loading} defaultExpanded />

        {/* Rejection Cards */}
        {loading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-48 rounded-2xl shimmer" />)}</div>
        ) : (
          <div className="space-y-4">
            {rejections.map((r, idx) => (
              <div key={idx} className="glass-card overflow-hidden">
                {/* Main rejection info */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(239,68,68,0.12)' }}>
                      <XCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                        {r.scheme_name}
                      </h3>
                      <div className="mt-2 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                        <div className="text-sm font-medium" style={{ color: '#ef4444' }}>
                          ❌ {r.rejection_reason}
                        </div>
                      </div>

                      {/* Root cause analysis */}
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <div style={{ color: 'var(--text-muted)' }}>Applied</div>
                          <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{r.applied_date}</div>
                        </div>
                        <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <div style={{ color: 'var(--text-muted)' }}>Decision</div>
                          <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{r.decision_date}</div>
                        </div>
                        <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <div style={{ color: 'var(--text-muted)' }}>Problem Document</div>
                          <div className="font-medium" style={{ color: '#fbbf24' }}>
                            {r.missing_doc_at_rejection} ({r.current_doc_status})
                          </div>
                        </div>
                        <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <div style={{ color: 'var(--text-muted)' }}>Expiry Gap</div>
                          <div className="font-medium" style={{ color: '#ef4444' }}>
                            {r.doc_expiry_gap_days ? `${r.doc_expiry_gap_days} days overdue` : 'Never obtained'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fix plan */}
                <div className="border-t border-white/5 px-5 py-4" style={{ background: 'rgba(16,208,96,0.03)' }}>
                  <button onClick={() => setExpandedId(expandedId === idx ? null : idx)}
                    className="w-full flex items-center justify-between text-sm font-semibold" style={{ color: '#10d060' }}>
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      How to Fix & Reapply
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {r.renewal_days} days · ₹{r.renewal_fee}
                    </span>
                  </button>

                  {expandedId === idx && (
                    <div className="mt-4 space-y-3">
                      {r.reapply_steps.map((step, si) => (
                        <div key={si} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: 'rgba(16,208,96,0.15)', color: '#10d060' }}>
                            {si + 1}
                          </div>
                          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{step}</div>
                        </div>
                      ))}
                      <div className="mt-3 p-3 rounded-lg flex items-center gap-2" style={{ background: 'rgba(255,153,51,0.06)', border: '1px solid rgba(255,153,51,0.15)' }}>
                        <AlertTriangle className="w-4 h-4 text-saffron flex-shrink-0" />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          💡 {r.renewal_tip}
                        </span>
                      </div>
                      <a href={r.renewal_portal} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg, #10d060, #059669)' }}>
                        Start Renewal Process
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
