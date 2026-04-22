import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Trello, 
  Briefcase, 
  Calendar as CalendarIcon, 
  BookOpen, 
  StickyNote,
  Sparkles,
  Sunrise,
  Flame,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Network
} from 'lucide-react';
import { View } from '../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  isOpen, 
  onClose,
  isCollapsed,
  onToggleCollapse
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Todas tarefas', icon: CheckSquare },
    { id: 'kanban', label: 'Kanban', icon: Trello },
    { id: 'projects', label: 'Projetos', icon: Briefcase },
    { id: 'calendar', label: 'Agenda', icon: CalendarIcon },
    { id: 'knowledge', label: 'Fontes de conhecimento', icon: BookOpen },
    { id: 'notes', label: 'Anotação', icon: StickyNote },
    { id: 'law-of-attraction', label: 'Lei da Atração', icon: Sparkles },
    { id: 'rituals', label: 'Rituais', icon: Sunrise },
    { id: 'challenge', label: 'Desafio', icon: Flame },
    { id: 'mental-map', label: 'Mapa Mental', icon: Network },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <aside className={cn(
        "h-screen bg-dark-sidebar border-r border-dark-border/50 flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0 shadow-2xl shadow-black/50" : "-translate-x-full",
        isCollapsed ? "lg:w-16 w-64" : "w-64"
      )}>
        <div className={cn(
          "flex items-center justify-between transition-all duration-300",
          isCollapsed ? "lg:p-4 lg:flex-col lg:gap-4 p-8" : "p-8"
        )}>
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="DÁ ORDEM AO CAOS." 
              className={cn("shrink-0 transition-all duration-300 object-contain", isCollapsed ? "w-7 h-7" : "w-7 h-7")} 
            />
            {(!isCollapsed || isOpen) && (
              <h1 className={cn(
                "text-sm font-bold tracking-widest uppercase text-dark-bg invert dark:invert-0 whitespace-nowrap overflow-hidden transition-all duration-300",
                isCollapsed ? "lg:opacity-0 lg:w-0" : "opacity-100 w-auto"
              )}>
                DÁ ORDEM AO CAOS.
              </h1>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 text-neutral-600 hover:text-white hover:bg-white/5 rounded-md transition-all"
              title={isCollapsed ? "Expandir menu" : "Recolher menu"}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
            
            <button 
              onClick={onClose}
              className="lg:hidden p-1 text-neutral-600 hover:text-white transition-colors"
            >
              <ChevronRight size={18} className="rotate-180" />
            </button>
          </div>
        </div>

        <nav className={cn(
          "flex-1 py-2 space-y-1 transition-all duration-300",
          isCollapsed ? "lg:px-2 px-4" : "px-4"
        )}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id as View);
                if (window.innerWidth < 1024) onClose();
              }}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "w-full flex items-center rounded-lg transition-all duration-200 group text-xs",
                isCollapsed ? "lg:justify-center lg:p-2.5 px-3 py-2 gap-3" : "gap-3 px-3 py-2",
                currentView === item.id 
                  ? "bg-brand-red/10 text-brand-red" 
                  : "text-neutral-500 hover:text-neutral-300 dark:hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={isCollapsed ? 18 : 14} className={cn(
                "transition-transform duration-200 shrink-0",
                isCollapsed ? "lg:size-[18px] size-[14px]" : "size-[14px]",
                currentView === item.id ? "text-brand-red" : "text-neutral-600 group-hover:text-neutral-400"
              )} />
              <span className={cn(
                "font-semibold flex-1 text-left tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300",
                isCollapsed ? "lg:opacity-0 lg:w-0" : "opacity-100 w-auto"
              )}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className={cn(
          "border-t border-dark-border/50 transition-all duration-300",
          isCollapsed ? "lg:p-2 p-6" : "p-6"
        )}>
          <div className={cn(
            "flex items-center mb-2",
            isCollapsed ? "lg:justify-center px-3 py-2 gap-3" : "gap-3 px-3 py-2"
          )}>
            <div className="w-8 h-8 rounded-full bg-neutral-900 border border-dark-border flex items-center justify-center text-[10px] font-bold text-neutral-400 shrink-0">
              RZ
            </div>
            <div className={cn(
              "flex-1 overflow-hidden transition-all duration-300",
              isCollapsed ? "lg:opacity-0 lg:w-0" : "opacity-100 w-auto"
            )}>
              <p className="text-[10px] font-bold truncate text-neutral-400 dark:text-neutral-300">Rafael Zext</p>
            </div>
          </div>
          <button 
            className={cn(
              "w-full flex items-center text-neutral-600 hover:text-brand-red transition-colors text-[10px] font-bold uppercase tracking-wider",
              isCollapsed ? "lg:justify-center lg:p-2 px-3 py-1.5 gap-2.5" : "gap-2.5 px-3 py-1.5"
            )}
            title={isCollapsed ? "Sair" : undefined}
          >
            <LogOut size={isCollapsed ? 16 : 12} className={cn(
              "shrink-0",
              isCollapsed ? "lg:size-[16px] size-[12px]" : "size-[12px]"
            )} />
            <span className={cn(
              "transition-all duration-300 overflow-hidden",
              isCollapsed ? "lg:opacity-0 lg:w-0" : "opacity-100 w-auto"
            )}>
              Sair
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};
