
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
  CREDIT_CARD = 'credit_card'
}

export enum TransactionStatus {
  PENDING_AUDIT = 'pending_audit',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected'
}

export type CategoryType = 'income' | 'expense' | 'both';

export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual';

export const RecurrenceLabels: Record<RecurrenceFrequency, string> = {
  none: 'Única',
  daily: 'Diária',
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual'
};

export interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  initialBalance: number;
  currentBalance: number;
  color: string;
  icon: string;
}

export interface CreditCard {
  id: string;
  name: string;
  brand: 'visa' | 'mastercard' | 'elo' | 'amex';
  limit: number;
  usedLimit: number;
  closingDay: number;
  dueDay: number;
  color: string;
  accountId: string; // Conta débito para pagamento
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  budgetLimit?: number;
}

export interface Transaction {
  id: string;
  date: string;
  dueDate?: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  status: TransactionStatus;
  isPaid: boolean;
  source: 'whatsapp_ai' | 'manual' | 'import';
  originalInput?: string;
  recurrence?: RecurrenceFrequency;
  accountId?: string;
  destinationAccountId?: string;
  creditCardId?: string;
  reconciled?: boolean;
}

export type ThemeColor = 'indigo' | 'blue' | 'emerald' | 'violet' | 'rose';

export interface AIRule {
  keyword: string;
  category: string;
}

export interface WhatsAppConfig {
  status: 'connected' | 'disconnected' | 'connecting';
  phoneNumber: string | null;
  instanceId: string | null;
}

// Added missing ChatMessage interface
export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  content: string;
  type: 'text' | 'image' | 'audio';
  timestamp: Date;
  mediaUrl?: string;
  proposedTransaction?: Partial<Transaction>;
}
