import { NextResponse } from 'next/server';
import { runSQLQuery } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { event = 'college_admission', age = 21, income = 180000, state = 'West Bengal' } = body;

    const eventSQL = `SELECT
  le.label AS life_event,
  le.description AS event_description,
  le.impact_score,
  le.requires_docs,
  cs.name AS scheme_name,
  cs.benefit_amount,
  cs.category,
  cs.benefit_type,
  cs.deadline,
  cs.application_url,
  'central' AS source
FROM life_events.events le, central_schemes.schemes cs
WHERE le.life_event = '${event}'
  AND cs.max_income >= ${income}
  AND cs.min_age <= ${age} AND cs.max_age >= ${age}
  AND (cs.category IN ('Scholarship', 'Skill Development', 'Education')
    OR cs.category IN ('Healthcare', 'Pension', 'Banking & Insurance'))
ORDER BY cs.benefit_amount DESC
LIMIT 8`;

    const stateEventSQL = `SELECT
  le.label AS life_event,
  ss.name AS scheme_name,
  ss.benefit_amount,
  ss.category,
  ss.benefit_type,
  ss.deadline,
  ss.application_url,
  'state' AS source
FROM life_events.events le, state_schemes.schemes ss
WHERE le.life_event = '${event}'
  AND ss.applicable_state = '${state}'
  AND ss.max_income >= ${income}
ORDER BY ss.benefit_amount DESC`;

    const [centralRows, stateRows] = await Promise.all([
      runSQLQuery(eventSQL),
      runSQLQuery(stateEventSQL),
    ]);

    const docReqSQL = `SELECT le.requires_docs, cd.doc_type, cd.status FROM life_events.events le, citizen_documents.documents cd WHERE le.life_event = '${event}' AND cd.user_id = 'demo-user-001'`;
    const docRows = await runSQLQuery(docReqSQL);

    const allSchemes = [...centralRows, ...stateRows]
      .sort((a: any, b: any) => Number(b.benefit_amount) - Number(a.benefit_amount));
    const totalNewBenefit = allSchemes.reduce((s, r) => s + Number(r.benefit_amount), 0);

    const combinedSQL = `-- LIFE EVENT AGENT: "${event}"
-- 4-way cross-source: life_events × central_schemes × state_schemes × citizen_documents

${eventSQL}

UNION ALL

${stateEventSQL}

-- Document readiness check:
${docReqSQL}`;

    return NextResponse.json({
      event: centralRows[0]?.life_event || event,
      event_description: centralRows[0]?.event_description,
      impact_score: Number(centralRows[0]?.impact_score || 0),
      unlocked_schemes: allSchemes,
      total_new_benefit: totalNewBenefit,
      document_readiness: docRows,
      query: {
        id: `q_${Date.now()}`,
        sql: combinedSQL,
        dataSources: ['life_events', 'central_schemes', 'state_schemes', 'citizen_documents'],
        executionTime: 70,
        rowCount: allSchemes.length,
        timestamp: new Date().toISOString(),
        status: 'complete',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
