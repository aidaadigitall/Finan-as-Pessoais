import React, { useState } from 'react';
import { Category, CategoryType } from '../types';
import { Plus, Trash2, Tag, AlertTriangle, X, Check, Target } from 'lucide-react';

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onAddCategory, onDeleteCategory }) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<CategoryType>('expense');
  const [newCategoryBudget, setNewCategoryBudget] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newCategoryName.trim()) return;
    
    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      type: newCategoryType,
      budgetLimit: newCategoryBudget ? parseFloat(newCategoryBudget) : undefined
    };

    onAddCategory(newCategory);
    setNewCategoryName('');
    setNewCategoryBudget('');
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      onDeleteCategory(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const getBadgeColor = (type: CategoryType) => {
    switch (type) {
      case 'income': return 'bg-green-100 text-green-700';
      case 'expense': return 'bg-red-100 text-red-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const getTypeLabel = (type: CategoryType) => {
     switch (type) {
      case 'income': return 'Receita';
      case 'expense': return 'Despesa';
      default: return 'Ambos';
    }
  }

  return (
    <div className="space-y-6">
      {/* Add New Category Card */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Tag size={20} className="text-indigo-600 dark:text-indigo-400" />
          Nova Categoria
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nome</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              placeholder="Ex: Combustível"
            />
          </div>
          <div>
             <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tipo</label>
             <select 
               value={newCategoryType}
               onChange={(e) => setNewCategoryType(e.target.value as CategoryType)}
               className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
             >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
                <option value="both">Ambos</option>
             </select>
          </div>
          {(newCategoryType === 'expense' || newCategoryType === 'both') && (
            <div className="animate-in fade-in">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Teto de Gastos (Opcional)</label>
                <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
                    <input
                    type="number"
                    value={newCategoryBudget}
                    onChange={(e) => setNewCategoryBudget(e.target.value)}
                    className="w-full pl-8 p-2 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm"
                    placeholder="0.00"
                    />
                </div>
            </div>
          )}
          <div className="md:col-span-4 flex justify-end mt-2">
            <button
                onClick={handleAdd}
                disabled={!newCategoryName.trim()}
                className="w-full md:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
                <Plus size={18} /> Adicionar Categoria
            </button>
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Categorias Existentes</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {categories.map((category) => (
            <div key={category.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getBadgeColor(category.type)} dark:bg-opacity-20`}>
                  {getTypeLabel(category.type)}
                </span>
                <div className="flex flex-col">
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{category.name}</span>
                    {category.budgetLimit && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Target size={10} /> Meta: R$ {category.budgetLimit.toFixed(2)}
                        </span>
                    )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                 {deleteConfirmId === category.id ? (
                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg animate-in fade-in slide-in-from-right-5 duration-200">
                       <span className="text-xs text-red-600 dark:text-red-400 font-medium mr-1">Excluir?</span>
                       <button 
                          onClick={confirmDelete}
                          className="p-1 bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-700"
                          title="Confirmar"
                       >
                          <Check size={14} />
                       </button>
                       <button 
                          onClick={() => setDeleteConfirmId(null)}
                          className="p-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                          title="Cancelar"
                       >
                          <X size={14} />
                       </button>
                    </div>
                 ) : (
                    <button
                      onClick={() => setDeleteConfirmId(category.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                      title="Excluir Categoria"
                    >
                      <Trash2 size={18} />
                    </button>
                 )}
              </div>
            </div>
          ))}
          {categories.length === 0 && (
             <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                Nenhuma categoria cadastrada.
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
