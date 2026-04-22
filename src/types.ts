export type Priority = 'low' | 'medium' | 'high';

export type View = 'dashboard' | 'tasks' | 'calendar' | 'projects' | 'kanban' | 'settings' | 'knowledge' | 'notes' | 'law-of-attraction' | 'rituals' | 'challenge' | 'mental-map';

export interface Task {
  id: string;
  title: string;
  project: string;
  priority: Priority;
  dueDate: string;
  status: string; // This corresponds to Column ID
  tags: string[];
  description?: string;
  subtasks?: { id: string; title: string; completed: boolean }[];
  attachments?: { id: string; name: string; type: string; url: string }[];
  calendarEventId?: string;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  tasks: number;
  completed: number;
  color: string;
  bg: string;
}

export interface Column {
  id: string;
  title: string;
}

export interface MentalMap {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface MentalMapNode {
  id: string;
  map_id: string;
  data: any;
  position: { x: number; y: number };
  type: string;
}

export interface MentalMapEdge {
  id: string;
  map_id: string;
  source: string;
  target: string;
}
