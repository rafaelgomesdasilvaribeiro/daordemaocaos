import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Maximize, Target, ZoomIn, ZoomOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { cn } from '../lib/utils';

interface VisionBoardItem {
  id: string;
  image_url: string;
  position_x: number;
  position_y: number;
  z_index: number;
  width?: number;
}

export const LawOfAttraction: React.FC = () => {
  const [items, setItems] = useState<VisionBoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetchItems();
  }, [session]);

  const fetchItems = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('vision_board_items')
      .select('*')
      .eq('user_id', session?.user?.id)
      .order('z_index', { ascending: true });

    if (!error && data) {
      setItems(data as VisionBoardItem[]);
    }
    setIsLoading(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session?.user?.id) return;

    // Convert file to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const newItem = {
        image_url: base64String,
        position_x: window.innerWidth / 2 - 100, // Center initially
        position_y: window.innerHeight / 2 - 100,
        z_index: items.length > 0 ? Math.max(...items.map(i => i.z_index)) + 1 : 1,
        width: 250,
        user_id: session.user.id
      };

      const { data, error } = await supabase
        .from('vision_board_items')
        .insert([newItem])
        .select()
        .single();

      if (!error && data) {
        setItems(prev => [...prev, data as VisionBoardItem]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragEnd = async (id: string, info: any) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    // The info.point is absolute, we should ideally track the offset, but framer-motion 
    // provides the final layout x/y after drag ends if we read it, or we just rely on `onDrag` delta
    // A better approach for framer-motion is updating based on the internal transform
    // Actually, `info.offset.x` + `position_x` works if we add the offset to the previous relative coordinate.
    
    const newX = item.position_x + info.offset.x;
    const newY = item.position_y + info.offset.y;

    setItems(prev => prev.map(i => i.id === id ? { ...i, position_x: newX, position_y: newY } : i));

    await supabase
      .from('vision_board_items')
      .update({ position_x: newX, position_y: newY })
      .eq('id', id);
  };

  const handleDelete = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    await supabase.from('vision_board_items').delete().eq('id', id);
  };

  const bringToFront = async (id: string) => {
    const maxZ = items.length > 0 ? Math.max(...items.map(i => i.z_index)) : 0;
    const newZ = maxZ + 1;
    setItems(prev => prev.map(i => i.id === id ? { ...i, z_index: newZ } : i));
    await supabase.from('vision_board_items').update({ z_index: newZ }).eq('id', id);
  };

  const handleResize = async (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newWidth = Math.max(80, Math.min(1200, (item.width || 250) + delta));
    setItems(prev => prev.map(i => i.id === id ? { ...i, width: newWidth } : i));
    await supabase.from('vision_board_items').update({ width: newWidth }).eq('id', id);
  };

  return (
    <div className="h-full flex flex-col relative w-full bg-dark-bg overflow-hidden">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 z-10 shrink-0 px-2 lg:px-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Lei da Atração</h1>
          <p className="text-sm text-neutral-400">Adicione imagens dos seus objetivos e arraste para posicionar no seu mural (Vision Board).</p>
        </div>
        <div>
          <label className="flex items-center gap-2 bg-brand-red text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors cursor-pointer shadow-lg shadow-brand-red/20 active:scale-95 duration-200">
            <Plus size={18} />
            Nova Imagem
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      <div 
        ref={constraintsRef}
        className="flex-1 w-full relative rounded-2xl border border-dark-border/50 bg-dark-card/50 backdrop-blur-sm overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      >
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-neutral-500 flex flex-col items-center">
              <Target className="animate-spin mb-4" size={32} />
              <p>Carregando seu mural...</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
            <SparklesIcon className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Seu mural está vazio</p>
            <p className="max-w-md">Faça o upload de fotos dos seus sonhos e metas para visualizá-las todos os dias.</p>
          </div>
        ) : (
          items.map(item => (
            <motion.div
              key={item.id}
              drag
              dragConstraints={constraintsRef}
              dragMomentum={false}
              onDragEnd={(_, info) => handleDragEnd(item.id, info)}
              onMouseDown={() => bringToFront(item.id)}
              initial={{ x: item.position_x, y: item.position_y, opacity: 0, scale: 0.8 }}
              animate={{ x: item.position_x, y: item.position_y, opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
              style={{ zIndex: item.z_index }}
              className="absolute cursor-grab active:cursor-grabbing group"
            >
              <div className="relative p-2 bg-white rounded-xl shadow-2xl transition-shadow group-hover:shadow-brand-red/20 group-active:shadow-brand-red/40 select-none">
                <img 
                  src={item.image_url} 
                  alt="Vision Board Item" 
                  style={{ width: item.width || 250, height: 'auto' }}
                  className="object-cover rounded-md pointer-events-none"
                  draggable={false}
                />
                
                {/* Size Controls */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResize(item.id, -40);
                  }}
                  className="absolute -top-3 right-16 bg-neutral-900 border border-dark-border text-neutral-300 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:text-white hover:bg-neutral-800 shadow-md z-10"
                  title="Diminuir"
                >
                  <ZoomOut size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResize(item.id, 40);
                  }}
                  className="absolute -top-3 right-6 bg-neutral-900 border border-dark-border text-neutral-300 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:text-white hover:bg-neutral-800 shadow-md z-10"
                  title="Aumentar"
                >
                  <ZoomIn size={14} />
                </button>

                {/* Delete button (only visible on hover) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md z-10"
                  title="Excluir"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

// SVG for empty state
function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}
