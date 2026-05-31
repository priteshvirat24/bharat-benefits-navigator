import { NextResponse } from 'next/server';
import { runSQLQuery } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { sql } = body;
    if (!sql) {
      return NextResponse.json({ error: 'SQL required' }, { status: 400 });
    }

    const rows = await runSQLQuery(sql);

    const sources: string[] = [];
    ['central_schemes', 'state_schemes', 'scholarships', 'citizen_documents', 'application_history', 'issuing_authorities', 'life_events'].forEach(s => {
      if (sql.includes(s)) sources.push(s);
    });

    return NextResponse.json({
      data: rows,
      query: {
        id: `q_${Date.now()}`,
        sql,
        dataSources: sources,
        executionTime: 50,
        rowCount: rows.length,
        timestamp: new Date().toISOString(),
        status: 'complete',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
