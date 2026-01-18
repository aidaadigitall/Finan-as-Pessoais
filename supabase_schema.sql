
-- ... (código existente) ...

-- CORREÇÃO DEFINITIVA DE FOREIGN KEYS
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_account_id_fkey;

ALTER TABLE public.transactions ALTER COLUMN account_id DROP NOT NULL;
ALTER TABLE public.transactions ALTER COLUMN destination_account_id DROP NOT NULL;
ALTER TABLE public.transactions ALTER COLUMN credit_card_id DROP NOT NULL;

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

-- NOVO CAMPO PARA COMPROVANTE
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS attachment_url TEXT;
