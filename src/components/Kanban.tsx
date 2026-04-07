import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  MoreHorizontal, 
  GripVertical, 
  Trash2, 
  Edit2, 
  X,
  Check,
  Timer
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, Column, Project } from '../types';
import { TaskModal } from './TaskModal';
import { PomodoroTimer } from './PomodoroTimer';

interface SortableTaskProps {
  task: Task;
  columnId: string;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
}

const SortableTask: React.FC<SortableTaskProps> = ({ task, columnId, onDelete, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'Task', task, columnId } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const handleEditSubmit = () => {
    if (editTitle.trim() && editTitle !== task.title) {
      onEdit({ ...task, title: editTitle });
    }
    setIsEditing(false);
    setShowMenu(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-brand-red';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-neutral-500';
    }
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-dark-card/50 border border-brand-red/30 p-4 rounded-xl h-[100px] opacity-50"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-dark-card border border-dark-border p-4 rounded-xl shadow-lg cursor-grab active:cursor-grabbing group relative"
    >
      <div className="flex justify-between items-start mb-3">
        <div 
          className={cn("w-12 h-1 rounded-full", getPriorityColor(task.priority))} 
          {...attributes} 
          {...listeners}
        />
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="text-neutral-600 group-hover:text-neutral-400 transition-colors p-1 hover:bg-neutral-800 rounded"
          >
            <MoreHorizontal size={16} />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-1 w-36 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl z-20 overflow-hidden"
                >
                  <button 
                    onClick={() => { setIsEditing(true); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-neutral-800 flex items-center gap-2 text-neutral-300"
                  >
                    <Edit2 size={12} /> Editar
                  </button>
                  <button 
                    onClick={() => { onDelete(task.id); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-brand-red/10 flex items-center gap-2 text-brand-red"
                  >
                    <Trash2 size={12} /> Excluir
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-sm focus:outline-none focus:border-brand-red resize-none"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleEditSubmit();
              }
              if (e.key === 'Escape') setIsEditing(false);
            }}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsEditing(false)} className="p-1 text-neutral-500 hover:text-white"><X size={14}/></button>
            <button onClick={handleEditSubmit} className="p-1 text-brand-red hover:text-brand-red-hover"><Check size={14}/></button>
          </div>
        </div>
      ) : (
        <div {...attributes} {...listeners}>
          <h4 className="font-medium mb-3 text-sm text-white">{task.title}</h4>
          <div className="flex flex-wrap gap-2">
            {task.tags.map(tag => (
              <span key={tag} className="text-[9px] uppercase font-bold tracking-wider bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex -space-x-2">
              <div className="w-5 h-5 rounded-full bg-neutral-700 border border-dark-card flex items-center justify-center text-[7px] font-bold">
                RZ
              </div>
            </div>
            <GripVertical size={14} className="text-neutral-700" />
          </div>
        </div>
      )}
    </div>
  );
};

interface SortableColumnProps {
  column: Column;
  tasks: Task[];
  onAddTask: (columnId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteColumn: (columnId: string) => void;
  onRenameColumn: (columnId: string, newTitle: string) => void;
}

const SortableColumn: React.FC<SortableColumnProps> = ({ 
  column, 
  tasks, 
  onAddTask, 
  onDeleteTask, 
  onEditTask, 
  onDeleteColumn,
  onRenameColumn,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, data: { type: 'Column', column } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameTitle, setRenameTitle] = useState(column.title);

  const handleRenameSubmit = () => {
    if (renameTitle.trim() && renameTitle !== column.title) {
      onRenameColumn(column.id, renameTitle);
    }
    setIsRenaming(false);
    setShowMenu(false);
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="w-80 flex-shrink-0 bg-dark-card/20 border border-brand-red/20 rounded-2xl min-h-[500px] opacity-50"
      />
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="w-80 flex-shrink-0 flex flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-neutral-800 rounded">
            <GripVertical size={14} className="text-neutral-600" />
          </div>
          {isRenaming ? (
            <input
              autoFocus
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') setIsRenaming(false);
              }}
              className="bg-neutral-900 border border-brand-red/50 rounded px-2 py-0.5 text-sm font-bold w-full focus:outline-none"
            />
          ) : (
            <h3 className="font-bold text-lg truncate">{column.title}</h3>
          )}
          <span className="bg-neutral-800 text-neutral-400 text-xs px-2 py-0.5 rounded-full flex-shrink-0">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1 relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="text-neutral-500 hover:text-white transition-colors p-1 hover:bg-neutral-800 rounded"
          >
            <Plus size={18} />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-1 w-40 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl z-20 overflow-hidden"
                >
                  <button 
                    onClick={() => { onAddTask(column.id); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-neutral-800 flex items-center gap-2 text-neutral-300"
                  >
                    <Plus size={12} /> Adicionar Tarefa
                  </button>
                  <button 
                    onClick={() => { setIsRenaming(true); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-neutral-800 flex items-center gap-2 text-neutral-300"
                  >
                    <Edit2 size={12} /> Renomear Coluna
                  </button>
                  <button 
                    onClick={() => { onDeleteColumn(column.id); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-brand-red/10 flex items-center gap-2 text-brand-red"
                  >
                    <Trash2 size={12} /> Excluir Coluna
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 bg-dark-card/30 border border-dark-border rounded-2xl p-4 min-h-[500px]">
        <SortableContext
          id={column.id}
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {tasks.map((task) => (
              <SortableTask 
                key={task.id} 
                task={task} 
                columnId={column.id} 
                onDelete={onDeleteTask}
                onEdit={onEditTask}
              />
            ))}
          </div>
        </SortableContext>
        
        <div className="mt-4">
          <button 
            onClick={() => onAddTask(column.id)}
            className="w-full py-3 border-2 border-dashed border-dark-border rounded-xl text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 transition-all flex items-center justify-center gap-2 text-sm font-medium group"
          >
            <Plus size={16} className="group-hover:scale-110 transition-transform" />
            Adicionar Card
          </button>
        </div>
      </div>
    </div>
  );
};

interface KanbanProps {
  tasks: Task[];
  columns: Column[];
  projects: Project[];
  onNavigateToProjects: () => void;
  onUpdateTasks: (tasks: Task[]) => void;
  onAddTask: (task: Partial<Task>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddColumn: (title: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onRenameColumn: (columnId: string, newTitle: string) => void;
  onUpdateColumns: (columns: Column[]) => void;
}

export const Kanban: React.FC<KanbanProps> = ({
  tasks,
  columns,
  projects,
  onNavigateToProjects,
  onUpdateTasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddColumn,
  onDeleteColumn,
  onRenameColumn,
  onUpdateColumns,
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  
  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedColumnForTask, setSelectedColumnForTask] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showPomodoro, setShowPomodoro] = useState(false);

  // Inline adding states
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;
    if (data?.type === 'Task') {
      setActiveTask(data.task);
      setActiveColumnId(data.columnId);
    } else if (data?.type === 'Column') {
      setActiveColumnId(data.column.id);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || activeData.type !== 'Task') return;

    const activeColId = activeData.columnId;
    const overColId = overData?.type === 'Column' ? overId : overData?.columnId;

    if (!overColId || activeColId === overColId) return;

    onUpdateTasks(tasks.map(t => {
      if (t.id === activeId) {
        return { ...t, status: overColId as string };
      }
      return t;
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveTask(null);
      setActiveColumnId(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Handle Column Reordering
    if (activeData?.type === 'Column') {
      const overColId = overData?.type === 'Column' ? overId : overData?.columnId;
      
      if (overColId && activeId !== overColId) {
        const oldIndex = columns.findIndex((col) => col.id === activeId);
        const newIndex = columns.findIndex((col) => col.id === overColId);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          onUpdateColumns(arrayMove(columns, oldIndex, newIndex));
        }
      }
      
      setActiveTask(null);
      setActiveColumnId(null);
      return;
    }

    // Handle Task Reordering within same column
    if (activeData?.type === 'Task' && overData?.columnId === activeData.columnId && activeId !== overId) {
      const columnTasks = tasks.filter(t => t.status === activeData.columnId);
      const otherTasks = tasks.filter(t => t.status !== activeData.columnId);
      
      const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
      const newIndex = columnTasks.findIndex((t) => t.id === overId);

      const reorderedColumnTasks = arrayMove(columnTasks, oldIndex, newIndex);
      onUpdateTasks([...otherTasks, ...reorderedColumnTasks]);
    }

    setActiveTask(null);
    setActiveColumnId(null);
  };

  const handleOpenTaskModal = (columnId?: string, task?: Task) => {
    if (task) {
      setEditingTask(task);
      setSelectedColumnForTask(task.status);
    } else {
      setEditingTask(null);
      setSelectedColumnForTask(columnId || columns[0]?.id || null);
    }
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      onUpdateTask({ ...editingTask, ...taskData } as Task);
    } else {
      onAddTask(taskData);
    }
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleAddColumnSubmit = () => {
    if (!newColumnTitle.trim()) {
      setIsAddingColumn(false);
      return;
    }
    onAddColumn(newColumnTitle);
    setNewColumnTitle('');
    setIsAddingColumn(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-brand-red';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-neutral-500';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full flex flex-col space-y-6"
    >
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quadro Kanban</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 mt-1">Visualize o fluxo de trabalho dos seus projetos</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setShowPomodoro(!showPomodoro)}
            className={cn(
              "flex-1 sm:flex-none p-2.5 rounded-xl border transition-all flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest",
              showPomodoro ? "bg-brand-red/10 border-brand-red text-brand-red" : "bg-dark-card border-dark-border text-neutral-500 hover:text-white"
            )}
          >
            <Timer size={16} />
            Pomodoro
          </button>
          <button 
            onClick={() => setIsAddingColumn(true)}
            className="flex-1 sm:flex-none bg-brand-red hover:bg-brand-red-hover text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-red/20 active:scale-95 text-[10px] uppercase tracking-widest"
          >
            <Plus size={16} />
            Nova Coluna
          </button>
        </div>
      </header>

      {showPomodoro && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <PomodoroTimer />
        </motion.div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex gap-6 overflow-x-auto pb-6 min-h-[600px] items-start">
          <SortableContext
            items={columns.map(col => col.id)}
            strategy={horizontalListSortingStrategy}
          >
            {columns.map((column) => (
              <SortableColumn
                key={column.id}
                column={column}
                tasks={tasks.filter(t => t.status === column.id)}
                onAddTask={() => handleOpenTaskModal(column.id)}
                onDeleteTask={onDeleteTask}
                onEditTask={(task) => handleOpenTaskModal(undefined, task)}
                onDeleteColumn={onDeleteColumn}
                onRenameColumn={onRenameColumn}
              />
            ))}
          </SortableContext>
          
          {isAddingColumn && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-80 flex-shrink-0 bg-dark-card border border-brand-red/50 p-4 rounded-2xl space-y-4"
            >
              <input
                autoFocus
                type="text"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="Nome da coluna..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-red transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddColumnSubmit();
                  if (e.key === 'Escape') setIsAddingColumn(false);
                }}
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setIsAddingColumn(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-500 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddColumnSubmit}
                  className="bg-brand-red text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-red-hover transition-colors"
                >
                  Criar
                </button>
              </div>
            </motion.div>
          )}
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activeTask ? (
            <div className="bg-dark-card border border-brand-red p-4 rounded-xl shadow-2xl w-80 opacity-90 cursor-grabbing">
              <div className="flex justify-between items-start mb-3">
                <div className={cn("w-12 h-1 rounded-full", getPriorityColor(activeTask.priority))} />
              </div>
              <h4 className="font-medium mb-3 text-sm text-white">{activeTask.title}</h4>
              <div className="flex flex-wrap gap-2">
                {activeTask.tags.map(tag => (
                  <span key={tag} className="text-[9px] uppercase font-bold tracking-wider bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : activeColumnId ? (
            <div className="w-80 bg-dark-card border border-brand-red/50 rounded-2xl p-4 min-h-[200px] shadow-2xl opacity-90">
              <h3 className="font-bold text-lg mb-4">{columns.find(c => c.id === activeColumnId)?.title}</h3>
              <div className="space-y-4">
                {tasks.filter(t => t.status === activeColumnId).slice(0, 2).map(task => (
                  <div key={task.id} className="bg-dark-card border border-dark-border p-4 rounded-xl shadow-lg">
                    <h4 className="font-medium text-sm text-white">{task.title}</h4>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskModal 
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        columns={columns}
        projects={projects}
        onNavigateToProjects={onNavigateToProjects}
        initialStatus={selectedColumnForTask || undefined}
        task={editingTask || undefined}
      />
    </motion.div>
  );
};
