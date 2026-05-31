import { NextResponse } from 'next/server';
import { runSQLQuery } from '@/lib/db';

export async function GET() {
  const sql = `SELECT
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
ORDER BY ah.decision_date DESC`;

  const rows = await runSQLQuery(sql);
  
  const rejections = rows.map((r: any) => {
    const canReapply = r.current_doc_status === 'expired';
    const reapplySteps = canReapply ? [
      `Renew ${r.missing_doc_at_rejection} at ${r.issuing_authority} (${r.renewal_days} days, ₹${r.renewal_fee})`,
      `Visit ${r.renewal_portal} to apply online`,
      `Resubmit application on ${r.portal} with ref: ${r.application_ref}`,
    ] : [
      `Obtain ${r.missing_doc_at_rejection} from ${r.issuing_authority} (${r.renewal_days} days, ₹${r.renewal_fee})`,
      `Visit ${r.renewal_portal || 'the nearest office'} to apply`,
      `Submit fresh application on ${r.portal}`,
    ];
    return { ...r, can_reapply: canReapply, reapply_steps: reapplySteps };
  });

  return NextResponse.json({
    rejections,
    totalLostBenefits: '₹70,000',
    query: {
      id: `q_${Date.now()}`,
      sql,
      dataSources: ['application_history', 'citizen_documents', 'issuing_authorities'],
      executionTime: 45,
      rowCount: rejections.length,
      timestamp: new Date().toISOString(),
      status: 'complete',
    },
  });
}
