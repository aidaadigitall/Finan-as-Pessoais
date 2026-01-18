
import { supabase } from '../lib/supabase';
import { Transaction, BankAccount, Category, TransactionType, TransactionStatus, CreditCard } from '../types';

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
        status: t.status as TransactionStatus,
        isPaid: t.is_paid,
        source: t.source,
        accountId: t.account_id,
        destinationAccountId: t.destination_account_id,
        credit_card_id: t.credit_card_id,
        reconciled: t.reconciled,
        installmentId: t.installment_id,
        installmentNumber: t.installment_number,
        installmentCount: t.installment_count
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
        bankName: acc.bank_name || acc.name, // Fallback caso a coluna falhe
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

  async createTransaction(t: Partial<Transaction>, orgId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const transactionsToInsert = [];
    const installmentCount = t.installmentCount && t.installmentCount > 1 ? t.installmentCount : 1;
    const installmentId = installmentCount > 1 ? crypto.randomUUID() : null;
    const baseDate = new Date(t.date || new Date().toISOString());
    // Se for parcelado, o valor total é dividido, OU o usuário inseriu o valor da parcela. 
    // Assumiremos aqui que o modal envia o VALOR DA PARCELA já calculado ou o usuário inseriu o valor mensal.
    // Se quiséssemos dividir o total: const amountPerInstallment = t.amount! / installmentCount;
    const amount = t.amount; 

    for (let i = 0; i < installmentCount; i++) {
        const currentDate = new Date(baseDate);
        currentDate.setMonth(baseDate.getMonth() + i);
        
        // Ajuste para datas de vencimento no final do mês (ex: 31 de Jan -> 28 de Fev)
        if (currentDate.getDate() !== baseDate.getDate()) {
            currentDate.setDate(0);
        }

        const isPaid = i === 0 ? t.isPaid : false; // Geralmente só a primeira parcela é paga na hora, o resto é futuro

        transactionsToInsert.push({
            description: installmentCount > 1 ? `${t.description} (${i + 1}/${installmentCount})` : t.description,
            amount: amount,
            type: t.type,
            category: t.category,
            date: currentDate.toISOString(),
            due_date: t.dueDate ? new Date(new Date(t.dueDate).setMonth(new Date(t.dueDate).getMonth() + i)).toISOString() : currentDate.toISOString(),
            is_paid: isPaid,
            account_id: t.accountId,
            destination_account_id: t.destinationAccountId,
            credit_card_id: t.creditCardId,
            organization_id: orgId,
            user_id: user.id,
            source: t.source || 'manual',
            installment_id: installmentId,
            installment_number: installmentCount > 1 ? i + 1 : null,
            installment_count: installmentCount > 1 ? installmentCount : null
        });
    }

    const { error } = await supabase.from('transactions').insert(transactionsToInsert);
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

    if (error) {
      console.error("Erro detalhado Supabase (bank_accounts):", error);
      throw new Error(`Erro ao criar conta: ${error.message}`);
    }
  },

  async createCategory(cat: Partial<Category>, orgId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('categories').insert({
      name: cat.name,
      type: cat.type,
      parent_id: cat.parentId && !cat.parentId.startsWith('temp-') ? cat.parentId : null,
      budget_limit: cat.budgetLimit || 0,
      organization_id: orgId,
      user_id: user?.id
    });
    if (error) throw error;
  },

  async updateCreditCard(card: CreditCard, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('credit_cards')
      .update({
        name: card.name,
        brand: card.brand,
        limit: card.limit,
        closing_day: card.closingDay,
        due_day: card.dueDay
      })
      .eq('id', card.id)
      .eq('organization_id', orgId);
    
    if (error) throw error;
  }
};
