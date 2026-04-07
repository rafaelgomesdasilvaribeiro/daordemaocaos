import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Folder, Layout, Type, AlignLeft, Palette, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: { name: string; description: string; color: string }) => void;
  initialData?: { name: string; description: string; color: string };
}

const COLORS = [
  { name: 'Vermelho', value: 'text-brand-red', bg: 'bg-brand-red/10', border: 'border-brand-red' },
  { name: 'Azul', value: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400' },
  { name: 'Verde', value: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400' },
  { name: 'Roxo', value: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400' },
  { name: 'Laranja', value: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400' },
  { name: 'Rosa', value: 'text-pink-400', bg: 'bg-pink-400/10', border: 'border-pink-400' },
];

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [selectedColor, setSelectedColor] = React.useState(COLORS[0]);

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      const color = COLORS.find(c => c.value === initialData.color) || COLORS[0];
      setSelectedColor(color);
    } else {
      setName('');
      setDescription('');
      setSelectedColor(COLORS[0]);
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name,
      description,
      color: selectedColor.value,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-dark-card border border-dark-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", selectedColor.bg)}>
                  <Folder className={selectedColor.value} size={20} />
                </div>
                <h3 className="text-lg font-bold">{initialData ? 'Editar Projeto' : 'Criar Novo Projeto'}</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                  <Type size={14} />
                  Nome do Projeto
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Redesign do Site"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm text-white [.light_&]:text-neutral-900 placeholder:text-neutral-600 focus:outline-none focus:border-brand-red transition-all"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                  <AlignLeft size={14} />
                  Descrição (Opcional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva brevemente o objetivo deste projeto..."
                  rows={3}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm text-white [.light_&]:text-neutral-900 placeholder:text-neutral-600 focus:outline-none focus:border-brand-red transition-all resize-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                  <Palette size={14} />
                  Cor do Projeto
                </label>
                <div className="grid grid-cols-6 gap-3">
                  {COLORS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "h-10 rounded-xl transition-all border-2 flex items-center justify-center",
                        color.bg,
                        selectedColor.name === color.name 
                          ? cn(color.border, "scale-110 shadow-lg") 
                          : "border-transparent hover:scale-105"
                      )}
                      title={color.name}
                    >
                      <div className={cn("w-3 h-3 rounded-full", color.value.replace('text', 'bg'))} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-dark-bg border-t border-dark-border flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-bold text-neutral-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
                <button
                  onClick={handleSave}
                  disabled={!name.trim()}
                  className="bg-brand-red hover:bg-brand-red-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
                >
                  {initialData ? <Plus size={18} /> : <Plus size={18} />}
                  {initialData ? 'Salvar Alterações' : 'Criar Projeto'}
                </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
