'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/hooks';
import {
  calculateGroupBalances,
  calculateSimplifiedDebts,
  deleteGroup,
  updateGroup,
  createUser,
} from '@/lib/store';
import { CURRENCY_SYMBOLS, Expense } from '@/lib/types';
import { GroupAvatar } from '@/components/ui/GroupAvatar';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AddExpenseDialog } from '@/components/modals/AddExpenseDialog';
import { SettleUpDialog } from '@/components/modals/SettleUpDialog';
import { ExpenseDetailDialog } from '@/components/modals/ExpenseDetailDialog';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  Receipt,
  Users,
  Search,
  Settings,
  Trash2,
  Calendar,
  ArrowRight,
  UserPlus,
} from 'lucide-react';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { state } = useStore();
  const { toast } = useToast();

  const groupId = params.id as string;
  const group = state.groups.find(g => g.id === groupId);

  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'settlements' | 'members'>('expenses');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [settleUpOpen, setSettleUpOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  // Settlement prefill state
  const [settleProps, setSettleProps] = useState<{
    fromUserId?: string;
    toUserId?: string;
    amount?: number;
  }>({});

  // Quick Add Member in group
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  if (!group) {
    return (
      <AppShell>
        <div className="py-20 text-center space-y-4">
          <h2 className="text-xl font-bold text-ink">Group not found</h2>
          <p className="text-sm text-muted-foreground">This group might have been removed.</p>
          <Button onClick={() => router.push('/groups')} className="bg-coral text-white rounded-xl">
            Return to Groups
          </Button>
        </div>
      </AppShell>
    );
  }

  const currencySymbol = CURRENCY_SYMBOLS[group.currency || 'INR'];
  const balances = calculateGroupBalances(group.id);
  const myBalance = balances.find(b => b.userId === state.settings.currentUserId)?.amount || 0;
  const groupDebts = calculateSimplifiedDebts(group.id);

  const groupExpenses = state.expenses
    .filter(e => e.groupId === group.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const groupSettlements = state.settlements
    .filter(s => s.groupId === group.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalGroupSpend = groupExpenses.reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = groupExpenses.filter(e =>
    e.title.toLowerCase().includes(expenseSearch.toLowerCase()) ||
    e.category.toLowerCase().includes(expenseSearch.toLowerCase())
  );

  const handleSettle = (fromId: string, toId: string, amount: number) => {
    setSettleProps({ fromUserId: fromId, toUserId: toId, amount });
    setSettleUpOpen(true);
  };

  const handleDeleteGroup = () => {
    if (confirm(`Are you sure you want to delete "${group.name}"? All related expenses will also be removed.`)) {
      deleteGroup(group.id);
      toast({ title: 'Group deleted', description: `"${group.name}" has been deleted.` });
      router.push('/groups');
    }
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const newUser = createUser({
      name: newMemberName.trim(),
      email: newMemberEmail.trim() || `${newMemberName.toLowerCase().replace(/\s+/g, '')}@example.com`,
    });

    updateGroup(group.id, {
      members: [
        ...group.members,
        { userId: newUser.id, role: 'member', joinedAt: new Date().toISOString() },
      ],
    });

    setNewMemberName('');
    setNewMemberEmail('');
    setIsAddingMember(false);
    toast({ title: 'Member added!', description: `${newUser.name} is now in ${group.name}.` });
  };

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Back Button */}
        <div>
          <Link
            href="/groups"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-coral transition-colors"
          >
            <ArrowLeft size={14} /> Back to Groups
          </Link>
        </div>

        {/* Group Header Hero Card */}
        <Card className="p-6 sm:p-8 rounded-3xl bg-white border border-border/70 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <GroupAvatar group={group} size="xl" className="w-16 h-16 sm:w-20 sm:h-20 text-3xl sm:text-4xl" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                  {group.name}
                </h1>
                {group.description && (
                  <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                    {group.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1">
                    <Users size={14} /> {group.members.length} members
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Receipt size={14} /> {groupExpenses.length} expenses
                  </span>
                  <span>·</span>
                  <span className="font-semibold text-ink">
                    Total spent: {currencySymbol}{totalGroupSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* User Balance Badge & Action CTAs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t md:border-t-0 md:border-l border-border/60 pt-4 md:pt-0 md:pl-6">
              <div className="space-y-0.5">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Your Balance
                </span>
                <div>
                  <span
                    className={`text-2xl font-extrabold tabular-nums ${
                      myBalance > 0 ? 'text-leaf' : myBalance < 0 ? 'text-coral' : 'text-muted-foreground'
                    }`}
                  >
                    {myBalance > 0
                      ? `+${currencySymbol}${myBalance.toLocaleString('en-IN')}`
                      : myBalance < 0
                      ? `−${currencySymbol}${Math.abs(myBalance).toLocaleString('en-IN')}`
                      : 'Settled'}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {myBalance > 0
                      ? 'You are owed in this group'
                      : myBalance < 0
                      ? 'You owe in this group'
                      : 'All settled up here!'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setSettleUpOpen(true)}
                  variant="outline"
                  className="rounded-xl border-border bg-white text-ink hover:bg-muted font-medium text-xs h-10 px-3.5"
                >
                  <CheckCircle2 size={15} className="mr-1.5 text-leaf" />
                  Settle up
                </Button>
                <Button
                  onClick={() => {
                    setExpenseToEdit(null);
                    setAddExpenseOpen(true);
                  }}
                  className="rounded-xl bg-coral hover:bg-coral/90 text-white font-semibold text-xs h-10 px-4 shadow-sm"
                >
                  <Plus size={15} className="mr-1.5 stroke-[2.5]" />
                  Add expense
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Group Tabs */}
        <Tabs value={activeTab} onValueChange={val => setActiveTab(val as any)} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
            <TabsList className="bg-muted/60 p-1 rounded-xl h-10 self-start">
              <TabsTrigger value="expenses" className="rounded-lg text-xs font-semibold px-3.5">
                Expenses ({groupExpenses.length})
              </TabsTrigger>
              <TabsTrigger value="balances" className="rounded-lg text-xs font-semibold px-3.5">
                Balances & Debts
              </TabsTrigger>
              <TabsTrigger value="settlements" className="rounded-lg text-xs font-semibold px-3.5">
                Settlements ({groupSettlements.length})
              </TabsTrigger>
              <TabsTrigger value="members" className="rounded-lg text-xs font-semibold px-3.5">
                Members ({group.members.length})
              </TabsTrigger>
            </TabsList>

            {/* Tab Actions */}
            {activeTab === 'expenses' && (
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter expenses..."
                  value={expenseSearch}
                  onChange={e => setExpenseSearch(e.target.value)}
                  className="pl-8 h-9 text-xs rounded-xl bg-white border-border"
                />
              </div>
            )}

            {activeTab === 'members' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddingMember(!isAddingMember)}
                className="h-8 text-xs font-semibold rounded-xl text-coral border-coral/30 hover:bg-coral/10 gap-1 self-start sm:self-auto"
              >
                <UserPlus size={13} />
                Add Member
              </Button>
            )}
          </div>

          {/* TAB 1: EXPENSES */}
          <TabsContent value="expenses" className="mt-4 space-y-3">
            {filteredExpenses.length === 0 ? (
              <Card className="p-12 text-center rounded-3xl bg-white border border-border/70 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-coral/10 text-coral flex items-center justify-center mx-auto text-xl">
                  🧾
                </div>
                <h3 className="font-bold text-ink text-base">No expenses recorded</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {expenseSearch ? 'No expenses match your search.' : 'Split meals, rides, bills or grocery shopping for this group.'}
                </p>
                <Button
                  onClick={() => {
                    setExpenseToEdit(null);
                    setAddExpenseOpen(true);
                  }}
                  size="sm"
                  className="mt-2 rounded-xl bg-coral text-white"
                >
                  <Plus size={14} className="mr-1" /> Add Expense
                </Button>
              </Card>
            ) : (
              <div className="bg-white rounded-3xl border border-border/70 divide-y divide-border/50 shadow-sm overflow-hidden">
                {filteredExpenses.map(expense => {
                  const payer = state.users.find(u => u.id === expense.paidBy);
                  const isPayer = expense.paidBy === state.settings.currentUserId;
                  const mySplit = expense.splits.find(s => s.userId === state.settings.currentUserId);

                  return (
                    <div
                      key={expense.id}
                      onClick={() => setSelectedExpense(expense)}
                      className="p-4 flex items-center justify-between hover:bg-muted/20 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <CategoryBadge category={expense.category} showLabel={false} className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg p-0" />
                        <div>
                          <h4 className="font-bold text-sm text-ink hover:text-coral transition-colors">
                            {expense.title}
                          </h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span>{new Date(expense.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                            <span>·</span>
                            <span>Paid by {isPayer ? 'you' : payer?.name}</span>
                            <span>·</span>
                            <span className="capitalize">{expense.splitType}</span>
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
            )}
          </TabsContent>

          {/* TAB 2: BALANCES & DEBTS */}
          <TabsContent value="balances" className="mt-4 space-y-6">
            {/* Simplified Direct Settlement Suggestions */}
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-bold text-ink">Suggested Settlements</h3>
                <p className="text-xs text-muted-foreground">
                  The fewest direct transactions needed to settle all group debts.
                </p>
              </div>

              {groupDebts.length === 0 ? (
                <Card className="p-8 text-center rounded-3xl bg-white border border-border/70 space-y-2">
                  <CheckCircle2 size={32} className="mx-auto text-leaf" />
                  <p className="text-sm font-bold text-ink">Group is completely settled!</p>
                  <p className="text-xs text-muted-foreground">No one owes anyone anything in this group.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {groupDebts.map((debt, idx) => {
                    const fromUser = state.users.find(u => u.id === debt.fromUserId);
                    const toUser = state.users.find(u => u.id === debt.toUserId);
                    const isIOwe = debt.fromUserId === state.settings.currentUserId;
                    const isOwedToMe = debt.toUserId === state.settings.currentUserId;

                    return (
                      <Card
                        key={idx}
                        className={`p-4 rounded-2xl border flex items-center justify-between ${
                          isIOwe
                            ? 'bg-[#FCE6E0]/40 border-coral/30'
                            : isOwedToMe
                            ? 'bg-[#E1F1E4]/40 border-leaf/30'
                            : 'bg-white border-border/70'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {fromUser && <UserAvatar user={fromUser} size="sm" />}
                            {toUser && <UserAvatar user={toUser} size="sm" />}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-ink">
                              {isIOwe ? (
                                <span>You pay <strong className="text-coral">{toUser?.name}</strong></span>
                              ) : isOwedToMe ? (
                                <span><strong>{fromUser?.name}</strong> pays you</span>
                              ) : (
                                <span>{fromUser?.name} pays {toUser?.name}</span>
                              )}
                            </p>
                            <span className="text-[11px] text-muted-foreground">Simplified settlement</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`font-bold text-sm tabular-nums ${
                              isIOwe ? 'text-coral' : isOwedToMe ? 'text-leaf' : 'text-ink'
                            }`}
                          >
                            {currencySymbol}{debt.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>

                          <Button
                            size="sm"
                            onClick={() => handleSettle(debt.fromUserId, debt.toUserId, debt.amount)}
                            className="h-8 text-xs font-semibold rounded-xl bg-leaf hover:bg-leaf/90 text-white"
                          >
                            Settle
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Individual Net Balances Breakdown */}
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-bold text-ink">Individual Balances</h3>
                <p className="text-xs text-muted-foreground">Net position of each member in {group.name}</p>
              </div>

              <div className="bg-white rounded-3xl border border-border/70 divide-y divide-border/50 shadow-sm overflow-hidden">
                {balances.map(b => {
                  const user = state.users.find(u => u.id === b.userId);
                  const isMe = b.userId === state.settings.currentUserId;

                  return (
                    <div key={b.userId} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {user && <UserAvatar user={user} size="sm" />}
                        <div>
                          <p className="text-sm font-semibold text-ink">
                            {user?.name} {isMe ? '(You)' : ''}
                          </p>
                          <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-extrabold text-sm tabular-nums ${
                            b.amount > 0 ? 'text-leaf' : b.amount < 0 ? 'text-coral' : 'text-muted-foreground'
                          }`}
                        >
                          {b.amount > 0
                            ? `gets back ${currencySymbol}${b.amount.toLocaleString('en-IN')}`
                            : b.amount < 0
                            ? `owes ${currencySymbol}${Math.abs(b.amount).toLocaleString('en-IN')}`
                            : 'settled'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: SETTLEMENTS */}
          <TabsContent value="settlements" className="mt-4 space-y-3">
            {groupSettlements.length === 0 ? (
              <Card className="p-12 text-center rounded-3xl bg-white border border-border/70 space-y-2">
                <CheckCircle2 size={32} className="mx-auto text-muted-foreground" />
                <p className="text-sm font-bold text-ink">No settlements recorded yet</p>
                <p className="text-xs text-muted-foreground">When payments are made between members, log them here.</p>
                <Button
                  onClick={() => setSettleUpOpen(true)}
                  size="sm"
                  className="mt-2 rounded-xl bg-leaf text-white"
                >
                  Record Payment
                </Button>
              </Card>
            ) : (
              <div className="bg-white rounded-3xl border border-border/70 divide-y divide-border/50 shadow-sm overflow-hidden">
                {groupSettlements.map(settlement => {
                  const fromUser = state.users.find(u => u.id === settlement.fromUserId);
                  const toUser = state.users.find(u => u.id === settlement.toUserId);

                  return (
                    <div key={settlement.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-leaf-light text-leaf flex items-center justify-center font-bold">
                          ✓
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-ink">
                            <strong>{fromUser?.name}</strong> paid <strong>{toUser?.name}</strong>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(settlement.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })} · {settlement.notes || 'Direct payment'}
                          </p>
                        </div>
                      </div>

                      <span className="font-extrabold text-sm text-leaf tabular-nums">
                        {currencySymbol}{settlement.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TAB 4: MEMBERS */}
          <TabsContent value="members" className="mt-4 space-y-4">
            {isAddingMember && (
              <Card className="p-4 rounded-2xl bg-white border border-border/80 shadow-sm space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Add New Member</h4>
                <form onSubmit={handleAddMember} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    placeholder="Full name"
                    value={newMemberName}
                    onChange={e => setNewMemberName(e.target.value)}
                    className="h-10 rounded-xl"
                    required
                  />
                  <Input
                    placeholder="Email address"
                    value={newMemberEmail}
                    onChange={e => setNewMemberEmail(e.target.value)}
                    className="h-10 rounded-xl"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddingMember(false)}
                      className="rounded-xl flex-1"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="rounded-xl bg-coral text-white flex-1 font-semibold">
                      Add to Group
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            <div className="bg-white rounded-3xl border border-border/70 divide-y divide-border/50 shadow-sm overflow-hidden">
              {group.members.map(member => {
                const user = state.users.find(u => u.id === member.userId);
                const isMe = member.userId === state.settings.currentUserId;
                const memberBal = balances.find(b => b.userId === member.userId)?.amount || 0;

                return (
                  <div key={member.userId} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {user && <UserAvatar user={user} size="md" />}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-ink">
                            {user?.name} {isMe ? '(You)' : ''}
                          </p>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {member.role}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-bold tabular-nums block ${
                          memberBal > 0 ? 'text-leaf' : memberBal < 0 ? 'text-coral' : 'text-muted-foreground'
                        }`}
                      >
                        {memberBal > 0
                          ? `+${currencySymbol}${memberBal.toLocaleString('en-IN')}`
                          : memberBal < 0
                          ? `−${currencySymbol}${Math.abs(memberBal).toLocaleString('en-IN')}`
                          : 'Settled'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Danger Zone: Delete Group */}
            <div className="pt-6">
              <Card className="p-5 rounded-2xl bg-destructive/5 border border-destructive/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-destructive">Delete this group</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Permanently delete this group and all its recorded expenses.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleDeleteGroup}
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 rounded-xl text-xs font-semibold h-9 self-start sm:self-auto"
                >
                  <Trash2 size={14} className="mr-1.5" />
                  Delete Group
                </Button>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Global Modals */}
      <AddExpenseDialog
        open={addExpenseOpen}
        onOpenChange={setAddExpenseOpen}
        defaultGroupId={group.id}
        expenseToEdit={expenseToEdit}
      />
      <SettleUpDialog
        open={settleUpOpen}
        onOpenChange={setSettleUpOpen}
        defaultGroupId={group.id}
        defaultFromUserId={settleProps.fromUserId}
        defaultToUserId={settleProps.toUserId}
        defaultAmount={settleProps.amount}
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
