import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { MentalMapNode, MentalMapEdge } from '../types';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface MentalMapCanvasProps {
  mapId: string;
  mapTitle: string;
  onBack: () => void;
}

const initialNodes: Node[] = [
  { id: 'root', position: { x: 250, y: 250 }, data: { label: 'Nova Ideia' }, type: 'input' }
];

export const MentalMapCanvas: React.FC<MentalMapCanvasProps> = ({ mapId, mapTitle, onBack }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMapData();
  }, [mapId]);

  const fetchMapData = async () => {
    setIsLoading(true);
    try {
      const { data: nodesData } = await supabase
        .from('mind_map_nodes')
        .select('*')
        .eq('map_id', mapId);
        
      const { data: edgesData } = await supabase
        .from('mind_map_edges')
        .select('*')
        .eq('map_id', mapId);

      if (nodesData && nodesData.length > 0) {
        setNodes(nodesData.map(n => ({
          id: n.id,
          position: n.position,
          data: n.data,
          type: n.type || 'default'
        })));
      } else {
        setNodes(initialNodes);
      }

      if (edgesData) {
        setEdges(edgesData.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target
        })));
      }
    } catch (error) {
      console.error('Error fetching map data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // In a robust implementation, we would diff the nodes and edges.
      // Here we will clear and insert, or upsert. Let's delete existing and insert new for simplicity,
      // as nodes/edges could have been deleted.
      
      await supabase.from('mind_map_nodes').delete().eq('map_id', mapId);
      await supabase.from('mind_map_edges').delete().eq('map_id', mapId);

      if (nodes.length > 0) {
        await supabase.from('mind_map_nodes').insert(
          nodes.map(n => ({
            id: n.id,
            map_id: mapId,
            user_id: user.id,
            data: n.data,
            position: n.position,
            type: n.type || 'default'
          }))
        );
      }

      if (edges.length > 0) {
        await supabase.from('mind_map_edges').insert(
          edges.map(e => ({
            id: e.id,
            map_id: mapId,
            user_id: user.id,
            source: e.source,
            target: e.target
          }))
        );
      }
      
      await supabase.from('mind_maps').update({ updated_at: new Date().toISOString() }).eq('id', mapId);

    } catch (error) {
      console.error('Error saving map:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onAddNode = () => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: { label: 'Novo Nó' }
    };
    setNodes(nds => [...nds, newNode]);
  };

  return (
    <div className="flex flex-col h-full bg-dark-bg text-white relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-border/50 bg-dark-card/50">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/5 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-lg font-bold">{mapTitle}</h2>
            <p className="text-xs text-neutral-400">Arraste os nós, conecte os pontos.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onAddNode}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors border border-dark-border"
          >
            Adicionar Nó
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>Salvar</span>
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 w-full relative" ref={reactFlowWrapper}>
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            className="bg-dark-bg"
            colorMode="dark"
          >
            <Background gap={12} size={1} variant={BackgroundVariant.Dots} color="#333" />
            <Controls className="bg-dark-card border-dark-border fill-white" />
            <MiniMap 
              nodeColor="#ef4444" 
              maskColor="rgba(0, 0, 0, 0.7)"
              className="bg-dark-card border border-dark-border"
            />
          </ReactFlow>
        )}
      </div>
    </div>
  );
};
