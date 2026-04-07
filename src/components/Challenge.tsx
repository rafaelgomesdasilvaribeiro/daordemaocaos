import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Flame, ArrowLeft, Check, Plus, Image as ImageIcon, ChevronDown, Lock, RotateCcw, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type ScreenState = 'intro' | 'form' | 'history' | 'active';

const mandamentos = [
  { id: 1, title: "Quebre Suas Correntes", desc: "Elimine hábitos que drenam sua energia e o impedem de evoluir." },
  { id: 2, title: "Encare Sua Verdade", desc: "Faça uma autoanálise brutalmente honesta e reconheça seus fracassos." },
  { id: 3, title: "Enterre o Seu Passado", desc: "Deixe para trás quem você era e a mentalidade de vítima." },
  { id: 4, title: "Marque a Mudança", desc: "Declare suas novas intenções e crie um ponto de inflexão na vida." },
  { id: 5, title: "Faça uma Cápsula para o Seu Eu do Futuro", desc: "Registre hoje as expectativas para quem você será no final da jornada." },
  { id: 6, title: "Limpe Suas Redes Sociais", desc: "Desconecte-se de futilidades e pessoas ou conteúdos tóxicos." },
  { id: 7, title: "Abra Espaço para o Novo", desc: "Organize seu ambiente físico e mental para a transformação." },
  { id: 8, title: "Reascenda Conexões Verdadeiras", desc: "Valorize quem realmente importa e afaste as distrações superficiais." },
  { id: 9, title: "Pratique o Perdão", desc: "Liberte o peso extra do ressentimento para caminhar mais leve." },
  { id: 10, title: "Faça um Jejum Intermitente", desc: "Treine diariamente a sua disciplina através da privação alimentar temporária." },
];

export const Challenge: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [screen, setScreen] = useState<ScreenState>('intro');
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [goalDescription, setGoalDescription] = useState('');
  const [currentState, setCurrentState] = useState('');
  const [currentImage, setCurrentImage] = useState('');
  
  const defaultAvoid = ["sem álcool, drogas e pornô", "redes sociais só por 30 min", "sem açúcar"];
  const [habitsToAvoid, setHabitsToAvoid] = useState<string[]>([]);
  const [newHabitAvoid, setNewHabitAvoid] = useState('');

  const defaultBuild = ["exercício 60 min", "leitura", "meditação"];
  const [habitsToBuild, setHabitsToBuild] = useState<string[]>([]);
  const [newHabitBuild, setNewHabitBuild] = useState('');

  // History / Check
  const [hasHistory, setHasHistory] = useState(false);
  const [pastChallenges, setPastChallenges] = useState<any[]>([]);

  // Active Challenge State
  const [activeChallenge, setActiveChallenge] = useState<any>(null);
  const [expandedMandamento, setExpandedMandamento] = useState<number | null>(1);
  const [dailyProgress, setDailyProgress] = useState<Record<string, 'null' | 'completed' | 'failed'>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    checkStatus();
  }, [session]);

  const checkStatus = async () => {
    setIsLoading(true);
    const { data: activeData } = await supabase
      .from('challenges')
      .select('*')
      .eq('user_id', session?.user?.id)
      .eq('status', 'active')
      .single();

    if (activeData) {
      setActiveChallenge(activeData);
      setDailyProgress(activeData.daily_progress || {});
      setScreen('active');
    }

    const { data: historyData } = await supabase
      .from('challenges')
      .select('id, start_date, status')
      .eq('user_id', session?.user?.id)
      .neq('status', 'active');
      
    if (historyData && historyData.length > 0) {
      setHasHistory(true);
      setPastChallenges(historyData);
    }
    
    setIsLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCurrentImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const submitChallenge = async () => {
    if (!session?.user?.id) return;
    setIsLoading(true);

    const { data, error } = await supabase.from('challenges').insert([{
      user_id: session.user.id,
      goal_description: goalDescription,
      current_state_description: currentState,
      current_state_image_url: currentImage,
      habits_to_avoid: habitsToAvoid,
      habits_to_build: habitsToBuild,
      status: 'active',
      daily_progress: {}
    }]).select().single();

    setIsLoading(false);
    if (!error && data) {
      setActiveChallenge(data);
      setDailyProgress({});
      setScreen('active');
    }
  };

  const cycleDayProgress = async (day: number) => {
    if (!activeChallenge) return;
    
    // Calculate current day
    const start = new Date(activeChallenge.start_date);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDay = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Only allow marking the current day
    if (day !== currentDay) return;
    
    const currentStateStr = dailyProgress[day.toString()];
    let nextState: 'null' | 'completed' | 'failed' | undefined;
    
    // Toggle between completed, failed, and undefined
    if (!currentStateStr) nextState = 'completed';
    else if (currentStateStr === 'completed') nextState = 'failed';
    else nextState = undefined; 

    const newProgress = { ...dailyProgress };
    if (!nextState) {
      delete newProgress[day.toString()];
    } else {
      newProgress[day.toString()] = nextState;
    }

    setDailyProgress(newProgress);
    
    await supabase.from('challenges')
      .update({ daily_progress: newProgress })
      .eq('id', activeChallenge.id);
  };

  const abandonChallenge = async () => {
    if (!activeChallenge || !confirm("Tem certeza que deseja abandonar este desafio?")) return;
    await supabase.from('challenges').update({ status: 'abandoned' }).eq('id', activeChallenge.id);
    setActiveChallenge(null);
    setScreen('history');
    checkStatus();
  };

  // Calculate currentDay for rendering
  let calculatedCurrentDay = 1;
  let startDate = new Date();
  if (activeChallenge?.start_date) {
    startDate = new Date(activeChallenge.start_date);
    startDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    calculatedCurrentDay = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  if (isLoading) {
    return <div className="h-full flex items-center justify-center text-neutral-400">Carregando...</div>;
  }

  return (
    <div className="h-full flex flex-col w-full bg-dark-bg text-white overflow-hidden">
      <AnimatePresence mode="wait">
        {screen === 'intro' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto px-4 overflow-y-auto"
          >
            <Flame className="text-brand-red w-20 h-20 mb-6 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
            <h1 className="text-5xl font-black tracking-tight text-white mb-4 uppercase">
              Desafio
            </h1>
            <p className="text-lg text-neutral-300 leading-relaxed max-w-xl mb-12">
              21 dias de disciplina e silêncio para reconstruir sua mente, dominar seus hábitos e despertar sua verdadeira liberdade.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <button 
                onClick={() => setScreen('form')}
                className="bg-brand-red hover:bg-red-600 text-white font-bold py-4 px-8 rounded-xl shadow-xl shadow-brand-red/20 transition-all active:scale-95 uppercase tracking-widest text-sm"
              >
                Começar Agora
              </button>
              {hasHistory && (
                <button 
                  onClick={() => setScreen('history')}
                  className="bg-transparent border-2 border-white/20 hover:border-white text-white font-bold py-4 px-8 rounded-xl transition-all active:scale-95 uppercase tracking-widest text-sm"
                >
                  Ver Histórico
                </button>
              )}
            </div>
          </motion.div>
        )}

        {screen === 'history' && (
          <motion.div 
            key="history"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 max-w-4xl mx-auto w-full py-8 overflow-y-auto"
          >
            <button onClick={() => setScreen('intro')} className="flex items-center gap-2 text-neutral-400 hover:text-white mb-8 transition-colors">
              <ArrowLeft size={16} /> Voltar
            </button>
            <h2 className="text-2xl font-bold uppercase tracking-widest mb-6">Seu Histórico</h2>
            
            {pastChallenges.length === 0 ? (
              <div className="text-neutral-500">Nenhum desafio registrado.</div>
            ) : (
              <div className="space-y-4">
                {pastChallenges.map(c => (
                  <div key={c.id} className="bg-dark-card border border-dark-border p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-sm text-neutral-400 mb-1">Início: {new Date(c.start_date).toLocaleDateString()}</div>
                      <div className={cn("font-bold uppercase tracking-wider text-xs", c.status === 'completed' ? "text-green-500" : "text-amber-500")}>
                        {c.status === 'completed' ? 'Concluído' : 'Abandonado'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {screen === 'form' && (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex-1 max-w-3xl mx-auto w-full py-8 pb-32 overflow-y-auto"
          >
            <button onClick={() => setScreen('intro')} className="flex items-center gap-2 text-neutral-400 hover:text-white mb-8 transition-colors">
              <ArrowLeft size={16} /> Voltar
            </button>
            
            <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-8 border-b border-dark-border pb-4">
              Ponto de Partida
            </h2>

            <div className="space-y-12">
              <div className="space-y-3">
                <label className="block text-lg font-bold text-white">1. Como você deseja estar ao final do desafio?</label>
                <textarea 
                  value={goalDescription}
                  onChange={e => setGoalDescription(e.target.value)}
                  className="w-full bg-dark-card border border-dark-border rounded-xl p-4 text-white min-h-[120px] focus:border-brand-red outline-none resize-y"
                  placeholder="Descreva seu estado ideal em 21 dias..."
                />
              </div>

              <div className="space-y-3">
                <label className="block text-lg font-bold text-white">2. Como você está hoje?</label>
                <textarea 
                  value={currentState}
                  onChange={e => setCurrentState(e.target.value)}
                  className="w-full bg-dark-card border border-dark-border rounded-xl p-4 text-white min-h-[120px] focus:border-brand-red outline-none resize-y mb-2"
                  placeholder="Seja honesto(a) sobre seu momento atual..."
                />
                
                {!currentImage ? (
                  <label className="flex items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-dark-border rounded-xl text-neutral-500 cursor-pointer hover:border-brand-red hover:text-brand-red transition-all">
                    <ImageIcon size={24} />
                    <span>Adicionar foto do corpo/estado atual</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                ) : (
                  <div className="relative inline-block mt-2 group">
                    <img src={currentImage} className="h-48 rounded-xl object-contain border border-dark-border" alt="Atual" />
                    <button onClick={() => setCurrentImage('')} className="absolute top-2 right-2 bg-red-500 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <XCircle size={18} />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-lg font-bold text-white">3. Hábitos que você vai abdicar</label>
                <p className="text-sm text-neutral-400 mb-4">Selecione ou adicione tudo o que você vai cortar da sua vida nesses 21 dias.</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {defaultAvoid.map(habit => (
                    <button 
                      key={habit} 
                      onClick={() => setHabitsToAvoid(prev => prev.includes(habit) ? prev.filter(h => h !== habit) : [...prev, habit])}
                      className={cn(
                        "px-4 py-2 rounded-lg border text-sm font-medium transition-all flex items-center gap-2",
                        habitsToAvoid.includes(habit) ? "bg-red-500/20 border-red-500 text-red-500" : "bg-dark-card border-dark-border text-neutral-400 hover:border-neutral-500"
                      )}
                    >
                      {habitsToAvoid.includes(habit) && <Check size={14} />} {habit}
                    </button>
                  ))}
                  {habitsToAvoid.filter(h => !defaultAvoid.includes(h)).map(habit => (
                    <button key={habit} onClick={() => setHabitsToAvoid(prev => prev.filter(h => h !== habit))} className="px-4 py-2 rounded-lg border border-red-500 bg-red-500/20 text-red-500 text-sm font-medium flex items-center gap-2">
                       <Check size={14} /> {habit}
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newHabitAvoid}
                    onChange={e => setNewHabitAvoid(e.target.value)}
                    placeholder="Adicionar outro hábito para evitar..."
                    className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-4 py-2 focus:border-red-500 outline-none text-white text-sm"
                    onKeyDown={e => { if (e.key==='Enter' && newHabitAvoid) { setHabitsToAvoid(p => [...p, newHabitAvoid]); setNewHabitAvoid(''); } }}
                  />
                  <button onClick={() => { if(newHabitAvoid) { setHabitsToAvoid(p => [...p, newHabitAvoid]); setNewHabitAvoid(''); } }} className="bg-neutral-800 text-white px-4 py-2 rounded-lg hover:bg-neutral-700">
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-lg font-bold text-white">4. Hábitos que você vai fazer</label>
                <p className="text-sm text-neutral-400 mb-4">Escolha os pilares da sua rotina durante o desafio.</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {defaultBuild.map(habit => (
                    <button 
                      key={habit} 
                      onClick={() => setHabitsToBuild(prev => prev.includes(habit) ? prev.filter(h => h !== habit) : [...prev, habit])}
                      className={cn(
                        "px-4 py-2 rounded-lg border text-sm font-medium transition-all flex items-center gap-2",
                        habitsToBuild.includes(habit) ? "bg-green-500/20 border-green-500 text-green-500" : "bg-dark-card border-dark-border text-neutral-400 hover:border-neutral-500"
                      )}
                    >
                      {habitsToBuild.includes(habit) && <Check size={14} />} {habit}
                    </button>
                  ))}
                  {habitsToBuild.filter(h => !defaultBuild.includes(h)).map(habit => (
                    <button key={habit} onClick={() => setHabitsToBuild(prev => prev.filter(h => h !== habit))} className="px-4 py-2 rounded-lg border border-green-500 bg-green-500/20 text-green-500 text-sm font-medium flex items-center gap-2">
                       <Check size={14} /> {habit}
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newHabitBuild}
                    onChange={e => setNewHabitBuild(e.target.value)}
                    placeholder="Adicionar novo hábito saudável..."
                    className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-4 py-2 focus:border-green-500 outline-none text-white text-sm"
                    onKeyDown={e => { if (e.key==='Enter' && newHabitBuild) { setHabitsToBuild(p => [...p, newHabitBuild]); setNewHabitBuild(''); } }}
                  />
                  <button onClick={() => { if(newHabitBuild) { setHabitsToBuild(p => [...p, newHabitBuild]); setNewHabitBuild(''); } }} className="bg-neutral-800 text-white px-4 py-2 rounded-lg hover:bg-neutral-700">
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-16 flex justify-end">
              <button 
                onClick={submitChallenge}
                disabled={!goalDescription || !currentState}
                className="bg-brand-red hover:bg-red-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold py-4 px-12 rounded-xl transition-colors uppercase tracking-widest flex items-center gap-2"
              >
                Ingressar no Desafio
              </button>
            </div>
          </motion.div>
        )}

        {screen === 'active' && activeChallenge && (
          <motion.div 
            key="active"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-dark-border bg-dark-card shrink-0">
              <button 
                onClick={() => setScreen('intro')} 
                className="flex items-center gap-2 text-brand-red hover:text-red-400 border border-brand-red/20 hover:border-brand-red/40 bg-brand-red/10 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <ArrowLeft size={16} /> Voltar
              </button>
              <button 
                onClick={abandonChallenge}
                className="flex items-center gap-2 bg-brand-red hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <RotateCcw size={16} /> Abandonar desafio
              </button>
            </div>

            {/* Main Area */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Column: Mandamentos */}
              <div className="w-80 border-r border-dark-border bg-dark-card overflow-y-auto p-6 hidden md:block shrink-0">
                <h2 className="text-2xl font-bold mb-2">Os Mandamentos Caverna</h2>
                <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
                  Os princípios essenciais para vencer o desafio de 21 dias. Eles fortalecem sua mentalidade, 
                  disciplina e hábitos para atingir o máximo desempenho. Siga-os e transforme sua rotina.
                </p>

                <div className="flex justify-between text-sm font-bold mb-4">
                  <span>Seu progresso</span>
                  <span className="text-neutral-400">{Object.entries(dailyProgress).filter(([_, val]) => val === 'completed').length}/21</span>
                </div>

                <div className="space-y-2">
                  {mandamentos.map((item) => (
                    <div 
                      key={item.id} 
                      className={cn(
                        "rounded-xl border transition-colors cursor-pointer overflow-hidden",
                        expandedMandamento === item.id ? "bg-dark-card border-brand-red/50" : "bg-dark-bg border-dark-border hover:border-white/20"
                      )}
                      onClick={() => setExpandedMandamento(expandedMandamento === item.id ? null : item.id)}
                    >
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold border",
                            expandedMandamento === item.id ? "border-brand-red text-brand-red bg-brand-red/10" : "border-neutral-700 text-neutral-500"
                          )}>
                            {item.id}
                          </span>
                          <span className={cn("font-medium text-sm", expandedMandamento === item.id ? "text-white" : "text-neutral-300")}>
                            {item.title}
                          </span>
                        </div>
                        <ChevronDown size={16} className={cn("text-neutral-500 transition-transform", expandedMandamento === item.id && "rotate-180 text-brand-red")} />
                      </div>
                      <AnimatePresence>
                        {expandedMandamento === item.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                          >
                            <div className="px-4 pb-4 pt-0 pl-12 text-sm text-neutral-400 border-l border-transparent">
                              {item.desc}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {/* Center Column: Grid 21 Days */}
              <div className="flex-1 bg-dark-bg overflow-y-auto p-6 md:p-10 flex flex-col items-center">
                <div className="flex flex-wrap items-center justify-center gap-6 mb-10 pb-6 border-b border-dark-border w-full max-w-4xl">
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-neutral-700"></div><span className="text-sm text-neutral-400">Dia futuro</span></div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-yellow-500 bg-yellow-500/20"></div><span className="text-sm text-neutral-400">Dia nulo</span></div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-green-500 bg-green-500/20"></div><span className="text-sm text-neutral-400">Dia positivo</span></div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-red-500 bg-red-500/20"></div><span className="text-sm text-neutral-400">Dia negativo</span></div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 max-w-5xl w-full">
                  {Array.from({ length: 21 }).map((_, i) => {
                    const day = i + 1;
                    
                    // Determine derived status
                    let status = dailyProgress[day.toString()];
                    let isFuture = day > calculatedCurrentDay;
                    let isClickable = day === calculatedCurrentDay;
                    
                    // If it's a past day and hasn't been set by user, it's null
                    if (day < calculatedCurrentDay && !status) {
                      status = 'null';
                    }
                    
                    const dayDate = new Date(startDate);
                    dayDate.setDate(startDate.getDate() + (day - 1));
                    const dateStr = dayDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

                    return (
                      <div 
                        key={day}
                        onClick={() => cycleDayProgress(day)}
                        className={cn(
                          "aspect-[4/5] rounded-2xl flex flex-col p-4 transition-all border group relative",
                          isClickable ? "cursor-pointer" : "cursor-default opacity-80",
                          !status && !isFuture && "bg-dark-card border-brand-red/30 hover:border-brand-red/60 shadow-[0_0_15px_rgba(220,38,38,0.15)]", // Highlight current day if unmarked
                          !status && isFuture && "bg-dark-card border-white/5", // Future day
                          status === 'completed' && "bg-green-500/5 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)]",
                          status === 'failed' && "bg-red-500/5 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]",
                          status === 'null' && "bg-yellow-500/5 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.15)]",
                        )}
                      >
                        <div className="flex justify-between items-start w-full">
                          <span className={cn(
                            "font-black text-xl",
                            !status ? "text-white" : "",
                            status === 'completed' ? "text-green-500" : "",
                            status === 'failed' ? "text-red-500" : "",
                            status === 'null' ? "text-yellow-500" : "",
                          )}>{day}</span>
                          {isFuture && <Lock size={14} className="text-neutral-600" />}
                        </div>
                        
                        <div className="flex-1" />
                        
                        <div className="flex justify-between items-end w-full">
                          <span className="text-xs text-neutral-500">{dateStr}</span>
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                            !status ? "border-neutral-700" : "",
                            isClickable && !status ? "group-hover:border-neutral-500 border-neutral-600" : "",
                            status === 'completed' ? "border-green-500 bg-green-500/20" : "",
                            status === 'failed' ? "border-red-500 bg-red-500/20" : "",
                            status === 'null' ? "border-yellow-500 bg-yellow-500/20" : ""
                          )}>
                            {/* Empty circle inside like the image */}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile: Resumo (Objective & Habits) */}
                <div className="lg:hidden w-full max-w-4xl mt-12 space-y-6 pt-8 border-t border-dark-border">
                  <div className="mb-8">
                    <h2 className="text-xl font-bold mb-2 uppercase tracking-wide">Ponto de Chegada</h2>
                    <p className="text-sm text-neutral-300 leading-relaxed bg-dark-card p-4 rounded-xl border border-dark-border">
                      {activeChallenge.goal_description}
                    </p>
                  </div>
                  
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-red-500 font-bold mb-3 uppercase tracking-wide text-sm">
                      <Flame size={16} /> Renúncias
                    </div>
                    {activeChallenge.habits_to_avoid.length === 0 ? (
                      <div className="text-sm text-neutral-500">Nenhum hábito abdicado.</div>
                    ) : (
                      <ul className="space-y-2">
                        {activeChallenge.habits_to_avoid.map(habit => (
                          <li key={habit} className="flex items-start gap-2 text-sm text-red-400">
                            <span className="text-red-500 mt-0.5">•</span> {habit}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  <div className="bg-brand-red/5 border border-brand-red/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-brand-red font-bold mb-3 uppercase tracking-wide text-sm">
                      <Check size={16} /> Pilar do Desafio
                    </div>
                    {activeChallenge.habits_to_build.length === 0 ? (
                      <div className="text-sm text-neutral-500">Nenhum hábito pilar.</div>
                    ) : (
                      <ul className="space-y-2">
                        {activeChallenge.habits_to_build.map(habit => (
                          <li key={habit} className="flex items-start gap-2 text-sm text-neutral-300">
                            <span className="text-brand-red mt-0.5">•</span> {habit}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Mobile: Mandamentos */}
                <div className="md:hidden w-full max-w-4xl mt-8 pt-8 border-t border-dark-border">
                  <h2 className="text-xl font-bold mb-2">Os Mandamentos Caverna</h2>
                  <div className="space-y-2">
                    {mandamentos.map((item) => (
                      <div 
                        key={item.id} 
                        className={cn(
                          "rounded-xl border transition-colors cursor-pointer overflow-hidden",
                          expandedMandamento === item.id ? "bg-dark-card border-brand-red/50" : "bg-dark-bg border-dark-border hover:border-white/20"
                        )}
                        onClick={() => setExpandedMandamento(expandedMandamento === item.id ? null : item.id)}
                      >
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold border",
                              expandedMandamento === item.id ? "border-brand-red text-brand-red bg-brand-red/10" : "border-neutral-700 text-neutral-500"
                            )}>
                              {item.id}
                            </span>
                            <span className={cn("font-medium text-sm", expandedMandamento === item.id ? "text-white" : "text-neutral-300")}>
                              {item.title}
                            </span>
                          </div>
                          <ChevronDown size={16} className={cn("text-neutral-500 transition-transform", expandedMandamento === item.id && "rotate-180 text-brand-red")} />
                        </div>
                        <AnimatePresence>
                          {expandedMandamento === item.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                            >
                              <div className="px-4 pb-4 pt-0 pl-12 text-sm text-neutral-400 border-l border-transparent">
                                {item.desc}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Objectives & Habits Summary */}
              <div className="w-80 border-l border-dark-border bg-dark-card overflow-y-auto p-6 hidden lg:block shrink-0">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-400 mb-2">Seu objetivo:</h3>
                    <p className="text-sm text-neutral-200">{activeChallenge.goal_description || 'Nenhum objetivo definido.'}</p>
                  </div>

                  <div>
                    <div className="bg-[#1A1A1A] p-3 rounded-lg border border-white/5 mb-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-neutral-300">Novos Hábitos</h3>
                    </div>
                    <ul className="space-y-3">
                      {activeChallenge.habits_to_build?.map((habit: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                          <span className="text-neutral-300 leading-snug">{habit}</span>
                        </li>
                      ))}
                      {(!activeChallenge.habits_to_build || activeChallenge.habits_to_build.length === 0) && (
                        <li className="text-sm text-neutral-500">Nenhum hábito adicionado</li>
                      )}
                    </ul>
                  </div>

                  <div>
                    <div className="bg-[#1A1A1A] p-3 rounded-lg border border-white/5 mb-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-neutral-300">Renúncias</h3>
                    </div>
                    <ul className="space-y-3">
                      {activeChallenge.habits_to_avoid?.map((habit: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                          <span className="text-neutral-300 leading-snug">{habit}</span>
                        </li>
                      ))}
                      {(!activeChallenge.habits_to_avoid || activeChallenge.habits_to_avoid.length === 0) && (
                        <li className="text-sm text-neutral-500">Nenhuma renúncia adicionada.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
