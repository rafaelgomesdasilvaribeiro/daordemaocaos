import { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Tasks } from './components/Tasks';
import { Kanban } from './components/Kanban';
import { Projects } from './components/Projects';
import { Calendar } from './components/Calendar';
import { KnowledgeBase } from './components/KnowledgeBase';
import { Notes } from './components/Notes';
import { LawOfAttraction } from './components/LawOfAttraction';
import { Rituals } from './components/Rituals';
import { Challenge } from './components/Challenge';
import { MentalMap } from './components/MentalMap';
import { View, Task, Column, Project } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Search, Settings, Menu, X } from 'lucide-react';
import { cn } from './lib/utils';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { Session } from '@supabase/supabase-js';
const INITIAL_COLUMNS: Column[] = [
  { id: 'todo', title: 'A Fazer' },
  { id: 'in-progress', title: 'Em Progresso' },
  { id: 'review', title: 'Revisão' },
  { id: 'done', title: 'Concluído' },
];

const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Finalizar UI do Dashboard', project: 'CRM Project', priority: 'high', dueDate: 'Hoje', status: 'in-progress', tags: ['UI', 'Design'], createdAt: new Date('2024-03-20').getTime() },
  { id: '2', title: 'Revisar documentação da API', project: 'Backend System', priority: 'medium', dueDate: 'Amanhã', status: 'todo', tags: ['API', 'Docs'], createdAt: new Date('2024-03-21').getTime() },
  { id: '3', title: 'Configurar banco de dados', project: 'CRM Project', priority: 'high', dueDate: '25 Mar', status: 'done', tags: ['DB', 'Backend'], createdAt: new Date('2024-03-19').getTime() },
  { id: '4', title: 'Entrevista com usuário', project: 'UX Research', priority: 'low', dueDate: '28 Mar', status: 'todo', tags: ['UX', 'Research'], createdAt: new Date('2024-03-22').getTime() },
  { id: '5', title: 'Fix bugs na autenticação', project: 'CRM Project', priority: 'high', dueDate: 'Hoje', status: 'in-progress', tags: ['Bug', 'Security'], createdAt: new Date('2024-03-23').getTime() },
  { id: 'k1', title: 'Pesquisa de mercado', project: 'Geral', priority: 'low', dueDate: 'Sem data', status: 'todo', tags: ['Research'], createdAt: Date.now() },
  { id: 'k2', title: 'Definir escopo do MVP', project: 'Geral', priority: 'high', dueDate: 'Sem data', status: 'todo', tags: ['Planning'], createdAt: Date.now() },
  { id: 'k3', title: 'Desenvolver landing page', project: 'Geral', priority: 'medium', dueDate: 'Sem data', status: 'in-progress', tags: ['Dev', 'UI'], createdAt: Date.now() },
  { id: 'k4', title: 'Setup do Firebase', project: 'Geral', priority: 'high', dueDate: 'Sem data', status: 'in-progress', tags: ['Backend'], createdAt: Date.now() },
  { id: 'k5', title: 'Testes unitários', project: 'Geral', priority: 'medium', dueDate: 'Sem data', status: 'review', tags: ['QA'], createdAt: Date.now() },
  { id: 'k6', title: 'Design do Logo', project: 'Geral', priority: 'low', dueDate: 'Sem data', status: 'done', tags: ['Design'], createdAt: Date.now() },
  { id: 'k7', title: 'Compra do domínio', project: 'Geral', priority: 'medium', dueDate: 'Sem data', status: 'done', tags: ['Admin'], createdAt: Date.now() },
];

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('crm_sidebar_collapsed');
    return saved === 'true';
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('crm_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!session?.user?.id) return;
    
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const { data: tasksData } = await supabase.from('tasks').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
        const { data: columnsData } = await supabase.from('columns').select('*').eq('user_id', session.user.id).order('order_index', { ascending: true });
        const { data: projectsData } = await supabase.from('projects').select('*').eq('user_id', session.user.id).order('created_at', { ascending: true });

        if (tasksData) {
          setTasks(tasksData.map(t => ({
            ...t,
            dueDate: t.due_date,
            calendarEventId: t.calendar_event_id,
            createdAt: t.created_at
          })) as unknown as Task[]);
        }

        if (columnsData && columnsData.length > 0) {
          setColumns(columnsData as Column[]);
        } else {
          const { data } = await supabase.from('columns').insert(
            INITIAL_COLUMNS.map((c, i) => ({ ...c, order_index: i, user_id: session.user.id }))
          ).select();
          if (data) setColumns(data as Column[]);
        }

        if (projectsData && projectsData.length > 0) {
          setProjects(projectsData as Project[]);
        } else {
          const initialProjects = [
            { id: Math.random().toString(36).substr(2, 9), name: 'Geral', description: 'Tarefas gerais sem projeto específico.', color: 'text-neutral-400', bg: 'bg-neutral-400/10', user_id: session.user.id },
            { id: Math.random().toString(36).substr(2, 9), name: 'CRM Personal', description: 'Sistema de gestão para projetos e tarefas.', color: 'text-brand-red', bg: 'bg-brand-red/10', user_id: session.user.id },
          ];
          const { data } = await supabase.from('projects').insert(initialProjects).select();
          if (data) setProjects(data as Project[]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();

    const taskSub = supabase.channel(`tasks-${session.user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${session.user.id}` }, fetchData).subscribe();
    const colSub = supabase.channel(`columns-${session.user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'columns', filter: `user_id=eq.${session.user.id}` }, fetchData).subscribe();
    const projSub = supabase.channel(`projects-${session.user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `user_id=eq.${session.user.id}` }, fetchData).subscribe();

    return () => {
      taskSub.unsubscribe();
      colSub.unsubscribe();
      projSub.unsubscribe();
    };
  }, [session]);

  const projectsWithStats = useMemo(() => {
    return projects.map(project => {
      const projectTasks = tasks.filter(t => t.project === project.name);
      return {
        ...project,
        tasks: projectTasks.length,
        completed: projectTasks.filter(t => t.status === 'done').length
      };
    });
  }, [projects, tasks]);

  const addProject = async (newProject: { name: string; description: string; color: string }) => {
    const project = {
      id: Math.random().toString(36).substr(2, 9),
      name: newProject.name,
      description: newProject.description,
      color: newProject.color,
      bg: newProject.color.replace('text', 'bg') + '/10',
    };
    
    // Optimistic
    setProjects(prev => [...prev, project as any]);
    await supabase.from('projects').insert([{ ...project, user_id: session?.user?.id }]);
  };

  const editProject = async (id: string, projectData: { name: string; description: string; color: string }) => {
    const bg = projectData.color.replace('text', 'bg') + '/10';
    const updatedProject = { ...projectData, bg };
    
    // Optimistic
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updatedProject } : p));
    await supabase.from('projects').update(updatedProject).eq('id', id);
  };

  const deleteProject = async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    await supabase.from('projects').delete().eq('id', id);
  };

  const navigateToProjectTasks = (projectName: string) => {
    setSelectedProjectFilter(projectName);
    setCurrentView('tasks');
  };

  const handleAddTask = useCallback(async (newTask: Partial<Task>) => {
    const task: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTask.title || 'Nova Tarefa',
      project: newTask.project || 'Geral',
      priority: (newTask.priority as any) || 'medium',
      dueDate: newTask.dueDate || 'Sem data',
      status: newTask.status || (columns.length > 0 ? columns[0].id : 'todo'),
      tags: newTask.tags || [],
      description: newTask.description || '',
      subtasks: newTask.subtasks || [],
      attachments: newTask.attachments || [],
      createdAt: Date.now(),
    };
    
    // Sync with Calendar if needed
    let calendarEventId: string | undefined;
    if (task.dueDate !== 'Sem data' && session?.user?.id) {
      const parts = task.dueDate.split(' ');
      const dateStr = parts[0];
      const timeStr = parts.length > 1 ? parts[1] : '09:00';
      const startTime = new Date(`${dateStr}T${timeStr}:00`);
      const endTime = new Date(startTime.getTime() + 3600000);
      
      const { data: eventData } = await supabase.from('calendar_events').insert([{
        title: `Tarefa: ${task.title}`,
        description: task.description,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        color: 'bg-blue-500',
        user_id: session.user.id
      }]).select();
      
      if (eventData?.[0]) {
        calendarEventId = eventData[0].id;
        task.calendarEventId = calendarEventId;
      }
    }

    // Optimistic
    setTasks(prev => [task, ...prev]);
    
    await supabase.from('tasks').insert([{
      id: task.id,
      title: task.title,
      project: task.project,
      priority: task.priority,
      due_date: task.dueDate,
      status: task.status,
      tags: task.tags,
      description: task.description,
      subtasks: task.subtasks,
      attachments: task.attachments,
      calendar_event_id: calendarEventId,
      created_at: task.createdAt,
      user_id: session?.user?.id
    }]);
  }, [columns, session]);

  const handleUpdateTask = useCallback(async (updatedTask: Task) => {
    // Sync with Calendar
    let calendarEventId = updatedTask.calendarEventId;
    if (session?.user?.id) {
      if (updatedTask.dueDate !== 'Sem data') {
        const parts = updatedTask.dueDate.split(' ');
        const dateStr = parts[0];
        const timeStr = parts.length > 1 ? parts[1] : '09:00';
        const startTime = new Date(`${dateStr}T${timeStr}:00`);
        const endTime = new Date(startTime.getTime() + 3600000);
        
        const eventData = {
          title: `Tarefa: ${updatedTask.title}`,
          description: updatedTask.description || '',
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          color: 'bg-blue-500',
          user_id: session.user.id
        };

        if (calendarEventId) {
          await supabase.from('calendar_events').update(eventData).eq('id', calendarEventId);
        } else {
          const { data } = await supabase.from('calendar_events').insert([eventData]).select();
          if (data?.[0]) {
            calendarEventId = data[0].id;
            updatedTask.calendarEventId = calendarEventId;
          }
        }
      } else if (calendarEventId) {
        // Removed due date, delete calendar event
        await supabase.from('calendar_events').delete().eq('id', calendarEventId);
        calendarEventId = undefined;
        updatedTask.calendarEventId = undefined;
      }
    }

    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    
    await supabase.from('tasks').update({
      title: updatedTask.title,
      project: updatedTask.project,
      priority: updatedTask.priority,
      due_date: updatedTask.dueDate,
      status: updatedTask.status,
      tags: updatedTask.tags,
      description: updatedTask.description,
      subtasks: updatedTask.subtasks,
      attachments: updatedTask.attachments,
      calendar_event_id: calendarEventId
    }).eq('id', updatedTask.id);
  }, [session]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (taskToDelete?.calendarEventId) {
      await supabase.from('calendar_events').delete().eq('id', taskToDelete.calendarEventId);
    }
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await supabase.from('tasks').delete().eq('id', taskId);
  }, [tasks]);

  const handleUpdateColumns = useCallback(async (newColumns: Column[]) => {
    setColumns(newColumns);
    
    const updates = newColumns.map((c, i) => ({
      id: c.id,
      title: c.title,
      order_index: i,
    }));
    
    for (const update of updates) {
      await supabase.from('columns').update({ order_index: update.order_index }).eq('id', update.id);
    }
  }, []);

  const handleAddColumn = useCallback(async (title: string, columnsLength: number = columns.length) => {
    const id = title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    const newCol = { id, title };
    
    setColumns(prev => {
      const next = [...prev, newCol];
      supabase.from('columns').insert([{ ...newCol, order_index: next.length - 1, user_id: session?.user?.id }]).then();
      return next;
    });
  }, [columns]);

  const handleDeleteColumn = useCallback(async (columnId: string) => {
    // We get fallback logic inside the effect but closure might have old state
    // Let's use the current length from state via functional update
    let fallbackId = 'todo';
    setColumns(prevColumns => {
      const remaining = prevColumns.filter(c => c.id !== columnId);
      if (remaining.length > 0) fallbackId = remaining[0].id;
      return remaining;
    });

    setTasks(prev => prev.map(t => t.status === columnId ? { ...t, status: fallbackId } : t));
    
    // DB: Update tasks first to avoid cascade delete if necessary 
    await supabase.from('tasks').update({ status: fallbackId }).eq('status', columnId);
    await supabase.from('columns').delete().eq('id', columnId);
  }, []);

  const handleRenameColumn = useCallback(async (columnId: string, newTitle: string) => {
    setColumns(prev => prev.map(col => col.id === columnId ? { ...col, title: newTitle } : col));
    await supabase.from('columns').update({ title: newTitle }).eq('id', columnId);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': 
        return <Dashboard onAddProject={addProject} projects={projectsWithStats} tasks={tasks} />;
      case 'tasks': 
        return (
          <Tasks 
            tasks={tasks}
            columns={columns}
            projects={projectsWithStats}
            onNavigateToProjects={() => setCurrentView('projects')}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            initialProjectFilter={selectedProjectFilter} 
            onClearFilter={() => setSelectedProjectFilter(null)} 
          />
        );
      case 'kanban': 
        return (
          <Kanban 
            tasks={tasks}
            columns={columns}
            projects={projectsWithStats}
            onNavigateToProjects={() => setCurrentView('projects')}
            onUpdateTasks={setTasks}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onAddColumn={handleAddColumn}
            onDeleteColumn={handleDeleteColumn}
            onRenameColumn={handleRenameColumn}
            onUpdateColumns={handleUpdateColumns}
          />
        );
      case 'projects': 
        return (
          <Projects 
            projects={projectsWithStats} 
            onAddProject={addProject} 
            onEditProject={editProject}
            onDeleteProject={deleteProject}
            onProjectClick={navigateToProjectTasks}
          />
        );
      case 'calendar': 
        return <Calendar />;
      case 'knowledge': 
        return <KnowledgeBase />;
      case 'notes': 
        return <Notes />;
      case 'law-of-attraction':
        return <LawOfAttraction />;
      case 'rituals':
        return <Rituals />;
      case 'challenge':
        return <Challenge />;
      case 'mental-map':
        return <MentalMap />;
      default: 
        return <Dashboard onAddProject={addProject} projects={projectsWithStats} tasks={tasks} />;
    }
  };

  if (!session) {
    return <Auth />;
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Settings className="text-brand-red w-12 h-12" />
        </motion.div>
        <p className="text-neutral-400 font-bold uppercase tracking-widest text-xs animate-pulse">
          Confirmando dados no banco...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-neutral-800 dark:text-neutral-200 flex transition-colors duration-300">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <main className={cn(
        "flex-1 min-h-screen flex flex-col w-full transition-all duration-300",
        isSidebarCollapsed ? "lg:ml-16" : "lg:ml-60"
      )}>
        {/* Top Navbar */}
        <header className="h-14 border-b border-dark-border/50 px-4 lg:px-8 flex items-center justify-between sticky top-0 bg-dark-bg/80 backdrop-blur-md z-40 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1 text-neutral-600 hover:text-brand-red transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-600">
              <span className="text-neutral-700 dark:text-neutral-400">
                {currentView === 'dashboard' ? 'Painel' :
                 currentView === 'tasks' ? 'Todas as Tarefas' :
                 currentView === 'kanban' ? 'Quadro Kanban' :
                 currentView === 'calendar' ? 'Agenda' :
                 currentView === 'projects' ? 'Projetos' :
                 currentView === 'knowledge' ? 'Base de Conhecimento' :
                 currentView === 'notes' ? 'Anotações' :
                 currentView === 'law-of-attraction' ? 'Lei da Atração' :
                 currentView === 'rituals' ? 'Rituais' :
                 currentView === 'challenge' ? 'Desafio 21 Dias' :
                 currentView === 'mental-map' ? 'Mapa Mental' :
                 currentView.replace('-', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleTheme}
                className="p-1 text-neutral-600 hover:text-brand-red transition-colors"
                title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              >
                <Settings size={14} />
              </button>
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-[10px] font-bold text-neutral-500 hover:text-white transition-colors px-3 py-1.5 bg-dark-card border border-dark-border rounded-lg ml-2 uppercase tracking-widest"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
