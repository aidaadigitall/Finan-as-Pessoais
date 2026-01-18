
import React, { useState, useMemo } from 'react';
import { Category, CategoryType } from '../types';
import { Plus, Trash2, Tag, AlertTriangle, X, Check, Target, Edit2, Save, ChevronRight, Layers, DollarSign } from 'lucide-react';

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (category: Category) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onAddCategory, onUpdateCategory, onDeleteCategory }) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<CategoryType>('expense');
  const [newCategoryBudget, setNewCategoryBudget] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');

  // Filtra apenas categorias que podem ser "Pai" (categorias sem pai)
  const parentCategories = useMemo(() => 
    categories.filter(c => !c.parentId),
    [categories]
  );

  const handleAdd = () => {
    if (!newCategoryName.trim()) return;
    
    // O ID temporário aqui não é enviado ao banco, o Supabase gera o UUID oficial
    const newCategory: Category = {
      id: Date.now().toString(), 
      name: newCategoryName.trim(),
      type: newCategoryType,
      parentId: selectedParentId || undefined,
      budgetLimit: newCategoryBudget ? parseFloat(newCategoryBudget) : undefined
    };

    onAddCategory(newCategory);
    
    // Reset form
    setNewCategoryName('');
    setNewCategoryBudget('');
    setSelectedParentId('');
  };

  const getCategoryHierarchy = () => {
    const main = categories.filter(c => !c.parentId);
    return main.map(parent => ({
      ...parent,
      subs: categories.filter(c => c.parentId === parent.id)
    }));
  };

  const hierarchy = getCategoryHierarchy();

  return (
    <div className="space-y-6 relative">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Layers size={20} className="text-indigo-600" />
          Nova Categoria ou Subcategoria
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Nome */}
          <div className="md:col-span-4 space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nome</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: Supermercado"
            />
          </div>

          {/* Categoria Pai */}
          <div className="md:col-span-3 space-y-1">
             <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Hierarquia</label>
             <select 
               value={selectedParentId}
               onChange={(e) => {
                 setSelectedParentId(e.target.value);
                 if(e.target.value) {
                    const parent = categories.find(c => c.id === e.target.value);
                    if(parent) setNewCategoryType(parent.type);
                 }
               }}
               className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
             >
                <option value="">Principal (Sem Pai)</option>
                {parentCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
          </div>

          {/* Tipo */}
          <div className="md:col-span-2 space-y-1">
             <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Tipo</label>
             <select 
               disabled={!!selectedParentId}
               value={newCategoryType}
               onChange={(e) => setNewCategoryType(e.target.value as CategoryType)}
               className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
             >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
                <option value="both">Ambos</option>
             </select>
          </div>

          {/* Orçamento (Budget) - Novo Campo */}
          <div className="md:col-span-2 space-y-1">
             <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Meta Mensal</label>
             <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
                <input
                  type="number"
                  value={newCategoryBudget}
                  onChange={(e) => setNewCategoryBudget(e.target.value)}
                  className="w-full p-2.5 pl-8 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
             </div>
          </div>

          {/* Botão */}
          <div className="md:col-span-1">
            <button
                onClick={handleAdd}
                disabled={!newCategoryName.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none"
                title="Criar Categoria"
            >
                <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Target size={18} className="text-gray-400"/> Estrutura de Contas
          </h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {hierarchy.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Nenhuma categoria cadastrada.</div>
          ) : hierarchy.map((parent) => (
            <div key={parent.id} className="flex flex-col">
              <div className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition group">
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-lg ${parent.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      <Tag size={16} />
                   </div>
                   <div>
                      <p className="font-bold text-gray-800 dark:text-white leading-none">{parent.name}</p>
                      {parent.budgetLimit ? (
                         <p className="text-[10px] text-gray-400 mt-1 font-medium">Meta: R$ {parent.budgetLimit.toFixed(2)}</p>
                      ) : null}
                   </div>
                </div>
                <button onClick={() => onDeleteCategory(parent.id)} className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <Trash2 size={16} />
                </button>
              </div>
              
              {/* Subcategorias */}
              {parent.subs.length > 0 && (
                <div className="bg-gray-50/50 dark:bg-gray-900/20 pl-12 pr-4 pb-2 pt-1 border-t border-gray-50 dark:border-gray-800">
                  {parent.subs.map(sub => (
                    <div key={sub.id} className="py-2 flex items-center justify-between border-l-2 border-gray-200 dark:border-gray-700 pl-3 hover:border-indigo-400 transition-colors group/sub">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{sub.name}</span>
                        {sub.budgetLimit && <span className="text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500">Meta: {sub.budgetLimit}</span>}
                      </div>
                      <button onClick={() => onDeleteCategory(sub.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover/sub:opacity-100 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
