'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/hooks';
import { calculateGroupBalances } from '@/lib/store';
import { CURRENCY_SYMBOLS } from '@/lib/types';
import { GroupAvatar } from '@/components/ui/GroupAvatar';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CreateGroupDialog } from '@/components/modals/CreateGroupDialog';
import { AddExpenseDialog } from '@/components/modals/AddExpenseDialog';
import { Plus, Search, Users, ArrowRight, TrendingUp, CheckCircle } from 'lucide-react';

export default function GroupsPage() {
  const { state } = useStore();
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [activeGroupIdForExpense, setActiveGroupIdForExpense] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBalance, setFilterBalance] = useState<'all' | 'owed' | 'owing' | 'settled'>('all');

  const currencySymbol = CURRENCY_SYMBOLS[state.settings.currency || 'INR'];

  // Filter groups
  const filteredGroups = state.groups.filter(group => {
    const matchesSearch =
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const balances = calculateGroupBalances(group.id);
    const myBalance = balances.find(b => b.userId === state.settings.currentUserId)?.amount || 0;

    if (filterBalance === 'owed') return myBalance > 0.01;
    if (filterBalance === 'owing') return myBalance < -0.01;
    if (filterBalance === 'settled') return Math.abs(myBalance) <= 0.01;
    return true;
  });

  const handleQuickAddExpense = (groupId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveGroupIdForExpense(groupId);
    setAddExpenseOpen(true);
  };

  return (
    <AppShell>
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">Groups</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Organize your shared trips, shared flats, and dinner circles.
            </p>
          </div>

          <Button
            onClick={() => setCreateGroupOpen(true)}
            className="rounded-xl bg-coral hover:bg-coral/90 text-white font-semibold text-xs sm:text-sm h-10 px-4 self-start sm:self-auto shadow-sm"
          >
            <Plus size={16} className="mr-1.5 stroke-[2.5]" />
            Create Group
          </Button>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-white border-border"
            />
          </div>

          <div className="flex gap-1.5 p-1 bg-muted/60 rounded-xl self-start sm:self-auto">
            {(['all', 'owed', 'owing', 'settled'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilterBalance(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filterBalance === tab ? 'bg-white text-ink shadow-sm' : 'text-muted-foreground hover:text-ink'
                }`}
              >
                {tab === 'all' ? 'All Groups' : tab === 'owed' ? 'You are owed' : tab === 'owing' ? 'You owe' : 'Settled'}
              </button>
            ))}
          </div>
        </div>

        {/* Groups Grid */}
        {filteredGroups.length === 0 ? (
          <Card className="p-12 text-center rounded-3xl bg-white border border-border/70 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-coral/10 text-coral flex items-center justify-center mx-auto text-xl">
              🏖️
            </div>
            <h3 className="font-bold text-ink text-base">No groups found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? 'Try tweaking your search term or clear the filter.'
                : 'Create your first group to start splitting bills with friends.'}
            </p>
            <Button
              onClick={() => setCreateGroupOpen(true)}
              size="sm"
              className="mt-2 rounded-xl bg-coral text-white"
            >
              Create Group
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGroups.map(group => {
              const balances = calculateGroupBalances(group.id);
              const myBalance = balances.find(b => b.userId === state.settings.currentUserId)?.amount || 0;
              const groupExpenses = state.expenses.filter(e => e.groupId === group.id);
              const totalSpent = groupExpenses.reduce((sum, e) => sum + e.amount, 0);

              const memberUsers = group.members
                .map(m => state.users.find(u => u.id === m.userId))
                .filter(Boolean);

              return (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="group block rounded-3xl bg-white border border-border/70 hover:border-coral/40 hover:shadow-md transition-all overflow-hidden p-6 flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <GroupAvatar group={group} size="lg" />
                        <div>
                          <h3 className="font-bold text-lg text-ink group-hover:text-coral transition-colors">
                            {group.name}
                          </h3>
                          {group.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {group.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Member Avatars */}
                    <div className="mt-5 flex items-center justify-between">
                      <div className="flex -space-x-2 overflow-hidden">
                        {memberUsers.slice(0, 4).map(user => (
                          user && (
                            <UserAvatar
                              key={user.id}
                              user={user}
                              size="sm"
                              className="ring-2 ring-white"
                            />
                          )
                        ))}
                        {memberUsers.length > 4 && (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-ink ring-2 ring-white">
                            +{memberUsers.length - 4}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {group.members.length} members · {groupExpenses.length} expenses
                      </span>
                    </div>

                    {/* Total Spending Stat */}
                    <div className="mt-4 p-3 rounded-2xl bg-muted/20 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Total Group Spend</span>
                      <span className="font-bold text-ink tabular-nums">
                        {currencySymbol}{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Footer with Balance and Quick Add */}
                  <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                        Your balance
                      </span>
                      <span
                        className={`text-sm font-extrabold tabular-nums ${
                          myBalance > 0
                            ? 'text-leaf'
                            : myBalance < 0
                            ? 'text-coral'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {myBalance > 0
                          ? `+${currencySymbol}${myBalance.toLocaleString('en-IN')}`
                          : myBalance < 0
                          ? `−${currencySymbol}${Math.abs(myBalance).toLocaleString('en-IN')}`
                          : 'Settled up'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={e => handleQuickAddExpense(group.id, e)}
                        className="h-8 text-xs font-semibold text-coral hover:bg-coral/10 hover:text-coral rounded-xl px-2.5"
                      >
                        <Plus size={14} className="mr-1" />
                        Expense
                      </Button>
                      <div className="w-7 h-7 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground group-hover:bg-coral group-hover:text-white transition-colors">
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <CreateGroupDialog open={createGroupOpen} onOpenChange={setCreateGroupOpen} />
      <AddExpenseDialog
        open={addExpenseOpen}
        onOpenChange={setAddExpenseOpen}
        defaultGroupId={activeGroupIdForExpense}
      />
    </AppShell>
  );
}
