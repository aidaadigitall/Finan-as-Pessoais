
-- CORREÇÃO DEFINITIVA DE FOREIGN KEYS E COLUNAS
-- Primeiro removemos as constraints antigas para garantir que serão recriadas corretamente
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_account_id_fkey;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_destination_account_id_fkey;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_credit_card_id_fkey;

-- Garante que as colunas permitam NULL (importante para exclusões lógicas e tipos variados de transação)
ALTER TABLE public.transactions ALTER COLUMN account_id DROP NOT NULL;
ALTER TABLE public.transactions ALTER COLUMN destination_account_id DROP NOT NULL;
ALTER TABLE public.transactions ALTER COLUMN credit_card_id DROP NOT NULL;

-- Recria as constraints apontando corretamente para as tabelas
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

ALTER TABLE public.transactions 
    ADD CONSTRAINT transactions_credit_card_id_fkey 
    FOREIGN KEY (credit_card_id) 
    REFERENCES public.credit_cards(id) 
    ON DELETE SET NULL;

-- Garante campo para comprovante
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Garante campo para justificativa de alteração de valor
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS amount_change_reason TEXT;

-- Garante campo para configurações na organização
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
