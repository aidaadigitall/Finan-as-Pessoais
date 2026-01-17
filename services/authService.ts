
import { supabase } from '../lib/supabase';

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  // Cria uma organização padrão se o usuário não tiver uma
  async createInitialOrg(userId: string) {
    const slug = `org-${Math.random().toString(36).substring(7)}`;
    
    // 1. Criar Org
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ 
        name: 'Minha Empresa', 
        slug: slug,
        owner_id: userId 
      })
      .select()
      .single();

    if (orgError) throw orgError;

    // 2. Adicionar usuário como Owner
    await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: userId,
        role: 'owner'
      });

    return org;
  }
};
