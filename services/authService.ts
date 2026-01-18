
import { getSupabase, getURL } from '../lib/supabase';

export const authService = {
  async signInWithGoogle() {
    const { data, error } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getURL() },
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string) {
    const { data, error } = await getSupabase().auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await getSupabase().auth.signOut();
    if (error) throw error;
  },

  async getUserSession() {
    const { data: { session }, error } = await getSupabase().auth.getSession();
    if (error) throw error;
    return session;
  },

  async ensureUserResources(userId: string, email: string) {
    const supabase = getSupabase();
    
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
