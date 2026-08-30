import { db } from './db'
import type { Account, Category, FamilyMember } from './types'

const defaultExpenseCategories: Omit<Category, 'id' | 'order'>[] = [
  { name: 'Groceries', type: 'expense', icon: 'ShoppingCart', color: '#22c55e', emoji: '🛒' },
  { name: 'Rent', type: 'expense', icon: 'Home', color: '#6366f1', emoji: '🏠' },
  { name: 'Utilities', type: 'expense', icon: 'Lightbulb', color: '#f59e0b', emoji: '💡' },
  { name: 'Internet', type: 'expense', icon: 'Wifi', color: '#0ea5e9', emoji: '📶' },
  { name: 'Fuel', type: 'expense', icon: 'Fuel', color: '#ef4444', emoji: '⛽' },
  { name: 'Dining', type: 'expense', icon: 'Utensils', color: '#f97316', emoji: '🍽️' },
  { name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#ec4899', emoji: '🛍️' },
  { name: 'Healthcare', type: 'expense', icon: 'HeartPulse', color: '#14b8a6', emoji: '🩺' },
  { name: 'Education', type: 'expense', icon: 'GraduationCap', color: '#8b5cf6', emoji: '🎓' },
  { name: 'Entertainment', type: 'expense', icon: 'Clapperboard', color: '#a855f7', emoji: '🎬' },
  { name: 'Travel', type: 'expense', icon: 'Plane', color: '#06b6d4', emoji: '✈️' },
  { name: 'Transport', type: 'expense', icon: 'Bus', color: '#3b82f6', emoji: '🚌' },
  { name: 'Pets', type: 'expense', icon: 'PawPrint', color: '#84cc16', emoji: '🐾' },
  { name: 'Miscellaneous', type: 'expense', icon: 'Boxes', color: '#64748b', emoji: '📦' },
]

const defaultIncomeCategories: Omit<Category, 'id' | 'order'>[] = [
  { name: 'Salary', type: 'income', icon: 'Wallet', color: '#22c55e', emoji: '💼' },
  { name: 'Freelance', type: 'income', icon: 'Laptop', color: '#6366f1', emoji: '💻' },
  { name: 'Business', type: 'income', icon: 'Store', color: '#f59e0b', emoji: '🏪' },
  { name: 'Investment', type: 'income', icon: 'TrendingUp', color: '#14b8a6', emoji: '📈' },
  { name: 'Interest', type: 'income', icon: 'Percent', color: '#0ea5e9', emoji: '🏦' },
  { name: 'Rental', type: 'income', icon: 'Building', color: '#8b5cf6', emoji: '🏢' },
  { name: 'Gift', type: 'income', icon: 'Gift', color: '#ec4899', emoji: '🎁' },
  { name: 'Cashback', type: 'income', icon: 'BadgePercent', color: '#f97316', emoji: '💸' },
  { name: 'Other', type: 'income', icon: 'CircleDollarSign', color: '#64748b', emoji: '💰' },
]

const defaultAccounts: Omit<Account, 'id' | 'createdAt'>[] = [
  { name: 'Cash', type: 'cash', balance: 0, color: '#22c55e', icon: 'Banknote' },
  { name: 'Bank', type: 'bank', balance: 0, color: '#6366f1', icon: 'Landmark' },
  { name: 'UPI', type: 'upi', balance: 0, color: '#f59e0b', icon: 'Smartphone' },
]

const defaultMember: Omit<FamilyMember, 'id' | 'createdAt'> = {
  name: 'Me',
  role: 'admin',
  color: '#10b981',
  avatar: '🙂',
}

export async function seedIfEmpty() {
  const count = await db.categories.count()
  if (count > 0) return

  await db.transaction(
    'rw',
    db.categories,
    db.accounts,
    db.members,
    async () => {
      let order = 0
      for (const c of [...defaultExpenseCategories, ...defaultIncomeCategories]) {
        await db.categories.add({ ...c, order: order++ })
      }
      for (const a of defaultAccounts) {
        await db.accounts.add({ ...a, createdAt: Date.now() })
      }
      await db.members.add({ ...defaultMember, createdAt: Date.now() })
    },
  )
}
