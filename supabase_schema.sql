
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

-- Certifique-se de que a tabela organizations tem owner_id como UUID
-- Se o erro persistir, desabilite temporariamente o RLS da tabela organizations para testar:
-- ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
