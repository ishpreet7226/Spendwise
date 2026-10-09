'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Receipt, ArrowLeftRight, BarChart2, Activity, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/hooks';
import { UserAvatar } from '@/components/ui/UserAvatar';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/groups', label: 'Groups', icon: Users },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/settlements', label: 'Settlements', icon: ArrowLeftRight },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { state } = useStore();
  const currentUser = state.users.find(u => u.id === state.settings.currentUserId);

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-border fixed inset-y-0 left-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="w-8 h-8 bg-coral rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0">
          💸
        </div>
        <span className="font-bold text-ink text-lg tracking-tight">Spendwise</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-coral text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-coral/10 hover:text-coral'
              )}
            >
              <Icon className="flex-shrink-0" size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Current User */}
      {currentUser && (
        <div className="p-3 border-t border-border">
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-all">
            <UserAvatar user={currentUser} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink truncate">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}

