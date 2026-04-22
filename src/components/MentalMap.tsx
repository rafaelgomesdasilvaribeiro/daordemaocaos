import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MentalMap as MentalMapType } from '../types';
import { Network, Plus, Trash2, Search, Calendar, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MentalMapCanvas } from './MentalMapCanvas';

export const MentalMap: React.FC = () => {
  const [maps, setMaps] = useState<MentalMapType[]>([]);
  const [selectedMap, setSelectedMap] = useState<MentalMapType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newMapTitle, setNewMapTitle] = useState('');

  useEffect(() => {
    fetchMaps();
  }, []);

  const fetchMaps = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('mind_maps')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (data) {
        setMaps(data as MentalMapType[]);
      }
    } catch (error) {
      console.error('Error fetching mind maps:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMapTitle.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newMap = {
        title: newMapTitle,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('mind_maps')
        .insert([newMap])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMaps([data as MentalMapType, ...maps]);
        setNewMapTitle('');
        setIsCreating(false);
        setSelectedMap(data as MentalMapType);
      }
    } catch (error) {
      console.error('Error creating mind map:', error);
    }
  };

  const handleDeleteMap = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir este mapa mental?')) return;

    try {
      await supabase.from('mind_maps').delete().eq('id', id);
      setMaps(maps.filter(m => m.id !== id));
      if (selectedMap?.id === id) {
        setSelectedMap(null);
      }
    } catch (error) {
      console.error('Error deleting map:', error);
    }
  };

  const filteredMaps = maps.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedMap) {
    return (
      <MentalMapCanvas 
        mapId={selectedMap.id} 
        mapTitle={selectedMap.title} 
        onBack={() => {
          setSelectedMap(null);
          fetchMaps(); // Refresh to get updated_at
        }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-red/20 flex items-center justify-center text-brand-red">
            <Network size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mapa Mental</h1>
            <p className="text-sm text-neutral-400">Organize suas ideias visualmente.</p>
          </div>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-brand-red text-white px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-red-600 transition-colors shadow-lg shadow-brand-red/20"
        >
          <Plus size={16} />
          <span>Novo Mapa</span>
        </button>
      </div>

      <div className="flex items-center gap-4 bg-dark-card border border-dark-border p-2 rounded-xl">
        <Search size={20} className="text-neutral-500 ml-2" />
        <input
          type="text"
          placeholder="Buscar mapas mentais..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-transparent border-none text-white placeholder-neutral-500 focus:outline-none"
        />
      </div>

      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-card border border-dark-border p-6 rounded-xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-red"></div>
          <form onSubmit={handleCreateMap} className="flex gap-4">
            <input
              type="text"
              placeholder="Título do Mapa Mental..."
              value={newMapTitle}
              onChange={(e) => setNewMapTitle(e.target.value)}
              className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red transition-colors"
              autoFocus
            />
            <button
              type="submit"
              disabled={!newMapTitle.trim()}
              className="bg-brand-red text-white px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Criar
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-wider text-neutral-400 hover:text-white hover:bg-white/5 transition-colors border border-dark-border"
            >
              Cancelar
            </button>
          </form>
        </motion.div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-dark-card border border-dark-border rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredMaps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredMaps.map((map) => (
              <motion.div
                key={map.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -5 }}
                onClick={() => setSelectedMap(map)}
                className="bg-dark-card border border-dark-border rounded-xl p-6 cursor-pointer group hover:border-brand-red/50 transition-all duration-300 relative overflow-hidden flex flex-col"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/5 rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110"></div>
                
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-dark-bg border border-dark-border flex items-center justify-center text-brand-red group-hover:scale-110 transition-transform">
                    <Network size={20} />
                  </div>
                  <button
                    onClick={(e) => handleDeleteMap(map.id, e)}
                    className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <h3 className="text-lg font-bold mb-2 group-hover:text-brand-red transition-colors line-clamp-1">{map.title}</h3>
                
                <div className="mt-auto flex items-center gap-2 text-xs text-neutral-500">
                  <Calendar size={12} />
                  <span>Atualizado em {new Date(map.updated_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-20 bg-dark-card border border-dark-border rounded-xl">
          <Network size={48} className="mx-auto text-neutral-600 mb-4" />
          <h3 className="text-lg font-bold text-neutral-300 mb-2">Nenhum mapa mental</h3>
          <p className="text-neutral-500 max-w-sm mx-auto">
            {searchTerm ? 'Nenhum mapa mental encontrado para a busca.' : 'Crie seu primeiro mapa mental para começar a organizar suas ideias visualmente.'}
          </p>
        </div>
      )}
    </div>
  );
};
