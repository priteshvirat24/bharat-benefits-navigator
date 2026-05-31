'use client';

import { useState } from 'react';
import AppShell from '@/components/AppShell';
import { DEFAULT_PROFILE } from '@/lib/api';
import { INDIAN_STATES, EDUCATION_LEVELS, OCCUPATIONS } from '@/lib/types';
import { User, MapPin, DollarSign, GraduationCap, Save, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'education' | 'family' | 'location'>('personal');

  const update = (key: string, value: unknown) => setProfile(p => ({ ...p, [key]: value }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'family', label: 'Family & Income', icon: DollarSign },
    { id: 'location', label: 'Location', icon: MapPin },
  ] as const;

  return (
    <AppShell>
      <div className="p-6 space-y-5 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-saffron-gradient">Your Profile</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Complete your profile to unlock more schemes
            </p>
          </div>
          <button onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: saved ? 'linear-gradient(135deg, #10d060, #059669)' : 'linear-gradient(135deg, #FF9933, #ff6b00)' }}>
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save Profile'}
          </button>
        </div>

        {/* Profile completion */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl font-bold">
              {profile.name[0]}
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{profile.name}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{profile.category} • {profile.state} • Age {profile.age}</div>
            </div>
          </div>
          <div className="progress-bar-track h-2 mb-1">
            <div className="progress-bar-fill h-2" style={{ width: `${profile.completionScore}%` }} />
          </div>
          <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Profile {profile.completionScore}% complete</span>
            <span>Add missing info to unlock more schemes</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id as typeof activeTab)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={activeTab === id
                ? { background: 'rgba(255,153,51,0.2)', color: '#FF9933' }
                : { color: 'var(--text-muted)' }}>
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Form fields */}
        <div className="glass-card p-5 space-y-4">
          {activeTab === 'personal' && (
            <>
              <Field label="Full Name" value={profile.name} onChange={v => update('name', v)} />
              <Field label="Age" type="number" value={String(profile.age)} onChange={v => update('age', Number(v))} />
              <SelectField label="Gender" value={profile.gender} onChange={v => update('gender', v)} options={['MALE', 'FEMALE', 'OTHER']} />
              <SelectField label="Category" value={profile.category} onChange={v => update('category', v)} options={['GEN', 'OBC', 'SC', 'ST', 'EWS', 'Minority']} />
              <Field label="Phone" value={profile.phone} onChange={v => update('phone', v)} />
              <Field label="Email" type="email" value={profile.email} onChange={v => update('email', v)} />
              <ToggleField label="Person with Disability (PwD)" value={profile.hasDisability} onChange={v => update('hasDisability', v)} />
            </>
          )}

          {activeTab === 'education' && (
            <>
              <SelectField label="Education Level" value={profile.educationLevel} onChange={v => update('educationLevel', v)} options={EDUCATION_LEVELS} />
              <SelectField label="Occupation" value={profile.occupation} onChange={v => update('occupation', v)} options={OCCUPATIONS} />
              <ToggleField label="Farmer / Agriculture Worker" value={profile.isFarmer} onChange={v => update('isFarmer', v)} />
            </>
          )}

          {activeTab === 'family' && (
            <>
              <Field label="Annual Family Income (₹)" type="number" value={String(profile.annualIncome)} onChange={v => update('annualIncome', Number(v))} />
              <Field label="Family Size (members)" type="number" value={String(profile.familySize)} onChange={v => update('familySize', Number(v))} />
              <ToggleField label="BPL (Below Poverty Line) Ration Card" value={profile.hasBPLCard} onChange={v => update('hasBPLCard', v)} />
            </>
          )}

          {activeTab === 'location' && (
            <>
              <SelectField label="State" value={profile.state} onChange={v => update('state', v)} options={INDIAN_STATES} />
              <Field label="District" value={profile.district} onChange={v => update('district', v)} />
            </>
          )}
        </div>

        {/* Impact preview */}
        <div className="glass-card p-5" style={{ border: '1px solid rgba(255,153,51,0.2)' }}>
          <h3 className="text-sm font-semibold mb-3 text-saffron">Profile Impact Preview</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Your Category', value: profile.category, color: '#a78bfa' },
              { label: 'Your State', value: profile.state, color: '#4ca3ff' },
              { label: 'Income Bracket', value: profile.annualIncome <= 200000 ? 'Low Income' : profile.annualIncome <= 500000 ? 'Middle Income' : 'Higher Income', color: '#10d060' },
              { label: 'Occupation', value: profile.occupation, color: '#FF9933' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
                <div className="font-semibold text-sm" style={{ color }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
        style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-primary)' }} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: 'rgba(10,25,41,0.8)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-primary)' }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ToggleField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <button onClick={() => onChange(!value)}
        className="w-11 h-6 rounded-full transition-all relative"
        style={{ background: value ? '#FF9933' : 'rgba(255,255,255,0.1)' }}>
        <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-sm"
          style={{ left: value ? '22px' : '2px' }} />
      </button>
    </div>
  );
}
