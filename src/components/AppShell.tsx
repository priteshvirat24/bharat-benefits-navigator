'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, GraduationCap, AlertCircle,
  Map, Calendar, MessageSquare, User, ChevronRight,
  Shield, Sparkles, Menu, X, Database, XCircle
} from 'lucide-react';
import { DEFAULT_PROFILE } from '@/lib/api';

const navItems = [
  { href: '/', label: 'Intelligence', icon: LayoutDashboard },
  { href: '/rejections', label: 'Rejection Analysis', icon: XCircle },
  { href: '/schemes', label: 'Eligible Schemes', icon: FileText },
  { href: '/scholarships', label: 'Scholarships', icon: GraduationCap },
  { href: '/documents', label: 'Document Impact', icon: AlertCircle },
  { href: '/roadmap', label: 'Application Roadmap', icon: Map },
  { href: '/calendar', label: 'Deadlines', icon: Calendar },
  { href: '/chat', label: 'AI Agent', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen animated-bg overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative z-30 h-full flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          width: '260px',
          background: 'rgba(4, 13, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255, 153, 51, 0.12)',
        }}
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-700 glow-saffron">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm text-saffron-gradient leading-tight">Bharat Benefits</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Navigator</div>
            </div>
          </div>
        </div>

        {/* Coral badge */}
        <div className="mx-4 mt-4 mb-2 px-3 py-2 rounded-lg flex items-center gap-2"
          style={{ background: 'rgba(255, 153, 51, 0.08)', border: '1px solid rgba(255,153,51,0.2)' }}>
          <Database className="w-3.5 h-3.5 text-saffron" />
          <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            Powered by <span className="text-saffron font-semibold">Coral SQL</span> · 7 sources
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-nav-item ${active ? 'active' : ''}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
                {active && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Profile card at bottom */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: 'rgba(255, 153, 51, 0.08)' }}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
              {DEFAULT_PROFILE.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {DEFAULT_PROFILE.name}
              </div>
              <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {DEFAULT_PROFILE.category} • {DEFAULT_PROFILE.state}
              </div>
            </div>
            <div className="text-xs font-bold text-green-400">{DEFAULT_PROFILE.completionScore}%</div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-white/5"
          style={{ background: 'rgba(4, 13, 26, 0.8)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {navItems.find(n => n.href === pathname)?.label || 'Dashboard'}
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Real-time government benefit matching
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'rgba(16, 208, 96, 0.1)', border: '1px solid rgba(16, 208, 96, 0.2)', color: '#10d060' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-saffron" />
              Coral Live
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'rgba(255, 153, 51, 0.1)', border: '1px solid rgba(255,153,51,0.2)', color: '#FF9933' }}>
              <Sparkles className="w-3 h-3" />
              AI Active
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
