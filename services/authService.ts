
import { supabase } from '../lib/supabase';

export const authService = {
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getUserSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Novo método para buscar perfil completo
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) return null;
    return data;
  },

  // Novo método para salvar perfil
  async updateProfile(userId: string, updates: { full_name?: string; avatar_url?: string }) {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    
    if (error) throw error;
  },

  async ensureUserResources(userId: string, email: string) {
    // 1. Verificar perfil existente
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      await supabase.from('profiles').insert({ 
        id: userId, 
        email, 
        full_name: email.split('@')[0] 
      });
    }

    // 2. Verificar se o usuário já pertence a uma organização
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (membership) return membership.organization_id;

    // 3. Criar Organização com SLUG
    const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const uniqueSlug = `${emailPrefix}-${Math.random().toString(36).substring(2, 7)}`;
    const orgName = `Empresa de ${email.split('@')[0]}`;

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ 
        name: orgName, 
        owner_id: userId,
        slug: uniqueSlug
      })
      .select()
      .single();

    if (orgError) {
      console.error("Erro ao criar organização:", orgError);
      
      const { data: ownedOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle();
      
      if (ownedOrg) {
         await supabase.from('organization_members').upsert({
            organization_id: ownedOrg.id,
            user_id: userId,
            role: 'owner'
         });
         return ownedOrg.id;
      }
      throw orgError;
    }

    // 4. Criar Vínculo de Membro
    const { error: memberError } = await supabase.from('organization_members').insert({
      organization_id: org.id,
      user_id: userId,
      role: 'owner'
    });

    if (memberError) throw memberError;

    return org.id;
  }
};
