'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/lib/hooks';
import { addSettlement, calculateSimplifiedDebts } from '@/lib/store';
import { CURRENCY_SYMBOLS } from '@/lib/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface SettleUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultGroupId?: string;
  defaultFromUserId?: string;
  defaultToUserId?: string;
  defaultAmount?: number;
}

export function SettleUpDialog({
  open,
  onOpenChange,
  defaultGroupId,
  defaultFromUserId,
  defaultToUserId,
  defaultAmount,
}: SettleUpDialogProps) {
  const { state } = useStore();
  const { toast } = useToast();

  const [groupId, setGroupId] = useState<string>('');
  const [fromUserId, setFromUserId] = useState<string>('');
  const [toUserId, setToUserId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('Paid via UPI');

  useEffect(() => {
    if (!open) return;

    const gId = defaultGroupId || state.groups[0]?.id || '';
    setGroupId(gId);

    // If pre-filled:
    if (defaultFromUserId && defaultToUserId) {
      setFromUserId(defaultFromUserId);
      setToUserId(defaultToUserId);
      if (defaultAmount) setAmount(defaultAmount.toString());
    } else {
      // Find a debt involving current user to make it convenient
      const debts = calculateSimplifiedDebts(gId);
      const myDebt = debts.find(
        d => d.fromUserId === state.settings.currentUserId || d.toUserId === state.settings.currentUserId
      );

      if (myDebt) {
        setFromUserId(myDebt.fromUserId);
        setToUserId(myDebt.toUserId);
        setAmount(myDebt.amount.toString());
      } else {
        const group = state.groups.find(g => g.id === gId) || state.groups[0];
        const memberIds = group?.members.map(m => m.userId) || [];
        setFromUserId(memberIds[0] || state.settings.currentUserId);
        setToUserId(memberIds[1] || memberIds[0] || state.settings.currentUserId);
        setAmount('');
      }
    }
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('Paid via UPI');
  }, [open, defaultGroupId, defaultFromUserId, defaultToUserId, defaultAmount, state.groups, state.settings.currentUserId]);

  const activeGroup = state.groups.find(g => g.id === groupId) || state.groups[0];
  const groupMembers = (activeGroup?.members || []).map(m =>
    state.users.find(u => u.id === m.userId)
  ).filter(Boolean);

  const fromUser = state.users.find(u => u.id === fromUserId);
  const toUser = state.users.find(u => u.id === toUserId);
  const currencySymbol = CURRENCY_SYMBOLS[activeGroup?.currency || 'INR'];
  const numAmount = parseFloat(amount) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromUserId || !toUserId) {
      toast({ title: 'Select users', description: 'Please select both payer and receiver.', variant: 'destructive' });
      return;
    }
    if (fromUserId === toUserId) {
      toast({ title: 'Invalid users', description: 'Payer and receiver cannot be the same person.', variant: 'destructive' });
      return;
    }
    if (numAmount <= 0) {
      toast({ title: 'Invalid amount', description: 'Please enter a valid settlement amount.', variant: 'destructive' });
      return;
    }

    addSettlement({
      groupId,
      fromUserId,
      toUserId,
      amount: numAmount,
      currency: activeGroup?.currency || 'INR',
      date,
      notes: notes.trim() || undefined,
    });

    toast({
      title: 'Payment recorded! 🎉',
      description: `${fromUser?.name} paid ${currencySymbol}${numAmount.toLocaleString('en-IN')} to ${toUser?.name}.`,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <DialogHeader>
          <div className="w-10 h-10 rounded-2xl bg-leaf-light text-leaf flex items-center justify-center mb-1">
            <CheckCircle2 size={24} />
          </div>
          <DialogTitle className="text-xl font-bold text-ink">Record a Settlement</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Log an offline or direct payment to clear outstanding balances.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Group */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Group
            </Label>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger className="h-10 rounded-xl bg-muted/40">
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                {state.groups.map(group => (
                  <SelectItem key={group.id} value={group.id}>
                    <span className="mr-2">{group.emoji}</span> {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Who paid Whom Visual */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">Payer</span>
                <Select value={fromUserId} onValueChange={setFromUserId}>
                  <SelectTrigger className="h-10 rounded-xl bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {groupMembers.map(user => (
                      user && (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <UserAvatar user={user} size="xs" />
                            <span className="text-sm truncate">{user.name}</span>
                          </div>
                        </SelectItem>
                      )
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-5 text-muted-foreground">
                <ArrowRight size={18} />
              </div>

              <div className="flex-1 space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">Receiver</span>
                <Select value={toUserId} onValueChange={setToUserId}>
                  <SelectTrigger className="h-10 rounded-xl bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {groupMembers.map(user => (
                      user && (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <UserAvatar user={user} size="xs" />
                            <span className="text-sm truncate">{user.name}</span>
                          </div>
                        </SelectItem>
                      )
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Amount
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                {currencySymbol}
              </span>
              <Input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="h-11 pl-8 text-lg font-bold text-ink rounded-xl bg-muted/40"
                required
              />
            </div>
          </div>

          {/* Date and Payment Note */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Date
              </Label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="h-10 rounded-xl bg-muted/40"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Payment Method / Note
              </Label>
              <Input
                placeholder="e.g. UPI, Cash, GPay"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="h-10 rounded-xl bg-muted/40"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={numAmount <= 0 || fromUserId === toUserId}
              className="rounded-xl bg-leaf hover:bg-leaf/90 text-white font-semibold"
            >
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
