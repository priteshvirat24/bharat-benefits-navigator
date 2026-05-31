'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { DEFAULT_PROFILE, getClientSideEligibleSchemes } from '@/lib/api';
import { Scheme } from '@/lib/types';
import { Clock, ExternalLink, AlertTriangle } from 'lucide-react';

function getUrgency(deadline: string) {
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 7) return { label: 'URGENT', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', days };
  if (days <= 30) return { label: 'SOON', color: '#FF9933', bg: 'rgba(255,153,51,0.15)', days };
  if (days <= 90) return { label: 'UPCOMING', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)', days };
  return { label: 'OPEN', color: '#10d060', bg: 'rgba(16,208,96,0.15)', days };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function CalendarPage() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      const results = getClientSideEligibleSchemes(DEFAULT_PROFILE).filter(s => s.deadline);
      setSchemes(results);
      setLoading(false);
    }, 500);
  }, []);

  const monthSchemes = schemes.filter(s => {
    if (!s.deadline) return false;
    const d = new Date(s.deadline);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDay = (month: number, year: number) => new Date(year, month, 1).getDay();

  const deadlineDays = new Set(monthSchemes.map(s => new Date(s.deadline!).getDate()));
  const urgentDays = new Set(monthSchemes.filter(s => {
    const days = Math.ceil((new Date(s.deadline!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days <= 7;
  }).map(s => new Date(s.deadline!).getDate()));

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const firstDay = getFirstDay(selectedMonth, selectedYear);
  const calendarDays: (number | null)[] = [...Array(firstDay).fill(null), ...Array(daysInMonth).keys().map(d => d + 1)];

  const upcomingAll = schemes
    .filter(s => {
      const days = Math.ceil((new Date(s.deadline!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days > 0;
    })
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

  return (
    <AppShell>
      <div className="p-6 space-y-5 max-w-6xl mx-auto">
        <div>
          <h1 className="text-xl font-bold text-saffron-gradient">Deadlines Calendar</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Track application deadlines — never miss a scheme
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 glass-card p-5">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setSelectedMonth(m => m > 0 ? m - 1 : 11)}
                className="px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-white/5"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}>←</button>
              <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                {MONTHS[selectedMonth]} {selectedYear}
              </h2>
              <button onClick={() => setSelectedMonth(m => m < 11 ? m + 1 : 0)}
                className="px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-white/5"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}>→</button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-xs font-medium py-1" style={{ color: 'var(--text-muted)' }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => (
                <div key={idx} className={`calendar-day ${day && urgentDays.has(day) ? 'urgent-deadline' : day && deadlineDays.has(day) ? 'has-deadline' : ''}`}>
                  {day}
                  {day && deadlineDays.has(day) && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: urgentDays.has(day) ? '#ef4444' : '#FF9933' }} />
                  )}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: 'rgba(255,153,51,0.15)' }} />Deadline</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: 'rgba(239,68,68,0.15)' }} />Urgent (&lt;7 days)</div>
            </div>

            {/* Month deadlines */}
            {monthSchemes.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
                <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {MONTHS[selectedMonth]} Deadlines ({monthSchemes.length})
                </div>
                {monthSchemes.map(s => {
                  const urg = getUrgency(s.deadline!);
                  return (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: urg.bg, border: `1px solid ${urg.color}30` }}>
                      <Clock className="w-4 h-4 flex-shrink-0" style={{ color: urg.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{s.name}</div>
                        <div className="text-xs" style={{ color: urg.color }}>{urg.days} days left</div>
                      </div>
                      <a href={s.application_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3.5 h-3.5" style={{ color: urg.color }} />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming all deadlines list */}
          <div className="space-y-4">
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <AlertTriangle className="w-4 h-4 text-saffron" />
                Upcoming Deadlines
              </h3>
              <div className="space-y-2">
                {loading ? (
                  [...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl shimmer" />)
                ) : upcomingAll.slice(0, 8).map(s => {
                  const urg = getUrgency(s.deadline!);
                  return (
                    <div key={s.id} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="text-xs font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>{s.name}</div>
                        <span className="text-xs font-bold flex-shrink-0 px-1.5 py-0.5 rounded" style={{ background: urg.bg, color: urg.color }}>
                          {urg.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.deadline}</span>
                        <span className="text-xs font-semibold text-saffron">₹{Number(s.benefit_amount).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
