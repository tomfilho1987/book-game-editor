// src/components/StoryMindMap.tsx
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
import { v4 as uuidv4 } from 'uuid'; // Para gerar IDs únicos

import CustomChapterNode from './CustomChapterNode';
import { Chapter } from '../../Types/Chapter';
import { RequirementDetail } from '../../Types/Choice';
import { StoryEdgeData, StoryNodeData } from '../../Interfaces/MindInterface/map';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

// Volte para tamanhos mais moderados
const nodeWidth = 250;
const nodeHeight = 120;

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: 150,   // Espaçamento vertical entre os níveis
    nodesep: 80     // Espaçamento horizontal entre os nós
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
}

const StoryMindMap: React.FC<StoryMindMapProps> = ({ chapters }) => {

    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
        const nodes: any[] = [];
        const edges: any[] = [];
        const addedNodes = new Set<number>();
        // Map para coletar recursos de entrada para cada ID de capítulo de destino
        const incomingResourcesMap = new Map<number, Record<string, RequirementDetail>>();

        chapters.forEach(chapter => {
            // Inicializar nó para o capítulo (se ainda não adicionado)
            if (!addedNodes.has(chapter.id)) {
                nodes.push({
                    id: String(chapter.id),
                    data: {
                        label: chapter.title,
                        isStartChapter: chapter.isStartChapter,
                        // 'incomingChoiceResources' será preenchido na segunda passagem
                    } as StoryNodeData,
                    position: { x: 0, y: 0 },
                    type: 'customNode',
                });
                addedNodes.add(chapter.id);
            }

            // Processar escolhas para popular arestas e COLETAR recursos de entrada
            chapter.choices.forEach(choice => {
                choice.targets.forEach(target => {
                    const targetChapterId = target.targetId;

                    // Garantir que o nó de destino exista (se ainda não adicionado)
                    if (!addedNodes.has(targetChapterId)) {
                        const targetChapter = chapters.find(c => c.id === targetChapterId);
                        const targetLabel = targetChapter ? targetChapter.title : `Cap ${targetChapterId}`;
                        nodes.push({
                            id: String(targetChapterId),
                            data: { label: targetLabel } as StoryNodeData,
                            position: { x: 0, y: 0 },
                            type: 'customNode',
                        });
                        addedNodes.add(targetChapterId);
                    }

                    // --- COLETAR requisitos e custos da escolha atual para o capítulo de destino ---
                    if (choice.requirement) { // choice.requirement já contém reqs e custos
                        const existingResources = incomingResourcesMap.get(targetChapterId) || {};
                        Object.values(choice.requirement).forEach(detail => {
                            // Usar key + isCost como uma chave única para evitar duplicatas de recursos
                            // (e.g., se duas escolhas diferentes adicionam 'moeda', queremos apenas uma entrada 'moeda')
                            const uniqueKey = `${detail.key}-${detail.isCost ? 'cost' : 'req'}`;
                            existingResources[uniqueKey] = { // Substitui se já existir, agregando
                                id: uuidv4(), // Novo ID para a entrada agregada
                                key: detail.key,
                                value: detail.value,
                                isCost: detail.isCost,
                                isHidden: detail.isHidden,
                            };
                        });
                        incomingResourcesMap.set(targetChapterId, existingResources);
                    }
                    // --- Fim da Coleta ---

                    // *** Lógica para arestas (mantém limpo, sem info de recursos no label) ***
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

                    // Arestas ainda podem ter estilo baseado na presença de recursos
                    if (Object.keys(currentRequirementsForEdgeData).length > 0 || Object.keys(currentCostsForEdgeData).length > 0) {
                        edgeStrokeColor = edgeStrokeColor === '#999' ? '#555' : edgeStrokeColor;
                        strokeWidth = Math.max(strokeWidth, 2);
                    }

                    edges.push({
                        id: `e${chapter.id}-${targetChapterId}-${choice.id}`,
                        source: String(chapter.id),
                        target: String(targetChapterId),
                        label: finalEdgeLabel,
                        type: 'smoothstep',
                        markerEnd: { type: MarkerType.ArrowClosed },
                        style: { stroke: edgeStrokeColor, strokeWidth: strokeWidth },
                        data: {
                            label: choice.text,
                            probability: target.probability,
                            // Mantenha para tooltips ou inspeção da aresta, se necessário
                            requirements: Object.keys(currentRequirementsForEdgeData).length > 0 ? currentRequirementsForEdgeData : undefined,
                            costs: Object.keys(currentCostsForEdgeData).length > 0 ? currentCostsForEdgeData : undefined,
                        } as StoryEdgeData,
                    });
                });
            });
        });

        // --- PASSO FINAL: Atualizar nós com recursos de entrada agregados ---
        nodes.forEach(node => {
            const chapterId = Number(node.id); // Converter ID do nó de volta para número
            if (incomingResourcesMap.has(chapterId)) {
                node.data.incomingChoiceResources = incomingResourcesMap.get(chapterId);
            }
        });
        // --- Fim do Passo Final ---

        return getLayoutedElements(nodes, edges);

    }, [chapters]); // Dependência em chapters

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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