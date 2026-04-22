import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Sunset, Sunrise, Plus, Trash2, GripVertical, Settings2, CheckCircle2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface RitualConfig {
  user_id: string;
  morning_start: string;
  morning_end: string;
  night_start: string;
  night_end: string;
}

interface RitualHabit {
  id: string;
  period: 'morning' | 'night';
  title: string;
  order_index: number;
}

function SortableHabitItem({ habit, onDelete }: { key?: React.Key; habit: RitualHabit; onDelete: (id: string) => void | Promise<void> }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-dark-card p-3 rounded-xl border border-dark-border group hover:border-brand-red/30 transition-colors">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-neutral-600 hover:text-neutral-400">
        <GripVertical size={16} />
      </div>
      <div className="flex-1 font-medium text-sm text-neutral-300">
        {habit.title}
      </div>
      <button 
        onClick={() => onDelete(habit.id)}
        className="text-neutral-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

export const Rituals: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [config, setConfig] = useState<RitualConfig>({
    user_id: '',
    morning_start: '06:00',
    morning_end: '08:00',
    night_start: '21:00',
    night_end: '23:00'
  });
  const [morningHabits, setMorningHabits] = useState<RitualHabit[]>([]);
  const [nightHabits, setNightHabits] = useState<RitualHabit[]>([]);
  
  const [newMorningTitle, setNewMorningTitle] = useState('');
  const [newNightTitle, setNewNightTitle] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    loadRituals();
  }, [session]);

  const loadRituals = async () => {
    if (!session?.user?.id) return;
    
    // Load config
    const { data: configData } = await supabase
      .from('rituals_config')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
      
    if (configData) {
      setConfig(configData as RitualConfig);
    } else {
      // Create default config
      const defaultConfig = {
        user_id: session.user.id,
        morning_start: '06:00',
        morning_end: '08:00',
        night_start: '21:00',
        night_end: '23:00'
      };
      await supabase.from('rituals_config').insert([defaultConfig]);
      setConfig(defaultConfig);
    }

    // Load habits
    const { data: habitsData } = await supabase
      .from('ritual_habits')
      .select('*')
      .eq('user_id', session.user.id)
      .order('order_index', { ascending: true });

    if (habitsData) {
      setMorningHabits(habitsData.filter(h => h.period === 'morning') as RitualHabit[]);
      setNightHabits(habitsData.filter(h => h.period === 'night') as RitualHabit[]);
    }
  };

  const saveConfig = async () => {
    setIsSavingConfig(true);
    await supabase.from('rituals_config').upsert({
      user_id: session?.user?.id,
      morning_start: config.morning_start,
      morning_end: config.morning_end,
      night_start: config.night_start,
      night_end: config.night_end
    });
    setTimeout(() => setIsSavingConfig(false), 1000); // UI feedback
  };

  const addHabit = async (period: 'morning' | 'night', title: string) => {
    if (!title.trim() || !session?.user?.id) return;
    
    const targetList = period === 'morning' ? morningHabits : nightHabits;
    const order_index = targetList.length > 0 ? targetList[targetList.length - 1].order_index + 1 : 0;
    
    const { data } = await supabase.from('ritual_habits').insert([{
      user_id: session.user.id,
      period,
      title: title.trim(),
      order_index
    }]).select().single();

    if (data) {
      if (period === 'morning') {
        setMorningHabits(prev => [...prev, data as RitualHabit]);
        setNewMorningTitle('');
      } else {
        setNightHabits(prev => [...prev, data as RitualHabit]);
        setNewNightTitle('');
      }
    }
  };

  const deleteHabit = async (id: string, period: 'morning' | 'night') => {
    if (period === 'morning') {
      setMorningHabits(prev => prev.filter(h => h.id !== id));
    } else {
      setNightHabits(prev => prev.filter(h => h.id !== id));
    }
    await supabase.from('ritual_habits').delete().eq('id', id);
  };

  const handleDragEnd = async (event: DragEndEvent, period: 'morning' | 'night') => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const list = period === 'morning' ? morningHabits : nightHabits;
    const oldIndex = list.findIndex(h => h.id === active.id);
    const newIndex = list.findIndex(h => h.id === over.id);

    const reordered = arrayMove(list, oldIndex, newIndex) as RitualHabit[];
    
    // Update local state instantly
    if (period === 'morning') setMorningHabits(reordered);
    else setNightHabits(reordered);

    // Update order index for all affected items in DB
    const updates = reordered.map((item, index) => ({
      id: item.id,
      period: item.period,
      title: item.title,
      order_index: index,
      user_id: session?.user?.id || ''
    }));

    // Update them sequentially to be safe
    for (const item of updates) {
      await supabase.from('ritual_habits').update({ order_index: item.order_index }).eq('id', item.id);
    }
  };

  return (
    <div className="h-full flex flex-col w-full bg-dark-bg overflow-y-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1 flex items-center gap-3">
            <Sunrise className="text-brand-red" />
            Configuração de Rituais
          </h1>
          <p className="text-sm text-neutral-400">Gerencie seus hábitos matinais e noturnos arrastando-os para reorganizar.</p>
        </div>
        <button 
          onClick={saveConfig}
          className="flex items-center gap-2 bg-neutral-900 border border-dark-border text-white px-4 py-2 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
        >
          {isSavingConfig ? <CheckCircle2 className="text-green-500" size={18} /> : <Settings2 size={18} />}
          {isSavingConfig ? 'Salvo!' : 'Salvar Horários'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Morning Column */}
        <div className="flex flex-col bg-dark-card/30 rounded-2xl border border-dark-border p-6 shadow-xl">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-dark-border border-dashed">
            <div className="p-3 rounded-full bg-amber-500/10 text-amber-500">
              <Sunrise size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white mb-1">Ritual Matinal</h2>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span>De</span>
                <input 
                  type="time" 
                  value={config.morning_start}
                  onChange={(e) => setConfig({...config, morning_start: e.target.value})}
                  className="bg-neutral-900 border border-dark-border rounded px-2 py-1 outline-none focus:border-amber-500"
                />
                <span>até</span>
                <input 
                  type="time" 
                  value={config.morning_end}
                  onChange={(e) => setConfig({...config, morning_end: e.target.value})}
                  className="bg-neutral-900 border border-dark-border rounded px-2 py-1 outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-[300px]">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'morning')}>
              <SortableContext items={morningHabits.map(h => h.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {morningHabits.map(habit => (
                    <SortableHabitItem key={habit.id} habit={habit} onDelete={(id) => deleteHabit(id, 'morning')} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <form 
              onSubmit={(e) => { e.preventDefault(); addHabit('morning', newMorningTitle); }}
              className="mt-6 relative"
            >
              <input 
                type="text" 
                value={newMorningTitle}
                onChange={e => setNewMorningTitle(e.target.value)}
                placeholder="Adicionar hábito matinal..."
                className="w-full bg-dark-bg border border-dark-border text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-amber-500 transition-colors pr-12"
              />
              <button 
                type="submit"
                disabled={!newMorningTitle.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-amber-500 disabled:opacity-50"
              >
                <Plus size={18} />
              </button>
            </form>
          </div>
        </div>

        {/* Night Column */}
        <div className="flex flex-col bg-dark-card/30 rounded-2xl border border-dark-border p-6 shadow-xl">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-dark-border border-dashed">
            <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400">
              <Sunset size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white mb-1">Ritual Noturno</h2>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span>De</span>
                <input 
                  type="time" 
                  value={config.night_start}
                  onChange={(e) => setConfig({...config, night_start: e.target.value})}
                  className="bg-neutral-900 border border-dark-border rounded px-2 py-1 outline-none focus:border-indigo-400"
                />
                <span>até</span>
                <input 
                  type="time" 
                  value={config.night_end}
                  onChange={(e) => setConfig({...config, night_end: e.target.value})}
                  className="bg-neutral-900 border border-dark-border rounded px-2 py-1 outline-none focus:border-indigo-400"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-[300px]">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'night')}>
              <SortableContext items={nightHabits.map(h => h.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {nightHabits.map(habit => (
                    <SortableHabitItem key={habit.id} habit={habit} onDelete={(id) => deleteHabit(id, 'night')} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <form 
              onSubmit={(e) => { e.preventDefault(); addHabit('night', newNightTitle); }}
              className="mt-6 relative"
            >
              <input 
                type="text" 
                value={newNightTitle}
                onChange={e => setNewNightTitle(e.target.value)}
                placeholder="Adicionar hábito noturno..."
                className="w-full bg-dark-bg border border-dark-border text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-indigo-400 transition-colors pr-12"
              />
              <button 
                type="submit"
                disabled={!newNightTitle.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-indigo-400 disabled:opacity-50"
              >
                <Plus size={18} />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
