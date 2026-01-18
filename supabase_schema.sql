
-- 1. Tabelas Base de Organização
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    owner_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('owner', 'admin', 'viewer')) DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- 2. Tabelas Financeiras
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    bank_name TEXT,
    initial_balance DECIMAL(15, 2) DEFAULT 0,
    current_balance DECIMAL(15, 2) DEFAULT 0,
    color TEXT DEFAULT 'indigo',
    icon TEXT DEFAULT 'landmark',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    destination_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense', 'transfer')),
    category TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    is_paid BOOLEAN DEFAULT true,
    source TEXT DEFAULT 'manual',
    reconciled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Segurança (Multi-tenant)

-- Members pode ver suas organizações
CREATE POLICY "Users can see memberships" ON organization_members
    FOR SELECT USING (user_id = auth.uid());

-- Membros da org podem ver a org
CREATE POLICY "Members can view organization" ON organizations
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM organization_members WHERE organization_id = organizations.id AND user_id = auth.uid())
    );

-- Políticas para Bank Accounts
CREATE POLICY "Membros podem ver contas bancárias" ON bank_accounts
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM organization_members WHERE organization_id = bank_accounts.organization_id AND user_id = auth.uid())
    );

CREATE POLICY "Membros podem criar contas bancárias" ON bank_accounts
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM organization_members WHERE organization_id = bank_accounts.organization_id AND user_id = auth.uid())
    );

-- Políticas para Transações
CREATE POLICY "Membros podem ver transações" ON transactions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM organization_members WHERE organization_id = transactions.organization_id AND user_id = auth.uid())
    );

CREATE POLICY "Membros podem inserir transações" ON transactions
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM organization_members WHERE organization_id = transactions.organization_id AND user_id = auth.uid())
    );

CREATE POLICY "Membros podem atualizar transações" ON transactions
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM organization_members WHERE organization_id = transactions.organization_id AND user_id = auth.uid())
    );

-- 5. Trigger para Perfil Automático
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, split_part(new.email, '@', 1));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
