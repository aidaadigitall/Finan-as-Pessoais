
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
  CREDIT_CARD_PAYMENT = 'credit_card_payment'
}

export enum TransactionStatus {
  PENDING_AUDIT = 'pending_audit',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  AUDITED = 'audited'
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
  accountId: string; 
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  budgetLimit?: number;
  parentId?: string; // ID da categoria pai para subcategorias
}

export interface Transaction {
  id: string;
  date: string;
  dueDate?: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  categoryId?: string;
  status: TransactionStatus;
  isPaid: boolean;
  source: 'whatsapp_ai' | 'manual' | 'import';
  originalInput?: string;
  recurrence?: RecurrenceFrequency;
  accountId?: string;
  destinationAccountId?: string;
  creditCardId?: string;
  reconciled?: boolean;
  attachmentUrl?: string; // Novo campo para comprovante
  amountChangeReason?: string; // Justificativa de acréscimo
  
  // Campos de Parcelamento
  installmentId?: string; // ID único que agrupa todas as parcelas
  installmentNumber?: number; // Número da parcela atual (1, 2, 3...)
  installmentCount?: number; // Total de parcelas (12)
}

export type ThemeColor = 'indigo' | 'blue' | 'emerald' | 'violet' | 'rose';

export interface AIRule {
  keyword: string;
  category: string;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  content: string;
  type: 'text' | 'image' | 'audio';
  timestamp: Date;
  mediaUrl?: string;
  proposedTransaction?: Partial<Transaction>;
}

export interface WhatsAppConfig {
  status: 'connected' | 'disconnected';
  phoneNumber?: string;
  instanceId?: string;
}

export interface ApiKeysConfig {
  openai?: string;
  gemini?: string;
  anthropic?: string;
  copilot?: string;
  grok?: string;
  deepseek?: string;
}

export interface SystemSettings {
  companyName: string;
  logoUrl?: string; // Logo interna (Dashboard)
  loginLogoUrl?: string; // Logo externa (Login)
  themeColor: ThemeColor;
  apiKeys: ApiKeysConfig;
  whatsapp: WhatsAppConfig;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'owner' | 'admin' | 'viewer';
}
