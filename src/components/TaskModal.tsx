import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Check, 
  Calendar, 
  Clock, 
  Bell, 
  RefreshCw, 
  Plus,
  Trello,
  Upload,
  ChevronDown,
  Trash2,
  FileText
} from 'lucide-react';
import { cn } from '../lib/utils';

import { Task, Column, Project } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (task: Partial<Task>) => void;
  columns: Column[];
  projects: Project[];
  onNavigateToProjects: () => void;
  initialStatus?: string;
  task?: Task;
}

export const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  columns, 
  projects,
  onNavigateToProjects,
  initialStatus, 
  task 
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [priority, setPriority] = useState('medium');
  const [project, setProject] = useState('Geral');
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(initialStatus || (columns.length > 0 ? columns[0].id : 'todo'));
  const [recurrence, setRecurrence] = useState('Sem recorrência');
  const [notification, setNotification] = useState('Me avisar');
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [attachments, setAttachments] = useState<{ id: string; name: string; type: string; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setPriority(task.priority);
      setProject(task.project);
      setTags(task.tags.join(', '));
      setStatus(task.status);
      
      let d = task.dueDate;
      let t = '';
      if (d && d !== 'Sem data') {
        const parts = d.split(' ');
        if (parts.length > 1 && /^\d{2}:\d{2}$/.test(parts[parts.length - 1])) {
          t = parts.pop() || '';
          d = parts.join(' ');
        }
      } else {
        d = '';
      }
      setDate(d);
      setTime(t);
      setDescription(task.description || '');
      setSubtasks(task.subtasks || []);
      setAttachments(task.attachments || []);
    } else {
      setTitle('');
      setPriority('medium');
      setProject('Geral');
      setTags('');
      setStatus(initialStatus || (columns.length > 0 ? columns[0].id : 'todo'));
      setDate('');
      setTime('');
      setDescription('');
      setSubtasks([]);
      setAttachments([]);
    }
  }, [task, initialStatus, columns, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments = Array.from(files).map((file: File) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file)
    }));

    setAttachments([...attachments, ...newAttachments]);
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks([...subtasks, { id: Date.now().toString(), title: newSubtask, completed: false }]);
    setNewSubtask('');
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(st => st.id === id ? { ...st, completed: !st.completed } : st));
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  const handleSave = () => {
    if (!title.trim()) {
      return;
    }

    const taskData: Partial<Task> = {
      title,
      priority: priority as any,
      project,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      status,
      dueDate: [date, time].filter(Boolean).join(' ') || 'Sem data',
      description,
      subtasks,
      attachments,
      createdAt: Date.now(),
    };

    if (onSave) {
      onSave(taskData);
    }
    
    // Reset form
    setTitle('');
    setDate('');
    setTime('');
    setPriority('medium');
    setProject('Geral');
    setTags('');
    setDescription('');
    setStatus(initialStatus || (columns.length > 0 ? columns[0].id : 'todo'));
    setRecurrence('Sem recorrência');
    setNotification('Me avisar');
    setSubtasks([]);
    setAttachments([]);
    
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-dark-card text-neutral-200 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-dark-border"
        >
          {/* Header */}
          <header className="px-6 py-4 border-b border-dark-border flex items-center justify-between bg-dark-bg/50">
            <div className="flex items-center gap-2">
              <div className="flex bg-dark-bg border border-dark-border rounded-lg p-1">
                <button className="px-4 py-1.5 text-xs font-bold bg-neutral-800 rounded-md">Tarefa</button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
          </header>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Título*</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="O que precisa ser feito?" 
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl focus:outline-none focus:border-brand-red transition-all text-lg font-medium"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Data</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" size={16} />
                    <input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-sm focus:outline-none focus:border-brand-red transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Hora</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" size={16} />
                      <input 
                        type="time" 
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-sm focus:outline-none focus:border-brand-red transition-all [color-scheme:dark]"
                      />
                    </div>
                    <div className="flex items-center gap-2 px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-sm text-neutral-400 cursor-pointer hover:bg-neutral-800 transition-colors">
                      <Bell size={16} />
                      <select 
                        value={notification}
                        onChange={(e) => setNotification(e.target.value)}
                        className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer appearance-none"
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
                </div>
              </div>

              {/* Priority & Project */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Prioridade</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-sm text-neutral-200 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Projeto</label>
                  <select 
                    value={project}
                    onChange={(e) => {
                      if (e.target.value === 'NEW_PROJECT') {
                        onNavigateToProjects();
                        onClose();
                      } else {
                        setProject(e.target.value);
                      }
                    }}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-sm text-neutral-200 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="Geral">Geral</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                    <option value="NEW_PROJECT" className="text-brand-red font-bold">+ Cadastrar projeto</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Tags (separadas por vírgula)</label>
                <input 
                  type="text" 
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="ex: UI, Design, Bug" 
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-sm focus:outline-none focus:border-brand-red transition-all"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Descrição</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Adicione mais detalhes sobre esta tarefa..." 
                  className="w-full px-4 py-4 bg-dark-bg border border-dark-border rounded-xl text-sm focus:outline-none focus:border-brand-red transition-all min-h-[150px] resize-none"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Subtasks */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-neutral-300">Subtarefas</h3>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                    placeholder="Adicionar subtarefa..." 
                    className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border rounded-xl text-sm focus:outline-none focus:border-brand-red transition-all"
                  />
                  <button 
                    onClick={handleAddSubtask}
                    className="p-2 bg-neutral-800 border border-dark-border rounded-xl text-neutral-400 hover:text-white transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                
                <div className="space-y-2">
                  {subtasks.length > 0 ? (
                    subtasks.map(st => (
                      <div key={st.id} className="flex items-center gap-2 group">
                        <input 
                          type="checkbox" 
                          checked={st.completed}
                          onChange={() => toggleSubtask(st.id)}
                          className="w-4 h-4 rounded border-neutral-700 bg-dark-bg text-brand-red focus:ring-brand-red"
                        />
                        <span className={cn("text-sm flex-1", st.completed && "line-through text-neutral-600")}>
                          {st.title}
                        </span>
                        <button 
                          onClick={() => removeSubtask(st.id)}
                          className="opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-brand-red transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-neutral-600 text-center py-4 italic">Nenhuma subtarefa</p>
                  )}
                </div>
              </div>

              {/* Kanban */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-neutral-300">
                  <Trello size={18} />
                  <h3 className="text-sm font-bold">Coluna Kanban</h3>
                </div>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-sm text-neutral-200 focus:outline-none appearance-none cursor-pointer"
                >
                  {columns.map(col => (
                    <option key={col.id} value={col.id}>{col.title}</option>
                  ))}
                </select>
              </div>

              {/* Attachments */}
              <div className="space-y-2 border-t border-dark-border pt-6">
                <h3 className="text-sm font-bold text-neutral-300">Anexos</h3>
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  accept="image/*"
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-dark-border rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-neutral-600 hover:bg-neutral-800/50 hover:border-neutral-700 transition-all cursor-pointer group"
                >
                  <Upload size={24} className="group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-medium">Adicionar arquivos</p>
                </div>

                {attachments.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {attachments.map(file => (
                      <div key={file.id} className="relative group bg-dark-bg rounded-xl p-2 flex items-center gap-2 border border-dark-border">
                        {file.type.startsWith('image/') ? (
                          <div className="w-8 h-8 rounded bg-neutral-800 overflow-hidden">
                            <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <FileText size={16} className="text-neutral-600" />
                        )}
                        <span className="text-[10px] font-medium text-neutral-400 truncate flex-1">{file.name}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeAttachment(file.id); }}
                          className="text-neutral-600 hover:text-brand-red transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="px-8 py-6 border-t border-dark-border flex gap-4 bg-dark-bg/50">
            <button 
              onClick={onClose}
              className="flex-1 py-3 bg-dark-card border border-dark-border rounded-xl font-bold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 py-3 bg-brand-red hover:bg-brand-red-hover text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-red/10 active:scale-95"
            >
              Salvar Tarefa
            </button>
          </footer>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
