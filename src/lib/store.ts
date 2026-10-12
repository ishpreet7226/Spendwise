import { AppState, Group, Expense, Settlement, Balance, Activity, User } from './types';
import { SAMPLE_DATA } from './sampleData';

const STORAGE_KEY = 'spendwise-data';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function initializeStore(): AppState {
  if (typeof window === 'undefined') return SAMPLE_DATA;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as AppState;
    }
  } catch {
    // ignore
  }
  const initial = JSON.parse(JSON.stringify(SAMPLE_DATA)) as AppState;
  saveState(initial);
  return initial;
}

export function getState(): AppState {
  return initializeStore();
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('spendwise-update'));
}

export function resetToSampleData(): AppState {
  const fresh = JSON.parse(JSON.stringify(SAMPLE_DATA)) as AppState;
  saveState(fresh);
  return fresh;
}

// --- Group CRUD ---
export function createGroup(data: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>): Group {
  const state = getState();
  const group: Group = {
    ...data,
    id: generateId('group'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const activity: Activity = {
    id: generateId('act'),
    type: 'group_created',
    groupId: group.id,
    userId: state.settings.currentUserId,
    metadata: { name: group.name },
    createdAt: new Date().toISOString(),
  };
  saveState({ ...state, groups: [...state.groups, group], activities: [activity, ...state.activities] });
  return group;
}

export function updateGroup(id: string, data: Partial<Group>): Group | null {
  const state = getState();
  const idx = state.groups.findIndex(g => g.id === id);
  if (idx === -1) return null;
  const updated = { ...state.groups[idx], ...data, updatedAt: new Date().toISOString() };
  const groups = [...state.groups];
  groups[idx] = updated;
  saveState({ ...state, groups });
  return updated;
}

export function deleteGroup(id: string): void {
  const state = getState();
  saveState({
    ...state,
    groups: state.groups.filter(g => g.id !== id),
    expenses: state.expenses.filter(e => e.groupId !== id),
    settlements: state.settlements.filter(s => s.groupId !== id),
  });
}

// --- Expense CRUD ---
export function addExpense(data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Expense {
  const state = getState();
  const expense: Expense = {
    ...data,
    id: generateId('exp'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const activity: Activity = {
    id: generateId('act'),
    type: 'expense_added',
    groupId: expense.groupId,
    expenseId: expense.id,
    userId: state.settings.currentUserId,
    metadata: { title: expense.title, amount: expense.amount },
    createdAt: new Date().toISOString(),
  };
  saveState({ ...state, expenses: [expense, ...state.expenses], activities: [activity, ...state.activities] });
  return expense;
}

export function updateExpense(id: string, data: Partial<Expense>): Expense | null {
  const state = getState();
  const idx = state.expenses.findIndex(e => e.id === id);
  if (idx === -1) return null;
  const updated = { ...state.expenses[idx], ...data, updatedAt: new Date().toISOString() };
  const expenses = [...state.expenses];
  expenses[idx] = updated;
  const activity: Activity = {
    id: generateId('act'),
    type: 'expense_edited',
    groupId: updated.groupId,
    expenseId: updated.id,
    userId: state.settings.currentUserId,
    metadata: { title: updated.title, amount: updated.amount },
    createdAt: new Date().toISOString(),
  };
  saveState({ ...state, expenses, activities: [activity, ...state.activities] });
  return updated;
}

export function deleteExpense(id: string): void {
  const state = getState();
  const expense = state.expenses.find(e => e.id === id);
  const activity: Activity = {
    id: generateId('act'),
    type: 'expense_deleted',
    groupId: expense?.groupId,
    expenseId: id,
    userId: state.settings.currentUserId,
    metadata: { title: expense?.title ?? '' },
    createdAt: new Date().toISOString(),
  };
  saveState({
    ...state,
    expenses: state.expenses.filter(e => e.id !== id),
    activities: [activity, ...state.activities],
  });
}

// --- Settlement ---
export function addSettlement(data: Omit<Settlement, 'id' | 'createdAt'>): Settlement {
  const state = getState();
  const settlement: Settlement = {
    ...data,
    id: generateId('set'),
    createdAt: new Date().toISOString(),
  };
  const activity: Activity = {
    id: generateId('act'),
    type: 'settlement',
    groupId: settlement.groupId,
    settlementId: settlement.id,
    userId: state.settings.currentUserId,
    metadata: { amount: settlement.amount, toUserId: settlement.toUserId },
    createdAt: new Date().toISOString(),
  };
  saveState({ ...state, settlements: [settlement, ...state.settlements], activities: [activity, ...state.activities] });
  return settlement;
}

// --- Balance Calculations ---
export function calculateGroupBalances(groupId: string): Balance[] {
  const state = getState();
  const group = state.groups.find(g => g.id === groupId);
  if (!group) return [];

  const balanceMap: Record<string, number> = {};
  group.members.forEach(m => { balanceMap[m.userId] = 0; });

  // Process expenses
  state.expenses
    .filter(e => e.groupId === groupId)
    .forEach(expense => {
      expense.splits.forEach(split => {
        if (split.userId !== expense.paidBy) {
          balanceMap[expense.paidBy] = (balanceMap[expense.paidBy] ?? 0) + split.amount;
          balanceMap[split.userId] = (balanceMap[split.userId] ?? 0) - split.amount;
        }
      });
    });

  // Process settlements
  state.settlements
    .filter(s => s.groupId === groupId)
    .forEach(s => {
      balanceMap[s.fromUserId] = (balanceMap[s.fromUserId] ?? 0) + s.amount;
      balanceMap[s.toUserId] = (balanceMap[s.toUserId] ?? 0) - s.amount;
    });

  return Object.entries(balanceMap).map(([userId, amount]) => ({ userId, amount }));
}

export function calculateUserTotals(): { totalOwed: number; totalOwing: number } {
  const state = getState();
  const currentUserId = state.settings.currentUserId;
  let totalOwed = 0;
  let totalOwing = 0;

  state.groups.forEach(group => {
    const balances = calculateGroupBalances(group.id);
    const myBalance = balances.find(b => b.userId === currentUserId);
    if (myBalance) {
      if (myBalance.amount > 0) totalOwed += myBalance.amount;
      else if (myBalance.amount < 0) totalOwing += Math.abs(myBalance.amount);
    }
  });

  return { totalOwed, totalOwing };
}

// --- Users ---
export function createUser(data: { name: string; email: string; avatarColor?: string }): User {
  const state = getState();
  const colors = ['#E9785B', '#43875A', '#6CA6C9', '#E9B94E', '#9B8DC4', '#D9658B'];
  const user: User = {
    id: generateId('user'),
    name: data.name,
    email: data.email,
    avatarColor: data.avatarColor || colors[Math.floor(Math.random() * colors.length)],
  };
  saveState({ ...state, users: [...state.users, user] });
  return user;
}

// --- Simplified Debts Algorithm ---
export interface SimplifiedDebt {
  fromUserId: string;
  toUserId: string;
  amount: number;
  groupId?: string;
}

export function calculateSimplifiedDebts(groupId?: string): SimplifiedDebt[] {
  const state = getState();
  const balanceMap: Record<string, number> = {};

  const expenses = groupId ? state.expenses.filter(e => e.groupId === groupId) : state.expenses;
  const settlements = groupId ? state.settlements.filter(s => s.groupId === groupId) : state.settlements;

  expenses.forEach(expense => {
    expense.splits.forEach(split => {
      if (split.userId !== expense.paidBy) {
        balanceMap[expense.paidBy] = (balanceMap[expense.paidBy] ?? 0) + split.amount;
        balanceMap[split.userId] = (balanceMap[split.userId] ?? 0) - split.amount;
      }
    });
  });

  settlements.forEach(s => {
    balanceMap[s.fromUserId] = (balanceMap[s.fromUserId] ?? 0) + s.amount;
    balanceMap[s.toUserId] = (balanceMap[s.toUserId] ?? 0) - s.amount;
  });

  // Separate debtors and creditors
  const debtors: { userId: string; amount: number }[] = [];
  const creditors: { userId: string; amount: number }[] = [];

  Object.entries(balanceMap).forEach(([userId, bal]) => {
    const rounded = Math.round(bal * 100) / 100;
    if (rounded < -0.01) {
      debtors.push({ userId, amount: Math.abs(rounded) });
    } else if (rounded > 0.01) {
      creditors.push({ userId, amount: rounded });
    }
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const debts: SimplifiedDebt[] = [];
  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];
    const settledAmount = Math.min(debtor.amount, creditor.amount);

    if (settledAmount > 0.01) {
      debts.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: Math.round(settledAmount * 100) / 100,
        groupId,
      });
    }

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (debtor.amount < 0.01) d++;
    if (creditor.amount < 0.01) c++;
  }

  return debts;
}

export function updateSettings(updates: Partial<AppState['settings']>): void {
  const state = getState();
  const userIdx = state.users.findIndex(u => u.id === state.settings.currentUserId);
  let users = [...state.users];
  if (userIdx !== -1 && (updates.userName || updates.userEmail || updates.userAvatarColor)) {
    users[userIdx] = {
      ...users[userIdx],
      name: updates.userName ?? users[userIdx].name,
      email: updates.userEmail ?? users[userIdx].email,
      avatarColor: updates.userAvatarColor ?? users[userIdx].avatarColor,
    };
  }
  saveState({ ...state, settings: { ...state.settings, ...updates }, users });
}

