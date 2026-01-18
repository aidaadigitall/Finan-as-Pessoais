
import React, { useState, useMemo } from 'react';
import { Category, CategoryType } from '../types';
import { Plus, Trash2, Tag, AlertTriangle, X, Check, Target, Edit2, Save, ChevronRight, Layers } from 'lucide-react';

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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editBudgetInput, setEditBudgetInput] = useState('');

  // Filtra apenas categorias que podem ser "Pai" (categorias sem pai)
  const parentCategories = useMemo(() => 
    categories.filter(c => !c.parentId),
    [categories]
  );

  const handleAdd = () => {
    if (!newCategoryName.trim()) return;
    
    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      type: newCategoryType,
      parentId: selectedParentId || undefined,
      budgetLimit: newCategoryBudget ? parseFloat(newCategoryBudget) : undefined
    };

    onAddCategory(newCategory);
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-widest">Nome</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-white"
              placeholder="Ex: Supermercado"
            />
          </div>
          <div>
             <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-widest">Categoria Pai</label>
             <select 
               value={selectedParentId}
               onChange={(e) => {
                 setSelectedParentId(e.target.value);
                 if(e.target.value) {
                    const parent = categories.find(c => c.id === e.target.value);
                    if(parent) setNewCategoryType(parent.type);
                 }
               }}
               className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-white"
             >
                <option value="">Nenhuma (Categoria Principal)</option>
                {parentCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
          </div>
          <div>
             <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-widest">Tipo</label>
             <select 
               disabled={!!selectedParentId}
               value={newCategoryType}
               onChange={(e) => setNewCategoryType(e.target.value as CategoryType)}
               className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-white disabled:opacity-50"
             >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
                <option value="both">Ambos</option>
             </select>
          </div>
          <div>
            <button
                onClick={handleAdd}
                disabled={!newCategoryName.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
                <Plus size={18} /> Criar
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-700 dark:text-gray-200">Estrutura Hierárquica</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {hierarchy.map((parent) => (
            <div key={parent.id} className="flex flex-col">
              <div className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition group">
                <div className="flex items-center gap-3">
                   <Tag size={18} className="text-indigo-500" />
                   <span className="font-bold text-gray-800 dark:text-white">{parent.name}</span>
                   <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 uppercase font-black">{parent.type}</span>
                </div>
                <button onClick={() => onDeleteCategory(parent.id)} className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                  <Trash2 size={16} />
                </button>
              </div>
              
              {/* Subcategorias */}
              {parent.subs.length > 0 && (
                <div className="bg-gray-50/50 dark:bg-gray-900/20 pl-10 pr-4 pb-2">
                  {parent.subs.map(sub => (
                    <div key={sub.id} className="py-2 flex items-center justify-between border-l border-gray-200 dark:border-gray-700 pl-4 group">
                      <div className="flex items-center gap-2">
                        <ChevronRight size={14} className="text-gray-300" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{sub.name}</span>
                      </div>
                      <button onClick={() => onDeleteCategory(sub.id)} className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
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
