export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  avatarColor: string;
}

export interface GroupMember {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  emoji: string;
  color: string;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
  currency: Currency;
}

export type SplitType = 'equal' | 'custom' | 'percentage' | 'shares';

export interface ExpenseSplit {
  userId: string;
  amount: number;
  percentage?: number;
  shares?: number;
}

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'entertainment'
  | 'utilities'
  | 'shopping'
  | 'health'
  | 'other';

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  amount: number;
  currency: Currency;
  category: ExpenseCategory;
  paidBy: string;
  splitType: SplitType;
  splits: ExpenseSplit[];
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: Currency;
  date: string;
  notes?: string;
  createdAt: string;
}

export type ActivityType =
  | 'expense_added'
  | 'expense_edited'
  | 'expense_deleted'
  | 'settlement'
  | 'member_joined'
  | 'group_created';

export interface Activity {
  id: string;
  type: ActivityType;
  groupId?: string;
  expenseId?: string;
  settlementId?: string;
  userId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Balance {
  userId: string;
  amount: number;
}

export interface GroupBalance {
  groupId: string;
  balances: Balance[];
}

export interface AppSettings {
  currentUserId: string;
  currency: Currency;
  theme: 'light';
  notifications: boolean;
  userName: string;
  userEmail: string;
  userAvatarColor: string;
}

export interface AppState {
  users: User[];
  groups: Group[];
  expenses: Expense[];
  settlements: Settlement[];
  activities: Activity[];
  settings: AppSettings;
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export const CATEGORY_META: Record<ExpenseCategory, { label: string; emoji: string; color: string }> = {
  food: { label: 'Food & Drinks', emoji: '🍽️', color: '#E9B94E' },
  transport: { label: 'Transport', emoji: '🚗', color: '#6CA6C9' },
  accommodation: { label: 'Stay', emoji: '🏨', color: '#9B8DC4' },
  entertainment: { label: 'Fun', emoji: '🎉', color: '#E9785B' },
  utilities: { label: 'Utilities', emoji: '💡', color: '#43875A' },
  shopping: { label: 'Shopping', emoji: '🛍️', color: '#E9785B' },
  health: { label: 'Health', emoji: '💊', color: '#43875A' },
  other: { label: 'Other', emoji: '📦', color: '#8A9A8E' },
};

