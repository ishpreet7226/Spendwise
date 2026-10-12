'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/hooks';
import { CURRENCY_SYMBOLS, ActivityType } from '@/lib/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { GroupAvatar } from '@/components/ui/GroupAvatar';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Receipt,
  CheckCircle2,
  Users,
  Edit2,
  Trash2,
  Sparkles,
  Calendar,
  Clock,
} from 'lucide-react';

export default function ActivityPage() {
  const { state } = useStore();
  const [filterType, setFilterType] = useState<string>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');

  const currencySymbol = CURRENCY_SYMBOLS[state.settings.currency || 'INR'];

  const filteredActivities = state.activities.filter(act => {
    const matchesGroup = filterGroup === 'all' || act.groupId === filterGroup;
    const matchesType =
      filterType === 'all' ||
      (filterType === 'expense' && act.type.startsWith('expense_')) ||
      (filterType === 'settlement' && act.type === 'settlement') ||
      (filterType === 'group' && (act.type === 'group_created' || act.type === 'member_joined'));

    return matchesGroup && matchesType;
  });

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'expense_added':
        return <div className="w-9 h-9 rounded-2xl bg-coral/10 text-coral flex items-center justify-center"><Receipt size={17} /></div>;
      case 'expense_edited':
        return <div className="w-9 h-9 rounded-2xl bg-sky/15 text-sky flex items-center justify-center"><Edit2 size={16} /></div>;
      case 'expense_deleted':
        return <div className="w-9 h-9 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center"><Trash2 size={16} /></div>;
      case 'settlement':
        return <div className="w-9 h-9 rounded-2xl bg-leaf-light text-leaf flex items-center justify-center"><CheckCircle2 size={17} /></div>;
      case 'group_created':
      case 'member_joined':
        return <div className="w-9 h-9 rounded-2xl bg-sunshine/20 text-ink flex items-center justify-center"><Users size={17} /></div>;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">Activity Feed</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Live audit trail of all bills, payments, and member updates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {/* Filter by Type */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-36 h-9 text-xs rounded-xl bg-white border-border">
                <SelectValue placeholder="All Activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="expense">Expenses</SelectItem>
                <SelectItem value="settlement">Settlements</SelectItem>
                <SelectItem value="group">Groups</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter by Group */}
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger className="w-44 h-9 text-xs rounded-xl bg-white border-border">
                <SelectValue placeholder="All Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {state.groups.map(g => (
                  <SelectItem key={g.id} value={g.id}>
                    <span className="mr-2">{g.emoji}</span> {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Timeline list */}
        {filteredActivities.length === 0 ? (
          <Card className="p-12 text-center rounded-3xl bg-white border border-border/70 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto text-xl">
              🕒
            </div>
            <h3 className="font-bold text-ink text-base">No activity matches</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Change the filters or perform an action to populate this feed.
            </p>
          </Card>
        ) : (
          <div className="bg-white rounded-3xl border border-border/70 divide-y divide-border/50 shadow-sm overflow-hidden">
            {filteredActivities.map(act => {
              const user = state.users.find(u => u.id === act.userId);
              const group = state.groups.find(g => g.id === act.groupId);
              const isMe = act.userId === state.settings.currentUserId;

              let text = '';
              let badge = '';

              if (act.type === 'expense_added') {
                const title = (act.metadata?.title as string) || 'an expense';
                const amt = (act.metadata?.amount as number) || 0;
                text = `added "${title}" for ${currencySymbol}${amt.toLocaleString('en-IN')}`;
                badge = 'New Expense';
              } else if (act.type === 'expense_edited') {
                const title = (act.metadata?.title as string) || 'an expense';
                text = `updated details for "${title}"`;
                badge = 'Edited';
              } else if (act.type === 'expense_deleted') {
                const title = (act.metadata?.title as string) || 'an expense';
                text = `deleted "${title}"`;
                badge = 'Removed';
              } else if (act.type === 'settlement') {
                const toUser = state.users.find(u => u.id === (act.metadata?.toUserId as string));
                const amt = (act.metadata?.amount as number) || 0;
                text = `settled ${currencySymbol}${amt.toLocaleString('en-IN')} with ${toUser?.name || 'someone'}`;
                badge = 'Payment';
              } else if (act.type === 'group_created') {
                const name = (act.metadata?.name as string) || 'a new group';
                text = `created the group "${name}"`;
                badge = 'Group';
              }

              return (
                <div key={act.id} className="p-4 flex items-center justify-between hover:bg-muted/15 transition-colors">
                  <div className="flex items-center gap-3.5">
                    {getActivityIcon(act.type)}

                    <div>
                      <p className="text-sm font-medium text-ink">
                        <strong className="font-bold">{isMe ? 'You' : user?.name}</strong> {text}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        {group && (
                          <span className="flex items-center gap-1 font-medium text-ink">
                            {group.emoji} {group.name}
                          </span>
                        )}
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(act.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground">
                    {badge}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
