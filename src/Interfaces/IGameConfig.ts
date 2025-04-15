/**
 * @interface IGameConfig
 * @description Define a estrutura da configuração do jogo.
 */
export interface IGameConfig {
    /** Recursos padrão do jogo. */
    default_resources: Record<string, string>;
    /** Condições do jogo. */
    conditions: Record<string, ICondition>;
}

export interface ICondition {
    min: string;
    trigger: string;
  }