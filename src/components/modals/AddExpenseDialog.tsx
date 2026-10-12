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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStore } from '@/lib/hooks';
import { addExpense, updateExpense } from '@/lib/store';
import {
  Expense,
  ExpenseCategory,
  SplitType,
  ExpenseSplit,
  CATEGORY_META,
  CURRENCY_SYMBOLS,
} from '@/lib/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useToast } from '@/hooks/use-toast';
import { Check, AlertCircle } from 'lucide-react';

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultGroupId?: string;
  expenseToEdit?: Expense | null;
}

export function AddExpenseDialog({
  open,
  onOpenChange,
  defaultGroupId,
  expenseToEdit,
}: AddExpenseDialogProps) {
  const { state } = useStore();
  const { toast } = useToast();

  const [groupId, setGroupId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [paidBy, setPaidBy] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('equal');

  // Selected participant user IDs
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  // Custom exact amounts keyed by userId
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  // Percentages keyed by userId
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  // Shares keyed by userId
  const [shares, setShares] = useState<Record<string, string>>({});

  const activeGroup = state.groups.find(g => g.id === groupId) || state.groups[0];
  const groupMembers = (activeGroup?.members || []).map(m =>
    state.users.find(u => u.id === m.userId)
  ).filter(Boolean);

  // Initialize or reset form when opened or group/expenseToEdit changes
  useEffect(() => {
    if (!open) return;

    if (expenseToEdit) {
      setGroupId(expenseToEdit.groupId);
      setTitle(expenseToEdit.title);
      setAmount(expenseToEdit.amount.toString());
      setCategory(expenseToEdit.category);
      setPaidBy(expenseToEdit.paidBy);
      setDate(expenseToEdit.date);
      setNotes(expenseToEdit.notes || '');
      setSplitType(expenseToEdit.splitType);

      const userIds = expenseToEdit.splits.map(s => s.userId);
      setSelectedUserIds(userIds);

      const cAmounts: Record<string, string> = {};
      const percs: Record<string, string> = {};
      const shs: Record<string, string> = {};

      expenseToEdit.splits.forEach(s => {
        cAmounts[s.userId] = s.amount.toString();
        if (s.percentage !== undefined) percs[s.userId] = s.percentage.toString();
        if (s.shares !== undefined) shs[s.userId] = s.shares.toString();
      });

      setCustomAmounts(cAmounts);
      setPercentages(percs);
      setShares(shs);
    } else {
      const gId = defaultGroupId || state.groups[0]?.id || '';
      setGroupId(gId);
      setTitle('');
      setAmount('');
      setCategory('food');
      setPaidBy(state.settings.currentUserId);
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setSplitType('equal');

      const targetGroup = state.groups.find(g => g.id === gId) || state.groups[0];
      if (targetGroup) {
        const uids = targetGroup.members.map(m => m.userId);
        setSelectedUserIds(uids);
        const cAmounts: Record<string, string> = {};
        const percs: Record<string, string> = {};
        const shs: Record<string, string> = {};
        uids.forEach(uid => {
          cAmounts[uid] = '';
          percs[uid] = (100 / uids.length).toFixed(1);
          shs[uid] = '1';
        });
        setCustomAmounts(cAmounts);
        setPercentages(percs);
        setShares(shs);
      }
    }
  }, [open, expenseToEdit, defaultGroupId, state.groups, state.settings.currentUserId]);

  // When user switches group in the dropdown
  const handleGroupChange = (newGId: string) => {
    setGroupId(newGId);
    const grp = state.groups.find(g => g.id === newGId);
    if (grp) {
      const uids = grp.members.map(m => m.userId);
      setSelectedUserIds(uids);
      if (!uids.includes(paidBy)) {
        setPaidBy(uids[0] || state.settings.currentUserId);
      }
      const cAmounts: Record<string, string> = {};
      const percs: Record<string, string> = {};
      const shs: Record<string, string> = {};
      uids.forEach(uid => {
        cAmounts[uid] = '';
        percs[uid] = (100 / uids.length).toFixed(1);
        shs[uid] = '1';
      });
      setCustomAmounts(cAmounts);
      setPercentages(percs);
      setShares(shs);
    }
  };

  const toggleUserSelection = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      if (selectedUserIds.length <= 1) return; // Must have at least 1 person
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const numAmount = parseFloat(amount) || 0;
  const currencySymbol = CURRENCY_SYMBOLS[activeGroup?.currency || 'INR'];

  // Calculations for validation & previews
  const calculateSplits = (): { splits: ExpenseSplit[]; isValid: boolean; error?: string } => {
    if (numAmount <= 0) return { splits: [], isValid: false, error: 'Amount must be greater than 0' };
    if (selectedUserIds.length === 0) return { splits: [], isValid: false, error: 'Select at least one member' };

    if (splitType === 'equal') {
      const splitAmount = Math.round((numAmount / selectedUserIds.length) * 100) / 100;
      let totalCalculated = splitAmount * selectedUserIds.length;
      const difference = Math.round((numAmount - totalCalculated) * 100) / 100;

      const splits: ExpenseSplit[] = selectedUserIds.map((userId, index) => ({
        userId,
        // Adjust the first member's split by any rounding remainder
        amount: index === 0 ? Math.round((splitAmount + difference) * 100) / 100 : splitAmount,
      }));
      return { splits, isValid: true };
    }

    if (splitType === 'custom') {
      let sum = 0;
      const splits: ExpenseSplit[] = [];
      for (const userId of selectedUserIds) {
        const val = parseFloat(customAmounts[userId] || '0') || 0;
        sum += val;
        splits.push({ userId, amount: val });
      }
      const diff = Math.abs(numAmount - sum);
      if (diff > 0.05) {
        return {
          splits,
          isValid: false,
          error: `Total splits (${currencySymbol}${sum.toFixed(2)}) must equal expense amount (${currencySymbol}${numAmount.toFixed(2)}). Difference: ${currencySymbol}${Math.abs(numAmount - sum).toFixed(2)}`,
        };
      }
      return { splits, isValid: true };
    }

    if (splitType === 'percentage') {
      let sumPct = 0;
      const splits: ExpenseSplit[] = [];
      for (const userId of selectedUserIds) {
        const pct = parseFloat(percentages[userId] || '0') || 0;
        sumPct += pct;
        const splitAmt = Math.round(((numAmount * pct) / 100) * 100) / 100;
        splits.push({ userId, amount: splitAmt, percentage: pct });
      }
      if (Math.abs(sumPct - 100) > 0.5) {
        return {
          splits,
          isValid: false,
          error: `Percentages must total 100%. Currently: ${sumPct.toFixed(1)}%`,
        };
      }
      return { splits, isValid: true };
    }

    if (splitType === 'shares') {
      let totalShares = 0;
      for (const userId of selectedUserIds) {
        const sh = parseFloat(shares[userId] || '1') || 1;
        totalShares += sh;
      }
      if (totalShares <= 0) return { splits: [], isValid: false, error: 'Total shares must be > 0' };

      const splits: ExpenseSplit[] = selectedUserIds.map(userId => {
        const sh = parseFloat(shares[userId] || '1') || 1;
        const splitAmt = Math.round(((numAmount * sh) / totalShares) * 100) / 100;
        return { userId, amount: splitAmt, shares: sh };
      });
      return { splits, isValid: true };
    }

    return { splits: [], isValid: false };
  };

  const { splits, isValid, error } = calculateSplits();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: 'Title required', description: 'Please enter a title for the expense.', variant: 'destructive' });
      return;
    }
    if (numAmount <= 0) {
      toast({ title: 'Invalid amount', description: 'Please enter a positive amount.', variant: 'destructive' });
      return;
    }
    if (!isValid) {
      toast({ title: 'Invalid split', description: error || 'Please check your split details.', variant: 'destructive' });
      return;
    }

    if (expenseToEdit) {
      updateExpense(expenseToEdit.id, {
        groupId,
        title: title.trim(),
        amount: numAmount,
        currency: activeGroup?.currency || 'INR',
        category,
        paidBy,
        splitType,
        splits,
        date,
        notes: notes.trim() || undefined,
      });
      toast({
        title: 'Expense updated',
        description: `"${title}" has been updated successfully.`,
      });
    } else {
      addExpense({
        groupId,
        title: title.trim(),
        amount: numAmount,
        currency: activeGroup?.currency || 'INR',
        category,
        paidBy,
        splitType,
        splits,
        date,
        notes: notes.trim() || undefined,
        createdBy: state.settings.currentUserId,
      });
      toast({
        title: 'Expense added!',
        description: `Added "${title}" (${currencySymbol}${numAmount.toLocaleString('en-IN')}) to ${activeGroup?.name}.`,
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-ink">
            {expenseToEdit ? 'Edit Expense' : 'Add an Expense'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Split costs with your group with automatic balance calculation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Group and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Group
              </Label>
              <Select value={groupId} onValueChange={handleGroupChange}>
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

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Category
              </Label>
              <Select value={category} onValueChange={val => setCategory(val as ExpenseCategory)}>
                <SelectTrigger className="h-10 rounded-xl bg-muted/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_META) as ExpenseCategory[]).map(cat => (
                    <SelectItem key={cat} value={cat}>
                      <span className="mr-2">{CATEGORY_META[cat].emoji}</span>
                      {CATEGORY_META[cat].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title and Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Description
              </Label>
              <Input
                placeholder="e.g. Dinner at Olive Garden, Groceries, Cab"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="h-10 rounded-xl bg-muted/40"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Amount ({currencySymbol})
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
                  className="h-10 pl-8 font-semibold rounded-xl bg-muted/40"
                  required
                />
              </div>
            </div>
          </div>

          {/* Paid By and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Paid By
              </Label>
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger className="h-10 rounded-xl bg-muted/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {groupMembers.map(user => (
                    user && (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <UserAvatar user={user} size="xs" />
                          <span>{user.name} {user.id === state.settings.currentUserId ? '(You)' : ''}</span>
                        </div>
                      </SelectItem>
                    )
                  ))}
                </SelectContent>
              </Select>
            </div>

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
          </div>

          {/* Split Mode Selector */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Split Options
              </Label>
              <span className="text-xs text-muted-foreground">
                {selectedUserIds.length} person{selectedUserIds.length > 1 ? 's' : ''} involved
              </span>
            </div>

            <Tabs value={splitType} onValueChange={val => setSplitType(val as SplitType)} className="w-full">
              <TabsList className="grid grid-cols-4 w-full h-9 bg-muted/60 p-1 rounded-xl">
                <TabsTrigger value="equal" className="rounded-lg text-xs">Equally</TabsTrigger>
                <TabsTrigger value="custom" className="rounded-lg text-xs">Exact ₹</TabsTrigger>
                <TabsTrigger value="percentage" className="rounded-lg text-xs">% Percent</TabsTrigger>
                <TabsTrigger value="shares" className="rounded-lg text-xs">Shares</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Member Participant Selection & Split Inputs */}
          <div className="space-y-2 max-h-56 overflow-y-auto p-1">
            {groupMembers.map(user => {
              if (!user) return null;
              const isSelected = selectedUserIds.includes(user.id);
              const userSplit = splits.find(s => s.userId === user.id);

              return (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isSelected ? 'border-coral/40 bg-coral/5' : 'border-border/60 bg-muted/10 opacity-60'
                  }`}
                >
                  <div
                    onClick={() => toggleUserSelection(user.id)}
                    className="flex items-center gap-2.5 cursor-pointer flex-1"
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors border ${
                        isSelected ? 'bg-coral border-coral text-white' : 'border-border bg-white'
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                    <UserAvatar user={user} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {user.name} {user.id === state.settings.currentUserId ? '(You)' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Split Input depending on active mode */}
                  {isSelected && (
                    <div className="flex items-center gap-2">
                      {splitType === 'equal' && userSplit && (
                        <span className="text-sm font-semibold text-ink tabular-nums">
                          {currencySymbol}{userSplit.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      )}

                      {splitType === 'custom' && (
                        <div className="relative w-28">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                            {currencySymbol}
                          </span>
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            placeholder="0"
                            value={customAmounts[user.id] || ''}
                            onChange={e =>
                              setCustomAmounts({ ...customAmounts, [user.id]: e.target.value })
                            }
                            className="h-8 pl-6 text-sm text-right font-medium rounded-lg"
                          />
                        </div>
                      )}

                      {splitType === 'percentage' && (
                        <div className="relative w-24">
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            max="100"
                            placeholder="0"
                            value={percentages[user.id] || ''}
                            onChange={e =>
                              setPercentages({ ...percentages, [user.id]: e.target.value })
                            }
                            className="h-8 pr-6 text-sm text-right font-medium rounded-lg"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                            %
                          </span>
                        </div>
                      )}

                      {splitType === 'shares' && (
                        <div className="flex items-center gap-1.5 w-24">
                          <Input
                            type="number"
                            step="1"
                            min="1"
                            placeholder="1"
                            value={shares[user.id] || '1'}
                            onChange={e =>
                              setShares({ ...shares, [user.id]: e.target.value })
                            }
                            className="h-8 text-sm text-center font-medium rounded-lg"
                          />
                          <span className="text-xs text-muted-foreground">share</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Validation Error Notice */}
          {!isValid && error && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-destructive/10 text-destructive text-xs font-medium">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notes (optional)
            </Label>
            <Textarea
              placeholder="Add any extra details or memo..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="resize-none h-16 rounded-xl bg-muted/40 text-sm"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
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
              disabled={!isValid || !title.trim() || numAmount <= 0}
              className="rounded-xl bg-coral hover:bg-coral/90 text-white font-semibold"
            >
              {expenseToEdit ? 'Save Changes' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
