import { getDB } from './index';

// ─── Categories ───────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  parent_id: number | null;
  is_system: number;
  created_at: string;
}

export async function getCategories(): Promise<Category[]> {
  const db = getDB();
  return await db.getAllAsync<Category>('SELECT * FROM categories ORDER BY name ASC');
}

export async function addCategory(name: string, icon: string | null, color: string | null, parent_id: number | null): Promise<number> {
  const db = getDB();
  const r = await db.runAsync(
    'INSERT INTO categories (name, icon, color, parent_id) VALUES (?, ?, ?, ?)',
    [name, icon, color, parent_id]
  );
  return r.lastInsertRowId;
}

export async function deleteCategory(id: number): Promise<void> {
  const db = getDB();
  await db.runAsync('DELETE FROM categories WHERE id = ? AND is_system = 0', [id]);
}

// ─── Payment Modes ────────────────────────────────────────────────────────────

export interface PaymentMode {
  id: number;
  name: string;
  is_system: number;
}

export async function getPaymentModes(): Promise<PaymentMode[]> {
  const db = getDB();
  return await db.getAllAsync<PaymentMode>('SELECT * FROM payment_modes ORDER BY name ASC');
}

export async function addPaymentMode(name: string): Promise<number> {
  const db = getDB();
  const r = await db.runAsync('INSERT INTO payment_modes (name) VALUES (?)', [name]);
  return r.lastInsertRowId;
}

export async function deletePaymentMode(id: number): Promise<void> {
  const db = getDB();
  await db.runAsync('DELETE FROM payment_modes WHERE id = ? AND is_system = 0', [id]);
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export interface Expense {
  id: number;
  amount: number;
  date: string;
  category_id: number | null;
  subcategory_id: number | null;
  payment_mode_id: number | null;
  note: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseInsert {
  amount: number;
  date: string;
  category_id: number | null;
  subcategory_id: number | null;
  payment_mode_id: number | null;
  note: string | null;
  tags: string | null;
}

export async function getExpenses(): Promise<Expense[]> {
  const db = getDB();
  return await db.getAllAsync<Expense>('SELECT * FROM expenses ORDER BY date DESC, id DESC');
}

export async function getExpenseById(id: number): Promise<Expense | null> {
  const db = getDB();
  return await db.getFirstAsync<Expense>('SELECT * FROM expenses WHERE id = ?', [id]) ?? null;
}

export async function getExpensesByRange(from: string, to: string): Promise<Expense[]> {
  const db = getDB();
  return await db.getAllAsync<Expense>(
    'SELECT * FROM expenses WHERE date >= ? AND date <= ? ORDER BY date DESC',
    [from, to]
  );
}

export async function addExpense(expense: ExpenseInsert): Promise<number> {
  const db = getDB();
  const result = await db.runAsync(
    `INSERT INTO expenses (amount, date, category_id, subcategory_id, payment_mode_id, note, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      expense.amount,
      expense.date,
      expense.category_id,
      expense.subcategory_id,
      expense.payment_mode_id,
      expense.note,
      expense.tags,
    ]
  );
  return result.lastInsertRowId;
}

export async function updateExpense(id: number, expense: ExpenseInsert): Promise<void> {
  const db = getDB();
  await db.runAsync(
    `UPDATE expenses SET amount=?, date=?, category_id=?, subcategory_id=?, payment_mode_id=?, note=?, tags=?, updated_at=datetime('now') WHERE id=?`,
    [
      expense.amount,
      expense.date,
      expense.category_id,
      expense.subcategory_id,
      expense.payment_mode_id,
      expense.note,
      expense.tags,
      id,
    ]
  );
}

export async function deleteExpense(id: number): Promise<void> {
  const db = getDB();
  await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
}

// ─── Recurring Templates ──────────────────────────────────────────────────────

export interface RecurringTemplate {
  id: number;
  name: string;
  type: 'fixed' | 'installment' | 'variable';
  category_id: number | null;
  payment_mode_id: number | null;
  amount: number | null;
  total_periods: number | null;
  paid_periods: number;
  installment_amt: number | null;
  min_amount: number | null;
  max_amount: number | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string | null;
  next_due_date: string;
  reminder_days: number;
  reminder_on_due: number;
  status: 'active' | 'paused' | 'completed';
  note: string | null;
  created_at: string;
  updated_at: string;
}

export type RecurringTemplateInsert = Omit<RecurringTemplate, 'id' | 'created_at' | 'updated_at' | 'paid_periods' | 'status'>;

export async function getRecurringTemplates(): Promise<RecurringTemplate[]> {
  const db = getDB();
  return await db.getAllAsync<RecurringTemplate>(
    'SELECT * FROM recurring_templates ORDER BY next_due_date ASC'
  );
}

export async function getRecurringTemplateById(id: number): Promise<RecurringTemplate | null> {
  const db = getDB();
  return await db.getFirstAsync<RecurringTemplate>('SELECT * FROM recurring_templates WHERE id = ?', [id]) ?? null;
}

export async function addRecurringTemplate(template: RecurringTemplateInsert): Promise<number> {
  const db = getDB();
  const result = await db.runAsync(
    `INSERT INTO recurring_templates (
      name, type, category_id, payment_mode_id, amount, total_periods,
      installment_amt, min_amount, max_amount, frequency, start_date,
      end_date, next_due_date, reminder_days, reminder_on_due, note
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      template.name,
      template.type,
      template.category_id,
      template.payment_mode_id,
      template.amount,
      template.total_periods,
      template.installment_amt,
      template.min_amount,
      template.max_amount,
      template.frequency,
      template.start_date,
      template.end_date,
      template.next_due_date,
      template.reminder_days,
      template.reminder_on_due,
      template.note,
    ]
  );
  return result.lastInsertRowId;
}

export async function deleteRecurringTemplate(id: number): Promise<void> {
  const db = getDB();
  await db.runAsync('DELETE FROM recurring_templates WHERE id = ?', [id]);
}

/**
 * Mark a recurring template as paid for this cycle:
 * 1. Logs a payment expense entry
 * 2. Increments paid_periods
 * 3. Advances next_due_date by one frequency period
 * 4. Marks status = 'completed' if all installments are done
 */
export async function markRecurringPaid(id: number, amount: number): Promise<void> {
  const db = getDB();
  const t = await db.getFirstAsync<RecurringTemplate>(
    'SELECT * FROM recurring_templates WHERE id = ?', [id]
  );
  if (!t) throw new Error('Recurring template not found');

  const today = new Date().toISOString().split('T')[0];

  // Log as an expense entry
  await db.runAsync(
    `INSERT INTO expenses (amount, date, category_id, payment_mode_id, note)
     VALUES (?, ?, ?, ?, ?)`,
    [amount, today, t.category_id, t.payment_mode_id, `[Auto] ${t.name}`]
  );

  // Advance next_due_date
  const due  = new Date(t.next_due_date);
  switch (t.frequency) {
    case 'daily':   due.setDate(due.getDate() + 1);      break;
    case 'weekly':  due.setDate(due.getDate() + 7);      break;
    case 'monthly': due.setMonth(due.getMonth() + 1);   break;
    case 'yearly':  due.setFullYear(due.getFullYear() + 1); break;
  }
  const nextDue = due.toISOString().split('T')[0];

  const newPaid = t.paid_periods + 1;
  const isDone  = t.total_periods !== null && newPaid >= t.total_periods;

  await db.runAsync(
    `UPDATE recurring_templates
     SET paid_periods = ?, next_due_date = ?, status = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [newPaid, nextDue, isDone ? 'completed' : t.status, id]
  );
}

// ─── Recurring Entries ────────────────────────────────────────────────────────

export interface RecurringEntry {
  id: number;
  template_id: number;
  due_date: string;
  actual_amount: number | null;
  status: 'pending' | 'paid' | 'missed' | 'skipped';
  paid_date: string | null;
  note: string | null;
  created_at: string;
}

export async function getRecurringEntries(template_id: number): Promise<RecurringEntry[]> {
  const db = getDB();
  return await db.getAllAsync<RecurringEntry>(
    'SELECT * FROM recurring_entries WHERE template_id = ? ORDER BY due_date DESC',
    [template_id]
  );
}
