/**
 * @interface IResource
 * @description Define a estrutura de um recurso individual.
 */
export interface IResource {
    key: string;
    value: string | number; // Definimos como 'string | number' para maior flexibilidade
    isHidden?: boolean; // Propriedade para o checkbox 'Oculto?'
}

/**
 * @interface IGameConfig
 * @description Define a estrutura da configuração do jogo.
 */
export interface IGameConfig {
    /** Recursos padrão do jogo. */
    default_resources: IResource[]; // Agora usa a interface IResource
    /** Condições do jogo. */
    conditions: Record<string, ICondition>;
}

export interface ICondition {
    key: string; // Tornei 'key' obrigatório, pois é usado para indexar as condições
    min: string;
    trigger: string;
}