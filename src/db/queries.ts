import { getDB } from './index';
import * as SQLite from 'expo-sqlite';

// Categories
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

// Payment Modes
export interface PaymentMode {
  id: number;
  name: string;
  is_system: number;
}

export async function getPaymentModes(): Promise<PaymentMode[]> {
  const db = getDB();
  return await db.getAllAsync<PaymentMode>('SELECT * FROM payment_modes ORDER BY name ASC');
}

// Expenses
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
      expense.tags
    ]
  );
  return result.lastInsertRowId;
}

export async function deleteExpense(id: number): Promise<void> {
  const db = getDB();
  await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
}

// Recurring Templates
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
  return await db.getAllAsync<RecurringTemplate>('SELECT * FROM recurring_templates ORDER BY next_due_date ASC');
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
      template.note
    ]
  );
  return result.lastInsertRowId;
}

export async function deleteRecurringTemplate(id: number): Promise<void> {
  const db = getDB();
  await db.runAsync('DELETE FROM recurring_templates WHERE id = ?', [id]);
}
