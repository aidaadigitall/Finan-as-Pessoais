
import { supabase } from '../lib/supabase';
import { Transaction, BankAccount, Category, TransactionType, TransactionStatus, CreditCard } from '../types';

const sanitizeId = (id: string | undefined | null) => {
  if (!id || id === 'undefined' || (typeof id === 'string' && id.trim() === '')) return null;
  return id;
};

export const financialService = {
  async getTransactions(orgId: string): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('organization_id', orgId)
        .order('date', { ascending: false });

      if (error) throw error;
      return (data || []).map(t => ({
        id: t.id,
        date: t.date,
        dueDate: t.due_date,
        description: t.description,
        amount: Number(t.amount),
        type: t.type as TransactionType,
        category: t.category,
        categoryId: t.category_id, // Ensure categoryId is mapped if available in DB
        status: t.status as TransactionStatus,
        isPaid: t.is_paid,
        source: t.source,
        accountId: t.account_id,
        destinationAccountId: t.destination_account_id,
        creditCardId: t.credit_card_id,
        reconciled: t.reconciled,
        installmentId: t.installment_id,
        installmentNumber: t.installment_number,
        installmentCount: t.installment_count,
        attachmentUrl: t.attachment_url
      }));
    } catch (e) {
      console.error("Erro ao carregar transações:", e);
      return [];
    }
  },

  async getBankAccounts(orgId: string): Promise<BankAccount[]> {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('organization_id', orgId);
      
      if (error) throw error;
      return (data || []).map(acc => ({
        id: acc.id,
        name: acc.name,
        bankName: acc.bank_name || acc.name,
        initialBalance: Number(acc.initial_balance),
        currentBalance: Number(acc.current_balance),
        color: acc.color,
        icon: acc.icon || 'landmark'
      }));
    } catch (e) {
      console.error("Erro ao carregar contas:", e);
      return [];
    }
  },

  async getCategories(orgId: string): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('organization_id', orgId);
      
      if (error) throw error;
      return (data || []).map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        parentId: c.parent_id,
        budgetLimit: c.budget_limit
      }));
    } catch (e) {
      console.error("Erro ao carregar categorias:", e);
      return [];
    }
  },

  async getCreditCards(orgId: string): Promise<CreditCard[]> {
    try {
      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('organization_id', orgId);
      
      if (error) throw error;

      return (data || []).map(c => ({
        id: c.id,
        name: c.name,
        brand: c.brand,
        limit: Number(c.limit),
        usedLimit: 0,
        closingDay: c.closing_day,
        dueDay: c.due_day,
        color: c.color || 'indigo',
        accountId: c.account_id
      }));
    } catch (e) {
      console.error("Erro ao carregar cartões:", e);
      return [];
    }
  },

  async createTransaction(t: Partial<Transaction>, orgId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const transactionsToInsert = [];
    const installmentCount = t.installmentCount && t.installmentCount > 1 ? t.installmentCount : 1;
    const installmentId = installmentCount > 1 ? crypto.randomUUID() : null;
    const baseDate = new Date(t.date || new Date().toISOString());
    const amount = t.amount; 

    for (let i = 0; i < installmentCount; i++) {
        const currentDate = new Date(baseDate);
        currentDate.setMonth(baseDate.getMonth() + i);
        
        if (currentDate.getDate() !== baseDate.getDate()) {
            currentDate.setDate(0);
        }

        const isPaid = i === 0 ? t.isPaid : false;

        transactionsToInsert.push({
            description: installmentCount > 1 ? `${t.description} (${i + 1}/${installmentCount})` : t.description,
            amount: amount,
            type: t.type,
            category: t.category,
            // category_id: t.categoryId, // Ensure column exists in DB if used
            date: currentDate.toISOString(),
            due_date: t.dueDate ? new Date(new Date(t.dueDate).setMonth(new Date(t.dueDate).getMonth() + i)).toISOString() : currentDate.toISOString(),
            is_paid: isPaid,
            account_id: sanitizeId(t.accountId),
            destination_account_id: sanitizeId(t.destinationAccountId),
            credit_card_id: sanitizeId(t.creditCardId),
            organization_id: orgId,
            user_id: user.id,
            source: t.source || 'manual',
            installment_id: installmentId,
            installment_number: installmentCount > 1 ? i + 1 : null,
            installment_count: installmentCount > 1 ? installmentCount : null,
            attachment_url: t.attachmentUrl
        });
    }

    const { error } = await supabase.from('transactions').insert(transactionsToInsert);
    if (error) throw error;
  },

  async updateTransaction(t: Transaction, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .update({
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        // category_id: t.categoryId, 
        date: t.date,
        due_date: t.dueDate,
        is_paid: t.isPaid,
        account_id: sanitizeId(t.accountId),
        destination_account_id: sanitizeId(t.destinationAccountId),
        credit_card_id: sanitizeId(t.creditCardId),
        source: t.source,
        attachment_url: t.attachmentUrl
      })
      .eq('id', t.id)
      .eq('organization_id', orgId);

    if (error) throw error;
  },

  async createBankAccount(acc: Partial<BankAccount>, orgId: string): Promise<void> {
    if (!orgId) throw new Error("ID da organização não encontrado");

    const payload = {
      name: acc.name,
      bank_name: acc.bankName,
      initial_balance: acc.initialBalance || 0,
      current_balance: acc.initialBalance || 0,
      color: acc.color || 'indigo',
      organization_id: orgId
    };

    const { error } = await supabase
      .from('bank_accounts')
      .insert(payload);

    if (error) throw error;
  },

  async createCategory(cat: Partial<Category>, orgId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('categories').insert({
      name: cat.name,
      type: cat.type,
      parent_id: sanitizeId(cat.parentId) && !cat.parentId?.startsWith('temp-') ? cat.parentId : null,
      budget_limit: cat.budgetLimit || 0,
      organization_id: orgId,
      user_id: user?.id
    });
    if (error) throw error;
  },

  async createCreditCard(card: Partial<CreditCard>, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('credit_cards')
      .insert({
        name: card.name,
        brand: card.brand,
        "limit": card.limit, 
        closing_day: card.closingDay,
        due_day: card.dueDay,
        color: card.color,
        account_id: sanitizeId(card.accountId),
        organization_id: orgId
      });
    
    if (error) throw error;
  },

  async updateCreditCard(card: CreditCard, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('credit_cards')
      .update({
        name: card.name,
        brand: card.brand,
        "limit": card.limit,
        closing_day: card.closingDay,
        due_day: card.dueDay,
        color: card.color,
        account_id: sanitizeId(card.accountId)
      })
      .eq('id', card.id)
      .eq('organization_id', orgId);
    
    if (error) throw error;
  },

  async deleteCreditCard(id: string): Promise<void> {
    const { error } = await supabase
      .from('credit_cards')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};
