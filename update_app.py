import sys
import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to replace useState with [] and remove localStorage
# Find the start of the state declarations
state_pattern = re.compile(r'const \[selectedProjectFilter, setSelectedProjectFilter\] = useState<string \| null>\(null\);(.*?)const renderView = \(\) => \{', re.DOTALL)
match = state_pattern.search(content)

if not match:
    print('Pattern not found')
    sys.exit(1)

new_state_logic = '''
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!session?.user?.id) return;
    
    const fetchData = async () => {
      const { data: tasksData, error: taskErr } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      const { data: columnsData, error: colErr } = await supabase.from('columns').select('*').order('order_index', { ascending: true });
      const { data: projectsData, error: projErr } = await supabase.from('projects').select('*').order('created_at', { ascending: true });

      if (taskErr) console.error(taskErr);
      if (colErr) console.error(colErr);
      if (projErr) console.error(projErr);

      if (tasksData) {
        setTasks(tasksData.map(t => ({
          ...t,
          dueDate: t.due_date,
          createdAt: t.created_at
        })) as unknown as Task[]);
      }

      if (columnsData && columnsData.length > 0) {
        setColumns(columnsData as Column[]);
      } else {
        // Seed initial columns
        const { data } = await supabase.from('columns').insert(
          INITIAL_COLUMNS.map((c, i) => ({ ...c, order_index: i }))
        ).select();
        if (data) setColumns(data as Column[]);
      }

      if (projectsData && projectsData.length > 0) {
        setProjects(projectsData as Project[]);
      } else {
        // Seed initial projects
        const initialProjects = [
          { id: Math.random().toString(36).substr(2, 9), name: 'Geral', description: 'Tarefas gerais sem projeto específico.', color: 'text-neutral-400', bg: 'bg-neutral-400/10' },
          { id: Math.random().toString(36).substr(2, 9), name: 'CRM Personal', description: 'Sistema de gestão para projetos e tarefas.', color: 'text-brand-red', bg: 'bg-brand-red/10' },
        ];
        const { data } = await supabase.from('projects').insert(initialProjects).select();
        if (data) setProjects(data as Project[]);
      }
    };

    fetchData();

    // Subscribe to realtime changes
    const taskSub = supabase.channel('tasks').on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchData).subscribe();
    const colSub = supabase.channel('columns').on('postgres_changes', { event: '*', schema: 'public', table: 'columns' }, fetchData).subscribe();
    const projSub = supabase.channel('projects').on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchData).subscribe();

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
    await supabase.from('projects').insert([project]);
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
    const task = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTask.title || 'Nova Tarefa',
      project: newTask.project || 'Geral',
      priority: newTask.priority || 'medium',
      dueDate: newTask.dueDate || 'Sem data',
      status: newTask.status || (columns.length > 0 ? columns[0].id : 'todo'),
      tags: newTask.tags || [],
      createdAt: Date.now(),
    };
    
    // Optimistic
    setTasks(prev => [task as Task, ...prev]);
    
    await supabase.from('tasks').insert([{
      id: task.id,
      title: task.title,
      project: task.project,
      priority: task.priority,
      due_date: task.dueDate,
      status: task.status,
      tags: task.tags,
      created_at: task.createdAt,
    }]);
  }, [columns]);

  const handleUpdateTask = useCallback(async (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    
    await supabase.from('tasks').update({
      title: updatedTask.title,
      project: updatedTask.project,
      priority: updatedTask.priority,
      due_date: updatedTask.dueDate,
      status: updatedTask.status,
      tags: updatedTask.tags,
    }).eq('id', updatedTask.id);
  }, []);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await supabase.from('tasks').delete().eq('id', taskId);
  }, []);

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
      supabase.from('columns').insert([{ ...newCol, order_index: next.length - 1 }]).then();
      return next;
    });
  }, [columns]);

  const handleDeleteColumn = useCallback(async (columnId: string) => {
    // If there is another column to fallback to
    const fallbackId = columns.find(c => c.id !== columnId)?.id || 'todo';

    setColumns(prev => prev.filter(col => col.id !== columnId));
    setTasks(prev => prev.map(t => t.status === columnId ? { ...t, status: fallbackId } : t));
    
    // Backend wait Update tasks first to avoid cascade delete issue
    await supabase.from('tasks').update({ status: fallbackId }).eq('status', columnId);
    await supabase.from('columns').delete().eq('id', columnId);
  }, [columns]);

  const handleRenameColumn = useCallback(async (columnId: string, newTitle: string) => {
    setColumns(prev => prev.map(col => col.id === columnId ? { ...col, title: newTitle } : col));
    await supabase.from('columns').update({ title: newTitle }).eq('id', columnId);
  }, []);

  const renderView = () => {
'''

new_content = content[:match.start()] + new_state_logic + content[match.end() - len('  const renderView = () => {'):]

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Successfully updated App.tsx')
