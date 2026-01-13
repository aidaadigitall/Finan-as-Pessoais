
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer'
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
  icon: string; // Lucide icon name placeholder
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  budgetLimit?: number; // Teto de gastos mensal
}

export interface Transaction {
  id: string;
  date: string; // Data do lançamento (competência)
  dueDate?: string; // Data de vencimento (para contas a pagar/receber)
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  status: TransactionStatus; // Status da auditoria IA
  isPaid: boolean; // Status financeiro (Pago/Pendente)
  source: 'whatsapp_ai' | 'manual';
  originalInput?: string;
  recurrence?: RecurrenceFrequency;
  accountId?: string; // Conta de origem/destino principal
  destinationAccountId?: string; // Para transferências
  reconciled?: boolean; // Conciliação bancária
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  type: 'text' | 'image' | 'audio';
  mediaUrl?: string;
  timestamp: Date;
  proposedTransaction?: Partial<Transaction>;
}

export interface DashboardStats {
  balance: number;
  income: number;
  expense: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success';
  read: boolean;
  date: string;
  transactionId?: string;
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
