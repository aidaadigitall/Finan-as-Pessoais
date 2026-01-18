
-- ... (código existente) ...

-- CORREÇÃO DEFINITIVA DE FOREIGN KEYS (Execute este bloco no SQL Editor)

-- 1. Remove constraints antigas que podem estar forçando NOT NULL ou integridade rígida
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_account_id_fkey;

-- 2. Garante que as colunas aceitem NULL (essencial para cartões de crédito e importações parciais)
ALTER TABLE public.transactions ALTER COLUMN account_id DROP NOT NULL;
ALTER TABLE public.transactions ALTER COLUMN destination_account_id DROP NOT NULL;
ALTER TABLE public.transactions ALTER COLUMN credit_card_id DROP NOT NULL;

-- 3. Recria as constraints com ON DELETE SET NULL
-- Isso impede que excluir uma conta bancária quebre o sistema (o lançamento apenas fica "sem conta")
ALTER TABLE public.transactions 
    ADD CONSTRAINT transactions_account_id_fkey 
    FOREIGN KEY (account_id) 
    REFERENCES public.bank_accounts(id) 
    ON DELETE SET NULL;

ALTER TABLE public.transactions 
    ADD CONSTRAINT transactions_destination_account_id_fkey 
    FOREIGN KEY (destination_account_id) 
    REFERENCES public.bank_accounts(id) 
    ON DELETE SET NULL;
