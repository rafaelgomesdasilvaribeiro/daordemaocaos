import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  ExternalLink, 
  Book, 
  Video, 
  FileText, 
  Bookmark, 
  X, 
  Upload, 
  Trash2, 
  User,
  Image as ImageIcon,
  Bold,
  Italic,
  List,
  Type,
  CheckSquare,
  Save,
  Edit2,
  ChevronLeft
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface Source {
  id: string;
  title: string;
  author: string;
  type: 'book' | 'course' | 'video';
  image?: string;
  tags: string[];
  content?: string;
}

export const KnowledgeBase: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [sources, setSources] = useState<Source[]>([]);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchSources = async () => {
      const { data } = await supabase.from('knowledge_sources').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
      if (data && data.length > 0) {
        setSources(data as unknown as Source[]);
      } else {
        const initial = [
          { id: Math.random().toString(36).substr(2, 9), title: 'Clean Code', author: 'Robert C. Martin', type: 'book', tags: ['Engenharia'], image: 'https://picsum.photos/seed/book1/400/600', content: 'Um clássico sobre como escrever código limpo e sustentável.', user_id: session.user.id },
          { id: Math.random().toString(36).substr(2, 9), title: 'React Masterclass', author: 'Maximilian Schwarzmüller', type: 'course', tags: ['Frontend'], image: 'https://picsum.photos/seed/course1/400/600', content: 'Curso completo de React do zero ao avançado.', user_id: session.user.id },
          { id: Math.random().toString(36).substr(2, 9), title: 'Arquitetura de Software', author: 'Filipe Deschamps', type: 'video', tags: ['Arquitetura'], image: 'https://picsum.photos/seed/video1/400/600', content: 'Vídeo sobre os fundamentos de arquitetura de software.', user_id: session.user.id },
        ];
        const { data: inserted } = await supabase.from('knowledge_sources').insert(initial).select();
        if (inserted) {
          setSources(inserted as unknown as Source[]);
        }
      }
    };
    fetchSources();
  }, [session]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  const selectedSource = useMemo(() => 
    sources.find(s => s.id === selectedSourceId),
  [sources, selectedSourceId]);

  // Sync editor content when selecting a source
  useEffect(() => {
    if (selectedSourceId && selectedSource) {
      setEditorContent(selectedSource.content || '');
    } else {
      setEditorContent('');
    }
  }, [selectedSourceId, selectedSource]);

  const [newSource, setNewSource] = useState<Partial<Source>>({
    type: 'book',
    title: '',
    author: '',
    tags: [],
    content: ''
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleAddSource = async () => {
    if (!newSource.title || !newSource.author) return;

    const source: Source = {
      id: Math.random().toString(36).substr(2, 9),
      title: newSource.title,
      author: newSource.author,
      type: newSource.type as any,
      image: imagePreview || undefined,
      tags: newSource.tags || [],
      content: ''
    };

    setSources(prev => [source, ...prev]);
    setIsModalOpen(false);
    setNewSource({ type: 'book', title: '', author: '', tags: [] });
    setImagePreview(null);
    
    await supabase.from('knowledge_sources').insert([{ ...source, user_id: session.user.id }]);
  };

  const updateSourceContent = async (content: string, id: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, content } : s));
    await supabase.from('knowledge_sources').update({ content }).eq('id', id);
  };

  const saveCurrentWork = () => {
    if (selectedSourceId && editorRef.current) {
      updateSourceContent(editorRef.current.innerHTML, selectedSourceId);
    }
  };

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current && selectedSourceId) {
      const newContent = editorRef.current.innerHTML;
      setEditorContent(newContent);
      updateSourceContent(newContent, selectedSourceId);
    }
  };

  useEffect(() => {
    if (isEditing && editorRef.current && selectedSource) {
      const content = selectedSource.content || '';
      if (editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content;
      }
      
      editorRef.current.focus();
      // Move cursor to end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [selectedSourceId, isEditing]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteSource = async (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
    await supabase.from('knowledge_sources').delete().eq('id', id);
  };

  const columns = [
    { id: 'book', title: 'Livros', icon: <Book size={18} className="text-blue-400" /> },
    { id: 'course', title: 'Cursos', icon: <FileText size={18} className="text-green-400" /> },
    { id: 'video', title: 'Vídeos', icon: <Video size={18} className="text-brand-red" /> },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fontes de Conhecimento</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 mt-1">Sua biblioteca pessoal de referências e aprendizado</p>
        </div>
        <div className="flex gap-3">
          {selectedSourceId && (
            <button 
              onClick={() => { 
                saveCurrentWork();
                setSelectedSourceId(null); 
                setIsEditing(false); 
              }}
              className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-[10px] uppercase tracking-widest"
            >
              <ChevronLeft size={16} />
              Voltar
            </button>
          )}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-red hover:bg-brand-red-hover text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-red/20 text-[10px] uppercase tracking-widest"
          >
            <Plus size={16} />
            Adicionar Fonte
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {!selectedSourceId ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {columns.map(column => (
              <div key={column.id} className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white/5 rounded-lg">
                      {column.icon}
                    </div>
                    <h3 className="font-bold text-lg">{column.title}</h3>
                  </div>
                  <span className="text-xs font-bold text-neutral-600 bg-neutral-800 px-2 py-1 rounded-full">
                    {sources.filter(s => s.type === column.id).length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[500px] bg-dark-card/30 border border-dark-border/50 rounded-2xl p-4">
                  {sources.filter(s => s.type === column.id).map(source => (
                    <motion.div 
                      key={source.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => { setSelectedSourceId(source.id); setIsEditing(false); }}
                      className="bg-dark-card border border-dark-border rounded-xl overflow-hidden group hover:border-neutral-700 transition-all flex items-center p-3 gap-4 cursor-pointer"
                    >
                      <div className="w-16 h-20 shrink-0 relative overflow-hidden bg-neutral-900 rounded-lg">
                        {source.image ? (
                          <img 
                            src={source.image} 
                            alt={source.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-800">
                            <ImageIcon size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="font-bold text-sm text-white truncate">{source.title}</h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                          <User size={10} />
                          <span className="truncate">{source.author}</span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteSource(source.id); }}
                        className="p-2 text-neutral-600 hover:text-brand-red transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                  {sources.filter(s => s.type === column.id).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-neutral-700 space-y-2">
                      <Bookmark size={32} strokeWidth={1} />
                      <p className="text-xs italic">Nenhuma fonte cadastrada</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="editor"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-dark-card border border-dark-border rounded-3xl overflow-hidden flex flex-col h-[600px]"
          >
            <div className="p-6 border-b border-dark-border flex items-center justify-between bg-dark-card/50">
              <div className="flex items-center gap-6">
                <div className="w-16 h-20 shrink-0 relative overflow-hidden bg-neutral-900 rounded-lg border border-dark-border">
                  {selectedSource?.image ? (
                    <img src={selectedSource.image} alt={selectedSource.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-800">
                      <ImageIcon size={24} />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-xl text-white">{selectedSource?.title}</h3>
                  <p className="text-sm text-neutral-500 flex items-center gap-2">
                    <User size={14} />
                    {selectedSource?.author}
                  </p>
                </div>
                <div className="h-10 w-px bg-dark-border mx-2 hidden md:block" />
                <div className="hidden md:flex items-center gap-1">
                  <button onMouseDown={(e) => { e.preventDefault(); applyFormat('bold'); }} className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-all" title="Negrito"><Bold size={16} /></button>
                  <button onMouseDown={(e) => { e.preventDefault(); applyFormat('italic'); }} className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-all" title="Itálico"><Italic size={16} /></button>
                  <button onMouseDown={(e) => { e.preventDefault(); applyFormat('insertUnorderedList'); }} className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-all" title="Lista"><List size={16} /></button>
                  <button onMouseDown={(e) => { e.preventDefault(); applyFormat('insertHTML', '<input type="checkbox" />&nbsp;'); }} className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-all" title="Checklist"><CheckSquare size={16} /></button>
                  <button 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const size = prompt('Tamanho da fonte (1-7):', '3');
                      if (size) applyFormat('fontSize', size);
                    }}
                    className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
                    title="Tamanho da Fonte"
                  >
                    <Type size={16} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    if (isEditing && selectedSourceId) {
                      saveCurrentWork();
                      setIsEditing(false);
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  className={cn(
                    "px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all",
                    isEditing ? "bg-green-500 text-white" : "bg-neutral-800 text-neutral-300 hover:text-white"
                  )}
                >
                  {isEditing ? <><Save size={16} /> Salvar</> : <><Edit2 size={16} /> Editar</>}
                </button>
              </div>
            </div>

            <div className="flex-1 p-8 overflow-y-auto bg-dark-bg/5">
              {isEditing ? (
                <div 
                  ref={editorRef}
                  contentEditable
                  onInput={(e) => {
                    const newContent = e.currentTarget.innerHTML;
                    setEditorContent(newContent);
                    if (selectedSourceId) {
                      updateSourceContent(newContent, selectedSourceId);
                    }
                  }}
                  className="w-full h-full bg-transparent text-neutral-200 text-lg leading-relaxed focus:outline-none min-h-[300px] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      document.execCommand('insertHTML', false, '&#009');
                    }
                  }}
                />
              ) : (
                <div className="prose prose-invert max-w-none">
                  <div 
                    className="text-neutral-300 text-lg leading-relaxed whitespace-pre-wrap [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                    dangerouslySetInnerHTML={{ __html: selectedSource?.content || 'Nenhuma anotação sobre esta fonte ainda. Clique em editar para começar a escrever.' }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Source Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-dark-border flex justify-between items-center">
                <h3 className="text-xl font-bold">Adicionar Nova Fonte</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Tipo</label>
                  <div className="grid grid-cols-3 gap-2">
                    {columns.map(col => (
                      <button 
                        key={col.id}
                        onClick={() => setNewSource({ ...newSource, type: col.id as any })}
                        className={cn(
                          "py-2 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1",
                          newSource.type === col.id ? "bg-brand-red/10 border-brand-red text-brand-red" : "bg-dark-bg border-dark-border text-neutral-500 hover:text-white"
                        )}
                      >
                        {col.icon}
                        {col.title.slice(0, -1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Título</label>
                  <input 
                    type="text" 
                    value={newSource.title}
                    onChange={(e) => setNewSource({ ...newSource, title: e.target.value })}
                    placeholder="Nome do livro, curso ou vídeo"
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white [.light_&]:text-neutral-900 placeholder:text-neutral-600 focus:outline-none focus:border-brand-red transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Autor / Instrutor</label>
                  <input 
                    type="text" 
                    value={newSource.author}
                    onChange={(e) => setNewSource({ ...newSource, author: e.target.value })}
                    placeholder="Quem criou este conteúdo?"
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white [.light_&]:text-neutral-900 placeholder:text-neutral-600 focus:outline-none focus:border-brand-red transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Capa (Opcional)</label>
                  <div className="flex gap-4 items-center">
                    <div className="w-20 h-28 bg-dark-bg border border-dark-border rounded-xl flex items-center justify-center overflow-hidden">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={24} className="text-neutral-800" />
                      )}
                    </div>
                    <label className="flex-1 cursor-pointer">
                      <div className="w-full py-4 border-2 border-dashed border-dark-border rounded-xl flex flex-col items-center justify-center gap-1 text-neutral-500 hover:bg-neutral-800/50 transition-all">
                        <Upload size={20} />
                        <span className="text-[10px] font-bold uppercase">Carregar Imagem</span>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-dark-bg/50 border-t border-dark-border flex gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-dark-card border border-dark-border rounded-xl font-bold text-neutral-400 hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddSource}
                  className="flex-1 py-3 bg-brand-red hover:bg-brand-red-hover text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-red/20"
                >
                  Adicionar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
