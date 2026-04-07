import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Folder, Users, Clock, ArrowRight, CheckSquare, Trash2, Edit2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { ProjectModal } from './ProjectModal';
import { Project } from '../types';

interface ProjectsProps {
  projects: Project[];
  onAddProject: (project: { name: string; description: string; color: string }) => void;
  onEditProject: (id: string, project: { name: string; description: string; color: string }) => void;
  onDeleteProject: (id: string) => void;
  onProjectClick: (projectName: string) => void;
}

export const Projects: React.FC<ProjectsProps> = ({ projects, onAddProject, onEditProject, onDeleteProject, onProjectClick }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleSave = (projectData: { name: string; description: string; color: string }) => {
    if (editingProject) {
      onEditProject(editingProject.id, projectData);
    } else {
      onAddProject(projectData);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Seus Projetos</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 mt-1">Gerencie todos os seus empreendimentos em um só lugar</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-red hover:bg-brand-red-hover text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-red/20 text-[10px] uppercase tracking-widest"
        >
          <Plus size={16} />
          Novo Projeto
        </button>
      </header>

      <ProjectModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSave={handleSave} 
        initialData={editingProject ? {
          name: editingProject.name,
          description: editingProject.description,
          color: editingProject.color
        } : undefined}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map((project) => (
          <motion.div 
            key={project.id}
            whileHover={{ y: -8 }}
            onClick={() => onProjectClick(project.name)}
            className="bg-dark-card border border-dark-border p-6 rounded-2xl group cursor-pointer relative"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={cn("p-4 rounded-2xl", project.bg)}>
                <Folder className={project.color} size={28} />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-neutral-500 text-sm font-medium">
                  <Clock size={14} />
                  <span>Ativo</span>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(project);
                    }}
                    className="p-2 text-neutral-600 hover:text-white hover:bg-neutral-800 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(project.id);
                    }}
                    className="p-2 text-neutral-600 hover:text-brand-red hover:bg-brand-red/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-2 group-hover:text-brand-red transition-colors">{project.name}</h3>
            <p className="text-neutral-400 text-sm mb-6 line-clamp-2">{project.description || 'Sem descrição.'}</p>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Progresso</span>
                <span className="font-bold">
                  {project.tasks > 0 ? Math.round((project.completed / project.tasks) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${project.tasks > 0 ? (project.completed / project.tasks) * 100 : 0}%` }}
                  className={cn("h-full rounded-full", project.color.replace('text', 'bg'))}
                />
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-dark-border">
                <div className="flex items-center gap-4 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <CheckSquare size={14} />
                    {project.completed}/{project.tasks} Tarefas
                  </span>
                </div>
                <ArrowRight size={20} className="text-neutral-600 group-hover:text-brand-red transition-all group-hover:translate-x-1" />
              </div>
            </div>
          </motion.div>
        ))}
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="border-2 border-dashed border-dark-border rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 transition-all group min-h-[300px]"
        >
          <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={32} />
          </div>
          <span className="font-bold">Criar Novo Projeto</span>
        </button>
      </div>
    </motion.div>
  );
};
