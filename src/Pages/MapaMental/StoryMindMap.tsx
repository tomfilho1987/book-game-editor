/**
 * @file StoryMindMap.tsx
 * @description Componente responsável por exibir o mapa mental da história.
 * @author Airton Filho
 * @date [Data de Criação]
 * @version 1.0
 */

import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  MarkerType,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import dagre from 'dagre';
import { v4 as uuidv4 } from 'uuid';

import CustomChapterNode from './CustomChapterNode';
import { Chapter, OnStartItem } from '../../Types/Chapter'; // Importe OnStartItem
import { RequirementDetail } from '../../Types/Choice';
import { StoryEdgeData, StoryNodeData } from '../../Interfaces/MindInterface/map';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 250;
const nodeHeight = 120;

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: 150,
    nodesep: 80
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? 'left' : 'top';
    node.sourcePosition = isHorizontal ? 'right' : 'bottom';

    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes, edges };
};

interface StoryMindMapProps {
  chapters: Chapter[];
  // Adicione esta prop para permitir a seleção de nós, se você ainda não o fez no BookEditor
  onNodeClick?: (chapterId: string | number) => void;
}

const StoryMindMap: React.FC<StoryMindMapProps> = ({ chapters, onNodeClick }) => {

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: any[] = [];
    const edges: any[] = [];
    const addedNodes = new Set<string>(); // Mude para Set<string> para IDs
    const incomingResourcesMap = new Map<string, Record<string, RequirementDetail>>(); // Mude para Map<string, ...>

    chapters.forEach(chapter => {
      // Garante que o ID do capítulo seja uma string para o nó
      const chapterNodeId = String(chapter.id);

      // Inicializar nó para o capítulo (se ainda não adicionado)
      if (!addedNodes.has(chapterNodeId)) {
        nodes.push({
          id: chapterNodeId,
          data: {
            label: chapter.title,
            text: chapter.text, // <--- ADICIONADO: Texto do capítulo
            image: chapter.image, // <--- ADICIONADO: Nome da imagem
            isStartChapter: chapter.isStartChapter,
            processedOnStartResources: chapter.on_start as OnStartItem[], // <--- ADICIONADO: Recursos on_start
          } as StoryNodeData,
          position: { x: 0, y: 0 },
          type: 'customNode',
        });
        addedNodes.add(chapterNodeId);
      }

      // Processar escolhas para popular arestas e COLETAR recursos de entrada
      chapter.choices.forEach(choice => {
        choice.targets.forEach(target => {
          const targetChapterId = String(target.targetId); // Converter ID de destino para string

          // Garantir que o nó de destino exista (se ainda não adicionado)
          if (!addedNodes.has(targetChapterId)) {
            const targetChapter = chapters.find(c => String(c.id) === targetChapterId);
            const targetLabel = targetChapter ? targetChapter.title : `Cap ${targetChapterId}`;

            nodes.push({
              id: targetChapterId,
              data: {
                label: targetLabel,
                text: targetChapter ? targetChapter.text : '', // <--- ADICIONADO: Texto do capítulo de destino
                image: targetChapter ? targetChapter.image : undefined, // <--- ADICIONADO: Imagem do capítulo de destino
                isStartChapter: targetChapter?.isStartChapter || false,
                processedOnStartResources: targetChapter?.on_start as OnStartItem[], // <--- ADICIONADO: Recursos on_start do capítulo de destino
              } as StoryNodeData,
              position: { x: 0, y: 0 },
              type: 'customNode',
            });
            addedNodes.add(targetChapterId);
          }

          if (choice.requirement) {
            const existingResources = incomingResourcesMap.get(targetChapterId) || {};
            Object.values(choice.requirement).forEach(detail => {
              const uniqueKey = `${detail.key}-${detail.isCost ? 'cost' : 'req'}`;
              existingResources[uniqueKey] = {
                id: uuidv4(),
                key: detail.key,
                value: detail.value,
                isCost: detail.isCost,
                isHidden: detail.isHidden,
              };
            });
            incomingResourcesMap.set(targetChapterId, existingResources);
          }

          const currentRequirementsForEdgeData: Record<string, RequirementDetail> = {};
          const currentCostsForEdgeData: Record<string, RequirementDetail> = {};
          if (choice.requirement) {
            Object.entries(choice.requirement).forEach(([_id, detail]) => {
              if (detail.isCost) {
                currentCostsForEdgeData[detail.key] = detail;
              } else {
                currentRequirementsForEdgeData[detail.key] = detail;
              }
            });
          }

          let edgeLabelParts: string[] = [choice.text];
          if (target.probability !== undefined && target.probability !== 100) {
            edgeLabelParts.push(`(${target.probability}%)`);
          }
          const finalEdgeLabel = edgeLabelParts.join(' ');

          let edgeStrokeColor = '#999';
          let strokeWidth = 1;

          if (target.probability !== undefined) {
            if (target.probability >= 70) {
              edgeStrokeColor = '#22c55e';
            } else if (target.probability >= 30) {
              edgeStrokeColor = '#facc15';
            } else {
              edgeStrokeColor = '#ef4444';
            }
            strokeWidth = (target.probability / 30) + 1;
          }

          if (Object.keys(currentRequirementsForEdgeData).length > 0 || Object.keys(currentCostsForEdgeData).length > 0) {
            edgeStrokeColor = edgeStrokeColor === '#999' ? '#555' : edgeStrokeColor;
            strokeWidth = Math.max(strokeWidth, 2);
          }

          edges.push({
            id: `e${chapterNodeId}-${targetChapterId}-${choice.id}`,
            source: chapterNodeId,
            target: targetChapterId,
            label: finalEdgeLabel,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: edgeStrokeColor, strokeWidth: strokeWidth },
            data: {
              label: choice.text,
              probability: target.probability,
              requirements: Object.keys(currentRequirementsForEdgeData).length > 0 ? currentRequirementsForEdgeData : undefined,
              costs: Object.keys(currentCostsForEdgeData).length > 0 ? currentCostsForEdgeData : undefined,
            } as StoryEdgeData,
          });
        });
      });
    });

    // Passo Final: Atualizar nós com recursos de entrada agregados
    nodes.forEach(node => {
      const chapterId = node.id; // ID já é string aqui
      if (incomingResourcesMap.has(chapterId)) {
        node.data.incomingChoiceResources = incomingResourcesMap.get(chapterId);
      }
    });

    return getLayoutedElements(nodes, edges);

  }, [chapters]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Adicionar o onNodeClick para interação
  const onNodeClickCallback = useCallback((event: React.MouseEvent, node: any) => {
    if (onNodeClick) {
      onNodeClick(node.id); // Passa o ID do capítulo clicado
    }
  }, [onNodeClick]);

  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const nodeTypes = useMemo(() => ({
    customNode: CustomChapterNode,
  }), []);


  return (
    <div style={{ width: '100%', height: '700px', border: '1px solid #ccc' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClickCallback} // <--- ADICIONADO: Prop para lidar com o clique no nó
        fitView
        attributionPosition="bottom-left"
        nodeTypes={nodeTypes}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default StoryMindMap;