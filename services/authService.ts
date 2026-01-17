
import { getSupabase, isSupabaseConfigured, getURL } from '../lib/supabase';

export const authService = {
  async signInWithGoogle() {
    if (!isSupabaseConfigured()) throw new Error("Supabase não configurado");
    const { data, error } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getURL(),
      },
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured()) throw new Error("Supabase não configurado");
    const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string) {
    if (!isSupabaseConfigured()) throw new Error("Supabase não configurado");
    const { data, error } = await getSupabase().auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    if (!isSupabaseConfigured()) return;
    const { error } = await getSupabase().auth.signOut();
    if (error) throw error;
  },

  async bootstrapUserOrganization(userId: string, email: string) {
    if (!isSupabaseConfigured()) throw new Error("Supabase não configurado");
    const client = getSupabase();
    
    const { data: membership } = await client
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (membership) return membership.organization_id;

    const orgName = `Empresa de ${email.split('@')[0]}`;
    const slug = `${email.split('@')[0]}-${Math.random().toString(36).substring(7)}`;

    const { data: org, error: orgError } = await client
      .from('organizations')
      .insert({ name: orgName, slug: slug, owner_id: userId })
      .select()
      .single();

    if (orgError) throw orgError;

    await client
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: userId,
        role: 'owner'
      });

    return org.id;
  }
};
