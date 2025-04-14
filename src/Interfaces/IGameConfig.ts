/**
 * @interface IGameConfig
 * @description Define a estrutura da configuração do jogo.
 */
export interface IGameConfig {
    /** Recursos padrão do jogo. */
    default_resources: Record<string, number>;
    /** Condições do jogo. */
    conditions: Record<string, ICondition>;
}

export interface ICondition {
    min: number;
    trigger: string;
  }