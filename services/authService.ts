
import { supabase, getURL, isSupabaseConfigured } from '../lib/supabase';

const checkSupabase = () => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
};

export const authService = {
  async signInWithGoogle() {
    checkSupabase();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getURL(),
      },
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    checkSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string) {
    checkSupabase();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    if (!isSupabaseConfigured()) return;
    await supabase.auth.signOut();
  },

  async bootstrapUserOrganization(userId: string, email: string) {
    try {
        checkSupabase();
        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', userId)
          .maybeSingle();

        if (membership) return membership.organization_id;

        const orgName = `Empresa de ${email.split('@')[0]}`;
        const slug = `${email.split('@')[0]}-${Math.random().toString(36).substring(7)}`;

        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: orgName,
            slug: slug,
            owner_id: userId
          })
          .select()
          .single();

        if (orgError) throw orgError;

        await supabase
          .from('organization_members')
          .insert({
            organization_id: org.id,
            user_id: userId,
            role: 'owner'
          });

        return org.id;
    } catch (err) {
        console.error("Falha ao provisionar organização no Supabase. Tabelas podem não existir.", err);
        throw err;
    }
  }
};
