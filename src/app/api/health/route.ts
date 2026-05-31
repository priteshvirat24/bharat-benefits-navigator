import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    coral: 'connected',
    sources: ['central_schemes', 'state_schemes', 'scholarships', 'citizen_documents', 'application_history', 'issuing_authorities', 'life_events'],
    version: '2.0.0',
    vercel: true,
  });
}
