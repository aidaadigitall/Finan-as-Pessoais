import { supabase } from '../lib/supabase';

export const authService = {
  async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    
    if (data.user) {
      // Criar perfil
      await supabase.from('profiles').insert({ id: data.user.id, name });
      
      // Criar organização padrão
      const { data: org } = await supabase.from('organizations')
        .insert({ name: `Minha Empresa`, owner_id: data.user.id, slug: `slug-${Date.now()}` })
        .select()
        .single();
        
      if (org) {
        await supabase.from('organization_members').insert({
          organization_id: org.id,
          user_id: data.user.id,
          role: 'owner'
        });
      }
    }
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }
};
