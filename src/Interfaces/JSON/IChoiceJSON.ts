/**
 * @interface IChoiceJSON
 * @description Define a estrutura 'Choice' do json a ser carregado
 */
export interface IChoiceJSON {
    targets?: (number | { targetId: number; probability: number })[];
    text: string;
    requirement?: Record<string, number | string>; // Seu formato atual
    cost?: Record<string, number | string>; // A propriedade 'cost' no JSON
}

// Exemplo de RequirementDetail (como você está construindo no código)
export interface RequirementDetail {
    key: string;
    value: number | string;
    isCost: boolean; // Para diferenciar custo de requisito
    isHidden: boolean; // Se você tiver essa lógica no front-end
    id: string; // uuidv4 gerado
}