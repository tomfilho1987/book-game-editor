import { RequirementDetail } from "../../Types/Choice";

/*** NodeData é o que você passa para o 'data' de um React Flow Node */
export interface StoryNodeData {
    label: string; // Título do Capítulo
    text: string; // Texto do Capítulo
    isStartChapter?: boolean;
    incomingChoiceResources?: Record<string, RequirementDetail>;
}

/*** EdgeData é o que você passa para o 'data' de um React Flow Edge */
export interface StoryEdgeData {
    label?: string; // Texto da escolha
    probability?: number; // Probabilidade, se relevante
    requirements?: Record<string, RequirementDetail>; // Para exibir requisitos reais
    costs?: Record<string, RequirementDetail>;        // Para exibir custos
}
