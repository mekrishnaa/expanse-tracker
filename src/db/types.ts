export type TxnType = 'expense' | 'income' | 'transfer'

export type MemberRole = 'admin' | 'parent' | 'child' | 'guest'

export interface FamilyMember {
  id?: number
  name: string
  role: MemberRole
  color: string
  avatar?: string // emoji or data URL
  monthlyBudget?: number
  createdAt: number
}

export interface Category {
  id?: number
  name: string
  type: TxnType // expense or income category
  icon: string // lucide icon name
  color: string
  emoji?: string
  budget?: number
  order: number
  archived?: boolean
}

export type AccountType =
  | 'cash'
  | 'bank'
  | 'credit'
  | 'upi'
  | 'wallet'
  | 'investment'

export interface Account {
  id?: number
  name: string
  type: AccountType
  balance: number // opening balance
  color: string
  icon: string
  createdAt: number
}

export interface Transaction {
  id?: number
  type: TxnType
  amount: number
  categoryId?: number
  budgetId?: number // optional link to a specific named budget
  memberId?: number
  accountId?: number
  toAccountId?: number // for transfers
  description?: string
  merchant?: string
  paymentMethod?: string
  location?: string
  tags?: string[]
  notes?: string
  receipt?: string // data URL
  date: string // ISO yyyy-mm-dd
  time?: string // HH:mm
  createdAt: number
}

export interface Budget {
  id?: number
  categoryId: number
  month: string // yyyy-mm
  limit: number
  name?: string // optional label, e.g. "Rent - Downtown"
  rollover?: boolean
}

export interface SavingsGoal {
  id?: number
  name: string
  emoji: string
  targetAmount: number
  currentAmount: number
  deadline?: string
  color: string
  createdAt: number
  completedAt?: number
}

export type BillFrequency =
  | 'monthly'
  | 'weekly'
  | 'yearly'
  | 'quarterly'
  | 'once'

export interface Bill {
  id?: number
  name: string
  amount: number
  categoryId?: number
  dueDate: string // ISO yyyy-mm-dd (next due)
  frequency: BillFrequency
  isEmi?: boolean
  emiTotalMonths?: number
  emiPaidMonths?: number
  autoRepeat?: boolean
  paid?: boolean
  reminderDays?: number
  createdAt: number
}

export interface ShoppingItem {
  id?: number
  listId: number
  name: string
  qty?: number
  estimatedCost?: number
  purchased?: boolean
  createdAt: number
}

export interface ShoppingList {
  id?: number
  name: string
  emoji: string
  createdAt: number
}

export interface Note {
  id?: number
  title: string
  content: string // markdown-ish text
  pinned?: boolean
  color?: string
  updatedAt: number
  createdAt: number
}
