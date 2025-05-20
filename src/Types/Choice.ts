/**
 * @interface Choice
 * @description Define a estrutura de uma escolha em um capítulo.
 */
type RequirementDetail = {
  key: string;
  value: number | string;
  isCost: boolean;
  isHidden: boolean;
};

export type Choice = {
  /**  Adicione o campo id */
  id: string; 
  /** O ID do capítulo de destino da escolha. */
  targets: { targetId: number; probability: number }[]; // Array de objetos com ID e probabilidade
  /** O texto da escolha. */
  text: string;
  /** Requisitos ou custos associados à escolha. */
  requirement?: Record<string, RequirementDetail>;
  /** Um booleano opcional que indica se o Accordion da escolha está expandido (true) ou recolhido (false) */
  expanded?: boolean;
  /** Nome da Escolha */
  name?: string;
};