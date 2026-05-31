'use client';

import { useState } from 'react';
import AppShell from '@/components/AppShell';
import { Upload, CheckCircle, AlertCircle, X, FileText, Eye, Sparkles, Lock } from 'lucide-react';

interface DocStatus {
  name: string;
  type: string;
  status: 'have' | 'missing' | 'expired';
  unlocks: number;
  extractedData?: Record<string, string>;
  uploading?: boolean;
  uploaded?: boolean;
}

const INITIAL_DOCS: DocStatus[] = [
  { name: 'Aadhaar Card', type: 'Aadhaar', status: 'have', unlocks: 0, extractedData: { Name: 'Arjun Kumar', DOB: '12/03/2004', State: 'West Bengal', Aadhaar: 'XXXX XXXX 8421' } },
  { name: 'Income Certificate', type: 'Income Certificate', status: 'missing', unlocks: 12 },
  { name: 'Caste Certificate (OBC)', type: 'Caste Certificate', status: 'missing', unlocks: 8 },
  { name: 'Class 12 Marksheet', type: 'Marksheet', status: 'have', unlocks: 0, extractedData: { Percentage: '78.5%', Board: 'WBCHSE', Year: '2023' } },
  { name: 'Domicile Certificate', type: 'Domicile', status: 'missing', unlocks: 5 },
  { name: 'PAN Card', type: 'PAN', status: 'missing', unlocks: 6 },
  { name: 'Bank Passbook', type: 'Bank Passbook', status: 'have', unlocks: 0 },
  { name: 'College Enrollment Certificate', type: 'Bonafide Certificate', status: 'missing', unlocks: 7 },
  { name: 'Disability Certificate', type: 'Disability Certificate', status: 'missing', unlocks: 3 },
];

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocStatus[]>(INITIAL_DOCS);
  const [uploading, setUploading] = useState<string | null>(null);
  const [showExtracted, setShowExtracted] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const have = docs.filter(d => d.status === 'have').length;
  const missing = docs.filter(d => d.status === 'missing').length;
  const totalUnlockable = docs.filter(d => d.status === 'missing').reduce((s, d) => s + d.unlocks, 0);

  const simulateUpload = (docName: string) => {
    setUploading(docName);
    setTimeout(() => {
      setDocs(prev => prev.map(d => d.name === docName ? {
        ...d, status: 'have', uploading: false, uploaded: true,
        extractedData: {
          'Document Type': d.type,
          'Extracted': 'AI processed successfully',
          'Confidence': '94%',
          'Date': new Date().toLocaleDateString('en-IN'),
        }
      } : d));
      setUploading(null);
    }, 2000);
  };

  return (
    <AppShell>
      <div className="p-6 space-y-5 max-w-5xl mx-auto">
        <div>
          <h1 className="text-xl font-bold text-saffron-gradient">My Documents</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Upload documents to unlock more schemes and auto-fill applications
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card p-4 text-center">
            <CheckCircle className="w-5 h-5 mx-auto mb-2 text-green-400" />
            <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{have}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Documents Ready</div>
          </div>
          <div className="glass-card p-4 text-center">
            <AlertCircle className="w-5 h-5 mx-auto mb-2" style={{ color: '#FF9933' }} />
            <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{missing}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Missing</div>
          </div>
          <div className="glass-card p-4 text-center">
            <Lock className="w-5 h-5 mx-auto mb-2" style={{ color: '#4ca3ff' }} />
            <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalUnlockable}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Schemes Unlockable</div>
          </div>
        </div>

        {/* Upload zone */}
        <div
          className={`upload-zone p-8 text-center cursor-pointer transition-all ${dragOver ? 'active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
          onClick={() => {/* simulate upload of income certificate */simulateUpload('Income Certificate');}}
        >
          <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--accent-saffron)', opacity: 0.7 }} />
          <p className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
            Drop documents here or click to upload
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Supports PDF, JPG, PNG • AI extracts data automatically
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs" style={{ color: '#FF9933' }}>
            <Sparkles className="w-3 h-3" />
            <span>Click to demo AI document extraction</span>
          </div>
        </div>

        {/* Priority missing documents */}
        {docs.filter(d => d.status === 'missing').length > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <AlertCircle className="w-4 h-4" style={{ color: '#FF9933' }} />
              Priority Missing Documents
              <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>(sorted by impact)</span>
            </h2>
            <div className="space-y-2">
              {docs.filter(d => d.status === 'missing').sort((a, b) => b.unlocks - a.unlocks).map(doc => (
                <div key={doc.name} className="glass-card p-4 flex items-center gap-4">
                  <div className="p-2 rounded-xl" style={{ background: 'rgba(255,153,51,0.1)' }}>
                    <FileText className="w-5 h-5 text-saffron" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{doc.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Unlocks <span className="text-green-400 font-semibold">{doc.unlocks} more schemes</span>
                    </div>
                  </div>
                  {uploading === doc.name ? (
                    <div className="flex items-center gap-2 text-xs text-saffron">
                      <div className="w-4 h-4 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
                      <span>AI extracting...</span>
                    </div>
                  ) : (
                    <button onClick={() => simulateUpload(doc.name)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                      style={{ background: 'rgba(255,153,51,0.2)', color: '#FF9933', border: '1px solid rgba(255,153,51,0.3)' }}>
                      Upload
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All documents */}
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>All Documents</h2>
          <div className="space-y-2">
            {docs.filter(d => d.status === 'have').map(doc => (
              <div key={doc.name} className="glass-card p-4 flex items-center gap-4">
                <div className="p-2 rounded-xl" style={{ background: 'rgba(16,208,96,0.1)' }}>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{doc.name}</div>
                  {doc.extractedData && (
                    <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: '#10d060' }}>
                      <Sparkles className="w-3 h-3" />
                      AI extracted {Object.keys(doc.extractedData).length} fields
                    </div>
                  )}
                </div>
                {doc.extractedData && (
                  <button onClick={() => setShowExtracted(showExtracted === doc.name ? null : doc.name)}
                    className="px-2.5 py-1.5 rounded-lg text-xs transition-all hover:bg-white/5 flex items-center gap-1"
                    style={{ color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Eye className="w-3 h-3" />
                    View
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Extracted data modal */}
        {showExtracted && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowExtracted(null)}>
            <div className="glass-card p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-saffron" />
                  AI Extracted Data
                </h3>
                <button onClick={() => setShowExtracted(null)}><X className="w-4 h-4" /></button>
              </div>
              <div className="coral-sql p-4 space-y-1">
                {Object.entries(docs.find(d => d.name === showExtracted)?.extractedData || {}).map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-xs">
                    <span style={{ color: '#FF9933', minWidth: '120px' }}>{k}:</span>
                    <span style={{ color: '#a3e635' }}>"{v}"</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                Confidence: 94% • Extracted via Gemini Vision
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
