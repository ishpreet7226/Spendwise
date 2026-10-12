'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/hooks';
import { CURRENCY_SYMBOLS, CATEGORY_META, ExpenseCategory } from '@/lib/types';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { BarChart2, PieChart as PieIcon, TrendingUp, DollarSign } from 'lucide-react';

const PALETTE = ['#E9785B', '#43875A', '#6CA6C9', '#E9B94E', '#9B8DC4', '#D9658B', '#38A3A5', '#F4A261'];

export default function AnalyticsPage() {
  const { state } = useStore();
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  const currencySymbol = CURRENCY_SYMBOLS[state.settings.currency || 'INR'];

  const filteredExpenses = state.expenses.filter(
    e => selectedGroup === 'all' || e.groupId === selectedGroup
  );

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const myShare = filteredExpenses.reduce((sum, e) => {
    const split = e.splits.find(s => s.userId === state.settings.currentUserId);
    return sum + (split?.amount || 0);
  }, 0);

  // 1. Category-wise Spending
  const categoryMap: Record<string, number> = {};
  filteredExpenses.forEach(e => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });

  const categoryData = Object.entries(categoryMap)
    .map(([cat, amount]) => ({
      name: CATEGORY_META[cat as ExpenseCategory]?.label || cat,
      emoji: CATEGORY_META[cat as ExpenseCategory]?.emoji || '📦',
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  // 2. Monthly Spending
  const monthlyMap: Record<string, number> = {};
  filteredExpenses.forEach(e => {
    const date = new Date(e.date);
    const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    monthlyMap[key] = (monthlyMap[key] || 0) + e.amount;
  });

  const monthlyData = Object.entries(monthlyMap).map(([month, amount]) => ({
    month,
    amount,
  }));

  // 3. Group-wise Spending
  const groupMap: Record<string, number> = {};
  state.expenses.forEach(e => {
    const grp = state.groups.find(g => g.id === e.groupId);
    const gName = grp?.name || 'Other';
    groupMap[gName] = (groupMap[gName] || 0) + e.amount;
  });

  const groupData = Object.entries(groupMap).map(([name, amount]) => ({
    name,
    amount,
  }));

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Insights into spending patterns, split ratios and category distribution.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Group:</span>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-48 h-9 text-xs rounded-xl bg-white border-border">
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

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 rounded-3xl bg-white border border-border/70 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Total Spending
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-ink tabular-nums mt-1 block">
              {currencySymbol}{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-muted-foreground mt-1 block">
              Across {filteredExpenses.length} transactions
            </span>
          </Card>

          <Card className="p-5 rounded-3xl bg-[#E1F1E4]/50 border border-leaf/20 shadow-sm">
            <span className="text-xs font-semibold text-leaf uppercase tracking-wider block">
              Your Share
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-leaf tabular-nums mt-1 block">
              {currencySymbol}{myShare.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-muted-foreground mt-1 block">
              {totalSpent > 0 ? ((myShare / totalSpent) * 100).toFixed(1) : 0}% of total volume
            </span>
          </Card>

          <Card className="p-5 rounded-3xl bg-white border border-border/70 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Average Per Bill
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-ink tabular-nums mt-1 block">
              {currencySymbol}
              {filteredExpenses.length > 0
                ? (totalSpent / filteredExpenses.length).toLocaleString('en-IN', {
                    maximumFractionDigits: 0,
                  })
                : '0'}
            </span>
            <span className="text-xs text-muted-foreground mt-1 block">
              Typical cost per shared expense
            </span>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown Donut */}
          <Card className="p-6 rounded-3xl bg-white border border-border/70 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                  <PieIcon size={18} className="text-coral" /> Category Spending
                </h3>
                <p className="text-xs text-muted-foreground">Where the money goes</p>
              </div>
            </div>

            <div className="h-64 w-full">
              {categoryData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  No data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [
                        `${currencySymbol}${Number(val).toLocaleString('en-IN')}`,
                        'Amount',
                      ]}
                      contentStyle={{
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(0,0,0,0.1)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Category Legend list */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
              {categoryData.slice(0, 6).map((c, i) => (
                <div key={c.name} className="flex items-center justify-between p-1.5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                    />
                    <span className="text-muted-foreground truncate">{c.emoji} {c.name}</span>
                  </div>
                  <span className="font-semibold text-ink tabular-nums">
                    {currencySymbol}{c.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Monthly Spending Trend Bar Chart */}
          <Card className="p-6 rounded-3xl bg-white border border-border/70 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                  <BarChart2 size={18} className="text-leaf" /> Monthly Spending Trend
                </h3>
                <p className="text-xs text-muted-foreground">Volume over time</p>
              </div>
            </div>

            <div className="h-64 w-full">
              {monthlyData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  No data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={val => `${currencySymbol}${val / 1000}k`}
                    />
                    <Tooltip
                      formatter={(val: any) => [
                        `${currencySymbol}${Number(val).toLocaleString('en-IN')}`,
                        'Spending',
                      ]}
                      contentStyle={{
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(0,0,0,0.1)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      }}
                    />
                    <Bar dataKey="amount" fill="#E9785B" radius={[8, 8, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground text-center">
              Expenses grouped by billing month
            </div>
          </Card>

          {/* Group-wise Spending Comparison */}
          <Card className="p-6 rounded-3xl bg-white border border-border/70 shadow-sm space-y-4 lg:col-span-2">
            <div>
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <TrendingUp size={18} className="text-sunshine" /> Group-wise Spend Comparison
              </h3>
              <p className="text-xs text-muted-foreground">Total volume per shared circle</p>
            </div>

            <div className="h-64 w-full">
              {groupData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  No data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={groupData}
                    layout="vertical"
                    margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                    <XAxis
                      type="number"
                      stroke="#888888"
                      fontSize={11}
                      tickFormatter={val => `${currencySymbol}${val}`}
                    />
                    <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} tickLine={false} />
                    <Tooltip
                      formatter={(val: any) => [
                        `${currencySymbol}${Number(val).toLocaleString('en-IN')}`,
                        'Total Spend',
                      ]}
                      contentStyle={{
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(0,0,0,0.1)',
                      }}
                    />
                    <Bar dataKey="amount" fill="#43875A" radius={[0, 8, 8, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
