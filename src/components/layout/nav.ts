export interface NavItem {
  to: string
  label: string
  icon: string
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { to: '/expenses', label: 'Expenses', icon: 'ArrowDownCircle' },
  { to: '/income', label: 'Income', icon: 'ArrowUpCircle' },
  { to: '/budget', label: 'Budget', icon: 'PiggyBank' },
  { to: '/savings', label: 'Savings Goals', icon: 'Target' },
  { to: '/bills', label: 'Bills & EMI', icon: 'ReceiptText' },
  { to: '/members', label: 'Family Members', icon: 'Users' },
  { to: '/reports', label: 'Reports', icon: 'ChartColumnBig' },
  { to: '/calendar', label: 'Calendar', icon: 'CalendarDays' },
  { to: '/categories', label: 'Categories', icon: 'Tags' },
  { to: '/accounts', label: 'Wallets', icon: 'Wallet' },
  { to: '/shopping', label: 'Shopping', icon: 'ShoppingCart' },
  { to: '/notes', label: 'Notes', icon: 'NotebookPen' },
  { to: '/settings', label: 'Settings', icon: 'Settings' },
]

// Items shown in the mobile bottom bar (rest live behind "More").
export const BOTTOM_NAV = NAV_ITEMS.filter((i) =>
  ['/', '/expenses', '/budget', '/reports'].includes(i.to),
)
