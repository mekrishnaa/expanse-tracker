import Dexie, { type EntityTable } from 'dexie'
import type {
  Account,
  Bill,
  Budget,
  Category,
  FamilyMember,
  Note,
  SavingsGoal,
  ShoppingItem,
  ShoppingList,
  Template,
  Transaction,
} from './types'

export class ExpenseDB extends Dexie {
  transactions!: EntityTable<Transaction, 'id'>
  categories!: EntityTable<Category, 'id'>
  members!: EntityTable<FamilyMember, 'id'>
  accounts!: EntityTable<Account, 'id'>
  budgets!: EntityTable<Budget, 'id'>
  goals!: EntityTable<SavingsGoal, 'id'>
  bills!: EntityTable<Bill, 'id'>
  shoppingLists!: EntityTable<ShoppingList, 'id'>
  shoppingItems!: EntityTable<ShoppingItem, 'id'>
  notes!: EntityTable<Note, 'id'>
  templates!: EntityTable<Template, 'id'>

  constructor() {
    super('FamilyExpenseTracker')
    this.version(1).stores({
      transactions:
        '++id, type, date, categoryId, memberId, accountId, amount, createdAt',
      categories: '++id, type, order, archived',
      members: '++id, name, role',
      accounts: '++id, type',
      budgets: '++id, month, categoryId, [month+categoryId]',
      goals: '++id, createdAt',
      bills: '++id, dueDate, frequency',
      shoppingLists: '++id, createdAt',
      shoppingItems: '++id, listId, purchased',
      notes: '++id, updatedAt, pinned',
    })
    this.version(2).stores({
      templates: '++id, type, createdAt',
    })
  }
}

export const db = new ExpenseDB()
