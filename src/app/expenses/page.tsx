'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/hooks';
import { CURRENCY_SYMBOLS, Expense, ExpenseCategory, CATEGORY_META } from '@/lib/types';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { GroupAvatar } from '@/components/ui/GroupAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AddExpenseDialog } from '@/components/modals/AddExpenseDialog';
import { ExpenseDetailDialog } from '@/components/modals/ExpenseDetailDialog';
import { Plus, Search, Filter, Receipt, Calendar, ArrowUpDown } from 'lucide-react';

export default function ExpensesPage() {
  const { state } = useStore();
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  const currencySymbol = CURRENCY_SYMBOLS[state.settings.currency || 'INR'];

  // Filter & sort logic
  const filteredExpenses = state.expenses
    .filter(expense => {
      const matchesSearch =
        expense.title.toLowerCase().includes(search.toLowerCase()) ||
        expense.notes?.toLowerCase().includes(search.toLowerCase());

      const matchesGroup = selectedGroup === 'all' || expense.groupId === selectedGroup;
      const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;

      return matchesSearch && matchesGroup && matchesCategory;
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortOrder === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortOrder === 'highest') return b.amount - a.amount;
      if (sortOrder === 'lowest') return a.amount - b.amount;
      return 0;
    });

  // Calculate totals
  const totalVolume = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const myTotalShare = filteredExpenses.reduce((sum, e) => {
    const split = e.splits.find(s => s.userId === state.settings.currentUserId);
    return sum + (split?.amount || 0);
  }, 0);

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">Expenses</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Detailed ledger of all shared costs and split receipts.
            </p>
          </div>

          <Button
            onClick={() => {
              setExpenseToEdit(null);
              setAddExpenseOpen(true);
            }}
            className="rounded-xl bg-coral hover:bg-coral/90 text-white font-semibold text-xs sm:text-sm h-10 px-4 self-start sm:self-auto shadow-sm"
          >
            <Plus size={16} className="mr-1.5 stroke-[2.5]" />
            Add Expense
          </Button>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="p-4 rounded-2xl bg-white border border-border/70 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Filtered Total
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-ink tabular-nums mt-1 block">
              {currencySymbol}{totalVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              {filteredExpenses.length} transactions
            </span>
          </Card>

          <Card className="p-4 rounded-2xl bg-[#E1F1E4]/40 border border-leaf/20 shadow-sm">
            <span className="text-xs font-semibold text-leaf uppercase tracking-wider block">
              Your Share
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-leaf tabular-nums mt-1 block">
              {currencySymbol}{myTotalShare.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              Your personal spending
            </span>
          </Card>

          <Card className="p-4 rounded-2xl bg-white border border-border/70 shadow-sm col-span-2 sm:col-span-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Average Expense
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-ink tabular-nums mt-1 block">
              {currencySymbol}
              {filteredExpenses.length > 0
                ? (totalVolume / filteredExpenses.length).toLocaleString('en-IN', {
                    maximumFractionDigits: 0,
                  })
                : '0'}
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              Per shared bill
            </span>
          </Card>
        </div>

        {/* Filter Controls */}
        <Card className="p-4 rounded-2xl bg-white border border-border/70 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search description or notes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-10 text-xs rounded-xl bg-muted/30"
              />
            </div>

            {/* Group Filter */}
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="h-10 text-xs rounded-xl bg-muted/30">
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

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-10 text-xs rounded-xl bg-muted/30">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {(Object.keys(CATEGORY_META) as ExpenseCategory[]).map(cat => (
                  <SelectItem key={cat} value={cat}>
                    <span className="mr-2">{CATEGORY_META[cat].emoji}</span>
                    {CATEGORY_META[cat].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Select value={sortOrder} onValueChange={val => setSortOrder(val as any)}>
              <SelectTrigger className="h-10 text-xs rounded-xl bg-muted/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Date: Newest First</SelectItem>
                <SelectItem value="oldest">Date: Oldest First</SelectItem>
                <SelectItem value="highest">Amount: High to Low</SelectItem>
                <SelectItem value="lowest">Amount: Low to High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Expenses Ledger Table */}
        {filteredExpenses.length === 0 ? (
          <Card className="p-12 text-center rounded-3xl bg-white border border-border/70 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-coral/10 text-coral flex items-center justify-center mx-auto text-xl">
              🧾
            </div>
            <h3 className="font-bold text-ink text-base">No expenses match your filters</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Try adjusting your search criteria or add a new expense.
            </p>
            <Button
              onClick={() => {
                setExpenseToEdit(null);
                setAddExpenseOpen(true);
              }}
              size="sm"
              className="mt-2 rounded-xl bg-coral text-white font-semibold"
            >
              Add Expense
            </Button>
          </Card>
        ) : (
          <div className="bg-white rounded-3xl border border-border/70 divide-y divide-border/50 shadow-sm overflow-hidden">
            {filteredExpenses.map(expense => {
              const group = state.groups.find(g => g.id === expense.groupId);
              const payer = state.users.find(u => u.id === expense.paidBy);
              const isPayer = expense.paidBy === state.settings.currentUserId;
              const mySplit = expense.splits.find(s => s.userId === state.settings.currentUserId);

              return (
                <div
                  key={expense.id}
                  onClick={() => setSelectedExpense(expense)}
                  className="p-4 flex items-center justify-between hover:bg-muted/20 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <CategoryBadge
                      category={expense.category}
                      showLabel={false}
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl p-0 flex-shrink-0"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-ink group-hover:text-coral transition-colors">
                          {expense.title}
                        </h4>
                        {group && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground hidden sm:inline-flex items-center gap-1">
                            {group.emoji} {group.name}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(expense.date).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span>·</span>
                        <span>Paid by {isPayer ? 'you' : payer?.name}</span>
                        <span>·</span>
                        <span className="capitalize">{expense.splitType}</span>
                        {expense.notes && <span className="hidden md:inline">· {expense.notes}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="block font-extrabold text-base text-ink tabular-nums">
                      {currencySymbol}
                      {expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span
                      className={`text-xs font-semibold tabular-nums ${
                        isPayer ? 'text-leaf' : mySplit ? 'text-coral' : 'text-muted-foreground'
                      }`}
                    >
                      {isPayer
                        ? `you lent ${currencySymbol}${(expense.amount - (mySplit?.amount || 0)).toLocaleString('en-IN')}`
                        : mySplit
                        ? `you owe ${currencySymbol}${mySplit.amount.toLocaleString('en-IN')}`
                        : 'not in split'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Global Modals */}
      <AddExpenseDialog
        open={addExpenseOpen}
        onOpenChange={setAddExpenseOpen}
        expenseToEdit={expenseToEdit}
      />
      <ExpenseDetailDialog
        open={!!selectedExpense}
        onOpenChange={open => !open && setSelectedExpense(null)}
        expense={selectedExpense}
        onEdit={exp => {
          setExpenseToEdit(exp);
          setAddExpenseOpen(true);
        }}
      />
    </AppShell>
  );
}
