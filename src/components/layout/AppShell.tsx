'use client';

import React from 'react';
import Link from 'next/link';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useStore } from '@/lib/hooks';
import { UserAvatar } from '@/components/ui/UserAvatar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state } = useStore();
  const currentUser = state.users.find(u => u.id === state.settings.currentUserId);

  return (
    <div className="min-h-screen bg-cream selection:bg-coral-light selection:text-ink">
      <Sidebar />

      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 inset-x-0 h-14 bg-white/90 backdrop-blur-md border-b border-border z-20 px-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-coral rounded-xl flex items-center justify-center text-white text-base shadow-sm">
            💸
          </div>
          <span className="font-extrabold text-ink text-base tracking-tight">Spendwise</span>
        </Link>

        {currentUser && (
          <Link href="/settings" className="flex items-center gap-2">
            <UserAvatar user={currentUser} size="xs" />
          </Link>
        )}
      </header>

      <BottomNav />

      <main className="lg:pl-60 pb-24 lg:pb-12 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
