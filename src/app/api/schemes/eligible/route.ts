import { NextResponse } from 'next/server';
import { runSQLQuery } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { profile } = body;
    const { age = 21, annualIncome: income = 180000, state = 'West Bengal', gender = 'MALE' } = profile || {};

    const sql = `SELECT id, name, ministry, category, description, benefit_amount, benefit_type, benefit_frequency, applicable_state, eligible_categories, max_income, max_age, min_age, gender, deadline, application_url, approval_probability, required_documents, tags, disability_required FROM central_schemes.schemes WHERE max_income >= ${income} AND min_age <= ${age} AND max_age >= ${age} AND (gender = 'ALL' OR gender = '${gender}')`;
    
    const rows = await runSQLQuery(sql);

    return NextResponse.json({
      schemes: rows,
      query: {
        id: `q_${Date.now()}`,
        sql,
        dataSources: ['central_schemes'],
        executionTime: 40,
        rowCount: rows.length,
        timestamp: new Date().toISOString(),
        status: 'complete',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
