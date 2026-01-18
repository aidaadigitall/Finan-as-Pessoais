
import { supabase } from '../lib/supabase';

export const authService = {
  async signInWithGoogle() {
    // getURL was not exported from lib/supabase, using window.location.origin as a standard redirect
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

  async ensureUserResources(userId: string, email: string) {
    // 1. Verificar perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      await supabase.from('profiles').insert({ id: userId, email, full_name: email.split('@')[0] });
    }

    // 2. Verificar organização (tenant)
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (membership) return membership.organization_id;

    // 3. Criar nova organização se não existir
    const orgName = `Empresa de ${email.split('@')[0]}`;
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: orgName, owner_id: userId })
      .select()
      .single();

    if (orgError) throw orgError;

    await supabase.from('organization_members').insert({
      organization_id: org.id,
      user_id: userId,
      role: 'owner'
    });

    return org.id;
  }
};
