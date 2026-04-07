import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Calendar, 
  CheckSquare, 
  Folder, 
  Tag, 
  ArrowUpDown, 
  FilterX,
  Copy,
  Trash2,
  Flag,
  Check,
  Edit2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { TaskModal } from './TaskModal';

import { Task, Column, Project } from '../types';

interface TasksProps {
  tasks: Task[];
  columns: Column[];
  projects: Project[];
  onNavigateToProjects: () => void;
  onAddTask: (task: Partial<Task>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  initialProjectFilter?: string | null;
  onClearFilter?: () => void;
}

export const Tasks: React.FC<TasksProps> = ({ 
  tasks, 
  columns,
  projects,
  onNavigateToProjects,
  onAddTask, 
  onUpdateTask, 
  onDeleteTask, 
  initialProjectFilter, 
  onClearFilter 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(initialProjectFilter || null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<'project' | 'tag' | 'date' | null>(null);

  useEffect(() => {
    if (initialProjectFilter) {
      setSelectedProject(initialProjectFilter);
    }
  }, [initialProjectFilter]);

  const projectNames = useMemo(() => Array.from(new Set(tasks.map(t => t.project))), [tasks]);
  const allTags = useMemo(() => Array.from(new Set(tasks.flatMap(t => t.tags || []))), [tasks]);

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      onUpdateTask({ ...editingTask, ...taskData } as Task);
    } else {
      onAddTask(taskData);
    }
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
    setActiveMenu(null);
  };

  const toggleTaskStatus = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      onUpdateTask({ ...task, status: task.status === 'done' ? 'todo' : 'done' });
    }
  };

  const deleteTask = (id: string) => {
    onDeleteTask(id);
    setActiveMenu(null);
  };

  const duplicateTask = (task: Task) => {
    onAddTask({
      ...task,
      id: undefined, // Let handleAddTask generate a new ID
      title: `${task.title} (Cópia)`,
      createdAt: Date.now()
    });
    setActiveMenu(null);
  };

  const updatePriority = (id: string, priority: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      onUpdateTask({ ...task, priority: priority as any });
    }
    setActiveMenu(null);
  };

  const updateDueDate = (id: string, dueDate: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      onUpdateTask({ ...task, dueDate });
    }
    setActiveMenu(null);
  };

  const filteredTasks = useMemo(() => {
    let result = tasks.filter(task => 
      (task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.project.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!selectedProject || task.project === selectedProject) &&
      (!selectedTag || task.tags?.includes(selectedTag)) &&
      (!selectedDate || task.dueDate === selectedDate)
    );

    // Sort by createdAt (oldest to newest if asc)
    result.sort((a, b) => {
      const timeA = a.createdAt || 0;
      const timeB = b.createdAt || 0;
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });

    return result;
  }, [tasks, searchQuery, selectedProject, selectedTag, selectedDate, sortOrder]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-brand-red bg-brand-red/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'low': return 'text-blue-400 bg-blue-400/10';
      default: return 'text-neutral-400 bg-neutral-400/10';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 pb-32"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Todas as Tarefas</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 mt-1">Gerencie suas tarefas pendentes e concluídas</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-red hover:bg-brand-red-hover text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
        >
          Nova Tarefa
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-700" size={14} />
          <input 
            type="text" 
            placeholder="Buscar tarefas..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-card/30 border border-dark-border/50 rounded-xl py-2 pl-9 pr-4 text-xs text-neutral-200 focus:outline-none focus:border-neutral-700 transition-colors placeholder:text-neutral-700"
          />
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'project' ? null : 'project')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors",
              selectedProject 
                ? "bg-brand-red/10 border-brand-red/50 text-brand-red" 
                : "bg-dark-card/30 border-dark-border/50 text-neutral-500 hover:bg-neutral-800/50"
            )}
          >
            <Folder size={14} className={selectedProject ? "text-brand-red" : "text-neutral-600"} />
            <span>{selectedProject || 'Projetos'}</span>
          </button>
          <AnimatePresence>
            {activeFilterDropdown === 'project' && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-full left-0 mt-2 w-48 bg-dark-card border border-dark-border rounded-xl shadow-2xl z-30 py-1 overflow-hidden"
              >
                <button 
                  onClick={() => { setSelectedProject(null); setActiveFilterDropdown(null); }}
                  className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-600 hover:bg-neutral-800 transition-colors"
                >
                  Todos os projetos
                </button>
                {projectNames.map(p => (
                  <button 
                    key={p}
                    onClick={() => { setSelectedProject(p); setActiveFilterDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-300 hover:bg-neutral-800 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'tag' ? null : 'tag')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors",
              selectedTag 
                ? "bg-brand-red/10 border-brand-red/50 text-brand-red" 
                : "bg-dark-card/30 border-dark-border/50 text-neutral-500 hover:bg-neutral-800/50"
            )}
          >
            <Filter size={14} className={selectedTag ? "text-brand-red" : "text-neutral-600"} />
            <span>{selectedTag || 'Tags'}</span>
          </button>
          <AnimatePresence>
            {activeFilterDropdown === 'tag' && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-full left-0 mt-2 w-48 bg-dark-card border border-dark-border rounded-xl shadow-2xl z-30 py-1 overflow-hidden"
              >
                <button 
                  onClick={() => { setSelectedTag(null); setActiveFilterDropdown(null); }}
                  className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-600 hover:bg-neutral-800 transition-colors"
                >
                  Todas as tags
                </button>
                {allTags.map(t => (
                  <button 
                    key={t}
                    onClick={() => { setSelectedTag(t); setActiveFilterDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-300 hover:bg-neutral-800 transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <button 
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className={cn(
            "p-2 border rounded-xl transition-colors",
            sortOrder === 'asc' 
              ? "bg-brand-red/10 border-brand-red/50 text-brand-red" 
              : "bg-dark-card/30 border-dark-border/50 text-neutral-600 hover:text-white"
          )}
        >
          <ArrowUpDown size={16} />
        </button>

        <button 
          onClick={() => {
            setSearchQuery('');
            setSelectedProject(null);
            setSelectedTag(null);
            setSelectedDate(null);
            setSortOrder('desc');
            onClearFilter?.();
          }}
          className="p-2 bg-dark-card/30 border border-dark-border/50 rounded-xl text-neutral-600 hover:text-white transition-colors"
        >
          <FilterX size={16} />
        </button>
      </div>

      <div className="bg-dark-card/30 border border-dark-border/50 rounded-2xl overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-dark-border/50 bg-white/[0.02]">
              <th className="px-6 py-4 text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Tarefa</th>
              <th className="px-6 py-4 text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Projeto</th>
              <th className="px-6 py-4 text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Prioridade</th>
              <th className="px-6 py-4 text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Data</th>
              <th className="px-6 py-4 text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-neutral-600 uppercase tracking-widest"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border/30">
            {filteredTasks.map((task) => (
              <tr key={task.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleTaskStatus(task.id)}
                      className={cn(
                        "w-4 h-4 rounded-md border flex items-center justify-center transition-all",
                        task.status === 'done' ? "bg-green-500 border-green-500" : "border-neutral-800 group-hover:border-neutral-700"
                      )}
                    >
                      {task.status === 'done' && <Check size={10} className="text-white" />}
                    </button>
                    <span className={cn("text-xs font-medium tracking-tight", task.status === 'done' ? "text-neutral-700 line-through" : "text-neutral-300")}>
                      {task.title}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">{task.project}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest", getPriorityColor(task.priority))}>
                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-neutral-600">
                    <Calendar size={10} />
                    {task.dueDate}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      task.status === 'done' ? "bg-green-500/50" : task.status === 'in-progress' ? "bg-blue-500/50" : "bg-neutral-800"
                    )} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">{task.status.replace('-', ' ')}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right relative">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === task.id ? null : task.id)}
                    className="text-white transition-colors opacity-50 group-hover:opacity-100"
                  >
                    <MoreVertical size={14} />
                  </button>

                  <AnimatePresence>
                    {activeMenu === task.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setActiveMenu(null)}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute right-0 md:right-5 top-10 w-48 max-h-[80vh] overflow-y-auto bg-[#1a1a1a] border border-neutral-800 rounded-lg shadow-2xl z-50 py-1"
                        >
                          <button 
                            onClick={() => duplicateTask(task)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-800 transition-colors"
                          >
                            <Copy size={14} />
                            Duplicar
                          </button>

                          <button 
                            onClick={() => handleEditTask(task)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-800 transition-colors"
                          >
                            <Edit2 size={14} />
                            Editar
                          </button>
                          
                          <div className="border-t border-neutral-800 my-1" />
                          
                          <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-2">
                            <Calendar size={12} />
                            Mover para
                          </div>
                          <button onClick={() => updateDueDate(task.id, 'Hoje')} className="w-full text-left px-8 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-800">Hoje</button>
                          <button onClick={() => updateDueDate(task.id, 'Amanhã')} className="w-full text-left px-8 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-800">Amanhã</button>
                          <button onClick={() => updateDueDate(task.id, 'Próxima segunda')} className="w-full text-left px-8 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-800">Próxima segunda</button>
                          <button onClick={() => updateDueDate(task.id, 'Próximo dia 1')} className="w-full text-left px-8 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-800">Próximo dia 1</button>
                          <button className="w-full text-left px-8 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-800">Escolher data...</button>
                          <button onClick={() => updateDueDate(task.id, 'Sem data')} className="w-full text-left px-8 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-800">Remover data</button>
                          
                          <div className="border-t border-neutral-800 my-1" />
                          
                          <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-2">
                            <Flag size={12} />
                            Prioridade
                          </div>
                          <button onClick={() => updatePriority(task.id, 'high')} className="w-full flex items-center justify-between px-8 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-800">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-brand-red" />
                              Alta
                            </div>
                            {task.priority === 'high' && <Check size={12} />}
                          </button>
                          <button onClick={() => updatePriority(task.id, 'medium')} className="w-full flex items-center justify-between px-8 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-800">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-yellow-400" />
                              Média
                            </div>
                            {task.priority === 'medium' && <Check size={12} />}
                          </button>
                          <button onClick={() => updatePriority(task.id, 'low')} className="w-full flex items-center justify-between px-8 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-800">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-400" />
                              Baixa
                            </div>
                            {task.priority === 'low' && <Check size={12} />}
                          </button>
                          
                          <div className="border-t border-neutral-800 my-1" />
                          
                          <button 
                            onClick={() => deleteTask(task.id)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={14} />
                            Excluir
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }} 
        onSave={handleSaveTask}
        columns={columns}
        projects={projects}
        onNavigateToProjects={onNavigateToProjects}
        task={editingTask || undefined}
      />
    </motion.div>
  );
};
