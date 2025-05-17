/**
 * @interface IGameConfig
 * @description Define a estrutura da configuração do jogo.
 */
export interface IGameConfig {
    /** Recursos padrão do jogo. */
    default_resources: { key?: string; value?: string }[];
    /** Condições do jogo. */
    conditions: Record<string, ICondition>;
}

export interface ICondition {
    key?: string;
    min: string;
    trigger: string;
}