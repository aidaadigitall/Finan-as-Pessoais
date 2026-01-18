
import { supabase, isConfigured } from '../lib/supabase';
import { SystemSettings } from '../types';

export const settingsService = {
  async getSettings(orgId: string): Promise<Partial<SystemSettings> | null> {
    if (!isConfigured) return null;
    
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('settings, name') // Pegamos o nome da tabela também para garantir consistência
        .eq('id', orgId)
        .single();

      if (error) throw error;

      // Mescla o nome da tabela (fonte da verdade) com o JSON de settings
      const dbSettings = data.settings || {};
      
      return {
        ...dbSettings,
        companyName: data.name || dbSettings.companyName || 'Minha Empresa'
      };
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      return null;
    }
  },

  async updateSettings(orgId: string, settings: SystemSettings): Promise<void> {
    if (!isConfigured) return;

    try {
      // Separa o nome da empresa (coluna dedicada) do resto das configurações (JSON)
      const { companyName, ...jsonSettings } = settings;

      const { error } = await supabase
        .from('organizations')
        .update({
          name: companyName,
          settings: jsonSettings
        })
        .eq('id', orgId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      throw error;
    }
  }
};
