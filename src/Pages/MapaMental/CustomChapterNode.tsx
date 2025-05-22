// src/components/CustomChapterNode.tsx
import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { StoryNodeData } from '../../Interfaces/MindInterface/map';
import { RequirementDetail } from '../../Types/Choice';

const CustomChapterNode: React.FC<NodeProps<StoryNodeData>> = ({ data }) => {
    const nodeStyle: React.CSSProperties = {
        padding: '10px 15px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        backgroundColor: data.isStartChapter ? '#dcfce7' : '#fff', // Verde para o início, branco para os outros
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        minWidth: '250px', // Volta a um tamanho mais padrão
        minHeight: '120px', // Volta a um tamanho mais padrão
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center', // Centralizar conteúdo verticalmente
        alignItems: 'center', // Centralizar conteúdo horizontalmente
        textAlign: 'center', // Alinhar texto ao centro
        color: '#333',
        fontWeight: 'bold',
        fontSize: '1em',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'auto', // Manter se houver muitos recursos agregados
    };

    // Separar recursos de entrada em requisitos e custos para exibição
    const displayRequirements: Record<string, RequirementDetail> = {};
    const displayCosts: Record<string, RequirementDetail> = {};

    if (data.incomingChoiceResources) {
        Object.values(data.incomingChoiceResources).forEach(detail => {
            if (detail.isCost) {
                displayCosts[detail.key] = detail;
            } else {
                displayRequirements[detail.key] = detail;
            }
        });
    }

    const hasResourcesToDisplay = Object.keys(displayRequirements).length > 0 || Object.keys(displayCosts).length > 0;

    return (
        <div style={nodeStyle}>
            <Handle type="target" position={Position.Top} />

            {/* Título do Capítulo */}
            <div style={{ marginBottom: hasResourcesToDisplay ? '8px' : '0' }}>
                {data.label}
            </div>

            {/* Requisitos e Custos Agregados de Escolhas de Entrada */}
            {hasResourcesToDisplay && (
                <div style={{
                    fontSize: '0.8em',
                    color: '#666',
                    borderTop: '1px solid #eee',
                    paddingTop: '5px',
                    marginTop: '5px',
                    width: '100%',
                    wordBreak: 'break-word'
                }}>
                    {/* Requisitos */}
                    {Object.keys(displayRequirements).length > 0 && (
                        <div style={{ marginBottom: Object.keys(displayCosts).length > 0 ? '5px' : '0' }}>
                            <strong style={{ display: 'block', marginBottom: '3px' }}>Requisitos:</strong>
                            {Object.values(displayRequirements).map(detail => (
                                <div key={detail.id} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontWeight: 'normal' }}>
                                        {detail.isHidden ? '#' : ''}{detail.key}: {detail.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Custos */}
                    {Object.keys(displayCosts).length > 0 && (
                        <div>
                            <strong style={{ display: 'block', marginBottom: '3px' }}>Custos:</strong>
                            {Object.values(displayCosts).map(detail => (
                                <div key={detail.id} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontWeight: 'normal' }}>
                                        {/* Custos geralmente subtraem, mostrar com '-' */}
                                        {detail.isHidden ? '#' : ''}{detail.key}: -{detail.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

export default CustomChapterNode;