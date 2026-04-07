import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  RefreshCw, 
  Settings, 
  X, 
  Check, 
  LayoutGrid, 
  List, 
  Maximize2,
  ExternalLink,
  Trash2,
  ChevronDown,
  Bell
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  description?: string;
  notification?: string;
}

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('month');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchEvents = async () => {
      const { data } = await supabase.from('calendar_events').select('*').eq('user_id', session.user.id);
      if (data) {
        setEvents(data.map(e => ({
          ...e,
          start: new Date(e.start_time),
          end: new Date(e.end_time)
        })));
      }
    };
    fetchEvents();

    const sub = supabase.channel(`calendar-${session.user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events', filter: `user_id=eq.${session.user.id}` }, fetchEvents).subscribe();
    return () => { sub.unsubscribe(); };
  }, [session]);

  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: '',
    description: '',
    notification: 'Me avisar',
    start: new Date(),
    end: new Date(Date.now() + 3600000),
    color: 'bg-brand-red'
  });

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Previous month days
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, month: month - 1, year, currentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, month, year, currentMonth: true });
    }

    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, month: month + 1, year, currentMonth: false });
    }

    return days;
  }, [currentDate]);

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleAddEvent = async () => {
    if (!newEvent.title) return;
    
    if (editingEventId) {
      const updatedEvent = {
        title: newEvent.title!,
        description: newEvent.description,
        notification: newEvent.notification,
        start_time: (newEvent.start || new Date()).toISOString(),
        end_time: (newEvent.end || new Date()).toISOString(),
        color: newEvent.color || 'bg-brand-red'
      };
      setEvents(events.map(e => e.id === editingEventId ? {
        ...e,
        ...updatedEvent,
        start: new Date(updatedEvent.start_time),
        end: new Date(updatedEvent.end_time)
      } : e));
      await supabase.from('calendar_events').update(updatedEvent).eq('id', editingEventId);
    } else {
      const eventId = Math.random().toString(36).substr(2, 9);
      const event: Event = {
        id: eventId,
        title: newEvent.title,
        description: newEvent.description,
        notification: newEvent.notification,
        start: newEvent.start || new Date(),
        end: newEvent.end || new Date(),
        color: newEvent.color || 'bg-brand-red'
      };
      setEvents([...events, event]);
      await supabase.from('calendar_events').insert([{
        id: event.id,
        title: event.title,
        description: event.description,
        notification: event.notification,
        start_time: event.start.toISOString(),
        end_time: event.end.toISOString(),
        color: event.color,
        user_id: session.user.id
      }]);
    }
    
    setIsEventModalOpen(false);
    setEditingEventId(null);
    setNewEvent({ title: '', description: '', notification: 'Me avisar', start: new Date(), end: new Date(Date.now() + 3600000), color: 'bg-brand-red' });
  };

  const handleDeleteEvent = async (id: string) => {
    setEvents(events.filter(e => e.id !== id));
    setIsEventModalOpen(false);
    setEditingEventId(null);
    await supabase.from('calendar_events').delete().eq('id', id);
  };

  const handleDrop = async (e: React.DragEvent, dropDate: Date, isHourSlot: boolean) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('text/plain');
    if (!eventId) return;

    const event = events.find(ev => ev.id === eventId);
    if (!event) return;

    const duration = event.end.getTime() - event.start.getTime();
    const newStart = new Date(dropDate);

    if (!isHourSlot) {
      newStart.setHours(event.start.getHours(), event.start.getMinutes());
    } else {
      newStart.setMinutes(event.start.getMinutes());
    }

    const newEnd = new Date(newStart.getTime() + duration);
    setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, start: newStart, end: newEnd } : ev));
    await supabase.from('calendar_events').update({
      start_time: newStart.toISOString(),
      end_time: newEnd.toISOString()
    }).eq('id', eventId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleOpenEditModal = (event: Event) => {
    setNewEvent({
      title: event.title,
      description: event.description || '',
      notification: event.notification || 'Me avisar',
      start: event.start,
      end: event.end,
      color: event.color
    });
    setEditingEventId(event.id);
    setIsEventModalOpen(true);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const renderDayView = () => {
    const day = selectedDay || currentDate;
    const dayEvents = events.filter(e => e.start.toDateString() === day.toDateString());

    return (
      <div className="flex-1 flex flex-col bg-dark-card border border-dark-border rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-dark-border flex items-center justify-between bg-dark-bg/30">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('month')} className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400">
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-xl font-bold">{day.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
          </div>
          <button 
            onClick={() => setIsEventModalOpen(true)}
            className="bg-brand-red hover:bg-brand-red-hover text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all text-sm"
          >
            <Plus size={18} />
            Novo Evento
          </button>
        </div>
        <div className="flex-1 overflow-y-auto relative">
          {hours.map(hour => (
            <div key={hour} className="flex border-b border-dark-border/30 h-20 group">
              <div className="w-20 flex justify-center pt-2 text-[10px] font-bold text-neutral-600 uppercase tabular-nums border-r border-dark-border/30">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div 
                className="flex-1 relative group-hover:bg-white/5 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={(e) => {
                  const dropDate = new Date(day);
                  dropDate.setHours(hour);
                  handleDrop(e, dropDate, true);
                }}
                onClick={() => {
                  const start = new Date(day);
                  start.setHours(hour);
                  setNewEvent({ ...newEvent, start });
                  setIsEventModalOpen(true);
                }}
              >
                {dayEvents.filter(e => e.start.getHours() === hour).map(event => (
                  <div 
                    key={event.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', event.id);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(event);
                    }}
                    className={cn(
                      "absolute left-2 right-2 top-1 rounded-lg p-2 text-xs font-bold text-white shadow-lg z-10 cursor-pointer hover:scale-[1.02] transition-transform",
                      event.color
                    )}
                    style={{ height: 'calc(100% - 8px)' }}
                  >
                    {event.title}
                    <div className="text-[10px] opacity-80 font-medium">
                      {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const day = selectedDay || currentDate;
    const startOfWeek = new Date(day);
    startOfWeek.setDate(day.getDate() - day.getDay()); // Sunday
    
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });

    return (
      <div className="flex-1 flex flex-col bg-dark-card border border-dark-border rounded-3xl overflow-hidden">
        <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-dark-border bg-dark-bg/30 relative">
          <div className="py-4 border-r border-dark-border/30 flex items-center justify-center">
            <Clock size={16} className="text-neutral-500" />
          </div>
          {weekDays.map((d, i) => {
            const isToday = new Date().toDateString() === d.toDateString();
            return (
              <div key={i} className="py-2 text-center border-r border-dark-border/30 last:border-r-0 flex flex-col items-center justify-center gap-1">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{daysOfWeek[i]}</span>
                <span className={cn(
                  "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mt-0.5",
                  isToday ? "bg-brand-red text-white" : ""
                )}>
                  {d.getDate()}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex-1 overflow-y-auto relative">
          {hours.map(hour => (
            <div key={hour} className="flex border-b border-dark-border/30 h-24 group">
              <div className="w-[80px] shrink-0 flex justify-center pt-2 text-[10px] font-bold text-neutral-600 uppercase tabular-nums border-r border-dark-border/30">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div className="flex-1 grid grid-cols-7 relative">
                {weekDays.map((d, i) => {
                  const dayEvents = events.filter(e => e.start.toDateString() === d.toDateString());
                  return (
                    <div 
                      key={i} 
                      className="border-r border-dark-border/30 last:border-r-0 relative hover:bg-white/5 cursor-pointer transition-colors"
                      onDragOver={handleDragOver}
                      onDrop={(e) => {
                        const dropDate = new Date(d);
                        dropDate.setHours(hour);
                        handleDrop(e, dropDate, true);
                      }}
                      onClick={() => {
                        const start = new Date(d);
                        start.setHours(hour);
                        setNewEvent({ ...newEvent, start });
                        setIsEventModalOpen(true);
                      }}
                    >
                      {dayEvents.filter(e => e.start.getHours() === hour).map(event => (
                        <div 
                          key={event.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', event.id);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(event);
                          }}
                          className={cn(
                            "absolute left-1 right-1 top-1 rounded-lg p-1.5 text-[10px] font-bold text-white shadow-lg z-10 cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden flex flex-col",
                            event.color
                          )}
                          style={{ height: 'calc(100% - 8px)' }}
                        >
                          <div className="truncate leading-tight mb-0.5">{event.title}</div>
                          <div className="text-[9px] opacity-80 font-medium truncate">
                            {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[800px] flex flex-col space-y-6"
    >
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 mt-1">Organize seu tempo e compromissos</p>
          </div>
          <div className="flex bg-dark-card border border-dark-border rounded-xl p-1 self-start sm:self-auto">
            <button 
              onClick={() => setView('day')}
              className={cn("px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", view === 'day' ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300")}
            >
              Dia
            </button>
            <button 
              onClick={() => setView('week')}
              className={cn("px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", view === 'week' ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300")}
            >
              Semana
            </button>
            <button 
              onClick={() => setView('month')}
              className={cn("px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", view === 'month' ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300")}
            >
              Mês
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setIsSyncModalOpen(true)}
            className="flex-1 sm:flex-none bg-dark-card border border-dark-border text-neutral-500 hover:text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-[10px] uppercase tracking-widest"
          >
            <RefreshCw size={16} />
            Sincronizar
          </button>
          <button 
            onClick={() => setIsEventModalOpen(true)}
            className="flex-1 sm:flex-none bg-brand-red hover:bg-brand-red-hover text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-red/20 text-[10px] uppercase tracking-widest"
          >
            <Plus size={16} />
            Evento
          </button>
        </div>
      </header>

      {view === 'month' ? (
        <div className="flex-1 bg-dark-card border border-dark-border rounded-3xl overflow-hidden flex flex-col">
          <div className="grid grid-cols-7 border-b border-dark-border bg-dark-bg/30 sticky top-0 z-20">
            {daysOfWeek.map(day => (
              <div key={day} className="py-4 text-center text-xs font-bold text-neutral-500 uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-7 min-h-full">
              {calendarDays.map((dateObj, idx) => {
                const isToday = new Date().toDateString() === new Date(dateObj.year, dateObj.month, dateObj.day).toDateString();
                const dayEvents = events.filter(e => e.start.toDateString() === new Date(dateObj.year, dateObj.month, dateObj.day).toDateString());
                
                return (
                  <div 
                    key={idx} 
                    onDragOver={handleDragOver}
                    onDrop={(e) => {
                      const dropDate = new Date(dateObj.year, dateObj.month, dateObj.day);
                      handleDrop(e, dropDate, false);
                    }}
                    onClick={() => {
                      setSelectedDay(new Date(dateObj.year, dateObj.month, dateObj.day));
                      setView('day');
                    }}
                    className={cn(
                      "border-r border-b border-dark-border/30 p-2 transition-all hover:bg-white/5 cursor-pointer flex flex-col gap-1 min-h-[120px]",
                      !dateObj.currentMonth && "opacity-30"
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <span className={cn(
                        "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full",
                        isToday ? "bg-brand-red text-white" : "text-neutral-400"
                      )}>
                        {dateObj.day}
                      </span>
                    </div>
                    <div className="flex-1 space-y-1">
                      {dayEvents.map(event => (
                        <div 
                          key={event.id} 
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            e.dataTransfer.setData('text/plain', event.id);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(event);
                          }}
                          className={cn("text-[10px] px-1.5 py-0.5 rounded truncate font-medium text-white cursor-pointer hover:opacity-80", event.color)}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : view === 'day' ? (
        renderDayView()
      ) : (
        renderWeekView()
      )}

      {/* Sync Modal */}
      <AnimatePresence>
        {isSyncModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-dark-border flex justify-between items-center">
                <h3 className="text-xl font-bold">Sincronizar Google Agenda</h3>
                <button onClick={() => setIsSyncModalOpen(false)} className="text-neutral-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3">
                  <ExternalLink size={20} className="text-blue-500 shrink-0" />
                  <p className="text-xs text-blue-200 leading-relaxed">
                    Conecte sua conta do Google para importar seus eventos e manter sua agenda sempre atualizada.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">ID da Agenda</label>
                  <input 
                    type="text" 
                    placeholder="ex: seuemail@gmail.com"
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white [.light_&]:text-neutral-900 placeholder:text-neutral-600 focus:outline-none focus:border-brand-red transition-colors"
                  />
                </div>
              </div>
              <div className="p-6 bg-dark-bg/50 border-t border-dark-border flex gap-3">
                <button onClick={() => setIsSyncModalOpen(false)} className="flex-1 py-3 bg-dark-card border border-dark-border rounded-xl font-bold text-neutral-400 hover:text-white transition-all">Cancelar</button>
                <button className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                  Conectar Google
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isEventModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-dark-border flex justify-between items-center">
                <h3 className="text-xl font-bold">{editingEventId ? 'Editar Evento' : 'Novo Evento'}</h3>
                <button onClick={() => { setIsEventModalOpen(false); setEditingEventId(null); }} className="text-neutral-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Título</label>
                  <input 
                    type="text" 
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Nome do evento"
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white [.light_&]:text-neutral-900 placeholder:text-neutral-600 focus:outline-none focus:border-brand-red transition-colors"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Início</label>
                    <input 
                      type="datetime-local" 
                      value={newEvent.start ? new Date(newEvent.start.getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setNewEvent({ ...newEvent, start: new Date(e.target.value) })}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white [.light_&]:text-neutral-900 focus:outline-none focus:border-brand-red transition-colors text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Fim</label>
                    <input 
                      type="datetime-local" 
                      value={newEvent.end ? new Date(newEvent.end.getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setNewEvent({ ...newEvent, end: new Date(e.target.value) })}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white [.light_&]:text-neutral-900 focus:outline-none focus:border-brand-red transition-colors text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Descrição</label>
                  <textarea 
                    value={newEvent.description || ''}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Detalhes adicionais..."
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white [.light_&]:text-neutral-900 placeholder:text-neutral-600 focus:outline-none focus:border-brand-red transition-colors text-xs min-h-[80px] resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Me Avisar</label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-xs text-neutral-400 cursor-pointer hover:bg-neutral-800 transition-colors w-full">
                    <Bell size={16} />
                    <select 
                      value={newEvent.notification || 'Me avisar'}
                      onChange={(e) => setNewEvent({ ...newEvent, notification: e.target.value })}
                      className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer appearance-none flex-1"
                    >
                      <option value="Me avisar">Me avisar</option>
                      <option value="5 min">5 min</option>
                      <option value="10 min">10 min</option>
                      <option value="15 min">15 min</option>
                      <option value="30 min">30 min</option>
                      <option value="1 hora">1 hora</option>
                    </select>
                    <ChevronDown size={14} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Cor</label>
                  <div className="flex gap-2">
                    {['bg-brand-red', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500'].map(c => (
                      <button 
                        key={c}
                        onClick={() => setNewEvent({ ...newEvent, color: c })}
                        className={cn("w-8 h-8 rounded-full border-2 transition-all", c, newEvent.color === c ? "border-white scale-110" : "border-transparent opacity-50")}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 bg-dark-bg/50 border-t border-dark-border flex gap-3">
                {editingEventId ? (
                  <>
                    <button 
                      onClick={() => handleDeleteEvent(editingEventId)} 
                      className="p-3 bg-neutral-800 text-brand-red rounded-xl font-bold hover:bg-brand-red/10 transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                    <button onClick={handleAddEvent} className="flex-1 py-3 bg-brand-red hover:bg-brand-red-hover text-white rounded-xl font-bold transition-all">Salvar Alterações</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsEventModalOpen(false)} className="flex-1 py-3 bg-dark-card border border-dark-border rounded-xl font-bold text-neutral-400 hover:text-white transition-all">Cancelar</button>
                    <button onClick={handleAddEvent} className="flex-1 py-3 bg-brand-red hover:bg-brand-red-hover text-white rounded-xl font-bold transition-all">Criar Evento</button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
