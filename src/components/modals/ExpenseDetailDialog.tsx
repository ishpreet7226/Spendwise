'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/hooks';
import { deleteExpense } from '@/lib/store';
import { Expense, CURRENCY_SYMBOLS, CATEGORY_META } from '@/lib/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { GroupAvatar } from '@/components/ui/GroupAvatar';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Calendar, Receipt, UserCheck } from 'lucide-react';

interface ExpenseDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
  onEdit: (expense: Expense) => void;
}

export function ExpenseDetailDialog({
  open,
  onOpenChange,
  expense,
  onEdit,
}: ExpenseDetailDialogProps) {
  const { state } = useStore();
  const { toast } = useToast();

  if (!expense) return null;

  const group = state.groups.find(g => g.id === expense.groupId);
  const payer = state.users.find(u => u.id === expense.paidBy);
  const currencySymbol = CURRENCY_SYMBOLS[expense.currency || 'INR'];
  const isPaidByMe = expense.paidBy === state.settings.currentUserId;

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${expense.title}"?`)) {
      deleteExpense(expense.id);
      toast({
        title: 'Expense deleted',
        description: `"${expense.title}" was removed.`,
      });
      onOpenChange(false);
    }
  };

  const handleEditClick = () => {
    onOpenChange(false);
    onEdit(expense);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CategoryBadge category={expense.category} />
            {group && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">
                <span>{group.emoji}</span>
                <span>{group.name}</span>
              </div>
            )}
          </div>
          <DialogTitle className="text-2xl font-bold text-ink tracking-tight">
            {expense.title}
          </DialogTitle>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-ink tabular-nums">
              {currencySymbol}{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar size={15} />
              <span>{new Date(expense.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Receipt size={15} />
              <span className="capitalize">{expense.splitType} split</span>
            </div>
          </div>

          {/* Paid by */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-border">
            <div className="flex items-center gap-2.5">
              {payer && <UserAvatar user={payer} size="sm" />}
              <div>
                <p className="text-xs text-muted-foreground">Paid by</p>
                <p className="text-sm font-semibold text-ink">
                  {payer?.name} {isPaidByMe ? '(You)' : ''}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-leaf bg-leaf/10 px-2.5 py-1 rounded-full">
              Full {currencySymbol}{expense.amount.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Splits Breakdown */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Split Breakdown ({expense.splits.length})
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {expense.splits.map(split => {
                const user = state.users.find(u => u.id === split.userId);
                const isMe = split.userId === state.settings.currentUserId;

                return (
                  <div
                    key={split.userId}
                    className={`flex items-center justify-between p-2 rounded-xl text-sm ${
                      isMe ? 'bg-coral/5 border border-coral/20' : 'bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {user && <UserAvatar user={user} size="xs" />}
                      <span className="text-xs font-medium text-ink">
                        {user?.name} {isMe ? '(You)' : ''}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-semibold text-xs tabular-nums text-ink">
                        {currencySymbol}{split.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      {split.percentage !== undefined && (
                        <span className="text-[10px] text-muted-foreground ml-1">
                          ({split.percentage}%)
                        </span>
                      )}
                      {split.shares !== undefined && (
                        <span className="text-[10px] text-muted-foreground ml-1">
                          ({split.shares} sh.)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes if present */}
          {expense.notes && (
            <div className="p-3 rounded-xl bg-muted/20 border border-border/40 text-xs">
              <span className="font-semibold text-muted-foreground block mb-0.5">Notes</span>
              <p className="text-ink">{expense.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between items-center pt-2 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive text-xs gap-1.5 rounded-xl h-9"
          >
            <Trash2 size={14} />
            Delete
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs rounded-xl h-9"
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleEditClick}
              className="bg-coral hover:bg-coral/90 text-white text-xs gap-1.5 rounded-xl h-9 font-medium"
            >
              <Pencil size={14} />
              Edit
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
