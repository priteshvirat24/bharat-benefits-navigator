'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { DEFAULT_PROFILE, getClientSideEligibleSchemes } from '@/lib/api';
import { Scheme } from '@/lib/types';
import { CheckCircle, Circle, ExternalLink, Zap, Clock } from 'lucide-react';

interface Step {
  id: string;
  scheme: Scheme;
  step: number;
  action: string;
  description: string;
  time: string;
  status: 'pending' | 'in_progress' | 'done';
  url: string;
}

function generateRoadmap(schemes: Scheme[]): Step[] {
  const top = schemes.slice(0, 4);
  const steps: Step[] = [];
  let id = 1;
  top.forEach((scheme, si) => {
    steps.push({
      id: String(id++), scheme, step: si * 3 + 1,
      action: `Register on portal for ${scheme.name}`,
      description: `Create account or login on the official portal. Have your Aadhaar ready for verification.`,
      time: '30 min', status: si === 0 ? 'in_progress' : 'pending', url: scheme.application_url,
    });
    steps.push({
      id: String(id++), scheme, step: si * 3 + 2,
      action: `Upload documents for ${scheme.name}`,
      description: `Upload: ${(scheme.required_documents || []).slice(0, 3).join(', ')}`,
      time: '45 min', status: 'pending', url: scheme.application_url,
    });
    steps.push({
      id: String(id++), scheme, step: si * 3 + 3,
      action: `Submit application for ${scheme.name}`,
      description: `Fill form, verify details, and submit. Note your application reference number.`,
      time: '20 min', status: 'pending', url: scheme.application_url,
    });
  });
  return steps;
}

export default function RoadmapPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setTimeout(() => {
      const schemes = getClientSideEligibleSchemes(DEFAULT_PROFILE).slice(0, 4);
      setSteps(generateRoadmap(schemes));
      setLoading(false);
    }, 600);
  }, []);

  const toggle = (id: string) => {
    setCompletedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const completedCount = completedIds.size;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  const schemeGroups = steps.reduce<Record<string, Step[]>>((acc, step) => {
    const key = step.scheme.id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(step);
    return acc;
  }, {});

  return (
    <AppShell>
      <div className="p-6 space-y-5 max-w-4xl mx-auto">
        <div>
          <h1 className="text-xl font-bold text-saffron-gradient">Application Roadmap</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            AI-generated step-by-step guide to claim your top 4 schemes
          </p>
        </div>

        {/* Progress */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Overall Progress</span>
            <span className="text-sm font-bold text-saffron">{progress}%</span>
          </div>
          <div className="progress-bar-track h-3 mb-2">
            <div className="progress-bar-fill h-3" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>{completedCount}/{totalSteps} steps completed</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~{Math.ceil((totalSteps - completedCount) * 30)} min remaining</span>
          </div>
        </div>

        {/* Roadmap by scheme */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-48 rounded-2xl shimmer" />)}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(schemeGroups).map(([, schemeSteps], gi) => {
              const scheme = schemeSteps[0].scheme;
              const schemeCompleted = schemeSteps.filter(s => completedIds.has(s.id)).length;
              return (
                <div key={gi} className="glass-card overflow-hidden">
                  {/* Scheme header */}
                  <div className="px-5 py-4 border-b border-white/5"
                    style={{ background: 'rgba(255,153,51,0.05)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{scheme.name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{scheme.ministry}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-saffron">₹{Number(scheme.benefit_amount).toLocaleString('en-IN')}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{schemeCompleted}/{schemeSteps.length} done</div>
                      </div>
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="p-5 space-y-3">
                    {schemeSteps.map((step, idx) => {
                      const done = completedIds.has(step.id);
                      return (
                        <div key={step.id} className="flex items-start gap-4">
                          {/* Timeline line */}
                          <div className="flex flex-col items-center">
                            <button onClick={() => toggle(step.id)}
                              className="w-6 h-6 rounded-full flex items-center justify-center transition-all flex-shrink-0 mt-0.5">
                              {done
                                ? <CheckCircle className="w-6 h-6 text-green-400" />
                                : <Circle className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.2)' }} />
                              }
                            </button>
                            {idx < schemeSteps.length - 1 && (
                              <div className="w-0.5 h-8 mt-1" style={{ background: done ? 'rgba(16,208,96,0.4)' : 'rgba(255,255,255,0.08)' }} />
                            )}
                          </div>
                          {/* Content */}
                          <div className={`flex-1 pb-2 transition-opacity ${done ? 'opacity-50' : ''}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className={`text-sm font-medium ${done ? 'line-through' : ''}`} style={{ color: 'var(--text-primary)' }}>
                                  Step {step.step}: {step.action}
                                </div>
                                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{step.description}</div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                                  <Zap className="w-3 h-3" />{step.time}
                                </div>
                                <a href={step.url} target="_blank" rel="noopener noreferrer"
                                  className="p-1 rounded-lg hover:bg-white/5 transition-colors">
                                  <ExternalLink className="w-3.5 h-3.5" style={{ color: '#FF9933' }} />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
