
const PREFIX = 'finai_offline_';

export const offlineService = {
  save(key: string, data: any) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(data));
    } catch (e) {
      console.error('Erro ao salvar localmente:', e);
    }
  },

  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(PREFIX + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  clearAll() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k));
  }
};
