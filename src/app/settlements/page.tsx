'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/hooks';
import { calculateSimplifiedDebts, calculateGroupBalances } from '@/lib/store';
import { CURRENCY_SYMBOLS } from '@/lib/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { GroupAvatar } from '@/components/ui/GroupAvatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SettleUpDialog } from '@/components/modals/SettleUpDialog';
import {
  CheckCircle2,
  ArrowRight,
  Plus,
  ArrowLeftRight,
  TrendingDown,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

export default function SettlementsPage() {
  const { state } = useStore();
  const [settleUpOpen, setSettleUpOpen] = useState(false);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');

  // Pre-fill state
  const [settleProps, setSettleProps] = useState<{
    groupId?: string;
    fromUserId?: string;
    toUserId?: string;
    amount?: number;
  }>({});

  const currencySymbol = CURRENCY_SYMBOLS[state.settings.currency || 'INR'];

  // All debts simplified
  const allDebts = calculateSimplifiedDebts(
    selectedGroupFilter === 'all' ? undefined : selectedGroupFilter
  );

  // Settlement history
  const settlements = state.settlements
    .filter(s => selectedGroupFilter === 'all' || s.groupId === selectedGroupFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSettleDebt = (fromId: string, toId: string, amount: number, gId?: string) => {
    setSettleProps({
      groupId: gId || state.groups[0]?.id,
      fromUserId: fromId,
      toUserId: toId,
      amount,
    });
    setSettleUpOpen(true);
  };

  const totalSettledVolume = settlements.reduce((sum, s) => sum + s.amount, 0);

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">Settlements</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Pay back friends and keep group ledgers balanced.
            </p>
          </div>

          <Button
            onClick={() => {
              setSettleProps({});
              setSettleUpOpen(true);
            }}
            className="rounded-xl bg-leaf hover:bg-leaf/90 text-white font-semibold text-xs sm:text-sm h-10 px-4 self-start sm:self-auto shadow-sm"
          >
            <CheckCircle2 size={16} className="mr-1.5" />
            Record Payment
          </Button>
        </div>

        {/* Filter by Group */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Filter:</span>
            <Select value={selectedGroupFilter} onValueChange={setSelectedGroupFilter}>
              <SelectTrigger className="w-56 h-9 text-xs rounded-xl bg-white border-border">
                <SelectValue placeholder="All Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups (Global Debts)</SelectItem>
                {state.groups.map(g => (
                  <SelectItem key={g.id} value={g.id}>
                    <span className="mr-2">{g.emoji}</span> {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <span className="text-xs text-muted-foreground">
            {allDebts.length} pending transfer{allDebts.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Simplified "Who Owes Whom" Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink tracking-tight">Who Owes Whom</h2>
              <p className="text-xs text-muted-foreground">
                Optimized minimum transactions to settle all debts
              </p>
            </div>
          </div>

          {allDebts.length === 0 ? (
            <Card className="p-10 text-center rounded-3xl bg-white border border-border/70 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-leaf-light text-leaf flex items-center justify-center mx-auto text-xl">
                ✨
              </div>
              <h3 className="font-bold text-ink text-base">No debts to settle!</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Everyone is completely square in this view.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allDebts.map((debt, idx) => {
                const fromUser = state.users.find(u => u.id === debt.fromUserId);
                const toUser = state.users.find(u => u.id === debt.toUserId);
                const isIOwe = debt.fromUserId === state.settings.currentUserId;
                const isOwedToMe = debt.toUserId === state.settings.currentUserId;
                const group = debt.groupId ? state.groups.find(g => g.id === debt.groupId) : null;

                return (
                  <Card
                    key={idx}
                    className={`p-5 rounded-3xl border shadow-sm flex flex-col justify-between ${
                      isIOwe
                        ? 'bg-[#FCE6E0]/40 border-coral/30'
                        : isOwedToMe
                        ? 'bg-[#E1F1E4]/40 border-leaf/30'
                        : 'bg-white border-border/70'
                    }`}
                  >
                    <div>
                      {group && (
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                          {group.emoji} {group.name}
                        </span>
                      )}

                      <div className="flex items-center justify-between gap-3">
                        {/* Debtor (fromUser) */}
                        <div className="flex items-center gap-2.5">
                          {fromUser && <UserAvatar user={fromUser} size="md" />}
                          <div>
                            <p className="text-sm font-bold text-ink">
                              {fromUser?.name} {isIOwe ? '(You)' : ''}
                            </p>
                            <span className="text-[10px] uppercase font-semibold text-coral block">
                              Pays
                            </span>
                          </div>
                        </div>

                        {/* Arrow with Amount */}
                        <div className="flex flex-col items-center px-2">
                          <span className="font-extrabold text-base sm:text-lg text-ink tabular-nums">
                            {currencySymbol}
                            {debt.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          <ArrowRight size={18} className="text-muted-foreground mt-0.5" />
                        </div>

                        {/* Creditor (toUser) */}
                        <div className="flex items-center gap-2.5 text-right">
                          <div>
                            <p className="text-sm font-bold text-ink">
                              {toUser?.name} {isOwedToMe ? '(You)' : ''}
                            </p>
                            <span className="text-[10px] uppercase font-semibold text-leaf block">
                              Receives
                            </span>
                          </div>
                          {toUser && <UserAvatar user={toUser} size="md" />}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {isIOwe ? 'You can pay directly' : isOwedToMe ? 'Pending receipt' : 'Peer settlement'}
                      </span>

                      <Button
                        size="sm"
                        onClick={() => handleSettleDebt(debt.fromUserId, debt.toUserId, debt.amount, debt.groupId)}
                        className="rounded-xl bg-leaf hover:bg-leaf/90 text-white font-semibold text-xs h-8 px-3"
                      >
                        <CheckCircle2 size={13} className="mr-1" />
                        Record Settle
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Settlement History */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink tracking-tight">Settlement History</h2>
              <p className="text-xs text-muted-foreground">
                Total settled payments: {currencySymbol}{totalSettledVolume.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {settlements.length === 0 ? (
            <Card className="p-8 text-center rounded-3xl bg-white border border-border/70 space-y-2">
              <p className="text-xs text-muted-foreground">No payments recorded yet.</p>
            </Card>
          ) : (
            <div className="bg-white rounded-3xl border border-border/70 divide-y divide-border/50 shadow-sm overflow-hidden">
              {settlements.map(s => {
                const fromUser = state.users.find(u => u.id === s.fromUserId);
                const toUser = state.users.find(u => u.id === s.toUserId);
                const group = state.groups.find(g => g.id === s.groupId);

                return (
                  <div key={s.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-leaf-light text-leaf flex items-center justify-center font-extrabold flex-shrink-0">
                        ✓
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-ink">
                          <strong className="text-ink">{fromUser?.name}</strong> paid{' '}
                          <strong className="text-ink">{toUser?.name}</strong>
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          {group && (
                            <span className="flex items-center gap-1 font-medium text-ink">
                              {group.emoji} {group.name}
                            </span>
                          )}
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(s.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                          </span>
                          {s.notes && <span>· {s.notes}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-base text-leaf tabular-nums block">
                        +{currencySymbol}{s.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Settled
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <SettleUpDialog
        open={settleUpOpen}
        onOpenChange={setSettleUpOpen}
        defaultGroupId={settleProps.groupId}
        defaultFromUserId={settleProps.fromUserId}
        defaultToUserId={settleProps.toUserId}
        defaultAmount={settleProps.amount}
      />
    </AppShell>
  );
}
