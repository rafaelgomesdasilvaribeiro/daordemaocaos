import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Folder, 
  FileText, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Archive, 
  ChevronRight, 
  ChevronDown,
  ChevronLeft,
  Bold,
  Italic,
  List,
  Type,
  CheckSquare,
  X,
  Save,
  FolderPlus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string;
  updatedAt: number;
  isArchived?: boolean;
}

interface FolderType {
  id: string;
  name: string;
  color: string;
}

export const Notes: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchNotes = async () => {
      const { data: fData } = await supabase.from('note_folders').select('*').eq('user_id', session.user.id).order('created_at', { ascending: true });
      const { data: nData } = await supabase.from('notes').select('*').eq('user_id', session.user.id).order('updated_at', { ascending: false });

      if (fData && fData.length > 0) {
        setFolders(fData as FolderType[]);
      } else {
        const initialFolders = [
          { id: Math.random().toString(36).substr(2, 9), name: 'Pessoal', color: 'text-blue-400', user_id: session.user.id },
          { id: Math.random().toString(36).substr(2, 9), name: 'Trabalho', color: 'text-brand-red', user_id: session.user.id },
          { id: Math.random().toString(36).substr(2, 9), name: 'Projetos', color: 'text-green-400', user_id: session.user.id },
        ];
        const { data } = await supabase.from('note_folders').insert(initialFolders).select();
        if (data) setFolders(data as FolderType[]);
      }

      if (nData) {
        setNotes(nData.map(n => ({
          ...n,
          folderId: n.folder_id,
          updatedAt: Number(n.updated_at),
          isArchived: n.is_archived
        })) as unknown as Note[]);
      }
    };
    fetchNotes();
  }, [session]);

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  
  const [newNoteData, setNewNoteData] = useState({ title: '', folderId: '' });
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('text-neutral-400');
  const editorRef = useRef<HTMLDivElement>(null);

  const selectedNote = useMemo(() => 
    notes.find(n => n.id === selectedNoteId), 
  [notes, selectedNoteId]);

  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const filteredNotes = useMemo(() => {
    let result = notes.filter(n => !n.isArchived);
    if (selectedFolderId) {
      result = result.filter(n => n.folderId === selectedFolderId);
    }
    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, selectedFolderId]);

  const handleCreateNote = async () => {
    if (!newNoteData.title.trim()) return;
    
    // Fallback to first folder if none selected
    const folderIdToUse = newNoteData.folderId || (folders.length > 0 ? folders[0].id : '');

    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      title: newNoteData.title,
      content: '',
      folderId: folderIdToUse,
      updatedAt: Date.now()
    };

    setNotes(prev => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
    setIsEditing(true);
    setIsNewNoteModalOpen(false);
    setNewNoteData({ title: '', folderId: folders.length > 0 ? folders[0].id : '' });
    
    await supabase.from('notes').insert([{
      id: newNote.id,
      title: newNote.title,
      content: newNote.content,
      folder_id: newNote.folderId,
      updated_at: newNote.updatedAt,
      is_archived: false,
      user_id: session.user.id
    }]);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    const newFolder: FolderType = {
      id: Math.random().toString(36).substr(2, 9),
      name: newFolderName,
      color: newFolderColor
    };

    setFolders(prev => [...prev, newFolder]);
    setIsNewFolderModalOpen(false);
    setNewFolderName('');
    setNewFolderColor('text-neutral-400');
    
    await supabase.from('note_folders').insert([{ ...newFolder, user_id: session.user.id }]);
  };

  const deleteFolder = async (id: string, name: string) => {
    if (!window.confirm(`Excluir a pasta "${name}" e TODAS as suas notas?`)) return;
    
    // Optimistic update
    setFolders(prev => prev.filter(f => f.id !== id));
    setNotes(prev => prev.filter(n => n.folderId !== id));
    if (selectedFolderId === id) setSelectedFolderId(null);
    if (selectedNote?.folderId === id) setSelectedNoteId(null);

    // DB updates
    await supabase.from('notes').delete().eq('folder_id', id);
    await supabase.from('note_folders').delete().eq('id', id);
  };

  const updateNoteContent = async (content: string) => {
    if (!selectedNoteId) return;
    const now = Date.now();
    setNotes(prev => prev.map(n => n.id === selectedNoteId ? { ...n, content, updatedAt: now } : n));
    await supabase.from('notes').update({ content, updated_at: now }).eq('id', selectedNoteId);
  };

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      updateNoteContent(editorRef.current.innerHTML);
    }
  };

  const deleteNote = async (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
    if (selectedNoteId === id) setSelectedNoteId(null);
    await supabase.from('notes').delete().eq('id', id);
  };

  const archiveNote = async (id: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, isArchived: true } : n));
    if (selectedNoteId === id) setSelectedNoteId(null);
    await supabase.from('notes').update({ is_archived: true }).eq('id', id);
  };

  useEffect(() => {
    if (isEditing && editorRef.current && selectedNote) {
      // Only set innerHTML if it's different to avoid cursor jumping
      if (editorRef.current.innerHTML !== selectedNote.content) {
        editorRef.current.innerHTML = selectedNote.content;
      }
      
      // Focus the editor and place cursor at the end
      editorRef.current.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [selectedNoteId, isEditing]);

  return (
    <div className="h-[calc(100vh-120px)] flex bg-dark-card border border-dark-border rounded-3xl overflow-hidden relative">
      {/* Sidebar: Folders */}
      <div className={cn(
        "w-64 border-r border-dark-border flex flex-col bg-dark-bg/30 transition-all duration-300",
        selectedNoteId ? "hidden lg:flex" : "flex w-full lg:w-64"
      )}>
        <div className="p-6 flex items-center justify-between">
          <h3 className="font-bold text-sm uppercase tracking-widest text-neutral-500">Pastas</h3>
          <button 
            onClick={() => setIsNewFolderModalOpen(true)}
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-white transition-all"
          >
            <FolderPlus size={18} />
          </button>
        </div>

        <div className="px-3 space-y-1 flex-1 overflow-y-auto">
          <button 
            onClick={() => setSelectedFolderId(null)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              !selectedFolderId ? "bg-brand-red/10 text-brand-red" : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white"
            )}
          >
            <Folder size={18} />
            Todas as Notas
          </button>
          
          {folders.map(folder => (
            <div key={folder.id} className="group relative">
              <button 
                onClick={() => setSelectedFolderId(folder.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  selectedFolderId === folder.id ? "bg-brand-red/10 text-brand-red" : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white"
                )}
              >
                <Folder size={18} className={cn(selectedFolderId === folder.id ? "text-brand-red" : folder.color)} />
                <span className="flex-1 text-left truncate pr-6">{folder.name}</span>
                <span className="text-[10px] font-bold opacity-50">{notes.filter(n => n.folderId === folder.id && !n.isArchived).length}</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id, folder.name); }}
                className="absolute right-8 top-1/2 -translate-y-1/2 p-1.5 text-neutral-600 hover:text-brand-red opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-brand-red/10"
                title="Excluir pasta"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-dark-border">
          <button 
            onClick={() => setIsNewNoteModalOpen(true)}
            className="w-full bg-brand-red hover:bg-brand-red-hover text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-red/20"
          >
            <Plus size={18} />
            Nova Anotação
          </button>
        </div>
      </div>

      {/* Note List */}
      <div className={cn(
        "w-80 border-r border-dark-border flex flex-col bg-dark-bg/10 transition-all duration-300",
        selectedNoteId ? "hidden lg:flex" : "flex w-full lg:w-80"
      )}>
        <div className="p-4 border-b border-dark-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" size={14} />
            <input 
              type="text" 
              placeholder="Buscar notas..." 
              className="w-full bg-dark-bg border border-dark-border rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-brand-red transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredNotes.length > 0 ? (
            filteredNotes.map(note => (
              <button 
                key={note.id}
                onClick={() => { setSelectedNoteId(note.id); setIsEditing(true); }}
                className={cn(
                  "w-full p-4 text-left border-b border-dark-border transition-all hover:bg-neutral-800/30",
                  selectedNoteId === note.id ? "bg-neutral-800/50 border-l-4 border-l-brand-red" : ""
                )}
              >
                <h4 className="font-bold text-sm text-white truncate mb-1">{note.title || 'Sem título'}</h4>
                <p className="text-xs text-neutral-500 line-clamp-2 mb-2">
                  {stripHtml(note.content) || 'Nenhum conteúdo ainda...'}
                </p>
                <span className="text-[10px] font-bold text-neutral-600 uppercase">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </span>
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-700 space-y-2">
              <FileText size={32} strokeWidth={1} />
              <p className="text-xs italic">Nenhuma nota encontrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-dark-bg/5 transition-all duration-300",
        selectedNoteId ? "flex" : "hidden lg:flex"
      )}>
        {selectedNote ? (
          <>
            <div className="p-4 border-b border-dark-border flex items-center justify-between bg-dark-card/50">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedNoteId(null)}
                  className="lg:hidden p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <h3 className="font-bold text-lg text-white truncate max-w-[150px] sm:max-w-none">{selectedNote.title}</h3>
                <div className="flex items-center gap-1">
                  <button 
                    onMouseDown={(e) => { e.preventDefault(); applyFormat('bold'); }}
                    className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
                    title="Negrito"
                  >
                    <Bold size={16} />
                  </button>
                  <button 
                    onMouseDown={(e) => { e.preventDefault(); applyFormat('italic'); }}
                    className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
                    title="Itálico"
                  >
                    <Italic size={16} />
                  </button>
                  <button 
                    onMouseDown={(e) => { e.preventDefault(); applyFormat('insertUnorderedList'); }}
                    className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
                    title="Lista"
                  >
                    <List size={16} />
                  </button>
                  <button 
                    onMouseDown={(e) => { e.preventDefault(); applyFormat('insertHTML', '<input type="checkbox" />&nbsp;'); }}
                    className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
                    title="Checklist"
                  >
                    <CheckSquare size={16} />
                  </button>
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
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => deleteNote(selectedNote.id)}
                  className="p-2 text-neutral-500 hover:text-brand-red hover:bg-brand-red/10 rounded-lg transition-all"
                  title="Excluir"
                >
                  <Trash2 size={18} />
                </button>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className={cn(
                    "px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all",
                    isEditing ? "bg-green-500 text-white" : "bg-neutral-800 text-neutral-300 hover:text-white"
                  )}
                >
                  {isEditing ? <><Save size={16} /> Salvar</> : <><Edit2 size={16} /> Editar</>}
                </button>
              </div>
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
              {isEditing ? (
                <div 
                  ref={editorRef}
                  contentEditable
                  onInput={(e) => updateNoteContent(e.currentTarget.innerHTML)}
                  className="w-full h-full bg-transparent text-neutral-200 text-lg leading-relaxed focus:outline-none min-h-[200px] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
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
                    dangerouslySetInnerHTML={{ __html: selectedNote.content || 'Esta nota está vazia. Clique em editar para começar a escrever.' }}
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-700 space-y-4">
            <div className="w-20 h-20 rounded-full bg-neutral-900 flex items-center justify-center">
              <FileText size={40} strokeWidth={1} />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg text-neutral-500">Selecione uma nota</h3>
              <p className="text-sm italic">Escolha uma nota na lista ao lado ou crie uma nova.</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isNewNoteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-dark-border flex justify-between items-center">
                <h3 className="text-xl font-bold">Nova Anotação</h3>
                <button onClick={() => setIsNewNoteModalOpen(false)} className="text-neutral-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Título</label>
                  <input 
                    type="text" 
                    value={newNoteData.title}
                    onChange={(e) => setNewNoteData({ ...newNoteData, title: e.target.value })}
                    placeholder="Título da nota"
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 focus:outline-none focus:border-brand-red transition-colors"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Pasta</label>
                  <select 
                    value={newNoteData.folderId}
                    onChange={(e) => setNewNoteData({ ...newNoteData, folderId: e.target.value })}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 focus:outline-none focus:border-brand-red transition-colors appearance-none"
                  >
                    <option value="">Selecione uma pasta...</option>
                    {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="p-6 bg-dark-bg/50 border-t border-dark-border flex gap-3">
                <button onClick={() => setIsNewNoteModalOpen(false)} className="flex-1 py-3 bg-dark-card border border-dark-border rounded-xl font-bold text-neutral-400 hover:text-white transition-all">Cancelar</button>
                <button onClick={handleCreateNote} className="flex-1 py-3 bg-brand-red hover:bg-brand-red-hover text-white rounded-xl font-bold transition-all">Criar Nota</button>
              </div>
            </motion.div>
          </div>
        )}

        {isNewFolderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-dark-border flex justify-between items-center">
                <h3 className="text-xl font-bold">Nova Pasta</h3>
                <button onClick={() => setIsNewFolderModalOpen(false)} className="text-neutral-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Nome da Pasta</label>
                  <input 
                    type="text" 
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Ex: Estudos, Finanças..."
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 focus:outline-none focus:border-brand-red transition-colors"
                    autoFocus
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Escolha uma Cor</label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { name: 'Azul', class: 'text-blue-400', bg: 'bg-blue-400' },
                      { name: 'Vermelho', class: 'text-brand-red', bg: 'bg-brand-red' },
                      { name: 'Verde', class: 'text-green-400', bg: 'bg-green-400' },
                      { name: 'Roxo', class: 'text-purple-400', bg: 'bg-purple-400' },
                      { name: 'Amarelo', class: 'text-yellow-400', bg: 'bg-yellow-400' },
                      { name: 'Cinza', class: 'text-neutral-400', bg: 'bg-neutral-400' },
                    ].map((color) => (
                      <button
                        key={color.class}
                        onClick={() => setNewFolderColor(color.class)}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all flex items-center justify-center",
                          color.bg,
                          newFolderColor === color.class ? "ring-2 ring-white ring-offset-2 ring-offset-dark-card scale-110" : "opacity-60 hover:opacity-100"
                        )}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 bg-dark-bg/50 border-t border-dark-border flex gap-3">
                <button onClick={() => setIsNewFolderModalOpen(false)} className="flex-1 py-3 bg-dark-card border border-dark-border rounded-xl font-bold text-neutral-400 hover:text-white transition-all">Cancelar</button>
                <button onClick={handleCreateFolder} className="flex-1 py-3 bg-brand-red hover:bg-brand-red-hover text-white rounded-xl font-bold transition-all">Criar Pasta</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
