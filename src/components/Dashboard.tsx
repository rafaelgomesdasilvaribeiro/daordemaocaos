import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Plus
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '../lib/utils';
import { ProjectModal } from './ProjectModal';
import { Project, Task } from '../types';

interface DashboardProps {
  onAddProject: (project: { name: string; description: string; color: string }) => void;
  projects: Project[];
  tasks: Task[];
}

export const Dashboard: React.FC<DashboardProps> = ({ onAddProject, projects, tasks }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get 4 most recent projects
  const recentProjects = [...projects].reverse().slice(0, 4);

  // Compute stats
  const activeTasks = tasks.filter(t => t.status !== 'done').length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  // Atrasadas - we need to see if dueDate is parseable and past.
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'done' || !t.dueDate || t.dueDate === 'Sem data') return false;
    const due = new Date(t.dueDate);
    if (isNaN(due.getTime())) return false; // not a date
    return due < new Date();
  }).length;
  
  const productivity = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Compute daily activity for the last 7 days
  const data = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      
      const startOfDay = new Date(d.setHours(0,0,0,0)).getTime();
      const endOfDay = new Date(d.setHours(23,59,59,999)).getTime();
      
      const tasksCreatedOrCompleted = tasks.filter(t => 
        (t.createdAt && t.createdAt >= startOfDay && t.createdAt <= endOfDay)
      ).length;

      result.push({ name: dayName, tasks: tasksCreatedOrCompleted });
    }
    return result;
  }, [tasks]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 mt-1">Visão geral do sistema</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-red hover:bg-brand-red-hover text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 w-full sm:w-auto"
        >
          Novo Projeto
        </button>
      </header>

      <ProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={onAddProject} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ativas', value: activeTasks.toString(), icon: Clock, color: 'text-blue-500' },
          { label: 'Concluídas', value: completedTasks.toString(), icon: CheckCircle2, color: 'text-green-500' },
          { label: 'Atrasadas', value: overdueTasks.toString().padStart(2, '0'), icon: AlertCircle, color: 'text-brand-red' },
          { label: 'Produtividade', value: `+${productivity}%`, icon: TrendingUp, color: 'text-purple-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-dark-card/50 border border-dark-border/50 p-6 rounded-2xl hover:border-neutral-800 transition-colors group">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">{stat.label}</p>
              <stat.icon className={cn(stat.color, "opacity-50 group-hover:opacity-100 transition-opacity")} size={14} />
            </div>
            <h3 className="text-2xl font-bold tracking-tight">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-dark-card/50 border border-dark-border/50 p-8 rounded-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Atividade Semanal</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="name" stroke="#404040" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#404040" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #262626', borderRadius: '8px', fontSize: '10px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="tasks" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorTasks)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-dark-card/50 border border-dark-border/50 p-8 rounded-2xl">
          <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-8">Projetos Recentes</h3>
          <div className="space-y-6">
            {recentProjects.length > 0 ? (
              recentProjects.map((project, i) => (
                <div key={project.id} className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-neutral-300">{project.name}</span>
                    <span className="text-neutral-600">
                      {project.tasks > 0 ? Math.round((project.completed / project.tasks) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-1 bg-neutral-900 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${project.tasks > 0 ? (project.completed / project.tasks) * 100 : 0}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={cn("h-full rounded-full", project.color.replace('text', 'bg'))}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-neutral-700 text-xs italic">
                Nenhum projeto recente.
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

