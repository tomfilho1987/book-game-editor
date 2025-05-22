/**
 * @type Choice
 * @description Define a estrutura de uma escolha feita pelo jogador.
 *              Cada escolha pode levar a múltiplos destinos com diferentes probabilidades
 *              e exigir ou consumir recursos.
 */
export type Choice = {
  /** ID único da escolha (usado internamente, ex: uuid) */
  id: string; 
   /** Destinos possíveis para esta escolha, com chance associada */
  targets: { targetId: number; probability: number }[]; // Array de objetos com ID e probabilidade
   /** Texto mostrado ao jogador */
  text: string;
  /** Requisitos ou custos necessários para que a escolha esteja disponível */
  requirement?: Record<string, RequirementDetail>;
  /** Define se o Accordion da escolha está expandido na UI */
  expanded?: boolean;
  /** Nome interno da escolha (não exibido ao jogador) */
  name?: string;
};

/**
 * @type RequirementDetail
 * @description Representa um requisito ou custo associado a uma escolha.
 *              Pode ser visível ou oculto, e consumido ou apenas exigido.
 */
export type RequirementDetail = {
  /** Chave (nome do recurso ou variável) */
  key: string;
  /** Valor exigido ou a ser consumido */
  value: number | string;
  /** Indica se é um custo (será subtraído) ou apenas um requisito (comparação) */
  isCost: boolean;
  /** Indica se o recurso é oculto do jogador */
  isHidden: boolean;
  /** ID único para identificação interna (gerado via uuid) */
  id?: string;
};