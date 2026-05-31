import alasql from 'alasql';
import { exec } from 'child_process';
import { promisify } from 'util';

import centralSchemes from '../../backend/src/data/central-schemes.json';
import stateSchemes from '../../backend/src/data/state-schemes.json';
import scholarships from '../../backend/src/data/scholarships.json';
import citizenDocuments from '../../backend/src/data/citizen-documents.json';
import applicationHistory from '../../backend/src/data/application-history.json';
import issuingAuthorities from '../../backend/src/data/issuing-authorities.json';
import lifeEvents from '../../backend/src/data/life-events.json';

const execAsync = promisify(exec);

// Check if we can run coral locally
async function canRunCoral(): Promise<boolean> {
  if (process.env.VERCEL) return false;
  try {
    const { stdout } = await execAsync('which coral');
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

export async function runSQLQuery(sql: string): Promise<Record<string, unknown>[]> {
  const isCoralAvailable = await canRunCoral();
  if (isCoralAvailable) {
    try {
      const escapedSQL = sql.replace(/"/g, '\\"');
      const { stdout } = await execAsync(`coral sql --format json "${escapedSQL}"`, {
        timeout: 30000,
        env: { ...process.env, PATH: `/usr/local/bin:${process.env.PATH}` },
      });
      return JSON.parse(stdout.trim());
    } catch (e) {
      console.warn('Coral execution failed, falling back to AlaSQL:', e);
    }
  }

  // Fallback to AlaSQL
  const rewrittenSQL = sql
    .replace(/application_history\.applications/gi, 'application_history_applications')
    .replace(/central_schemes\.schemes/gi, 'central_schemes_schemes')
    .replace(/citizen_documents\.documents/gi, 'citizen_documents_documents')
    .replace(/issuing_authorities\.authorities/gi, 'issuing_authorities_authorities')
    .replace(/life_events\.events/gi, 'life_events_events')
    .replace(/scholarships\.scholarships/gi, 'scholarships_scholarships')
    .replace(/state_schemes\.schemes/gi, 'state_schemes_schemes');

  // Register tables
  // @ts-ignore
  alasql.tables.central_schemes_schemes = { data: centralSchemes };
  // @ts-ignore
  alasql.tables.state_schemes_schemes = { data: stateSchemes };
  // @ts-ignore
  alasql.tables.scholarships_scholarships = { data: scholarships };
  // @ts-ignore
  alasql.tables.citizen_documents_documents = { data: citizenDocuments };
  // @ts-ignore
  alasql.tables.application_history_applications = { data: applicationHistory };
  // @ts-ignore
  alasql.tables.issuing_authorities_authorities = { data: issuingAuthorities };
  // @ts-ignore
  alasql.tables.life_events_events = { data: lifeEvents };

  // Register custom json_contains function for AlaSQL
  // @ts-ignore
  alasql.fn.json_contains = (arr: any, val: any) => {
    try {
      const parsedArr = typeof arr === 'string' ? JSON.parse(arr) : arr;
      const parsedVal = typeof val === 'string' && val.startsWith('"') && val.endsWith('"') 
        ? JSON.parse(val) 
        : val;
      return Array.isArray(parsedArr) && parsedArr.includes(parsedVal);
    } catch {
      return false;
    }
  };

  try {
    const res = alasql(rewrittenSQL);
    return Array.isArray(res) ? res : [];
  } catch (err) {
    console.error('AlaSQL compilation/execution error:', err, 'SQL:', rewrittenSQL);
    return [];
  }
}
