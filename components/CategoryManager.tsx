import React, { useState } from 'react';
import { Category, CategoryType } from '../types';
import { Plus, Trash2, Tag, AlertTriangle, X, Check } from 'lucide-react';

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onAddCategory, onDeleteCategory }) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<CategoryType>('expense');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newCategoryName.trim()) return;
    
    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      type: newCategoryType
    };

    onAddCategory(newCategory);
    setNewCategoryName('');
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
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Tag size={20} className="text-indigo-600" />
          Nova Categoria
        </h3>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-gray-500 mb-1">Nome</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: Combustível"
            />
          </div>
          <div className="w-full md:w-48">
             <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
             <select 
               value={newCategoryType}
               onChange={(e) => setNewCategoryType(e.target.value as CategoryType)}
               className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
             >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
                <option value="both">Ambos</option>
             </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={!newCategoryName.trim()}
            className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Adicionar
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Categorias Existentes</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {categories.map((category) => (
            <div key={category.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getBadgeColor(category.type)}`}>
                  {getTypeLabel(category.type)}
                </span>
                <span className="text-gray-800 font-medium">{category.name}</span>
              </div>
              
              <div className="flex items-center gap-2">
                 {deleteConfirmId === category.id ? (
                    <div className="flex items-center gap-2 bg-red-50 px-2 py-1 rounded-lg animate-in fade-in slide-in-from-right-5 duration-200">
                       <span className="text-xs text-red-600 font-medium mr-1">Excluir?</span>
                       <button 
                          onClick={confirmDelete}
                          className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                          title="Confirmar"
                       >
                          <Check size={14} />
                       </button>
                       <button 
                          onClick={() => setDeleteConfirmId(null)}
                          className="p-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                          title="Cancelar"
                       >
                          <X size={14} />
                       </button>
                    </div>
                 ) : (
                    <button
                      onClick={() => setDeleteConfirmId(category.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Excluir Categoria"
                    >
                      <Trash2 size={18} />
                    </button>
                 )}
              </div>
            </div>
          ))}
          {categories.length === 0 && (
             <div className="p-8 text-center text-gray-400">
                Nenhuma categoria cadastrada.
             </div>
          )}
        </div>
      </div>
    </div>
  );
};