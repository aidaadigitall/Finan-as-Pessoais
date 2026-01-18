
-- Garanta que estas políticas existam no seu painel do Supabase (SQL Editor)

-- Permite que usuários autenticados criem suas próprias organizações
CREATE POLICY "Users can create their own organizations" ON organizations
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Permite que membros da organização criem vínculos (necessário para o owner se auto-vincular)
CREATE POLICY "Users can insert their own membership" ON organization_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Permite atualização do perfil pelo próprio usuário
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- CRIAÇÃO DA TABELA DE CARTÕES DE CRÉDITO
CREATE TABLE IF NOT EXISTS public.credit_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    "limit" NUMERIC NOT NULL DEFAULT 0,
    closing_day INTEGER NOT NULL,
    due_day INTEGER NOT NULL,
    color TEXT,
    account_id UUID REFERENCES public.bank_accounts(id)
);

-- Habilita RLS para cartões
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para cartões (baseado na organização)
CREATE POLICY "Organization members can view credit cards" ON public.credit_cards
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can insert credit cards" ON public.credit_cards
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can update credit cards" ON public.credit_cards
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can delete credit cards" ON public.credit_cards
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    );

-- ATUALIZAÇÃO DA TABELA DE TRANSAÇÕES (Adiciona todas as colunas necessárias)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS installment_id UUID;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS installment_number INTEGER;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS installment_count INTEGER;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS credit_card_id UUID REFERENCES public.credit_cards(id);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS reconciled BOOLEAN DEFAULT false;
