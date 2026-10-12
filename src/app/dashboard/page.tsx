'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/hooks';
import { calculateUserTotals, calculateSimplifiedDebts, calculateGroupBalances } from '@/lib/store';
import { CURRENCY_SYMBOLS, CATEGORY_META } from '@/lib/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { GroupAvatar } from '@/components/ui/GroupAvatar';
import { AmountDisplay } from '@/components/ui/AmountDisplay';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AddExpenseDialog } from '@/components/modals/AddExpenseDialog';
import { SettleUpDialog } from '@/components/modals/SettleUpDialog';
import { CreateGroupDialog } from '@/components/modals/CreateGroupDialog';
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  Receipt,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export default function DashboardPage() {
  const { state } = useStore();
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [settleUpOpen, setSettleUpOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  // Settlement prefill
  const [settleProps, setSettleProps] = useState<{
    groupId?: string;
    fromUserId?: string;
    toUserId?: string;
    amount?: number;
  }>({});

  const currentUser = state.users.find(u => u.id === state.settings.currentUserId);
  const { totalOwed, totalOwing } = calculateUserTotals();
  const netBalance = totalOwed - totalOwing;
  const currencySymbol = CURRENCY_SYMBOLS[state.settings.currency || 'INR'];

  // Simplified debts for current user
  const allDebts = calculateSimplifiedDebts();
  const peopleOwingMe = allDebts.filter(d => d.toUserId === state.settings.currentUserId);
  const peopleIOwe = allDebts.filter(d => d.fromUserId === state.settings.currentUserId);

  // Recent 5 expenses
  const recentExpenses = [...state.expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Recent activities
  const recentActivities = [...state.activities].slice(0, 6);

  const handleSettleTarget = (fromId: string, toId: string, amount: number, gId?: string) => {
    setSettleProps({
      groupId: gId || state.groups[0]?.id,
      fromUserId: fromId,
      toUserId: toId,
      amount,
    });
    setSettleUpOpen(true);
  };

  return (
    <AppShell>
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Top Header & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">👋</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                Hey, {currentUser?.name?.split(' ')[0] || 'there'}!
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Money is better shared. Here is where your balances stand today.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => setSettleUpOpen(true)}
              variant="outline"
              className="rounded-xl border-border bg-white text-ink hover:bg-muted font-medium text-xs sm:text-sm h-10 px-4"
            >
              <CheckCircle2 size={16} className="mr-1.5 text-leaf" />
              Settle up
            </Button>
            <Button
              onClick={() => setAddExpenseOpen(true)}
              className="rounded-xl bg-coral hover:bg-coral/90 text-white font-semibold text-xs sm:text-sm h-10 px-4 shadow-sm"
            >
              <Plus size={16} className="mr-1.5 stroke-[2.5]" />
              Add expense
            </Button>
          </div>
        </div>

        {/* Balance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Net Balance Card */}
          <Card className="p-6 rounded-3xl bg-white border border-border/70 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Net Balance
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span
                  className={`text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight ${
                    netBalance > 0 ? 'text-leaf' : netBalance < 0 ? 'text-coral' : 'text-ink'
                  }`}
                >
                  {netBalance > 0 ? '+' : netBalance < 0 ? '−' : ''}
                  {currencySymbol}
                  {Math.abs(netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
              <span>Overall status</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded-full ${
                  netBalance > 0
                    ? 'bg-leaf/10 text-leaf'
                    : netBalance < 0
                    ? 'bg-coral/10 text-coral'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {netBalance > 0 ? 'You are owed in total' : netBalance < 0 ? 'You owe in total' : 'All settled up'}
              </span>
            </div>
          </Card>

          {/* You are owed card */}
          <Card className="p-6 rounded-3xl bg-[#E1F1E4]/50 border border-leaf/20 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-leaf">
                  Owed to you
                </span>
                <div className="w-8 h-8 rounded-full bg-leaf/20 text-leaf flex items-center justify-center">
                  <ArrowDownLeft size={16} />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-leaf tabular-nums">
                  {currencySymbol}
                  {totalOwed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {peopleOwingMe.length > 0
                ? `${peopleOwingMe.length} friend${peopleOwingMe.length > 1 ? 's' : ''} owe you money`
                : 'Nobody owes you right now'}
            </p>
          </Card>

          {/* You owe card */}
          <Card className="p-6 rounded-3xl bg-[#FCE6E0]/60 border border-coral/20 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-coral">
                  You owe
                </span>
                <div className="w-8 h-8 rounded-full bg-coral/20 text-coral flex items-center justify-center">
                  <ArrowUpRight size={16} />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-coral tabular-nums">
                  {currencySymbol}
                  {totalOwing.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {peopleIOwe.length > 0
                ? `You owe ${peopleIOwe.length} friend${peopleIOwe.length > 1 ? 's' : ''}`
                : 'You do not owe anyone!'}
            </p>
          </Card>
        </div>

        {/* Your Groups Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink tracking-tight">Your Groups</h2>
              <p className="text-xs text-muted-foreground">Active expense pools and balances</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCreateGroupOpen(true)}
                className="text-xs text-coral hover:text-coral hover:bg-coral/10 rounded-xl"
              >
                <Plus size={14} className="mr-1" />
                New Group
              </Button>
              <Link
                href="/groups"
                className="text-xs font-medium text-coral hover:underline flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.groups.map(group => {
              const groupBalances = calculateGroupBalances(group.id);
              const myBal = groupBalances.find(b => b.userId === state.settings.currentUserId);
              const myAmt = myBal?.amount || 0;
              const groupExpenses = state.expenses.filter(e => e.groupId === group.id);
              const totalSpent = groupExpenses.reduce((sum, e) => sum + e.amount, 0);

              return (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="group block p-5 rounded-3xl bg-white border border-border/70 hover:border-coral/40 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <GroupAvatar group={group} size="lg" />
                      <div>
                        <h3 className="font-bold text-ink text-base group-hover:text-coral transition-colors">
                          {group.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {group.members.length} members · {groupExpenses.length} expenses
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Your balance:</span>
                    <span
                      className={`font-bold tabular-nums ${
                        myAmt > 0 ? 'text-leaf' : myAmt < 0 ? 'text-coral' : 'text-muted-foreground'
                      }`}
                    >
                      {myAmt > 0
                        ? `+${currencySymbol}${myAmt.toLocaleString('en-IN')}`
                        : myAmt < 0
                        ? `−${currencySymbol}${Math.abs(myAmt).toLocaleString('en-IN')}`
                        : 'Settled'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Outstanding Balances Grid & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Outstanding Balances (Who owes whom) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-ink tracking-tight">Outstanding Balances</h2>
                <p className="text-xs text-muted-foreground">Direct debts simplified across all groups</p>
              </div>
              <Link
                href="/settlements"
                className="text-xs font-medium text-coral hover:underline flex items-center gap-1"
              >
                All settlements <ArrowRight size={12} />
              </Link>
            </div>

            <Card className="p-4 rounded-3xl bg-white border border-border/70 shadow-sm space-y-3">
              {allDebts.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground space-y-2">
                  <CheckCircle2 size={32} className="mx-auto text-leaf" />
                  <p className="text-sm font-medium text-ink">All clear!</p>
                  <p className="text-xs">No pending debts to settle across your groups.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {allDebts.slice(0, 5).map((debt, idx) => {
                    const fromUser = state.users.find(u => u.id === debt.fromUserId);
                    const toUser = state.users.find(u => u.id === debt.toUserId);
                    const isIOwe = debt.fromUserId === state.settings.currentUserId;
                    const isOwedToMe = debt.toUserId === state.settings.currentUserId;

                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          isIOwe
                            ? 'bg-[#FCE6E0]/40 border-coral/30'
                            : isOwedToMe
                            ? 'bg-[#E1F1E4]/40 border-leaf/30'
                            : 'bg-muted/20 border-border/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {fromUser && <UserAvatar user={fromUser} size="xs" />}
                            {toUser && <UserAvatar user={toUser} size="xs" />}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-ink">
                              {isIOwe ? (
                                <span>
                                  You owe <strong className="text-coral">{toUser?.name}</strong>
                                </span>
                              ) : isOwedToMe ? (
                                <span>
                                  <strong>{fromUser?.name}</strong> owes you
                                </span>
                              ) : (
                                <span>
                                  {fromUser?.name} owes {toUser?.name}
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Direct transfer</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`font-bold text-sm tabular-nums ${
                              isIOwe ? 'text-coral' : isOwedToMe ? 'text-leaf' : 'text-ink'
                            }`}
                          >
                            {currencySymbol}
                            {debt.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>

                          {(isIOwe || isOwedToMe) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleSettleTarget(debt.fromUserId, debt.toUserId, debt.amount, debt.groupId)
                              }
                              className="h-7 text-xs px-2.5 rounded-lg border-border hover:bg-white font-medium"
                            >
                              Settle
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Recent Activity Timeline */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-ink tracking-tight">Recent Activity</h2>
                <p className="text-xs text-muted-foreground">Latest transactions and changes</p>
              </div>
              <Link
                href="/activity"
                className="text-xs font-medium text-coral hover:underline flex items-center gap-1"
              >
                Full activity <ArrowRight size={12} />
              </Link>
            </div>

            <Card className="p-4 rounded-3xl bg-white border border-border/70 shadow-sm space-y-2.5">
              {recentActivities.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-xs">
                  No activity logged yet.
                </div>
              ) : (
                recentActivities.map(act => {
                  const user = state.users.find(u => u.id === act.userId);
                  const isMe = act.userId === state.settings.currentUserId;
                  const group = state.groups.find(g => g.id === act.groupId);

                  let description = '';
                  let amountStr = '';

                  if (act.type === 'expense_added') {
                    const title = (act.metadata?.title as string) || 'Expense';
                    const amt = (act.metadata?.amount as number) || 0;
                    description = `added "${title}"`;
                    amountStr = `${currencySymbol}${amt.toLocaleString('en-IN')}`;
                  } else if (act.type === 'settlement') {
                    const toUser = state.users.find(u => u.id === (act.metadata?.toUserId as string));
                    const amt = (act.metadata?.amount as number) || 0;
                    description = `settled with ${toUser?.name || 'someone'}`;
                    amountStr = `${currencySymbol}${amt.toLocaleString('en-IN')}`;
                  } else if (act.type === 'group_created') {
                    description = `created group "${act.metadata?.name || ''}"`;
                  } else {
                    description = act.type.replace('_', ' ');
                  }

                  return (
                    <div
                      key={act.id}
                      className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-muted/30 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        {user && <UserAvatar user={user} size="xs" />}
                        <div>
                          <p className="font-medium text-ink">
                            <span className="font-semibold">{isMe ? 'You' : user?.name}</span> {description}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                            {group && <span>{group.emoji} {group.name}</span>}
                            <span>·</span>
                            <span>{new Date(act.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>

                      {amountStr && (
                        <span className="font-bold text-xs tabular-nums text-ink">
                          {amountStr}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </Card>
          </div>
        </div>

        {/* Recent Expenses List with Category Badges */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink tracking-tight">Recent Expenses</h2>
              <p className="text-xs text-muted-foreground">Latest bills and shared purchases</p>
            </div>
            <Link
              href="/expenses"
              className="text-xs font-medium text-coral hover:underline flex items-center gap-1"
            >
              All expenses <ArrowRight size={12} />
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-border/70 overflow-hidden divide-y divide-border/50 shadow-sm">
            {recentExpenses.map(expense => {
              const group = state.groups.find(g => g.id === expense.groupId);
              const payer = state.users.find(u => u.id === expense.paidBy);
              const isPayer = expense.paidBy === state.settings.currentUserId;
              const mySplit = expense.splits.find(s => s.userId === state.settings.currentUserId);

              return (
                <div
                  key={expense.id}
                  className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CategoryBadge category={expense.category} showLabel={false} className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg p-0" />
                    <div>
                      <h4 className="font-bold text-sm text-ink">{expense.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {group?.emoji} {group?.name} · Paid by {isPayer ? 'you' : payer?.name}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="block font-bold text-sm text-ink tabular-nums">
                      {currencySymbol}
                      {expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {isPayer
                        ? `you lent ${currencySymbol}${(expense.amount - (mySplit?.amount || 0)).toLocaleString('en-IN')}`
                        : mySplit
                        ? `you borrowed ${currencySymbol}${mySplit.amount.toLocaleString('en-IN')}`
                        : 'not involved'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Global Modals */}
      <AddExpenseDialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen} />
      <SettleUpDialog
        open={settleUpOpen}
        onOpenChange={setSettleUpOpen}
        defaultGroupId={settleProps.groupId}
        defaultFromUserId={settleProps.fromUserId}
        defaultToUserId={settleProps.toUserId}
        defaultAmount={settleProps.amount}
      />
      <CreateGroupDialog open={createGroupOpen} onOpenChange={setCreateGroupOpen} />
    </AppShell>
  );
}
